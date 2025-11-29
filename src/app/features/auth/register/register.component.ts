import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  registerForm = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    lastName: ['', [Validators.maxLength(50)]], // Opcional según API
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    // Mapeo seguro usando el valor del formulario
    const request = {
      firstName: this.registerForm.value.firstName!,
      lastName: this.registerForm.value.lastName || undefined,
      email: this.registerForm.value.email!,
      password: this.registerForm.value.password!
    };

    this.authService.register(request).subscribe({
      next: () => {
        // Al registrarse exitosamente, el backend devuelve el token.
        // El authService ya lo guardó, así que redirigimos directo al dashboard.
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Registration error', err);
        this.isLoading.set(false);
        // UX: Mensaje amigable si el correo ya existe (409) o error genérico
        if (err.status === 409) {
          this.errorMessage.set('Este correo ya está registrado.');
        } else {
          this.errorMessage.set('Error en el registro. Intenta nuevamente.');
        }
      }
    });
  }
}
