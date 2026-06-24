// frontend/src/app/components/control-de-permisos/control-de-permisos.component.ts
import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../../../../services/api.service';
import { environment } from '../../../../../../environments/environment';

// Interfaces
interface Permisos {
  vacaciones: boolean;
  sistemas: boolean;
  ficha_tecnica: boolean;
  nomina: boolean;
  reportes: boolean;
  configuracion: boolean;
  [key: string]: boolean; // Para acceso dinámico
}
interface CatPermisos {
  nombre: string;
  descripcion: string;
  activo: boolean;
}

interface Empleado {
  id: number;
  nombre: string;
  departamento: string;
  estado: string;
  iniciales: string;
  permisos: {
    vacaciones: boolean;
    sistemas: boolean;
    ficha_tecnica: boolean;
    nomina: boolean;
    reportes: boolean;
    configuracion: boolean;
    [key: string]: boolean; // Para acceso dinámico
  };
  configAvanzada?: ConfigAvanzada;
}

interface ConfigAvanzada {
  vacaciones?: {
    lectura: boolean;
    escritura: boolean;
    aprobacion: boolean;
    reportes: boolean;
  };
  sistemas?: {
    lectura: boolean;
    configuracion: boolean;
    administracion: boolean;
  };
  ficha?: {
    lectura: boolean;
    escritura: boolean;
    eliminar: boolean;
  };
  nomina?: {
    consulta: boolean;
    modificacion: boolean;
    aprobacion: boolean;
  };
  reportes?: {
    generar: boolean;
    exportar: boolean;
    avanzados: boolean;
  };
  configuracion?: {
    general: boolean;
    usuarios: boolean;
    permisos: boolean;
  };
}


interface CambioPermiso {
  empleadoId: number;
  modulo: string;
  valor: boolean;
  original?: boolean;
}

type ConfigModulo = 
  | ConfigVacaciones 
  | ConfigSistemas 
  | ConfigFicha 
  | ConfigNomina 
  | ConfigReportes 
  | ConfigConfiguracion;

  // Tipos específicos para cada módulo
interface ConfigVacaciones {
  lectura: boolean;
  escritura: boolean;
  aprobacion: boolean;
  reportes: boolean;
}

interface ConfigSistemas {
  lectura: boolean;
  configuracion: boolean;
  administracion: boolean;
}

interface ConfigFicha {
  lectura: boolean;
  escritura: boolean;
  eliminar: boolean;
}

interface ConfigNomina {
  consulta: boolean;
  modificacion: boolean;
  aprobacion: boolean;
}

interface ConfigReportes {
  generar: boolean;
  exportar: boolean;
  avanzados: boolean;
}

interface ConfigConfiguracion {
  general: boolean;
  usuarios: boolean;
  permisos: boolean;
}

interface ColumnaTabla {
  key: string;
  label: string;
  type: 'empleado' | 'text' | 'estado' | 'checkbox' | 'acciones';
  modulo?: string;
  width: string;
}

declare var $: any; // Para jQuery si lo usas

@Component({
  selector: 'app-control-de-permisos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './control-de-permisos.component.html',
  styleUrl: './control-de-permisos.component.css'
})
export class ControlDePermisosComponent implements OnInit, AfterViewInit {
  // Columnas dinámicas - vendrán de BD
  columnas: ColumnaTabla[] = [
    { 
      key: 'empleado', 
      label: 'Empleado', 
      type: 'empleado',
      width: '20%'
    },
    { 
      key: 'departamento', 
      label: 'Departamento', 
      type: 'text',
      width: '12%'
    },
    { 
      key: 'estado', 
      label: 'Estado', 
      type: 'estado',
      width: '10%'
    },
    { 
      key: 'vacaciones', 
      label: 'Vacaciones', 
      type: 'checkbox',
      modulo: 'vacaciones',
      width: '8%'
    },
    { 
      key: 'sistemas', 
      label: 'Sistemas', 
      type: 'checkbox',
      modulo: 'sistemas',
      width: '8%'
    },
    { 
      key: 'ficha_tecnica', 
      label: 'Ficha Técnica', 
      type: 'checkbox',
      modulo: 'ficha_tecnica',
      width: '10%'
    },
    { 
      key: 'nomina', 
      label: 'Nómina', 
      type: 'checkbox',
      modulo: 'nomina',
      width: '8%'
    },
    { 
      key: 'reportes', 
      label: 'Reportes', 
      type: 'checkbox',
      modulo: 'reportes',
      width: '8%'
    },
    { 
      key: 'configuracion', 
      label: 'Configuración', 
      type: 'checkbox',
      modulo: 'configuracion',
      width: '10%'
    },
    { 
      key: 'acciones', 
      label: 'Acciones', 
      type: 'acciones',
      width: '6%'
    }
  ];

