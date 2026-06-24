import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-subir-archivo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subir-archivo.component.html',
  styleUrl: './subir-archivo.component.css'
})
export class SubirArchivoComponent {
 // 🔑 IDENTIFICADOR ÚNICO para diferenciar instancias
  @Input() idInstancia: string = 'default';
  @Input() tipoArchivo: 'excel' | 'pdf' | 'sql' | 'general' = 'general';
  @Input() aceptarExtensiones: string = '.xlsx,.xls,.xlsm';
  @Input() tamanoMaximoMB: number = 10;
  @Input() permitirMultiples: boolean = false;
  
  @Output() archivosSeleccionados = new EventEmitter<File[]>();
  @Output() instanciaLista = new EventEmitter<any>();
  
  // Estado local de esta instancia
  archivosCargados: File[] = [];
  estadisticas = { totalArchivos: 0 };
  isDragover: boolean = false;
  
  // Métodos específicos de esta instancia
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragover = true;
  }
  
  onDragLeave(event: DragEvent): void {
    this.isDragover = false;
  }
  
  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragover = false;
    
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
    // Limpiar el input para permitir seleccionar el mismo archivo nuevamente
    input.value = '';
  }
  
  handleFileSelect(files: File[]): void {
    // Validar según el tipo de archivo
    const extensionesPermitidas = this.aceptarExtensiones.split(',');
    
    for (const archivo of files) {
      const extension = '.' + archivo.name.split('.').pop()?.toLowerCase();
      
      if (!extensionesPermitidas.includes(extension)) {
        alert(`❌ ${this.idInstancia}: Archivo no válido. Permitidos: ${this.aceptarExtensiones}`);
        return;
      }
      
      if (archivo.size > this.tamanoMaximoMB * 1024 * 1024) {
        alert(`❌ ${this.idInstancia}: ${archivo.name} excede ${this.tamanoMaximoMB}MB`);
        return;
      }
      
      // Verificar duplicados por nombre
      if (!this.archivosCargados.some(a => a.name === archivo.name)) {
        this.archivosCargados.push(archivo);
        console.log("archivosCargados",this.archivosCargados);
      } else {
        console.log(`⚠️ Archivo duplicado ignorado: ${archivo.name}`);
      }
    }
    
    this.actualizarLista();
    
    // Emitir al padre con ID de instancia
    this.archivosSeleccionados.emit(this.archivosCargados);
    this.instanciaLista.emit({
      idInstancia: this.idInstancia,
      archivos: this.archivosCargados,
      total: this.archivosCargados.length
    });
  }
  
  actualizarLista(): void {
    this.estadisticas.totalArchivos = this.archivosCargados.length;
  }
  
  eliminarArchivo(index: number,nombre:string): void {
    console.log(`index ${index}, nom: ${nombre}`,this.archivosCargados);
    this.archivosCargados.splice(index, 1);
    this.actualizarLista();
    this.archivosSeleccionados.emit(this.archivosCargados);
    
    // this.instanciaLista.emit({
    //   idInstancia: this.idInstancia,
    //   archivos: this.archivosCargados,
    //   total: this.archivosCargados.length
    // });
  }
  
  limpiarArchivos(): void {
    this.archivosCargados = [];
    this.actualizarLista();
    this.archivosSeleccionados.emit([]);
  }
  
  // Getter para clase CSS de drag over
  get dragOverClass(): string {
    return this.isDragover ? 'dragover' : '';
  }
}
