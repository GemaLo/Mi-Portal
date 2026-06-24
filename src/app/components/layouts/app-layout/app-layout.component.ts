import { Component, OnInit, HostListener } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
@Component({
  selector: 'app-app-layout',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    NavbarComponent,
    SidebarComponent],
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.css'
})
export class AppLayoutComponent implements OnInit {
  isSidebarCollapsed = false;
  pageTitle = 'Mi Portal RH';
  pageDetalle = '';
  userName = 'Luis David Mtz';
  userRole = 'Nombre puesto';

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Actualizar título según ruta
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updatePageTitle();
      this.updatePageDetalle();
    });
    
    // Manejo responsive inicial
    this.handleResponsive();
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  @HostListener('window:resize')
  onResize(): void {
    this.handleResponsive();
  }

  private handleResponsive(): void {
    const windowWidth = window.innerWidth;
    if (windowWidth <= 1024) {
      this.isSidebarCollapsed = false;
    }
  }

  private updatePageTitle(): void {
    const currentRoute = this.router.url;
    const titleMap: { [key: string]: string } = {
      '/dashboard': 'Dashboard',
      '/empleados': 'Control de permisos',
      '/plantillas': 'Plantillas Excel',
      '/plazas': 'Creación de plazas',
      '/usuarios/control-de-permisos': 'Control de permisos',
      '/sistemas-modulos': 'Sistemas y modulos',
      '/plazas/creacion':'Creación de plazas',
      '/recursos-materiales/scripts': 'Control de Scripts BD',
      '/altas-masivas': 'Altas masivas'
    };
    
    this.pageTitle = titleMap[currentRoute] || 'Mi Portal RH';
  }
  private updatePageDetalle(): void {
    const currentRoute = this.router.url;
    const detalleMap: { [key: string]: string } = {
      '/dashboard': 'Dashboard',
      '/empleados': 'Control de permisos',
      '/plantillas': 'Plantillas Excel',
      '/plazas': 'Creación de plazas',
      '/usuarios/control-de-permisos': 'Control de permisos',
      '/sistemas-modulos': 'Sistemas y modulos',
      '/plazas/creacion':'Creación de plazas',
      '/recursos-materiales/scripts': 'Gestión de vistas, funciones, tablas, procedimientos y triggers',
      '/altas-masivas': 'Altas'
    };
    
    this.pageDetalle = detalleMap[currentRoute] || 'Mi Portal RH';
  }
}
