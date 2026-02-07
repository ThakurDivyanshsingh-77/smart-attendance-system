import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip'; // Added for hover effect
import { AttendanceService } from '../../../core/services/attendance.service';
import { interval, Subscription, switchMap, startWith } from 'rxjs';

@Component({
  selector: 'app-attendance-session',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './attendance-session.html'
})
export class AttendanceSessionComponent implements OnInit, OnDestroy {

  loading = true;
  sessionId = '';
  sessionCode = '';

  attendanceList: any[] = [];
  displayedColumns: string[] = ['rollNumber', 'studentName', 'markedAt'];

  timeRemaining = 600; // 10 minutes (in seconds)
  
  private timerSub?: Subscription;
  private pollingSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private attendance: AttendanceService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef // Required to update UI manually
  ) {}

  ngOnInit(): void {
    const subjectId = this.route.snapshot.queryParamMap.get('subjectId');
    const year = Number(this.route.snapshot.queryParamMap.get('year'));
    const semester = Number(this.route.snapshot.queryParamMap.get('semester'));

    if (!subjectId || !year || !semester) {
      this.router.navigate(['/teacher/dashboard']);
      return;
    }

    // 1. Start Session
    this.attendance.startSession(subjectId, year, semester).subscribe({
      next: (res: any) => {
        // Handle various ID formats from backend
        this.sessionId = res.sessionId || res.session?._id || res.session?.id;
        this.sessionCode = res.sessionCode || res.session?.sessionCode;

        if (!this.sessionId || !this.sessionCode) {
          this.snackBar.open('Error: Invalid session data', 'Close');
          this.router.navigate(['/teacher/dashboard']);
          return;
        }

        this.loading = false;
        
        // 2. Start Logic
        this.startTimer();
        this.startLivePolling();
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open('Failed to start session', 'Close');
        this.router.navigate(['/teacher/dashboard']);
      }
    });
  }

  ngOnDestroy(): void {
    this.timerSub?.unsubscribe();
    this.pollingSub?.unsubscribe();
  }

  // --- LOGIC ---

  startTimer(): void {
    this.timerSub = interval(1000).subscribe(() => {
      if (this.timeRemaining > 0) {
        this.timeRemaining--;
        this.cdr.markForCheck(); // Ensures timer visually updates
      } else {
        this.endSession();
      }
    });
  }

  startLivePolling(): void {
    // Auto-refresh every 3 seconds
    this.pollingSub = interval(3000)
      .pipe(
        startWith(0),
        switchMap(() => this.attendance.getLiveAttendance(this.sessionId))
      )
      .subscribe({
        next: (res: any) => this.updateList(res),
        error: (err) => console.error('Polling error', err)
      });
  }

  refreshList(): void {
    if (!this.sessionId) return;
    
    // Manual Refresh
    this.attendance.getLiveAttendance(this.sessionId).subscribe({
      next: (res: any) => {
        this.updateList(res);
        this.snackBar.open('List updated!', 'Close', { duration: 1500 });
      },
      error: () => this.snackBar.open('Could not refresh', 'Close')
    });
  }

  private updateList(res: any): void {
    const students = res.attendees || res.students || res;
    if (Array.isArray(students)) {
      this.attendanceList = students;
      this.cdr.markForCheck();
    }
  }

  copySessionCode(): void {
    navigator.clipboard.writeText(this.sessionCode).then(() => {
      this.snackBar.open('Code copied!', 'Close', { duration: 2000 });
    });
  }

  endSession(): void {
    this.pollingSub?.unsubscribe(); // Stop updating
    this.timerSub?.unsubscribe();

    this.attendance.endSession(this.sessionId).subscribe({
      next: () => {
        this.snackBar.open('Session Ended', 'Close');
        this.router.navigate(['/teacher/dashboard']);
      },
      error: () => {
        // Even if error, leave page
        this.router.navigate(['/teacher/dashboard']);
      }
    });
  }

  formatTime(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}