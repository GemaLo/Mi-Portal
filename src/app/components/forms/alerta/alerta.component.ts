import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-alerta',
  imports: [CommonModule],
  templateUrl: './alerta.component.html',
  styleUrl: './alerta.component.css'
})
export class AlertaComponent {
  mostrar = false;
  mensaje = "";
  titulo = "Confirmación"
  txtAceptar = "Aceptar";
  txtCancelar = "Cancelar";


  private resolverPromesa: (value: boolean) => void = () => {};

  // Ahora el método acepta un objeto de configuración con valores por defecto
  abrir(config: { titulo?: string, mensaje: string, btnAceptar?: string, btnCancelar?: string }): Promise<boolean> {
    this.mensaje = config.mensaje;
    this.titulo = config.titulo || 'Confirmación';
    this.txtAceptar = config.btnAceptar || 'Aceptar';
    this.txtCancelar = config.btnCancelar || 'Cancelar';
    
    this.mostrar = true;

    return new Promise<boolean>((resolve) => {
      this.resolverPromesa = resolve;
    });
  }

  cerrar(respuesta: boolean) {
    this.mostrar = false;
    this.resolverPromesa(respuesta);
  }

}
