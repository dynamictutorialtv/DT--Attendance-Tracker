import { Student, AttendanceRecord, AttendanceType, AttendanceSummary, Teacher, TeacherAttendanceRecord } from '../types';
import { db } from './firebase';
import { INITIAL_STUDENTS_LIST } from '../data/initialStudents';
import { promoteGradeString } from './classUtils';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';

const STUDENTS_KEY = 'dt_students_v1';
const ATTENDANCE_KEY = 'dt_attendance_v1';
const TEACHERS_KEY = 'dt_teachers_v1';
const TEACHER_ATTENDANCE_KEY = 'dt_teacher_attendance_v1';

export const DEFAULT_TEACHERS: Teacher[] = [
  {
    id: 't_dt_1',
    name: 'R. K. Sharma',
    employeeId: 'TCH-101',
    subject: 'Mathematics',
    phone: '+91 98765 43210',
    email: 'sharma.maths@dynamictutorial.com',
    createdAt: new Date().toISOString(),
  },
  {
    id: 't_dt_2',
    name: 'Dr. Anita Verma',
    employeeId: 'TCH-102',
    subject: 'Physics & Science',
    phone: '+91 98123 45678',
    email: 'anita.verma@dynamictutorial.com',
    createdAt: new Date().toISOString(),
  },
  {
    id: 't_dt_3',
    name: 'Suresh Kumar',
    employeeId: 'TCH-103',
    subject: 'Chemistry',
    phone: '+91 99887 76655',
    email: 'suresh.chem@dynamictutorial.com',
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_STUDENTS: Student[] = INITIAL_STUDENTS_LIST.map((s, idx) => ({
  ...s,
  id: `st_dt_${idx + 1}`,
  createdAt: new Date().toISOString(),
}));

const DEFAULT_ATTENDANCE: AttendanceRecord[] = [];

// Helper to load local storage
export function getLocalStudents(): Student[] {
  try {
    const raw = localStorage.getItem(STUDENTS_KEY);
    if (!raw) {
      localStorage.setItem(STUDENTS_KEY, JSON.stringify(DEFAULT_STUDENTS));
      // Seed to Firestore in background
      seedInitialStudentsToFirestore(DEFAULT_STUDENTS);
      return DEFAULT_STUDENTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STUDENTS_KEY, JSON.stringify(DEFAULT_STUDENTS));
      seedInitialStudentsToFirestore(DEFAULT_STUDENTS);
      return DEFAULT_STUDENTS;
    }
    return parsed;
  } catch {
    return DEFAULT_STUDENTS;
  }
}

export async function seedInitialStudentsToFirestore(students: Student[]) {
  if (!db) return;
  try {
    const promises = students.map((s) => setDoc(doc(db, 'students', s.id), s, { merge: true }));
    await Promise.all(promises);
  } catch (err) {
    console.warn('Firestore batch seed warning:', err);
  }
}

export function saveLocalStudents(students: Student[]) {
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
}

export function getLocalAttendance(): AttendanceRecord[] {
  try {
    const raw = localStorage.getItem(ATTENDANCE_KEY);
    if (!raw) {
      localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(DEFAULT_ATTENDANCE));
      return DEFAULT_ATTENDANCE;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_ATTENDANCE;
  }
}

export function saveLocalAttendance(records: AttendanceRecord[]) {
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(records));
}

// Add Student
export async function addStudent(studentData: Omit<Student, 'id' | 'createdAt'>): Promise<Student> {
  const newStudent: Student = {
    ...studentData,
    id: 'st_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    createdAt: new Date().toISOString(),
  };

  // Local sync
  const current = getLocalStudents();
  const updated = [newStudent, ...current];
  saveLocalStudents(updated);

  // Firestore sync if connected
  if (db) {
    try {
      await setDoc(doc(db, 'students', newStudent.id), newStudent);
    } catch (err) {
      console.warn('Firestore write warning (offline mode used):', err);
    }
  }

  return newStudent;
}

// Delete Student
export async function deleteStudent(studentId: string): Promise<void> {
  // Local sync
  const current = getLocalStudents();
  const updated = current.filter((s) => s.id !== studentId);
  saveLocalStudents(updated);

  if (db) {
    try {
      await deleteDoc(doc(db, 'students', studentId));
    } catch (err) {
      console.warn('Firestore delete warning:', err);
    }
  }
}