  // Datos estáticos - vendrán de BD
  empleados: Empleado[] = [
    { 
      id: 1, 
      nombre: 'Ana García López', 
      departamento: 'Recursos Humanos', 
      estado: 'Activo', 
      iniciales: 'AG',
      permisos: {
        vacaciones: true,
        sistemas: false,
        ficha_tecnica: true,
        nomina: false,
        reportes: true,
        configuracion: false
      },
      configAvanzada: {
        vacaciones: { lectura: true, escritura: true, aprobacion: false, reportes: false },
        sistemas: { lectura: true, configuracion: false, administracion: false },
        ficha: { lectura: true, escritura: true, eliminar: false },
        reportes: { generar: true, exportar: true, avanzados: false }
      }
    },
    { 
      id: 2, 
      nombre: 'Carlos López Martínez', 
      departamento: 'Tecnología de la Información', 
      estado: 'Activo', 
      iniciales: 'CL',
      permisos: {
        vacaciones: true,
        sistemas: true,
        ficha_tecnica: true,
        nomina: false,
        reportes: true,
        configuracion: true
      },
      configAvanzada: {
        vacaciones: { lectura: true, escritura: true, aprobacion: true, reportes: true },
        sistemas: { lectura: true, configuracion: true, administracion: true },
        ficha: { lectura: true, escritura: true, eliminar: true },
        reportes: { generar: true, exportar: true, avanzados: true }
      }
    },
    { 
      id: 3, 
      nombre: 'María Rodríguez Sánchez', 
      departamento: 'Contabilidad y Finanzas', 
      estado: 'Activo', 
      iniciales: 'MR',
      permisos: {
        vacaciones: false,
        sistemas: false,
        ficha_tecnica: false,
        nomina: true,
        reportes: true,
        configuracion: false
      }
    },
    { 
      id: 4, 
      nombre: 'Juan Martínez Fernández', 
      departamento: 'Operaciones', 
      estado: 'Inactivo', 
      iniciales: 'JM',
      permisos: {
        vacaciones: false,
        sistemas: false,
        ficha_tecnica: false,
        nomina: false,
        reportes: false,
        configuracion: false
      }
    },
    { 
      id: 5, 
      nombre: 'Laura Hernández González', 
      departamento: 'Ventas y Marketing', 
      estado: 'Activo', 
      iniciales: 'LH',
      permisos: {
        vacaciones: true,
        sistemas: false,
        ficha_tecnica: true,
        nomina: false,
        reportes: false,
        configuracion: false
      }
    },
    { 
      id: 6, 
      nombre: 'Pedro Sánchez Ruiz', 
      departamento: 'Tecnología de la Información', 
      estado: 'Activo', 
      iniciales: 'PS',
      permisos: {
        vacaciones: false,
        sistemas: true,
        ficha_tecnica: false,
        nomina: false,
        reportes: false,
        configuracion: true
      }
    },
    { 
      id: 7, 
      nombre: 'Sofía Castro Mendoza', 
      departamento: 'Marketing', 
      estado: 'Vacaciones', 
      iniciales: 'SC',
      permisos: {
        vacaciones: true,
        sistemas: false,
        ficha_tecnica: true,
        nomina: false,
        reportes: true,
        configuracion: false
      }
    },
    { 
      id: 8, 
      nombre: 'Diego Ramírez Torres', 
      departamento: 'Recursos Humanos', 
      estado: 'Activo', 
      iniciales: 'DR',
      permisos: {
        vacaciones: true,
        sistemas: false,
        ficha_tecnica: false,
        nomina: true,
        reportes: false,
        configuracion: false
      }
    },
    { 
      id: 9, 
      nombre: 'Elena Morales Vargas', 
      departamento: 'Contabilidad y Finanzas', 
      estado: 'Activo', 
      iniciales: 'EM',
      permisos: {
        vacaciones: false,
        sistemas: false,
        ficha_tecnica: false,
        nomina: true,
        reportes: true,
        configuracion: false
      }
    },
    { 
      id: 10, 
      nombre: 'Roberto Silva Herrera', 
      departamento: 'Operaciones', 
      estado: 'Inactivo', 
      iniciales: 'RS',
      permisos: {
        vacaciones: false,
        sistemas: false,
        ficha_tecnica: false,
        nomina: false,
        reportes: false,
        configuracion: false
      }
    }
  ];

