/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * RamaFloatingHub - High-Performance AI Execution Tutor, Context Aware & Memory Vault
 * Enhanced with Chat Context Management System, Rolling Interaction Awareness,
 * and Multi-Format Summary Exports (PDF, Clipboard, Email, File, External Links).
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Draggable from 'react-draggable';
import {
  BotMessageSquare,
  X,
  Send,
  Loader2,
  Sparkles,
  Trash2,
  GripHorizontal,
  Minus,
  Maximize2,
  Share2,
  FileText,
  Download,
  Copy,
  Check,
  Brain,
  Mail,
  ExternalLink,
  Bookmark,
  FileDown,
  RefreshCw,
  Plus,
  History,
  FileCheck,
  Globe,
  MessageSquare,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
  Printer
} from 'lucide-react';
import { DisciplineBridge, SystemLockdownPayload } from '../DisciplineBridge';
import { LocalUserSession } from '../types/session';
import {
  ChatContextManager,
  ChatSession,
  Message
} from '../utils/chatContextManager';
import { exportSummaryAsPdf } from '../utils/pdfExport';

interface RamaProps {
  context?: string;
  session?: LocalUserSession | null;
  onClose?: () => void;
}

const MEMORY_STORAGE_KEY = 'cymatic_rama_memory_v1';

