import React, { useState } from 'react';
import { Student, AttendanceRecord, AttendanceType } from '../types';
import { importAttendanceBatch } from '../lib/storage';
import { Upload, Download, FileText, CheckCircle2, AlertCircle, HelpCircle, X } from 'lucide-react';

interface AttendanceUploaderModalProps {
  students: Student[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AttendanceUploaderModal: React.FC<AttendanceUploaderModalProps> = ({
  students,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState<boolean>(true);

  if (!isOpen) return null;

  // Download Sample CSV Template
  const handleDownloadSample = () => {
    const headers = 'Student Name,Roll No / Reg ID,Date (YYYY-MM-DD),Check In Time (HH:MM AM/PM),Check Out Time (HH:MM AM/PM),Class / Grade,Notes\n';
    const sampleRows = [
      'Anshu Bharti,DT-101,2024-04-15,04:00 PM,06:00 PM,Class 6th,Regular Batch',
      'Kashish Bharti,DT-102,2024-04-15,04:05 PM,06:02 PM,Class 10th,Regular Batch',
      'Harsh Tripathi,DT-103,2024-04-15,04:10 PM,06:00 PM,Class 8th,Science Lab',
    ].join('\n');

    const blob = new Blob([headers + sampleRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Sample_Historical_Attendance_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse CSV Line safely
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage('Please select a CSV or JSON file to upload.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessCount(null);

    try {
      const text = await file.text();
      const recordsToImport: Omit<AttendanceRecord, 'id'>[] = [];

      if (file.name.endsWith('.json')) {
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) {
          throw new Error('JSON file must contain an array of attendance records.');
        }

        parsed.forEach((item: any) => {
          if (item.studentName || item.name) {
            const student = students.find(
              (s) =>
                s.name.toLowerCase() === (item.studentName || item.name || '').toLowerCase() ||
                (s.rollNo && s.rollNo.toLowerCase() === (item.rollNo || '').toLowerCase())
            );

            const timestamp = item.timestamp || new Date(item.date || Date.now()).toISOString();
            recordsToImport.push({
              studentId: student?.id || 'st_hist_' + Math.random().toString(36).substring(2, 6),
              studentName: item.studentName || item.name || student?.name || 'Unknown Student',
              rollNo: item.rollNo || student?.rollNo || 'N/A',
              gradeClass: item.gradeClass || student?.gradeClass || 'General',
              type: (item.type as AttendanceType) || 'check-in',
              timestamp,
              date: item.date || timestamp.split('T')[0],
              time: item.time || '04:00 PM',
              notes: item.notes || 'Historical Upload',
            });
          }
        });
      } else {
        // Process CSV
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          throw new Error('CSV file must have a header row and at least 1 record row.');
        }

        const headerCols = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
        
        // Find column indices
        let nameIdx = headerCols.findIndex((h) => h.includes('name') || h.includes('student'));
        let rollIdx = headerCols.findIndex((h) => h.includes('roll') || h.includes('reg') || h.includes('id'));
        let dateIdx = headerCols.findIndex((h) => h.includes('date'));
        let checkInIdx = headerCols.findIndex((h) => h.includes('checkin') || h.includes('in'));
        let checkOutIdx = headerCols.findIndex((h) => h.includes('checkout') || h.includes('out'));
        let typeIdx = headerCols.findIndex((h) => h.includes('type') || h.includes('action'));
        let timeIdx = headerCols.findIndex((h) => h.includes('time') && !h.includes('in') && !h.includes('out'));
        let gradeIdx = headerCols.findIndex((h) => h.includes('class') || h.includes('grade'));
        let notesIdx = headerCols.findIndex((h) => h.includes('note') || h.includes('remark') || h.includes('batch'));

        if (nameIdx === -1) nameIdx = 0;
        if (rollIdx === -1) rollIdx = 1;
        if (dateIdx === -1) dateIdx = 2;

        for (let i = 1; i < lines.length; i++) {
          const cols = parseCSVLine(lines[i]);
          if (cols.length === 0 || !cols[nameIdx]) continue;

          const rawName = cols[nameIdx] || '';
          const rawRoll = cols[rollIdx] || '';
          const rawDate = cols[dateIdx] || new Date().toISOString().split('T')[0];
          const rawGrade = cols[gradeIdx] || '';
          const rawNotes = cols[notesIdx] || 'Historical Upload';

          const matchedStudent = students.find(
            (s) =>
              s.name.toLowerCase() === rawName.toLowerCase() ||
              (rawRoll && s.rollNo && s.rollNo.toLowerCase() === rawRoll.toLowerCase())
          );

          const studentId = matchedStudent?.id || `st_imp_${i}_` + Math.random().toString(36).substring(2, 6);
          const studentName = rawName || matchedStudent?.name || 'Student';
          const rollNo = rawRoll || matchedStudent?.rollNo || 'N/A';
          const gradeClass = rawGrade || matchedStudent?.gradeClass || 'General';

          // Case A: Separate Check-In and Check-Out columns
          const inTime = checkInIdx !== -1 ? cols[checkInIdx] : null;
          const outTime = checkOutIdx !== -1 ? cols[checkOutIdx] : null;

          if (inTime && inTime.trim().length > 0) {
            const dt = new Date(`${rawDate} ${inTime}`);
            const iso = !isNaN(dt.getTime()) ? dt.toISOString() : new Date(`${rawDate}T00:00:00`).toISOString();
            recordsToImport.push({
              studentId,
              studentName,
              rollNo,
              gradeClass,
              type: 'check-in',
              timestamp: iso,
              date: rawDate,
              time: inTime,
              notes: rawNotes,
            });
          }

          if (outTime && outTime.trim().length > 0) {
            const dt = new Date(`${rawDate} ${outTime}`);
            const iso = !isNaN(dt.getTime()) ? dt.toISOString() : new Date(`${rawDate}T00:00:00`).toISOString();
            recordsToImport.push({
              studentId,
              studentName,
              rollNo,
              gradeClass,
              type: 'check-out',
              timestamp: iso,
              date: rawDate,
              time: outTime,
              notes: rawNotes,
            });
          }

          // Case B: Single timestamp / time & type column
          if (!inTime && !outTime) {
            const rowTime = timeIdx !== -1 && cols[timeIdx] ? cols[timeIdx] : '04:00 PM';
            const rowType = (typeIdx !== -1 && cols[typeIdx] && cols[typeIdx].toLowerCase().includes('out'))
              ? 'check-out'
              : 'check-in';

            const dt = new Date(`${rawDate} ${rowTime}`);
            const iso = !isNaN(dt.getTime()) ? dt.toISOString() : new Date(`${rawDate}T00:00:00`).toISOString();

            recordsToImport.push({
              studentId,
              studentName,
              rollNo,
              gradeClass,
              type: rowType as AttendanceType,
              timestamp: iso,
              date: rawDate,
              time: rowTime,
              notes: rawNotes,
            });
          }
        }
      }

      if (recordsToImport.length === 0) {
        throw new Error('No valid attendance records could be parsed from the file.');
      }

      const count = await importAttendanceBatch(recordsToImport);
      setSuccessCount(count);
      setFile(null);

      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to parse and import attendance file.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="bg-sky-100 text-sky-700 p-2.5 rounded-2xl">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg leading-tight">
                Upload Historical Attendance Records
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Import past years check-in & check-out logs via CSV or JSON
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Guidance Box */}
        {showInstructions && (
          <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 text-xs text-amber-900 space-y-2 relative">
            <div className="flex items-center justify-between font-bold text-amber-900">
              <span className="flex items-center gap-1.5 text-sm">
                <HelpCircle className="w-4 h-4 text-amber-600" /> How to Format Your Attendance File
              </span>
              <button
                onClick={() => setShowInstructions(false)}
                className="text-amber-700 hover:text-amber-950 text-xs font-semibold underline"
              >
                Hide
              </button>
            </div>
            <p className="text-amber-800 leading-relaxed">
              Your CSV file can have columns for:
              <br />
              <code className="bg-amber-100/80 px-1.5 py-0.5 rounded text-amber-950 font-mono font-semibold">
                Student Name, Roll No / Reg ID, Date (YYYY-MM-DD), Check In Time, Check Out Time, Class, Notes
              </code>
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleDownloadSample}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                Download Sample CSV Template
              </button>
            </div>
          </div>
        )}

        {/* Notification Messages */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successCount !== null && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-extrabold text-emerald-900">
                Successfully Imported {successCount} Historical Records!
              </p>
              <p className="text-emerald-700 font-medium mt-0.5">
                The records have been saved to local storage & synced directly to Firestore.
              </p>
            </div>
          </div>
        )}

        {/* Upload Form */}
        <form onSubmit={handleFileUpload} className="space-y-4">
          <div className="border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-2xl p-6 text-center bg-slate-50/50 transition-all cursor-pointer relative group">
            <input
              type="file"
              accept=".csv, .json"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setFile(e.target.files[0]);
                  setErrorMessage(null);
                  setSuccessCount(null);
                }
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
            />
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  {file ? file.name : 'Click or Drag & Drop CSV / JSON File'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Supports CSV files and JSON arrays'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleDownloadSample}
              className="text-xs text-sky-700 font-bold hover:underline flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> Sample CSV
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={!file || isProcessing}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                {isProcessing ? 'Processing & Importing...' : 'Import Records'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
