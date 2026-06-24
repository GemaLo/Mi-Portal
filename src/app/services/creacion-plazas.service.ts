// frontend/src/app/services/creacion-plazas.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RegistroPlaza {
  fecha_inicio?: string;
  fecha_fin?: string;
  plaza: string;
  unidad: string;
  codigo_presupuestal: string;
  consecutivo_plaza: string;
  codigo_federal?: string;
  unidad_2?: string;
  clave_programatica?: string;
  nomina?: string;
  base_salario?: number;
  nivel?: string;
  cargo_comision?: string;
  regimen?: string;
  codigo_inteligente: string;
  ramo?: string;
  unidad_3?: string;
  zona_economica?: string;
  referencia_tabular?: string;
  consecutivo_codigo_inteligente?: string;
  tipo_puesto?: string;
  tipo_ocupacion?: string;
  tipo_funcion?: string;
  denominacion?: string;
  tipo_estrategico?: string;
  codigo_inteligente_jefe?: string;
  estado: string;
  comentario?: string;
  tipo_plaza: 'permanente' | 'eventual';
  editable?: boolean;
  eliminable?: boolean;
  __index?: number;
  __file?: string;
  [key: string]: any;
}

export interface Catalogo {
  [key: string]: string[] | { [key: string]: string };
}

@Injectable({
  providedIn: 'root'
})
export class CreacionPlazasService {
  private apiUrl = environment.apiUrl; // URL base de Laravel
  
  private processedDataSubject = new BehaviorSubject<RegistroPlaza[]>([]);
  private archivosSubject = new BehaviorSubject<File[]>([]);
  private catalogosSubject = new BehaviorSubject<Catalogo>({});
  
  processedData$ = this.processedDataSubject.asObservable();
  archivos$ = this.archivosSubject.asObservable();
  catalogos$ = this.catalogosSubject.asObservable();
  
  constructor(private http: HttpClient) {}
  
  // 1. Procesar archivo Excel 
  procesarArchivo(file: File, tipoRegimen: string): Observable<any> {
    const formData = new FormData();
    formData.append('excel_file', file);
    formData.append('tipoRegimen', tipoRegimen);
    
    return this.http.post(`${this.apiUrl}/excel/process`, formData);
  }
  
  // 2. Generar Excel (igual a tu ruta Laravel)
  generarExcel(datos: any): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/download/excel`, datos, {
      responseType: 'blob',
      headers: {
        'Accept': 'application/json'
      }
    });
  }
  
  // 3. Descargar layout vacío
  descargarLayout(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/descargar/layout`, {
      responseType: 'blob'
    });
  }
  
  // 4. Validar campo (igual a tu ruta Laravel)
  validarCampo(campo: string, valor: string, extras: any): Observable<any> {
    const formData = new FormData();
    formData.append('campo', campo);
    formData.append('valor', valor);
    formData.append('extras', JSON.stringify(extras));
    
    return this.http.post(`${this.apiUrl}/validar/dato`, formData);
  }
  
  // 5. Obtener catálogo (igual a tu ruta Laravel)
  obtenerCatalogo(tabla: string, valor1?: string): Observable<any> {
    const formData = new FormData();
    formData.append('tb', tabla);
    if (valor1) {
      formData.append('valor1', valor1);
    }
    
    return this.http.post(`${this.apiUrl}/getCatalogo`, formData);
  }
  
  // 6. Agregar catálogo (igual a tu ruta Laravel)
  agregarCatalogo(datos: any): Observable<any> {
    const formData = new FormData();
    formData.append('idExcel', datos.idExcel);
    formData.append('nomCat', datos.nomCat);
    formData.append('nomHojaCat', datos.nomHojaCat);
    
    return this.http.post(`${this.apiUrl}/agregar/catalogo`, formData);
  }
  
  // 7. Obtener estadísticas
  getEstadisticas(datos: RegistroPlaza[]): {
    total: number;
    validos: number;
    invalidos: number;
    repetidos: number;
  } {
    return {
      total: datos.length,
      validos: datos.filter(item => item.estado === 'VÁLIDO').length,
      invalidos: datos.filter(item => item.estado === 'INVÁLIDO').length,
      repetidos: datos.filter(item => item.estado === 'REPETIDO').length
    };
  }
  
  // Métodos para actualizar estados
  actualizarDatosProcesados(datos: RegistroPlaza[]): void {
    this.processedDataSubject.next(datos);
  }
  
  actualizarArchivos(archivos: File[]): void {
    this.archivosSubject.next(archivos);
  }
  
  actualizarCatalogos(catalogos: Catalogo): void {
    this.catalogosSubject.next(catalogos);
  }
  
  // Helper para descargar archivos
  descargarArchivo(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
  
  // Helper para manejar errores
  handleError(error: any): string {
    if (error.error instanceof ErrorEvent) {
      return `Error: ${error.error.message}`;
    } else {
      return `Error ${error.status}: ${error.message}`;
    }
  }
}