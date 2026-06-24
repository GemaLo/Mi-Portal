import { Component, Input, OnInit } from '@angular/core';
import { CommonModule,formatDate } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Requerimiento, BitacoraRequerimiento } from '../../../models/solicitud.model';
import { ArchivoRequerimiento } from '../../../models/archivo.model';
import { isEmpty } from 'rxjs';

@Component({
  selector: 'app-form-solicitudes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './form-solicitudes.component.html',
  styleUrl: './form-solicitudes.component.css'
})
export class FormSolicitudesComponent implements OnInit {  
  // Formulario principal
  requerimientoForm!: FormGroup;
  
  // Datos estáticos de ejemplo
  requerimientoActual: Requerimiento | null = null;
  bitacora: BitacoraRequerimiento[] = [];
  archivosAsociados: ArchivoRequerimiento[] = [];
  
  // Control de UI
  esEdicion: boolean = false;
  mostrarBitacora: boolean = true;
  cargando: boolean = false;
  
  // Opciones para selects (estáticas)
  tiposRequerimiento = [
    { value: 'INFORMACION', label: 'Información' },
    { value: 'ALTA', label: 'Alta' },
    { value: 'DOCUMENTACION', label: 'Documentación' },
    { value: 'ACCESO', label: 'Acceso' },
    { value: 'SOPORTE', label: 'Soporte' },
    { value: 'OTRO', label: 'Otro' }
  ];
  
  prioridades = [
    { value: 'ALTA', label: 'Alta', class: 'bg-danger' },
    { value: 'MEDIA', label: 'Media', class: 'bg-warning' },
    { value: 'BAJA', label: 'Baja', class: 'bg-info' },
    { value: 'URGENTE', label: 'Urgente', class: 'bg-danger text-white' }
  ];
  
  estatusList = [
    { value: 'INICIO', label: 'Inicio', class: 'bg-secondary' },
    { value: 'PENDIENTE', label: 'Pendiente', class: 'bg-secondary' },
    { value: 'EN_REVISION', label: 'En Revisión', class: 'bg-info' },
    { value: 'ASIGNADO', label: 'Asignado', class: 'bg-primary' },
    { value: 'EN_PROCESO', label: 'En Proceso', class: 'bg-warning' },
    { value: 'RESUELTO', label: 'Resuelto', class: 'bg-success' },
    { value: 'CANCELADO', label: 'Cancelado', class: 'bg-danger' },
    { value: 'RECHAZADO', label: 'Rechazado', class: 'bg-dark' }
  ];
  
  tiposArchivoReq = [
    { value: 'SOLICITUD', label: 'Solicitud' },
    { value: 'RESPUESTA', label: 'Respuesta' },
    { value: 'EVIDENCIA', label: 'Evidencia' },
    { value: 'ANEXO', label: 'Anexo' },
    { value: 'OTRO', label: 'Otro' }
  ];
  fhHoy = new Date();
  formatoFecha:string = '';
  @Input('idPersonasTemp') idPersonasTemp: number = 0;
  @Input('organoSelec') organoSeleccionado: string = "";
  
  
  fhSolicitud!: Date;
  
  constructor(
    private fb: FormBuilder
    // private modalService: NgbModal // Para implementar el modal
  ) {
    
  }
  
  ngOnInit(): void {
    console.log("idPersonasTemp", this.idPersonasTemp, "orgSelec", this.organoSeleccionado);
    this.inicializarFormulario();
    this.cargarDatosEjemplo();
    // this.fechaSolicitud();
  }
  
