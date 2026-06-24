import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgModel } from '@angular/forms';
import { environment } from '../../../../../../environments/environment';

// Servicios
import { ApiService } from '../../../../../services/api.service';
import { ProcesarExcelAltasMasivasService, ResultadoProcesamiento } from '../../../../../services/procesar-excel-altas-masivas.service';
import { ColeccionesUtilesService } from '../../../../../services/colecciones-utiles.service';

// Componentes
import { SubirArchivoComponent } from '../../../../forms/subir-archivo/subir-archivo.component';
import { AlertaComponent } from '../../../../forms/alerta/alerta.component';
import { FormSolicitudesComponent } from '../../../../forms/form-solicitudes/form-solicitudes.component';

interface EstadoArchivo {
  idInstancia: string;
  titulo: string;
  completado: boolean;
  archivos: File[];
  datosProcesados?: any[];
  procesando?: boolean;
  error?: string;
  requerido: boolean;
}

@Component({
  selector: 'app-empleados-masivos',
  standalone: true,
  imports: [CommonModule,SubirArchivoComponent,AlertaComponent,FormSolicitudesComponent,FormsModule],
  templateUrl: './empleados-masivos.component.html',
  styleUrl: './empleados-masivos.component.css'
})
export class EmpleadosMasivosComponent {
  
  // Estados de cada archivo
  estadoPersonas: EstadoArchivo = { idInstancia: 'personas', titulo: 'Personas', completado: false, archivos: [],datosProcesados: [], requerido: true };
  estadoAsignacion: EstadoArchivo = { idInstancia: 'asignacion', titulo: 'Asignacion', completado: false, archivos: [],datosProcesados: [], requerido: true };
  estadoMetodosDePago: EstadoArchivo = { idInstancia: 'metodosDePago', titulo: 'Métodos de Pago', completado: false, archivos: [],datosProcesados: [], requerido: true };
  estadoDomicilios: EstadoArchivo = { idInstancia: 'domicilios', titulo: 'Domicilios', completado: false, archivos: [],datosProcesados: [], requerido: true };
 
  mostrarResumen: boolean = false;
  procesandoGlobal: boolean = false;
  progresoGlobal: number = 0;
  mensajeProgreso: string = '';

  apiUrl = environment.apiUrl;
  tipoRegimen: string = '';
  organoSeleccionado:string = 'SC';
  organoSelect:boolean = false;
  datosTemps:boolean = false;

  agregarSolicitud: boolean = false;

  // ORDEN CORRECTO de carga
  ordenCarga = ['personas', 'asignacion', 'metodosDePago', 'domicilios'];
 
  @ViewChild('miAlerta') alerta!: AlertaComponent;
  
  // @ViewChild('idPersonasTemp') solicitudesTemp!: FormSolicitudesComponent;


  constructor(private cdr: ChangeDetectorRef, private apiService:ApiService, 
    private excelProcessor: ProcesarExcelAltasMasivasService,private coleccionesUtiles: ColeccionesUtilesService) {
      this.validarTbTemp("personas",[]);
    }

