import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { CreacionDePlazasComponent } from './components/paginas/administrativo/excel/creacion-de-plazas/creacion-de-plazas.component';
import { ControlDePermisosComponent } from './components/paginas/administrativo/usuarios/control-de-permisos/control-de-permisos.component';
// Principal
import { SistemasModulosComponent } from './components/paginas/principal/sistemas-modulos/sistemas-modulos.component';
import { authGuard } from './guards/auth.guard'; // Asegúrate de que el nombre coincida
import { AppLayoutComponent } from './components/layouts/app-layout/app-layout.component';
import { RecursosMaterialesComponent } from './components/paginas/recursos-materiales/recursos-materiales.component';
import { AltasMasivasComponent } from './components/paginas/principal/altas-masivas/altas-masivas.component';

// Recursos Materiales
import { ControlScriptsDbComponent } from './components/paginas/recursos-materiales/control-scripts-db/control-scripts-db.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, title: 'Acceso' },
    // {path: 'dashboard', component: DashboardComponent},
  // { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] }, // RUTA PROTEGIDA
  { path: '', redirectTo: '/login', pathMatch: 'full', title: 'Acceso' },
  {
    path: '',  // Ruta raíz
    component: AppLayoutComponent,  // ← Este es el contenedor con navbar/sidebar
    canActivate: [authGuard],  // Protege todas las rutas hijas
    children: [  // ← Estas rutas se cargan DENTRO del layout
      { 
        path: 'dashboard', 
        component: DashboardComponent,  // ← Se carga dentro de <router-outlet> del layout
        title:'Mi Portal RH'
      },
      { path: '', 
        redirectTo: 'dashboard',  // Redirige de '/' a '/dashboard'
        pathMatch: 'full'
      },
      { path: 'plazas/creacion', component: CreacionDePlazasComponent, title:'Creacion de plazas'
       },
      { path: 'usuarios/control-de-permisos', component: ControlDePermisosComponent, title:'Control de usuarios'
       },
      { path: 'sistemas-modulos', component: SistemasModulosComponent, title:'Sistemas y modulos'
       },
      { path: 'recursos-materiales', component: RecursosMaterialesComponent, title:'Recursos Materiales'
       },
      { path: 'recursos-materiales/scripts', component: ControlScriptsDbComponent, title:'Control de Scripts'
       },
      { path: 'altas-masivas', component: AltasMasivasComponent, title:'Altas Masivas'
       },
      // { path: 'vacaciones', component: VacacionesComponent },
    ]
  },
  /*
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
      // Agrega más rutas aquí
      // { path: 'empleados', component: EmpleadosComponent },
      // { path: 'plantillas', component: PlantillasComponent },
    ]
  },//*/
  // { path: '**', redirectTo: '/login' }
];