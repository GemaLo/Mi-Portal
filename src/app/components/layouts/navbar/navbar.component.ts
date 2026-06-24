import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-navbar',
  standalone: true, 
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  @Input() pageTitle = 'Dashboard';
  @Input() pageDetalle = 'Dashboard';
  @Input() userName = 'Usuario';
  @Input() userRole = 'Rol';
  @Output() toggleSidebar = new EventEmitter<void>();

  notifications = 5;
  messages = 3;

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  simulateNotification(): void {
    if (this.notifications > 0 && Math.random() > 0.7) {
      this.notifications--;
    }
  }

  simulateMessages(): void {
    if (this.messages > 0 && Math.random() > 0.5) {
      this.messages--;
    }
  }

  getUserInitials(): string {
  return this.userName
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}
}
