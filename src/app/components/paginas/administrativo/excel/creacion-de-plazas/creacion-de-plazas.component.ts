import { Component, OnInit, HostListener, ViewChild, ElementRef,ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ApiService } from '../../../../../services/api.service';
import { environment } from '../../../../../../environments/environment';

// Componentes
import { AlertaComponent } from '../../../../forms/alerta/alerta.component';

// Prueba para archivos en cola
import { interval, Subscription } from 'rxjs';
import { takeWhile, switchMap } from 'rxjs/operators';

import { InfoArchivoService } from '../../../../../services/info-archivo.service';
// Interfaces basadas en tu código PHP
import { ArchivosDbComponent } from '../../../../modals/archivos-db/archivos-db.component';

// interfaces
import { DatosPdf } from '../../../../../interfaces/datos-pdf.interface';

interface MenuItem {
  title: string;
  icon: string;
  route: string;
  badge?: number;
  isActive?: boolean;
  children?: MenuItem[];
}

interface MetricCard {
  title: string;
  icon: string;
  value?: number;
  detail?: string;
  color: string;
  route: string;
}

interface RegistroPlaza {
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
  __index?: number;
  __file?: string;
  [key: string]: any;
}

interface TableHeader {
  key: string;
  value: string;
  minWidth?: number | undefined;
}

interface SelectOption {
  value: string;
  text: string;
}

interface ValidationResponse {
  success: boolean;
  validacion?: {
    msgPlaza?: string;
    msgPregunta?: string;
    consecutivoSugerido?: number;
    plazaSugerida?: string;
    accion?: string;
  };
  datoAvalidar?: string;
  extra?: {
    codigo_inteligente?: string;
    plaza?: string;
  };
}

interface DialogConfig {
  message: string;
  validacion: string;
  pregunta: string;
  inputValue: string;
  showInput: boolean;
  callback?: (result: boolean, inputValue?: string) => void;
}

interface CatalogoSelect {
  [key: string]: SelectOption[];
}

interface Organizacion {
  organization_id: string;
  name: string;
}

@Component({
  selector: 'app-creacion-de-plazas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ArchivosDbComponent,
    AlertaComponent,
  ],
  templateUrl: './creacion-de-plazas.component.html',
  styleUrl: './creacion-de-plazas.component.css'
})
export class CreacionDePlazasComponent implements OnInit {// Variables de estado
  tipoRegimen: string = '62';
  archivosCargados: File[] = [];
  archivoActivoTabla: string = '';
  processedData: RegistroPlaza[] = [];
  resultadosPorArchivo: { [key: string]: RegistroPlaza[] } = {};
  catalogosSelect: CatalogoSelect = {};
  organizaciones: Organizacion[] = [];
  
  // Variables para tabla y paginación
  currentPage: number = 1;
  filteredData: RegistroPlaza[] = [];
  rowsPerPage: number = 0;
  totalRegistrosArchivo: number = 0;
  columnVisibility: { [key: string]: boolean } = {};
  sortDirection: { [key: string]: string } = {};
  
  // Variables de UI
  isLoading: boolean = false;
  isLoadingDownload: boolean = false;
  showResults: boolean = false;
  showAddPlazas: boolean = false;
  validando: boolean = false;
  cambiarEstadoPlaza: boolean = false;
  datoAnteriorAeditar: string = '';
  
  // Estadísticas
  estadisticas = {
    total: 0,
    validos: 0,
    invalidos: 0,
    repetidos: 0,
    existentes: 0,
    totalArchivos: 0
  };
  
  // Filtros
  searchTerm: string = '';
  statusFilter: string = '';
  tipoPlazaFilter: string = '';
  cantidadRegistros: string = '';
  
  // Para diálogo de confirmación
  dialogConfig: DialogConfig = {
    message: '',
    validacion: '',
    pregunta: '',
    inputValue: '',
    showInput: false
  };
  
  showDialogModal: boolean = false;
  showResumenModal: boolean = false;
  showCatalogosModal: boolean = false;
  
  // Para catálogos
  nuevoCatalogo = {
    nombre: '',
    nombreHoja: '',
    descripcion: ''
  };
  
  // Headers de tabla en orden específico
  tableHeaders: TableHeader[] = [
    { key: 'fecha_inicio', value: 'Fecha Inicio' },
    { key: 'fecha_fin', value: 'Fecha Fin' },
    { key: 'plaza', value: 'Plaza', minWidth: 197 },
    { key: 'unidad', value: 'Unidad', minWidth: 80 },
    { key: 'codigo_presupuestal', value: 'Código Presupuestal', minWidth: 150 },
    { key: 'consecutivo_plaza', value: 'Consecutivo Plaza' },
    { key: 'codigo_federal', value: 'Código Federal' },
    { key: 'unidad_2', value: 'Unidad 2', minWidth: 250 },
    { key: 'clave_programatica', value: 'Clave Programática' },
    { key: 'nomina', value: 'Nómina', minWidth: 180 },
    { key: 'base_salario', value: 'Base Salario', minWidth: 100 },
    { key: 'nivel', value: 'Nivel', minWidth: 75 },
    { key: 'cargo_comision', value: 'Cargo o Comisión' },
    { key: 'regimen', value: 'Régimen' , minWidth: 100},
    { key: 'codigo_inteligente', value: 'Código Inteligente', minWidth: 265 },
    { key: 'ramo', value: 'Ramo' , minWidth: 70},
    { key: 'unidad_3', value: 'Unidad 3', minWidth: 85 },
    { key: 'zona_economica', value: 'Zona Económica', minWidth: 100},
    { key: 'referencia_tabular', value: 'Referencia Tabular', minWidth: 110 },
    { key: 'consecutivo_codigo_inteligente', value: 'Consecutivo Código Inteligente', minWidth: 130 },
    { key: 'tipo_puesto', value: 'Tipo Puesto', minWidth: 110 },
    { key: 'tipo_ocupacion', value: 'Tipo Ocupación', minWidth: 140 },
    { key: 'tipo_funcion', value: 'Tipo Función', minWidth: 110 },
    { key: 'denominacion', value: 'Denominación', minWidth: 250 },
    { key: 'tipo_estrategico', value: 'Tipo Estratégico' },
    { key: 'codigo_inteligente_jefe', value: 'Código Inteligente Jefe', minWidth: 275 },
    { key: 'estado', value: 'Estado' },
    { key: 'comentario', value: 'Comentario', minWidth: 250 },
    { key: 'tipo_plaza', value: 'Tipo Plaza' }
  ];
  
  // Archivos 
  archivosAdjuntos: number = 0;
  agregarSolicitud: boolean = false;
  idVersionTemporal: number = 123; // ID temporal, esto vendría del backend
  datosPdf: DatosPdf | null = null;
  
  ultimoArchivoProcesado: any = null;
  erroresArchivoPdf: string | null = null;

  private suscripcionArchivos: Subscription | null = null;
  private suscripcionErrores: Subscription | null = null;

  // API URL
  apiUrl = environment.apiUrl;
  
