import { useState, useEffect } from 'react';
import { CalendarDays, RefreshCw, Clock } from 'lucide-react';

export default function CalendarWidget({ accessToken }: { accessToken: string | null }) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEvents = () => {
    if (!accessToken) return;
    setLoading(true);
    const now = new Date().toISOString();
    fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now}&singleEvents=true&orderBy=startTime`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(res => res.json())
      .then(data => {
        setEvents(data.items || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvents();
  }, [accessToken]);

  return (
    <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
          <CalendarDays size={18} /> Neural Timeline
        </h3>
        <button 
          onClick={fetchEvents}
          disabled={loading}
          className="p-2 hover:bg-gray-800 rounded-lg text-gray-500 hover:text-emerald-400 transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      <div className="space-y-4">
        {events.length === 0 && !loading && (
          <div className="py-8 text-center border border-dashed border-gray-800 rounded-xl">
            <p className="text-gray-500 text-xs italic">No upcoming timeline events detected.</p>
          </div>
        )}
        {events.slice(0, 5).map(event => {
          const startDate = new Date(event.start.dateTime || event.start.date);
          return (
            <div key={event.id} className="p-3 bg-gray-950/50 rounded-xl border border-gray-800/50 hover:border-emerald-500/30 transition-all group">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-200 truncate group-hover:text-emerald-400 transition-colors">{event.summary}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock size={10} className="text-gray-600" />
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">
                      {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="bg-emerald-500/5 px-2 py-1 rounded text-[8px] font-black text-emerald-500 uppercase border border-emerald-500/10">
                  {startDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
