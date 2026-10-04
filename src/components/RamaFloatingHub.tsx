/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * RamaFloatingHub - System Orchestrator & AI Execution Tutor
 */

import React, { useState, useRef, useEffect } from 'react';
import Draggable from 'react-draggable';
import { BotMessageSquare, X, Send, Loader2, Sparkles, Trash2, GripHorizontal } from 'lucide-react';
import { DisciplineBridge, SystemLockdownPayload } from '../DisciplineBridge';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface RamaProps {
  context?: string;
}

export default function RamaFloatingHub({ context = '' }: RamaProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');
  const [lockdownState, setLockdownState] = useState<SystemLockdownPayload>(() => DisciplineBridge.getState());
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      role: 'assistant',
      text: 'Rama online. I am observing system state and active objectives. What is your focus right now, Solo Architect?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Subscribe to DisciplineBridge updates
  useEffect(() => {
    const unsubscribe = DisciplineBridge.subscribe((state) => {
      setLockdownState(state);
    });
    return () => unsubscribe();
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isLoading) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    // Build enriched architectural context
    const fullSystemContext = `
[SYSTEM STATE CONTEXT]
Lockdown Active: ${lockdownState.active}
Lockdown Target Apps: ${lockdownState.restrictedPackages.join(', ')}
System Context: ${context || 'Cymatic Execution Workspace'}
`.trim();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...messages.map((m) => ({
              role: m.role,
              parts: [{ text: m.text }]
            })),
            {
              role: 'user',
              parts: [{ text: `${fullSystemContext}\n\nUser Question: ${query}` }]
            }
          ]
        })
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();

      const assistantMsg: Message = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        text: data.message || data.text || 'System response received without payload.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error('[RamaFloatingHub] Chat Error:', error);
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        text: 'Rama API connectivity failure. Verify local API endpoint / network status.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearHistory = () => {
    setMessages([
      {
        id: `init-${Date.now()}`,
        role: 'assistant',
        text: 'Chat history cleared. Rama standing by for new instructions.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <Draggable nodeRef={nodeRef as any} handle=".handle" bounds="body">
      <div ref={nodeRef} className="fixed bottom-6 right-6 z-[120]">
        {!isOpen ? (
          <button
            onClick={() => setIsOpen(true)}
            className="p-4 bg-gray-900/90 hover:bg-gray-800 backdrop-blur-xl border border-emerald-500/40 rounded-full text-emerald-400 shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95 group relative"
          >
            <BotMessageSquare size={24} className="group-hover:rotate-6 transition-transform" />
            {lockdownState.active && (
              <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-gray-950"></span>
              </span>
            )}
          </button>
        ) : (
          <div className="w-80 sm:w-96 h-[480px] bg-gray-950/95 backdrop-blur-2xl border border-emerald-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Draggable Header */}
            <div className="handle p-3.5 bg-gray-900/80 border-b border-gray-800/80 cursor-grab active:cursor-grabbing flex items-center justify-between select-none">
              <div className="flex items-center gap-2">
                <GripHorizontal size={16} className="text-gray-600" />
                <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <Sparkles size={14} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    Rama AI Hub
                  </h3>
                  <span className="text-[9px] font-black uppercase text-emerald-400/80 tracking-widest block">
                    {lockdownState.active ? 'System Locked' : 'Monitor Active'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={clearHistory}
                  title="Clear Chat History"
                  className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Quick Action Chips */}
            <div className="px-3 py-2 bg-gray-900/40 border-b border-gray-800/50 flex gap-1.5 overflow-x-auto custom-scrollbar">
              <button
                onClick={() => handleSendMessage('Summarize current active goals and focus areas.')}
                className="whitespace-nowrap px-2.5 py-1 text-[10px] font-bold bg-gray-900 text-gray-300 border border-gray-800 hover:border-emerald-500/40 hover:text-white rounded-lg transition-all"
              >
                🎯 Active Goals
              </button>
              <button
                onClick={() => handleSendMessage('Check lockdown bridge status and restricted packages.')}
                className="whitespace-nowrap px-2.5 py-1 text-[10px] font-bold bg-gray-900 text-gray-300 border border-gray-800 hover:border-emerald-500/40 hover:text-white rounded-lg transition-all"
              >
                🛡️ Lockdown Check
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-emerald-600 text-gray-950 font-semibold rounded-tr-none'
                        : 'bg-gray-900 border border-gray-800 text-gray-200 rounded-tl-none font-medium'
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="text-[9px] text-gray-600 px-1 mt-1 font-mono">{m.timestamp}</span>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono p-2">
                  <Loader2 size={14} className="animate-spin" />
                  <span>Rama is evaluating...</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-gray-900/80 border-t border-gray-800 flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                placeholder="Ask Rama..."
                className="flex-1 bg-gray-950 border border-gray-800 focus:border-emerald-500 text-xs text-white placeholder-gray-500 rounded-xl px-3.5 py-2.5 outline-none transition-all disabled:opacity-50"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || isLoading}
                className="p-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-gray-950 font-bold rounded-xl transition-all flex items-center justify-center"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </Draggable>
  );
}
