export interface Archivo {
  idArchivo: number;
  nombreArchivo: string;
  tipoArchivo: string;
  tamano: number;
  descripcion: string;
  extension: string;
  urlAcceso: string;
  fechaSubida: Date;
  subidoPor: string;
}

export interface ArchivoRequerimiento {
  idReqArchivo: number;
  idRequerimiento: number;
  idArchivo: number;
  tipoArchivoReq: 'SOLICITUD' | 'RESPUESTA' | 'EVIDENCIA' | 'ANEXO' | 'OTRO';
  esPrincipal: boolean;
  orden: number;
  archivo?: Archivo;
}