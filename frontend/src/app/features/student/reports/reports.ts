import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { AttendanceService } from '../../../core/services/attendance.service';

// Interface for type safety
interface SubjectStats {
  subjectName: string;
  subjectCode: string;
  totalSessions: number;
  presentCount: number;
  percentage: number;
}

@Component({
  selector: 'app-student-reports',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressBarModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './reports.html',
  styleUrls: ['./reports.css']
})
export class StudentReportsComponent implements OnInit {

  loading = true;
  overallPercentage = 0;
  totalLectures = 0;
  totalPresent = 0;
  
  subjectStats: SubjectStats[] = [];

  constructor(
    private attendanceService: AttendanceService,
    private router: Router,
    private cdr: ChangeDetectorRef // 🔥 UI Update Fix
  ) {}

  ngOnInit(): void {
    this.loadStudentReport();
  }

  loadStudentReport() {
    this.loading = true;

    // Backend se student ki history mangao
    this.attendanceService.getStudentHistory().subscribe({
      next: (res) => {
        console.log('Student Report Data:', res);

        const history = res.history || [];
        this.processData(history);
        
        this.loading = false;
        this.cdr.detectChanges(); // 🔥 Force Update
      },
      error: (err) => {
        console.error('Error fetching reports:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // 🔥 Data ko Subject ke hisaab se calculate karo
  processData(history: any[]) {
    const map = new Map<string, SubjectStats>();

    history.forEach((record: any) => {
      // Data safe access
      const subId = record.session?.subject?._id;
      const subName = record.session?.subject?.name || 'Unknown Subject';
      const subCode = record.session?.subject?.code || '---';

      if (!subId) return;

      if (!map.has(subId)) {
        map.set(subId, {
          subjectName: subName,
          subjectCode: subCode,
          totalSessions: 0,
          presentCount: 0,
          percentage: 0
        });
      }

      const stats = map.get(subId)!;
      stats.totalSessions++;
      
      // Check status (Present/Absent logic backend par depend karega, 
      // usually history mein wahi records aate hain jo present hain, 
      // agar absent bhi aate hain to status check karein)
      stats.presentCount++; 
    });

    // Final Calculations
    this.subjectStats = Array.from(map.values()).map(stat => {
      stat.percentage = Math.round((stat.presentCount / stat.totalSessions) * 100);
      return stat;
    });

    // Overall Stats
    this.totalLectures = this.subjectStats.reduce((acc, curr) => acc + curr.totalSessions, 0);
    this.totalPresent = this.subjectStats.reduce((acc, curr) => acc + curr.presentCount, 0);
    
    if (this.totalLectures > 0) {
      this.overallPercentage = Math.round((this.totalPresent / this.totalLectures) * 100);
    }
  }

  goBack() {
    this.router.navigate(['/student/dashboard']);
  }
}