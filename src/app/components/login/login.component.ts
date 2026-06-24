// frontend/src/app/components/login/login.component.ts
import { Component,Injectable } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router} from '@angular/router';
import { AuthService } from '../../services/auth.service';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule], // 2. Agregar a la lista de imports del componente
  /*
  template: `
    <h2>Registro</h2>
    <input [(ngModel)]="regData.name" placeholder="Nombre">
    <input [(ngModel)]="regData.email" placeholder="Email">
    <input [(ngModel)]="regData.password" type="password" placeholder="Password">
    <button (click)="onRegister()">Registrar</button>

    <hr>

    <h2>Login</h2>
    <input [(ngModel)]="loginData.email" placeholder="Email">
    <input [(ngModel)]="loginData.password" type="password" placeholder="Password">
    <button (click)="onLogin()">Entrar</button>
  `,//*/
  styleUrls: ['./login.component.css'],
  templateUrl: './login.component.html',
})
@Injectable({ providedIn: 'root' })
export class LoginComponent {
//   loginForm: FormGroup;
  loading = false;
  showPassword = false;
  returnUrl: string = '/dashboard';
  loginData = {
    email: '',
    password: ''
  };
  constructor( private authService: AuthService, private router: Router ) { }

    // private authService = inject(AuthService);

  regData = { name: '', email: '', password: '' };

  onRegister() {
    this.authService.register(this.regData).subscribe({
      next: (res: any) => {
        // 1. Guardamos el token en el LocalStorage
        localStorage.setItem('auth_token', res.token);
        
        // 2. Redirigimos al Dashboard
        alert('¡Registro exitoso!');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Error al registrar', err);
      }
    });
  }

  onLogin() {
    this.authService.login(this.loginData).subscribe({
      next: (res: any) => {
        console.log(res);
        localStorage.setItem('auth_token', res.token);
        // alert("Usuario correcto ")
        // 2. Navegar después de confirmar que existe el token
        // console.log('Token guardado:', localStorage.getItem('auth_token'));
        if (localStorage.getItem('auth_token')) {
          console.log("toquen....");
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => 
        alert('Credenciales incorrectas' + JSON.stringify(err))
        // console.log(err);
    });
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