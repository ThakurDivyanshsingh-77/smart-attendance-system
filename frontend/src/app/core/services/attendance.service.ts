import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {

  constructor(private http: HttpClient) {}

  // 🔥 TOKEN HEADER HELPER
  private getHeaders() {
    const token = localStorage.getItem('token'); 
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      })
    };
  }

  // ==========================================
  // TEACHER APIS - SESSION MANAGEMENT
  // ==========================================

  startSession(subjectId: string, year: number, semester: number): Observable<any> {
    return this.http.post(`${environment.apiUrl}/attendance/session/start`, {
      subjectId, year, semester
    }, this.getHeaders());
  }

  getActiveSession(subjectId: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/attendance/session/active/${subjectId}`, this.getHeaders());
  }

  getLiveAttendance(sessionId: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/attendance/session/${sessionId}/live`, this.getHeaders());
  }

  endSession(sessionId: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/attendance/session/end/${sessionId}`, {}, this.getHeaders());
  }

  getTeacherHistory(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
          params = params.set(key, filters[key]);
        }
      });
    }
    const options = { ...this.getHeaders(), params };
    return this.http.get(`${environment.apiUrl}/attendance/history/teacher`, options);
  }

  getSubjectStats(subjectId: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/attendance/stats/subject/${subjectId}`, this.getHeaders());
  }

  // ==========================================
  // 🔥 NEW: STUDENT RECORDS & ANALYTICS (For Teacher)
  // ==========================================

  // 1. Get Students by Class (Year & Sem)
  getStudentsByClass(year: number, semester: number): Observable<any> {
    let params = new HttpParams()
      .set('year', year)
      .set('semester', semester);
      
    // Note: Ensure your backend has this route '/users/students'
    return this.http.get(`${environment.apiUrl}/users/students`, { ...this.getHeaders(), params });
  }

  // 2. Get Specific Student's Attendance History (For Teacher View)
  getStudentAttendanceReport(studentId: string): Observable<any> {
    // Note: Backend should allow teachers to view specific student history
    return this.http.get(`${environment.apiUrl}/attendance/history/${studentId}`, this.getHeaders());
  }

  // ==========================================
  // STUDENT APIS
  // ==========================================

  getActiveSessions(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/attendance/sessions/active`, this.getHeaders());
  }

  markAttendance(sessionCode: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/attendance/mark`, { sessionCode }, this.getHeaders());
  }

  getStudentHistory(subjectId?: string): Observable<any> {
    let params = new HttpParams();
    if (subjectId) {
      params = params.set('subjectId', subjectId);
    }
    const options = { ...this.getHeaders(), params };
    return this.http.get(`${environment.apiUrl}/attendance/history/student`, options);
  }

  getStudentStats(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/attendance/stats/student`, this.getHeaders());
  }
}