  fechaSolicitud(fecha:any):void{
    this.formatoFecha = formatDate(fecha, 'dd/mm/yyyy HH:mm', 'en-US');
    console.log(this.fhHoy.toLocaleDateString('es-MX'));
    const dia = String(this.fhHoy.getDate()).padStart(2, '0');
    const mes = String(this.fhHoy.getMonth() + 1).padStart(2, '0');
    const año = this.fhHoy.getFullYear();
    console.log(`${dia}/${mes}/${año}`);
  }
  inicializarFormulario(): void {
    this.requerimientoForm = this.fb.group({
      // Identificación
      folio: [{ value: '', disabled: !this.esEdicion }],
      titulo: ['', [Validators.required, Validators.maxLength(200)]],
      descripcion: ['', [Validators.maxLength(4000)]],
      
      // Clasificación
      tipoRequerimiento: ['', Validators.required],
      categoria: [''],
      prioridad: ['MEDIA', Validators.required],
      ambiente: ['PROD', Validators.required],
      
      // Fechas
      fechaSolicitud: [{ value: new Date(), disabled: true }],
      fechaLimite: [null],
      
      // Personas
      numEmpSolicita: ['', Validators.required],
      numEmpAsignado: [''],
      numEmpAutoriza: [''],
      areaSolicitante: ['', Validators.required],
      areaResponsable: [''],
      departamento: [''],
      
      // Detalles
      motivo: [''],
      observaciones: [''],
      
      // Controles de flujo
      requiereArchivo: [false],
      requiereValidacion: [false],
      esReactivacion: [false],
      
      // Tiempos
      tiempoEstimado: [null]
    });

    // console.log("this.requerimientoForm: ", this.requerimientoForm.get('fechaSolicitud')?.value);
    if ((this.requerimientoForm.get('fechaSolicitud')!.value !== null)){
      this.fhSolicitud = this.requerimientoForm.get('fechaSolicitud')?.value
    }else{
      this.fhSolicitud = this.fhHoy;
    }
    this.fechaSolicitud(this.fhSolicitud);

    // if (isEmpty(this.requerimientoForm.value.)){

    // }
  }
  
  // ==========================================
  // DATOS ESTÁTICOS DE EJEMPLO
  // ==========================================
  cargarDatosEjemplo(): void {
    // Requerimiento de ejemplo
    this.requerimientoActual = {
      idRequerimiento: 1,
      folio: 'REQ-SSPC-2026-001',
      titulo: 'Solicitud de alta de usuarios',
      descripcion: 'Se requiere la alta masiva de nuevos usuarios.',
      tipoRequerimiento: 'ALTA',
      categoria: 'ADMINISTRATIVO',
      prioridad: 'ALTA',
      ambiente: 'PROD',
      estatus: 'EN_PROCESO',
      fechaSolicitud: new Date('2026-06-01T10:30:00'),
      fechaLimite: new Date('2026-06-20T18:00:00'),
      fechaAtencion: null,
      numEmpSolicita: 'EMP001',
      numEmpAsignado: 'EMP005',
      numEmpAutoriza: 'EMP003',
      numEmpAtiende: null,
      areaSolicitante: 'RH solicita',
      areaResponsable: 'MOVIMIENTOS',
      departamento: 'RH',
      motivo: 'Alta de nuevos usuarios de GN',
      observaciones: 'Prioridad alta por fechas de cierre',
      resultado: null,
      requiereArchivo: true,
      requiereValidacion: true,
      esReactivacion: false,
      tiempoEstimado: 8,
      tiempoReal: null,
      archivos: this.generarArchivosEjemplo(),
      bitacora: this.generarBitacoraEjemplo(),
      createdBy: 'EMP001',
      createdAt: this.fhSolicitud,
      updatedBy: 'EMP005',
      updatedAt: new Date('2026-06-05T15:20:00')
    };
    
    this.archivosAsociados = this.requerimientoActual.archivos;
    this.bitacora = this.requerimientoActual.bitacora;
    
    // Cargar datos en el formulario
    this.cargarRequerimientoEnFormulario();
  }
  