  nuevoModulo = {
    nombre: '',
    descripcion: ''
  };

  nuevoCatalogo = {
    nombre: '',
    nombreHoja: '',
    descripcion: ''
  };
  // Variables de estado
  empleadoActual: number | null = null;
  empleadoSeleccionado: Empleado | null = null;
  tablaDataTable: any;
  cambiosPendientes: Map<string, CambioPermiso> = new Map();

  // Configuración avanzada (para el modal) - datos estáticos
  configAvanzada: ConfigAvanzada = {
    vacaciones: { lectura: false, escritura: false, aprobacion: false, reportes: false },
    sistemas: { lectura: false, configuracion: false, administracion: false },
    ficha: { lectura: false, escritura: false, eliminar: false },
    reportes: { generar: false, exportar: false, avanzados: false }
  };

  // UI State
  showModal = false;
  isLoading = false;
  apiUrl = environment.apiUrl;

  // Referencias
  @ViewChild('tablaEmpleados') tablaEmpleados!: ElementRef;
  @ViewChild('selectRegistros') selectRegistros!: ElementRef;
  @ViewChild('inputBusqueda') inputBusqueda!: ElementRef;

  constructor(private http: HttpClient, private apiService: ApiService) {}

  ngOnInit(): void {
    // Aquí cargarías los datos de la BD
    this.simularCargaDatosBD();
  }

  ngAfterViewInit(): void {
    this.inicializarDataTable();
    setTimeout(() => {
      this.inicializarEstadoOriginal();
      this.getPermisos();
    });
  }

  // ========== SIMULACIÓN CARGA BD ==========
  getPermisos(){
    this.apiService.getUsuarios(this.empleados).subscribe({
      next: (res: any) => {
        // 1. Guardamos el token en el LocalStorage
        console.log("usuarios", res);
        // this.empleados=res;
        // 2. Redirigimos al Dashboard
      },
      error: (err) => {
        console.error('Error al registrar', err);
      }
    });
  }
  getModulos(){
    this.apiService.getModulos("").subscribe({
      next: (res: any) => {
        // 1. Guardamos el token en el LocalStorage
        console.log("usuarios", res);
        // this.empleados=res;
        // 2. Redirigimos al Dashboard
      },
      error: (err) => {
        console.error('Error al registrar', err);
      }
    });
  }
  async simularCargaDatosBD(): Promise<void> {
    // En producción, aquí harías las llamadas HTTP
    // Ejemplo:
    // this.http.get<ColumnaTabla[]>('/api/columnas').subscribe(columnas => this.columnas = columnas);
    // this.http.get<Empleado[]>('/api/empleados').subscribe(empleados => this.empleados = empleados);
    
    this.apiService.getUsuarios(this.empleados).subscribe({
      next: (res: any) => {
        // 1. Guardamos el token en el LocalStorage
        console.log("usuarios", res);
        // this.empleados=res;
        // 2. Redirigimos al Dashboard
      },
      error: (err) => {
        console.error('Error al registrar', err);
      }
    });

    // const formData = new FormData();
    // formData.append('plazas', JSON.stringify(todosLosResultados));
    
    // const response = await fetch(`${this.apiUrl}/plazas/agregar`, {
    //   method: 'GET',
    //   headers: {
    //     'X-CSRF-TOKEN': this.getCsrfToken(),
    //     'X-Requested-With': 'XMLHttpRequest'
    //   },
    //   body: formData
    // });
    // console.log("result");
    // const result = await response.json();
    // console.log(result);
    

    console.log('Datos cargados (simulación BD):');
    console.log('Columnas:', this.columnas);
    console.log('Empleados:', this.empleados);
  }

