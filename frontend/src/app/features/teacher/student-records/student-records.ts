import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

// Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatInputModule } from '@angular/material/input';

import { AttendanceService } from '../../../core/services/attendance.service';

@Component({
  selector: 'app-student-records',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatFormFieldModule, 
    MatSelectModule, MatButtonModule, MatIconModule, MatProgressBarModule,
    MatInputModule
  ],
  templateUrl: './student-records.html'
})
export class StudentRecordsComponent implements OnInit {

  loading = false;
  students: any[] = [];
  
  // Filters
  yearControl = new FormControl<number | null>(null);
  semesterControl = new FormControl<number | null>(null);
  
  semesters: number[] = [];

  // Popup Data
  showModal = false;
  selectedStudent: any = null;
  studentSubjectStats: any[] = [];
  studentOverall = 0;

  constructor(
    private attendanceService: AttendanceService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {}

  // Dropdown Logic
  onYearChange() {
    const year = this.yearControl.value;
    this.semesterControl.setValue(null);
    if (year === 1) this.semesters = [1, 2];
    if (year === 2) this.semesters = [3, 4];
    if (year === 3) this.semesters = [5, 6];
  }

  // 🔥 1. Students Fetch Karna (FIXED)
  fetchStudents() {
    const y = this.yearControl.value;
    const s = this.semesterControl.value;
    
    if (!y || !s) return;

    this.loading = true;
    this.students = []; // Clear list

    this.attendanceService.getStudentsByClass(y, s).subscribe({
      next: (res) => {
        // Backend se real data
        this.students = res.students || [];
        console.log('✅ Students fetched:', this.students);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ API Error:', err);
        this.loading = false;
        
        // 🔥 DUMMY DATA REMOVED. Ab sirf empty list rahegi agar error aaya.
        this.students = []; 
        
        // Optional: User ko batao ki error hai
        // alert('Failed to fetch students. Please check Backend API.');
        
        this.cdr.detectChanges();
      }
    });
  }

  // 🔥 2. Student Details Popup
  viewStudentDetails(student: any) {
    this.selectedStudent = student;
    this.showModal = true;
    this.studentSubjectStats = [];
    this.loading = true;

    this.attendanceService.getStudentAttendanceReport(student._id).subscribe({
      next: (res) => {
        const history = res.history || [];
        this.calculateStats(history);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  calculateStats(history: any[]) {
    const map = new Map<string, any>();

    history.forEach((record: any) => {
        const subName = record.session?.subject?.name || 'Unknown Subject';
        if (!map.has(subName)) {
            map.set(subName, { name: subName, total: 0, present: 0 });
        }
        const stat = map.get(subName);
        stat.total++;
        stat.present++; 
    });

    this.studentSubjectStats = Array.from(map.values()).map(s => ({
        ...s,
        percentage: Math.round((s.present / s.total) * 100)
    }));

    const totalLec = this.studentSubjectStats.reduce((a, b) => a + b.total, 0);
    const totalPres = this.studentSubjectStats.reduce((a, b) => a + b.present, 0);
    this.studentOverall = totalLec > 0 ? Math.round((totalPres / totalLec) * 100) : 0;
  }

  closeModal() {
    this.showModal = false;
    this.selectedStudent = null;
  }

  goBack() {
    this.router.navigate(['/teacher/dashboard']);
  }
}