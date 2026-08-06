import React, { useState, useMemo } from 'react';
import { Student, AttendanceRecord, Teacher, TeacherAttendanceRecord, AttendanceType } from '../types';
import {
  addStudent,
  deleteStudent,
  updateStudent,
  promoteAllStudents,
  addTeacher,
  deleteTeacher,
  updateTeacher,
  deleteAttendanceRecord,
  updateAttendanceRecord,
  addManualAttendanceRecord,
  cleanDuplicateStudentAttendance,
  deleteTeacherAttendanceRecord,
  updateTeacherAttendanceRecord,
  addManualTeacherAttendanceRecord,
  cleanDuplicateTeacherAttendance,
} from '../lib/storage';
import { sortStudents } from '../lib/classUtils';
import { AttendanceUploaderModal } from './AttendanceUploaderModal';
import {
  ShieldCheck,
  Lock,
  UserPlus,
  Trash2,
  Edit3,
  Search,
  KeyRound,
  GraduationCap,
  Phone,
  Mail,
  Clock,
  LogOut,
  AlertCircle,
  Users,
  CheckCircle2,
  Upload,
  ArrowUpCircle,
  X,
  Sparkles,
  Filter,
  Wand2,
  PlusCircle,
  Calendar,
  FileSpreadsheet,
} from 'lucide-react';

