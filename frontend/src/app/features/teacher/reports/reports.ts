import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AttendanceService } from '../../../core/services/attendance.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartType, Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

@Component({
  selector: 'app-teacher-reports',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatCardModule, MatProgressSpinnerModule,
    MatSelectModule, MatDatepickerModule, MatNativeDateModule, ReactiveFormsModule,
    MatInputModule, BaseChartDirective, MatIconModule, MatButtonModule
  ],
  templateUrl: './reports.html',
  styleUrls: ['./reports.css']
})
export class TeacherReportsComponent implements OnInit {

  loading = true;
  sessions: any[] = [];
  filteredSessions: any[] = [];
  subjects: any[] = [];
  
  // Controls
  subjectControl = new FormControl('');
  fromDateControl = new FormControl<Date | null>(null);
  toDateControl = new FormControl<Date | null>(null);
  
  // Popup
  showStudentModal = false;
  selectedStudents: any[] = [];
  selectedSessionDate: string | Date = '';

  displayedColumns = ['subject', 'date', 'present', 'status', 'actions'];

  // Chart
  chartType: ChartType = 'bar';
  chartData: ChartData<'bar'> = { labels: [], datasets: [{ data: [], label: 'Total Attendance' }] };
  monthlySummary: any[] = [];

  constructor(
    private attendanceService: AttendanceService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subjectControl.valueChanges.subscribe(() => this.applyFilters());
    this.fromDateControl.valueChanges.subscribe(() => this.applyFilters());
    this.toDateControl.valueChanges.subscribe(() => this.applyFilters());
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.attendanceService.getTeacherHistory().subscribe({
      next: (res) => {
        // 🔥 Strict filter hata diya, taaki list dikhe chahe Subject missing ho
        this.sessions = res.sessions || [];
        
        console.log('Reports Data:', this.sessions);

        this.extractSubjects();
        this.generateMonthlySummary();
        this.generateAttendanceChart();

        this.filteredSessions = [...this.sessions];
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

  extractSubjects() {
    const map = new Map<string, any>();
    this.sessions.forEach(s => {
      // Sirf valid subjects hi dropdown mein daalo
      if (s.subject && s.subject._id && s.subject.name) {
        map.set(s.subject._id, s.subject);
      }
    });
    this.subjects = Array.from(map.values());
  }

  applyFilters() {
    const subjectId = this.subjectControl.value;
    const fromDate = this.fromDateControl.value;
    const toDate = this.toDateControl.value;

    this.filteredSessions = this.sessions.filter(s => {
      const d = new Date(s.startTime);
      // Agar subject deleted hai, toh usse match mat karo agar filter laga hai
      const sessionSubId = s.subject?._id || s.subject; 
      const matchSubject = !subjectId || sessionSubId === subjectId;
      
      let matchFrom = true;
      if (fromDate) matchFrom = d >= fromDate;
      let matchTo = true;
      if (toDate) {
         const e = new Date(toDate); e.setHours(23,59,59); matchTo = d <= e;
      }
      return matchSubject && matchFrom && matchTo;
    });
  }

  viewStudentList(session: any) {
    if (session.attendanceRecords && session.attendanceRecords.length > 0) {
      this.selectedStudents = session.attendanceRecords.map((r: any) => r.student);
      this.selectedSessionDate = session.startTime;
      this.showStudentModal = true;
    } else {
      alert('No students present.');
    }
  }

  closeModal() { this.showStudentModal = false; }
  goBack() { this.router.navigate(['/teacher/dashboard']); }

  // Chart & Summary Helpers
  generateMonthlySummary() { /* ... (Same as before) ... */ }
  generateAttendanceChart() { 
      // Chart Logic (Same as before)
      const map = new Map<string, number>();
      this.sessions.forEach(s => {
          const name = s.subject?.name || 'Unknown Subject';
          map.set(name, (map.get(name) || 0) + s.totalPresent);
      });
      this.chartData = {
          labels: Array.from(map.keys()),
          datasets: [{ data: Array.from(map.values()), label: 'Attendance', backgroundColor: '#004643' }]
      };
  }
}