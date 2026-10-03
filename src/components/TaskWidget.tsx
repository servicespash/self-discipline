import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, RefreshCw } from 'lucide-react';

export default function TaskWidget({ accessToken }: { accessToken: string | null }) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = () => {
    if (!accessToken) return;
    setLoading(true);
    fetch('https://www.googleapis.com/tasks/v1/users/@me/lists/@default/tasks', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(res => res.json())
      .then(data => {
        setTasks(data.items || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchTasks();
  }, [accessToken]);

  return (
    <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
          <CheckSquare size={18} /> Operation Log
        </h3>
        <button 
          onClick={fetchTasks}
          disabled={loading}
          className="p-2 hover:bg-gray-800 rounded-lg text-gray-500 hover:text-emerald-400 transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      <div className="space-y-3">
        {tasks.length === 0 && !loading && (
          <div className="py-8 text-center border border-dashed border-gray-800 rounded-xl">
            <p className="text-gray-500 text-xs italic">No active operations found in cloud.</p>
          </div>
        )}
        {tasks.slice(0, 8).map(task => (
          <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-950/50 rounded-xl border border-gray-800/50 hover:border-emerald-500/30 transition-all group">
            {task.status === 'completed' ? (
              <CheckCircle2 className="text-emerald-500 shrink-0" size={16}/> 
            ) : (
              <Circle className="text-gray-600 group-hover:text-emerald-500/50 shrink-0" size={16}/>
            )}
            <span className={`text-xs font-medium truncate ${task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
              {task.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

import { CheckSquare } from 'lucide-react';
