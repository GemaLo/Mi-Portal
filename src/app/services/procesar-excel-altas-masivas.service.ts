import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { environment } from '../../environments/environtments';

export interface LoteProcesamiento {
  inicio: number;
  limite: number;
  datos: any[];
  siguienteFila: number;
}

export interface ResultadoProcesamiento {
  exito: boolean;
  mensaje: string;
  datos: any[];
  totalRegistros: number;
  tiempoEjecucion?: string;
  porcentajeCarga?: number;
  siguienteFila?: number;
  regimenCompatible?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProcesarExcelAltasMasivasService {
    
  private apiUrl = environment.apiUrl;
  
  constructor(private apiService: ApiService) {}
  
  /**
   * Procesa un archivo Excel completo (con o sin lotes)
   * @param archivo - Archivo Excel a procesar
   * @param tipoRegimen - Tipo de régimen
   * @param callbacks - Callbacks para progreso
   */
  async procesarExcelCompleto(
    archivo: File,
    tipoRegimen: string,
    tipo: string,
    callbacks?: {
      onProgreso?: (porcentaje: number, mensaje: string) => void;
      onLoteCompletado?: (lote: number, datos: any[]) => void;
    }
  ): Promise<ResultadoProcesamiento> {
    
    // 1. Validar archivo y régimen
    // tipoRegimen="62";
    console.log("*** Entra a procesarExcelCompleto()" + tipo);
    if (!tipoRegimen && tipo == "plazasMasivas") {
      return { exito: false, mensaje: 'Seleccione un régimen válido', datos: [], totalRegistros: 0 };
    }
    
    if (!archivo) {
      return { exito: false, mensaje: 'No hay archivo para procesar', datos: [], totalRegistros: 0 };
    }
    
    const tiempoInicio = new Date();
    
    try {
      // 2. Obtener metadata del archivo
      callbacks?.onProgreso?.(5, 'Leyendo metadata del archivo...');
      
      const metadata = await this.obtenerMetadataArchivo(archivo, tipoRegimen,tipo);
      
      if (!metadata.exito) {
        return metadata;
      }
      
      const totalFilas = metadata.totalRegistros;
      const totalFilasExcel = metadata.totalFilasExcel;
      
      if (totalFilas === 0) {
        return { exito: false, mensaje: 'El archivo no contiene datos para procesar', datos: [], totalRegistros: 0 };
      }
      
      // 3. Calcular tamaño de lote según la cantidad de filas
      const tamanoLote = this.calcularTamanoLote(totalFilas);
      
      callbacks?.onProgreso?.(10, `Archivo válido. ${totalFilas} registros por procesar...`);
      
      // 4. Procesar por lotes
      let filasProcesadas = 0;
      let todosLosDatos: any[] = [];
      let lote = 0;
      
      console.log("filasProcesadas < totalFilas", filasProcesadas, totalFilas);
      while (filasProcesadas < totalFilas) {
        const resultadoLote = await this.procesarLote(
          archivo,
          tipo,
          tipoRegimen,
          filasProcesadas,
          tamanoLote,
          totalFilasExcel,
          totalFilas
        );

        console.log("+++resultadoLote",resultadoLote);
        
        if (!resultadoLote.exito) {
          return resultadoLote;
        }
        
        todosLosDatos = [...todosLosDatos, ...resultadoLote.datos];
        filasProcesadas = resultadoLote.siguienteFila || filasProcesadas + resultadoLote.datos.length;
        
        // Calcular progreso (10% a 95%)
        const progreso = 10 + (filasProcesadas / totalFilas) * 85;
        callbacks?.onProgreso?.(Math.min(95, progreso), `Procesando lote ${lote + 1}: ${filasProcesadas}/${totalFilas} registros`);
        callbacks?.onLoteCompletado?.(lote, resultadoLote.datos);
        
        lote++;
        
        // Pequeña pausa para no saturar el servidor
        if (lote % 3 === 0) {
          await this.delay(100);
        }
      }
      
      // 5. Finalizar
      const tiempoTotal = this.calcularTiempoTranscurrido(tiempoInicio);
      callbacks?.onProgreso?.(100, 'Procesamiento completado');
      
      return {
        exito: true,
        mensaje: `✅ Procesamiento completado. ${todosLosDatos.length} registros procesados en ${tiempoTotal}`,
        datos: todosLosDatos,
        totalRegistros: todosLosDatos.length,
        tiempoEjecucion: tiempoTotal
      };
      
    } catch (error) {
      console.error('Error en procesamiento:', error);
      return {
        exito: false,
        mensaje: `Error al procesar: ${error}`,
        datos: [],
        totalRegistros: 0
      };
    }
  }
  
  /**
   * Obtiene metadata del archivo sin procesarlo completamente
   */
  async obtenerMetadataArchivo(archivo: File, tipoRegimen: string,tipo:string): Promise<any> {
    const formData = new FormData();
    formData.append('excel_file', archivo);
    formData.append('tipoRegimen', tipoRegimen);
    formData.append('tipo', tipo);
    try {
      console.log("Entra a obtenerMetadataArchivo()");
    //     return {
    //     exito: true,
    //     totalRegistros: 100,
    //     totalFilasExcel: 100,
    //     regimenCompatible: true
    //   };
      const response = await fetch(`${this.apiUrl}/excel/getFilas`, {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': this.apiService.getCsrfToken(),
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: formData,
        credentials: 'include',
        mode: 'cors'
      });
      
      const resultado = await response.json();
      console.log(resultado);
      
      if (!resultado.dato?.estado) {
        if (resultado.dato?.regimenCompatible === false) {
          return {
            exito: false,
            mensaje: `El archivo ${archivo.name} no contiene el régimen: ${tipoRegimen}`,
            regimenCompatible: false
          };
        }
        return {
          exito: false,
          mensaje: resultado.dato?.mensaje || `Error al leer el archivo ${archivo.name}`
        };
      }
      
      return {
        exito: true,
        totalRegistros: resultado.dato.totalAregistrar || 0,
        totalFilasExcel: resultado.dato.totalFilasExcel || 0,
        regimenCompatible: true
      };
      
    } catch (error) {
      console.error('Error en getFilas:', error);
      return {
        exito: false,
        mensaje: `Error de conexión: ${error}`
      };
    }
  }
  
  /**
   * Procesa un lote específico del archivo
   */
  async procesarLote( archivo: File, tipo:string, tipoRegimen: string, filaInicio: number, limite: number, totalFilasExcel: number, totalFilasTotal?: number
  ): Promise<ResultadoProcesamiento> {
    console.log("***procesarLote()",)
    const formData = new FormData();
    formData.append('excel_file', archivo);
    formData.append('tipo', tipo);
    formData.append('fila_inicio', filaInicio.toString());
    formData.append('limite', limite.toString());
    formData.append('tipoRegimen', tipoRegimen);
    formData.append('totalFilasExcel', totalFilasExcel.toString());
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutos
    // console.log("archivo",archivo);
    console.log("formData");
    console.log(Object.fromEntries(formData.entries()));
    try {
      const response = await fetch(`${this.apiUrl}/excel/process`, {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': this.apiService.getCsrfToken(),
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: formData,
        credentials: 'include',
        mode: 'cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const resultado = await response.json();
      console.log("resultado");
      console.log(resultado);
      
      if (!resultado.success) {
        // Verificar si es error de régimen incompatible
        if (resultado.regimenCompatible === false) {
          return {
            exito: false,
            mensaje: `El archivo no contiene el régimen: ${tipoRegimen}`,
            datos: [],
            totalRegistros: 0,
            regimenCompatible: false
          };
        }
        
        return {
          exito: false,
          mensaje: resultado.error || 'Error al procesar el lote',
          datos: [],
          totalRegistros: 0
        };
      }
      
      return {
        exito: true,
        mensaje: `Lote procesado: ${resultado.data?.length || 0} registros`,
        datos: resultado.data || [],
        totalRegistros: resultado.data?.length || 0,
        siguienteFila: resultado.siguienteFilaInicio || filaInicio + (resultado.data?.length || 0)
      };
      
    } catch (error) {
      clearTimeout(timeoutId);
    //   if (error.name === 'AbortError') {
    //     return {
    //       exito: false,
    //       mensaje: 'El procesamiento está tomando demasiado tiempo',
    //       datos: [],
    //       totalRegistros: 0
    //     };
    //   }
      return {
        exito: false,
        mensaje: `Error en lote: ${error}`,
        datos: [],
        totalRegistros: 0
      };
    }
  }
  
  /**
   * Calcula el tamaño óptimo del lote según la cantidad de filas
   */
  private calcularTamanoLote(totalFilas: number): number {
    if (totalFilas < 800) return 500;
    if (totalFilas < 1300) return 1000;
    if (totalFilas < 6000) return 3500;
    return 4500;
  }
  
  /**
   * Calcula el tiempo transcurrido en formato legible
   */
  private calcularTiempoTranscurrido(inicio: Date): string {
    const fin = new Date();
    const diferencia = fin.getTime() - inicio.getTime();
    const segundos = Math.floor(diferencia / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);
    
    if (horas > 0) {
      return `${horas}h ${minutos % 60}m ${segundos % 60}s`;
    }
    if (minutos > 0) {
      return `${minutos}m ${segundos % 60}s`;
    }
    return `${segundos}s`;
  }
  
  /**
   * Delay para no saturar el servidor
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}