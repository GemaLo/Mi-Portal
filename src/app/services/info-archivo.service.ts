import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class InfoArchivoService {
  // Usar BehaviorSubject para mantener el último valor (más confiable)
  private archivoProcesadoSubject = new BehaviorSubject<any>(null);
  archivoProcesado$ = this.archivoProcesadoSubject.asObservable();
  
  // Para errores (opcional pero recomendado)
  private errorSubject = new BehaviorSubject<string | null>(null);
  error$ = this.errorSubject.asObservable();
  
  // Emitir archivo procesado
  procesarInfoArchivo(datosArchivo: any) {
    console.log('📤 Servicio: Procesando archivo', datosArchivo?.nombreArchivo);
    this.archivoProcesadoSubject.next(datosArchivo);
  }
  procesarError(mensajeError: string) {
    console.error('❌ Servicio: Error', mensajeError);
    this.errorSubject.next(mensajeError);
  }
  obtenerArchivoActual() {
    return this.archivoProcesadoSubject.getValue();
  }
  limpiarEstado() { // Limpiar estado
    this.archivoProcesadoSubject.next(null);
    this.errorSubject.next(null);
  }
}