// Update Student
export async function updateStudent(studentId: string, updatedFields: Partial<Student>): Promise<Student | null> {
  const current = getLocalStudents();
  let updatedStudent: Student | null = null;

  const updatedList = current.map((s) => {
    if (s.id === studentId) {
      updatedStudent = { ...s, ...updatedFields };
      return updatedStudent;
    }
    return s;
  });

  if (!updatedStudent) return null;

  saveLocalStudents(updatedList);

  if (db) {
    try {
      await setDoc(doc(db, 'students', studentId), updatedStudent, { merge: true });
    } catch (err) {
      console.warn('Firestore update warning:', err);
    }
  }

  return updatedStudent;
}

// Record Attendance Check In / Check Out
export async function recordAttendance(
  studentId: string,
  type: AttendanceType,
  notes: string = ''
): Promise<AttendanceRecord> {
  const students = getLocalStudents();
  const student = students.find((s) => s.id === studentId);

  if (!student) {
    throw new Error('Student not found');
  }

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

  const record: AttendanceRecord = {
    id: 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    studentId,
    studentName: student.name,
    rollNo: student.rollNo,
    gradeClass: student.gradeClass,
    type,
    timestamp: now.toISOString(),
    date: dateStr,
    time: timeStr,
    notes,
  };

  const currentRecords = getLocalAttendance();
  const updatedRecords = [record, ...currentRecords];
  saveLocalAttendance(updatedRecords);

  if (db) {
    try {
      await setDoc(doc(db, 'attendance', record.id), record);
    } catch (err) {
      console.warn('Firestore attendance write error:', err);
    }
  }

  return record;
}

// Realtime / Subscriber for Students
export function subscribeStudents(onChange: (students: Student[]) => void) {
  // Emit initial local
  onChange(getLocalStudents());

  if (db) {
    try {
      const q = query(collection(db, 'students'), orderBy('name', 'asc'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Student[] = [];
            snapshot.forEach((doc) => {
              list.push(doc.data() as Student);
            });
            saveLocalStudents(list);
            onChange(list);
          } else {
            seedInitialStudentsToFirestore(DEFAULT_STUDENTS);
            saveLocalStudents(DEFAULT_STUDENTS);
            onChange(DEFAULT_STUDENTS);
          }
        },
        (error) => {
          console.warn('Students listener fallback:', error);
        }
      );
      return unsubscribe;
    } catch {
      return () => {};
    }
  }
  return () => {};
}

// Realtime / Subscriber for Attendance
export function subscribeAttendance(onChange: (records: AttendanceRecord[]) => void) {
  onChange(getLocalAttendance());

  if (db) {
    try {
      const q = query(collection(db, 'attendance'), orderBy('timestamp', 'desc'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: AttendanceRecord[] = [];
            snapshot.forEach((doc) => {
              list.push(doc.data() as AttendanceRecord);
            });
            saveLocalAttendance(list);
            onChange(list);
          }
        },
        (error) => {
          console.warn('Attendance listener fallback:', error);
        }
      );
      return unsubscribe;
    } catch {
      return () => {};
    }
  }
  return () => {};
}

// Promote all students to their next class (e.g., 1st April Academic Upgrade)
export async function promoteAllStudents(): Promise<number> {
  const current = getLocalStudents();
  if (current.length === 0) return 0;

  const updatedList = current.map((s) => ({
    ...s,
    gradeClass: promoteGradeString(s.gradeClass),
  }));

  saveLocalStudents(updatedList);

  if (db) {
    try {
      const promises = updatedList.map((s) =>
        setDoc(doc(db, 'students', s.id), { gradeClass: s.gradeClass }, { merge: true })
      );
      await Promise.all(promises);
    } catch (err) {
      console.warn('Firestore bulk promote warning:', err);
    }
  }

  return updatedList.length;
}

// Bulk Import Attendance Records (for uploading historical check-in/out records)
export async function importAttendanceBatch(newRecords: Omit<AttendanceRecord, 'id'>[]): Promise<number> {
  if (!newRecords || newRecords.length === 0) return 0;

  const recordsWithIds: AttendanceRecord[] = newRecords.map((r) => ({
    ...r,
    id: 'att_imp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
  }));

  const currentRecords = getLocalAttendance();
  const updatedRecords = [...recordsWithIds, ...currentRecords];
  saveLocalAttendance(updatedRecords);

  if (db) {
    try {
      const promises = recordsWithIds.map((r) => setDoc(doc(db, 'attendance', r.id), r));
      await Promise.all(promises);
    } catch (err) {
      console.warn('Firestore attendance batch import warning:', err);
    }
  }

  return recordsWithIds.length;
}