  // ==========================================
  // MÉTODO PRINCIPAL: Recibe archivos del hijo
  // ==========================================
  async onArchivosSeleccionados(tipo: string, archivos: File[]) {
    console.log(`📥 Archivos recibidos de ${tipo}:`, archivos.length);
      await this.validarTbTemp(tipo,null)
      if (this.datosTemps == true){
        if (await this.fnAlertaLimpiar(tipo) == false){
          return;
        }
      }

    if (archivos.length === 0) {
      // Se eliminaron todos los archivos
      const estado = this.obtenerEstado(tipo);
      if (estado) {
        estado.completado = false;
        estado.datosProcesados = [];
        estado.error = undefined;
        this.cdr.detectChanges();
      }
      return;
    }
    
    const archivo = archivos[0]; // Tomar el primer archivo
    const estado = this.obtenerEstado(tipo);
    
    if (!estado) return;
    
    // Marcar como procesando
    estado.procesando = true;
    estado.error = undefined;
    this.cdr.detectChanges();
    
    try {
      // Validar según el tipo de archivo
      const esValido = await this.validarArchivoSegunTipo(tipo, archivo);
      if (!esValido) {
        estado.completado = false;
        estado.error = `El archivo no es válido para ${estado.titulo}`;
        return;
      }
      
      // Procesar el Excel
      const resultado = await this.excelProcessor.procesarExcelCompleto(archivo, this.tipoRegimen, tipo,{
          onProgreso: (porcentaje, mensaje) => {
            console.log(`onArchivosSeleccionados() Progreso ${tipo}: ${porcentaje}% - ${mensaje}`);
          }
        }
      );
      
      if (resultado.exito) {
        console.log("No ordenado",resultado.datos);
        const porEmpleado = this.coleccionesUtiles.ordenarListaDinamica(resultado.datos, 'asc', 'num_empleado');
        console.log("Ordenado",porEmpleado);
        estado.archivos = archivos;
        estado.datosProcesados = porEmpleado;
        estado.completado = true;
        estado.error = undefined;
        console.log(`✅ ${tipo} procesado: ${resultado.totalRegistros} registros: `, estado.datosProcesados);
        if(tipo == "asignacion"){
          
        }
      } else {
        estado.completado = false;
        estado.error = resultado.mensaje;
        console.error(`❌ Error en ${tipo}:`, resultado.mensaje);
        
        // Si el régimen es incompatible, limpiar el archivo
        if (resultado.regimenCompatible === false) {
          alert(resultado.mensaje);
          estado.archivos = [];
        }
      }
      
    } catch (error) {
      console.error(`Error procesando ${tipo}:`, error);
      estado.completado = false;
      estado.error = `Error inesperado: ${error}`;
    } finally {
      estado.procesando = false;
      this.cdr.detectChanges();
    }
  }

  // ==========================================
  // VALIDACIONES POR TIPO DE ARCHIVO
  // ==========================================
  
  private async validarArchivoSegunTipo(tipo: string, archivo: File): Promise<boolean> {
    // Validar extensión
    const extension = archivo.name.split('.').pop()?.toLowerCase();
    if (extension !== 'xlsx' && extension !== 'xls' && extension !== 'xlsm') {
      alert(`❌ El archivo debe ser Excel (.xlsx o .xls)`);
      return false;
    }
    console.log("Entrar a validarArchivoSegunTipo()",archivo);
    // Aquí puedes agregar validaciones específicas según el tipo
    switch(tipo) {
      case 'personas':
        // Validar que tenga columnas específicas para personas
        return true;
      case 'asignacion':
        return true;
      case 'metodosDePago':
        return true;
      case 'domicilios':
        return true;
      default:
        return true;
    }
  }

  // ==========================================
  // VERIFICAR SI UNA INSTANCIA ESTÁ ACTIVA
  // ==========================================
  estaActivo(idInstancia: string): boolean {
    const estado = this.obtenerEstado(idInstancia);
    // Si ya está completado, no mostrar el componente
    if (estado?.completado) {
      return false;
    }
    const indice = this.ordenCarga.indexOf(idInstancia);
    // Primer form: siempre activo
    if (indice === 0) {
      return true;
    }
    // Verificar si el anterior está completado
    const idAnterior = this.ordenCarga[indice - 1];
    const estadoAnterior = this.obtenerEstado(idAnterior);
    
    return estadoAnterior?.completado === true;
  }

  // ==========================================
  // MÉTODOS AUXILIARES
  // ==========================================
  private obtenerEstado(tipo: string): EstadoArchivo | undefined {
    switch(tipo) {
      case 'personas': return this.estadoPersonas;
      case 'asignacion': return this.estadoAsignacion;
      case 'metodosDePago': return this.estadoMetodosDePago;
      case 'domicilios': return this.estadoDomicilios;
      default: return undefined;
    }
  }

  get todosEstados(): EstadoArchivo[] {
    return [this.estadoPersonas, this.estadoAsignacion, this.estadoMetodosDePago, this.estadoDomicilios];
  }

  get archivosCompletados(): number {
    return this.todosEstados.filter(e => e.completado).length;
  }
  
  get archivosRequeridos(): EstadoArchivo[] {
    return this.todosEstados.filter(e => e.requerido);
  }
  