export default function RamaFloatingHub({ context = '', session, onClose }: RamaProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  // User moniker & email resolution
  const userMoniker = useMemo(() => {
    return session?.moniker || 'Isabirye Latif (Solo Architect)';
  }, [session]);

  const userEmail = useMemo(() => {
    return session?.email || 'latif@cymatic.local';
  }, [session]);

  // Window states
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [input, setInput] = useState('');

  // Tab state: 'chat' | 'history' | 'memory'
  const [activeTab, setActiveTab] = useState<'chat' | 'history' | 'memory'>('chat');

  // Summary & Export Modals
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Context Management State
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    return ChatContextManager.loadSessions(userMoniker);
  });
  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return ChatContextManager.getActiveSessionId(sessions);
  });

  // Rolling Summary (Cumulative interaction memory)
  const [rollingSummary, setRollingSummary] = useState<string>(() => {
    return ChatContextManager.loadRollingSummary();
  });
  const [isUpdatingRollingSummary, setIsUpdatingRollingSummary] = useState(false);

  // Active Session Resolution
  const activeSession = useMemo(() => {
    return (
      sessions.find((s) => s.id === activeSessionId) ||
      sessions[0] || {
        id: 'fallback-session',
        title: 'Operational Genesis',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
        userMoniker
      }
    );
  }, [sessions, activeSessionId, userMoniker]);

  const messages = activeSession.messages;

  // New Memory Input
  const [newMemoryInput, setNewMemoryInput] = useState('');

  // Lockdown and System state
  const [lockdownState, setLockdownState] = useState<SystemLockdownPayload>(() =>
    DisciplineBridge.getState()
  );

  // Memory Vault State
  const [memories, setMemories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(MEMORY_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('[Rama] Memory load error:', e);
    }
    return [
      `User Call Sign: ${userMoniker}`,
      'Prime Objective: Universal Cymatic Hub execution and resonance discipline',
      'Protocol: Block social media & high-dopamine algorithms during focus hours',
      'Spiritual Grounding: 5 daily prayers with 15-minute post-prayer centering',
      'Physical Discipline: Concrete dumbbell conditioning & daily workspace order'
    ];
  });

  // Show temporary toast notification
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  }, []);

  // Save memories to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(memories));
    } catch (e) {
      console.error('[Rama] Memory save error:', e);
    }
  }, [memories]);

  // Subscribe to DisciplineBridge updates
  useEffect(() => {
    const unsubscribe = DisciplineBridge.subscribe((state) => {
      setLockdownState(state);
    });
    return () => unsubscribe();
  }, []);

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (isOpen && !isMinimized && activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, isLoading, activeTab]);

  // Read live operational snapshot from localStorage
  const getSystemSnapshot = useCallback(() => {
    let tasksSummary = 'None';
    let prayersSummary = 'Standard schedule active';
    let calendarSummary = 'Standard schedule active';

    try {
      const savedTasks = localStorage.getItem('sdc_local_operations_v1');
      if (savedTasks) {
        const parsed = JSON.parse(savedTasks);
        if (Array.isArray(parsed) && parsed.length > 0) {
          tasksSummary = parsed.map((t: any) => `${t.title} (${t.status})`).join(' | ');
        }
      }
    } catch {
      // Ignore
    }

    try {
      const savedPrayers = localStorage.getItem('sdc_prayer_discipline_v2');
      if (savedPrayers) {
        const parsed = JSON.parse(savedPrayers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const done = parsed.filter((p: any) => p.completed).map((p: any) => p.name);
          prayersSummary = `Completed: ${done.length ? done.join(', ') : 'None yet'}. Streaks active.`;
        }
      }
    } catch {
      // Ignore
    }

    try {
      const savedWindows = localStorage.getItem('sdc_calendar_manager_lockdown_windows_v3');
      if (savedWindows) {
        const parsed = JSON.parse(savedWindows);
        if (Array.isArray(parsed) && parsed.length > 0) {
          calendarSummary = `${parsed.length} daily lockdown windows configured.`;
        }
      }
    } catch {
      // Ignore
    }

    const remainingMinutes =
      lockdownState.endTime && lockdownState.active
        ? Math.max(0, Math.ceil((lockdownState.endTime - Date.now()) / 60000))
        : 0;

    return {
      moniker: userMoniker,
      email: userEmail,
      lockdownActive: lockdownState.active,
      remainingMinutes,
      restrictedPackages: lockdownState.restrictedPackages || [],
      activeTasks: [tasksSummary],
      prayersSummary,
      calendarSummary,
      currentView: context || 'Cymatic Hub & Resonance Universal Shell'
    };
  }, [userMoniker, userEmail, lockdownState, context]);

  // Window Controls
  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setIsOpen(false);
    if (onClose) onClose();
  };

  const handleToggleMinimize = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setIsMinimized((prev) => !prev);
  };

  // Switch to another session
  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    ChatContextManager.setActiveSessionId(sessionId);
    setActiveTab('chat');
    showToast('Session loaded');
  };

  // Start new chat session
  const handleCreateNewSession = () => {
    const { sessions: updated, newSession } = ChatContextManager.createNewSession(
      userMoniker,
      sessions
    );
    setSessions(updated);
    setActiveSessionId(newSession.id);
    setActiveTab('chat');
    showToast('New focus session initiated');
  };

  // Delete a session
  const handleDeleteSession = (sessionId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Delete this consultation session?')) return;

    const { sessions: updated, nextActiveId } = ChatContextManager.deleteSession(
      sessionId,
      sessions,
      userMoniker
    );
    setSessions(updated);
    setActiveSessionId(nextActiveId);
    showToast('Session deleted');
  };

  // Chat message submission with full Context Awareness & Memory
  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isLoading) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMsg];
    const updatedSessions = ChatContextManager.updateSessionMessages(
      activeSessionId,
      newMessages,
      sessions
    );
    setSessions(updatedSessions);

    if (!textToSend) setInput('');
    setIsLoading(true);
    setIsError(false);
    setErrorMessage('');

    const userContext = getSystemSnapshot();
    const pastSessionsContext = ChatContextManager.generatePastSessionsOverview(
      sessions,
      activeSessionId
    );

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            parts: [{ text: m.text }]
          })),
          userContext,
          memory: memories,
          rollingSummary,
          pastSessionsContext
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data = await res.json();

      const assistantMsg: Message = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        text: data.message || data.text || 'Directive acknowledged.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const finalMessages = [...newMessages, assistantMsg];
      const finalizedSessions = ChatContextManager.updateSessionMessages(
        activeSessionId,
        finalMessages,
        updatedSessions
      );
      setSessions(finalizedSessions);
    } catch (err: any) {
      console.error('[Rama] Chat Error:', err);
      setIsError(true);
      setErrorMessage(err.message || 'Network error');
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

  // Memory management
  const addMemoryItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryInput.trim()) return;
    setMemories((prev) => [newMemoryInput.trim(), ...prev]);
    setNewMemoryInput('');
    showToast('Memory node recorded in Rama vault');
  };

  const removeMemoryItem = (index: number) => {
    setMemories((prev) => prev.filter((_, i) => i !== index));
    showToast('Memory node deleted');
  };

  // Generate Executive Summary for current session
  const handleGenerateSummary = async (targetSession?: ChatSession) => {
    const sessionToSummarize = targetSession || activeSession;
    setIsGeneratingSummary(true);
    setShowSummaryModal(true);
    setSummaryText(`Synthesizing executive briefing for "${sessionToSummarize.title}"...`);

    const userContext = getSystemSnapshot();

    try {
      const res = await fetch('/api/chat/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: sessionToSummarize.messages.map((m) => ({
            role: m.role,
            parts: [{ text: m.text }]
          })),
          userContext,
          memory: memories,
          mode: 'session'
        })
      });

      if (!res.ok) throw new Error('API summary error');
      const data = await res.json();
      const generated = data.summary || data.message || 'Summary ready.';
      setSummaryText(generated);

      // Attach summary to session
      const updated = ChatContextManager.updateSessionSummary(
        sessionToSummarize.id,
        generated,
        sessions
      );
      setSessions(updated);
    } catch {
      // Offline fallback
      const fallback = `
# Cymatic OS - Rama Executive Briefing
**Session:** ${sessionToSummarize.title}
**Architect:** ${userMoniker}
**Date:** ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
**System State:** ${lockdownState.active ? '🛡️ Lockdown Active' : '⚡ Monitor Active'}

## 🎯 Executive Overview & Focus State
- Session contains ${sessionToSummarize.messages.length} log exchanges.
- Current active objectives aligned with Cymatic resonance protocols.

## ⚡ Immediate Directives & Action Items
- [ ] Maintain uninterrupted execution on priority operations.
- [ ] Verify prayer times and spiritual centering discipline.
- [ ] Enforce phone & package lockdown during designated work windows.

## 🛡️ Discipline & System Lockdown Directives
- **Lockdown Status:** ${lockdownState.active ? 'ENFORCED' : 'STANDBY'}
- **Restricted Targets:** ${lockdownState.restrictedPackages.join(', ') || 'com.whatsapp, com.instagram.android'}

---
*Generated by Cymatic Discipline OS - Rama AI Executive Engine*
`.trim();
      setSummaryText(fallback);

      const updated = ChatContextManager.updateSessionSummary(
        sessionToSummarize.id,
        fallback,
        sessions
      );
      setSessions(updated);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Re-synthesize rolling cumulative interaction awareness
  const handleUpdateRollingSummary = async () => {
    setIsUpdatingRollingSummary(true);
    showToast('Re-synthesizing AI continuous awareness...');

    const userContext = getSystemSnapshot();
    const allExchanges = sessions.flatMap((s) => s.messages);

    try {
      const res = await fetch('/api/chat/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: allExchanges.slice(-20).map((m) => ({
            role: m.role,
            parts: [{ text: m.text }]
          })),
          userContext,
          memory: memories,
          previousSummary: rollingSummary,
          mode: 'rolling'
        })
      });

      if (!res.ok) throw new Error('Rolling summary error');
      const data = await res.json();
      const updatedSummary = data.summary || rollingSummary;
      setRollingSummary(updatedSummary);
      ChatContextManager.saveRollingSummary(updatedSummary);
      showToast('AI awareness updated across all sessions');
    } catch (err) {
      console.error('[Rama] Rolling summary error:', err);
      showToast('Awareness update fallback retained');
    } finally {
      setIsUpdatingRollingSummary(false);
    }
  };

  // Export Summary: Clipboard
  const handleExportSummaryClipboard = async () => {
    const success = await ChatContextManager.exportToClipboard(summaryText);
    if (success) {
      showToast('Summary copied to clipboard');
    } else {
      showToast('Failed to copy summary');
    }
  };

  // Export Summary: Email
  const handleExportSummaryEmail = () => {
    ChatContextManager.exportToEmail(summaryText, userMoniker);
    showToast('Opening email client...');
  };

  // Export Summary: PDF (A4 styled document via jsPDF)
  const handleExportSummaryPdf = () => {
    try {
      exportSummaryAsPdf({
        title: `Rama Executive Briefing // ${activeSession.title}`,
        summaryText: summaryText || 'No summary text available.',
        userMoniker,
        userEmail,
        lockdownActive: lockdownState.active
      });
      showToast('PDF downloaded successfully');
    } catch (err) {
      console.error('[PDF Export] Failed:', err);
      showToast('PDF generation error');
    }
  };

  // Export Summary: Markdown or Text file
  const handleExportSummaryFile = (format: 'md' | 'txt') => {
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Cymatic_Rama_Briefing_${dateStr}.${format}`;
    const mime = format === 'md' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8';
    ChatContextManager.exportToFile(summaryText, filename, mime);
    showToast(`Saved ${filename}`);
  };

  // Export Full Chat Transcript
  const getFullChatText = (format: 'md' | 'txt' | 'json') => {
    const dateStr = new Date().toISOString().split('T')[0];
    if (format === 'json') {
      return JSON.stringify(
        {
          metadata: {
            app: 'Cymatic Discipline OS',
            sessionTitle: activeSession.title,
            sessionUser: userMoniker,
            exportedAt: new Date().toISOString(),
            lockdownActive: lockdownState.active
          },
          memories,
          messages
        },
        null,
        2
      );
    }

    if (format === 'md') {
      return [
        `# Cymatic Discipline OS - ${activeSession.title}`,
        `**Architect:** ${userMoniker} | **Date:** ${dateStr}`,
        `**System Lockdown:** ${lockdownState.active ? 'ACTIVE' : 'STANDBY'}`,
        `\n---`,
        `\n## Consultation Log\n`,
        ...messages.map(
          (m) =>
            `### [${m.timestamp}] ${m.role === 'user' ? '👤 ' + userMoniker : '🤖 Rama'}\n\n${m.text}\n`
        )
      ].join('\n');
    }

    return [
      `CYMATIC DISCIPLINE OS - ${activeSession.title.toUpperCase()}`,
      `Architect: ${userMoniker}`,
      `Date: ${dateStr}`,
      `Lockdown Status: ${lockdownState.active ? 'ACTIVE' : 'STANDBY'}`,
      `-------------------------------------------------------`,
      ...messages.map(
        (m) => `[${m.timestamp}] ${m.role === 'user' ? userMoniker : 'Rama'}:\n${m.text}\n`
      )
    ].join('\n');
  };

  const handleExportFullChat = (format: 'md' | 'txt' | 'json') => {
    setShowExportMenu(false);
    const content = getFullChatText(format);
    const dateStr = new Date().toISOString().split('T')[0];
    const mimeMap = {
      md: 'text/markdown;charset=utf-8',
      txt: 'text/plain;charset=utf-8',
      json: 'application/json;charset=utf-8'
    };
    ChatContextManager.exportToFile(
      content,
      `Cymatic_Rama_Chat_${dateStr}.${format}`,
      mimeMap[format]
    );
    showToast(`Saved Chat Transcript (${format.toUpperCase()})`);
  };

  // WhatsApp Share
  const handleShareToWhatsApp = (text?: string) => {
    setShowExportMenu(false);
    const shareContent = text || summaryText || getFullChatText('txt').slice(0, 1800);
    const url = ChatContextManager.getWhatsAppShareUrl(shareContent);
    window.open(url, '_blank');
  };

  // Native Web Share or Modal Fallback
  const handleNativeShare = async (text?: string, title?: string) => {
    setShowExportMenu(false);
    const content = text || summaryText || getFullChatText('txt').slice(0, 1500);
    const shareTitle = title || `Cymatic OS - Rama Briefing for ${userMoniker}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: content,
          url: ChatContextManager.getShareableLink(activeSessionId)
        });
        showToast('Shared successfully');
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setShowShareModal(true);
        }
      }
    } else {
      setShowShareModal(true);
    }
  };

  // Share deep-link URL
  const handleCopyShareableLink = async () => {
    setShowExportMenu(false);
    const link = ChatContextManager.getShareableLink(activeSessionId);
    const success = await ChatContextManager.exportToClipboard(link);
    if (success) {
      showToast('App link copied to clipboard');
    } else {
      showToast('Failed to copy link');
    }
  };

  if (!isOpen) return null;

  // ----------------------------------------------------
  // MINIMIZED VIEW: Sleek Floating Command Pill
  // ----------------------------------------------------
  if (isMinimized) {
    return (
      <Draggable nodeRef={nodeRef as any} handle=".min-handle" cancel=".no-drag" bounds="body">
        <div ref={nodeRef} className="fixed bottom-6 right-6 z-[120]">
          <div className="min-handle cursor-grab active:cursor-grabbing bg-gray-950/95 backdrop-blur-2xl border border-emerald-500/40 rounded-full px-4 py-2.5 shadow-2xl flex items-center gap-3 animate-in zoom-in-95 select-none hover:border-emerald-400/70 transition-all">
            <GripHorizontal size={14} className="text-gray-600 shrink-0" />

            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="p-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/30">
                  <BotMessageSquare size={16} className="text-emerald-400" />
                </div>
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400" />
              </div>

              <div className="text-left">
                <div className="text-xs font-black text-white flex items-center gap-1.5 leading-none">
                  Rama AI
                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/30">
                    {lockdownState.active ? 'LOCKED' : 'ONLINE'}
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 font-medium leading-none block mt-1 truncate max-w-[130px]">
                  {activeSession.title}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 ml-2 border-l border-gray-800 pl-2">
              <button
                type="button"
                onClick={handleToggleMinimize}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                title="Expand Rama AI Hub"
                className="no-drag p-1.5 text-gray-400 hover:text-emerald-400 hover:bg-gray-900 rounded-lg transition-colors"
              >
                <Maximize2 size={15} />
              </button>
              <button
                type="button"
                onClick={handleClose}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                title="Close Rama AI Hub"
                className="no-drag p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-900 rounded-lg transition-colors"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </div>
      </Draggable>
    );
  }

  // ----------------------------------------------------
  // FULL EXPANDED VIEW: Complete AI Execution Hub
  // ----------------------------------------------------
  return (
    <Draggable nodeRef={nodeRef as any} handle=".handle" cancel=".no-drag" bounds="body">
      <div ref={nodeRef} className="fixed bottom-4 sm:bottom-6 right-2 sm:right-6 z-[120]">
        <div className="w-[95vw] sm:w-[460px] h-[84vh] sm:h-[550px] bg-gray-950/98 backdrop-blur-3xl border border-emerald-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

          {/* HEADER: Draggable Handle */}
          <div className="handle p-3 sm:p-3.5 bg-gray-900/90 border-b border-gray-800/80 cursor-grab active:cursor-grabbing flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <GripHorizontal size={16} className="text-gray-600 shrink-0" />
              <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 shrink-0">
                <Sparkles size={14} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  Rama AI Hub
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                    {lockdownState.active ? 'LOCKDOWN ON' : 'STANDBY'}
                  </span>
                </h3>
                <span className="text-[10px] text-gray-400 truncate max-w-[150px] sm:max-w-[210px] block font-medium">
                  {userMoniker}
                </span>
              </div>
            </div>

            {/* Header Control Buttons */}
            <div className="flex items-center gap-1">
              {/* Tab Switcher: Chat, History & Context, Memory Vault */}
              <div className="no-drag flex items-center bg-gray-950 p-0.5 rounded-lg border border-gray-800 mr-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab('chat');
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  title="Chat Console"
                  className={`no-drag px-2 py-1 text-[10px] font-bold rounded ${
                    activeTab === 'chat'
                      ? 'bg-emerald-600 text-gray-950 font-black'
                      : 'text-gray-400 hover:text-white'
                  } transition-colors`}
                >
                  Chat
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab('history');
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  title="History & Context Manager"
                  className={`no-drag px-2 py-1 text-[10px] font-bold rounded flex items-center gap-1 ${
                    activeTab === 'history'
                      ? 'bg-emerald-600 text-gray-950 font-black'
                      : 'text-gray-400 hover:text-white'
                  } transition-colors`}
                >
                  <History size={11} />
                  <span>{sessions.length}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab('memory');
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  title="Memory Vault"
                  className={`no-drag px-2 py-1 text-[10px] font-bold rounded flex items-center gap-1 ${
                    activeTab === 'memory'
                      ? 'bg-emerald-600 text-gray-950 font-black'
                      : 'text-gray-400 hover:text-white'
                  } transition-colors`}
                >
                  <Brain size={11} />
                  <span>{memories.length}</span>
                </button>
              </div>

              {/* Export & Share Dropdown Menu */}
              <div className="relative" ref={exportDropdownRef}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowExportMenu((prev) => !prev);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  title="Export & Share"
                  className="no-drag p-1.5 text-gray-400 hover:text-emerald-400 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <Share2 size={15} />
                </button>

                {showExportMenu && (
                  <div
                    onMouseDown={(e) => e.stopPropagation()}
                    className="no-drag absolute right-0 mt-2 w-56 bg-gray-950 border border-emerald-500/30 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 text-xs"
                  >
                    <div className="px-2.5 py-1.5 border-b border-gray-800 text-[10px] font-black uppercase tracking-wider text-emerald-400">
                      Export & Multi-Channel Share
                    </div>

                    <button
                      type="button"
                      onClick={() => handleGenerateSummary()}
                      className="w-full text-left px-2.5 py-2 hover:bg-gray-900 rounded-xl text-gray-200 hover:text-emerald-400 flex items-center gap-2 font-medium"
                    >
                      <Sparkles size={14} className="text-emerald-400" />
                      <span>Executive Summary</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleExportSummaryPdf}
                      className="w-full text-left px-2.5 py-2 hover:bg-gray-900 rounded-xl text-emerald-400 hover:text-emerald-300 flex items-center gap-2 font-bold"
                    >
                      <Printer size={14} className="text-emerald-400" />
                      <span>Export Summary as PDF (.pdf)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExportFullChat('md')}
                      className="w-full text-left px-2.5 py-2 hover:bg-gray-900 rounded-xl text-gray-200 hover:text-emerald-400 flex items-center gap-2 font-medium"
                    >
                      <FileDown size={14} className="text-gray-400" />
                      <span>Export Chat as Markdown (.md)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExportFullChat('txt')}
                      className="w-full text-left px-2.5 py-2 hover:bg-gray-900 rounded-xl text-gray-200 hover:text-emerald-400 flex items-center gap-2 font-medium"
                    >
                      <FileText size={14} className="text-gray-400" />
                      <span>Save as Text Document (.txt)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExportFullChat('json')}
                      className="w-full text-left px-2.5 py-2 hover:bg-gray-900 rounded-xl text-gray-200 hover:text-emerald-400 flex items-center gap-2 font-medium"
                    >
                      <Download size={14} className="text-gray-400" />
                      <span>Export JSON Database</span>
                    </button>

                    <div className="my-1 border-t border-gray-800" />

                    <button
                      type="button"
                      onClick={() => handleShareToWhatsApp()}
                      className="w-full text-left px-2.5 py-2 hover:bg-gray-900 rounded-xl text-emerald-400 hover:text-emerald-300 flex items-center gap-2 font-medium"
                    >
                      <ExternalLink size={14} />
                      <span>Share to WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleExportSummaryEmail}
                      className="w-full text-left px-2.5 py-2 hover:bg-gray-900 rounded-xl text-gray-200 hover:text-emerald-400 flex items-center gap-2 font-medium"
                    >
                      <Mail size={14} />
                      <span>Share via Email</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleNativeShare()}
                      className="w-full text-left px-2.5 py-2 hover:bg-gray-900 rounded-xl text-gray-200 hover:text-emerald-400 flex items-center gap-2 font-medium"
                    >
                      <Share2 size={14} />
                      <span>Share External Links</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyShareableLink}
                      className="w-full text-left px-2.5 py-2 hover:bg-gray-900 rounded-xl text-gray-200 hover:text-emerald-400 flex items-center gap-2 font-medium"
                    >
                      <Globe size={14} />
                      <span>Copy Web Launch URL</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Minimize Button */}
              <button
                type="button"
                onClick={handleToggleMinimize}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                title="Minimize Rama AI Hub"
                className="no-drag p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Minus size={15} />
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={handleClose}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                title="Close Rama AI Hub"
                className="no-drag p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* TOAST FEEDBACK BANNER */}
          {toastMessage && (
            <div className="bg-emerald-950/90 border-b border-emerald-500/40 text-emerald-300 text-[11px] font-bold px-4 py-1.5 text-center flex items-center justify-center gap-2 animate-in fade-in">
              <Check size={12} className="text-emerald-400" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* TAB 1: CHAT INTERFACE */}
          {activeTab === 'chat' && (
            <>
              {/* Session Context Bar & Quick Action Chips */}
              <div className="no-drag px-3 py-2 bg-gray-900/60 border-b border-gray-800/60 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/30 shrink-0">
                    THREAD
                  </span>
                  <span className="text-xs font-bold text-gray-200 truncate max-w-[140px] sm:max-w-[180px]">
                    {activeSession.title}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleGenerateSummary()}
                    title="Synthesize Executive Briefing"
                    className="no-drag px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 rounded-lg transition-all flex items-center gap-1"
                  >
                    <Sparkles size={11} />
                    <span>Summary</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCreateNewSession}
                    title="Start New Thread"
                    className="no-drag px-2 py-1 text-[10px] font-bold bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-800 rounded-lg transition-all flex items-center gap-1"
                  >
                    <Plus size={11} />
                    <span>New</span>
                  </button>
                </div>
              </div>

              {/* Chat Body */}
              <div className="no-drag flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col group ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`relative max-w-[88%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-emerald-600 text-gray-950 font-semibold rounded-tr-none shadow-md shadow-emerald-950/40'
                          : 'bg-gray-900 border border-gray-800 text-gray-200 rounded-tl-none font-medium'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{m.text}</div>

                      {/* Per-Message Share & Copy Actions on hover */}
                      <div className="no-drag opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-6 right-0 flex items-center gap-1 bg-gray-900 border border-gray-800 rounded-lg px-1.5 py-0.5 shadow-lg z-10">
                        <button
                          type="button"
                          onClick={() => {
                            ChatContextManager.exportToClipboard(m.text);
                            showToast('Message copied');
                          }}
                          title="Copy text"
                          className="p-1 text-gray-400 hover:text-white transition-colors"
                        >
                          <Copy size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleShareToWhatsApp(m.text)}
                          title="Share to WhatsApp"
                          className="p-1 text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                          <ExternalLink size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleNativeShare(m.text)}
                          title="Share message"
                          className="p-1 text-gray-400 hover:text-white transition-colors"
                        >
                          <Share2 size={11} />
                        </button>
                      </div>
                    </div>
                    <span className="text-[9px] text-gray-600 px-1 mt-1 font-mono">{m.timestamp}</span>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono p-2">
                    <Loader2 size={14} className="animate-spin" />
                    <span>Rama is synthesizing with full memory awareness...</span>
                  </div>
                )}

                {isError && (
                  <div className="p-3 bg-red-950/30 border border-red-500/30 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-red-400 block">Connection interrupted</span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {errorMessage || 'Unable to reach Rama server'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSendMessage()}
                      className="text-xs bg-red-600 hover:bg-red-500 text-white font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <RefreshCw size={12} />
                      Retry
                    </button>
                  </div>
                )}

                <div ref={chatBottomRef} />
              </div>

              {/* Input Bar */}
              <div className="no-drag p-3 bg-gray-900/80 border-t border-gray-800 flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                  placeholder={`Consult Rama... (Context synced with ${userMoniker.split(' ')[0]})`}
                  className="flex-1 bg-gray-950 border border-gray-800 focus:border-emerald-500 text-xs text-white placeholder-gray-500 rounded-xl px-3.5 py-2.5 outline-none transition-all disabled:opacity-50 font-sans"
                />
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!input.trim() || isLoading}
                  className="p-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-gray-950 font-bold rounded-xl transition-all flex items-center justify-center shrink-0"
                >
                  <Send size={15} />
                </button>
              </div>
            </>
          )}

          {/* TAB 2: CHAT CONTEXT MANAGEMENT & HISTORY */}
          {activeTab === 'history' && (
            <div className="no-drag flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar flex flex-col">

              {/* User Identity Card */}
              <div className="bg-gray-900/70 border border-gray-800/80 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-xs">
                      {userMoniker.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white leading-tight">{userMoniker}</h4>
                      <p className="text-[10px] text-gray-400 font-mono">{userEmail}</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30 font-bold">
                    {lockdownState.active ? 'LOCKDOWN ACTIVE' : 'SYSTEM READY'}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between text-[10px] text-gray-400 font-mono">
                  <span>{sessions.length} THREADS RECORDED</span>
                  <span>{messages.length} ACTIVE MESSAGES</span>
                </div>
              </div>

              {/* Continuous Rolling Interaction Awareness */}
              <div className="bg-gray-900/40 border border-emerald-500/20 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                    <Brain size={13} />
                    <span>AI Rolling Interaction Awareness</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleUpdateRollingSummary}
                    disabled={isUpdatingRollingSummary}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 disabled:opacity-50"
                  >
                    {isUpdatingRollingSummary ? (
                      <Loader2 size={11} className="animate-spin" />
                    ) : (
                      <RefreshCw size={11} />
                    )}
                    <span>Re-synthesize</span>
                  </button>
                </div>
                <p className="text-[11px] text-gray-300 leading-relaxed font-mono whitespace-pre-wrap bg-gray-950/70 p-2.5 rounded-xl border border-gray-800 max-h-32 overflow-y-auto custom-scrollbar">
                  {rollingSummary}
                </p>
                <p className="text-[9px] text-gray-500">
                  Rama injects this cumulative memory into every turn so advice builds on past sessions.
                </p>
              </div>

              {/* Sessions List Header */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                  <Layers size={13} className="text-emerald-400" />
                  <span>Conversation History ({sessions.length})</span>
                </span>
                <button
                  type="button"
                  onClick={handleCreateNewSession}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-gray-950 font-bold rounded-lg text-xs flex items-center gap-1 transition-all"
                >
                  <Plus size={12} />
                  <span>New Session</span>
                </button>
              </div>

              {/* Sessions List */}
              <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                {sessions.map((sess) => {
                  const isActive = sess.id === activeSessionId;
                  const dateStr = new Date(sess.createdAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric'
                  });

                  return (
                    <div
                      key={sess.id}
                      onClick={() => handleSelectSession(sess.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-950/30 border-emerald-500/50 shadow-md'
                          : 'bg-gray-900/60 border-gray-800 hover:border-gray-700 hover:bg-gray-900'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            {isActive && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                            )}
                            <h5 className="text-xs font-bold text-white truncate">{sess.title}</h5>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400 font-mono">
                            <span className="flex items-center gap-1">
                              <Calendar size={10} />
                              {dateStr}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MessageSquare size={10} />
                              {sess.messages.length} msgs
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div
                          className="flex items-center gap-1 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => handleGenerateSummary(sess)}
                            title="View / Synthesize Summary"
                            className="p-1.5 text-gray-400 hover:text-emerald-400 hover:bg-gray-800 rounded-lg transition-colors"
                          >
                            <Sparkles size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteSession(sess.id, e)}
                            title="Delete Session"
                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {sess.summary && (
                        <div className="mt-2 p-2 bg-gray-950/60 border border-gray-800/80 rounded-xl text-[10px] text-gray-300 font-mono line-clamp-2">
                          {sess.summary.replace(/#+/g, '').slice(0, 140)}...
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: MEMORY VAULT */}
          {activeTab === 'memory' && (
            <div className="no-drag flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar flex flex-col">
              <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-3.5 space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <Brain size={14} />
                  <span>Rama Persistent Memory Vault</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  These memory anchors persist across all sessions. Rama automatically takes these into account when advising {userMoniker}.
                </p>
              </div>

              {/* Add Memory Node */}
              <form onSubmit={addMemoryItem} className="flex gap-2">
                <input
                  value={newMemoryInput}
                  onChange={(e) => setNewMemoryInput(e.target.value)}
                  placeholder="Record new memory anchor for Rama..."
                  className="flex-1 bg-gray-950 border border-gray-800 focus:border-emerald-500 text-xs text-white placeholder-gray-500 rounded-xl px-3.5 py-2 outline-none"
                />
                <button
                  type="submit"
                  disabled={!newMemoryInput.trim()}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-gray-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-1"
                >
                  <Plus size={14} />
                  <span>Add</span>
                </button>
              </form>

              {/* Memory List */}
              <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                {memories.map((mem, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-900/80 border border-gray-800/80 hover:border-emerald-500/30 rounded-xl flex items-start justify-between gap-3 text-xs text-gray-200 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <Bookmark size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{mem}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMemoryItem(index)}
                      className="text-gray-500 hover:text-red-400 p-1 rounded transition-colors shrink-0"
                      title="Delete memory anchor"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-gray-800 flex items-center justify-between text-[10px] text-gray-500 font-mono">
                <span>{memories.length} ACTIVE MEMORY ANCHORS</span>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Reset all Rama memories to default?')) {
                      localStorage.removeItem(MEMORY_STORAGE_KEY);
                      window.location.reload();
                    }
                  }}
                  className="hover:text-red-400 transition-colors"
                >
                  Reset Vault
                </button>
              </div>
            </div>
          )}

          {/* SUMMARY MODAL DIALOG */}
          {showSummaryModal && (
            <div className="no-drag absolute inset-0 bg-gray-950/98 backdrop-blur-2xl z-50 flex flex-col p-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-emerald-400" />
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-white">
                      Executive Summary & Briefing
                    </h4>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {activeSession.title}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSummaryModal(false)}
                  className="p-1.5 text-gray-400 hover:text-white rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-3 text-xs leading-relaxed text-gray-300 font-mono whitespace-pre-wrap custom-scrollbar select-text">
                {isGeneratingSummary ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-emerald-400">
                    <Loader2 size={22} className="animate-spin" />
                    <span className="text-xs font-sans">Compiling executive briefing directives...</span>
                  </div>
                ) : (
                  summaryText
                )}
              </div>

              {/* Summary Action Bar */}
              <div className="pt-3 border-t border-gray-800 flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Copy to Clipboard */}
                    <button
                      type="button"
                      onClick={handleExportSummaryClipboard}
                      className="px-2.5 py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl text-xs font-bold text-gray-200 flex items-center gap-1.5 transition-colors"
                    >
                      <Copy size={13} />
                      <span>Copy</span>
                    </button>

                    {/* Download PDF */}
                    <button
                      type="button"
                      onClick={handleExportSummaryPdf}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-black text-gray-950 flex items-center gap-1.5 transition-colors"
                    >
                      <Printer size={13} />
                      <span>Save as PDF (.pdf)</span>
                    </button>

                    {/* Download Markdown */}
                    <button
                      type="button"
                      onClick={() => handleExportSummaryFile('md')}
                      className="px-2.5 py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl text-xs font-bold text-gray-200 flex items-center gap-1.5 transition-colors"
                    >
                      <FileDown size={13} />
                      <span>Markdown (.md)</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Share to WhatsApp */}
                    <button
                      type="button"
                      onClick={() => handleShareToWhatsApp(summaryText)}
                      className="px-2.5 py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl text-xs font-bold text-emerald-400 flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink size={13} />
                      <span>WhatsApp</span>
                    </button>

                    {/* Share via Email */}
                    <button
                      type="button"
                      onClick={handleExportSummaryEmail}
                      className="px-2.5 py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl text-xs font-bold text-gray-200 flex items-center gap-1.5 transition-colors"
                    >
                      <Mail size={13} />
                      <span>Email</span>
                    </button>

                    {/* Socials / External Share */}
                    <button
                      type="button"
                      onClick={() => handleNativeShare(summaryText)}
                      className="px-2.5 py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl text-xs font-bold text-gray-200 flex items-center gap-1.5 transition-colors"
                    >
                      <Share2 size={13} />
                      <span>Share</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SHARE EXTERNAL LINKS MODAL */}
          {showShareModal && (
            <div className="no-drag absolute inset-0 bg-gray-950/98 backdrop-blur-2xl z-50 flex flex-col p-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <Share2 size={16} className="text-emerald-400" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-white">
                    Share Workspace & Consultation
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="p-1.5 text-gray-400 hover:text-white rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 py-4 space-y-4 text-xs">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                    Direct Deep-Link URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={ChatContextManager.getShareableLink(activeSessionId)}
                      className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono text-[11px]"
                    />
                    <button
                      type="button"
                      onClick={handleCopyShareableLink}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-gray-950 font-bold rounded-xl text-xs transition-colors shrink-0"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                    Fast External Channels
                  </span>

                  <button
                    type="button"
                    onClick={() => handleShareToWhatsApp()}
                    className="w-full p-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl text-emerald-400 font-bold flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <ExternalLink size={14} /> WhatsApp Direct Message
                    </span>
                    <ChevronRight size={14} className="text-gray-500" />
                  </button>

                  <button
                    type="button"
                    onClick={handleExportSummaryEmail}
                    className="w-full p-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl text-gray-200 font-bold flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Mail size={14} /> Dispatch via Email
                    </span>
                    <ChevronRight size={14} className="text-gray-500" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const text = `Cymatic Discipline OS // Briefing with Rama AI: ${window.location.origin}`;
                      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
                      window.open(twitterUrl, '_blank');
                    }}
                    className="w-full p-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl text-gray-200 font-bold flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Globe size={14} /> Post to X / Social Channels
                    </span>
                    <ChevronRight size={14} className="text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-gray-300 font-bold rounded-xl text-xs transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </Draggable>
  );
}
