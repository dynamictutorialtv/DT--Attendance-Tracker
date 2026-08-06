import React, { useState, useEffect } from 'react';
import { Logo } from './Logo';
import { ActiveTab } from '../types';
import { UserCheck, ShieldCheck, FileText, Clock, Wifi, Lock, GraduationCap } from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isAdminAuthenticated: boolean;
  isTeacherAuthenticated?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isAdminAuthenticated,
  isTeacherAuthenticated = false,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
      );
      setCurrentDate(
        now.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      {/* Top Info Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between border-b border-slate-800/80 text-xs sm:text-sm">
        <div className="flex items-center gap-2 text-slate-300 font-medium">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-300 font-semibold tracking-wide">Dynamic Tutorial System</span>
          <span className="hidden sm:inline-block text-slate-500">•</span>
          <span className="hidden sm:inline-flex items-center gap-1 text-slate-400">
            <Wifi className="w-3.5 h-3.5 text-emerald-400" /> Live Sync Active
          </span>
        </div>

        <div className="flex items-center gap-3 text-slate-300 font-mono text-xs sm:text-sm">
          <span className="hidden md:inline-block text-slate-400">{currentDate}</span>
          <div className="flex items-center gap-1 bg-slate-800/90 px-2.5 py-1 rounded-full text-sky-400 font-semibold border border-slate-700/60 shadow-inner">
            <Clock className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
            <span>{currentTime}</span>
          </div>
        </div>
      </div>

      {/* Main Header Brand + Nav */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Logo Branding */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('kiosk')}>
            <Logo size={48} />
            <div className="flex flex-col">
              <span className="font-black text-lg sm:text-xl tracking-tight text-white leading-none">
                DYNAMIC <span className="text-sky-400">TUTORIAL</span>
              </span>
              <span className="text-xs font-semibold text-amber-400 italic mt-0.5 tracking-wider">
                Discuss & Explore
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs - Optimized for Touch (Large Tap Targets) */}
        <nav className="flex items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-800/80 shadow-inner overflow-x-auto no-scrollbar">
          <button
            id="nav-tab-kiosk"
            onClick={() => setActiveTab('kiosk')}
            className={`flex-1 min-w-[95px] sm:min-w-[115px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 select-none touch-manipulation active:scale-95 ${
              activeTab === 'kiosk'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <UserCheck className="w-4 h-4 shrink-0" />
            <span>Students</span>
          </button>

          <button
            id="nav-tab-teachers"
            onClick={() => setActiveTab('teachers')}
            className={`flex-1 min-w-[95px] sm:min-w-[115px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 select-none touch-manipulation active:scale-95 ${
              activeTab === 'teachers'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <GraduationCap className="w-4 h-4 shrink-0" />
            <div className="flex items-center gap-1">
              <span>Teachers</span>
              {!isTeacherAuthenticated && (
                <Lock className="w-3 h-3 text-amber-400 inline" />
              )}
            </div>
          </button>

          <button
            id="nav-tab-admin"
            onClick={() => setActiveTab('admin')}
            className={`flex-1 min-w-[95px] sm:min-w-[115px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 select-none touch-manipulation active:scale-95 ${
              activeTab === 'admin'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <div className="flex items-center gap-1">
              <span>Admin</span>
              {!isAdminAuthenticated && (
                <Lock className="w-3 h-3 text-amber-400 inline" />
              )}
            </div>
          </button>

          <button
            id="nav-tab-reports"
            onClick={() => setActiveTab('reports')}
            className={`flex-1 min-w-[95px] sm:min-w-[115px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 select-none touch-manipulation active:scale-95 ${
              activeTab === 'reports'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>Reports</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
