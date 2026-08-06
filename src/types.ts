export interface Student {
  id: string;
  name: string;
  rollNo: string;
  gradeClass: string;
  parentPhone: string;
  parentEmail?: string;
  batchTime?: string;
  createdAt: string;
}

export type AttendanceType = 'check-in' | 'check-out';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  gradeClass: string;
  type: AttendanceType;
  timestamp: string; // ISO String
  date: string; // YYYY-MM-DD
  time: string; // HH:mm format
  notes?: string;
}

export interface AttendanceSummary {
  studentId: string;
  studentName: string;
  rollNo: string;
  gradeClass: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  percentage: number;
}

export interface Teacher {
  id: string;
  name: string;
  employeeId: string;
  subject: string;
  phone: string;
  email?: string;
  createdAt: string;
}

export interface TeacherAttendanceRecord {
  id: string;
  teacherId: string;
  teacherName: string;
  employeeId: string;
  subject: string;
  type: AttendanceType;
  timestamp: string; // ISO String
  date: string; // YYYY-MM-DD
  time: string; // HH:mm format
  notes?: string;
}

export type ActiveTab = 'kiosk' | 'teachers' | 'admin' | 'reports';

export interface GoogleSheetSyncStatus {
  lastSyncedAt?: string;
  spreadsheetId: string;
  spreadsheetUrl: string;
  syncedStudentsCount: number;
  syncedRecordsCount: number;
}
