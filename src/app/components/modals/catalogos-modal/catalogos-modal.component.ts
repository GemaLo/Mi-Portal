import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreacionPlazasService } from '../../../services/creacion-plazas.service';

@Component({
  selector: 'app-catalogos-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal fade" id="modalCatalogos" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-xl modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Catálogos</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          
          <!-- Navegación por pestañas -->
          <ul class="nav nav-tabs mb-4" id="catalogosTabs" role="tablist">
            <li class="nav-item" role="presentation">
              <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#datos-basicos">
                <i class="fas fa-user me-2"></i>Datos Básicos
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button class="nav-link" data-bs-toggle="tab" data-bs-target="#agregar-catalogo">
                <i class="fas fa-cog me-2"></i>Agregar catálogo
              </button>
            </li>
          </ul>
          
          <div class="tab-content">
            <!-- Pestaña 1: Datos Básicos -->
            <div class="tab-pane fade show active" id="datos-basicos">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="nombre" class="form-label required-field">Nombre(s)</label>
                  <input type="text" class="form-control" id="nombre" 
                         [(ngModel)]="catalogoData.nombre"
                         placeholder="Ingrese el nombre del empleado">
                </div>
                <div class="col-md-6 mb-3">
                  <label for="apellidos" class="form-label required-field">Apellidos</label>
                  <input type="text" class="form-control" id="apellidos" 
                         [(ngModel)]="catalogoData.apellidos"
                         placeholder="Ingrese los apellidos">
                </div>
              </div>
              
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="email" class="form-label required-field">Correo Electrónico</label>
                  <input type="email" class="form-control" id="email" 
                         [(ngModel)]="catalogoData.email"
                         placeholder="ejemplo@empresa.com">
                </div>
                <div class="col-md-6 mb-3">
                  <label for="telefono" class="form-label">Teléfono</label>
                  <input type="tel" class="form-control" id="telefono" 
                         [(ngModel)]="catalogoData.telefono"
                         placeholder="+52 55 1234 5678">
                </div>
              </div>
              
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="fechaNacimiento" class="form-label">Fecha de Nacimiento</label>
                  <input type="date" class="form-control" id="fechaNacimiento"
                         [(ngModel)]="catalogoData.fechaNacimiento">
                </div>
                <div class="col-md-6 mb-3">
                  <label for="genero" class="form-label">Género</label>
                  <select class="form-select" id="genero" [(ngModel)]="catalogoData.genero">
                    <option value="">Seleccionar...</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="O">Otro</option>
                  </select>
                </div>
              </div>
            </div>
            
            <!-- Pestaña 2: Agregar Catálogo -->
            <div class="tab-pane fade" id="agregar-catalogo">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="archivoExcel" class="form-label required-field">Excel</label>
                  <select class="form-select" id="archivoExcel" 
                          [(ngModel)]="nuevoCatalogo.idExcel">
                    <option *ngFor="let excel of excels" [value]="excel.id">
                      {{ excel.nombre }}
                    </option>
                  </select>
                </div>
                <div class="col-md-6 mb-3 d-flex align-items-end">
                  <button class="btn btn-outline-primary" (click)="verCatalogos()">
                    Ver Catálogos
                  </button>
                </div>
              </div>
              
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="nombreCatalogo" class="form-label required-field">Nombre</label>
                  <input type="text" class="form-control" id="nombreCatalogo" 
                         [(ngModel)]="nuevoCatalogo.nombre"
                         placeholder="Ingrese el nombre del catálogo">
                </div>
                <div class="col-md-6 mb-3">
                  <label for="nombreHojaCatalogo" class="form-label required-field">Nombre de hoja</label>
                  <input type="text" class="form-control" id="nombreHojaCatalogo" 
                         [(ngModel)]="nuevoCatalogo.nombreHoja"
                         placeholder="Ingrese el nombre de hoja">
                </div>
              </div>
            </div>
          </div>
          
          <div class="modal-footer">
            <button type="button" class="btn btn-success" (click)="guardarCatalogo()">
              Guardar
            </button>
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  `
  // templateUrl: './catalogos-modal.component.html',
  // styleUrl: './catalogos-modal.component.css'
})
export class CatalogosModalComponent implements OnInit {
  catalogoData = {
    nombre: '',
    apellidos: '',
    email: '',
    telefono: '',
    fechaNacimiento: '',
    genero: ''
  };
  
  nuevoCatalogo = {
    idExcel: '',
    nombre: '',
    nombreHoja: ''
  };
  
  excels: any[] = [];
  
  constructor(private creacionPlazasService: CreacionPlazasService) {}
  
  ngOnInit(): void {
    // Cargar excels disponibles
    this.cargarExcels();
  }
  
  open(): void {
    const modalElement = document.getElementById('modalCatalogos');
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
  }
  
  cargarExcels(): void {
    // Aquí cargarías los excels disponibles desde tu API
    this.excels = [
      { id: 1, nombre: 'Catálogo de Unidades' },
      { id: 2, nombre: 'Catálogo de Nóminas' },
      { id: 3, nombre: 'Catálogo de Zonas Económicas' }
    ];
  }
  
  verCatalogos(): void {
    // Implementar lógica para ver catálogos existentes
    alert('Funcionalidad de ver catálogos en desarrollo');
  }
  
  guardarCatalogo(): void {
    this.creacionPlazasService.agregarCatalogo(this.nuevoCatalogo).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Catálogo guardado exitosamente');
          // Limpiar formulario
          this.nuevoCatalogo = { idExcel: '', nombre: '', nombreHoja: '' };
        } else {
          alert('Error al guardar el catálogo');
        }
      },
      error: (error) => {
        console.error('Error:', error);
        alert('Error al guardar el catálogo');
      }
    });
  }
}