  @ViewChild('excelFileInput') excelFileInput!: ElementRef;
  @ViewChild('miAlerta') alerta!: AlertaComponent;
  
  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private apiService: ApiService,
    private infoArchivoService: InfoArchivoService
  ) {}
  
  ngOnInit(): void {
    this.initializeColumnVisibility();
    // this.obtenerOrganizaciones();
    // this.obtenerCatalogosEstaticos();
    this.inicializarSuscripciones();
  }
  
  organoSeleccionado: string = 'SC';
  organoSelect:boolean = false;
  // ========== MÉTODOS DE ARCHIVOS ==========
  
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    const uploadArea = event.currentTarget as HTMLElement;
    uploadArea.classList.add('dragover');
  }
  
  onDragLeave(event: DragEvent): void {
    const uploadArea = event.currentTarget as HTMLElement;
    uploadArea.classList.remove('dragover');
  }
  
  onDrop(event: DragEvent): void {
    event.preventDefault();
    const uploadArea = event.currentTarget as HTMLElement;
    uploadArea.classList.remove('dragover');
    
    if (event.dataTransfer?.files) {
      const files = Array.from(event.dataTransfer.files);
      this.handleFileSelect(files);
    }
  }
  
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      this.handleFileSelect(files);
    }
  }
  
  handleFileSelect(files: File[]): void {
    for (const file of files) {
      if (!file.name.match(/\.(xlsx|xls)$/)) {
        alert('Por favor, selecciona un archivo Excel válido (.xlsx o .xls)');
        return;
      }
      
      if (!this.archivosCargados.some(f => f.name === file.name)) {
        this.archivosCargados.push(file);
      }
    }
    this.renderFileList();
  }
  
  renderFileList(): void {
    this.estadisticas.totalArchivos = this.archivosCargados.length;
  }
  
  getEstadoArchivo(index: number): string {
    const fileName = this.archivosCargados[index]?.name;
    if (!fileName || !this.resultadosPorArchivo[fileName]) return '';
    
    const registros = this.resultadosPorArchivo[fileName];
    const tieneErrores = registros.some(item => 
      Object.values(item).some(val => 
        typeof val === 'string' && val.includes("| Error:")
      )
    );
    
    return tieneErrores ? 'error' : 'success';
  }
  
  eliminarArchivoAlert(index: number): void {
    this.dialogConfig = {
      message: '¿Deseas eliminar el archivo?',
      validacion: `Archivo: ${this.archivosCargados[index]?.name}`,
      pregunta: 'Esta acción no se puede deshacer.',
      inputValue: '',
      showInput: false,
      callback: (result: boolean) => {
        this.showDialogModal = false;
        if (result) {
          this.eliminarArchivo(index);
        }
      }
    };
    this.showDialogModal = true;
  }
  
  eliminarArchivo(index: number): void {
    const nombre = this.archivosCargados[index]?.name;
    this.archivosCargados.splice(index, 1);
    delete this.resultadosPorArchivo[nombre];
    this.renderFileList();
    
    if (nombre === this.archivoActivoTabla) {
      this.processedData = [];
      this.filteredData = [];
      this.showResults = false;
    }
    if (this.archivosCargados.length == 0) this.organoSelect=false;
  }
  
  mostrarArchivo(index: number): void {
    const nombre = this.archivosCargados[index]?.name;
    if (this.resultadosPorArchivo[nombre]) {
      this.archivoActivoTabla = nombre;
      this.displayResults(this.resultadosPorArchivo[nombre]);
    } else {
      alert('Ese archivo aún no ha sido procesado.');
    }
  }
  
  // ========== PROCESAR ARCHIVOS ==========
  
  private processingSubscription: Subscription | null = null;
  currentProcessingId: string | null = null;
  processingStatus: any = null;
  porcentajeCargaExcel: number=0;
  tiempoInicio: Date | null = null;
  tiempoTranscurrido: string = '00:00';
  tiempoTotal: string = '';
  intervaloReloj: any = null;
  
  async processFiles(): Promise<void> {
    this.showResults = false;
    
    if (!this.tipoRegimen) {
      alert('Seleccione un regimen valido');
      return;
    }
    
    if (this.archivosCargados.length === 0) {
      alert('No hay archivos para procesar');
      return;
    }
    
    this.isLoading = true;
    this.resultadosPorArchivo = {};
    this.processedData = [];
    this.organoSelect = true;

    // 1. Iniciar tiempo
    this.tiempoInicio = new Date();
    this.tiempoTranscurrido = '00:00';
    this.tiempoTotal = '';
    
    // 2. Iniciar reloj en tiempo real
    this.iniciarRelojTiempo();


    try {
      for (let indexArchivo = 0; indexArchivo < this.archivosCargados.length; indexArchivo++) {
        const file = this.archivosCargados[indexArchivo];
        this.porcentajeCargaExcel=0;
        const formData = new FormData();
        formData.append('excel_file', file);
        formData.append('tipoRegimen', this.tipoRegimen);
        formData.append('tipo', "plazasMasivas");
        
        // Crear AbortController para timeout personalizado (ej: 5 minutos)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000000); // 5 minutos
        //*
        const resFilas = await fetch(`${this.apiUrl}/excel/getFilas`, {
          method: 'POST',
          headers: {
            'X-CSRF-TOKEN': this.apiService.getCsrfToken(),
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: formData,
          credentials: 'include', // Importante si usas sesiones/cookies
          mode: 'cors',
          signal: controller.signal 
        });
        console.log("result Filas:");
        const filas = await resFilas.json();
        console.log(filas);
        console.log(filas.success);
        var totalFilasConDatos = filas.dato.totalAregistrar;
        
        console.log("totalAregistrar", totalFilasConDatos);
        console.log("totalFilasExcel",filas.dato.totalFilasExcel, "Regimen " + filas.dato.estado);

        let filasProcesadas = 0;
        let lote = 0;

        var resultados=[];
        let todosLosDatos: any[] = [];
        if (filas.dato.estado == true){
          var agregarCada=0;
          if (totalFilasConDatos < 800){ 
            agregarCada=500;
            this.porcentajeCargaExcel=25.0;
          } else if (totalFilasConDatos < 1300){ 
            agregarCada = 1000;
            this.porcentajeCargaExcel=8.0;
          } else if (totalFilasConDatos < 6000) {
            agregarCada = 3500;
            this.porcentajeCargaExcel=11.0;
          } else {
            agregarCada = 4500;
            this.porcentajeCargaExcel=15.0;
          }
          console.log("agregarCada",agregarCada);
          let totalProcesados = 0;
          while (filasProcesadas < totalFilasConDatos) {
          // for (let inicio = 0; inicio < filas.dato.totalAregistrar; inicio += agregarCada ) {
            // formData.append('inicio', inicio.toString());
            // formDataLote.append('agregarCada',agregarCada.toString());
            // console.log("Filas cargadas:" + inicio);
            //*
            console.log(`totalFilasConDatos: ${totalFilasConDatos}, filasProcesadas ${filasProcesadas} tipo reg ${this.tipoRegimen}  `)
            const formDataLote = new FormData();
            formDataLote.append('excel_file', file);
            formDataLote.append('fila_inicio', filasProcesadas.toString());
            formDataLote.append('limite', agregarCada.toString());
            formDataLote.append('tipoRegimen', this.tipoRegimen);
            formDataLote.append('tipo', "plazasMasivas");
            formDataLote.append('totalFilasExcel', filas.dato.totalFilasExcel);
    
            try {
              const response = await fetch(`${this.apiUrl}/excel/process`, {
                method: 'POST',
                headers: {
                  'X-CSRF-TOKEN': this.apiService.getCsrfToken(),
                  'Accept': 'application/json',
                  'X-Requested-With': 'XMLHttpRequest'
                },
                body: formDataLote,
                credentials: 'include', // Importante si usas sesiones/cookies
                mode: 'cors',
                signal: controller.signal 
              });
      
              clearTimeout(timeoutId);
              
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
      
              console.log("result");
              const resultado = await response.json();
              console.log("resultado",resultado);
              totalProcesados += resultado.data.length; 
              console.log("Total Procesados" + totalProcesados);

              resultados.push(resultado);
              
              this.porcentajeCargaExcel = Math.min(100, ((totalProcesados) / filas.dato.totalAregistrar) * 100);
              console.log(`Procesado: ${totalProcesados} de ${filas.dato.totalAregistrar} (${this.porcentajeCargaExcel.toFixed(1)}%)`);
              console.log("resultados");
              console.log(resultados);
              
              // if (result.success && result.processing_id) {
              //   this.currentProcessingId = result.processing_id;
                
              //   // Iniciar polling para verificar estado
              //   this.startPollingStatus(result.processing_id);
                
              // } else {
              //   console.error('Error al iniciar procesamiento:', result.error);
              //   alert('Error al iniciar procesamiento');
              //   this.isLoading = false;
              // }
              //*
              
              if (resultado.success == true) {
                if (resultado.data && resultado.data.length > 0) {
                  const dataCorregida = this.marcarPlazasRepetidas(resultado.data);
                  todosLosDatos = [...todosLosDatos, ...dataCorregida];
                  // this.resultadosPorArchivo[file.name] = dataCorregida;
                  // if (resultado.catalogs) {
                  //   this.procesarCatalogos(resultado.catalogs); // Catalogos excel
                  // }
                  // this.processedData.push(...todosLosDatos);
                  // this.organoSelect=true;
                  filasProcesadas = resultado.siguienteFila || filasProcesadas + resultado.data.length;
                  // filasProcesadas = resultado.siguienteFilaInicio || filasProcesadas + resultado.data.length;
                  console.log(`Lote ${lote + 1}: ${resultado.data.length} filas, total: ${filasProcesadas}/${totalFilasConDatos}, Tiempo: ${this.tiempoTotal} \n resultado.siguienteFilaInicio: ${resultado.siguienteFilaInicio}`);
                }
              } else {
                if (resultado.regimenCompatible == false) {
                  const nombre = this.archivosCargados[indexArchivo].name;
                  this.eliminarArchivo(indexArchivo);
                  indexArchivo--;
                  alert(`Revise su archivo: ${nombre} solo contenga el régimen: ${this.tipoRegimen}`);
                  return;
                } else {
                  
                  console.error('Error en archivo:', file.name, resultado.error);
                  return;
                }
              }//*/
              lote++;
            // Pequeña pausa para no saturar
            await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
              console.error('Error al procesar archivos:', error);
              this.detenerProcesoCarga();
              return; 
            }
          } //endFor
          this.resultadosPorArchivo[file.name] = todosLosDatos;
          this.processedData = todosLosDatos;
          console.log('Procesamiento completo:', todosLosDatos.length, 'filas');
          if (this.archivosCargados.length > 0) {
            const primerArchivo = this.archivosCargados[0].name;
            this.archivoActivoTabla = primerArchivo;
            this.displayResults(this.resultadosPorArchivo[primerArchivo]);
          }
          this.detenerProcesoCarga();
        }else{
          console.log("tipoRegimen: " + this.tipoRegimen);
          if (filas.dato.regimenCompatible == false) {
            const nombre = this.archivosCargados[indexArchivo].name;
            this.eliminarArchivo(indexArchivo);
            indexArchivo--;
            alert(`Revise su archivo: ${nombre} que solo cuente con el régimen: ${this.tipoRegimen}`);
            this.detenerProcesoCarga();
            return;
          }
          this.detenerProcesoCarga();
        }//*/
      }
      //*
      
      
      // 3. Detener reloj y calcular tiempo total
      //*/
      
    } catch (error) {
      // if (error.name === 'AbortError') {
      //   console.error('Timeout: La solicitud tardó demasiado tiempo');
      //   alert('El procesamiento está tomando mucho tiempo. Por favor, intente con un archivo más pequeño.');
      // } else {
      //   console.error('Error al procesar archivos:', error);
      //   alert('Error al procesar archivos');
      // }
      this.detenerProcesoCarga();
      console.error('Error al procesar archivos:', error);
      alert('Error al procesar archivos');
    } finally {
      this.isLoading = false;
    }
  }
  
  detenerProcesoCarga(){
    this.detenerRelojTiempo();
    this.calcularTiempoTotal();
    this.validarArchivosExitosos();
    this.isLoading = false;
  }
  
  // Método para iniciar reloj en tiempo real
  iniciarRelojTiempo() {
    if (this.intervaloReloj) {
      clearInterval(this.intervaloReloj);
    }
    
    this.intervaloReloj = setInterval(() => {
      if (this.tiempoInicio) {
        const ahora = new Date();
        const diferencia = ahora.getTime() - this.tiempoInicio.getTime();
        this.tiempoTranscurrido = this.formatearMilisegundos(diferencia);
      }
    }, 1000); // Actualizar cada segundo
  }
  
  // Método para detener reloj
  detenerRelojTiempo() {
    if (this.intervaloReloj) {
      clearInterval(this.intervaloReloj);
      this.intervaloReloj = null;
    }
  }
  
  // Método para calcular tiempo total al final
  calcularTiempoTotal() {
    if (this.tiempoInicio) {
      const ahora = new Date();
      const diferencia = ahora.getTime() - this.tiempoInicio.getTime();
      this.tiempoTotal = this.formatearMilisegundos(diferencia);
    }
  }
  
  // Método para formatear milisegundos a tiempo legible
  formatearMilisegundos(ms: number): string {
    const segundos = Math.floor((ms / 1000) % 60);
    const minutos = Math.floor((ms / (1000 * 60)) % 60);
    const horas = Math.floor((ms / (1000 * 60 * 60)) % 24);
    
    if (horas > 0) {
      return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
    }
    
    return `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
  }


  private startPollingStatus(processingId: string) {
    // Cancelar polling anterior si existe
    if (this.processingSubscription) {
      this.processingSubscription.unsubscribe();
    }
    
    // Polling cada 2 segundos
    this.processingSubscription = interval(2000)
      .pipe(
        switchMap(() => this.checkProcessingStatus(processingId)),
        takeWhile((response: any) => {
          return response.status !== 'completed' && 
                 response.status !== 'failed' && 
                 response.status !== 'not_found';
        }, true) // Incluir el último valor
      )
      .subscribe({
        next: (response) => {
          this.processingStatus = response;
          
          // Actualizar UI con progreso
          if (response.percentage) {
            console.log(`Procesando: ${response.percentage}% (${response.progress}/${response.total})`);
          }
          
          // Si completó
          if (response.status === 'completed') {
            this.handleCompletedProcessing(response);
          }
          
          // Si falló
          if (response.status === 'failed') {
            this.handleFailedProcessing(response);
          }
        },
        error: (error) => {
          console.error('Error en polling:', error);
          this.isLoading = false;
          this.processingSubscription = null;
        }
      });
  }
  
  private async checkProcessingStatus(processingId: string): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/excel/status/${processingId}`, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Error al verificar estado:', error);
      return { status: 'error', message: 'Error de conexión' };
    }
  }
  
  private handleCompletedProcessing(response: any) {
    if (this.processingSubscription) {
      this.processingSubscription.unsubscribe();
      this.processingSubscription = null;
    }
    
    if (response.success === true) {
      const dataCorregida = this.marcarPlazasRepetidas(response.data);
      const fileName = this.archivosCargados[0].name;
      
      this.resultadosPorArchivo[fileName] = dataCorregida;
      this.processedData = dataCorregida;
      
      if (response.catalogs) {
        this.procesarCatalogos(response.catalogs);
      }
      
      this.archivoActivoTabla = fileName;
      this.displayResults(dataCorregida);
      this.validarArchivosExitosos();
      
    } else {
      if (response.regimenCompatible === false) {
        alert(`Revise su archivo: solo contenga el régimen: ${this.tipoRegimen}`);
        this.eliminarArchivo(0);
      } else {
        console.error('Error en procesamiento:', response.error);
        alert('Error en procesamiento del archivo');
      }
    }
    
    this.isLoading = false;
    this.currentProcessingId = null;
    this.processingStatus = null;
  }
  
  private handleFailedProcessing(response: any) {
    if (this.processingSubscription) {
      this.processingSubscription.unsubscribe();
      this.processingSubscription = null;
    }
    
    console.error('Procesamiento fallido:', response.error);
    alert(`Error en procesamiento: ${response.error || 'Error desconocido'}`);
    
    this.isLoading = false;
    this.currentProcessingId = null;
    this.processingStatus = null;
  }
  
  // Cancelar procesamiento si el usuario navega
  ngOnDestroy() {
    if (this.processingSubscription) {
      this.processingSubscription.unsubscribe();
    }
    
    // Opcional: Cancelar procesamiento en backend
    if (this.currentProcessingId) {
      this.cancelProcessing(this.currentProcessingId);
    }
  }
  
  private async cancelProcessing(processingId: string) {
    try {
      await fetch(`${this.apiUrl}/excel/cancel/${processingId}`, {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': this.apiService.getCsrfToken(),
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
    } catch (error) {
      console.error('Error al cancelar procesamiento:', error);
    }
  }
  
  // ========== MOSTRAR RESULTADOS ==========
  
  async displayResults(data: RegistroPlaza[]): Promise<void> {
    this.processedData = data;
    this.filteredData = [...data];
    
    const validCount = this.filteredData.filter(item => item.estado === "VÁLIDO").length;
    const invalidCount = this.filteredData.filter(item => item.estado === "INVÁLIDO").length;
    const repeatCount = this.filteredData.filter(item => item.estado === "REPETIDO").length;
    const existCount = this.filteredData.filter(item => item.estado === "EXISTENTE").length;
    this.totalRegistrosArchivo = this.filteredData.length;
    
    this.estadisticas = {
      total: this.totalRegistrosArchivo,
      validos: validCount,
      invalidos: invalidCount,
      repetidos: repeatCount,
      existentes:existCount,
      totalArchivos: this.archivosCargados.length
    };
    
    this.currentPage = 1;
    this.rowsPerPage = this.cantidadRegistros ? parseInt(this.cantidadRegistros) : this.totalRegistrosArchivo;
    
    // this.showResults = true;
    // this.cdr.detectChanges();
      await this.inicializarCatalogosConErrores();
    
    this.showResults = true;
    this.cdr.detectChanges();
  }
  

  // ========== MÉTODOS DE TABLA ==========
  
  getPageData(): RegistroPlaza[] {
    if (this.filteredData.length === 0) return [];
    const startIndex = (this.currentPage - 1) * this.rowsPerPage;
    const endIndex = startIndex + this.rowsPerPage;
    return this.filteredData.slice(startIndex, endIndex);
  } 
  
  getGlobalIndex(localIndex: number): number {
    return (this.currentPage - 1) * this.rowsPerPage + localIndex;
  }
  
  marcarPlazasRepetidas(data: RegistroPlaza[]): RegistroPlaza[] {
    const mapaPlazas: { [key: string]: number } = {};
    
    data.forEach(item => {
      if (!mapaPlazas[item.plaza]) {
        mapaPlazas[item.plaza] = 1;
      } else {
        mapaPlazas[item.plaza]++;
      }
    });
    
    return data.map(item => {
      if (mapaPlazas[item.plaza] > 1) {
        return {
          ...item,
          estado: 'REPETIDO',
          comentario: `Plaza repetida: ${item.plaza}`
        };
      }
      return item;
    });
  }
  
  // ========== VALIDACIÓN Y EDICIÓN ==========
  
  async validarCampoEnBase(index: number, campo: string, valor: string, extras: any, pageData: RegistroPlaza[], valorOrg: string): Promise<void> {
    console.log(`**** validarCampoEnBs: ${campo} val ${valor} valOrg: ${valorOrg}`);
    this.cambiarEstadoPlaza=false;
    try {
      if (!valor || valor.trim() === '') {
        alert(`El campo ${campo} es requerido`);
        return;
      }
      
      const formData = new FormData();
      formData.append('campo', campo);
      formData.append('valor', valor);
      formData.append('extras', JSON.stringify(extras));
      
      const response = await fetch(`${this.apiUrl}/validar/dato`, {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': this.apiService.getCsrfToken(),
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: formData
      });
      const result: ValidationResponse = await response.json();
      console.log('Resultado validación campo:', result);
      if (result.validacion) {
        const consecutivoSug = result.validacion.consecutivoSugerido || 0;
        if (consecutivoSug > 0) {
          this.cambiarEstadoPlaza=false;
          this.dialogConfig = {
            message: result.validacion.msgPlaza || '', validacion: 'El consecutivo sugerido es:', pregunta: '', inputValue: consecutivoSug.toString(), 
            showInput: true,
            callback: (respuesta: boolean, inputValue?: string) => {
              this.showDialogModal = false;
              console.log("entra:dialog...");
              if (respuesta) {
                this.cambiarEstadoPlaza=true;
                console.log("ConsecutivoSug",respuesta, this.cambiarEstadoPlaza);
                const nuevoVal = inputValue || '';
                console.log("nuevoVal",nuevoVal);
                if (result.validacion?.plazaSugerida) {
                  console.log("Plaza sug: ",result.validacion?.plazaSugerida);
                  const plaza = result.validacion.plazaSugerida.split(".");
                  const nuevaPlaza = plaza[0] + "." + plaza[1] + "." + nuevoVal;
                  const plazaNuevaSeparada = nuevaPlaza.split(".");
                  this.cambiarDatosPlaza(index, campo, valor, pageData, this.cambiarEstadoPlaza, plazaNuevaSeparada, nuevaPlaza);
                }
              } else {
                console.log("Usuario canceló: valdatCampoBs");
                this.revertirCambio(index, campo, valorOrg);

                // this.revertirCambio(index, campo, valorOrg);
              }
            }
          };
        } else {
          this.dialogConfig = {message: result.validacion.msgPlaza || '', validacion: '', pregunta: result.validacion.msgPregunta || '', inputValue: '', showInput: false,
            callback: (respuesta: boolean) => {
              this.showDialogModal = false;
                console.log("Usuario :respuesta else: ", respuesta);
              if (respuesta) {
                if (result.validacion?.accion === "nuevo") {
                  if (result.datoAvalidar === "plaza") {
                    const nuevaPlaza = result.extra?.plaza || '';
                    const plazaNuevaSeparada = nuevaPlaza.split(".");
                    this.cambiarDatosPlaza(index, campo, valor, pageData, true, plazaNuevaSeparada, nuevaPlaza);
                  } else if (result.datoAvalidar === "codigoInteligente") {
                    const datoNuevo = result.extra?.codigo_inteligente || '';
                    const datoSeparado = datoNuevo.split("-");
                    this.cambiarDatosCodigoInteligente(index, campo, valor, pageData, true, datoSeparado, datoNuevo);
                  }
                }
              } else {
                console.log("Usuario canceló");
                // this.revertirCambio(index, campo, valorOrg);
              }
            }
          };
        }
        
        this.showDialogModal = true;
      }
    } catch (error) {
      console.log("Catch validación: ", error);
      alert('Error en validación');
    }
  }
  
  onBlurCampo(event: Event, index: number, campo: string, item: RegistroPlaza): void {
    console.log("Empieza... ");
    const input = event.target as HTMLTextAreaElement;
    var valor = input.value.trim();
    const valorOrg = input.dataset['orgvalue'];
    
    if (valor === valorOrg) return;
    valor = valor.split(" | ") ? valor.split(" | ")[0] : valor;
    // Actualizar el dato
    // this.actualizarDato(this.getGlobalIndex(index), campo, valor);
    
    let datoAvalidar = '';
    
    var plaza = item.plaza.includes(' | ') ? item.plaza.split(' | ')[0] : item.plaza;
    // var partesPlaza = plazaError.split("-");
    // partesPlaza = partesPlaza.join('-');


    let extras = {
      plaza: plaza,
      codigo_inteligente: item.codigo_inteligente,
      datoAvalidar: ''
    };
    
    if (['unidad', 'codigo_presupuestal', 'consecutivo_plaza'].includes(campo)) {
      datoAvalidar = 'plaza';
      extras.datoAvalidar = datoAvalidar;
      
      // Actualizar plaza completa
      const unidad = campo === 'unidad' ? valor : 
    (String(item.unidad || '').includes(' | ') ? String(item.unidad || '').split(' | ')[0] : String(item.unidad || ''));
      const codigo = campo === 'codigo_presupuestal' ? valor : (item.codigo_presupuestal.includes(' | ') ? item.codigo_presupuestal.split(' | ')[0] : item.codigo_presupuestal);
      const consecutivo = campo === 'consecutivo_plaza' ? valor : 
    (String(item.consecutivo_plaza || '').includes(' | ') ? String(item.consecutivo_plaza || '').split(' | ')[0] : String(item.consecutivo_plaza || ''));
    // (item.consecutivo_plaza.includes(' | ') ? item.consecutivo_plaza.split(' | ')[0] : item.consecutivo_plaza);
      const nuevaPlaza = `${unidad}.${codigo}.${consecutivo}`;
      console.log(`unidad: ----- ${unidad}. codigo: ------${codigo}. consecutivo: ----- ${consecutivo}`);
      console.log("Nueva plaza", nuevaPlaza , " | === plaza: " , plaza);
      // this.actualizarDato(this.getGlobalIndex(index), 'plaza', nuevaPlaza);
      extras.plaza = nuevaPlaza;
      
    } else if (['ramo', 'unidad_3', 'zona_economica', 'referencia_tabular', 
                'consecutivo_codigo_inteligente', 'tipo_puesto', 'tipo_ocupacion', 'tipo_funcion'].includes(campo)) {
      datoAvalidar = 'codigoInteligente';
      extras.datoAvalidar = datoAvalidar;
      console.log(campo,",", datoAvalidar, " - ",valor);
      
      // Actualizar código inteligente
      const nuevoCodigo = this.actualizarCodigoInteligente(index, campo, valor);
      extras.codigo_inteligente = nuevoCodigo;
    }
    
    this.validarCampoEnBase(this.getGlobalIndex(index), campo, valor, extras, this.getPageData(), valorOrg || '');
  }
  
  onEnterCampo(event: KeyboardEvent): void {
    event.preventDefault();
    (event.target as HTMLElement).blur();
  }
  /*
  onSelectChange(event: Event, index: number, campo: string, item: RegistroPlaza): void {
    const select = event.target as HTMLSelectElement;
    const nuevoValor = select.value;
    const valorOrg = select.dataset['orgvalue'];
    
    if (nuevoValor === valorOrg) return;
    
    // Actualizar el dato inmediatamente
    this.actualizarDato(this.getGlobalIndex(index), campo, nuevoValor);
    
    if (['nomina', 'regimen', 'zona_economica', 'tipo_puesto', 'tipo_ocupacion', 'tipo_funcion', 'tipo_estrategico'].includes(campo)) {
      this.validarCampoConSelect(index, campo, nuevoValor, item, valorOrg || '');
    } else if (campo === 'unidad_2') {
      this.cambiarCeldaExitosa(this.getGlobalIndex(index), campo, nuevoValor, 'select');
      this.validarFilaError(this.getGlobalIndex(index));
    }
  }//*/
  
  async validarCampoConSelect(index: number, campo: string, valor: string, item: RegistroPlaza, valorOrg: string): Promise<void> {
    // Separar código inteligente actual
    const codIntErrorOld = item.codigo_inteligente;
    const errorsCodInt = codIntErrorOld.split(" | Error:");
    const codSinError = errorsCodInt[0];
    const codIntSeparado = codSinError.split("-");
    let nuevoCodInt = "";
    let dtAvalidar = "";
    
    switch(campo) {
      case "zona_economica":
        nuevoCodInt = `${codIntSeparado[0]}-${codIntSeparado[1]}-${valor}-${codIntSeparado[3]}-${codIntSeparado[4]}-${codIntSeparado[5]}-${codIntSeparado[6]}-${codIntSeparado[7]}`;
        dtAvalidar="codigoInteligente";
        break;
      case "tipo_puesto":
        nuevoCodInt = `${codIntSeparado[0]}-${codIntSeparado[1]}-${codIntSeparado[2]}-${codIntSeparado[3]}-${codIntSeparado[4]}-${valor}-${codIntSeparado[6]}-${codIntSeparado[7]}`;
        dtAvalidar="codigoInteligente";
        break;
      case "tipo_ocupacion":
        nuevoCodInt = `${codIntSeparado[0]}-${codIntSeparado[1]}-${codIntSeparado[2]}-${codIntSeparado[3]}-${codIntSeparado[4]}-${codIntSeparado[5]}-${valor}-${codIntSeparado[7]}`;
        dtAvalidar="codigoInteligente";
        break;
      case "tipo_funcion":
        nuevoCodInt = `${codIntSeparado[0]}-${codIntSeparado[1]}-${codIntSeparado[2]}-${codIntSeparado[3]}-${codIntSeparado[4]}-${codIntSeparado[5]}-${codIntSeparado[6]}-${valor}`;
        dtAvalidar="codigoInteligente";
        break;
      default:
        dtAvalidar = "";
        break;
    }
    
    // Actualizar el código inteligente
    // this.actualizarDato(this.getGlobalIndex(index), 'codigo_inteligente', nuevoCodInt);
    
    // Validar
    const extras = {
      plaza: item.plaza,
      codigo_inteligente: nuevoCodInt,
      datoAvalidar: dtAvalidar
    };
    if (dtAvalidar.length > 0){
      await this.validarCampoEnBase(this.getGlobalIndex(index), campo, valor, extras, this.getPageData(), valorOrg);
    }else{
      console.log("valCampoConSelect select normal",dtAvalidar," Campo ", campo);

    }
  }
  
  private actualizarCodigoInteligente(index: number, campo: string, valor: string): string {
    console.log("actualizarCodigoInteligente, Val: ", valor)
    const item = this.getPageData()[index];
    var codIntError = item.codigo_inteligente.includes(' | ') ? item.codigo_inteligente.split(' | ')[0] : item.codigo_inteligente;

    const partes = codIntError.split("-");
    // const partes = item.codigo_inteligente.split('-');
    
    const mapaCampos: {[key: string]: number} = {
      'ramo': 0,
      'unidad_3': 1,
      'zona_economica': 2,
      'referencia_tabular': 3,
      'consecutivo_codigo_inteligente': 4,
      'tipo_puesto': 5,
      'tipo_ocupacion': 6,
      'tipo_funcion': 7
    };
    
    if (mapaCampos[campo] !== undefined) {
      partes[mapaCampos[campo]] = valor;
      
      const nuevoCodigo = partes.join('-');
      // this.actualizarDato(this.getGlobalIndex(index), 'codigo_inteligente', nuevoCodigo);
      console.log("actualizarCodigoInt: nuevoCodigo", nuevoCodigo, " codIntError 0 ",codIntError);
      return nuevoCodigo;
    }
    console.log("actualizarCodigoInt: item.codigo_inteligente", item.codigo_inteligente);
    return item.codigo_inteligente;
  }
  
  // ========== MÉTODOS DE ACTUALIZACIÓN ==========
  
  actualizarDato(index: number, campo: string, valor: string): void {
    console.log("actualizarDt...")
    if (this.processedData[index]) {
      this.processedData[index][campo] = valor;
      
      if (this.archivoActivoTabla && this.resultadosPorArchivo[this.archivoActivoTabla]) {
        const archivoData = this.resultadosPorArchivo[this.archivoActivoTabla];
        if (archivoData[index]) {
          archivoData[index][campo] = valor;
        }
      }
    }
  }
  
  cambiarDatosPlaza(index: number, field: string, valor: string, pageData: RegistroPlaza[], cambiarEstadoPlaza: boolean, plazaNuevaSeparada: string[], nuevaPlaza: string
  ): void {
    const globalIndex = this.getGlobalIndex(index);
    console.log("entra a cambiarDtsPlaza", nuevaPlaza,cambiarEstadoPlaza);
    if (pageData[index]) {
      pageData[index]["plaza"] = nuevaPlaza;
      
      if (cambiarEstadoPlaza) {
        pageData[index]["codigo_presupuestal"] = plazaNuevaSeparada[1];
        pageData[index]["consecutivo_plaza"] = plazaNuevaSeparada[2];
      }
    }
    
    // Actualizar en processedData
    if (cambiarEstadoPlaza) {
      this.actualizarDato(globalIndex, 'codigo_presupuestal', plazaNuevaSeparada[1]);
      this.actualizarDato(globalIndex, 'plaza', nuevaPlaza,);
      this.actualizarDato(globalIndex, 'consecutivo_plaza', plazaNuevaSeparada[2]);
      this.cambiarCeldaExitosa(globalIndex, field, valor, "textarea");
    }
    this.validarFilaError(globalIndex);
  }
  
  cambiarDatosCodigoInteligente(index: number,field: string,valor: string,pageData: RegistroPlaza[],cambiarEstadoCodInteligente: boolean,datoSeparado: string[],
    datoNuevo: string): void {
    const globalIndex = this.getGlobalIndex(index);
    if (cambiarEstadoCodInteligente){
      if (pageData[index]) {
        pageData[index]["codigo_inteligente"] = datoNuevo;
      }
      var tipoInput="select";
      if (field == 'ramo' || field == 'unidad_3' || field == 'referencia_tabular' || field == 'consecutivo_codigo_inteligente'  || field == '' ) tipoInput='textarea';
      this.actualizarDato(globalIndex, 'codigo_inteligente', datoNuevo);
      this.cambiarCeldaExitosa(globalIndex, field, valor, tipoInput);
      this.validarFilaError(globalIndex);
    }
  }
  
  cambiarCeldaExitosa(index: number, field: string, valor: string, tipo: string): void {
    const celdaSelector = tipo === 'textarea' ? 'textarea' : 'select';
    const selector = `${celdaSelector}[data-index="${index}"][data-field="${field}"]`;
    console.log("Entra: cambiarCeldaExit", selector);
    const celdaAeditar = document.querySelector(selector) as HTMLTextAreaElement | HTMLSelectElement;
    
    if (celdaAeditar) {
      celdaAeditar.classList.remove("bkg-rojo");
      celdaAeditar.style.border = "none";
      celdaAeditar.style.background = "none";
      
      const tdCeldaError = celdaAeditar.closest('td');
      if (tdCeldaError) {
        tdCeldaError.classList.remove("bkg-rojo");
        tdCeldaError.textContent=valor;

      }
    }
  }
  
  validarFilaError(index: number): void {
    console.log("validarFilaError",index);
    setTimeout(() => {
      const fila = document.querySelector(`tr[data-index="${index}"]`);
      if (!fila) return;
      
      const tieneError = fila.querySelector(".bkg-rojo") !== null;
      
      if (tieneError) {
        fila.classList.remove("bkg-verde");
        fila.classList.add("bkg-amarillo");
        if (this.processedData[index]) {
          this.processedData[index].estado = "INVÁLIDO";
        }
      } else {
        fila.classList.remove("bkg-amarillo");
        fila.classList.add("bkg-verde");
        if (this.processedData[index]) {
          this.processedData[index].estado = "VÁLIDO";
        }
      }
      
      this.cdr.detectChanges();
    }, 100);
  }
  
  revertirCambio(index: number, campo: string, valorOrg: string): void {
    console.log("Revertir cambio: ",index, campo, valorOrg);
    const input = document.querySelector(
      `textarea[data-index="${index}"][data-field="${campo}"]`
    ) as HTMLTextAreaElement;
    
    if (input) {
      console.log("cambio true: ", valorOrg);

      input.value = valorOrg;
      // this.actualizarDato(index, campo, valorOrg);
    }
  }
  
  // ========== ELIMINAR REGISTRO ==========
  
  eliminarRegistro(index: number, fileName: string): void {
    this.dialogConfig = {
      message: '¿Estás seguro de eliminar este registro?',
      validacion: 'Esta acción no se puede deshacer.',
      pregunta: '',
      inputValue: '',
      showInput: false,
      callback: (result: boolean) => {
        this.showDialogModal = false;
        if (result) {
          this.eliminarRegistroConfirmado(index, fileName);
        }
      }
    };
    this.showDialogModal = true;
  }
  
  eliminarRegistroConfirmado(index: number, fileName: string): void {
    if (this.resultadosPorArchivo[fileName]) {
      this.resultadosPorArchivo[fileName].splice(index, 1);
      this.resultadosPorArchivo[fileName].forEach((item, i) => {
        item.__index = i;
      });
    }
    
    const indiceGlobal = this.processedData.findIndex(item => 
      item.__index === index && item.__file === fileName
    );
    
    if (indiceGlobal !== -1) {
      this.processedData.splice(indiceGlobal, 1);
    }
    
    this.processedData.forEach((item, i) => {
      item.__index = i;
    });
    
    this.displayResults(this.resultadosPorArchivo[fileName]);
  }
  
  // ========== DIÁLOGO ==========
  
  dialogAceptar(): void {
    if (this.dialogConfig.callback) {
      this.dialogConfig.callback(true, this.dialogConfig.inputValue);
    }
  }
  
  dialogCancelar(): void {
    if (this.dialogConfig.callback) {
      this.dialogConfig.callback(false);
    }
  }
  
  // ========== FILTROS Y PAGINACIÓN ==========
  
  aplicarFiltros(): void {
    if (!this.processedData.length) return;
    
    this.filteredData = this.processedData.filter(item => {
      let matchesSearch = true;
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        matchesSearch = Object.values(item).some(value => {
          if (value === null || value === undefined) return false;
          return value.toString().toLowerCase().includes(searchLower);
        });
      }
      
      let matchesStatus = true;
      if (this.statusFilter) {
        if (this.statusFilter === 'valid') {
          matchesStatus = item.estado === "VÁLIDO";
        } else if (this.statusFilter === 'invalid') {
          matchesStatus = item.estado === "INVÁLIDO";
        } else if (this.statusFilter === 'repeat') {
          matchesStatus = item.estado === "REPETIDO";
        }
      }
      
      let matchesTipoPlaza = true;
      if (this.tipoPlazaFilter) {
        matchesTipoPlaza = item.tipo_plaza === this.tipoPlazaFilter;
      }
      
      if (this.cantidadRegistros) {
        this.rowsPerPage = parseInt(this.cantidadRegistros);
      } else {
        this.rowsPerPage = this.totalRegistrosArchivo;
      }
      
      return matchesSearch && matchesStatus && matchesTipoPlaza;
    });
    
    this.currentPage = 1;
  }
  
  sortTable(field: string): void {
    if (!this.filteredData.length) return;
    
    if (!this.sortDirection[field]) {
      this.sortDirection[field] = 'asc';
    } else {
      this.sortDirection[field] = this.sortDirection[field] === 'asc' ? 'desc' : 'asc';
    }
    
    this.filteredData.sort((a, b) => {
      let valueA = a[field];
      let valueB = b[field];
      
      if (valueA === null || valueA === undefined) valueA = '';
      if (valueB === null || valueB === undefined) valueB = '';
      
      if (typeof valueA === 'string') valueA = valueA.toLowerCase();
      if (typeof valueB === 'string') valueB = valueB.toLowerCase();
      
      if (valueA < valueB) return this.sortDirection[field] === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.sortDirection[field] === 'asc' ? 1 : -1;
      return 0;
    });
    
    this.currentPage = 1;
  }
  
  goToPrevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }
  
  goToNextPage(): void {
    const totalPages = this.getTotalPaginas();
    if (this.currentPage < totalPages) {
      this.currentPage++;
    }
  }
  
  getTotalPaginas(): number {
    if (this.filteredData.length === 0 || this.rowsPerPage === 0) return 0;
    return Math.ceil(this.filteredData.length / this.rowsPerPage);
  }
  
  getTextoPaginacion(): string {
    if (this.filteredData.length === 0) {
      return 'No hay registros';
    }
    
    const inicio = ((this.currentPage - 1) * this.rowsPerPage) + 1;
    const fin = Math.min(this.currentPage * this.rowsPerPage, this.filteredData.length);
    const total = this.filteredData.length;
    
    return `Mostrando ${inicio} - ${fin} de ${total} registros`;
  }
  
  // ========== DESCARGAS ==========
  async downloadExcel(addDatos: boolean = false): Promise<void> {
    if (addDatos && (!this.processedData || this.processedData.length === 0)) {
      alert('No hay datos procesados para descargar.');
      return;
    }
    
    let datosAexcel = {};
    if (addDatos) {
      datosAexcel = {
        datos: this.processedData,
        timestamp: new Date().getTime(),
        tipo:"plazasMasivas"
      };
    } else {
      datosAexcel = {
        datos: [],
        timestamp: new Date().getTime()
      };
    }
    
    this.isLoadingDownload = true;
    
    try {
      const response = await fetch(`${this.apiUrl}/download-excel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': this.apiService.getCsrfToken(),
          'Accept': 'application/json'
        },
        body: JSON.stringify(datosAexcel)
      });
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LAYOUT_ALTA_PROCESADO_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      alert(`¡Archivo descargado exitosamente! (${this.processedData.length} registros)`);
      
    } catch (error) {
      console.error('Error:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      this.isLoadingDownload = false;
    }
  }

  // Layout cargar tabla
  async downloadExcelLayoutCargarTabla(addDatos: boolean = false): Promise<void> {
    if (addDatos && (!this.processedData || this.processedData.length === 0)) {
      alert('No hay datos procesados para descargar.');
      return;
    }
    console.log(this.organoSeleccionado);
    let datosAexcel = {};
    if (addDatos) {
      datosAexcel = {
        datos: this.processedData,
        timestamp: new Date().getTime(),
        tipoOrgano:this.organoSeleccionado,
        tipo:"plazasMasivas",
      };
    } else {
      datosAexcel = {
        datos: [],
        timestamp: new Date().getTime(),
        tipoOrgano:this.organoSeleccionado
      };
    }
    console.log("datosAexcel");
    console.log(datosAexcel);
    
    this.isLoadingDownload = true;
    
    try {
      const response = await fetch(`${this.apiUrl}/descargar-layout-cargar-tabla`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': this.apiService.getCsrfToken(),
          'Accept': 'application/json'
        },
        body: JSON.stringify(datosAexcel)
      });
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LAYOUT_CARGAR_TABLA_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);//*/
      
      alert(`¡Archivo descargado exitosamente! (${this.processedData.length} registros)`);
      
    } catch (error) {
      console.error('Error:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      this.isLoadingDownload = false;
    }
  }
  
  downloadJSON(): void {
    if (!this.processedData.length) return;
    
    const jsonString = JSON.stringify(this.processedData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'layout_alta_processed.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  // ========== MODALES ==========
  
  verListadoArchivos(): void {
    this.showResumenModal = true;
  }
  
  cerrarModalResumen(): void {
    this.showResumenModal = false;
  }
  
  verModalCatalogos(): void {
    this.showCatalogosModal = true;
  }
  
  getArchivosProcesados(): string[] {
    return Object.keys(this.resultadosPorArchivo);
  }
  
  // ========== CATÁLOGOS ==========
  
  agregarCatalogo(): void {
    console.log('Agregar catálogo:', this.nuevoCatalogo);
    alert('Funcionalidad de agregar catálogo en desarrollo');
    this.nuevoCatalogo = { nombre: '', nombreHoja: '', descripcion: '' };
    this.showCatalogosModal = false;
  }
  
  // ========== UTILIDADES ==========
  
  // private getCsrfToken(): string {
  //   const metaTag = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
  //   return metaTag ? metaTag.content : '';
  // }
  
  private initializeColumnVisibility(): void {
    this.tableHeaders.forEach(header => {
      this.columnVisibility[header.key] = true;
    });
  }
  
  private obtenerOrganizaciones(): void {
    // Simular obtención de organizaciones
    this.organizaciones = [
      { organization_id: '1', name: 'Organización 1' },
      { organization_id: '2', name: 'Organización 2' },
      { organization_id: '3', name: 'Organización 3' }
    ];
  }
  
  private obtenerCatalogosEstaticos(): void {
    // Simular catálogos estáticos
    this.catalogosSelect = {
      nomina: [ ],
      regimen: [ ],
      zona_economica: [ ],
      tipo_puesto: [ ],
      tipo_ocupacion: [ ],
      tipo_funcion: [ ],
      tipo_estrategico: [ ],
      tipo_nivel: [],
      base_salario: [],
    };
  }
  
  private procesarCatalogos(catalogs: any): void {
    if (catalogs) {
      // Procesar catálogos recibidos del servidor
      Object.keys(catalogs).forEach(key => {
        if (typeof catalogs[key] === 'object') {
          if (Array.isArray(catalogs[key])) {
            this.catalogosSelect[key] = catalogs[key].map(item => ({
              value: item.toString(),
              text: item.toString()
            }));
          } else {
            this.catalogosSelect[key] = Object.entries(catalogs[key]).map(([value, text]) => ({
              value: value,
              text: text as string
            }));
          }
        }
      });
    }
  }
  
  private validarArchivosExitosos(): void {
    const todosCorrectos = this.archivosCargados.every((_, index) => {
      const fileName = this.archivosCargados[index].name;
      const registros = this.resultadosPorArchivo[fileName];
      if (!registros) return false;
      
      return !registros.some(item => 
        Object.values(item).some(val => 
          typeof val === 'string' && val.includes("| Error:")
        )
      );
    });
    
    this.showAddPlazas = todosCorrectos;
  }
  
  // ========== HELPERS ==========
  
  celdaTieneError(valor: any): boolean {
    return String(valor || '').includes("| Error:");
  }
  
  getValorLimpio(valor: any): string {
    if (this.celdaTieneError(valor)) {
      const partes = String(valor).split(" | Error:");
      return partes[0];
    }
    return String(valor || '');
  }
  
  getEstadoBadgeClass(estado: string): string {
    switch (estado) {
      case 'VÁLIDO': return 'badge bg-success';
      case 'INVÁLIDO': return 'badge bg-danger';
      case 'REPETIDO': return 'badge bg-warning text-dark';
      default: return 'badge bg-secondary';
    }
  }
  
  getTipoPlazaBadgeClass(tipoPlaza: string): string {
    switch (tipoPlaza) {
      case 'permanente': return 'badge bg-primary';
      case 'eventual': return 'badge bg-warning text-dark';
      default: return 'badge bg-secondary';
    }
  }
  
  toggleColumnsVisibility(): void {
    alert('Funcionalidad de mostrar/ocultar columnas en desarrollo');
  }

  // Agrega esta propiedad para almacenar catálogos dinámicos
private catalogosDinamicos: { [key: string]: any[] } = {};

// Método para obtener catálogo desde el servidor
async obtenerCatalogoDesdeServidor(campo: string, valorUnidad: string): Promise<any[]> {
  try {
    const formData = new FormData();
    formData.append('tb', campo);  // 'unidad_2'
    formData.append('valor1', valorUnidad);  // valor de la unidad
    const response = await fetch(`${this.apiUrl}/getCatalogo`, {
      method: 'POST',
      headers: {
        'X-CSRF-TOKEN': this.apiService.getCsrfToken(),
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: formData
    });
    
    const result = await response.json();
    // console.log("result obtenerCatalogoDesdeSrv...");
    // console.log(result);
    return result.datos || [];
  } catch (error) {
    console.error(`Error al obtener catálogo ${campo}:`, error);
    return [];
  }
}

// Método para inicializar catálogos cuando hay errores
async inicializarCatalogosConErrores(): Promise<void> {
  // Buscar todas las filas que tengan errores en unidad_2
  for (let i = 0; i < this.processedData.length; i++) {
    const item = this.processedData[i];
    
    if (this.celdaTieneError(item.unidad_2)) {
      const valorUnidad = item.unidad;
      const cacheKey = `unidad_2_${valorUnidad}`;
      // Si no tenemos el catálogo en cache, lo obtenemos
      if (!this.catalogosDinamicos[cacheKey]) {
        const catalogo = await this.obtenerCatalogoDesdeServidor('unidad_2', valorUnidad);
        this.catalogosDinamicos[cacheKey] = catalogo;
      }
    }
    
    if (this.celdaTieneError(item.nivel) ) {
      console.log("iniCataConErroresSelect: ", " - ", !this.catalogosSelect['nivel']);
      if (!this.catalogosDinamicos["nomina"]) {
        const catalogo = await this.obtenerCatalogoDesdeServidor('nivel',"");
        this.catalogosSelect['nivel']=catalogo;
        this.catalogosDinamicos["nivel"] = catalogo;
      }
    }
  }
}

// Método para obtener las opciones de unidad_2 según el item
getOpcionesUnidad2(item: RegistroPlaza): any[] {
  if (!this.celdaTieneError(item.unidad_2)) {
    return this.organizaciones; // Retorna las organizaciones por defecto
  }
  const valorUnidad = item.unidad;
  const cacheKey = `unidad_2_${valorUnidad}`;
  
  return this.catalogosDinamicos[cacheKey] || this.organizaciones;
}
/*
getOpcionesNivel(item: RegistroPlaza): any[] {
  if (!this.celdaTieneError(item.nivel)) {
    console.log(item.plaza,"getOpNivel - celdaTieneError: ",item.nivel);
    console.log(this.catalogosSelect['nivel']);
    console.log(!this.celdaTieneError(item.nivel));
    return this.catalogosSelect['nivel']; // Retorna los niveles por defecto
  }
  // return this.catalogosSelect['nivel'];
  return this.catalogosDinamicos["nivel"];
}//*/


public opcionesNivelCache = new WeakMap<RegistroPlaza, any[]>();
public isLoadingCatalogos = false;
public catalogosCargados = false; 

trackByGradeId(index: number, org: any): any {
  return org.grade_id || index;
}
getOpcionesNivel(item: RegistroPlaza): any[] {
  
  // 1. Verificar si ya tenemos cache para este item
  if (this.opcionesNivelCache.has(item)) {
    return this.opcionesNivelCache.get(item) || []; // ← Siempre retornar array
  }
  
  // 2. Si el catálogo ya está cargado, usar el cache global
  if (this.catalogosCargados && this.catalogosSelect['nivel']) {
    const opciones = this.catalogosSelect['nivel'];
    this.opcionesNivelCache.set(item, opciones);
    return opciones || []; // ← Asegurar array
  }
  
  // 3. Si no tiene error, retornar array vacío (se llenará después)
  if (!this.celdaTieneError(item.nivel) && !this.isLoadingCatalogos) {
    // Iniciar carga en segundo plano
    this.cargarCatalogosEnBackground();
    return []; // ← Array vacío explícito
  }
  
  // 4. Retornar lo que tengamos disponible
  const opciones = this.catalogosDinamicos["nomina"] || this.catalogosSelect['nivel'] || [];
  this.opcionesNivelCache.set(item, opciones);
  
  // console.log(opciones);
  return opciones; // ← Ya es array
}


// Cargar catálogos en segundo plano
private async cargarCatalogosEnBackground(): Promise<void> {
  if (this.isLoadingCatalogos || this.catalogosCargados) return;
  
  this.isLoadingCatalogos = true;
  
  try {
    const catalogo = await this.obtenerCatalogoDesdeServidor('nivel', '');
    this.catalogosSelect['nivel'] = catalogo;
    this.catalogosCargados = true;
    
    // Limpiar cache para forzar actualización
    this.opcionesNivelCache = new WeakMap();
    
    // Actualizar vista
    this.cdr.markForCheck();
  } catch (error) {
    console.error('Error cargando catálogo:', error);
  } finally {
    this.isLoadingCatalogos = false;
  }
}

// Método para forzar recarga de catálogos
async recargarCatalogos(): Promise<void> {
  this.opcionesNivelCache = new WeakMap();
  this.catalogosCargados = false;
  await this.cargarCatalogosEnBackground();
}


  // Actualiza onSelectChang para unidad_2
  async onSelectChange(event: Event, index: number, campo: string, item: RegistroPlaza): Promise<void> {
    const select = event.target as HTMLSelectElement;
    var nuevoValor = select.value;
    const valorOrg = select.dataset['orgvalue'];
    console.log("select", campo);
    console.log(select);
    if (nuevoValor === valorOrg) return;
    
    if (campo === 'unidad_2') {
      const nuevoValor = select.options[select.selectedIndex].text;
      // Solo cambiar celda exitosa y validar fila para unidad_2
      this.cambiarCeldaExitosa(this.getGlobalIndex(index), campo, nuevoValor, 'select');
      this.validarFilaError(this.getGlobalIndex(index));
      this.actualizarDato(this.getGlobalIndex(index), campo, nuevoValor);
    } else if (['zona_economica', 'tipo_puesto', 'tipo_ocupacion', 'tipo_funcion', 'tipo_estrategico'].includes(campo)) {
      // if(campo == "zona_economica") nuevoValor = select.options[select.selectedIndex].text;

      // this.actualizarDato(this.getGlobalIndex(index), campo, nuevoValor);
      await this.validarCampoConSelect(index, campo, nuevoValor, item, valorOrg || '');
    }else{
      if(campo == "nivel") nuevoValor = select.options[select.selectedIndex].text;
      else if (campo == "regimen") nuevoValor = nuevoValor;

      console.log("select normal", campo, " valor ",nuevoValor);
      this.actualizarDato(this.getGlobalIndex(index), 'campo', nuevoValor);
      this.cambiarCeldaExitosa(this.getGlobalIndex(index), campo, nuevoValor, "select");
      this.validarFilaError(this.getGlobalIndex(index)); 
    }
  }

  async agregarPlazas(){
    // console.log("Agregar",this.processedData.length);
    // console.log(this.resultadosPorArchivo);
    const todosLosResultados = Object.values(this.resultadosPorArchivo).flat();
    const resultadosConOrigen = Object.entries(this.resultadosPorArchivo)
    .flatMap(([archivo, items]) => 
        items.map(item => ({
            ...item,
            archivoOrigen: archivo
        }))
    );
    
    // Mapa para contar repeticiones
    const mapaPlazas:any = {};
    
    resultadosConOrigen.forEach(item => {
        const plaza = item.plaza;
        
        if (!mapaPlazas[plaza]) {
            mapaPlazas[plaza] = {
                plaza: plaza,
                count: 0,
                archivos: new Set(),
                items: []
            };
        }
        
        mapaPlazas[plaza].count++;
        mapaPlazas[plaza].archivos.add(item.archivoOrigen);
        mapaPlazas[plaza].items.push(item);
    });
    
    // Filtrar y formatear resultados
    const plazasRepetidas = Object.values(mapaPlazas)
    .filter(info => (info as any).count > 1)
    .map(info => {
        const plazaInfo = info as any;
        return {
            plaza: plazaInfo.plaza,
            cantidad: plazaInfo.count,
            archivos: Array.from(plazaInfo.archivos),
            ubicaciones: plazaInfo.items.map((item: any) => ({
                archivo: item.archivoOrigen,
                codigo_inteligente: item.codigo_inteligente,
                denominacion: item.denominacion,
                nivel: item.nivel,
                fecha_inicio: item.fecha_inicio,
                fecha_fin: item.fecha_fin,
                estado: item.estado
            }))
        };
    });
    // Mostrar resultados
    // console.log(`Total de registros: ${todosLosResultados.length}`);
    // console.log(todosLosResultados);
    // console.log(`Plazas únicas: ${Object.keys(mapaPlazas).length}`);
    if (plazasRepetidas.length > 0) {
    console.log('=== RESUMEN DE PLAZAS REPETIDAS ===');
      console.log(`Plazas repetidas: ${plazasRepetidas.length}`);
      console.log(plazasRepetidas);
        console.log('\n=== DETALLE DE PLAZAS REPETIDAS ===');
        plazasRepetidas.forEach((plaza, i) => {
            console.log(`\n${i+1}. Plaza: ${plaza.plaza} (${plaza.cantidad} veces)`);
            console.log(`   En archivos: ${plaza.archivos.join(' y ')}`);
        });
    }else{
      const formData = new FormData();
      formData.append('plazas', JSON.stringify(todosLosResultados));
      
      const response = await fetch(`${this.apiUrl}/plazas/agregar`, {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': this.apiService.getCsrfToken(),
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: formData
      });
      console.log("result");
      const result = await response.json();
      console.log(result);
    }
  }

  mostrarModalArchivos:boolean = false;
  abrirGestorArchivos() {
    this.mostrarModalArchivos = true;
    // this.infoArchivoService.limpiarEstado();
    // this.pdfUrl = null;
    // this.flagVerPdf = false
  }
  mostrarSolicitud(){
  }
  
  cerrarGestorArchivos() {
    this.mostrarModalArchivos = false;
  }
  
  base64PDF:string = '';
  onArchivosActualizados(archivos: any[]) {
    this.archivosAdjuntos = archivos.length;
    this.cdr.detectChanges();// Forzar la detección de cambios manualmente
  }
  private subscription: any;
  private inicializarSuscripciones() {
    this.suscripcionArchivos = this.infoArchivoService.archivoProcesado$.subscribe({ //Recibe datos del PDF
      next: (datosArchivo) => {
        console.log('Recibiendo datos del servicio_infoArchivos: ', datosArchivo);
        if (datosArchivo) {
          this.procesarArchivoRecibido(datosArchivo);
        } else {
          console.log('Sin Archivos infoArchivos');
        }
      },
      error: (error) => {
        this.erroresArchivoPdf = 'Error en la comunicación con el servicio de archivos';
        console.error(`{this.erroresArchivoPdf}`, error);
      }
    });
    
    // Suscripción para errores
    this.suscripcionErrores = this.infoArchivoService.error$.subscribe({
      next: (error) => {
        if (error) {
          console.error('Error recibido del servicio:', error);
          this.erroresArchivoPdf = error;
          setTimeout(() => this.erroresArchivoPdf = null, 5000);
        }
      }
    });
  }
  procesarArchivoRecibido(datosArchivo: any) {
    console.log('🔄 Procesando archivo en el padre...');
    console.log('📄 Nombre:', datosArchivo.nombreArchivo);
    console.log('📦 Tamaño:', datosArchivo.tamañoKB, 'KB');
    console.log('🔧 Extensión:', datosArchivo.extension);
    console.log('📝 Tipo MIME:', datosArchivo.tipoMIME);
    console.log('💾 Base64 length:', datosArchivo.contenidoBase64?.length);
    this.base64PDF = datosArchivo.contenidoBase64;
    // Guardar en variable local
    this.ultimoArchivoProcesado = datosArchivo;
    
    // Forzar detección de cambios para actualizar la vista
    this.cdr.detectChanges();
    
    // Aquí puedes guardar en base de datos
    // this.guardarEnBaseDeDatos(datosArchivo);
    
    this.datosPdf = datosArchivo;

    console.log('✅ Archivo procesado exitosamente en el padre');
  }
  verDtsPdf(){
    console.log("PDF:",
    this.datosPdf);
  }


  enviarTemporal(){
    this.enviarTemporalfn();
    this.btnLimpiarPlazas = false;
  }

  btnLimpiarPlazas:boolean=false;
  // Enviar datos a tabla temporal
  async enviarTemporalfn() {
  console.log("Enviar datos a tabla temporal", `${this.apiUrl}/excel/validarTabla`);
  
  try {
    // const formData = new FormData(); // Asegúrate de poner los paréntesis ()
    // formData.append('valor1', "asd");

    const resValidacionTbTemp = await fetch(`${this.apiUrl}/excel/validarTabla`, {
      method: 'GET',
      headers: {
        'X-CSRF-TOKEN': this.apiService.getCsrfToken(),
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      credentials: 'include',
      mode: 'cors'
    });

    // Validar si el servidor respondió con un error (ej: 404, 500)
    if (!resValidacionTbTemp.ok) {
      throw new Error(`Error en el servidor: ${resValidacionTbTemp.status} ${resValidacionTbTemp.statusText}`);
    }

    // En 'fetch', necesitas procesar el JSON de la respuesta para poder leerlo
    const rValTbTemp = await resValidacionTbTemp.json();
    
    console.log("**** Petición exitosa ****");
    console.log(rValTbTemp);
    if (rValTbTemp.estado == true){
      // Alerta 1: Para cuando la tabla tiene datos (Mensaje Dinámico)
      const alertaLimpiarTbTempPlazas = await this.alerta.abrir({
        titulo: '⚠️ Advertencia de Datos',
        mensaje: 'La tabla temporal ya contiene registros de plazas. ¿Deseas borrarlos todos para iniciar la nueva importación?',
        btnAceptar: 'Sí, borrar todo',
        btnCancelar: 'No, mantener'
      });
      
      if (alertaLimpiarTbTempPlazas) {
        console.log("El usuario aceptó borrar la tabla temporal");
        const formData = new FormData();
        formData.append('limpiar', "true");
        const resLPT = await fetch(`${this.apiUrl}/fn/limpiar-plazas-temporales`, {
          method: 'POST',
          headers: {
            'X-CSRF-TOKEN': this.apiService.getCsrfToken(),
            // 'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          credentials: 'include',
          body: formData,
        });

        const resLimpiar = await resLPT.json();
        console.log("**** Petición exitosa ****");
        console.log(resLimpiar);
        if (resLimpiar.limpiar == true){
          this.agregarPazasAtbTemp();
        }
        this.btnLimpiarPlazas = true;

      } else {
        console.log("El usuario canceló la operación");
      }
    
    } else {
      console.log("Tabla sin datos - Procediendo con la inserción");
      this.agregarPazasAtbTemp();
    }

  } catch (error ) {
    console.log("---- Ocurrió un error ----");
    console.error(error);
  }
}

  async agregarPazasAtbTemp(){ //select * from TB_ALTAS_PLAZAS_MASIVAS
    console.log("Entra a: agregarPazasAtbTemp");
    var addDatos = true;
    if (addDatos && (!this.processedData || this.processedData.length === 0)) {
      alert('No hay datos procesados para descargar.');
      return;
    }
    console.log(this.organoSeleccionado);
    let datosAexcel = {};
    if (addDatos) {
      datosAexcel = {
        datos: this.processedData,
        timestamp: new Date().getTime(),
        tipoOrgano:this.organoSeleccionado,
        tipo:'plazas'
      };
    } else {
      datosAexcel = {
        datos: [],
        timestamp: new Date().getTime(),
        tipoOrgano:this.organoSeleccionado
      };
    }
    console.log("datosAexcel");
    console.log(datosAexcel);
    
    this.isLoadingDownload = true;
    
    try {
      const response = await fetch(`${this.apiUrl}/fn-cargar-tabla-temp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': this.apiService.getCsrfToken(),
          'Accept': 'application/json'
        },
        body: JSON.stringify(datosAexcel)
      });
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      const resLimpiar = await response.json();
        console.log("**** Petición exitosa ****");
        console.log(resLimpiar);
        
      alert(`¡Archivo cargado exitosamente! (${this.processedData.length} registros)`);
      
    } catch (error) {
      console.error('Error:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      this.isLoadingDownload = false;
    }
    
  }


}