    getEmpleadoValue(empleado: Empleado, key: string): any {
    // Método seguro para acceder a propiedades del empleado
    switch(key) {
      case 'empleado':
        return empleado.nombre; // Para mostrar en template si es necesario
      case 'departamento':
        return empleado.departamento;
      case 'estado':
        return empleado.estado;
      default:
        return (empleado as any)[key] || '';
    }
  }

  getPermisoValue(empleado: Empleado, modulo: string): boolean {
    return empleado.permisos[modulo];
  }

  verModulos(){
    console.log("Ver modulos");
  }
  showModulosModal: boolean = false;
  
  verModalModulos(): void {
    this.showModulosModal = true;
  }

  guardarModulo(){
    console.log("guardarModulo()");
  }
  activeTab: string = 'datos-basicos';
  
  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
  }

  async agregarModulo() {
    console.log('Agregar catálogo:', this.nuevoModulo);
    alert('Funcionalidad de agregar catálogo en desarrollo');
    this.nuevoModulo = { nombre: '', descripcion: '' };
    
    const formData = new FormData();
    formData.append('plazas', JSON.stringify([]));
    
    const response = await fetch(`${this.apiUrl}/plazas/agregar`, {
      method: 'GET',
      headers: {
        'X-CSRF-TOKEN': this.apiService.getCsrfToken(),
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: formData
    });
    console.log("result");
    const result = await response.json();
    console.log(result);//*/
    this.showModulosModal = false;
  }
  // ========== MÉTODOS DE UI ==========

  getEstadoClass(estado: string): string {
    switch(estado.toLowerCase()) {
      case 'activo': return 'badge bg-success';
      case 'inactivo': return 'badge bg-danger';
      case 'vacaciones': return 'badge bg-warning text-dark';
      default: return 'badge bg-secondary';
    }
  }

  // ========== DATATABLE ==========

  inicializarDataTable(): void {
    if (typeof $ !== 'undefined') {
      this.tablaDataTable = $(this.tablaEmpleados.nativeElement).DataTable({
        "language": {
          "url": "//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json"
        },
        "pageLength": 10,
        "lengthMenu": [5, 10, 15, 25, 50, 100],
        "dom": '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>><"row"<"col-sm-12"tr>><"row"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>',
        "initComplete": () => {
          console.log('DataTable inicializado correctamente');
        }
      });
    }
  }

  onCambiarRegistros(event: any): void {
    if (this.tablaDataTable) {
      this.tablaDataTable.page.len(parseInt(event.target.value)).draw();
    }
  }

  onBuscar(event: any): void {
    if (this.tablaDataTable) {
      this.tablaDataTable.search(event.target.value).draw();
    }
  }

  // ========== MANEJO DE PERMISOS ==========

  onPermisoChange(empleadoId: number, modulo: string, valor: boolean): void {
    const key = `${empleadoId}_${modulo}`;
    
    // Obtener valor original
    const empleado = this.empleados.find(e => e.id === empleadoId);
    if (!empleado) return;
    
    const original = empleado.permisos[modulo];
    
    if (valor !== original) {
      this.cambiosPendientes.set(key, {
        empleadoId,
        modulo,
        valor,
        original
      });
    } else {
      this.cambiosPendientes.delete(key);
    }
    
    console.log('Cambios pendientes:', this.cambiosPendientes.size);
  }

  obtenerCambiosPendientes(): CambioPermiso[] {
    return Array.from(this.cambiosPendientes.values());
  }

  obtenerCambiosPorEmpleado(empleadoId: number): CambioPermiso[] {
    return this.obtenerCambiosPendientes().filter(cambio => cambio.empleadoId === empleadoId);
  }

  // ========== GUARDADO ==========

  guardarMasivo(): void {
    const cambios = this.obtenerCambiosPendientes();
    if (cambios.length === 0) {
      alert('No hay cambios pendientes para guardar.');
      return;
    }
    
    if (confirm(`¿Está seguro de guardar ${cambios.length} cambios masivamente?`)) {
      this.guardarCambios(cambios, true);
    }
  }

  guardarIndividual(empleadoId: number): void {
    const cambios = this.obtenerCambiosPorEmpleado(empleadoId);
    
    if (cambios.length === 0) {
      alert('No hay cambios pendientes para este empleado.');
      return;
    }

    if (confirm('¿Guardar cambios para este empleado?')) {
      this.guardarCambios(cambios, false);
    }
  }

  guardarCambios(cambios: CambioPermiso[], esMasivo: boolean): void {
    this.isLoading = true;
    
    // Simular guardado con timeout (en producción sería una llamada HTTP)
    setTimeout(() => {
      cambios.forEach(cambio => {
        // Actualizar el valor en el empleado
        const empleado = this.empleados.find(e => e.id === cambio.empleadoId);
        if (empleado) {
          empleado.permisos[cambio.modulo] = cambio.valor;
          
          // En producción, aquí harías:
          // this.http.put(`/api/empleados/${empleadoId}/permisos`, { modulo, valor }).subscribe(...);
        }
        
        // Eliminar del mapa de cambios pendientes
        const key = `${cambio.empleadoId}_${cambio.modulo}`;
        this.cambiosPendientes.delete(key);
      });
      
      this.isLoading = false;
      alert(esMasivo ? 'Cambios guardados masivamente.' : 'Cambios guardados correctamente.');
    }, 1000);
  }

  // ========== CONFIGURACIÓN AVANZADA ==========
abrirConfigAvanzada(empleadoId: number): void {
  this.empleadoActual = empleadoId;
  this.empleadoSeleccionado = this.empleados.find(e => e.id === empleadoId) || null;
  
  if (this.empleadoSeleccionado) {
    // Obtener módulos activos
    const modulosActivos = this.obtenerModulosActivos(empleadoId);
    
    // Inicializar configAvanzada vacía
    this.configAvanzada = {};
    
    // Cargar configuración existente o crear una nueva solo para módulos activos
    modulosActivos.forEach(modulo => {
      const moduloKey = modulo as keyof ConfigAvanzada;
      
      // Verificar si ya existe configuración para este módulo
      if (this.empleadoSeleccionado!.configAvanzada && 
          this.empleadoSeleccionado!.configAvanzada![moduloKey]) {
        // Copiar configuración existente
        this.configAvanzada[moduloKey] = { 
          ...(this.empleadoSeleccionado!.configAvanzada![moduloKey] as any)
        };
      } else {
        // Crear nueva configuración por defecto
        this.configAvanzada[moduloKey] = this.getConfiguracionPorDefecto(modulo) as any;
      }
    });
    
    this.showModal = true;
  }
}

// Método para obtener configuración por defecto (corregido)
private getConfiguracionPorDefecto(modulo: string): ConfigModulo {
  switch(modulo) {
    case 'vacaciones':
      return { lectura: true, escritura: true, aprobacion: false, reportes: false };
    case 'sistemas':
      return { lectura: true, configuracion: false, administracion: false };
    case 'ficha_tecnica':
      return { lectura: true, escritura: true, eliminar: false };
    case 'nomina':
      return { consulta: true, modificacion: false, aprobacion: false };
    case 'reportes':
      return { generar: true, exportar: true, avanzados: false };
    case 'configuracion':
      return { general: false, usuarios: false, permisos: false };
    default:
      throw new Error(`Módulo no reconocido: ${modulo}`);
  }
}

  getNombreModulo(moduloKey: string): string {
  const nombres: {[key: string]: string} = {
    'vacaciones': 'Vacaciones',
    'sistemas': 'Sistemas',
    'ficha_tecnica': 'Ficha Técnica',
    'nomina': 'Nómina',
    'reportes': 'Reportes',
    'configuracion': 'Configuración'
  };
  
  return nombres[moduloKey] || moduloKey;
}
//   private getConfiguracionPorDefecto(modulo: string): any {
//   switch(modulo) {
//     case 'vacaciones':
//       return { lectura: true, escritura: true, aprobacion: false, reportes: false };
//     case 'sistemas':
//       return { lectura: true, configuracion: false, administracion: false };
//     case 'ficha_tecnica':
//       return { lectura: true, escritura: true, eliminar: false };
//     case 'nomina':
//       return { consulta: true, modificacion: false, aprobacion: false };
//     case 'reportes':
//       return { generar: true, exportar: true, avanzados: false };
//     case 'configuracion':
//       return { general: false, usuarios: false, permisos: false };
//     default:
//       return {};
//   }
// }

  cerrarModal(): void {
    this.showModal = false;
    this.empleadoActual = null;
    this.empleadoSeleccionado = null;
  }

  guardarConfigAvanzada(): void {
    if (!this.empleadoActual || !this.empleadoSeleccionado) return;
    
    // Guardar en el empleado
    const empleado = this.empleados.find(e => e.id === this.empleadoActual);
    if (empleado) {
      empleado.configAvanzada = { ...this.configAvanzada };
      
      // En producción, aquí harías:
      // this.http.put(`/api/empleados/${empleadoId}/config-avanzada`, this.configAvanzada).subscribe(...);
    }
    
    // Simular guardado en servidor
    this.isLoading = true;
    setTimeout(() => {
      this.isLoading = false;
      alert('Configuración avanzada guardada correctamente.');
      this.cerrarModal();
    }, 1000);
  }

  // ========== UTILIDADES ==========

  inicializarEstadoOriginal(): void {
    // Inicializar valores originales para cada checkbox
    this.empleados.forEach(empleado => {
      Object.keys(empleado.permisos).forEach(modulo => {
        const key = `${empleado.id}_${modulo}`;
        this.cambiosPendientes.set(key, {
          empleadoId: empleado.id,
          modulo,
          valor: empleado.permisos[modulo],
          original: empleado.permisos[modulo]
        });
      });
    });
  }

  tieneCambiosPendientes(empleadoId: number): boolean {
    return this.obtenerCambiosPorEmpleado(empleadoId).length > 0;
  }

  getTotalCambiosPendientes(): number {
    return this.cambiosPendientes.size;
  }

  // ========== MÉTODOS PARA FUTURO USO CON BD ==========

  cargarColumnasDesdeBD(): void {
    // Ejemplo de cómo cargarías las columnas desde BD
    this.http.get<ColumnaTabla[]>('/api/columnas-permisos').subscribe({
      next: (columnas) => {
        this.columnas = columnas;
      },
      error: (error) => {
        console.error('Error cargando columnas:', error);
      }
    });
  }

  cargarEmpleadosDesdeBD(): void {
    // Ejemplo de cómo cargarías los empleados desde BD
    this.http.get<Empleado[]>('/api/empleados').subscribe({
      next: (empleados) => {
        this.empleados = empleados;
        this.inicializarEstadoOriginal();
      },
      error: (error) => {
        console.error('Error cargando empleados:', error);
      }
    });
  }

  guardarPermisosEnBD(empleadoId: number, permisos: Permisos): void {
    // Ejemplo de cómo guardarías en BD
    this.http.put(`/api/empleados/${empleadoId}/permisos`, permisos).subscribe({
      next: () => {
        console.log('Permisos guardados en BD');
      },
      error: (error) => {
        console.error('Error guardando permisos:', error);
      }
    });
  }

   // Método para verificar si un módulo tiene permisos básicos activos
  tienePermisoBasico(empleadoId: number, modulo: string): boolean {
    const empleado = this.empleados.find(e => e.id === empleadoId);
    if (!empleado) return false;
    
    return empleado.permisos[modulo] === true;
  }

  // Método para obtener módulos activos de un empleado
  obtenerModulosActivos(empleadoId: number): string[] {
    const empleado = this.empleados.find(e => e.id === empleadoId);
    if (!empleado) return [];
    
    return Object.entries(empleado.permisos)
      .filter(([modulo, activo]) => activo === true)
      .map(([modulo]) => modulo);
  }

  // Método para verificar si se debe mostrar el botón de configuración
  mostrarBotonConfiguracion(empleadoId: number): boolean {
    const modulosActivos = this.obtenerModulosActivos(empleadoId);
    return modulosActivos.length > 0;
  }
}