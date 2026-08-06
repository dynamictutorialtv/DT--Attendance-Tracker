import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Kiosk } from './components/Kiosk';
import { AdminPanel } from './components/AdminPanel';
import { TeacherPanel } from './components/TeacherPanel';
import { Reports } from './components/Reports';
import { Student, AttendanceRecord, Teacher, TeacherAttendanceRecord, ActiveTab } from './types';
import {
  subscribeStudents,
  subscribeAttendance,
  subscribeTeachers,
  subscribeTeacherAttendance,
} from './lib/storage';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('kiosk');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teacherAttendance, setTeacherAttendance] = useState<TeacherAttendanceRecord[]>([]);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState<boolean>(false);

  // Subscribe to real-time students, attendance, teachers, and teacher attendance
  useEffect(() => {
    const unsubStudents = subscribeStudents((list) => {
      setStudents(list);
    });

    const unsubAttendance = subscribeAttendance((records) => {
      setAttendance(records);
    });

    const unsubTeachers = subscribeTeachers((list) => {
      setTeachers(list);
    });

    const unsubTeacherAtt = subscribeTeacherAttendance((records) => {
      setTeacherAttendance(records);
    });

    return () => {
      unsubStudents();
      unsubAttendance();
      unsubTeachers();
      unsubTeacherAtt();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-900 font-sans antialiased flex flex-col selection:bg-sky-500 selection:text-white">
      {/* Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdminAuthenticated={isAdminAuthenticated}
        isTeacherAuthenticated={isTeacherAuthenticated}
      />

      {/* Main Responsive Canvas View */}
      <main className="flex-1 pb-20 sm:pb-12">
        {activeTab === 'kiosk' && (
          <Kiosk students={students} attendance={attendance} />
        )}

        {activeTab === 'teachers' && (
          <TeacherPanel
            teachers={teachers}
            teacherAttendance={teacherAttendance}
            isTeacherAuthenticated={isTeacherAuthenticated}
            setIsTeacherAuthenticated={setIsTeacherAuthenticated}
          />
        )}

        {activeTab === 'admin' && (
          <AdminPanel
            students={students}
            attendance={attendance}
            teachers={teachers}
            teacherAttendance={teacherAttendance}
            isAuthenticated={isAdminAuthenticated}
            setIsAuthenticated={setIsAdminAuthenticated}
          />
        )}

        {activeTab === 'reports' && (
          <Reports students={students} attendance={attendance} />
        )}
      </main>

      {/* Mobile Sticky Bottom Navigation Bar (Optimized for 95% Tablet & Mobile usage) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 py-2 px-4 md:hidden shadow-2xl">
        <div className="flex items-center justify-around max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('kiosk')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
              activeTab === 'kiosk' ? 'text-sky-400 font-bold' : 'text-slate-400 font-medium'
            }`}
          >
            <span className="text-[11px]">⏱️ Students</span>
          </button>

          <button
            onClick={() => setActiveTab('teachers')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
              activeTab === 'teachers' ? 'text-emerald-400 font-bold' : 'text-slate-400 font-medium'
            }`}
          >
            <span className="text-[11px]">🎓 Teachers</span>
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
              activeTab === 'admin' ? 'text-purple-400 font-bold' : 'text-slate-400 font-medium'
            }`}
          >
            <span className="text-[11px]">🔐 Admin</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
              activeTab === 'reports' ? 'text-amber-400 font-bold' : 'text-slate-400 font-medium'
            }`}
          >
            <span className="text-[11px]">📊 Reports</span>
          </button>
        </div>
      </div>
    </div>
  );
}
