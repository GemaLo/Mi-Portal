import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Paginas 
import { EmpleadosMasivosComponent } from './empleados-masivos/empleados-masivos.component';
import { CreacionDePlazasComponent } from '../../administrativo/excel/creacion-de-plazas/creacion-de-plazas.component';

@Component({
  selector: 'app-altas-masivas',
  standalone:true,
  imports: [CommonModule, FormsModule, CreacionDePlazasComponent ,EmpleadosMasivosComponent],
  templateUrl: './altas-masivas.component.html',
  styleUrl: './altas-masivas.component.css'
})
export class AltasMasivasComponent {
  componenteSeleccionado: string = 'empleadosMasivos';
  title = 'Altas masivas';
  pageTitle = 'Prueba';
  pageDetalle = 'Prueba';

}
