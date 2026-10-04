/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Solidified Hybrid Timeline & Event Scheduler Widget
 */

import React, { useState, useEffect } from 'react';
import { CalendarDays, RefreshCw, Clock, Plus, Trash2 } from 'lucide-react';

interface TimelineEvent {
  id: string;
  summary: string;
  startTime: string; // ISO string
  source: 'local' | 'cloud';
}

const STORAGE_KEY = 'sdc_local_events_v1';

export default function CalendarWidget({ accessToken }: { accessToken: string | null }) {
  const [events, setEvents] = useState<TimelineEvent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [
        {
          id: 'local_1',
          summary: 'Cymatic Resonance Live Call Execution',
          startTime: new Date(Date.now() + 3600000 * 2).toISOString(),
          source: 'local'
        },
        {
          id: 'local_2',
          summary: 'Cymatic Hub PBL Module Sync',
          startTime: new Date(Date.now() + 3600000 * 24).toISOString(),
          source: 'local'
        }
      ];
    } catch {
      return [];
    }
  });

  const [newEventTitle, setNewEventTitle] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch (e) {
      console.error('Calendar Storage Error:', e);
    }
  }, [events]);

  const fetchCloudEvents = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const now = new Date().toISOString();
      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now}&singleEvents=true&orderBy=startTime`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.items) {
        const cloudEvents: TimelineEvent[] = data.items.map((item: any) => ({
          id: item.id,
          summary: item.summary || 'Untitled Event',
          startTime: item.start.dateTime || item.start.date || new Date().toISOString(),
          source: 'cloud'
        }));

        setEvents((prev) => {
          const localOnly = prev.filter(e => e.source === 'local');
          return [...localOnly, ...cloudEvents];
        });
      }
    } catch (err) {
      console.error('Cloud Calendar Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchCloudEvents();
    }
  }, [accessToken]);

  const addLocalEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    const newEvt: TimelineEvent = {
      id: `local_${Date.now()}`,
      summary: newEventTitle.trim(),
      startTime: new Date(Date.now() + 3600000 * 4).toISOString(), // Default 4 hrs from now
      source: 'local'
    };

    setEvents([newEvt, ...events]);
    setNewEventTitle('');
  };

  const deleteEvent = (id: string) => {
    setEvents(events.filter(e => e.id !== id));
  };

  return (
    <div className="bg-gray-900 p-6 rounded-3xl border border-gray-800 shadow-xl flex flex-col justify-between h-full">
      <div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
            <CalendarDays size={18} className="text-emerald-400" /> Neural Timeline
          </h3>
          <div className="flex items-center gap-2">
            {accessToken && (
              <button 
                onClick={fetchCloudEvents}
                disabled={loading}
                className="p-2 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-emerald-400 transition-all disabled:opacity-50"
                title="Sync Google Calendar"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
            )}
            <span className="text-[9px] font-black uppercase px-2 py-1 bg-gray-950 text-emerald-400 rounded-lg border border-gray-800">
              {events.length} Scheduled
            </span>
          </div>
        </div>

        {/* Schedule Input */}
        <form onSubmit={addLocalEvent} className="mb-4 flex gap-2">
          <input
            type="text"
            value={newEventTitle}
            onChange={(e) => setNewEventTitle(e.target.value)}
            placeholder="Schedule event / execution..."
            className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-500 text-gray-950 font-black p-2.5 rounded-xl transition-all"
          >
            <Plus size={16} />
          </button>
        </form>

        {/* Event List */}
        <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
          {events.length === 0 && !loading && (
            <div className="py-8 text-center border border-dashed border-gray-800 rounded-2xl">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">No timeline events scheduled.</p>
            </div>
          )}

          {events.map((event) => {
            const startDate = new Date(event.startTime);
            const isValidDate = !isNaN(startDate.getTime());

            return (
              <div 
                key={event.id} 
                className="p-3 bg-gray-950/60 rounded-xl border border-gray-800/60 hover:border-emerald-500/30 transition-all group flex items-center justify-between"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <p className="text-xs font-bold text-gray-200 truncate group-hover:text-emerald-400 transition-colors">
                    {event.summary}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock size={10} className="text-gray-600" />
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">
                      {isValidDate ? startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                    </p>
                    {event.source === 'cloud' && (
                      <span className="text-[8px] font-black text-blue-400 bg-blue-500/10 px-1 py-0.2 rounded border border-blue-500/20">
                        Cloud
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="bg-emerald-500/10 px-2 py-1 rounded text-[9px] font-black text-emerald-400 uppercase border border-emerald-500/20">
                    {isValidDate ? startDate.toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Today'}
                  </div>
                  <button
                    onClick={() => deleteEvent(event.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-600 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
