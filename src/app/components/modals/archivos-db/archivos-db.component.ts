import { Component, Input, Output, EventEmitter, OnInit, inject,DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged, map } from 'rxjs';

import { ApiService } from '../../../services/api.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { InfoArchivoService } from '../../../services/info-archivo.service';

export interface ScriptFile {
  idArchivo: number;
  nombreArchivo: string;
  tipoArchivo: string;
  tamanio: number;
  fechaSubida: Date;
  esPrincipal: boolean;
}

@Component({
  selector: 'app-archivos-db',
  imports: [CommonModule, FormsModule
  //  ,ApiService
  ],
  standalone: true,
  templateUrl: './archivos-db.component.html',
  // template: ``,
  styleUrl: './archivos-db.component.css'
})
export class ArchivosDbComponent implements OnInit {
  @Input() idVersion!: number;
  @Input() modoModal: boolean = false;
  @Output() archivosActualizados = new EventEmitter<ScriptFile[]>();
  @Output() cerrar = new EventEmitter<void>();
  
  archivos: ScriptFile[] = [];
  nuevoArchivoEsPrincipal: boolean = false;
  progresoSubida: number = 0; // Cambiado a español
  private intervaloSubida: any; // Para limpiar el intervalo
  solicitudUsuario:boolean = false;
  usuarioSolicita: string= "";
  isValid = true;
  mensajeValidacion = '';
  
  private inputSubject = new Subject<string>();
  private destroyRef = inject(DestroyRef);

