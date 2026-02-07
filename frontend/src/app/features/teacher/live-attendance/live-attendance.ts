import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { AttendanceService } from '../../../core/services/attendance.service';

@Component({
  selector: 'app-live-attendance',
  standalone: true,
  imports: [CommonModule, MatIconModule, ClipboardModule],
  templateUrl: './live-attendance.html',
  styleUrl: './live-attendance.css',
})
export class LiveAttendance implements OnInit, OnDestroy {
  
  sessionId: string = '';
  sessionCode: string = '...';
  subjectName: string = 'Loading...';
  
  attendanceList: any[] = [];
  totalPresent: number = 0;
  
  loading: boolean = false;
  isExpired: boolean = false;
  
  elapsedTime: string = '00:00';
  private refreshInterval: any;
  private timerInterval: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private attendanceService: AttendanceService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // 🔥 STEP 1: Purana Data Reset Karo
    this.resetState();

    const subjectId = this.route.snapshot.queryParams['subjectId'];

    if (subjectId) {
      this.fetchActiveSession(subjectId);
    } else {
      // Agar direct bina ID ke khula, to dashboard bhejo
      alert('No Subject ID found!');
      this.router.navigate(['/teacher/dashboard']);
    }

    // Auto-Refresh
    this.refreshInterval = setInterval(() => {
      if (this.sessionId && !this.isExpired) {
        this.refreshList(true);
      }
    }, 5000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  // 🔥 NEW FUNCTION: Sab kuch zero kar do
  resetState() {
    this.sessionId = '';
    this.sessionCode = '...';
    this.subjectName = 'Loading...';
    this.attendanceList = []; // List khaali
    this.totalPresent = 0;    // Count zero
    this.isExpired = false;
    this.elapsedTime = '00:00';
    
    // Agar koi purana timer chal raha ho to band karo
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  fetchActiveSession(subjectId: string) {
    this.loading = true;
    this.attendanceService.getActiveSession(subjectId).subscribe({
      next: (res) => {
        if (res.success && res.session) {
          // Naya data set karo
          this.sessionId = res.session._id;
          this.sessionCode = res.session.sessionCode;
          this.subjectName = res.session.subject.name;

          // Timer Start
          this.startTimer(new Date(res.session.startTime));
          
          // List Fetch
          this.refreshList();
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Session fetch failed', err);
        // Agar koi active session nahi mila, to naya start karne ke liye wapas bhejo
        alert('No active session found. Please start a new one.');
        this.router.navigate(['/teacher/dashboard']);
      }
    });
  }

  refreshList(silent: boolean = false): void {
    if (!this.sessionId) return;
    if (!silent) {
        this.loading = true;
        this.cdr.detectChanges();
    }

    this.attendanceService.getLiveAttendance(this.sessionId).subscribe({
      next: (res) => {
        // Hamesha fresh list assign karo
        this.attendanceList = [...(res.records || [])]; 
        this.totalPresent = res.count || 0;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  endSession(): void {
    if (confirm('Are you sure you want to end this session?')) {
      this.attendanceService.endSession(this.sessionId).subscribe({
        next: () => {
          this.resetState(); // End karte waqt bhi sab saaf karo
          this.router.navigate(['/teacher/dashboard']);
        },
        error: () => alert('Failed to end session')
      });
    }
  }

  // ... (copyCode, startTimer waise hi rahenge) ...
  copyCode() {
    navigator.clipboard.writeText(this.sessionCode);
    alert('Code copied!');
  }

  startTimer(startDate: Date) {
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      const now = new Date().getTime();
      const start = new Date(startDate).getTime();
      const diff = now - start;

      if (diff >= 600000) {
        this.elapsedTime = '10:00'; 
        this.isExpired = true;      
        this.sessionCode = 'EXPIRED'; 
        
        clearInterval(this.timerInterval); 
        clearInterval(this.refreshInterval); 
        
        this.cdr.detectChanges();
        return; 
      }

      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      this.elapsedTime = `${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
      this.cdr.detectChanges();
      
    }, 1000);
  }
}