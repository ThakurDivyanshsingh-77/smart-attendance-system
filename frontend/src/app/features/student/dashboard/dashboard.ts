import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

// Material Imports
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // 🔥 IMP: Spinner Module

import { AuthService, User } from '../../../core/services/auth';
import { AttendanceService } from '../../../core/services/attendance.service';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatCardModule,
    MatProgressBarModule,
    MatProgressSpinnerModule // 🔥 Isko yahan hona zaroori hai
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class StudentDashboardComponent implements OnInit {

  user: User | null = null;
  stats: any = {
    percentage: 0,
    totalClasses: 0,
    present: 0,
    absent: 0
  };
  loading = true; // Default loading true
  currentDate = new Date();

  constructor(
    private auth: AuthService,
    private attendance: AttendanceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.user = this.auth.getCurrentUser();
    this.fetchStats();
  }

  get firstName(): string {
    if (!this.user || !this.user.name) {
      return 'Student';
    }
    return this.user.name.split(' ')[0];
  }

  fetchStats() {
    this.loading = true;
    
    this.attendance.getStudentStats().subscribe({
      next: (res) => {
        console.log('✅ Stats Loaded:', res);
        if (res.success) {
          this.stats = {
            percentage: res.percentage || 0,
            totalClasses: res.totalClasses || 0,
            present: res.present || 0,
            absent: res.absent || 0
          };
        }
        this.loading = false; // Stop spinner
      },
      error: (err) => {
        console.error('❌ Failed to load stats', err);
        // Agar error aaye tab bhi spinner band karo
        this.loading = false; 
      }
    });
  }

  markAttendance(): void {
    this.router.navigate(['/student/mark-attendance']);
  }

  viewReports(): void {
    this.router.navigate(['/student/reports']);
  }

  viewHistory(): void {
    this.router.navigate(['/student/history']);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}