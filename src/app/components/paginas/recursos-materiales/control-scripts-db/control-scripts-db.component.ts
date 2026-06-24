import { Component, OnInit,ChangeDetectorRef  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../../../services/api.service';
import { InfoArchivoService } from '../../../../services/info-archivo.service';

import { DatosPdf } from '../../../../interfaces/datos-pdf.interface';

import { ArchivosDbComponent } from '../../../modals/archivos-db/archivos-db.component'; 

import { Subscription } from 'rxjs';

export interface ScriptVersion {
  version: string;
  contenido: string;
  updated_at: Date;
  created_by: string;
  entorno: string;
  cambios: string;
  id_archivo?: number;
  detalle:DetalleScript;
}

export interface DetalleScript{
created_at: Date;
created_by: string;
entorno: string;
id_detalle_script: number;
ip: string;
num_emp_solicita: string;
puerto: string;
responsable: string;
usuario_ingresa: string;

}

export interface ScriptDB {
  id: number;
  nombre: string;
  tipo: 'VISTA' | 'FUNCION' | 'TABLA' | 'PROCEDIMIENTO' | 'TRIGGER';
  descripcion: string;
  contenido: string;
  version_actual: string;
  estado: 'BORRADOR' | 'PENDIENTE' | 'EJECUTADO' | 'FALLIDO' | 'ARCHIVADO';
  dependencias: string; // Nombres de objetos de los que depende
  etiquetas: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  fechaUltimaEjecucion?: Date;
  resultadoEjecucion?: string;
  logsError?: string;
  tiempoEjecucion?: number; // en milisegundos
  entorno: 'DEV' | 'QA' | 'PROD';
  esCritico: boolean;
  script_versiones: ScriptVersion[];
}



@Component({
  selector: 'app-control-scripts-db',
  imports: [CommonModule, FormsModule,ArchivosDbComponent],
  templateUrl: './control-scripts-db.component.html',
  styleUrl: './control-scripts-db.component.css'
})
export class ControlScriptsDbComponent implements OnInit {
  scripts: ScriptDB[] = [];
  detalleScript: DetalleScript[] = [];
  filteredScripts: ScriptDB[] = [];
  
  // Filtros
  filtroBusqueda: string = '';
  filtroTipo: string = '';
  filtroEstado: string = '';
  filtroEntorno: string = '';
  filtroEtiqueta: string = '';
  
  // Modal controls
  showScriptModal: boolean = false;
  showDeleteModal: boolean = false;
  showDetailModal: boolean = false;
  showHistoryModal: boolean = false;
  showDependenciesModal: boolean = false;
  
  editingScript: ScriptDB | null = null;
  deletingScriptId: number | null = null;
  selectedScript: ScriptDB | null = null;
  selectedVersion: ScriptVersion | null = null;
  selectedDetalle: DetalleScript | null = null;
  datosPdf: DatosPdf | null = null;
  
  mostrarModalArchivos: boolean = false;
  archivosAdjuntos: number = 0;
  idVersionTemporal: number = 123; // ID temporal, esto vendría del backend

  // Form data
  formData: any = {
    nombre: '',
    tipo: 'VISTA',
    descripcion: '',
    contenido: '',
    dependencias: '',
    etiquetas: '',
    entorno: 'DEV',
    esCritico: false,
    estado: 'BORRADOR',
    detalle:[]
  };
  
  // Tipos y estados disponibles
  tiposScript = ['VISTA', 'FUNCION', 'TABLA', 'PROCEDIMIENTO', 'TRIGGER','PAQUETE'];
  estadosScript = ['BORRADOR', 'PENDIENTE', 'EJECUTADO', 'FALLIDO', 'ARCHIVADO'];
  entornos = ['DEV', 'QA', 'PROD'];
  
  // Estadísticas
  estadisticas = {
    total: 0,
    porTipo: {} as any,
    porEstado: {} as any,
    ejecutadosExito: 0,
    ejecutadosFallo: 0,
    tiempoPromedio: 0
  };

  // Archivos
  ultimoArchivoProcesado: any = null;
  erroresArchivoPdf: string | null = null;

  flagVerPdf: boolean = false
  private suscripcionArchivos: Subscription | null = null;
  private suscripcionErrores: Subscription | null = null;

  constructor(private http: HttpClient, 
    private apiService: ApiService,private cdr: ChangeDetectorRef, private infoArchivoService: InfoArchivoService,private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    // this.aplicarFiltros();

    this.cargarDatos();
    // this.calcularEstadisticas();
    this.inicializarSuscripciones();
  }

  public mostrarDts(){
    this.inicializarSuscripciones();
  }
  private subscription: any;
  private inicializarSuscripciones() {
    this.suscripcionArchivos = this.infoArchivoService.archivoProcesado$.subscribe({ //Recibe datos del PDF
      next: (datosArchivo) => {
        // console.log('Recibiendo datos del servicio_infoArchivos: ', datosArchivo);
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
  
  // Crear Data URI
  pdfUrl!: SafeResourceUrl;

  // Mostrar PDF
  base64PDF= '';
  mostrarPDF(){
    const pdfData = `data:application/pdf;base64,${this.base64PDF}`;
    // Sanitizar URL
    this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(pdfData);
    this.flagVerPdf = true;
  }
  // ==========================================
  // PROCESAR ARCHIVO RECIBIDO
  // ==========================================
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
    this.guardarEnBaseDeDatos(datosArchivo);
    
    this.datosPdf = datosArchivo;

    console.log('✅ Archivo procesado exitosamente en el padre');
  }
  
  // ==========================================
  // GUARDAR EN BASE DE DATOS
  // ==========================================
  guardarEnBaseDeDatos(datosArchivo: any) {
    console.log('💾 Enviando a Oracle:', {
      nombre: datosArchivo.nombreArchivo,
      tamaño: datosArchivo.tamañoBytes,
      tipo: datosArchivo.tipoMIME,
      extension: datosArchivo.extension
    });
    
    // Aquí va tu lógica para guardar en Oracle
    // this.apiService.guardarArchivo(datosArchivo).subscribe(...)
  }

  cargarDatos(){
    this.apiService.getScripts(null).subscribe({
      next: (res: any) => {
        this.scripts = res.datos;
        console.log("apiService", this.scripts);
        this.aplicarFiltros();
      },
      error: (err) => {
        console.error('Error al consultar', err);
        console.error('Error al consultar', err.error.message);
      }
    });
  }
  cargarDatosEjemplo() {

    const fechaBase = new Date('2024-01-15');
    const hoy = new Date();
    
    this.scripts = [
      {
        id: 1,
        nombre: 'sp_crear_usuario',
        tipo: 'PROCEDIMIENTO',
        descripcion: 'Procedimiento almacenado para crear nuevos usuarios en el sistema',
        contenido: `CREATE OR REPLACE PROCEDURE sp_crear_usuario(
              p_nombre VARCHAR(100),
              p_email VARCHAR(100),
              p_rol VARCHAR(50)
          )
          LANGUAGE plpgsql
          AS $$
          BEGIN
              INSERT INTO usuarios (nombre, email, rol, created_at)
              VALUES (p_nombre, p_email, p_rol, NOW());
              
              RAISE NOTICE 'Usuario % creado exitosamente', p_nombre;
          END;
          $$;`,
        version_actual: '2.1.0',
        estado: 'EJECUTADO',
        dependencias: 'usuarios',
        etiquetas: 'produccion,usuarios,seguridad',
        created_by: 'Luis David Martinez',
        created_at: new Date('2024-01-15'),
        updated_at: new Date('2024-02-20'),
        fechaUltimaEjecucion: new Date('2024-02-20'),
        resultadoEjecucion: 'Ejecutado exitosamente en PROD',
        tiempoEjecucion: 245,
        entorno: 'PROD',
        esCritico: true,
        script_versiones: [/*
          {
            version: '1.0.0',
            contenido: 'Versión inicial del procedimiento',
            updated_at: new Date('2024-01-15'),
            created_by: 'Luis D MV',
            cambios: 'Creación inicial'
          },
          {
            version: '2.0.0',
            contenido: 'Se agregó validación de email único',
            updated_at: new Date('2024-02-01'),
            created_by: 'Luis D MV',
            cambios: 'Mejora de validaciones'
          },
          {
            version: '2.1.0',
            contenido: 'Optimización de consultas y logs',
            updated_at: new Date('2024-02-20'),
            created_by: 'Luis D MV',
            cambios: 'Optimización de rendimiento'
          }//*/
        ]
      },
    /*
      {
        id: 2,
        nombre: 'v_reporte_ventas',
        tipo: 'VISTA',
        descripcion: 'Vista para reporte de ventas mensuales por producto',
        contenido: `CREATE OR REPLACE VIEW v_reporte_ventas AS
          SELECT 
              p.nombre_producto,
              SUM(v.cantidad) as total_unidades,
              SUM(v.total) as monto_total,
              DATE_TRUNC('month', v.fecha_venta) as mes
          FROM ventas v
          JOIN productos p ON v.producto_id = p.id
          GROUP BY p.nombre_producto, DATE_TRUNC('month', v.fecha_venta);`,
        version_actual: '1.0.0',
        estado: 'EJECUTADO',
        dependencias: ['ventas', 'productos'],
        etiquetas: ['reportes', 'ventas', 'analitica'],
        created_by: 'Ana Rodríguez',
        created_at: new Date('2024-01-20'),
        updated_at: new Date('2024-01-20'),
        fechaUltimaEjecucion: new Date('2024-01-20'),
        resultadoEjecucion: 'Vista creada correctamente en QA',
        tiempoEjecucion: 89,
        entorno: 'QA',
        esCritico: false,
        script_versiones: [
          {
            version: '1.0.0',
            contenido: 'Vista inicial para reportes de ventas',
            updated_at: new Date('2024-01-20'),
            created_by: 'Ana Rodríguez',
            cambios: 'Creación inicial'
          }
        ]
      },
      {
        id: 3,
        nombre: 'fn_calcular_bonificacion',
        tipo: 'FUNCION',
        descripcion: 'Función para calcular bonificación por antigüedad',
        contenido: `CREATE OR REPLACE FUNCTION fn_calcular_bonificacion(
              p_empleado_id INTEGER,
              p_anios_servicio INTEGER
          )
          RETURNS DECIMAL(10,2)
          LANGUAGE plpgsql
          AS $$
          DECLARE
              v_bonificacion DECIMAL(10,2);
          BEGIN
              IF p_anios_servicio >= 10 THEN
                  v_bonificacion := 5000;
              ELSIF p_anios_servicio >= 5 THEN
                  v_bonificacion := 2500;
              ELSE
                  v_bonificacion := 1000;
              END IF;
              
              RETURN v_bonificacion;
          END;
          $$;`,
        version_actual: '1.2.0',
        estado: 'PENDIENTE',
        dependencias: ['empleados'],
        etiquetas: ['rrhh', 'bonificaciones', 'calculos'],
        created_by: 'Roberto Sánchez',
        created_at: new Date('2024-02-01'),
        updated_at: new Date('2024-02-25'),
        entorno: 'DEV',
        esCritico: false,
        script_versiones: [
          {
            version: '1.0.0',
            contenido: 'Función básica de bonificación',
            updated_at: new Date('2024-02-01'),
            created_by: 'Roberto Sánchez',
            cambios: 'Creación inicial'
          },
          {
            version: '1.1.0',
            contenido: 'Se agregaron rangos adicionales',
            updated_at: new Date('2024-02-15'),
            created_by: 'Roberto Sánchez',
            cambios: 'Nuevos rangos de bonificación'
          },
          {
            version: '1.2.0',
            contenido: 'Optimización lógica con CASE',
            updated_at: new Date('2024-02-25'),
            created_by: 'Roberto Sánchez',
            cambios: 'Refactorización de código'
          }
        ]
      },
      {
        id: 4,
        nombre: 'tmp_datos_importacion',
        tipo: 'TABLA',
        descripcion: 'Tabla temporal para importación de datos masivos',
        contenido: `CREATE TABLE tmp_datos_importacion (
              id SERIAL PRIMARY KEY,
              registro JSONB,
              fecha_importacion TIMESTAMP DEFAULT NOW(),
              estado VARCHAR(20) DEFAULT 'PENDIENTE',
              mensaje_error TEXT
          );

          CREATE INDEX idx_tmp_estado ON tmp_datos_importacion(estado);
          CREATE INDEX idx_tmp_fecha ON tmp_datos_importacion(fecha_importacion);`,
        version_actual: '1.0.0',
        estado: 'EJECUTADO',
        dependencias: [],
        etiquetas: ['temporal', 'importacion', 'etl'],
        created_by: 'Laura Fernández',
        created_at: new Date('2024-02-10'),
        updated_at: new Date('2024-02-10'),
        fechaUltimaEjecucion: new Date('2024-02-10'),
        resultadoEjecucion: 'Tabla e índices creados exitosamente',
        tiempoEjecucion: 156,
        entorno: 'PROD',
        esCritico: true,
        script_versiones: [
          {
            version: '1.0.0',
            contenido: 'Tabla temporal para importación',
            updated_at: new Date('2024-02-10'),
            created_by: 'Laura Fernández',
            cambios: 'Creación inicial'
          }
        ]
      },
      {
        id: 5,
        nombre: 'tr_actualizar_stock',
        tipo: 'TRIGGER',
        descripcion: 'Trigger para actualizar stock después de cada venta',
        contenido: `CREATE OR REPLACE FUNCTION tr_actualizar_stock_func()
          RETURNS TRIGGER AS $$
          BEGIN
              UPDATE productos
              SET stock = stock - NEW.cantidad
              WHERE id = NEW.producto_id;
              
              RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;

          CREATE TRIGGER tr_actualizar_stock
          AFTER INSERT ON detalle_ventas
          FOR EACH ROW
          EXECUTE FUNCTION tr_actualizar_stock_func();`,
        version_actual: '1.0.0',
        estado: 'FALLIDO',
        dependencias: ['productos', 'detalle_ventas'],
        etiquetas: ['inventario', 'ventas', 'automatizacion'],
        created_by: 'Miguel Ángel Torres',
        created_at: new Date('2024-02-28'),
        updated_at: new Date('2024-02-28'),
        fechaUltimaEjecucion: new Date('2024-02-28'),
        resultadoEjecucion: 'Error: La tabla detalle_ventas no existe',
        logsError: 'ERROR: relation "detalle_ventas" does not exist\nCONTEXT: SQL statement in PL/pgSQL function',
        tiempoEjecucion: 45,
        entorno: 'DEV',
        esCritico: false,
        script_versiones: [
          {
            version: '1.0.0',
            contenido: 'Trigger para actualización automática de stock',
            updated_at: new Date('2024-02-28'),
            created_by: 'Miguel Ángel Torres',
            cambios: 'Creación inicial'
          }
        ]
      }
    */
    ];
  }

  // ========== FILTROS Y BÚSQUEDA ==========
  aplicarFiltros() {
    this.filteredScripts = this.scripts.filter(script => {
      const matchBusqueda = this.filtroBusqueda === '' || 
        script.nombre.toLowerCase().includes(this.filtroBusqueda.toLowerCase()) ||
        script.descripcion.toLowerCase().includes(this.filtroBusqueda.toLowerCase()) ||
        script.created_by.toLowerCase().includes(this.filtroBusqueda.toLowerCase());
      
      const matchTipo = this.filtroTipo === '' || script.tipo === this.filtroTipo;
      const matchEstado = this.filtroEstado === '' || script.estado === this.filtroEstado;
      const matchEntorno = this.filtroEntorno === '' || script.entorno === this.filtroEntorno;
      const matchEtiqueta = this.filtroEtiqueta === '' || script.etiquetas.includes(this.filtroEtiqueta);
      
      return matchBusqueda && matchTipo && matchEstado && matchEntorno && matchEtiqueta;
    });
    
    this.calcularEstadisticas();
  }
  limpiarFiltros() {
    this.filtroBusqueda = '';
    this.filtroTipo = '';
    this.filtroEstado = '';
    this.filtroEntorno = '';
    this.filtroEtiqueta = '';
    this.aplicarFiltros();
  }

  // ========== ESTADÍSTICAS ==========
  calcularEstadisticas() {
    this.estadisticas.total = this.filteredScripts.length;
    
    // Por tipo
    this.estadisticas.porTipo = {};
    this.tiposScript.forEach(tipo => {
      this.estadisticas.porTipo[tipo] = this.filteredScripts.filter(s => s.tipo === tipo).length;
    });
    
    // Por estado
    this.estadisticas.porEstado = {};
    this.estadosScript.forEach(estado => {
      this.estadisticas.porEstado[estado] = this.filteredScripts.filter(s => s.estado === estado).length;
    });
    
    // Ejecuciones exitosas y fallidas
    this.estadisticas.ejecutadosExito = this.filteredScripts.filter(s => s.estado === 'EJECUTADO').length;
    this.estadisticas.ejecutadosFallo = this.filteredScripts.filter(s => s.estado === 'FALLIDO').length;
    
    // Tiempo promedio de ejecución
    const scriptsConTiempo = this.filteredScripts.filter(s => s.tiempoEjecucion);
    if (scriptsConTiempo.length > 0) {
      const sumaTiempos = scriptsConTiempo.reduce((sum, s) => sum + (s.tiempoEjecucion || 0), 0);
      this.estadisticas.tiempoPromedio = sumaTiempos / scriptsConTiempo.length;
    }
  }

  // ========== CRUD DE SCRIPTS ==========
  abrirModalNuevo() {
    this.editingScript = null;
    const hoy = new Date().toISOString().split('T')[0];
    this.formData = {
      nombre: '',
      tipo: 'VISTA',
      descripcion: '',
      contenido: '',
      dependencias: '',
      etiquetas: '',
      entorno: 'DEV',
      esCritico: false,
      estado: 'BORRADOR',
      detalle:[]
    };
    this.showScriptModal = true;
  }

  abrirModalEditar(script: ScriptDB) {
    this.editingScript = script;
    
    // var scriptUltimaVersion:any = script.script_versiones?.[script.script_versiones.length - 1];
    const getUltimaVersion = script.script_versiones?.[script.script_versiones.length - 1];
    const ultimaVersionContenido = getUltimaVersion?.contenido;
    const entorno =getUltimaVersion.detalle?.entorno;
    // this.detalleScript? = getUltimaVersion.detalle;
    console.log(getUltimaVersion.detalle);

    this.formData = {
      nombre: script.nombre,
      tipo: script.tipo,
      descripcion: script.descripcion,
      contenido: ultimaVersionContenido,
      dependencias: script.dependencias,
      etiquetas: script.etiquetas,
      entorno: entorno,
      esCritico: script.esCritico,
      estado: script.estado
    };
    console.log("Entorno",entorno);
    this.showScriptModal = true;
  }

  guardarScript() {
    if (!this.formData.nombre || !this.formData.contenido) {
      alert('Por favor completa los campos requeridos');
      return;
    }

    const ahora = new Date();
    const dependenciasArray = this.formData.dependencias ? 
      this.formData.dependencias.split(',').map((d: string) => d.trim()) : [];
    const etiquetasArray = this.formData.etiquetas ? 
      this.formData.etiquetas.split(',').map((e: string) => e.trim()) : [];

    if (this.editingScript) {
      // Actualizar script existente
      const nuevaVersion = this.generarNuevaVersion(this.editingScript.version_actual);
      const nuevaVersionObj: ScriptVersion = {
        version: nuevaVersion,
        contenido: this.formData.contenido,
        entorno:this.formData.entorno,
        detalle:this.formData.detalle,
        updated_at: ahora,
        created_by: 'Usuario Actual',
        cambios: `Actualización desde v${this.editingScript.version_actual} a v${nuevaVersion}`
      };
      
      const index = this.scripts.findIndex(s => s.id === this.editingScript!.id);
      if (index !== -1) {
        this.scripts[index] = {
          ...this.editingScript,
          ...this.formData,
          dependencias: dependenciasArray,
          etiquetas: etiquetasArray,
          version_actual: nuevaVersion,
          updated_at: ahora,
          script_versiones: [...this.editingScript.script_versiones, nuevaVersionObj]
        };
      }
      alert('✅ Script actualizado correctamente');
    } else {
      // Crear nuevo script
      console.log("Guardar alta form....",this.formData);
      const nuevoScript: ScriptDB = {
        id: Math.max(...this.scripts.map(s => s.id), 0) + 1,
        nombre: this.formData.nombre,
        tipo: this.formData.tipo,
        descripcion: this.formData.descripcion,
        contenido: this.formData.contenido,
        version_actual: '1.0.0',
        estado: this.formData.estado,
        dependencias: dependenciasArray,
        etiquetas: etiquetasArray,
        created_by: 'Usuario Actual',
        created_at: ahora,
        updated_at: ahora,
        entorno: this.formData.entorno,
        esCritico: this.formData.esCritico,
        script_versiones: [
          {
            version: '1.0.0',
            contenido: this.formData.contenido,
            detalle:this.formData.detalle,
            entorno:this.formData.entorno,
            updated_at: ahora,
            created_by: 'Usuario Actual',
            cambios: 'Creación inicial'
          }
        ]
      };
      console.log("Guardar alta....",nuevoScript);
      console.log("Guardar pdf....",this.datosPdf);
      this.scripts.push(nuevoScript);
      alert('✅ Script creado correctamente');
    }
    
    this.cerrarModalScript();
    this.aplicarFiltros();
  }

  generarNuevaVersion(version_actual: string): string {
    const partes = version_actual.split('.');
    if (partes.length === 3) {
      partes[2] = (parseInt(partes[2]) + 1).toString();
      return partes.join('.');
    }
    return '1.0.0';
  }

  confirmarEliminar(id: number) {
    this.deletingScriptId = id;
    this.showDeleteModal = true;
  }

  eliminarScript() {
    if (this.deletingScriptId) {
      this.scripts = this.scripts.filter(s => s.id !== this.deletingScriptId);
      this.aplicarFiltros();
      alert('✅ Script eliminado correctamente');
      this.cerrarModalEliminar();
    }
  }

  // ========== DETALLE Y VISUALIZACIÓN ==========
  public dependenciasArray: string[] = [];
  public etiquetasArray: string[] = [];
  
  verDetalle(script: ScriptDB) {
    console.log(script.dependencias.split(","));
    this.dependenciasArray = script.dependencias ? script.dependencias.split(',') : [];
    this.etiquetasArray = script.etiquetas ? script.etiquetas.split(',') : [];
    this.selectedScript = script;
    this.showDetailModal = true;
  }
  verHistorial(script: ScriptDB) {
    this.selectedScript = script;
    this.showHistoryModal = true;
  }
  verDependencias(script: ScriptDB) {
    this.selectedScript = script;
    this.showDependenciesModal = true;
  }
  verVersion(version: ScriptVersion) {
    this.selectedVersion = version;
  }

  // ========== EJECUCIÓN SIMULADA ==========
  ejecutarScript(script: ScriptDB) {
    if (confirm(`¿Estás seguro de ejecutar el script "${script.nombre}" en ${script.entorno}?`)) {
      const inicio = performance.now();
      
      // Simular ejecución
      setTimeout(() => {
        const fin = performance.now();
        const tiempoEjecucion = Math.round(fin - inicio);
        
        // Simular éxito/fallo aleatorio para demostración
        const exito = Math.random() > 0.3; // 70% éxito
        
        const index = this.scripts.findIndex(s => s.id === script.id);
        if (index !== -1) {
          this.scripts[index].fechaUltimaEjecucion = new Date();
          this.scripts[index].tiempoEjecucion = tiempoEjecucion;
          
          if (exito) {
            this.scripts[index].estado = 'EJECUTADO';
            this.scripts[index].resultadoEjecucion = `Ejecutado exitosamente en ${tiempoEjecucion}ms`;
            this.scripts[index].logsError = undefined;
            alert(`✅ Script ejecutado exitosamente en ${tiempoEjecucion}ms`);
          } else {
            this.scripts[index].estado = 'FALLIDO';
            this.scripts[index].resultadoEjecucion = `Error durante la ejecución`;
            this.scripts[index].logsError = `ERROR: Sintaxis incorrecta en la línea 15\nTiempo de ejecución: ${tiempoEjecucion}ms`;
            alert(`❌ Error al ejecutar el script. Revisa los logs para más detalles.`);
          }
          
          this.aplicarFiltros();
        }
      }, 1000);
    }
  }

  // ========== FUNCIONES DE MODAL ==========
  cerrarModalScript() {
    this.showScriptModal = false;
    this.editingScript = null;
  }

  cerrarModalEliminar() {
    this.showDeleteModal = false;
    this.deletingScriptId = null;
  }

  cerrarModalDetalle() {
    this.showDetailModal = false;
    this.selectedScript = null;
  }

  cerrarModalHistorial() {
    this.showHistoryModal = false;
    this.selectedScript = null;
    this.selectedVersion = null;
  }

  cerrarModalDependencias() {
    this.showDependenciesModal = false;
    this.selectedScript = null;
  }

  // ========== UTILIDADES ==========
  getClassPorEstado(estado: string): string {
    switch(estado) {
      case 'EJECUTADO': return 'badge bg-success';
      case 'FALLIDO': return 'badge bg-danger';
      case 'PENDIENTE': return 'badge bg-warning text-dark';
      case 'BORRADOR': return 'badge bg-secondary';
      case 'ARCHIVADO': return 'badge bg-info text-dark';
      default: return 'badge bg-light text-dark';
    }
  }
  getIconoTipo(tipo: string): string {
    switch(tipo) {
      case 'VISTA': return '👁️';
      case 'FUNCION': return '⚙️';
      case 'TABLA': return '📊';
      case 'PROCEDIMIENTO': return '🔄';
      case 'TRIGGER': return '⚡';
      default: return '📄';
    }
  }
  getDependentScripts(scriptName: string): ScriptDB[] {
    if (!scriptName) return [];
    return this.scripts.filter(script => 
      script.dependencias && script.dependencias.includes(scriptName)
    );
  }
  // En control-scripts-db.component.ts
  analizarImpacto(script: ScriptDB) {
    const dependientes = this.getDependentScripts(script.nombre);
    if (dependientes.length > 0) {
      const mensaje = `⚠️ ADVERTENCIA DE IMPACTO\n\n` +
                      `El script "${script.nombre}" es utilizado por:\n` +
                      dependientes.map(s => `• ${s.nombre} (${s.tipo}) - v${s.version_actual}`).join('\n') +
                      `\n\n¿Estás seguro de que quieres modificarlo?\n` +
                      `Esto podría afectar a ${dependientes.length} script(s) dependiente(s).`;
      
      if (confirm(mensaje)) {
        // Aquí puedes abrir el modal de edición o realizar la acción
        this.abrirModalEditar(script);
        this.cerrarModalDependencias();
      }
    } else {
      alert(`✅ El script "${script.nombre}" no tiene dependientes. Puedes modificarlo con seguridad.`);
      this.abrirModalEditar(script);
      this.cerrarModalDependencias();
    }
  }

  abrirGestorArchivos() {
    this.mostrarModalArchivos = true;
    this.infoArchivoService.limpiarEstado();
    // this.pdfUrl = null;
    // this.flagVerPdf = false

  }
  
  cerrarGestorArchivos() {
    this.mostrarModalArchivos = false;
  }
  
  onArchivosActualizados(archivos: any[]) {
    this.archivosAdjuntos = archivos.length;
    this.cdr.detectChanges();// Forzar la detección de cambios manualmente
  }

}
