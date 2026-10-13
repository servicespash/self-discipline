import React from 'react';
import { CheckCircle2, Circle, Calendar, Clock, ShieldCheck, Trash2 } from 'lucide-react';
import { TaskItem } from '../TaskWidget';

interface TaskItemProps {
  task: TaskItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export const TaskItemView: React.FC<TaskItemProps> = ({ task, onToggle, onDelete }) => {
  const isDone = task.status === 'completed';
  return (
    <div
      onClick={() => onToggle(task.id)}
      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group ${
        isDone
          ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
          : 'bg-gray-950 border-gray-800 text-gray-300 hover:border-gray-700'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-xl transition-colors shrink-0 ${
            isDone
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-gray-900 text-gray-600 group-hover:text-emerald-400'
          }`}
        >
          {isDone ? <CheckCircle2 size={18} /> : <Circle size={18} />}
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold ${
                isDone ? 'line-through text-gray-500' : 'text-white'
              }`}
            >
              {task.title}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar size={10} /> {task.dateStr}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock size={10} /> {task.startTime} - {task.endTime}
            </span>
            <span>•</span>
            <span className="text-gray-400 uppercase font-bold text-[9px]">{task.category}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 self-end sm:self-auto">
        {task.linkedRule && (
          <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-purple-950/60 text-purple-400 border border-purple-500/20 flex items-center gap-1">
            <ShieldCheck size={10} /> Lockdown
          </span>
        )}

        <span
          className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-xl border ${
            task.priority === 'critical'
              ? 'bg-red-500/10 text-red-400 border-red-500/20'
              : task.priority === 'high'
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              : 'bg-gray-900 text-gray-400 border-gray-800'
          }`}
        >
          {task.priority}
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          className="p-1.5 text-gray-600 hover:text-red-400 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};