// TEACHER STORAGE FUNCTIONS

export function getLocalTeachers(): Teacher[] {
  try {
    const raw = localStorage.getItem(TEACHERS_KEY);
    if (!raw) {
      localStorage.setItem(TEACHERS_KEY, JSON.stringify(DEFAULT_TEACHERS));
      seedInitialTeachersToFirestore(DEFAULT_TEACHERS);
      return DEFAULT_TEACHERS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(TEACHERS_KEY, JSON.stringify(DEFAULT_TEACHERS));
      seedInitialTeachersToFirestore(DEFAULT_TEACHERS);
      return DEFAULT_TEACHERS;
    }
    return parsed;
  } catch {
    return DEFAULT_TEACHERS;
  }
}

export async function seedInitialTeachersToFirestore(teachers: Teacher[]) {
  if (!db) return;
  try {
    const promises = teachers.map((t) => setDoc(doc(db, 'teachers', t.id), t, { merge: true }));
    await Promise.all(promises);
  } catch (err) {
    console.warn('Firestore teacher seed warning:', err);
  }
}

export function saveLocalTeachers(teachers: Teacher[]) {
  localStorage.setItem(TEACHERS_KEY, JSON.stringify(teachers));
}

export function getLocalTeacherAttendance(): TeacherAttendanceRecord[] {
  try {
    const raw = localStorage.getItem(TEACHER_ATTENDANCE_KEY);
    if (!raw) {
      localStorage.setItem(TEACHER_ATTENDANCE_KEY, JSON.stringify([]));
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveLocalTeacherAttendance(records: TeacherAttendanceRecord[]) {
  localStorage.setItem(TEACHER_ATTENDANCE_KEY, JSON.stringify(records));
}

export async function addTeacher(teacherData: Omit<Teacher, 'id' | 'createdAt'>): Promise<Teacher> {
  const newTeacher: Teacher = {
    ...teacherData,
    id: 'tch_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    createdAt: new Date().toISOString(),
  };

  const current = getLocalTeachers();
  const updated = [newTeacher, ...current];
  saveLocalTeachers(updated);

  if (db) {
    try {
      await setDoc(doc(db, 'teachers', newTeacher.id), newTeacher);
    } catch (err) {
      console.warn('Firestore teacher write warning:', err);
    }
  }

  return newTeacher;
}

export async function deleteTeacher(teacherId: string): Promise<void> {
  const current = getLocalTeachers();
  const updated = current.filter((t) => t.id !== teacherId);
  saveLocalTeachers(updated);

  if (db) {
    try {
      await deleteDoc(doc(db, 'teachers', teacherId));
    } catch (err) {
      console.warn('Firestore teacher delete warning:', err);
    }
  }
}

export async function updateTeacher(teacherId: string, updatedFields: Partial<Teacher>): Promise<Teacher | null> {
  const current = getLocalTeachers();
  let updated: Teacher | null = null;

  const updatedList = current.map((t) => {
    if (t.id === teacherId) {
      updated = { ...t, ...updatedFields };
      return updated;
    }
    return t;
  });

  if (!updated) return null;

  saveLocalTeachers(updatedList);

  if (db) {
    try {
      await setDoc(doc(db, 'teachers', teacherId), updated, { merge: true });
    } catch (err) {
      console.warn('Firestore teacher update warning:', err);
    }
  }

  return updated;
}

export async function recordTeacherAttendance(
  teacherId: string,
  type: AttendanceType,
  notes: string = ''
): Promise<TeacherAttendanceRecord> {
  const teachers = getLocalTeachers();
  const teacher = teachers.find((t) => t.id === teacherId);

  if (!teacher) {
    throw new Error('Teacher not found');
  }

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

  const record: TeacherAttendanceRecord = {
    id: 'tch_att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    teacherId,
    teacherName: teacher.name,
    employeeId: teacher.employeeId,
    subject: teacher.subject,
    type,
    timestamp: now.toISOString(),
    date: dateStr,
    time: timeStr,
    notes,
  };

  const currentRecords = getLocalTeacherAttendance();
  const updatedRecords = [record, ...currentRecords];
  saveLocalTeacherAttendance(updatedRecords);

  if (db) {
    try {
      await setDoc(doc(db, 'teacher_attendance', record.id), record);
    } catch (err) {
      console.warn('Firestore teacher attendance write error:', err);
    }
  }

  return record;
}

export function subscribeTeachers(onChange: (teachers: Teacher[]) => void) {
  onChange(getLocalTeachers());

  if (db) {
    try {
      const q = query(collection(db, 'teachers'), orderBy('name', 'asc'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Teacher[] = [];
            snapshot.forEach((doc) => {
              list.push(doc.data() as Teacher);
            });
            saveLocalTeachers(list);
            onChange(list);
          } else {
            seedInitialTeachersToFirestore(DEFAULT_TEACHERS);
            saveLocalTeachers(DEFAULT_TEACHERS);
            onChange(DEFAULT_TEACHERS);
          }
        },
        (error) => {
          console.warn('Teachers listener fallback:', error);
        }
      );
      return unsubscribe;
    } catch {
      return () => {};
    }
  }
  return () => {};
}

export function subscribeTeacherAttendance(onChange: (records: TeacherAttendanceRecord[]) => void) {
  onChange(getLocalTeacherAttendance());

  if (db) {
    try {
      const q = query(collection(db, 'teacher_attendance'), orderBy('timestamp', 'desc'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: TeacherAttendanceRecord[] = [];
            snapshot.forEach((doc) => {
              list.push(doc.data() as TeacherAttendanceRecord);
            });
            saveLocalTeacherAttendance(list);
            onChange(list);
          }
        },
        (error) => {
          console.warn('Teacher attendance listener fallback:', error);
        }
      );
      return unsubscribe;
    } catch {
      return () => {};
    }
  }
  return () => {};
}

// Helper to compute monthly statistics for reports
export function computeMonthlySummary(
  year: number,
  month: number, // 0-indexed (0 = Jan, 11 = Dec)
  students: Student[],
  attendance: AttendanceRecord[]
): AttendanceSummary[] {
  // Target month dates
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return students.map((student) => {
    // Filter records for this student in this year & month
    const studentRecords = attendance.filter((r) => {
      if (r.studentId !== student.id) return false;
      const d = new Date(r.timestamp);
      return d.getFullYear() === year && d.getMonth() === month;
    });

    // Unique days with at least a check-in
    const checkInDates = new Set<string>();
    studentRecords.forEach((r) => {
      if (r.type === 'check-in') {
        checkInDates.add(r.date);
      }
    });

    const presentDays = checkInDates.size;
    // Total working days (excluding Sundays by default)
    let totalWorkingDays = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const dayOfWeek = new Date(year, month, day).getDay();
      if (dayOfWeek !== 0) {
        // Exclude Sunday
        totalWorkingDays++;
      }
    }

    const absentDays = Math.max(0, totalWorkingDays - presentDays);
    const percentage =
      totalWorkingDays > 0 ? Math.round((presentDays / totalWorkingDays) * 100) : 0;

    return {
      studentId: student.id,
      studentName: student.name,
      rollNo: student.rollNo,
      gradeClass: student.gradeClass,
      totalDays: totalWorkingDays,
      presentDays,
      absentDays,
      lateDays: 0,
      percentage,
    };
  });
}

