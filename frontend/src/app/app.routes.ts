import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { roleGuard } from './core/guards/role-guard';

export const routes: Routes = [
  // 🔥 CHANGE HERE: Default path ab Login nahi, Home hai
  { 
    path: '', 
    loadComponent: () => import('./features/home/home').then(m => m.HomeComponent) 
  },

  // ================= AUTH =================
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'signup',
    loadComponent: () => import('./features/auth/signup/signup').then(m => m.SignupComponent)
  },

  // ... (Baaki saare Teacher aur Student routes waise hi rahenge) ...
  
  // ================= TEACHER =================
  {
    path: 'teacher',
    canActivate: [authGuard, roleGuard(['teacher'])],
    children: [
        { path: 'dashboard', loadComponent: () => import('./features/teacher/dashboard/dashboard').then(m => m.TeacherDashboardComponent) },
        { path: 'attendance-session', loadComponent: () => import('./features/teacher/attendance-session/attendance-session').then(m => m.AttendanceSessionComponent) },
        { path: 'live-attendance', loadComponent: () => import('./features/teacher/live-attendance/live-attendance').then(m => m.LiveAttendance) },
        { path: 'reports', loadComponent: () => import('./features/teacher/reports/reports').then(m => m.TeacherReportsComponent) },
        { path: 'student-records', loadComponent: () => import('./features/teacher/student-records/student-records').then(m => m.StudentRecordsComponent) },
        { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // ================= STUDENT =================
  {
    path: 'student',
    canActivate: [authGuard, roleGuard(['student'])],
    children: [
        { path: 'dashboard', loadComponent: () => import('./features/student/dashboard/dashboard').then(m => m.StudentDashboardComponent) },
        { path: 'mark-attendance', loadComponent: () => import('./features/student/mark-attendance/mark-attendance').then(m => m.MarkAttendanceComponent) },
        { path: 'history', loadComponent: () => import('./features/student/history/history').then(m => m.StudentHistoryComponent) },
        { path: 'reports', loadComponent: () => import('./features/student/reports/reports').then(m => m.StudentReportsComponent) },
        { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // Fallback
  { path: '**', redirectTo: '' }
];