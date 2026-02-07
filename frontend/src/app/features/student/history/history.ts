import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // 🔥 Import ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { AttendanceService } from '../../../core/services/attendance.service';

@Component({
  selector: 'app-student-history',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    RouterModule
  ],
  templateUrl: './history.html'
})
export class StudentHistoryComponent implements OnInit {

  records: any[] = [];
  displayedColumns: string[] = ['subject', 'date', 'status'];
  loading = true;

  constructor(
    private attendance: AttendanceService,
    private router: Router,
    private cdr: ChangeDetectorRef // 🔥 Inject Kiya
  ) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    console.log('🔄 Fetching History...');
    
    this.attendance.getStudentHistory().subscribe({
      next: (res) => {
        console.log('✅ History Data:', res); // Console mein check karein agar records: [] hai
        this.records = res?.records || [];
        this.loading = false;

        // 🔥 FORCE SCREEN UPDATE
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ History load failed:', err);
        this.records = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/student/dashboard']);
  }
}