// ATTENDANCE CORRECTION & MODIFICATION FUNCTIONS (ADMIN EXCLUSIVE)

// Delete Student Attendance Record
export async function deleteAttendanceRecord(recordId: string): Promise<void> {
  const current = getLocalAttendance();
  const updated = current.filter((r) => r.id !== recordId);
  saveLocalAttendance(updated);

  if (db) {
    try {
      await deleteDoc(doc(db, 'attendance', recordId));
    } catch (err) {
      console.warn('Firestore attendance record delete warning:', err);
    }
  }
}

// Update Student Attendance Record
export async function updateAttendanceRecord(
  recordId: string,
  updatedFields: Partial<AttendanceRecord>
): Promise<AttendanceRecord | null> {
  const current = getLocalAttendance();
  let updatedRec: AttendanceRecord | null = null;

  const updatedList = current.map((r) => {
    if (r.id === recordId) {
      updatedRec = { ...r, ...updatedFields };
      return updatedRec;
    }
    return r;
  });

  if (!updatedRec) return null;

  saveLocalAttendance(updatedList);

  if (db) {
    try {
      await setDoc(doc(db, 'attendance', recordId), updatedRec, { merge: true });
    } catch (err) {
      console.warn('Firestore attendance record update warning:', err);
    }
  }

  return updatedRec;
}

