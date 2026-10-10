/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * RamaFloatingHub - High-Performance AI Execution Tutor & Memory Vault
 * Powered by ConversationManager: Persistent chat history, periodic summary engine,
 * continuous user identity & multi-session awareness, and complete export menu.
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
  ChevronDown,
  ShieldCheck,
  Printer,
  Sparkle
} from 'lucide-react';
import { DisciplineBridge, SystemLockdownPayload } from '../DisciplineBridge';
import { LocalUserSession } from '../types/session';
import {
  ConversationManager,
  ChatSession,
  Message
} from '../utils/ConversationManager';
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

  // Context Management State via ConversationManager
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    return ConversationManager.loadSessions(userMoniker);
  });
  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return ConversationManager.getActiveSessionId(sessions);
  });

  // Rolling Summary & Ongoing Conversation Context
  const [conversationContext, setConversationContext] = useState<string>(() => {
    return ConversationManager.getConversationContext();
  });
  const [isPeriodicEngineRunning, setIsPeriodicEngineRunning] = useState(false);

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

  // Window Controls - explicit stopPropagation to prevent any drag interference
  const handleClose = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setIsOpen(false);
    if (onClose) onClose();
  };

  const handleToggleMinimize = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setIsMinimized((prev) => !prev);
  };

  // Switch to another session
  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    ConversationManager.setActiveSessionId(sessionId);
    setActiveTab('chat');
    showToast('Session loaded');
  };

  // Start new chat session
  const handleCreateNewSession = () => {
    const { sessions: updated, newSession } = ConversationManager.createNewSession(
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

    const { sessions: updated, nextActiveId } = ConversationManager.deleteSession(
      sessionId,
      sessions,
      userMoniker
    );
    setSessions(updated);
    setActiveSessionId(nextActiveId);
    showToast('Session deleted');
  };

  // Check and run periodic summary engine in the background
  const triggerPeriodicSummaryCheck = useCallback(
    async (currentSess: ChatSession, allSessions: ChatSession[]) => {
      if (!ConversationManager.shouldTriggerPeriodicSummary(currentSess)) {
        return;
      }

      setIsPeriodicEngineRunning(true);
      try {
        const userContext = getSystemSnapshot();
        const result = await ConversationManager.generatePeriodicContext(
          allSessions,
          currentSess,
          userContext
        );

        setConversationContext(result.conversationContext);

        // Update the session's summary and last count
        const updated = ConversationManager.updateSessionSummary(
          currentSess.id,
          result.sessionSummary,
          allSessions
        );
        setSessions(updated);
      } catch (err) {
        console.warn('[Rama] Periodic summary engine error:', err);
      } finally {
        setIsPeriodicEngineRunning(false);
      }
    },
    [getSystemSnapshot]
  );

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
    const updatedSessions = ConversationManager.updateSessionMessages(
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
    const pastSessionsContext = ConversationManager.generatePastSessionsOverview(
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
          rollingSummary: conversationContext,
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
      const finalizedSessions = ConversationManager.updateSessionMessages(
        activeSessionId,
        finalMessages,
        updatedSessions
      );
      setSessions(finalizedSessions);

      // Check if periodic summary should trigger after this exchange
      const updatedCurrentSession = finalizedSessions.find((s) => s.id === activeSessionId) || {
        ...activeSession,
        messages: finalMessages
      };
      triggerPeriodicSummaryCheck(updatedCurrentSession, finalizedSessions);
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

      // Attach summary to session via ConversationManager
      const updated = ConversationManager.updateSessionSummary(
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

      const updated = ConversationManager.updateSessionSummary(
        sessionToSummarize.id,
        fallback,
        sessions
      );
      setSessions(updated);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Re-synthesize continuous conversation context manually
  const handleUpdateConversationContext = async () => {
    setIsPeriodicEngineRunning(true);
    showToast('Re-synthesizing AI continuous awareness...');

    const userContext = getSystemSnapshot();
    try {
      const result = await ConversationManager.generatePeriodicContext(
        sessions,
        activeSession,
        userContext
      );
      setConversationContext(result.conversationContext);
      showToast('AI conversation context updated across all sessions');
    } catch (err) {
      console.error('[Rama] Conversation context error:', err);
      showToast('Awareness update fallback retained');
    } finally {
      setIsPeriodicEngineRunning(false);
    }
  };

  // Export Summary: Clipboard
  const handleExportSummaryClipboard = async () => {
    const textToCopy = summaryText || conversationContext;
    const success = await ConversationManager.exportToClipboard(textToCopy);
    if (success) {
      showToast('Summary copied to clipboard');
    } else {
      showToast('Failed to copy summary');
    }
  };

  // Export Summary: Email
  const handleExportSummaryEmail = () => {
    const textToSend = summaryText || conversationContext;
    ConversationManager.exportToEmail(textToSend, userMoniker);
    showToast('Opening email client...');
  };

  // Export Summary: PDF (A4 styled document via jsPDF)
  const handleExportSummaryPdf = () => {
    try {
      exportSummaryAsPdf({
        title: `Rama Executive Briefing // ${activeSession.title}`,
        summaryText: summaryText || conversationContext || 'No summary text available.',
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
    ConversationManager.exportToFile(summaryText || conversationContext, filename, mime);
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
    ConversationManager.exportToFile(
      content,
      `Cymatic_Rama_Chat_${dateStr}.${format}`,
      mimeMap[format]
    );
    showToast(`Saved Chat Transcript (${format.toUpperCase()})`);
  };

  // WhatsApp Share
  const handleShareToWhatsApp = (text?: string) => {
    setShowExportMenu(false);
    const shareContent = text || summaryText || conversationContext || getFullChatText('txt').slice(0, 1800);
    const url = ConversationManager.getWhatsAppShareUrl(shareContent);
    window.open(url, '_blank');
  };

  // Native Web Share or Modal Fallback
  const handleNativeShare = async (text?: string, title?: string) => {
    setShowExportMenu(false);
    const content = text || summaryText || conversationContext || getFullChatText('txt').slice(0, 1500);
    const shareTitle = title || `Cymatic OS - Rama Briefing for ${userMoniker}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: content,
          url: ConversationManager.getShareableLink(activeSessionId)
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
    const link = ConversationManager.getShareableLink(activeSessionId);
    const success = await ConversationManager.exportToClipboard(link);
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
          <div className="bg-gray-950/95 backdrop-blur-2xl border border-emerald-500/40 rounded-full px-4 py-2.5 shadow-2xl flex items-center gap-3 animate-in zoom-in-95 select-none hover:border-emerald-400/70 transition-all">
            {/* Draggable Grip Portion */}
            <div className="min-handle flex items-center gap-2 cursor-grab active:cursor-grabbing">
              <GripHorizontal size={14} className="text-gray-600 shrink-0 pointer-events-none" />

              <div className="flex items-center gap-2 pointer-events-none">
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
            </div>

            {/* Window Controls (Outside Draggable Handle) */}
            <div
              className="no-drag flex items-center gap-1 ml-2 border-l border-gray-800 pl-2 cursor-default"
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={handleToggleMinimize}
                title="Expand Rama AI Hub"
                className="p-1.5 text-gray-400 hover:text-emerald-400 hover:bg-gray-900 rounded-lg transition-colors cursor-pointer"
              >
                <Maximize2 size={15} className="pointer-events-none" />
              </button>
              <button
                type="button"
                onClick={handleClose}
                title="Close Rama AI Hub"
                className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-900 rounded-lg transition-colors cursor-pointer"
              >
                <X size={15} className="pointer-events-none" />
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
        <div className="w-[95vw] sm:w-[480px] h-[85vh] sm:h-[570px] bg-gray-950/98 backdrop-blur-3xl border border-emerald-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

          {/* HEADER: Split into Draggable Grip Area + Non-Draggable Controls */}
          <div className="p-3 sm:p-3.5 bg-gray-900/90 border-b border-gray-800/80 flex items-center justify-between select-none">
            {/* Draggable Grip Portion */}
            <div className="handle flex-1 flex items-center gap-2 cursor-grab active:cursor-grabbing min-w-0 pr-2">
              <GripHorizontal size={16} className="text-gray-600 shrink-0 pointer-events-none" />
              <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 shrink-0 pointer-events-none">
                <Sparkles size={14} className="text-emerald-400" />
              </div>
              <div className="min-w-0 pointer-events-none">
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5 truncate">
                  Rama AI Hub
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 shrink-0">
                    {lockdownState.active ? 'LOCKDOWN ON' : 'STANDBY'}
                  </span>
                </h3>
                <span className="text-[10px] text-gray-400 truncate max-w-[150px] sm:max-w-[210px] block font-medium">
                  {userMoniker}
                </span>
              </div>
            </div>

            {/* Non-Draggable Controls Container */}
            <div
              className="no-drag flex items-center gap-1 shrink-0 cursor-default"
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {/* Tab Switcher: Chat, History & Context, Memory Vault */}
              <div className="flex items-center bg-gray-950 p-0.5 rounded-lg border border-gray-800 mr-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('chat')}
                  title="Chat Console"
                  className={`px-2 py-1 text-[10px] font-bold rounded cursor-pointer ${
                    activeTab === 'chat'
                      ? 'bg-emerald-600 text-gray-950 font-black'
                      : 'text-gray-400 hover:text-white'
                  } transition-colors`}
                >
                  Chat
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  title="History & Context Manager"
                  className={`px-2 py-1 text-[10px] font-bold rounded flex items-center gap-1 cursor-pointer ${
                    activeTab === 'history'
                      ? 'bg-emerald-600 text-gray-950 font-black'
                      : 'text-gray-400 hover:text-white'
                  } transition-colors`}
                >
                  <History size={11} className="pointer-events-none" />
                  <span>{sessions.length}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('memory')}
                  title="Memory Vault"
                  className={`px-2 py-1 text-[10px] font-bold rounded flex items-center gap-1 cursor-pointer ${
                    activeTab === 'memory'
                      ? 'bg-emerald-600 text-gray-950 font-black'
                      : 'text-gray-400 hover:text-white'
                  } transition-colors`}
                >
                  <Brain size={11} className="pointer-events-none" />
                  <span>{memories.length}</span>
                </button>
              </div>

              {/* DEDICATED EXPORT MENU DROPDOWN */}
              <div className="relative" ref={exportDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowExportMenu((prev) => !prev)}
                  title="Open Export & Sharing Menu"
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                    showExportMenu
                      ? 'bg-emerald-600 text-gray-950 border-emerald-500'
                      : 'bg-gray-800/80 hover:bg-gray-800 text-gray-200 hover:text-white border-gray-700'
                  }`}
                >
                  <FileDown size={13} className="pointer-events-none" />
                  <span>Export</span>
                  <ChevronDown size={11} className={`pointer-events-none transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                </button>

                {showExportMenu && (
                  <div
                    className="absolute right-0 mt-2 w-64 bg-gray-950 border border-emerald-500/40 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 text-xs select-none"
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <div className="px-2.5 py-1.5 border-b border-gray-800 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                        Export & Multi-Channel
                      </span>
                      <span className="text-[9px] font-mono text-gray-500">v2.0</span>
                    </div>

                    {/* Section 1: Summaries */}
                    <div className="pt-1.5 pb-1 text-[9px] font-black uppercase tracking-wider text-gray-500 px-2.5">
                      Executive Summaries
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowExportMenu(false);
                        handleGenerateSummary();
                      }}
                      className="w-full text-left px-2.5 py-1.5 hover:bg-gray-900 rounded-xl text-gray-200 hover:text-emerald-400 flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <Sparkles size={13} className="text-emerald-400 shrink-0 pointer-events-none" />
                      <span>Synthesize Executive Briefing</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowExportMenu(false);
                        handleExportSummaryPdf();
                      }}
                      className="w-full text-left px-2.5 py-1.5 hover:bg-gray-900 rounded-xl text-emerald-400 hover:text-emerald-300 flex items-center gap-2 font-bold cursor-pointer"
                    >
                      <Printer size={13} className="text-emerald-400 shrink-0 pointer-events-none" />
                      <span>Download Summary as PDF (.pdf)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowExportMenu(false);
                        handleExportSummaryFile('md');
                      }}
                      className="w-full text-left px-2.5 py-1.5 hover:bg-gray-900 rounded-xl text-gray-200 hover:text-emerald-400 flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <FileDown size={13} className="text-gray-400 shrink-0 pointer-events-none" />
                      <span>Download Summary (.md)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowExportMenu(false);
                        handleExportSummaryFile('txt');
                      }}
                      className="w-full text-left px-2.5 py-1.5 hover:bg-gray-900 rounded-xl text-gray-200 hover:text-emerald-400 flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <FileText size={13} className="text-gray-400 shrink-0 pointer-events-none" />
                      <span>Download Summary as Text (.txt)</span>
                    </button>

                    {/* Section 2: Full Transcripts */}
                    <div className="pt-2 pb-1 text-[9px] font-black uppercase tracking-wider text-gray-500 px-2.5 border-t border-gray-800/80 mt-1">
                      Full Conversation Logs
                    </div>

                    <button
                      type="button"
                      onClick={() => handleExportFullChat('md')}
                      className="w-full text-left px-2.5 py-1.5 hover:bg-gray-900 rounded-xl text-gray-300 hover:text-emerald-400 flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <FileCheck size={13} className="text-gray-400 shrink-0 pointer-events-none" />
                      <span>Export Transcript (.md)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExportFullChat('txt')}
                      className="w-full text-left px-2.5 py-1.5 hover:bg-gray-900 rounded-xl text-gray-300 hover:text-emerald-400 flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <FileText size={13} className="text-gray-400 shrink-0 pointer-events-none" />
                      <span>Save Full Log (.txt)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExportFullChat('json')}
                      className="w-full text-left px-2.5 py-1.5 hover:bg-gray-900 rounded-xl text-gray-300 hover:text-emerald-400 flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <Download size={13} className="text-gray-400 shrink-0 pointer-events-none" />
                      <span>Export JSON Database</span>
                    </button>

                    {/* Section 3: Social & External Channels */}
                    <div className="pt-2 pb-1 text-[9px] font-black uppercase tracking-wider text-gray-500 px-2.5 border-t border-gray-800/80 mt-1">
                      External Sharing & Socials
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowExportMenu(false);
                        handleExportSummaryClipboard();
                      }}
                      className="w-full text-left px-2.5 py-1.5 hover:bg-gray-900 rounded-xl text-gray-200 hover:text-emerald-400 flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <Copy size={13} className="text-gray-400 shrink-0 pointer-events-none" />
                      <span>Copy Summary to Clipboard</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleShareToWhatsApp()}
                      className="w-full text-left px-2.5 py-1.5 hover:bg-gray-900 rounded-xl text-emerald-400 hover:text-emerald-300 flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <ExternalLink size={13} className="shrink-0 pointer-events-none" />
                      <span>Share to WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowExportMenu(false);
                        handleExportSummaryEmail();
                      }}
                      className="w-full text-left px-2.5 py-1.5 hover:bg-gray-900 rounded-xl text-gray-200 hover:text-emerald-400 flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <Mail size={13} className="text-gray-400 shrink-0 pointer-events-none" />
                      <span>Dispatch via Email</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleNativeShare()}
                      className="w-full text-left px-2.5 py-1.5 hover:bg-gray-900 rounded-xl text-gray-200 hover:text-emerald-400 flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <Share2 size={13} className="text-gray-400 shrink-0 pointer-events-none" />
                      <span>Share Links Externally</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyShareableLink}
                      className="w-full text-left px-2.5 py-1.5 hover:bg-gray-900 rounded-xl text-gray-200 hover:text-emerald-400 flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <Globe size={13} className="text-gray-400 shrink-0 pointer-events-none" />
                      <span>Copy Web Launch Deep-Link</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Minimize Button */}
              <button
                type="button"
                onClick={handleToggleMinimize}
                title="Minimize Rama AI Hub"
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
              >
                <Minus size={15} className="pointer-events-none" />
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={handleClose}
                title="Close Rama AI Hub"
                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
              >
                <X size={15} className="pointer-events-none" />
              </button>
            </div>
          </div>

          {/* TOAST FEEDBACK BANNER */}
          {toastMessage && (
            <div className="bg-emerald-950/90 border-b border-emerald-500/40 text-emerald-300 text-[11px] font-bold px-4 py-1.5 text-center flex items-center justify-center gap-2 animate-in fade-in select-none">
              <Check size={12} className="text-emerald-400 pointer-events-none" />
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
                  <span className="text-xs font-bold text-gray-200 truncate max-w-[130px] sm:max-w-[180px]">
                    {activeSession.title}
                  </span>
                  {isPeriodicEngineRunning && (
                    <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-1 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      <Loader2 size={9} className="animate-spin" />
                      Syncing
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleGenerateSummary()}
                    title="Synthesize Executive Briefing"
                    className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles size={11} className="pointer-events-none" />
                    <span>Summary</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportSummaryPdf}
                    title="Quick Download PDF Summary"
                    className="px-2 py-1 text-[10px] font-bold bg-gray-900 hover:bg-gray-800 text-emerald-400 border border-emerald-500/30 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Printer size={11} className="pointer-events-none" />
                    <span>PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCreateNewSession}
                    title="Start New Thread"
                    className="px-2 py-1 text-[10px] font-bold bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-800 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={11} className="pointer-events-none" />
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
                      <div className="whitespace-pre-wrap select-text">{m.text}</div>

                      {/* Per-Message Share & Copy Actions on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-6 right-0 flex items-center gap-1 bg-gray-900 border border-gray-800 rounded-lg px-1.5 py-0.5 shadow-lg z-10 select-none">
                        <button
                          type="button"
                          onClick={() => {
                            ConversationManager.exportToClipboard(m.text);
                            showToast('Message copied');
                          }}
                          title="Copy text"
                          className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer"
                        >
                          <Copy size={11} className="pointer-events-none" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleShareToWhatsApp(m.text)}
                          title="Share to WhatsApp"
                          className="p-1 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                        >
                          <ExternalLink size={11} className="pointer-events-none" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleNativeShare(m.text)}
                          title="Share message"
                          className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer"
                        >
                          <Share2 size={11} className="pointer-events-none" />
                        </button>
                      </div>
                    </div>
                    <span className="text-[9px] text-gray-600 px-1 mt-1 font-mono">{m.timestamp}</span>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono p-2">
                    <Loader2 size={14} className="animate-spin pointer-events-none" />
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
                      className="text-xs bg-red-600 hover:bg-red-500 text-white font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw size={12} className="pointer-events-none" />
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
                  className="p-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-gray-950 font-bold rounded-xl transition-all flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <Send size={15} className="pointer-events-none" />
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

              {/* Periodic Conversation Context Engine */}
              <div className="bg-gray-900/40 border border-emerald-500/20 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                    <Brain size={13} className="pointer-events-none" />
                    <span>Periodic Summary & Context Engine</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleUpdateConversationContext}
                    disabled={isPeriodicEngineRunning}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                  >
                    {isPeriodicEngineRunning ? (
                      <Loader2 size={11} className="animate-spin pointer-events-none" />
                    ) : (
                      <RefreshCw size={11} className="pointer-events-none" />
                    )}
                    <span>Synthesize Context Now</span>
                  </button>
                </div>
                <p className="text-[11px] text-gray-300 leading-relaxed font-mono whitespace-pre-wrap bg-gray-950/70 p-2.5 rounded-xl border border-gray-800 max-h-32 overflow-y-auto custom-scrollbar select-text">
                  {conversationContext}
                </p>
                <div className="flex items-center justify-between text-[9px] text-gray-500">
                  <span>Auto-updates every 4 messages to preserve user identity & goals</span>
                  <button
                    type="button"
                    onClick={() => {
                      ConversationManager.exportToClipboard(conversationContext);
                      showToast('Context copied to clipboard');
                    }}
                    className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Copy size={10} className="pointer-events-none" /> Copy Context
                  </button>
                </div>
              </div>

              {/* Sessions List Header */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                  <Layers size={13} className="text-emerald-400 pointer-events-none" />
                  <span>Conversation History ({sessions.length})</span>
                </span>
                <button
                  type="button"
                  onClick={handleCreateNewSession}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-gray-950 font-bold rounded-lg text-xs flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Plus size={12} className="pointer-events-none" />
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
                              <Calendar size={10} className="pointer-events-none" />
                              {dateStr}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MessageSquare size={10} className="pointer-events-none" />
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
                            className="p-1.5 text-gray-400 hover:text-emerald-400 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Sparkles size={13} className="pointer-events-none" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteSession(sess.id, e)}
                            title="Delete Session"
                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 size={13} className="pointer-events-none" />
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
                  <Brain size={14} className="pointer-events-none" />
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
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-gray-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={14} className="pointer-events-none" />
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
                      <Bookmark size={13} className="text-emerald-400 shrink-0 mt-0.5 pointer-events-none" />
                      <span className="leading-snug select-text">{mem}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMemoryItem(index)}
                      className="text-gray-500 hover:text-red-400 p-1 rounded transition-colors shrink-0 cursor-pointer"
                      title="Delete memory anchor"
                    >
                      <Trash2 size={13} className="pointer-events-none" />
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
                  className="hover:text-red-400 transition-colors cursor-pointer"
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
                  <Sparkles size={16} className="text-emerald-400 pointer-events-none" />
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
                  className="p-1.5 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X size={16} className="pointer-events-none" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-3 text-xs leading-relaxed text-gray-300 font-mono whitespace-pre-wrap custom-scrollbar select-text">
                {isGeneratingSummary ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-emerald-400">
                    <Loader2 size={22} className="animate-spin pointer-events-none" />
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
                      className="px-2.5 py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl text-xs font-bold text-gray-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Copy size={13} className="pointer-events-none" />
                      <span>Copy</span>
                    </button>

                    {/* Download PDF */}
                    <button
                      type="button"
                      onClick={handleExportSummaryPdf}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-black text-gray-950 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Printer size={13} className="pointer-events-none" />
                      <span>Save as PDF (.pdf)</span>
                    </button>

                    {/* Download Markdown */}
                    <button
                      type="button"
                      onClick={() => handleExportSummaryFile('md')}
                      className="px-2.5 py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl text-xs font-bold text-gray-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FileDown size={13} className="pointer-events-none" />
                      <span>Markdown (.md)</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Share to WhatsApp */}
                    <button
                      type="button"
                      onClick={() => handleShareToWhatsApp(summaryText)}
                      className="px-2.5 py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl text-xs font-bold text-emerald-400 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ExternalLink size={13} className="pointer-events-none" />
                      <span>WhatsApp</span>
                    </button>

                    {/* Share via Email */}
                    <button
                      type="button"
                      onClick={handleExportSummaryEmail}
                      className="px-2.5 py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl text-xs font-bold text-gray-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Mail size={13} className="pointer-events-none" />
                      <span>Email</span>
                    </button>

                    {/* Socials / External Share */}
                    <button
                      type="button"
                      onClick={() => handleNativeShare(summaryText)}
                      className="px-2.5 py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl text-xs font-bold text-gray-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Share2 size={13} className="pointer-events-none" />
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
                  <Share2 size={16} className="text-emerald-400 pointer-events-none" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-white">
                    Share Workspace & Consultation
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="p-1.5 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X size={16} className="pointer-events-none" />
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
                      value={ConversationManager.getShareableLink(activeSessionId)}
                      className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono text-[11px]"
                    />
                    <button
                      type="button"
                      onClick={handleCopyShareableLink}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-gray-950 font-bold rounded-xl text-xs transition-colors shrink-0 cursor-pointer"
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
                    className="w-full p-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl text-emerald-400 font-bold flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <ExternalLink size={14} className="pointer-events-none" /> WhatsApp Direct Message
                    </span>
                    <ChevronRight size={14} className="text-gray-500 pointer-events-none" />
                  </button>

                  <button
                    type="button"
                    onClick={handleExportSummaryEmail}
                    className="w-full p-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl text-gray-200 font-bold flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Mail size={14} className="pointer-events-none" /> Dispatch via Email
                    </span>
                    <ChevronRight size={14} className="text-gray-500 pointer-events-none" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const text = `Cymatic Discipline OS // Briefing with Rama AI: ${window.location.origin}`;
                      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
                      window.open(twitterUrl, '_blank');
                    }}
                    className="w-full p-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl text-gray-200 font-bold flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Globe size={14} className="pointer-events-none" /> Post to X / Social Channels
                    </span>
                    <ChevronRight size={14} className="text-gray-500 pointer-events-none" />
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-gray-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
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
