import React from 'react';
import { TaskItem } from '../TaskWidget';
import { TaskItemView } from './TaskItemView';

interface TaskListProps {
  tasks: TaskItem[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export const TaskList: React.FC<TaskListProps> = ({ tasks, onToggle, onDelete }) => (
  <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
    {tasks.length === 0 ? (
      <div className="p-8 text-center text-gray-500 font-mono text-xs border border-dashed border-gray-800 rounded-2xl">
        No scheduled tasks found for this date/time window. Click "Add Task" to schedule focused execution.
      </div>
    ) : (
      tasks.map((task) => (
        <TaskItemView key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} />
      ))
    )}
  </div>
);
