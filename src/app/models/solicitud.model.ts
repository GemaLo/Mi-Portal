import { ArchivoRequerimiento } from "./archivo.model";

export interface Requerimiento {
  idRequerimiento: number;
  folio: string;
  titulo: string;
  descripcion: string;
  tipoRequerimiento: 'ALTA' | 'INFORMACION' | 'DOCUMENTACION' | 'ACCESO' | 'SOPORTE' | 'OTRO';
  categoria: string;
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA' | 'URGENTE';
  ambiente: 'DEV' | 'QA' | 'PROD';
  
  estatus: 'PENDIENTE' | 'EN_REVISION' | 'ASIGNADO' | 'EN_PROCESO' | 'RESUELTO' | 'CANCELADO' | 'RECHAZADO';
  
  fechaSolicitud: Date;
  fechaLimite: Date | null;
  fechaAtencion: Date | null;
  
  numEmpSolicita: string;
  numEmpAsignado: string | null;
  numEmpAutoriza: string | null;
  numEmpAtiende: string | null;
  
  areaSolicitante: string;
  areaResponsable: string | null;
  departamento: string | null;
  
  motivo: string;
  observaciones: string;
  resultado: string | null;
  
  requiereArchivo: boolean;
  requiereValidacion: boolean;
  esReactivacion: boolean;
  
  tiempoEstimado: number | null;
  tiempoReal: number | null;
  
  archivos: ArchivoRequerimiento[];
  bitacora: BitacoraRequerimiento[];
  
  createdBy: string;
  createdAt: Date;
  updatedBy: string | null;
  updatedAt: Date;
}

export interface BitacoraRequerimiento {
  idBitacora: number;
  idRequerimiento: number;
  estatusAnterior: string | null;
  estatusNuevo: string;
  comentario: string;
  numEmpModifica: string;
  fechaCambio: Date;
}