import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../../services/api.service';

export interface Module {
  id_modulo_sistema: number;
  id_sistema: number;
  nombre: string;
  activo: boolean;
  creationDate?: string;
  startDate?: string;
  endDate?: string;
  valor_1?: string; 
  // tempId?: number; // Para IDs temporales en el formulario
}

export interface System {
  id_sistema: number;
  nombre: string;
  departamento?: string;
  descripcion: string;
  activo: boolean;
  icono?: string | null;
  fh_creacion: string;
  fh_inicio: string;
  fhfin: string;
  modules: Module[];
}

@Component({
  selector: 'app-sistemas-modulos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sistemas-modulos.component.html',
  styleUrl: './sistemas-modulos.component.css'
})
export class SistemasModulosComponent implements OnInit {
  // Datos de ejemplo
  systems: System[] = [
    {
      id_sistema: 21,
      nombre: 'Vacaciones',
      departamento: 'RRHH',
      descripcion: 'Gestión de vacaciones, permisos y ausencias del personal',
      fh_inicio: '2024-01-01',
      fhfin: '2024-12-31',
      fh_creacion: '2024-01-01',
      activo: true,
      modules: [
        { id_modulo_sistema: 1,id_sistema:2, nombre: 'Solicitudes', creationDate: '2024-01-01', startDate: '2024-01-01', endDate: '2024-12-31', activo: true },
        { id_modulo_sistema: 2,id_sistema:2, nombre: 'Aprobaciones', creationDate: '2024-01-01', startDate: '2024-01-01', endDate: '2024-12-31', activo: true },
        { id_modulo_sistema: 3,id_sistema:2, nombre: 'Calendario', creationDate: '2024-02-15', startDate: '2024-02-15', endDate: '2024-12-31', activo: true },
        { id_modulo_sistema: 4,id_sistema:2, nombre: 'Reportes', creationDate: '2024-03-01', startDate: '2024-03-01', endDate: '2024-12-31', activo: true }
      ]
    },/*
    {
      id: 'ficha-tecnica',
      nombre: 'Ficha Técnica',
      departamento: 'INGENIERÍA',
      description: 'Documentación técnica, especificaciones y planos',
      startDate: '2024-01-15',
      endDate: '2024-12-15',
      creationDate: '2024-01-15',
      activo: true,
      modules: [
        { id: 5, nombre: 'Especificaciones', creationDate: '2024-01-15', startDate: '2024-01-15', endDate: '2024-12-15', activo: true },
        { id: 6, nombre: 'Documentos', creationDate: '2024-01-15', startDate: '2024-01-15', endDate: '2024-12-15', activo: true },
        { id: 7, nombre: 'Planos', creationDate: '2024-02-01', startDate: '2024-02-01', endDate: '2024-12-15', activo: false }
      ]
    }//*/
  ];

  // Estado de filtros y búsqueda
  filteredSystems: System[] = [...this.systems];
  currentFilter: string = 'todos';
  searchTerm: string = '';

  // Estado de modales
  showSystemModal: boolean = false;
  showModuleModal: boolean = false;
  
  // Datos para edición
  editingSystem: System | null = null;
  editingModule: Module | null = null;

  cargando: boolean = false;
  error: string | null = null;
  
  // Formulario de sistema
  formData: any = {
    departamento: '',
    nombre: '',
    description: '',
    iconUrl: '',
    creationDate: '',
    startDate: '',
    endDate: '',
    activo: true
  };
  
  // Módulos del formulario
  formModules: any[] = [];
  private nextTempId: number = 1000;

  // Formulario de módulo
  moduleFormData: any = {
    systemRef: '',
    nombre: '',
    creationDate: '',
    startDate: '',
    endDate: '',
    activo: true
  };

  constructor(
    // private http: HttpClient,
    // private cdr: ChangeDetectorRef,
    private apiService: ApiService
  ) {}
  ngOnInit(): void {
    this.filterSystems();
    this.getSistemas();

  }