// Add Manual Student Attendance Record
export async function addManualAttendanceRecord(
  data: Omit<AttendanceRecord, 'id'>
): Promise<AttendanceRecord> {
  const newRecord: AttendanceRecord = {
    ...data,
    id: 'att_man_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
  };

  const current = getLocalAttendance();
  const updated = [newRecord, ...current];
  saveLocalAttendance(updated);

  if (db) {
    try {
      await setDoc(doc(db, 'attendance', newRecord.id), newRecord);
    } catch (err) {
      console.warn('Firestore manual attendance write warning:', err);
    }
  }

  return newRecord;
}

// Clean Duplicate Student Attendance (Removes duplicate same-type scans on same date for same student)
export async function cleanDuplicateStudentAttendance(): Promise<number> {
  const current = getLocalAttendance();
  const seenKeys = new Set<string>();
  const keep: AttendanceRecord[] = [];
  const toDelete: string[] = [];

  // Sort by timestamp asc so earliest stays
  const sorted = [...current].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  for (const rec of sorted) {
    const key = `${rec.studentId}_${rec.date}_${rec.type}`;
    if (seenKeys.has(key)) {
      toDelete.push(rec.id);
    } else {
      seenKeys.add(key);
      keep.push(rec);
    }
  }

  if (toDelete.length > 0) {
    saveLocalAttendance(keep);
    if (db) {
      try {
        const promises = toDelete.map((id) => deleteDoc(doc(db, 'attendance', id)));
        await Promise.all(promises);
      } catch (err) {
        console.warn('Firestore duplicate delete warning:', err);
      }
    }
  }

  return toDelete.length;
}

// Delete Teacher Attendance Record
export async function deleteTeacherAttendanceRecord(recordId: string): Promise<void> {
  const current = getLocalTeacherAttendance();
  const updated = current.filter((r) => r.id !== recordId);
  saveLocalTeacherAttendance(updated);

  if (db) {
    try {
      await deleteDoc(doc(db, 'teacher_attendance', recordId));
    } catch (err) {
      console.warn('Firestore teacher attendance delete warning:', err);
    }
  }
}

// Update Teacher Attendance Record
export async function updateTeacherAttendanceRecord(
  recordId: string,
  updatedFields: Partial<TeacherAttendanceRecord>
): Promise<TeacherAttendanceRecord | null> {
  const current = getLocalTeacherAttendance();
  let updatedRec: TeacherAttendanceRecord | null = null;

  const updatedList = current.map((r) => {
    if (r.id === recordId) {
      updatedRec = { ...r, ...updatedFields };
      return updatedRec;
    }
    return r;
  });

  if (!updatedRec) return null;

  saveLocalTeacherAttendance(updatedList);

  if (db) {
    try {
      await setDoc(doc(db, 'teacher_attendance', recordId), updatedRec, { merge: true });
    } catch (err) {
      console.warn('Firestore teacher attendance update warning:', err);
    }
  }

  return updatedRec;
}

// Add Manual Teacher Attendance Record
export async function addManualTeacherAttendanceRecord(
  data: Omit<TeacherAttendanceRecord, 'id'>
): Promise<TeacherAttendanceRecord> {
  const newRecord: TeacherAttendanceRecord = {
    ...data,
    id: 'tch_att_man_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
  };

  const current = getLocalTeacherAttendance();
  const updated = [newRecord, ...current];
  saveLocalTeacherAttendance(updated);

  if (db) {
    try {
      await setDoc(doc(db, 'teacher_attendance', newRecord.id), newRecord);
    } catch (err) {
      console.warn('Firestore manual teacher attendance write warning:', err);
    }
  }

  return newRecord;
}

// Clean Duplicate Teacher Attendance
export async function cleanDuplicateTeacherAttendance(): Promise<number> {
  const current = getLocalTeacherAttendance();
  const seenKeys = new Set<string>();
  const keep: TeacherAttendanceRecord[] = [];
  const toDelete: string[] = [];

  const sorted = [...current].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  for (const rec of sorted) {
    const key = `${rec.teacherId}_${rec.date}_${rec.type}`;
    if (seenKeys.has(key)) {
      toDelete.push(rec.id);
    } else {
      seenKeys.add(key);
      keep.push(rec);
    }
  }

  if (toDelete.length > 0) {
    saveLocalTeacherAttendance(keep);
    if (db) {
      try {
        const promises = toDelete.map((id) => deleteDoc(doc(db, 'teacher_attendance', id)));
        await Promise.all(promises);
      } catch (err) {
        console.warn('Firestore duplicate teacher delete warning:', err);
      }
    }
  }

  return toDelete.length;
}
