import React, { useState, useMemo } from 'react';
import { Teacher, TeacherAttendanceRecord, AttendanceType } from '../types';
import {
  addTeacher,
  deleteTeacher,
  updateTeacher,
  recordTeacherAttendance,
} from '../lib/storage';
import confetti from 'canvas-confetti';
import {
  UserCheck,
  ShieldCheck,
  Lock,
  UserPlus,
  Trash2,
  Edit3,
  Search,
  KeyRound,
  BookOpen,
  Phone,
  Mail,
  Clock,
  LogOut,
  AlertCircle,
  Users,
  CheckCircle2,
  Download,
  Calendar,
  Sparkles,
  X,
} from 'lucide-react';

interface TeacherPanelProps {
  teachers: Teacher[];
  teacherAttendance: TeacherAttendanceRecord[];
  isTeacherAuthenticated: boolean;
  setIsTeacherAuthenticated: (val: boolean) => void;
}

export const TeacherPanel: React.FC<TeacherPanelProps> = ({
  teachers,
  teacherAttendance,
  isTeacherAuthenticated,
  setIsTeacherAuthenticated,
}) => {
  // Authentication State
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Kiosk / Quick Attendance State
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedType, setSelectedType] = useState<AttendanceType | null>(null);
  const [attendanceNotes, setAttendanceNotes] = useState<string>('');
  const [isSubmittingAttendance, setIsSubmittingAttendance] = useState<boolean>(false);
  const [attendanceSuccess, setAttendanceSuccess] = useState<string | null>(null);

  // Management State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  // Add Teacher Form
  const [name, setName] = useState<string>('');
  const [employeeId, setEmployeeId] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Teacher Form
  const [editName, setEditName] = useState<string>('');
  const [editEmployeeId, setEditEmployeeId] = useState<string>('');
  const [editSubject, setEditSubject] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editError, setEditError] = useState<string | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'attendance' | 'roster' | 'logs'>('attendance');
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split('T')[0]);

  // Handle Teacher Password Login
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setIsVerifying(true);

    try {
      const res = await fetch('/api/teacher/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsTeacherAuthenticated(true);
        setPasswordInput('');
      } else {
        const clientSecret = import.meta.env.VITE_TEACHER_PASSWORD || 'teacher123';
        if (passwordInput === clientSecret) {
          setIsTeacherAuthenticated(true);
          setPasswordInput('');
        } else {
          setPasswordError('Incorrect teacher password. Please try again.');
        }
      }
    } catch {
      const clientSecret = import.meta.env.VITE_TEACHER_PASSWORD || 'teacher123';
      if (passwordInput === clientSecret) {
        setIsTeacherAuthenticated(true);
        setPasswordInput('');
      } else {
        setPasswordError('Incorrect teacher password. Please try again.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  // Record Teacher Attendance
  const handleRecordAttendance = async () => {
    if (!selectedTeacherId || !selectedType) return;

    setIsSubmittingAttendance(true);
    setAttendanceSuccess(null);

    try {
      const record = await recordTeacherAttendance(selectedTeacherId, selectedType, attendanceNotes);

      try {
        confetti({ particleCount: 60, spread: 50, origin: { y: 0.7 } });
      } catch {}

      const teacher = teachers.find((t) => t.id === selectedTeacherId);
      const actionLabel = selectedType === 'check-in' ? 'Checked IN' : 'Checked OUT';
      setAttendanceSuccess(`Success! ${teacher?.name || 'Teacher'} ${actionLabel} at ${record.time}`);

      setSelectedType(null);
      setAttendanceNotes('');

      setTimeout(() => setAttendanceSuccess(null), 5000);
    } catch (err: any) {
      alert(err?.message || 'Failed to record teacher attendance');
    } finally {
      setIsSubmittingAttendance(false);
    }
  };

  // Add Teacher Submit
  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Teacher name is required.');
      return;
    }

    try {
      await addTeacher({
        name: name.trim(),
        employeeId: employeeId.trim() || `TCH-${Math.floor(100 + Math.random() * 900)}`,
        subject: subject.trim() || 'General',
        phone: phone.trim(),
        email: email.trim(),
      });

      setName('');
      setEmployeeId('');
      setSubject('');
      setPhone('');
      setEmail('');
      setShowAddModal(false);
    } catch {
      setFormError('Failed to add teacher record.');
    }
  };

  // Edit Teacher Submit
  const handleEditTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    setEditError(null);

    if (!editName.trim()) {
      setEditError('Teacher name is required.');
      return;
    }

    try {
      await updateTeacher(editingTeacher.id, {
        name: editName.trim(),
        employeeId: editEmployeeId.trim(),
        subject: editSubject.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim(),
      });

      setEditingTeacher(null);
    } catch {
      setEditError('Failed to update teacher record.');
    }
  };

  // Filtered Teachers
  const filteredTeachers = useMemo(() => {
    return teachers.filter(
      (t) =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [teachers, searchTerm]);

  // Selected teacher object
  const selectedTeacher = useMemo(() => {
    return teachers.find((t) => t.id === selectedTeacherId);
  }, [teachers, selectedTeacherId]);

  // Today's records for selected teacher
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const teacherTodayRecords = useMemo(() => {
    if (!selectedTeacherId) return [];
    return teacherAttendance.filter((r) => r.teacherId === selectedTeacherId && r.date === todayStr);
  }, [teacherAttendance, selectedTeacherId, todayStr]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return teacherAttendance.filter((r) => {
      const matchesDate = !dateFilter || r.date === dateFilter;
      const matchesSearch =
        r.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.subject.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesDate && matchesSearch;
    });
  }, [teacherAttendance, dateFilter, searchTerm]);

  // Export Teacher Attendance CSV
  const handleExportCSV = () => {
    const headers = 'Teacher Name,Employee ID,Subject,Type,Date,Time,Notes\n';
    const rows = filteredLogs
      .map(
        (r) =>
          `"${r.teacherName}","${r.employeeId}","${r.subject}","${r.type}","${r.date}","${r.time}","${r.notes || ''}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Teacher_Attendance_${dateFilter || 'All'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. LOCKED VIEW
  if (!isTeacherAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center space-y-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 space-y-5">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Teacher Portal Locked
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Please enter the teacher access password to record attendance and view faculty records.
            </p>
          </div>

          {passwordError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4 text-left">
            <div>
              <label htmlFor="teacher-password-input" className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-1">
                Access Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  id="teacher-password-input"
                  type="password"
                  placeholder="Enter teacher password..."
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-700/30 transition-all flex items-center justify-center gap-2 touch-manipulation active:scale-[0.98]"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>{isVerifying ? 'Verifying...' : 'Unlock Teacher Portal'}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. UNLOCKED TEACHER PORTAL
  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Header Bar */}
      <div className="bg-slate-900 text-white p-5 sm:p-7 rounded-3xl shadow-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black">Teacher Portal</h1>
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                Unlocked
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              Faculty check-in & check-out, teacher roster management, and daily logs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 sm:flex-none py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 touch-manipulation"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Teacher</span>
          </button>

          <button
            onClick={() => setIsTeacherAuthenticated(false)}
            className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs sm:text-sm rounded-xl border border-slate-700 transition-all flex items-center gap-1.5"
            title="Lock Teacher Session"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Lock</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('attendance')}
          className={`py-2 px-4 rounded-xl font-extrabold text-xs sm:text-sm transition-all flex items-center gap-2 ${
            activeSubTab === 'attendance'
              ? 'bg-emerald-700 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" /> Teacher Check In/Out
        </button>

        <button
          onClick={() => setActiveSubTab('roster')}
          className={`py-2 px-4 rounded-xl font-extrabold text-xs sm:text-sm transition-all flex items-center gap-2 ${
            activeSubTab === 'roster'
              ? 'bg-emerald-700 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" /> Faculty Roster ({teachers.length})
        </button>

        <button
          onClick={() => setActiveSubTab('logs')}
          className={`py-2 px-4 rounded-xl font-extrabold text-xs sm:text-sm transition-all flex items-center gap-2 ${
            activeSubTab === 'logs'
              ? 'bg-emerald-700 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" /> Attendance Logs
        </button>
      </div>

      {/* SUCCESS BANNER */}
      {attendanceSuccess && (
        <div className="bg-emerald-950 border-2 border-emerald-500 text-emerald-100 p-4 rounded-2xl shadow-lg flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
          <span className="font-bold text-sm">{attendanceSuccess}</span>
        </div>
      )}

      {/* SUB TAB 1: TEACHER CHECK IN / OUT */}
      {activeSubTab === 'attendance' && (
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-md border border-slate-200 space-y-6">
          <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-lg border-b border-slate-100 pb-3">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <span>Mark Teacher Check-In / Check-Out</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Step 1: Select Teacher */}
            <div className="space-y-4">
              <label className="block text-xs font-bold uppercase text-slate-500">
                1. Select Faculty Member
              </label>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Filter teachers by name or subject..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {filteredTeachers.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTeacherId(t.id)}
                    className={`w-full p-3.5 rounded-2xl text-left border transition-all flex items-center justify-between ${
                      selectedTeacherId === t.id
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{t.name}</p>
                      <p className="text-xs text-slate-500 font-medium">
                        {t.employeeId} • <span className="text-emerald-700 font-bold">{t.subject}</span>
                      </p>
                    </div>
                    {selectedTeacherId === t.id && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Choose Action */}
            <div className="space-y-5 bg-slate-50/70 rounded-2xl p-5 border border-slate-200/80 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-3">
                  2. Select Check-In or Check-Out
                </label>

                {selectedTeacher ? (
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 mb-4">
                    <p className="text-xs text-slate-400 font-bold uppercase">Selected Teacher</p>
                    <p className="text-base font-extrabold text-slate-900">{selectedTeacher.name}</p>
                    <p className="text-xs text-slate-600">Subject: {selectedTeacher.subject}</p>
                  </div>
                ) : (
                  <p className="text-xs text-amber-700 font-bold bg-amber-50 p-3 rounded-xl border border-amber-200 mb-4">
                    Please select a teacher from the list first.
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={!selectedTeacherId}
                    onClick={() => setSelectedType('check-in')}
                    className={`p-4 rounded-2xl font-black text-sm border transition-all flex flex-col items-center gap-1.5 ${
                      selectedType === 'check-in'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg ring-2 ring-emerald-500/30'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-emerald-50 hover:border-emerald-300'
                    }`}
                  >
                    <UserCheck className="w-6 h-6" />
                    <span>Check In</span>
                  </button>

                  <button
                    type="button"
                    disabled={!selectedTeacherId}
                    onClick={() => setSelectedType('check-out')}
                    className={`p-4 rounded-2xl font-black text-sm border transition-all flex flex-col items-center gap-1.5 ${
                      selectedType === 'check-out'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-lg ring-2 ring-amber-500/30'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-amber-50 hover:border-amber-300'
                    }`}
                  >
                    <Clock className="w-6 h-6" />
                    <span>Check Out</span>
                  </button>
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Notes / Remarks (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Class 10th Math Lecture"
                    value={attendanceNotes}
                    onChange={(e) => setAttendanceNotes(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <button
                onClick={handleRecordAttendance}
                disabled={!selectedTeacherId || !selectedType || isSubmittingAttendance}
                className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-extrabold rounded-2xl shadow-lg transition-all text-sm mt-4"
              >
                {isSubmittingAttendance ? 'Saving...' : 'Record Attendance'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 2: FACULTY ROSTER (READ ONLY FOR TEACHERS) */}
      {activeSubTab === 'roster' && (
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-md border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search faculty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
              />
            </div>
            <p className="text-xs text-slate-500 italic">
              Faculty roster management (adding/editing) is restricted to Admin access.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeachers.map((t) => (
              <div
                key={t.id}
                className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 space-y-3 relative hover:border-emerald-300 transition-all shadow-sm"
              >
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
            ))}
          </div>
        </div>
      )}

      {/* SUB TAB 3: ATTENDANCE LOGS */}
      {activeSubTab === 'logs' && (
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-md border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
              />
              {dateFilter && (
                <button
                  onClick={() => setDateFilter('')}
                  className="text-xs text-slate-500 underline font-semibold"
                >
                  Clear Date
                </button>
              )}
            </div>

            <button
              onClick={handleExportCSV}
              className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Export Logs CSV
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase border-b border-slate-200">
                  <th className="py-3 px-4">Teacher Name</th>
                  <th className="py-3 px-4">ID / Subject</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No teacher attendance records found for this filter.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{log.teacherName}</td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-slate-500">{log.employeeId}</span>
                        <br />
                        <span className="text-emerald-700 font-bold">{log.subject}</span>
                      </td>
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