  get archivosFaltantes(): number {
    return this.archivosRequeridos.length - this.archivosCompletados;
  }
  
  get todosCompletados(): boolean {
    return this.archivosCompletados === this.archivosRequeridos.length && this.archivosRequeridos.length > 0;
  }
  
  get progresoTotal(): number {
    return (this.archivosCompletados / this.archivosRequeridos.length) * 100;
  }

  obtenerSiguientePendiente(): string {
    const pendiente = this.todosEstados.find(e => !e.completado);
    return pendiente ? pendiente.titulo : 'Ninguno';
  }

  // ==========================================
  // ACCIONES DE BOTONES
  // ==========================================
  
  aceptarTodos() {
    if (this.todosCompletados) {
      console.log('🎉 Todos los archivos completados:', {
        personas: {
          nombre: this.estadoPersonas.archivos.map(f => f.name), 
          datos: this.estadoPersonas.datosProcesados
        },
        asignacion: this.estadoAsignacion.archivos.map(f => f.name),
        metodosDePago: this.estadoMetodosDePago.archivos.map(f => f.name),
        domicilios: this.estadoDomicilios.archivos.map(f => f.name)
      });
      
      this.mostrarResumen = true;
      this.validarIntegridadDeLayouts();
      // Aquí puedes enviar los datos a tu backend
      // this.enviarDatosAlServidor();
      
      setTimeout(() => {
        this.mostrarResumen = false;
      }, 5000);
    } else {
      alert(`⚠️ Faltan ${this.archivosFaltantes} archivo(s) por cargar`);
    }
  }

  reiniciarTipo(tipo:string) {
    console.log("reiniciar",tipo)
    if (confirm(`¿Estás seguro de que deseas reiniciar la carga de ${tipo}?`)) {
      if (tipo == "todo"){
        this.estadoPersonas = { ...this.estadoPersonas, completado: false, datosProcesados: [], archivos: [] };
        this.estadoAsignacion = { ...this.estadoAsignacion, completado: false, datosProcesados: [], archivos: [] };
        this.estadoMetodosDePago = { ...this.estadoMetodosDePago, completado: false, datosProcesados: [], archivos: [] };
        this.estadoDomicilios = { ...this.estadoDomicilios, completado: false, datosProcesados: [], archivos: [] };
        this.mostrarResumen = false;
        console.log('🔄 Todos los estados reiniciados');
      }else if(tipo == "personas"){
        this.estadoPersonas = { ...this.estadoPersonas, completado: false, datosProcesados: [], archivos: [] };
      }else if(tipo == "asignacion"){
        this.estadoAsignacion = { ...this.estadoAsignacion, completado: false, datosProcesados: [], archivos: [] };
      }else if(tipo == "metodosDePago"){
        this.estadoMetodosDePago = { ...this.estadoMetodosDePago, completado: false, datosProcesados: [], archivos: [] };
      }else if(tipo == "domicilios"){
          this.estadoDomicilios = { ...this.estadoDomicilios, completado: false, datosProcesados: [], archivos: [] };
      }else {
        alert("Error");
      }
      this.cdr.detectChanges();
    }
  }
  