  async getSistemas(): Promise <void>{
    this.cargando = true;
    this.error = null;
    // const formData = new FormData();
    // formData.append = ('');
    console.log(`${this.apiService.apiUrl}/catalogos/getSistemas`);
    const resFilas = await fetch(`${this.apiService.apiUrl}/catalogos/getSistemas`, {
          method: 'GET',
          headers: {
            'X-CSRF-TOKEN': this.apiService.getCsrfToken(),
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          // body: formData,
          credentials: 'include',
        });
        console.log("result Filas:");
        const respuesta = await resFilas.json();
        console.log(respuesta.estado);
        console.log(respuesta);
        if (respuesta.datos && Array.isArray(respuesta.datos)) {
          this.systems = respuesta.datos;
        } else if (Array.isArray(respuesta)) {
          this.systems = respuesta;
        }else {
          console.warn('Formato de respuesta inesperado:', respuesta);
          this.systems = [];
        }
        this.filteredSystems = [...this.systems];
        this.cargando = false;
  }

  // Método para contar módulos activos
  contarModulosActivos(modulos: Module[]): number {
    return modulos.filter(m => m.activo === true).length;
  }
  getEstadoSistema(activo: boolean): { texto: string, clase: string } {
    return activo === true 
      ? { texto: 'Activo', clase: 'badge bg-success' }
      : { texto: 'Inactivo', clase: 'badge bg-danger' };
  }
  
  // Método para formatear fecha
  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  
  // ========== FILTROS Y BÚSQUEDA ==========
  onSearch(event: any) {
    this.searchTerm = event.target.value.toLowerCase();
    this.filterSystems();
  }

  setFilter(filter: string) {
    this.currentFilter = filter;
    this.filterSystems();
  }

  filterSystems() {
    this.filteredSystems = this.systems.filter(system => {
      // Filtro por búsqueda
      const matchesSearch = this.searchTerm === '' || 
        system.nombre.toLowerCase().includes(this.searchTerm) ||
        // system.val_1.toLowerCase().includes(this.searchTerm) ||
        system.modules.some(m => m.nombre.toLowerCase().includes(this.searchTerm));

        let matchesFilter = true;
        /*/ Filtro por categoría
      if (this.currentFilter === 'rrhh') {
        matchesFilter = system.departamento === 'RRHH';
      } else if (this.currentFilter === 'ingenieria') {
        matchesFilter = system.departamento === 'INGENIERÍA';
      } else//*/ 
        if (this.currentFilter === 'activos') {
        matchesFilter = system.activo;
      }

      return matchesSearch && matchesFilter;
    });
  }

  // ========== MODAL DE SISTEMAS ==========
  openAddSystemModal() {
    this.editingSystem = null;
    this.resetFormData();
    this.showSystemModal = true;
  }

  openEditSystemModal(system: System) {
    this.editingSystem = system;
    
    // Cargar datos del sistema
    this.formData = {
      nombre: system.nombre,
      // departamento: system.departamento,
      // description: system.description,
      // iconUrl: system.iconUrl || '',
      // creationDate: system.creationDate,
      // startDate: system.startDate,
      // endDate: system.endDate,
      activo: system.activo
    };

    // Cargar módulos
    this.formModules = system.modules.map(m => ({
      tempId: this.nextTempId++,
      id: m.id_sistema,
      nombre: m.nombre,
      creationDate: m.creationDate,
      startDate: m.startDate,
      endDate: m.endDate,
      activo: m.activo
    }));

    this.showSystemModal = true;
  }

  closeModal() {
    this.showSystemModal = false;
    this.editingSystem = null;
  }

  resetFormData() {
    const today = new Date().toISOString().split('T')[0];
    this.formData = {
      departamento: '',
      nombre: '',
      description: '',
      iconUrl: '',
      creationDate: today,
      startDate: today,
      endDate: today,
      activo: true
    };
    this.formModules = [];
  }

  addModuleToForm() {
    const today = new Date().toISOString().split('T')[0];
    this.formModules.push({
      tempId: this.nextTempId++,
      nombre: '',
      creationDate: today,
      startDate: today,
      endDate: today,
      activo: true
    });
  }

  removeModule(index: number) {
    this.formModules.splice(index, 1);
  }

  saveSystem() {
    if (!this.formData.departamento || !this.formData.nombre) {
      alert('Por favor completa los campos requeridos');
      return;
    }

    const modules = this.formModules.map((m, index) => ({
      id: m.id || (this.nextTempId++ + index),
      nombre: m.nombre,
      creationDate: m.creationDate,
      startDate: m.startDate,
      endDate: m.endDate,
      activo: m.activo
    }));

    if (this.editingSystem) {
      // Actualizar sistema existente
      const index = this.systems.findIndex(s => s.id_sistema === this.editingSystem!.id_sistema);
      if (index !== -1) {
        this.systems[index] = {
          ...this.editingSystem,
          ...this.formData,
          modules: modules
        };
      }
      alert('✅ Sistema actualizado');
    } else {
      // Crear nuevo sistema
      const newSystem: System = {
        id: 'sys-' + Date.now(),
        ...this.formData,
        modules: modules
      };
      this.systems.push(newSystem);
      alert('✅ Sistema creado');
    }

    this.filterSystems();
    this.closeModal();
  }

  // ========== MODAL DE MÓDULOS ==========
  openEditModuleModal(module: Module, systemId: number) {
    this.editingModule = module;
    this.moduleFormData = {
      systemRef: systemId,
      nombre: module.nombre,
      creationDate: module.creationDate,
      startDate: module.startDate,
      endDate: module.endDate,
      activo: module.activo
    };
    this.showModuleModal = true;
  }

  closeModuleModal() {
    this.showModuleModal = false;
    this.editingModule = null;
  }

  saveModule() {
    if (!this.moduleFormData.systemRef || !this.moduleFormData.nombre) {
      alert('Por favor completa los campos requeridos');
      return;
    }

    const system = this.systems.find(s => s.id_sistema === this.moduleFormData.systemRef);
    if (system && this.editingModule) {
      const moduleIndex = system.modules.findIndex(m => m.id_modulo_sistema === this.editingModule!.id_modulo_sistema);
      if (moduleIndex !== -1) {
        system.modules[moduleIndex] = {
          ...this.editingModule,
          ...this.moduleFormData
        };
      }
    }

    alert('✅ Módulo actualizado');
    this.filterSystems();
    this.closeModuleModal();
  }

  // ========== ACCIONES ADICIONALES ==========
  verModulos(system: System) {
    alert(`📋 Ver módulos de ${system.nombre} (modo demostración)`);
  }

  eliminarSistema(system: System) {
    alert(`📋 Ver módulos de ${system.nombre} (modo demostración)`);
  }
}