  constructor(private apiService: ApiService, private sanitizer: DomSanitizer, private infoArchivoService: InfoArchivoService) {
    this.inputSubject.pipe(
      debounceTime(1500), // Espera 2 segundos después del último cambio
      distinctUntilChanged(), // Solo valida si el valor cambió
      map(valor => this.validarValor(valor)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(resultado => {
      this.isValid = resultado.esValido;
      this.mensajeValidacion = resultado.mensaje;
      console.log("res usuario solicita: ", resultado);
    });
  }


  ngOnInit() {
    this.cargarArchivos();
  }
  
  ngOnDestroy() {
    // Limpiar intervalo si existe
    if (this.intervaloSubida) {
      clearInterval(this.intervaloSubida);
    }
  }
  
  cargarArchivos() {
    /*
    this.apiService.getArchivosDB(null).subscribe({
      next: (res: any) => {
        this.archivos = res.datos;
        console.log("apiService", this.archivos);
      },
      error: (err) => {
        // console.error('Error al consultar', err);
        console.error('Error al consultar', err.error.message);
      }
    });
    /*/
    this.archivos = [
      {
        idArchivo: 1,
        nombreArchivo: 'script_principal.sql',
        tipoArchivo: 'application/sql',
        tamanio: 24576,
        fechaSubida: new Date(),
        esPrincipal: true
      },
      {
        idArchivo: 2,
        nombreArchivo: 'documentacion.pdf',
        tipoArchivo: 'application/pdf',
        tamanio: 1024000,
        fechaSubida: new Date(),
        esPrincipal: false
      }
    ];//*/
    this.archivosActualizados.emit(this.archivos);
  }
  
  onFileSelected(event: any) {
    const archivo = event.target.files[0];
    if (!archivo) return;
    
    // Validar tamaño máximo (10MB)
    const tamanoMaximo = 10 * 1024 * 1024;
    if (archivo.size > tamanoMaximo) {
      this.btnAceptar = false;
      alert(`El archivo es demasiado grande. Máximo: ${this.formatearBytes(tamanoMaximo)}`);
      return;
    }
    
    this.subirArchivo(archivo);
  }

  
  onDragOver(event: DragEvent): void {
    console.log("aasd");
    event.preventDefault();
    const fileInput = event.currentTarget as HTMLElement;
    fileInput.classList.add('dragover');
  }
  
  onDragLeave(event: DragEvent): void {
    const fileInput = event.currentTarget as HTMLElement;
    fileInput.classList.remove('dragover');
    console.log("aasd2");
  }
  
  onDrop(event: DragEvent): void {
    event.preventDefault();
    // const fileInput = event.currentTarget as HTMLElement;
    // fileInput.classList.remove('dragover');
    // console.log("aasd3");
    
    if (event.dataTransfer?.files) {
      this.base64PDF='';
      this.flagVerPdf=false;
      const archivo = event.dataTransfer?.files[0];
      if (!archivo) return;
      
      // Validar tamaño máximo (10MB)
      const tamanoMaximo = 10 * 1024 * 1024;
      if (archivo.size > tamanoMaximo) {
        alert(`El archivo es demasiado grande. Máximo: ${this.formatearBytes(tamanoMaximo)}`);
        this.btnAceptar = false;
        return;
      }
      this.btnAceptar = false;
      this.subirArchivo(archivo);


      console.log("aasd4");

      // const files = Array.from(event.dataTransfer.files);
      // this.handleFileSelect(files);
    }
  }
  /*
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
  }*/
  async subirArchivo(archivo: File) {
    try {
      // 1. Obtener información básica del archivo
      const informacionArchivo = this.obtenerInfoArchivo(archivo);
      console.log('📄 Información del archivo:', informacionArchivo);
      
      // 2. Convertir a Base64
      const base64 = await this.convertirABase64(archivo);
      console.log('🔐 Archivo convertido a Base64');
      
      // 3. Preparar objeto para enviar
      const datosParaEnviar = {
        ...informacionArchivo,
        contenidoBase64: base64,
        fechaSubida: new Date().toISOString(),
        usuario: 'usuario_actual',
        idVersion: this.idVersion
      };
      
      console.log('📦 Datos listos para enviar:', datosParaEnviar);
      this.base64PDF = base64;
      // 4. ENVIAR AL SERVICIO (importante: emitir aquí)
      this.infoArchivoService.procesarInfoArchivo(datosParaEnviar);
      console.log('✅ Datos enviados al servicio correctamente');
      
      // 5. Simular progreso de subida
      this.simularProgresoSubida(archivo.name);
      
      // 6. Recargar lista de archivos
      this.cargarArchivos();
      this.btnAceptar = true;
    } catch (error) {
      console.error('❌ Error al procesar archivo:', error);
      this.infoArchivoService.procesarError('Error al procesar el archivo');
      this.btnAceptar = false;
      alert('Error al procesar el archivo');
    }
  }
  
  // ==========================================
  // MÉTODOS AUXILIARES (en español)
  // ==========================================
  
  obtenerInfoArchivo(archivo: File) {
    const extension = archivo.name.split('.').pop()?.toLowerCase() || '';
    
    return {
      nombreArchivo: archivo.name,
      tamañoBytes: archivo.size,
      tamañoKB: +(archivo.size / 1024).toFixed(2),
      tamañoMB: +(archivo.size / (1024 * 1024)).toFixed(2),
      extension: extension,
      tipoMIME: archivo.type || this.obtenerMimeType(extension),
      fechaModificacion: archivo.lastModified ? new Date(archivo.lastModified).toISOString() : null,
      ultimaModificacion: archivo.lastModified
    };
  }
  
  convertirABase64(archivo: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const lector = new FileReader();
      lector.onload = () => {
        const base64Completo = lector.result as string;
        const base64Puro = base64Completo.split(',')[1];
        resolve(base64Puro);
      };
      lector.onerror = reject;
      lector.readAsDataURL(archivo);
    });
  }
  btnVerPdf: boolean = false;
  simularProgresoSubida(nombreArchivo: string) {
    this.progresoSubida = 0;
    
    // Limpiar intervalo anterior si existe
    if (this.intervaloSubida) {
      clearInterval(this.intervaloSubida);
    }
    
    this.intervaloSubida = setInterval(() => {
      this.progresoSubida += 20;
      if (this.progresoSubida >= 100) {
        clearInterval(this.intervaloSubida);
        alert(`✅ Archivo ${nombreArchivo} procesado correctamente`);
        this.btnVerPdf = true;
      }
    }, 200);
  }
  
  obtenerMimeType(extension: string): string {
    const tiposMime: Record<string, string> = {
      'sql': 'application/sql',
      'txt': 'text/plain',
      'pdf': 'application/pdf',
      'zip': 'application/zip',
      'json': 'application/json',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg'
    };
    return tiposMime[extension] || 'application/octet-stream';
  }
  
  formatearBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const tamaños = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + tamaños[i];
  }
    
  eliminarArchivo(idArchivo: number) {
    if (confirm('¿Eliminar este archivo?')) {
      this.archivos = this.archivos.filter(a => a.idArchivo !== idArchivo);
      this.archivosActualizados.emit(this.archivos);
      alert('✅ Archivo eliminado');
    }
  }
  
  descargarArchivo(idArchivo: number) {
    const archivo = this.archivos.find(a => a.idArchivo === idArchivo);
    if (archivo) {
      alert(`📥 Descargando: ${archivo.nombreArchivo}`);
    }
  }
  
  // MostrarPDF
  mostrarModalPDF = false;
  pdfUrl: SafeResourceUrl | null = null;
  pdfTitulo = '';
  pdfData: any = null;
  esPDF = true;
  flagVerPdf = false;
  getIconoArchivo(tipo: string): string {
    if (tipo.includes('sql')) return '📝';
    if (tipo.includes('pdf')) return '📄';
    if (tipo.includes('zip')) return '📦';
    return '📎';
  }

  // pdfUrl!: SafeResourceUrl;

  // Mostrar PDF
  base64PDF= '';
  btnCerrarPdf:boolean = false;
  btnAceptar:boolean = false;
  mostrarPDF(){
    const pdfData = `data:application/pdf;base64,${this.base64PDF}`;
    // Sanitizar URL
    this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(pdfData);
    this.flagVerPdf = true;
    this.btnCerrarPdf=true;
    this.btnVerPdf=false;
  }
  cerrarPDF(){
    this.flagVerPdf =false;
    this.btnVerPdf=true;
    this.btnCerrarPdf=false;
  }

  // verPDF(archivo: any) {
  //   // Verificar que sea PDF
  //   if (archivo.tipoMIME !== 'application/pdf' && 
  //       archivo.extension !== 'pdf' &&
  //       !archivo.nombreArchivo?.toLowerCase().endsWith('.pdf')) {
  //     this.esPDF = false;
  //     this.mostrarModalPDF = true;
  //     this.pdfTitulo = archivo.nombreArchivo;
  //     return;
  //   }
    
  //   this.esPDF = true;
  //   this.pdfTitulo = archivo.nombreArchivo;
  //   this.pdfData = archivo;
    
  //   // Si ya tenemos el contenido Base64
  //   if (archivo.contenidoBase64) {
  //     this.mostrarPDFDesdeBase64(archivo.contenidoBase64);
  //   } 
  //   // Si tenemos el BLOB de la base de datos
  //   else if (archivo.contenidoBlob) {
  //     this.mostrarPDFDesdeBlob(archivo.contenidoBlob);
  //   }
  //   // Si tenemos el ID para cargar
  //   else if (archivo.idArchivo) {
  //     this.cargarPDFDesdeServidor(archivo.idArchivo);
  //   }
  // }
  
  // Mostrar PDF desde Base64 string
  mostrarPDFDesdeBase64(base64String: string) {
    try {
      // Construir la URL del PDF
      const pdfUrl = `data:application/pdf;base64,${base64String}`;
      this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(pdfUrl);
      this.mostrarModalPDF = true;
    } catch (error) {
      console.error('Error al mostrar PDF:', error);
      alert('Error al cargar el PDF');
    }
  }
  
  // Mostrar PDF desde Blob
  mostrarPDFDesdeBlob(blob: Blob) {
    try {
      const url = URL.createObjectURL(blob);
      this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      this.mostrarModalPDF = true;
    } catch (error) {
      console.error('Error al mostrar PDF:', error);
      alert('Error al cargar el PDF');
    }
  }
  
  // Cargar PDF desde el servidor
  cargarPDFDesdeServidor(idArchivo: number) {
    // Aquí llamas a tu servicio para obtener el PDF
    // this.fileService.downloadFile(idArchivo).subscribe(blob => {
    //   this.mostrarPDFDesdeBlob(blob);
    // });
    
    // Ejemplo simulado
    setTimeout(() => {
      const blob = new Blob(['%PDF-1.4...'], { type: 'application/pdf' });
      this.mostrarPDFDesdeBlob(blob);
    }, 500);
  }
  
  cerrarModalPDF() {
    this.mostrarModalPDF = false;
    this.pdfUrl = null;
    this.pdfData = null;
  }
  
  descargarPDF() {
    if (this.pdfData?.contenidoBase64) {
      this.descargarDesdeBase64(this.pdfData.contenidoBase64, this.pdfData.nombreArchivo);
    } else if (this.pdfUrl) {
      // Si tenemos URL, podemos descargar
      const link = document.createElement('a');
      link.href = this.pdfUrl.toString();
      link.download = this.pdfTitulo || 'documento.pdf';
      link.click();
    }
  }
  
  descargarDesdeBase64(base64: string, nombreArchivo: string) {
    const link = document.createElement('a');
    link.href = `data:application/pdf;base64,${base64}`;
    link.download = nombreArchivo || 'documento.pdf';
    link.click();
  }



  
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }


  getFileInfo(file: File) {
    // Obtener extensión
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    
    // Obtener tipo MIME
    const mimeType = file.type || this.getMimeTypeFromExtension(extension);
    
    return {
      nombreArchivo: file.name,
      tamañoBytes: file.size,
      tamañoKB: +(file.size / 1024).toFixed(2),
      tamañoMB: +(file.size / (1024 * 1024)).toFixed(2),
      extension: extension,
      tipoMIME: mimeType,
      fechaModificacion: file.lastModified ? new Date(file.lastModified).toISOString() : null,
      esPrincipal: false, // Lo puedes setear desde el checkbox
    };
  }

  convertToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        // El resultado incluye el prefijo (ej: "data:application/pdf;base64,")
        const base64String = reader.result as string;
        
        // Si solo quieres el base64 puro (sin el prefijo):
        const pureBase64 = base64String.split(',')[1];
        
        resolve(pureBase64);
      };
      
      reader.onerror = (error) => {
        reject(error);
      };
      
      reader.readAsDataURL(file);
    });
  }
  
  // ==========================================
  // CALCULAR HASH MD5 (para verificar integridad)
  // ==========================================
  async calculateHash(base64String: string): Promise<string> {
    // Método 1: Usando CryptoJS (recomendado)
    // Necesitas instalar: npm install crypto-js
    // import * as CryptoJS from 'crypto-js';
    // return CryptoJS.MD5(base64String).toString();
// f89032bf39c36b3993f0530c671a345e16a7d0b2955bfce9cb2f588033871bfc
    // Método 2: Usando Web Crypto API (nativo)
    try {
      /*/ Convertir base64 a array buffer
      const binaryString = atob(base64String);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Calcular hash usando SubtleCrypto
      const hashBuffer = await crypto.subtle.digest('MD5', bytes);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      return hashHex;//*/
      const binaryString = atob(base64String);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Usar SHA-256 (soportado por todos los navegadores modernos)
      const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      return hashHex; // Retorna 64 caracteres hex
    } catch (error) {
      console.warn('Web Crypto no soporta MD5, usando hash simple');
      // Hash simple para demo (no usar en producción)
      return this.simpleHash(base64String);
    }
  }
  
  // Hash simple para demostración (no usar en producción)
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
  
  // ==========================================
  // OBTENER MIME TYPE DESDE EXTENSIÓN
  // ==========================================
  getMimeTypeFromExtension(extension: string): string {
    const mimeTypes: { [key: string]: string } = {
      'sql': 'application/sql',
      'txt': 'text/plain',
      'pdf': 'application/pdf',
      'zip': 'application/zip',
      'json': 'application/json',
      'xml': 'application/xml',
      'csv': 'text/csv',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif'
    };
    
    return mimeTypes[extension] || 'application/octet-stream';
  }

  saveToDatabase(data: any) {
    // this.http.post('/api/scripts/archivos', data).subscribe(...);
    console.log('💾 Enviando a Oracle:', {
      NOMBRE_ARCHIVO: data.nombreArchivo,
      TIPO_ARCHIVO: data.tipoMIME,
      EXTENSION: data.extension,
      TAMANO: data.tamañoBytes,
      CONTENIDO_BASE64: data.contenidoBase64?.substring(0, 100) + '...', // Log parcial
      HASH_MD5: data.hashMD5
    });
  }

 onInputChange() { 
    // Envía el valor al subject para su validación
    this.inputSubject.next(this.usuarioSolicita);
    console.log("asd");
  }

  private validarValor(valor: string) {
    if (!valor) {
      return { esValido: true, mensaje: '' };
    }

    const esNumero = /^\d+$/.test(valor);
    const esLetra = /^[a-zA-ZáéíóúñÑüÜ\s]+$/.test(valor);
    
    if (esNumero) {
      return { esValido: true, mensaje: 'Solo números', valor: valor };
    } 
    else if (esLetra) {
      return { esValido: true, mensaje: 'Solo letras', valor: valor };
    }
    else {
      return { esValido: false, mensaje: 'Solo se permiten números o letras, no combinados', valor: valor };
    }
  }

}