  generarArchivosEjemplo(): ArchivoRequerimiento[] {
    return [
      {
        idReqArchivo: 1,
        idRequerimiento: 1,
        idArchivo: 100,
        tipoArchivoReq: 'SOLICITUD',
        esPrincipal: true,
        orden: 1,
        archivo: {
          idArchivo: 100,
          nombreArchivo: 'Solicitud_Proveedores.pdf',
          tipoArchivo: 'PDF',
          tamano: 245760, // 240KB
          descripcion: 'Documento formal de solicitud',
          extension: 'pdf',
          urlAcceso: '/archivos/100/solicitud.pdf',
          fechaSubida: new Date('2026-06-01T10:35:00'),
          subidoPor: 'EMP001'
        }
      },
      {
        idReqArchivo: 2,
        idRequerimiento: 1,
        idArchivo: 101,
        tipoArchivoReq: 'EVIDENCIA',
        esPrincipal: false,
        orden: 2,
        archivo: {
          idArchivo: 101,
          nombreArchivo: 'Anexo_Formatos.xlsx',
          tipoArchivo: 'EXCEL',
          tamano: 512000, // 500KB
          descripcion: 'Formatos requeridos para el llenado',
          extension: 'xlsx',
          urlAcceso: '/archivos/101/anexo.xlsx',
          fechaSubida: new Date('2026-06-02T09:15:00'),
          subidoPor: 'EMP005'
        }
      }
    ];
  }
  
  generarBitacoraEjemplo(): BitacoraRequerimiento[] {
    return [
      {
        idBitacora: 1,
        idRequerimiento: 1,
        estatusAnterior: null,
        estatusNuevo: 'PENDIENTE',
        comentario: 'Requerimiento creado',
        numEmpModifica: 'EMP001',
        fechaCambio: new Date('2026-06-01T10:30:00')
      },
      {
        idBitacora: 2,
        idRequerimiento: 1,
        estatusAnterior: 'PENDIENTE',
        estatusNuevo: 'EN_REVISION',
        comentario: 'Inicio del proceso de recopilación de layouts',
        numEmpModifica: 'EMP003',
        fechaCambio: new Date('2026-06-02T08:00:00')
      },
      {
        idBitacora: 3,
        idRequerimiento: 1,
        estatusAnterior: 'EN_REVISION',
        estatusNuevo: 'ASIGNADO',
        comentario: 'Carga de personas a tabla temporal',
        numEmpModifica: 'EMP003',
        fechaCambio: new Date('2026-06-03T10:00:00')
      },
      {
        idBitacora: 4,
        idRequerimiento: 1,
        estatusAnterior: 'ASIGNADO',
        estatusNuevo: 'EN_PROCESO',
        comentario: 'Inicio de proceso de Apis (Alta personas)',
        numEmpModifica: 'EMP005',
        fechaCambio: new Date('2026-06-05T15:20:00')
      }
    ];
  }
  
  cargarRequerimientoEnFormulario(): void {
    if (!this.requerimientoActual) return;
    
    const req = this.requerimientoActual;
    this.requerimientoForm.patchValue({
      folio: req.folio,
      titulo: req.titulo,
      descripcion: req.descripcion,
      tipoRequerimiento: req.tipoRequerimiento,
      categoria: req.categoria,
      prioridad: req.prioridad,
      ambiente: req.ambiente,
      fechaSolicitud: req.fechaSolicitud,
      fechaLimite: req.fechaLimite,
      numEmpSolicita: req.numEmpSolicita,
      numEmpAsignado: req.numEmpAsignado,
      numEmpAutoriza: req.numEmpAutoriza,
      areaSolicitante: req.areaSolicitante,
      areaResponsable: req.areaResponsable,
      departamento: req.departamento,
      motivo: req.motivo,
      observaciones: req.observaciones,
      requiereArchivo: req.requiereArchivo,
      requiereValidacion: req.requiereValidacion,
      esReactivacion: req.esReactivacion,
      tiempoEstimado: req.tiempoEstimado
    });
  }
  
  // ==========================================
  // MÉTODOS DEL FORMULARIO
  // ==========================================
  