  validarIntegridadDeLayouts() {
    const personas = this.estadoPersonas.datosProcesados;
    const asignaciones = this.estadoAsignacion.datosProcesados;
    const metodosPago = this.estadoMetodosDePago.datosProcesados;
    const domicilios = this.estadoDomicilios.datosProcesados;

    // Validación de seguridad inicial
    if (!personas || !asignaciones || !metodosPago || !domicilios) {
      console.error('⚠️ Uno o más layouts no han sido cargados todavía.');
      return { exito: false, detalle: 'Faltan archivos por cargar.' };
    }

    console.time('Validación Completa del Pipeline 🚀');

    // ==========================================
    // PASO 1: Personas con Asignaciones
    // ==========================================
    const setAsignaciones = new Set(asignaciones.map((a: any) => a.num_empleado));
    const personasSinAsignacion = personas.filter((p: any) => !setAsignaciones.has(p.num_empleado));

    // ==========================================
    // PASO 2: Asignaciones con Métodos de Pago
    // ==========================================
    const setMetodosPago = new Set(metodosPago.map((mp: any) => mp.num_empleado));
    const asignacionesSinMetodoPago = asignaciones.filter((a: any) => !setMetodosPago.has(a.num_empleado));

    // ==========================================
    // PASO 3: Métodos de Pago con Domicilios
    // ==========================================
    const setDomicilios = new Set(domicilios.map((d: any) => d.num_empleado));
    const metodosPagoSinDomicilio = metodosPago.filter((mp: any) => !setDomicilios.has(mp.num_empleado));

    console.timeEnd('Validación Completa del Pipeline 🚀');

    // ==========================================
    // EVALUACIÓN DE RESULTADOS
    // ==========================================
    const tieneErrores = 
      personasSinAsignacion.length > 0 || 
      asignacionesSinMetodoPago.length > 0 || 
      metodosPagoSinDomicilio.length > 0;

    if (tieneErrores) {
      console.warn('❌ Se encontraron inconsistencias entre los archivos:', {
        personasSinAsignacion,
        asignacionesSinMetodoPago,
        metodosPagoSinDomicilio
      });

      return {
        exito: false,
        errores: {
          personas: personasSinAsignacion.length,
          asignaciones: asignacionesSinMetodoPago.length,
          metodosPago: metodosPagoSinDomicilio.length
        },
        listasDetalle: { personasSinAsignacion, asignacionesSinMetodoPago, metodosPagoSinDomicilio }
      };
    }

    console.log('✅ ¡Perfecto! Todos los numeros de empleado consistente en los 4 archivos.');
    return { exito: true, errores: null };
  }

  // ==========================================
  // MÉTODOS DE CONSULTA DE LAYOUTS: Consulta en la base de datos
  // ==========================================

  /*public validarPersonas(tipo:string,archivo:File[]){
    console.log("Entro a consultar personas");
    this.procesarExcel(tipo,archivo);
    return "true";
  }
  public validarAsignaciones(tipo:string,archivos:File){
    console.log("Entro a validar Asignaciones");
    this.procesarExcel(tipo,archivos);
    return "true";
  }

  public validarMetodosDePago(tipo:string,archivos:File){
    console.log("Entro a validar Metodos de pago");
    this.procesarExcel(tipo,archivos);
    return "true";
  }
  public validarDomicilios(tipo:string,archivos:File){
    console.log("Entro a validar personas");
    this.procesarExcel(tipo,archivos);
    return "true";
  }*/

  isLoading: boolean = false;
  // isLoadingDownload: boolean = false;
  showResults: boolean = false;
  // showAddPlazas: boolean = false;
  validando: boolean = false;
  // cambiarEstadoPlaza: boolean = false;
  // datoAnteriorAeditar: string = '';

  public procesarExcel(){
    // Aqui iria la llmada a mi servicio nuevo
  }

  public descargarArchivoTrabajado(tipo:string){
    console.log(`Descargar archivo trabajado(${tipo})`);
    if (tipo == "personas"){
      this.personasTrabajadas();
    }
  }
  private personasTrabajadas(){
    console.log("personasTrabajadas()");
  }

