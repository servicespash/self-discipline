import React from 'react';
import { CalendarDays } from 'lucide-react';

interface TaskFilterBarProps {
  filterMode: 'all' | 'today' | 'tomorrow' | 'month' | 'custom';
  setFilterMode: (mode: any) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  selectedMonth: number;
  setSelectedMonth: (m: number) => void;
  selectedYear: number;
  setSelectedYear: (y: number) => void;
  timeRangeFilter: 'all' | 'morning' | 'afternoon' | 'evening';
  setTimeRangeFilter: (r: any) => void;
  MONTH_NAMES: string[];
  tasksCount: number;
  progressPercent: number;
}

export const TaskFilterBar: React.FC<TaskFilterBarProps> = ({
  filterMode, setFilterMode, selectedDate, setSelectedDate, selectedMonth, setSelectedMonth,
  selectedYear, setSelectedYear, timeRangeFilter, setTimeRangeFilter, MONTH_NAMES, tasksCount, progressPercent
}) => (
  <div className="space-y-3 p-4 bg-gray-950 rounded-2xl border border-gray-800">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setFilterMode('today')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filterMode === 'today'
              ? 'bg-emerald-600 text-gray-950 font-black'
              : 'bg-gray-900 text-gray-400 hover:text-white'
          }`}
        >Today</button>
        <button
          onClick={() => setFilterMode('tomorrow')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filterMode === 'tomorrow'
              ? 'bg-emerald-600 text-gray-950 font-black'
              : 'bg-gray-900 text-gray-400 hover:text-white'
          }`}
        >Tomorrow</button>
        <button
          onClick={() => setFilterMode('month')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filterMode === 'month'
              ? 'bg-emerald-600 text-gray-950 font-black'
              : 'bg-gray-900 text-gray-400 hover:text-white'
          }`}
        >This Month ({MONTH_NAMES[selectedMonth]})</button>
        <button
          onClick={() => setFilterMode('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filterMode === 'all'
              ? 'bg-emerald-600 text-gray-950 font-black'
              : 'bg-gray-900 text-gray-400 hover:text-white'
          }`}
        >All Dates</button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono text-gray-500 uppercase font-bold">Time Window:</span>
        <select
          value={timeRangeFilter}
          onChange={(e: any) => setTimeRangeFilter(e.target.value)}
          className="bg-gray-900 border border-gray-800 rounded-xl px-2.5 py-1.5 text-xs text-emerald-400 font-bold focus:outline-none"
        >
          <option value="all">All Hours</option>
          <option value="morning">Morning (06:00 - 12:00)</option>
          <option value="afternoon">Afternoon (12:00 - 17:00)</option>
          <option value="evening">Evening (17:00 - 24:00)</option>
        </select>
      </div>
    </div>

    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-900 text-xs">
      <div className="flex items-center gap-2">
        <span className="text-gray-400 font-mono text-[11px]">Select Date:</span>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => {
            setSelectedDate(e.target.value);
            setFilterMode('custom');
          }}
          className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
        />
      </div>

      {filterMode === 'month' && (
        <div className="flex items-center gap-2">
          <span className="text-gray-400 font-mono text-[11px]">Month:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-gray-900 border border-gray-800 rounded-xl px-2.5 py-1 text-white font-bold text-xs"
          >
            {MONTH_NAMES.map((m, idx) => (
              <option key={m} value={idx}>{m}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-gray-900 border border-gray-800 rounded-xl px-2.5 py-1 text-white font-bold text-xs"
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>
        </div>
      )}

      <div className="text-[11px] font-mono text-gray-400">
        Showing <strong className="text-white">{tasksCount}</strong> tasks ({progressPercent}% complete)
      </div>
    </div>
  </div>
);