interface AdminPanelProps {
  students: Student[];
  attendance: AttendanceRecord[];
  teachers: Teacher[];
  teacherAttendance: TeacherAttendanceRecord[];
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  students,
  attendance,
  teachers,
  teacherAttendance,
  isAuthenticated,
  setIsAuthenticated,
}) => {
  // Password State
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Active Admin View Tab
  const [activeTab, setActiveTab] = useState<'students' | 'teachers' | 'corrections'>('students');

  // --- STUDENT MANAGEMENT STATE ---
  const [showAddStudentModal, setShowAddStudentModal] = useState<boolean>(false);
  const [showUploaderModal, setShowUploaderModal] = useState<boolean>(false);
  const [showPromoteModal, setShowPromoteModal] = useState<boolean>(false);
  const [isPromoting, setIsPromoting] = useState<boolean>(false);
  const [promoteSuccess, setPromoteSuccess] = useState<string | null>(null);

  // Add Student Form
  const [studentName, setStudentName] = useState<string>('');
  const [studentRollNo, setStudentRollNo] = useState<string>('');
  const [studentGradeClass, setStudentGradeClass] = useState<string>('Class 10 - Science');
  const [parentPhone, setParentPhone] = useState<string>('');
  const [parentEmail, setParentEmail] = useState<string>('');
  const [batchTime, setBatchTime] = useState<string>('4:00 PM - 6:00 PM');
  const [studentFormError, setStudentFormError] = useState<string | null>(null);

  // Edit Student Form
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editStudentName, setEditStudentName] = useState<string>('');
  const [editStudentRollNo, setEditStudentRollNo] = useState<string>('');
  const [editStudentGradeClass, setEditStudentGradeClass] = useState<string>('');
  const [editParentPhone, setEditParentPhone] = useState<string>('');
  const [editParentEmail, setEditParentEmail] = useState<string>('');
  const [editBatchTime, setEditBatchTime] = useState<string>('');
  const [editStudentError, setEditStudentError] = useState<string | null>(null);

  // Student Search
  const [studentSearch, setStudentSearch] = useState<string>('');

  // --- TEACHER MANAGEMENT STATE ---
  const [showAddTeacherModal, setShowAddTeacherModal] = useState<boolean>(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [teacherName, setTeacherName] = useState<string>('');
  const [employeeId, setEmployeeId] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [teacherPhone, setTeacherPhone] = useState<string>('');
  const [teacherEmail, setTeacherEmail] = useState<string>('');
  const [teacherFormError, setTeacherFormError] = useState<string | null>(null);

  // Edit Teacher Form
  const [editTeacherName, setEditTeacherName] = useState<string>('');
  const [editEmployeeId, setEditEmployeeId] = useState<string>('');
  const [editSubject, setEditSubject] = useState<string>('');
  const [editTeacherPhone, setEditTeacherPhone] = useState<string>('');
  const [editTeacherEmail, setEditTeacherEmail] = useState<string>('');
  const [editTeacherError, setEditTeacherError] = useState<string | null>(null);

  // Teacher Search
  const [teacherSearch, setTeacherSearch] = useState<string>('');

  // --- ATTENDANCE CORRECTIONS STATE ---
  const [correctionTarget, setCorrectionTarget] = useState<'students' | 'teachers'>('students');
  const [correctionSearch, setCorrectionSearch] = useState<string>('');
  const [correctionDate, setCorrectionDate] = useState<string>('');
  const [cleanMessage, setCleanMessage] = useState<string | null>(null);

  // Editing Attendance Record Modal State
  const [editingAttendanceRecord, setEditingAttendanceRecord] = useState<AttendanceRecord | null>(null);
  const [editingTeacherAttendanceRecord, setEditingTeacherAttendanceRecord] = useState<TeacherAttendanceRecord | null>(null);

  const [editAttDate, setEditAttDate] = useState<string>('');
  const [editAttTime, setEditAttTime] = useState<string>('');
  const [editAttType, setEditAttType] = useState<AttendanceType>('check-in');
  const [editAttNotes, setEditAttNotes] = useState<string>('');

  // Manual Attendance Entry Modal State
  const [showManualAttModal, setShowManualAttModal] = useState<boolean>(false);
  const [manualPersonId, setManualPersonId] = useState<string>('');
  const [manualDate, setManualDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [manualTime, setManualTime] = useState<string>(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
  );
  const [manualType, setManualType] = useState<AttendanceType>('check-in');
  const [manualNotes, setManualNotes] = useState<string>('Manual Admin Entry');

  // Verify Admin Password
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setIsVerifying(true);

    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setPasswordInput('');
      } else {
        const clientSecret = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
        if (passwordInput === clientSecret) {
          setIsAuthenticated(true);
          setPasswordInput('');
        } else {
          setPasswordError('Incorrect password. Please try again.');
        }
      }
    } catch {
      const clientSecret = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
      if (passwordInput === clientSecret) {
        setIsAuthenticated(true);
        setPasswordInput('');
      } else {
        setPasswordError('Incorrect password. Please try again.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  // --- STUDENT HANDLERS ---
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentFormError(null);

    if (!studentName.trim()) {
      setStudentFormError('Student name is required');
      return;
    }

    try {
      await addStudent({
        name: studentName.trim(),
        rollNo: studentRollNo.trim() || `REG-${Date.now().toString().slice(-4)}`,
        gradeClass: studentGradeClass || 'General',
        parentPhone: parentPhone.trim(),
        parentEmail: parentEmail.trim(),
        batchTime: batchTime || '',
      });

      setStudentName('');
      setStudentRollNo('');
      setParentPhone('');
      setParentEmail('');
      setShowAddStudentModal(false);
    } catch (err: any) {
      setStudentFormError(err?.message || 'Failed to add student');
    }
  };

  const handleDeleteStudent = async (studentId: string, nameStr: string) => {
    if (confirm(`Are you sure you want to delete student "${nameStr}"?`)) {
      await deleteStudent(studentId);
    }
  };

  const handleOpenEditStudentModal = (student: Student) => {
    setEditingStudent(student);
    setEditStudentName(student.name);
    setEditStudentRollNo(student.rollNo);
    setEditStudentGradeClass(student.gradeClass);
    setEditParentPhone(student.parentPhone || '');
    setEditParentEmail(student.parentEmail || '');
    setEditBatchTime(student.batchTime || '4:00 PM - 6:00 PM');
    setEditStudentError(null);
  };

  const handleSaveEditedStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setEditStudentError(null);

    if (!editStudentName.trim()) {
      setEditStudentError('Student name is required');
      return;
    }

    try {
      await updateStudent(editingStudent.id, {
        name: editStudentName.trim(),
        rollNo: editStudentRollNo.trim() || editingStudent.rollNo || 'N/A',
        gradeClass: editStudentGradeClass,
        parentPhone: editParentPhone.trim(),
        parentEmail: editParentEmail.trim(),
        batchTime: editBatchTime,
      });
      setEditingStudent(null);
    } catch (err: any) {
      setEditStudentError(err?.message || 'Failed to update student');
    }
  };

  const handleConfirmPromote = async () => {
    setIsPromoting(true);
    try {
      const count = await promoteAllStudents();
      setPromoteSuccess(`Successfully promoted ${count} students to their next class!`);
      setShowPromoteModal(false);
      setTimeout(() => setPromoteSuccess(null), 6000);
    } catch {
      alert('Failed to promote students. Please try again.');
    } finally {
      setIsPromoting(false);
    }
  };

  // --- TEACHER HANDLERS ---
  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherFormError(null);

    if (!teacherName.trim()) {
      setTeacherFormError('Teacher name is required.');
      return;
    }

    try {
      await addTeacher({
        name: teacherName.trim(),
        employeeId: employeeId.trim() || `TCH-${Math.floor(100 + Math.random() * 900)}`,
        subject: subject.trim() || 'General Subject',
        phone: teacherPhone.trim(),
        email: teacherEmail.trim(),
      });

      setTeacherName('');
      setEmployeeId('');
      setSubject('');
      setTeacherPhone('');
      setTeacherEmail('');
      setShowAddTeacherModal(false);
    } catch (err: any) {
      setTeacherFormError(err?.message || 'Failed to add teacher');
    }
  };

  const handleDeleteTeacher = async (teacherId: string, nameStr: string) => {
    if (confirm(`Are you sure you want to delete faculty member "${nameStr}"?`)) {
      await deleteTeacher(teacherId);
    }
  };

  const handleOpenEditTeacherModal = (t: Teacher) => {
    setEditingTeacher(t);
    setEditTeacherName(t.name);
    setEditEmployeeId(t.employeeId);
    setEditSubject(t.subject);
    setEditTeacherPhone(t.phone);
    setEditTeacherEmail(t.email || '');
    setEditTeacherError(null);
  };

  const handleSaveEditedTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    setEditTeacherError(null);

    if (!editTeacherName.trim()) {
      setEditTeacherError('Teacher name is required.');
      return;
    }

    try {
      await updateTeacher(editingTeacher.id, {
        name: editTeacherName.trim(),
        employeeId: editEmployeeId.trim(),
        subject: editSubject.trim(),
        phone: editTeacherPhone.trim(),
        email: editTeacherEmail.trim(),
      });
      setEditingTeacher(null);
    } catch (err: any) {
      setEditTeacherError(err?.message || 'Failed to update teacher');
    }
  };

  // --- ATTENDANCE CORRECTION HANDLERS ---
  const handleCleanDuplicates = async () => {
    if (correctionTarget === 'students') {
      const removed = await cleanDuplicateStudentAttendance();
      setCleanMessage(`Cleaned ${removed} duplicate student attendance logs!`);
    } else {
      const removed = await cleanDuplicateTeacherAttendance();
      setCleanMessage(`Cleaned ${removed} duplicate teacher attendance logs!`);
    }
    setTimeout(() => setCleanMessage(null), 5000);
  };

  const handleDeleteAttendanceRecord = async (id: string) => {
    if (confirm('Are you sure you want to delete this attendance entry?')) {
      if (correctionTarget === 'students') {
        await deleteAttendanceRecord(id);
      } else {
        await deleteTeacherAttendanceRecord(id);
      }
    }
  };

  const handleSaveEditedAttendanceRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAttendanceRecord) {
      await updateAttendanceRecord(editingAttendanceRecord.id, {
        date: editAttDate,
        time: editAttTime,
        type: editAttType,
        notes: editAttNotes,
      });
      setEditingAttendanceRecord(null);
    } else if (editingTeacherAttendanceRecord) {
      await updateTeacherAttendanceRecord(editingTeacherAttendanceRecord.id, {
        date: editAttDate,
        time: editAttTime,
        type: editAttType,
        notes: editAttNotes,
      });
      setEditingTeacherAttendanceRecord(null);
    }
  };

  const handleCreateManualAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPersonId) {
      alert('Please select a student or teacher');
      return;
    }

    if (correctionTarget === 'students') {
      const st = students.find((s) => s.id === manualPersonId);
      if (!st) return;
      await addManualAttendanceRecord({
        studentId: st.id,
        studentName: st.name,
        rollNo: st.rollNo,
        gradeClass: st.gradeClass,
        type: manualType,
        timestamp: new Date(`${manualDate}T12:00:00`).toISOString(),
        date: manualDate,
        time: manualTime,
        notes: manualNotes,
      });
    } else {
      const tch = teachers.find((t) => t.id === manualPersonId);
      if (!tch) return;
      await addManualTeacherAttendanceRecord({
        teacherId: tch.id,
        teacherName: tch.name,
        employeeId: tch.employeeId,
        subject: tch.subject,
        type: manualType,
        timestamp: new Date(`${manualDate}T12:00:00`).toISOString(),
        date: manualDate,
        time: manualTime,
        notes: manualNotes,
      });
    }

    setShowManualAttModal(false);
    setManualNotes('Manual Admin Entry');
  };

  // --- MEMOIZED FILTERED LISTS ---
  const filteredStudents = useMemo(() => {
    const matching = students.filter(
      (s) =>
        s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.rollNo.toLowerCase().includes(studentSearch.toLowerCase()) ||
        (s.parentPhone && s.parentPhone.includes(studentSearch))
    );
    return sortStudents(matching, 'all');
  }, [students, studentSearch]);

  const filteredTeachers = useMemo(() => {
    return teachers.filter(
      (t) =>
        t.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
        t.employeeId.toLowerCase().includes(teacherSearch.toLowerCase()) ||
        t.subject.toLowerCase().includes(teacherSearch.toLowerCase())
    );
  }, [teachers, teacherSearch]);

  const filteredStudentLogs = useMemo(() => {
    return attendance.filter((r) => {
      const matchesDate = !correctionDate || r.date === correctionDate;
      const matchesQuery =
        r.studentName.toLowerCase().includes(correctionSearch.toLowerCase()) ||
        r.rollNo.toLowerCase().includes(correctionSearch.toLowerCase());
      return matchesDate && matchesQuery;
    });
  }, [attendance, correctionDate, correctionSearch]);

  const filteredTeacherLogs = useMemo(() => {
    return teacherAttendance.filter((r) => {
      const matchesDate = !correctionDate || r.date === correctionDate;
      const matchesQuery =
        r.teacherName.toLowerCase().includes(correctionSearch.toLowerCase()) ||
        r.employeeId.toLowerCase().includes(correctionSearch.toLowerCase());
      return matchesDate && matchesQuery;
    });
  }, [teacherAttendance, correctionDate, correctionSearch]);

  // UNAUTHENTICATED LOCKED SCREEN
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/80 space-y-6 text-center">
          <div className="w-16 h-16 bg-purple-100 text-purple-700 rounded-3xl flex items-center justify-center mx-auto shadow-md">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900">Admin Portal</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Please enter your administrator password to manage students, teachers, and attendance corrections.
            </p>
          </div>

          {passwordError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4 text-left">
            <div>
              <label htmlFor="admin-password-input" className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-1">
                Admin Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  id="admin-password-input"
                  type="password"
                  placeholder="Enter admin password..."
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            <button
              id="admin-login-submit"
              type="submit"
              disabled={isVerifying}
              className="w-full py-3.5 px-4 bg-purple-700 hover:bg-purple-800 text-white font-extrabold rounded-2xl shadow-lg shadow-purple-700/30 transition-all flex items-center justify-center gap-2 touch-manipulation active:scale-[0.98]"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>{isVerifying ? 'Verifying...' : 'Unlock Admin Panel'}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // AUTHENTICATED ADMIN PANEL
  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Top Header Bar */}
      <div className="bg-slate-900 text-white p-5 sm:p-7 rounded-3xl shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black">Admin Management Portal</h1>
              <span className="bg-purple-500/20 text-purple-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-purple-400/30">
                Full Master Access
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              Add/Edit students and teachers, correct check-in/out entries, and clean duplicate records.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAuthenticated(false)}
          className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs sm:text-sm rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 self-start md:self-auto"
        >
          <LogOut className="w-4 h-4" />
          <span>Lock Admin Session</span>
        </button>
      </div>

      {/* Admin Tab Switcher */}
      <div className="flex items-center justify-start sm:justify-center gap-2 bg-slate-200/80 p-1.5 rounded-2xl overflow-x-auto">
        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeTab === 'students'
              ? 'bg-purple-700 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/50'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Student Directory ({students.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('teachers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeTab === 'teachers'
              ? 'bg-emerald-700 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Faculty Roster ({teachers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('corrections')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeTab === 'corrections'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/50'
          }`}
        >
          <Wand2 className="w-4 h-4" />
          <span>Attendance Corrections & Duplicates</span>
        </button>
      </div>

      {/* BANNERS / NOTIFICATIONS */}
      {promoteSuccess && (
        <div className="bg-emerald-950 border-2 border-emerald-500 text-emerald-100 p-4 rounded-2xl shadow-lg flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
          <span className="font-extrabold text-sm">{promoteSuccess}</span>
        </div>
      )}

      {cleanMessage && (
        <div className="bg-amber-950 border-2 border-amber-500 text-amber-100 p-4 rounded-2xl shadow-lg flex items-center gap-3">
          <Wand2 className="w-6 h-6 text-amber-400 shrink-0" />
          <span className="font-extrabold text-sm">{cleanMessage}</span>
        </div>
      )}

      {/* TAB 1: STUDENT MANAGEMENT */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-md border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="w-full sm:w-auto flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search students by name, roll no, or phone..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setShowAddStudentModal(true)}
                className="py-2 px-3.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Student</span>
              </button>

              <button
                onClick={() => setShowUploaderModal(true)}
                className="py-2 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5"
              >
                <Upload className="w-4 h-4" />
                <span>Upload CSV</span>
              </button>

              <button
                onClick={() => setShowPromoteModal(true)}
                className="py-2 px-3.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5"
              >
                <ArrowUpCircle className="w-4 h-4" />
                <span>Promote Classes</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.length === 0 ? (
              <div className="col-span-full bg-white rounded-3xl p-8 text-center border border-slate-200 text-slate-400">
                <GraduationCap className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="font-bold text-slate-600">No students found.</p>
              </div>
            ) : (
              filteredStudents.map((s) => (
                <div
                  key={s.id}
                  className="bg-white rounded-3xl p-5 shadow-sm hover:shadow-md border border-slate-200 transition-all flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-800 font-extrabold text-base flex items-center justify-center shrink-0">
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-base leading-snug">{s.name}</h3>
                          <span className="inline-block bg-slate-100 text-slate-700 text-xs font-mono font-semibold px-2 py-0.5 rounded border border-slate-200">
                            {s.rollNo}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditStudentModal(s)}
                          className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-colors"
                          title="Edit Student"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(s.id, s.name)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                          title="Delete Student"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
                      <p className="flex items-center justify-between">
                        <span className="text-slate-400 font-bold">Class:</span>
                        <span className="font-extrabold text-slate-800 bg-sky-50 text-sky-800 px-2 py-0.5 rounded-lg border border-sky-100">
                          {s.gradeClass}
                        </span>
                      </p>
                      {s.parentPhone && (
                        <p className="flex items-center gap-1.5 text-slate-600">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{s.parentPhone}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TEACHER / FACULTY MANAGEMENT */}
      {activeTab === 'teachers' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-md border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="w-full sm:w-auto flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search faculty by name, employee ID, or subject..."
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900"
              />
            </div>

            <button
              onClick={() => setShowAddTeacherModal(true)}
              className="py-2 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New Teacher</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeachers.length === 0 ? (
              <div className="col-span-full bg-white rounded-3xl p-8 text-center border border-slate-200 text-slate-400">
                <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="font-bold text-slate-600">No faculty members found.</p>
              </div>
            ) : (
              filteredTeachers.map((t) => (
                <div
                  key={t.id}
                  className="bg-white rounded-3xl p-5 shadow-sm hover:shadow-md border border-slate-200 transition-all flex flex-col justify-between gap-3"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base">{t.name}</h3>
                        <span className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full mt-0.5">
                          {t.subject}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-slate-400 font-bold">{t.employeeId}</span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      {t.phone && (
                        <p className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{t.phone}</span>
                        </p>
                      )}
                      {t.email && (
                        <p className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{t.email}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenEditTeacherModal(t)}
                      className="flex-1 py-1.5 bg-slate-50 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTeacher(t.id, t.name)}
                      className="py-1.5 px-3 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ATTENDANCE CORRECTIONS & DUPLICATES */}
      {activeTab === 'corrections' && (
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-md border border-slate-200 space-y-5">
          {/* Correction Tools Controls */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCorrectionTarget('students')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all ${
                  correctionTarget === 'students'
                    ? 'bg-purple-700 text-white shadow'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Student Attendance Logs
              </button>
              <button
                onClick={() => setCorrectionTarget('teachers')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all ${
                  correctionTarget === 'teachers'
                    ? 'bg-emerald-700 text-white shadow'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Teacher Attendance Logs
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <button
                onClick={handleCleanDuplicates}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5"
                title="Remove duplicate same-day check-ins for the same person"
              >
                <Wand2 className="w-4 h-4" />
                <span>Auto-Clean Duplicates</span>
              </button>

              <button
                onClick={() => setShowManualAttModal(true)}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Manual Entry</span>
              </button>
            </div>
          </div>

          {/* Search & Date Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Filter logs by name or ID..."
                value={correctionSearch}
                onChange={(e) => setCorrectionSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-500">Filter Date:</span>
              <input
                type="date"
                value={correctionDate}
                onChange={(e) => setCorrectionDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
              />
              {correctionDate && (
                <button
                  onClick={() => setCorrectionDate('')}
                  className="text-xs text-slate-500 underline font-semibold"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Logs Table with Correction Actions */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase border-b border-slate-200">
                  <th className="py-3 px-4">Name & ID</th>
                  <th className="py-3 px-4">Class / Subject</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-center">Admin Corrections</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {correctionTarget === 'students' ? (
                  filteredStudentLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No student attendance records matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredStudentLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900">{log.studentName}</span>
                          <br />
                          <span className="font-mono text-slate-500">{log.rollNo}</span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-600">{log.gradeClass}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                              log.type === 'check-in'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {log.type}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold">{log.date}</span>
                          <br />
                          <span className="text-slate-500">{log.time}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 italic">{log.notes || '-'}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setEditingAttendanceRecord(log);
                                setEditAttDate(log.date);
                                setEditAttTime(log.time);
                                setEditAttType(log.type);
                                setEditAttNotes(log.notes || '');
                              }}
                              className="p-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg font-bold"
                              title="Edit timestamp or status"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteAttendanceRecord(log.id)}
                              className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg font-bold"
                              title="Delete entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )
                ) : filteredTeacherLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No teacher attendance records matching filters.
                    </td>
                  </tr>
                ) : (
                  filteredTeacherLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900">{log.teacherName}</span>
                        <br />
                        <span className="font-mono text-slate-500">{log.employeeId}</span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-emerald-700">{log.subject}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                            log.type === 'check-in'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {log.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold">{log.date}</span>
                        <br />
                        <span className="text-slate-500">{log.time}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 italic">{log.notes || '-'}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setEditingTeacherAttendanceRecord(log);
                              setEditAttDate(log.date);
                              setEditAttTime(log.time);
                              setEditAttType(log.type);
                              setEditAttNotes(log.notes || '');
                            }}
                            className="p-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg font-bold"
                            title="Edit timestamp or status"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAttendanceRecord(log.id)}
                            className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg font-bold"
                            title="Delete entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MODALS --- */}

      {/* ADD STUDENT MODAL */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-lg">Add New Student</h3>
              <button onClick={() => setShowAddStudentModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {studentFormError && (
              <div className="bg-rose-50 text-rose-700 text-xs p-3 rounded-xl font-bold">{studentFormError}</div>
            )}

            <form onSubmit={handleCreateStudent} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Student Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Roll / Reg Number</label>
                <input
                  type="text"
                  placeholder="e.g. REG-1001"
                  value={studentRollNo}
                  onChange={(e) => setStudentRollNo(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Class / Grade</label>
                <input
                  type="text"
                  placeholder="e.g. Class 10 - Science"
                  value={studentGradeClass}
                  onChange={(e) => setStudentGradeClass(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Parent Phone</label>
                  <input
                    type="text"
                    placeholder="Phone number"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Batch Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 4 PM - 6 PM"
                    value={batchTime}
                    onChange={(e) => setBatchTime(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-700 text-white font-bold rounded-xl shadow"
                >
                  Save Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STUDENT MODAL */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-lg">Edit Student Record</h3>
              <button onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {editStudentError && (
              <div className="bg-rose-50 text-rose-700 text-xs p-3 rounded-xl font-bold">{editStudentError}</div>
            )}

            <form onSubmit={handleSaveEditedStudent} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editStudentName}
                  onChange={(e) => setEditStudentName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Roll / Reg Number</label>
                <input
                  type="text"
                  value={editStudentRollNo}
                  onChange={(e) => setEditStudentRollNo(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Class / Grade</label>
                <input
                  type="text"
                  value={editStudentGradeClass}
                  onChange={(e) => setEditStudentGradeClass(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Parent Phone</label>
                  <input
                    type="text"
                    value={editParentPhone}
                    onChange={(e) => setEditParentPhone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Batch Time</label>
                  <input
                    type="text"
                    value={editBatchTime}
                    onChange={(e) => setEditBatchTime(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-700 text-white font-bold rounded-xl shadow"
                >
                  Update Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD TEACHER MODAL */}
      {showAddTeacherModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-lg">Add New Faculty Member</h3>
              <button onClick={() => setShowAddTeacherModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {teacherFormError && (
              <div className="bg-rose-50 text-rose-700 text-xs p-3 rounded-xl font-bold">{teacherFormError}</div>
            )}

            <form onSubmit={handleCreateTeacher} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Verma"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Employee ID</label>
                <input
                  type="text"
                  placeholder="e.g. TCH-104"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Subject / Specialization</label>
                <input
                  type="text"
                  placeholder="e.g. Mathematics, Physics"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="Phone number"
                    value={teacherPhone}
                    onChange={(e) => setTeacherPhone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="Email address"
                    value={teacherEmail}
                    onChange={(e) => setTeacherEmail(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddTeacherModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 text-white font-bold rounded-xl shadow"
                >
                  Save Teacher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TEACHER MODAL */}
      {editingTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-lg">Edit Faculty Member</h3>
              <button onClick={() => setEditingTeacher(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {editTeacherError && (
              <div className="bg-rose-50 text-rose-700 text-xs p-3 rounded-xl font-bold">{editTeacherError}</div>
            )}

            <form onSubmit={handleSaveEditedTeacher} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editTeacherName}
                  onChange={(e) => setEditTeacherName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Employee ID</label>
                <input
                  type="text"
                  value={editEmployeeId}
                  onChange={(e) => setEditEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Subject / Specialization</label>
                <input
                  type="text"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Phone</label>
                  <input
                    type="text"
                    value={editTeacherPhone}
                    onChange={(e) => setEditTeacherPhone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Email</label>
                  <input
                    type="email"
                    value={editTeacherEmail}
                    onChange={(e) => setEditTeacherEmail(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 text-white font-bold rounded-xl shadow"
                >
                  Update Teacher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ATTENDANCE RECORD MODAL */}
      {(editingAttendanceRecord || editingTeacherAttendanceRecord) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">
                Correct Attendance Entry ({editingAttendanceRecord?.studentName || editingTeacherAttendanceRecord?.teacherName})
              </h3>
              <button
                onClick={() => {
                  setEditingAttendanceRecord(null);
                  setEditingTeacherAttendanceRecord(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedAttendanceRecord} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Date (YYYY-MM-DD)</label>
                  <input
                    type="date"
                    required
                    value={editAttDate}
                    onChange={(e) => setEditAttDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Time</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 04:15 PM"
                    value={editAttTime}
                    onChange={(e) => setEditAttTime(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Attendance Action</label>
                <select
                  value={editAttType}
                  onChange={(e) => setEditAttType(e.target.value as AttendanceType)}
                  className="w-full px-3 py-2 border rounded-xl font-bold text-slate-800"
                >
                  <option value="check-in">Check In</option>
                  <option value="check-out">Check Out</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Correction Notes / Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Corrected check-out time by admin"
                  value={editAttNotes}
                  onChange={(e) => setEditAttNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingAttendanceRecord(null);
                    setEditingTeacherAttendanceRecord(null);
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 text-white font-bold rounded-xl shadow"
                >
                  Save Correction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANUAL ATTENDANCE MODAL */}
      {showManualAttModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">
                Add Manual Attendance ({correctionTarget === 'students' ? 'Student' : 'Teacher'})
              </h3>
              <button onClick={() => setShowManualAttModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualAttendance} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">
                  Select {correctionTarget === 'students' ? 'Student' : 'Teacher'} *
                </label>
                <select
                  required
                  value={manualPersonId}
                  onChange={(e) => setManualPersonId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl font-bold text-slate-800"
                >
                  <option value="">-- Choose Person --</option>
                  {correctionTarget === 'students'
                    ? students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.rollNo} - {s.gradeClass})
                        </option>
                      ))
                    : teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.employeeId} - {t.subject})
                        </option>
                      ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Time</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 04:30 PM"
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Type</label>
                <select
                  value={manualType}
                  onChange={(e) => setManualType(e.target.value as AttendanceType)}
                  className="w-full px-3 py-2 border rounded-xl font-bold"
                >
                  <option value="check-in">Check In</option>
                  <option value="check-out">Check Out</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Notes</label>
                <input
                  type="text"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowManualAttModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 text-white font-bold rounded-xl shadow"
                >
                  Add Attendance Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAST DATA CSV UPLOADER MODAL */}
      {showUploaderModal && (
        <AttendanceUploaderModal
          students={students}
          onClose={() => setShowUploaderModal(false)}
        />
      )}

      {/* CLASS PROMOTION CONFIRM MODAL */}
      {showPromoteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600 border-b border-slate-100 pb-3">
              <ArrowUpCircle className="w-7 h-7 shrink-0" />
              <h3 className="font-extrabold text-slate-900 text-lg">Promote All Student Classes</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This action will automatically upgrade every student in the system to their next academic grade level (e.g. Class 9th → Class 10th).
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPromoteModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPromote}
                disabled={isPromoting}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow transition-all"
              >
                {isPromoting ? 'Promoting...' : 'Confirm Class Promotion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
