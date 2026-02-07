import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { filter } from 'rxjs';

// Material Imports
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar'; // 🔥 New Import for Defaulter List

import { AuthService } from '../../../core/services/auth';
import { ApiService } from '../../../core/services/api';
import { AttendanceService } from '../../../core/services/attendance.service';

interface Subject {
  _id: string;
  name: string;
  code: string;
  year: number;
  semester: number;
}

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatToolbarModule, 
    MatIconModule,
    MatMenuModule, 
    MatFormFieldModule, 
    MatSelectModule, 
    MatButtonModule,
    MatCardModule, 
    RouterModule,
    MatProgressBarModule // 🔥 Added here
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class TeacherDashboardComponent implements OnInit {

  userName = '';
  activeSession: any = null;
  currentDate = new Date(); // 🔥 For displaying date

  // Form Controls
  yearControl = new FormControl<number | null>(null);
  semesterControl = new FormControl<number | null>(null);
  subjectControl = new FormControl<string | null>(null);

  semesters: number[] = [];
  subjects: Subject[] = [];

  // 🔥 NEW: Defaulter List Data (Dummy for UI)
  // You can later replace this with API data
  defaulters = [
    { name: 'Rohan Sharma', roll: '101', attendance: 45 },
    { name: 'Priya Verma', roll: '104', attendance: 52 },
    { name: 'Amit Singh', roll: '110', attendance: 60 },
  ];

  constructor(
    private authService: AuthService,
    private api: ApiService,
    private attendanceService: AttendanceService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.userName = user?.name || 'Teacher';
    
    // Check for active session immediately
    this.checkForActiveSession();

    // Re-check when navigating back to dashboard
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkForActiveSession();
    });
  }

  checkForActiveSession() {
    this.attendanceService.getTeacherHistory().subscribe({
      next: (res) => {
        if (res.sessions && res.sessions.length > 0) {
          // Find if any session is currently active
          const running = res.sessions.find((s: any) => s.isActive === true);
          
          if (running) {
            console.log('🔴 Active Session Found:', running);
            this.activeSession = running;
          } else {
            this.activeSession = null;
          }
          this.cdr.detectChanges(); // Force UI Update
        }
      },
      error: (err) => console.error(err)
    });
  }

  resumeSession() {
    if (this.activeSession && this.activeSession.subject) {
      const subId = this.activeSession.subject._id || this.activeSession.subject;
      this.router.navigate(['/teacher/live-attendance'], {
        queryParams: { subjectId: subId }
      });
    }
  }

  // --- Dropdown Logic ---
  onYearChange(): void {
    const year = this.yearControl.value;
    this.semesters = [];
    this.subjects = [];
    this.semesterControl.setValue(null);
    this.subjectControl.setValue(null);
    if (year === 1) this.semesters = [1, 2];
    if (year === 2) this.semesters = [3, 4];
    if (year === 3) this.semesters = [5, 6];
  }

  onSemesterChange(): void {
    const year = this.yearControl.value;
    const semester = this.semesterControl.value;
    if (!year || !semester) return;
    this.subjects = [];
    this.subjectControl.setValue(null);
    this.api.get<any>('/subjects', { year, semester, _ts: Date.now() }).subscribe({
      next: (res) => { this.subjects = [...(res.subjects || [])]; },
      error: () => { this.subjects = []; }
    });
  }

  startAttendance(): void {
    if (!this.subjectControl.value) return;
    if (this.activeSession) {
      if(!confirm('A session is already running. Start new one?')) return;
    }
    this.router.navigate(['/teacher/attendance-session'], {
      queryParams: {
        subjectId: this.subjectControl.value,
        year: this.yearControl.value,
        semester: this.semesterControl.value
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}