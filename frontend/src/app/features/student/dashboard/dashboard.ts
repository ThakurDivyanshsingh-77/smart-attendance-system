import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

// Material Imports
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService, User } from '../../../core/services/auth';
import { AttendanceService } from '../../../core/services/attendance.service';

interface SubjectReportItem {
  subjectName: string;
  subjectCode: string;
  attended: number;
  total: number;
  percentage: number;
}

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
    MatProgressBarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class StudentDashboardComponent implements OnInit {
  user: User | null = null;
  stats: { percentage: number; totalClasses: number; present: number; absent: number } = {
    percentage: 0,
    totalClasses: 0,
    present: 0,
    absent: 0,
  };

  loading = true;
  reportLoading = true;
  currentDate = new Date();
  subjectReport: SubjectReportItem[] = [];

  constructor(
    private auth: AuthService,
    private attendance: AttendanceService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.user = this.auth.getCurrentUser();
    this.refreshDashboard();
  }

  get firstName(): string {
    if (!this.user?.name) {
      return 'Student';
    }
    return this.user.name.split(' ')[0];
  }

  refreshDashboard(): void {
    this.fetchStats();
    this.fetchSubjectReport();
  }

  private fetchStats(): void {
    this.loading = true;

    this.attendance.getStudentStats().subscribe({
      next: (res) => {
        if (res.success) {
          this.stats = {
            percentage: res.percentage || 0,
            totalClasses: res.totalClasses || 0,
            present: res.present || 0,
            absent: res.absent || 0,
          };
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  private fetchSubjectReport(): void {
    this.reportLoading = true;

    this.attendance.getStudentHistory().subscribe({
      next: (res) => {
        const history = Array.isArray(res?.history) ? res.history : [];
        this.subjectReport = this.buildSubjectReport(history);
        this.reportLoading = false;
      },
      error: () => {
        this.subjectReport = [];
        this.reportLoading = false;
      },
    });
  }

  private buildSubjectReport(history: any[]): SubjectReportItem[] {
    const subjectMap = new Map<string, SubjectReportItem>();

    history.forEach((record) => {
      const subject = record?.session?.subject;
      const subjectId = subject?._id || subject?.code || subject?.name;

      if (!subjectId) {
        return;
      }

      if (!subjectMap.has(subjectId)) {
        subjectMap.set(subjectId, {
          subjectName: subject?.name || 'Unknown Subject',
          subjectCode: subject?.code || '---',
          attended: 0,
          total: 0,
          percentage: 0,
        });
      }

      const item = subjectMap.get(subjectId)!;
      item.total += 1;
      item.attended += 1;
    });

    return Array.from(subjectMap.values())
      .map((item) => ({
        ...item,
        percentage: item.total > 0 ? Math.round((item.attended / item.total) * 100) : 0,
      }))
      .sort((a, b) => b.percentage - a.percentage);
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
