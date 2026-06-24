import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RegistroPlaza } from '../../../services/creacion-plazas.service';

@Component({
  selector: 'app-resumen-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal fade" id="modalResumen" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-xl modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Resumen General por Archivo</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          
          <div class="modal-body">
            <div *ngFor="let fileName of getFileNames()" class="mb-4 border rounded p-3">
              <h5 class="text-primary mb-3">📄 {{ fileName }}</h5>
              
              <table class="table table-sm table-bordered">
                <thead>
                  <tr>
                    <th>Unidad</th>
                    <th>Código</th>
                    <th>Consecutivo</th>
                    <th>Plaza</th>
                    <th>Estado</th>
                    <th>Comentario</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of getRegistros(fileName)">
                    <td>{{ item.unidad || '' }}</td>
                    <td>{{ item.codigo_presupuestal || '' }}</td>
                    <td>{{ item.consecutivo_plaza || '' }}</td>
                    <td>{{ item.plaza || '' }}</td>
                    <td>
                      <span [class]="getEstadoClass(item.estado)">
                        {{ item.estado || 'REPETIDO' }}
                      </span>
                    </td>
                    <td>{{ item.comentario || '' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .badge-estado {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }
    
    .badge-valido {
      background-color: #d1e7dd;
      color: #0f5132;
    }
    
    .badge-invalido {
      background-color: #f8d7da;
      color: #842029;
    }
    
    .badge-repetido {
      background-color: #fff3cd;
      color: #856404;
    }
  `]
  // templateUrl: './resumen-modal.component.html',
  // styleUrl: './resumen-modal.component.css'
})
export class ResumenModalComponent {
resultadosPorArchivo: { [key: string]: RegistroPlaza[] } = {};
  
  open(resultados: { [key: string]: RegistroPlaza[] }): void {
    this.resultadosPorArchivo = resultados;
    // Abrir modal usando Bootstrap
    const modalElement = document.getElementById('modalResumen');
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
  }
  
  getFileNames(): string[] {
    return Object.keys(this.resultadosPorArchivo);
  }
  
  getRegistros(fileName: string): RegistroPlaza[] {
    return this.resultadosPorArchivo[fileName] || [];
  }
  
  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'VÁLIDO': return 'badge-estado badge-valido';
      case 'INVÁLIDO': return 'badge-estado badge-invalido';
      case 'REPETIDO': return 'badge-estado badge-repetido';
      default: return 'badge-estado badge-repetido';
    }
  }
}
