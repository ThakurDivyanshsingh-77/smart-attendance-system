import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-signup',
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
        Student registration for seamless attendance tracking.
      </p>

      <div class="mt-10 text-sm text-[#F0EDE5]/60">
        © 2026 College ERP Platform
      </div>
    </div>

    <!-- SIGNUP FORM -->
    <div class="flex flex-col justify-center px-4 sm:px-6">

      <!-- MOBILE BRAND -->
      <div class="lg:hidden text-center mb-10">
        <h1 class="text-4xl font-extrabold text-[#004643]">
          Smart Attendance
        </h1>
        <p class="mt-2 text-sm text-[#004643]/70">
          Create your student account
        </p>
      </div>

      <!-- CARD -->
      <div class="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">

        <div class="text-center mb-8">
          <h2 class="text-3xl font-bold text-[#004643]">
            Student Registration
          </h2>
          <p class="text-sm text-gray-500 mt-2">
            Fill details to create account
          </p>
        </div>

        <form [formGroup]="signupForm" (ngSubmit)="onSubmit()" class="space-y-5">

          <input
            type="text"
            formControlName="name"
            placeholder="Full Name"
            class="w-full rounded-xl px-4 py-3 border border-gray-300
                   focus:border-[#004643] focus:ring-2 focus:ring-[#004643]/20 outline-none"/>

          <input
            type="email"
            formControlName="email"
            placeholder="Email Address"
            class="w-full rounded-xl px-4 py-3 border border-gray-300
                   focus:border-[#004643] focus:ring-2 focus:ring-[#004643]/20 outline-none"/>

          <input
            type="password"
            formControlName="password"
            placeholder="Password (min 6 chars)"
            class="w-full rounded-xl px-4 py-3 border border-gray-300
                   focus:border-[#004643] focus:ring-2 focus:ring-[#004643]/20 outline-none"/>

          <input
            type="text"
            formControlName="rollNumber"
            placeholder="Roll Number"
            class="w-full rounded-xl px-4 py-3 border border-gray-300
                   focus:border-[#004643] focus:ring-2 focus:ring-[#004643]/20 outline-none"/>

          <!-- YEAR + SEM -->
          <div class="grid grid-cols-2 gap-4">
            <select
              formControlName="year"
              class="w-full rounded-xl px-4 py-3 border border-gray-300
                     focus:border-[#004643] focus:ring-2 focus:ring-[#004643]/20 outline-none">
              <option value="" disabled>Select Year</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
            </select>

            <select
              formControlName="semester"
              class="w-full rounded-xl px-4 py-3 border border-gray-300
                     focus:border-[#004643] focus:ring-2 focus:ring-[#004643]/20 outline-none">
              <option value="" disabled>Select Semester</option>
              <option *ngFor="let sem of semesters" [value]="sem">
                Semester {{ sem }}
              </option>
            </select>
          </div>

          <!-- BUTTON -->
          <button
            type="submit"
            [disabled]="signupForm.invalid || loading"
            class="w-full py-3 rounded-xl font-semibold text-[#F0EDE5]
                   bg-[#004643] hover:bg-[#003a38]
                   shadow-lg transition-all duration-200
                   disabled:opacity-60">

            <span *ngIf="!loading">Create Account</span>
            <span *ngIf="loading" class="animate-pulse">Creating...</span>
          </button>
        </form>

        <div class="text-center mt-6 text-sm text-gray-600">
          Already have an account?
          <a routerLink="/login" class="font-semibold text-[#004643] hover:underline">
            Login
          </a>
        </div>

      </div>
    </div>
  </div>
  `
})
export class SignupComponent {

  signupForm: FormGroup;
  loading = false;
  semesters = [1, 2, 3, 4, 5, 6];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.signupForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rollNumber: ['', Validators.required],
      year: ['', Validators.required],
      semester: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.signupForm.invalid) return;

    this.loading = true;

    this.authService.signup(this.signupForm.value).subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open('Registration successful!', 'Close', { duration: 3000 });
        this.router.navigate(['/student/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(
          err?.error?.message || 'Registration failed',
          'Close',
          { duration: 3000 }
        );
      }
    });
  }
}