  async validarTbTemp(tipo:string,dts:any){
  console.log("Tipo: -----",tipo);
  console.log(dts);
  try {
    const formData = new FormData(); // Asegúrate de poner los paréntesis ()
    formData.append('tipo', tipo);
    const resValidacionTbTemp = await fetch(`${this.apiUrl}/validarTbTemp`, {
      method: 'POST',
      headers: {
        'X-CSRF-TOKEN': this.apiService.getCsrfToken(),
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      credentials: 'include',
      body: formData,
      mode: 'cors'
    });

    // Validar si el servidor respondió con un error (ej: 404, 500)
    if (!resValidacionTbTemp.ok) {
      throw new Error(`Error en el servidor: ${resValidacionTbTemp.status} ${resValidacionTbTemp.statusText}`);
    }

    // En 'fetch', necesitas procesar el JSON de la respuesta para poder leerlo
    const rValTbTemp = await resValidacionTbTemp.json();
    
    console.log("**** Petición exitosa 1 ****");
    console.log(rValTbTemp);
    this.datosTemps = rValTbTemp.estado; 
    // if( dts !== null){
      this.enviarTemporalfn(rValTbTemp,tipo,dts);
    // }else{
    // console.log("**** Sin Dts a enviar ****");

    // }


  } catch (error ) {
    console.log("---- Ocurrió un error ----");
    console.error(error);
  }
  }


  ///////////////////////////////////
  // Agregado a tablas Temporales //
  /////////////////////////////////
  async fnAlertaLimpiar(tipo:string){
    const alertaLimpiarTbTemp = await this.alerta.abrir({
      titulo: '⚠️ Advertencia de Datos',
      mensaje: `La tabla temporal ya contiene registros de ${tipo}. ¿Deseas borrarlos todos para iniciar la nueva importación?`,
      btnAceptar: 'Sí, borrar todo',
      btnCancelar: 'No, mantener'
    });
    if (alertaLimpiarTbTemp) {
      console.log("El usuario aceptó borrar la tabla temporal");
      var resLimpiar = await this.limpiarTbTemp(tipo);
      if (resLimpiar.limpiar == true){
        this.datosTemps = false;
      }
      return true;
    } else {
      console.log("El usuario canceló la operación");
      return false;
    }
  }
  async enviarTemporalfn(rValTbTemp:any,tipo:string,dts:any) {
    console.log("T____", tipo, "Enviar datos a tabla temporal", `${this.apiUrl}/excel/validarTabla`);
    try {
      if (rValTbTemp.estado == true){
        // Alerta 1: Para cuando la tabla tiene datos (Mensaje Dinámico)
        if (await this.fnAlertaLimpiar(tipo) == true){
          this.agregarAtbTemp(tipo,dts);
        }
      } else {
        console.log("Tabla sin datos - Procediendo con la inserción");
        this.agregarAtbTemp(tipo,dts);
      }
  
    } catch (error ) {
      console.log("---- Ocurrió un error ----");
      console.error(error);
    }
  }
  idPersonasTemp:number = 0;
  async limpiarTbTemp(tipo:string){
    const formData = new FormData();
    formData.append('limpiar', "true");
    formData.append('tipo', tipo);
    const resLPT = await fetch(`${this.apiUrl}/limpiar-tabla-temporales`, {
      method: 'POST',
      headers: {
        'X-CSRF-TOKEN': this.apiService.getCsrfToken(),
        // 'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      credentials: 'include',
      body: formData,
    });

    const resLimpiar = await resLPT.json();
    console.log("**** Petición Limpiar exitosa ****");
    console.log(resLimpiar);
    this.datosTemps = resLimpiar.limpiar = true ? false : true; 
    return resLimpiar.limpiar;
  }
  async agregarAtbTemp(tipo:string,dts:any){ //select * from TB_ALTAS_PLAZAS_MASIVAS
    console.log("Entra a: agregarAtbTemp", tipo);
    var addDatos = true;
    if (addDatos && (!dts || dts.length === 0)) {
      // alert('No hay datos procesados para descargar.');
      return;
    }
    // console.log(this.organoSeleccionado);
    let datosAtemp = {};
    if (addDatos) {
      datosAtemp = {
        datos: dts,
        timestamp: new Date().getTime(),
        tipoOrgano:this.organoSeleccionado,
        tipo:tipo,
      };
    } else {
      datosAtemp = {
        datos: [],
        timestamp: new Date().getTime(),
        tipoOrgano:this.organoSeleccionado,
        tipo:null,
      };
    }
    console.log("datosAtemp");
    console.log(datosAtemp);//*/
    
    try {
      const response = await fetch(`${this.apiUrl}/fn-cargar-tabla-temp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': this.apiService.getCsrfToken(),
          'Accept': 'application/json'
        },
        body: JSON.stringify(datosAtemp)
      });
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      const resCarga = await response.json();
        console.log("**** Petición Subir a temp exitosa ****");
        console.log(resCarga);
        
      alert(`¡Archivo cargado exitosamente! (${dts.length} registros)`);
      
    } catch (error) {
      console.error('Error:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      // this.isLoadingDownload = false;
    }
  }

  // mostrarFormSolicitud
  mostrarFormSolicitudes:boolean = false;
}