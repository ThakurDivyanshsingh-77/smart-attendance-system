import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService, AuthResponse } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatSnackBarModule
  ],
  template: `
  <div class="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#F0EDE5]">

    <!-- LEFT BRAND -->
    <div class="hidden lg:flex flex-col justify-center px-16 bg-[#004643] text-[#F0EDE5]">
      <h1 class="text-5xl font-extrabold leading-tight">
        Smart <br /> Attendance <br /> System
      </h1>

      <p class="mt-6 text-lg text-[#F0EDE5]/80 max-w-md">
        A modern attendance platform for teachers and students.
      </p>

      <div class="mt-10 text-sm text-[#F0EDE5]/60">
        © 2026 College ERP Platform
      </div>
    </div>

    <!-- RIGHT LOGIN -->
    <div class="flex flex-col justify-center px-4 sm:px-6">

      <!-- MOBILE BRAND -->
      <div class="lg:hidden text-center mb-10">
        <h1 class="text-4xl font-extrabold text-[#004643]">
          Smart Attendance
        </h1>
        <p class="mt-2 text-sm text-[#004643]/70">
          Login to continue
        </p>
      </div>

      <!-- CARD -->
      <div class="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">

        <div class="text-center mb-8">
          <h2 class="text-3xl font-bold text-[#004643]">
            Welcome Back
          </h2>
          <p class="text-sm text-gray-500 mt-2">
            Login to your dashboard
          </p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-6">

          <!-- EMAIL -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              formControlName="email"
              placeholder="you@example.com"
              class="w-full rounded-xl px-4 py-3
                     border border-gray-300
                     focus:border-[#004643] focus:ring-2 focus:ring-[#004643]/20
                     outline-none transition" />
          </div>

          <!-- PASSWORD -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              formControlName="password"
              placeholder="••••••••"
              class="w-full rounded-xl px-4 py-3
                     border border-gray-300
                     focus:border-[#004643] focus:ring-2 focus:ring-[#004643]/20
                     outline-none transition" />
          </div>

          <!-- BUTTON -->
          <button
            type="submit"
            [disabled]="loginForm.invalid || loading"
            class="w-full py-3 rounded-xl font-semibold text-[#F0EDE5]
                   bg-[#004643] hover:bg-[#003a38]
                   shadow-lg hover:shadow-xl
                   transition-all duration-200
                   disabled:opacity-60">

            <span *ngIf="!loading">Login</span>

            <span *ngIf="loading" class="animate-pulse">
              Logging in...
            </span>
          </button>
        </form>

        <div class="text-center mt-6 text-sm text-gray-600">
          Don’t have an account?
          <a routerLink="/signup" class="font-semibold text-[#004643] hover:underline">
            Sign up as Student
          </a>
        </div>

      </div>
    </div>
  </div>
  `
})
export class LoginComponent {

  loginForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid || this.loading) return;

    this.loading = true;
    this.cdr.detectChanges();

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: (res: AuthResponse) => {
        this.loading = false;
        this.cdr.detectChanges();

        this.snackBar.open('Login successful', 'Close', { duration: 3000 });

        if (res.user.role === 'teacher') {
          this.router.navigate(['/teacher/dashboard']);
        } else {
          this.router.navigate(['/student/dashboard']);
        }
      },
      error: (err) => {
        this.loading = false;
        this.cdr.detectChanges();

        this.snackBar.open(
          err?.error?.message || 'Invalid email or password',
          'Close',
          { duration: 3000 }
        );
      }
    });
  }
}