  onSubmit(): void {
    if (this.requerimientoForm.invalid) {
      this.marcarCamposInvalidos();
      return;
    }
    
    this.cargando = true;
    
    // 🔹 AQUÍ IRÍA TU LLAMADA AL API 🔹
    /*
    if (this.esEdicion) {
      this.requerimientoService.actualizarRequerimiento(
        this.requerimientoActual!.idRequerimiento, 
        this.requerimientoForm.value
      ).subscribe({
        next: (response) => {
          this.cargando = false;
          this.mostrarMensajeExito('Requerimiento actualizado correctamente');
        },
        error: (error) => {
          this.cargando = false;
          this.mostrarMensajeError('Error al actualizar el requerimiento');
        }
      });
    } else {
      this.requerimientoService.crearRequerimiento(
        this.requerimientoForm.value
      ).subscribe({
        next: (response) => {
          this.cargando = false;
          this.mostrarMensajeExito('Requerimiento creado correctamente');
          this.requerimientoActual = response;
          this.bitacora = response.bitacora;
        },
        error: (error) => {
          this.cargando = false;
          this.mostrarMensajeError('Error al crear el requerimiento');
        }
      });
    }
    */
    
    // Simulación de carga
    setTimeout(() => {
      this.cargando = false;
      console.log('Formulario enviado:', this.requerimientoForm.value);
      alert('✅ Requerimiento guardado correctamente (simulación)');
    }, 1500);
  }
  
  marcarCamposInvalidos(): void {
    Object.keys(this.requerimientoForm.controls).forEach(key => {
      const control = this.requerimientoForm.get(key);
      if (control?.invalid) {
        control.markAsTouched();
      }
    });
  }
  
  // ==========================================
  // MÉTODOS PARA ARCHIVOS
  // ==========================================
  
  verArchivo(archivo: ArchivoRequerimiento): void {
    //  LLAMADA PARA OBTENER EL ARCHIVO
    /*
    this.archivoService.obtenerArchivo(archivo.idArchivo).subscribe({
      next: (data) => {
        // Abrir modal con la información del archivo
        this.modalService.open(ModalArchivoComponent, {
          size: 'lg',
          data: { archivo: data }
        });
      },
      error: (error) => {
        console.error('Error al obtener el archivo:', error);
      }
    });
    */
    
    // Simulación
    console.log('Ver archivo:', archivo);
    alert(`📄 Visualizando archivo:\n${archivo.archivo?.nombreArchivo}\n${archivo.archivo?.descripcion}`);
  }
  
  descargarArchivo(archivo: ArchivoRequerimiento): void {
    // 🔹 AQUÍ IRÍA LA LLAMADA PARA DESCARGAR EL ARCHIVO 🔹
    /*
    this.archivoService.descargarArchivo(archivo.idArchivo).subscribe({
      next: (blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = archivo.archivo?.nombreArchivo || 'archivo';
        link.click();
      },
      error: (error) => {
        console.error('Error al descargar el archivo:', error);
      }
    });
    */
    
    // Simulación
    console.log('Descargar archivo:', archivo);
    alert(`⬇️ Descargando: ${archivo.archivo?.nombreArchivo}`);
  }
  
  // ==========================================
  // UTILIDADES
  // ==========================================
  
  getColorEstatus(estatus: string): string {
    const found = this.estatusList.find(e => e.value === estatus);
    return found ? found.class : 'bg-secondary';
  }
  
  getLabelEstatus(estatus: string): string {
    const found = this.estatusList.find(e => e.value === estatus);
    return found ? found.label : estatus;
  }
  
  getColorPrioridad(prioridad: string): string {
    const found = this.prioridades.find(p => p.value === prioridad);
    return found ? found.class : 'bg-secondary';
  }
  
  getLabelPrioridad(prioridad: string): string {
    const found = this.prioridades.find(p => p.value === prioridad);
    return found ? found.label : prioridad;
  }
  
  getTipoArchivoLabel(tipo: string): string {
    const found = this.tiposArchivoReq.find(t => t.value === tipo);
    return found ? found.label : tipo;
  }
  
  formatearTamanio(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
  
  // Placeholders para mensajes
  mostrarMensajeExito(mensaje: string): void {
    // Implementar toast/alert de éxito
    console.log('✅ Éxito:', mensaje);
  }
  
  mostrarMensajeError(mensaje: string): void {
    // Implementar toast/alert de error
    console.error('❌ Error:', mensaje);
  }
  
  // Para controlar edición
  activarEdicion(): void {
    this.esEdicion = true;
    this.requerimientoForm.enable();
    // Deshabilitar campo folio (no editable)
    this.requerimientoForm.get('folio')?.disable();
  }
  
  cancelarEdicion(): void {
    this.esEdicion = false;
    this.requerimientoForm.disable();
    this.cargarRequerimientoEnFormulario();
  }
}
