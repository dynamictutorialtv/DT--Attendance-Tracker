import React, { useState, useMemo } from 'react';
import { Student, AttendanceRecord, AttendanceType } from '../types';
import { recordAttendance } from '../lib/storage';
import { sortStudents, getClassLevelNumber } from '../lib/classUtils';
import confetti from 'canvas-confetti';
import {
  UserCheck,
  LogOut,
  CheckCircle2,
  Clock,
  Sparkles,
  GraduationCap,
  AlertCircle,
  History,
  CalendarCheck2,
  Check,
  Filter,
} from 'lucide-react';

interface KioskProps {
  students: Student[];
  attendance: AttendanceRecord[];
}

export const Kiosk: React.FC<KioskProps> = ({ students, attendance }) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedType, setSelectedType] = useState<AttendanceType | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Extract unique grades for filtering (ordered strictly from Junior to Higher classes)
  const availableGrades = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.gradeClass) set.add(s.gradeClass);
    });
    return Array.from(set).sort((a, b) => {
      const levelA = getClassLevelNumber(a);
      const levelB = getClassLevelNumber(b);
      if (levelA !== levelB) return levelA - levelB;
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [students]);

  // Filter & Order students based on grade (Junior classes top, or alphabetical when grade selected)
  const filteredStudents = useMemo(() => {
    const matching = students.filter((s) => {
      return gradeFilter === 'all' || s.gradeClass === gradeFilter;
    });
    return sortStudents(matching, gradeFilter);
  }, [students, gradeFilter]);

  // Currently selected student details
  const selectedStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId);
  }, [students, selectedStudentId]);

  // Today's date YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Today's records for all students
  const todayRecords = useMemo(() => {
    return attendance.filter((r) => r.date === todayStr);
  }, [attendance, todayStr]);

  // Today's record for selected student
  const studentTodayRecords = useMemo(() => {
    if (!selectedStudentId) return [];
    return todayRecords.filter((r) => r.studentId === selectedStudentId);
  }, [todayRecords, selectedStudentId]);

  const lastCheckIn = studentTodayRecords.find((r) => r.type === 'check-in');
  const lastCheckOut = studentTodayRecords.find((r) => r.type === 'check-out');

  // Trigger Confetti
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {
      // fallback
    }
  };

  // Submit Attendance
  const handleSubmit = async () => {
    if (!selectedStudentId || !selectedType) return;

    setIsSubmitting(true);
    setSuccessMessage(null);

    try {
      const record = await recordAttendance(selectedStudentId, selectedType, notes);
      triggerConfetti();

      const studentName = selectedStudent?.name || 'Student';
      const actionLabel = selectedType === 'check-in' ? 'Checked IN' : 'Checked OUT';
      setSuccessMessage(`Success! ${studentName} ${actionLabel} at ${record.time}`);

      // Clear selections
      setSelectedType(null);
      setNotes('');

      // Auto dismiss success toast after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err: any) {
      alert(err?.message || 'Failed to record attendance');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Welcome / Instruction Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 rounded-3xl p-5 sm:p-7 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-sky-500/20 text-sky-300 text-xs font-semibold px-3 py-1 rounded-full border border-sky-400/30 mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Dynamic Tutorial Kiosk
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Student Attendance Kiosk
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              Select your name from the dropdown below, then choose Check-In or Check-Out.
            </p>
          </div>

          {/* Quick Date Display */}
          <div className="bg-slate-800/90 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-700/80 text-center shrink-0">
            <span className="text-xs uppercase font-bold text-sky-400 tracking-wider block">Today's Date</span>
            <span className="text-lg font-extrabold text-white">
              {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="bg-emerald-950/80 border-2 border-emerald-500/80 text-emerald-100 p-4 rounded-2xl shadow-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 text-slate-950 p-2 rounded-xl shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-base sm:text-lg">{successMessage}</p>
              <p className="text-xs text-emerald-300">Attendance updated in real-time records.</p>
            </div>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-300 hover:text-white text-xs font-bold px-3 py-1 bg-emerald-900/60 rounded-lg border border-emerald-700"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* STEP 1: SELECT STUDENT NAME */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-lg border border-slate-200/80 space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="bg-sky-100 text-sky-700 p-3 rounded-2xl font-black text-lg w-11 h-11 flex items-center justify-center shrink-0">
            1
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Select Student Name</h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Filter by class/grade and select your name from the dropdown list below.
            </p>
          </div>
        </div>

        {/* Grade Filter */}
        <div>
          <label htmlFor="student-grade-filter" className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-1">
            Filter Class / Grade
          </label>
          <div className="relative">
            <select
              id="student-grade-filter"
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none cursor-pointer"
            >
              <option value="all">All Classes (Junior to Senior)</option>
              {availableGrades.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Student Select Dropdown */}
        <div>
          <label htmlFor="student-select-dropdown" className="block text-sm font-extrabold text-slate-800 mb-2">
            Student Name <span className="text-rose-500">*</span>
          </label>
          <select
            id="student-select-dropdown"
            value={selectedStudentId}
            onChange={(e) => {
              setSelectedStudentId(e.target.value);
              setSelectedType(null); // Reset choice on student change
            }}
            className="w-full bg-sky-50/50 border-2 border-sky-200 focus:border-sky-500 rounded-2xl px-4 py-3.5 text-base sm:text-lg font-bold text-slate-900 shadow-sm focus:ring-4 focus:ring-sky-500/20 focus:outline-none transition-all touch-manipulation cursor-pointer"
          >
            <option value="">-- Tap to Select Student Name --</option>
            {filteredStudents.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.rollNo} • {s.gradeClass})
              </option>
            ))}
          </select>
        </div>

        {/* Selected Student Preview Badge */}
        {selectedStudent && (
          <div className="bg-gradient-to-r from-sky-50 to-indigo-50 border-2 border-sky-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white font-extrabold text-lg flex items-center justify-center shadow-md shrink-0">
                {selectedStudent.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg leading-tight">
                  {selectedStudent.name}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-0.5">
                  <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-sky-800">
                    ID: {selectedStudent.rollNo}
                  </span>
                  <span>•</span>
                  <span className="font-semibold text-slate-700">{selectedStudent.gradeClass}</span>
                </div>
              </div>
            </div>

            {/* Today's Current Status */}
            <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold flex items-center gap-2 text-slate-700 self-start sm:self-auto">
              <Clock className="w-4 h-4 text-sky-600" />
              <span>
                Today:{' '}
                {lastCheckOut ? (
                  <span className="text-amber-600 font-extrabold">Checked Out ({lastCheckOut.time})</span>
                ) : lastCheckIn ? (
                  <span className="text-emerald-600 font-extrabold">Checked In ({lastCheckIn.time})</span>
                ) : (
                  <span className="text-slate-400 font-normal">Not checked in yet</span>
                )}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* STEP 2: CHOOSE CHECK IN / CHECK OUT (Appears when student is chosen) */}
      {selectedStudent && (
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-xl border-2 border-sky-500/40 space-y-6 animate-in fade-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="bg-sky-600 text-white p-3 rounded-2xl font-black text-lg w-11 h-11 flex items-center justify-center shrink-0 shadow-md">
              2
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Choose Attendance Action
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Tap Check In when arriving or Check Out when leaving.
              </p>
            </div>
          </div>

          {/* Touch-Friendly Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Check In Option */}
            <button
              id="kiosk-option-checkin"
              type="button"
              onClick={() => setSelectedType('check-in')}
              className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 flex items-center justify-between touch-manipulation cursor-pointer select-none ${
                selectedType === 'check-in'
                  ? 'border-emerald-500 bg-emerald-50/90 ring-4 ring-emerald-500/20 shadow-lg scale-[1.01]'
                  : 'border-slate-200 bg-slate-50/60 hover:bg-emerald-50/40 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold shadow-md ${
                    selectedType === 'check-in'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  <UserCheck className="w-8 h-8" />
                </div>
                <div>
                  <span className="block text-lg font-black text-slate-900">
                    Check In
                  </span>
                  <span className="text-xs font-semibold text-emerald-700">
                    Arriving at Coaching
                  </span>
                </div>
              </div>

              {selectedType === 'check-in' && (
                <div className="bg-emerald-600 text-white rounded-full p-1">
                  <Check className="w-5 h-5 stroke-[3]" />
                </div>
              )}
            </button>

            {/* Check Out Option */}
            <button
              id="kiosk-option-checkout"
              type="button"
              onClick={() => setSelectedType('check-out')}
              className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 flex items-center justify-between touch-manipulation cursor-pointer select-none ${
                selectedType === 'check-out'
                  ? 'border-amber-500 bg-amber-50/90 ring-4 ring-amber-500/20 shadow-lg scale-[1.01]'
                  : 'border-slate-200 bg-slate-50/60 hover:bg-amber-50/40 hover:border-amber-300'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold shadow-md ${
                    selectedType === 'check-out'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  <LogOut className="w-8 h-8" />
                </div>
                <div>
                  <span className="block text-lg font-black text-slate-900">
                    Check Out
                  </span>
                  <span className="text-xs font-semibold text-amber-700">
                    Leaving Coaching
                  </span>
                </div>
              </div>

              {selectedType === 'check-out' && (
                <div className="bg-amber-600 text-white rounded-full p-1">
                  <Check className="w-5 h-5 stroke-[3]" />
                </div>
              )}
            </button>
          </div>

          {/* Optional Notes Field */}
          {selectedType && (
            <div className="space-y-3 pt-2 animate-in fade-in duration-200">
              <div>
                <label htmlFor="kiosk-notes-input" className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-1">
                  Optional Remarks / Subject
                </label>
                <input
                  id="kiosk-notes-input"
                  type="text"
                  placeholder="e.g. Maths Class, Science Batch, Extra Class..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              {/* Confirm Submission Button */}
              <button
                id="kiosk-submit-button"
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className={`w-full py-4 px-6 rounded-2xl text-lg font-black text-white shadow-xl transition-all duration-200 flex items-center justify-center gap-2 touch-manipulation active:scale-[0.98] ${
                  selectedType === 'check-in'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/30'
                    : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-600/30'
                }`}
              >
                {isSubmitting ? (
                  <span>Recording Attendance...</span>
                ) : (
                  <>
                    <CalendarCheck2 className="w-6 h-6" />
                    <span>
                      Confirm {selectedType === 'check-in' ? 'Check In' : 'Check Out'} for{' '}
                      {selectedStudent.name}
                    </span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* TODAY'S LIVE ATTENDANCE LOG */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-lg border border-slate-200/80 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-sky-600" />
            <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
              Today's Live Attendance Feed
            </h3>
          </div>
          <span className="bg-sky-100 text-sky-800 text-xs font-bold px-2.5 py-1 rounded-full">
            {todayRecords.length} Entries Today
          </span>
        </div>

        {todayRecords.length === 0 ? (
          <div className="text-center py-8 text-slate-400 space-y-2">
            <GraduationCap className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold">No attendance logged yet today.</p>
            <p className="text-xs text-slate-400">Select a student name above to record check-in.</p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {todayRecords.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 p-3.5 rounded-2xl border border-slate-200/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white ${
                      r.type === 'check-in' ? 'bg-emerald-600' : 'bg-amber-600'
                    }`}
                  >
                    {r.type === 'check-in' ? 'IN' : 'OUT'}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{r.studentName}</p>
                    <p className="text-xs text-slate-500 font-mono">
                      {r.rollNo} • {r.gradeClass} {r.notes ? `(${r.notes})` : ''}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      r.type === 'check-in'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {r.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
