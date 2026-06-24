import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // ← Cambia esto
@Component({
  selector: 'app-dialog-confirm',
  standalone: true,
  imports: [CommonModule,FormsModule],
  template: `
    <div class="dialog-overlay" *ngIf="visible" (click)="onOverlayClick($event)">
      <div class="dialog-box" (click)="$event.stopPropagation()">
        <p class="dialog-message">{{ message }}</p>
        <p class="dialog-detail" *ngIf="detail">{{ detail }}</p>
        
        <input *ngIf="showInput" type="text" class="form-control mb-3" 
               [(ngModel)]="inputValue" 
               placeholder="Nuevo valor sugerido">
        
        <div class="dialog-buttons">
          <button class="btn btn-primary" (click)="onConfirm()">
            Aceptar
          </button>
          <button class="btn btn-secondary" (click)="onCancel()">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1050;
    }
    
    .dialog-box {
      background: white;
      border-radius: 8px;
      padding: 24px;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    }
    
    .dialog-message {
      font-size: 18px;
      margin-bottom: 16px;
      color: #333;
    }
    
    .dialog-detail {
      font-size: 14px;
      color: #666;
      margin-bottom: 20px;
    }
    
    .dialog-buttons {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }
  `]

  // templateUrl: './dialog-confirm.component.html',
  // styleUrl: './dialog-confirm.component.css'
})
export class DialogConfirmComponent {
  @Output() confirmed = new EventEmitter<{ confirmed: boolean, value?: string }>();
  
  visible = false;
  message = '';
  detail = '';
  showInput = false;
  inputValue = '';
  
  show(message: string, detail?: string, showInput: boolean = false): void {
    this.message = message;
    this.detail = detail || '';
    this.showInput = showInput;
    this.inputValue = '';
    this.visible = true;
  }
  
  hide(): void {
    this.visible = false;
  }
  
  onConfirm(): void {
    this.confirmed.emit({ confirmed: true, value: this.inputValue });
    this.hide();
  }
  
  onCancel(): void {
    this.confirmed.emit({ confirmed: false });
    this.hide();
  }
  
  onOverlayClick(event: MouseEvent): void {
    this.onCancel();
  }
}
