import { Component, Input } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';


interface MenuItem {
  title: string;
  icon: string;
  route: string;
  badge?: number;
  isActive?: boolean;
  children?: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  @Input() isCollapsed = false;
  
  currentRoute = '';

  // Menú Principal
  mainMenu: MenuItem[] = [
    {
      title: 'Inicio',
      icon: 'fas fa-tachometer-alt',
      route: '/dashboard',
      isActive: true
    },
    {
      title: 'Control de permisos(Admin)',
      icon: 'fas fa-user-tie',
      route: 'usuarios/control-de-permisos',
      badge: 0
    },
    {
      title: 'Sistemas y modulos',
      icon: 'fas fa-user-tie',
      route: '/sistemas-modulos',
      badge: 0
    },
    {
      title: 'Recursos Materiales',
      icon: 'fas fa-user-tie',
      route: '/recursos-materiales/',
      badge: 0
    },
    {
      title: 'Control de scripts DB',
      icon: 'fas fa-user-tie',
      route: '/recursos-materiales/scripts/',
      badge: 0
    }
  ];

  // Menú Gestión
  gestionMenu: MenuItem[] = [
    {
      title: 'Usuarios',
      icon: 'fas fa-users',
      route: '/usuarios'
    },
    {
      title: 'Vacaciones',
      icon: 'fas fa-umbrella-beach',
      route: '/vacaciones',
      badge: 7
    },
    {
      title: 'Plantillas',
      icon: 'fas fa-file-excel',
      route: '/plantillas'
    },
    {
      title: 'Creación de plazas',
      icon: 'fas fa-file-contract',
      route: '/plazas/creacion'
    },
    {
      title: 'Altas masivas',
      icon: 'fas fa-file-contract',
      route: '/altas-masivas/'
    },
    {
      title: 'Gestión de plazas',
      icon: 'fa-solid fa-image-portrait',
      route: '/plazas/gestion'
    }
  ];

  // Menú Administración
  adminMenu: MenuItem[] = [
    {
      title: 'Configuración',
      icon: 'fas fa-cogs',
      route: '/configuracion'
    }
  ];

  constructor(private authService: AuthService, private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.currentRoute = event.url;
      this.updateActiveMenu();
    });
  }

  private updateActiveMenu(): void {
    // Actualizar estado activo para todos los menús
    const allItems = [...this.mainMenu, ...this.gestionMenu, ...this.adminMenu];
    allItems.forEach(item => {
      item.isActive = this.currentRoute === item.route;
    });
  }

  getBadgeClass(badge: number): string {
    if (badge === 0) return 'badge-zero';
    if (badge < 5) return 'badge-low';
    return 'badge-high';
  }
  
  onLogout() {
    this.authService.logout().subscribe({
      next: () => {
        this.clearSession();
        console.log('Token logout guardado:', localStorage.getItem('auth_token'));
      },
      error: () => {
        // Incluso si el token ya expiró en el server, limpiamos el cliente
        this.clearSession();
      }
    });
  }

  private clearSession() {
    localStorage.removeItem('auth_token');
    this.router.navigate(['/login']);
  }
}