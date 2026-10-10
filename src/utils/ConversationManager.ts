/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ConversationManager - Persistent Chat History & Periodic Summary Engine for Rama AI
 * Cymatic Discipline OS
 */

import { exportSummaryAsPdf } from './pdfExport';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  summary?: string;
  userMoniker?: string;
  userEmail?: string;
  keyDirectives?: string[];
  lastSummaryMsgCount?: number;
  lastSummaryTimestamp?: string;
  pinned?: boolean;
}

export interface UserIdentityProfile {
  moniker: string;
  email: string;
  role: string;
  primaryDirectives: string[];
  totalSessionsCount: number;
  totalMessagesCount: number;
}

// LocalStorage Persistence Keys
const STORAGE_SESSIONS = 'cymatic_rama_chat_sessions_v2';
const STORAGE_ACTIVE_ID = 'cymatic_rama_active_session_id_v2';
const STORAGE_CONVERSATION_CONTEXT = 'cymatic_rama_conversation_context_v2';
const STORAGE_ROLLING_SUMMARY = 'cymatic_rama_rolling_summary_v1';
const STORAGE_LEGACY_CHAT = 'cymatic_rama_chat_v1';
const STORAGE_USER_PROFILE = 'cymatic_rama_user_profile_v1';

// Periodic summary interval threshold (every N messages)
const PERIODIC_SUMMARY_INTERVAL = 4;

export const ConversationManager = {
  /**
   * Load all chat sessions from localStorage with backward-compatible migrations
   */
  loadSessions(defaultMoniker: string = 'Isabirye Latif (Solo Architect)'): ChatSession[] {
    try {
      const stored = localStorage.getItem(STORAGE_SESSIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }

      // Check legacy single-session chat
      const legacyChat = localStorage.getItem(STORAGE_LEGACY_CHAT);
      if (legacyChat) {
        const parsedLegacy = JSON.parse(legacyChat);
        if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
          const migratedSession: ChatSession = {
            id: `session-migrated-${Date.now()}`,
            title: 'Initial Consultation Log',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messages: parsedLegacy,
            userMoniker: defaultMoniker,
            lastSummaryMsgCount: parsedLegacy.length
          };
          const initialSessions = [migratedSession];
          this.saveSessions(initialSessions);
          this.setActiveSessionId(migratedSession.id);
          return initialSessions;
        }
      }
    } catch (e) {
      console.error('[ConversationManager] Failed to load sessions:', e);
    }

    // Default inaugural session
    const defaultSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: 'Operational Genesis',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userMoniker: defaultMoniker,
      lastSummaryMsgCount: 1,
      messages: [
        {
          id: 'init-1',
          role: 'assistant',
          text: `Rama online. Operating system awareness synchronized with ${defaultMoniker}. I maintain long-term memory of our past interactions, system lockdown rules, and spiritual commitments. How can we sharpen your focus today?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };

    const initialSessions = [defaultSession];
    this.saveSessions(initialSessions);
    this.setActiveSessionId(defaultSession.id);
    return initialSessions;
  },

  /**
   * Persist all sessions to localStorage
   */
  saveSessions(sessions: ChatSession[]): void {
    try {
      localStorage.setItem(STORAGE_SESSIONS, JSON.stringify(sessions));
    } catch (e) {
      console.error('[ConversationManager] Failed to save sessions:', e);
    }
  },

  /**
   * Get active session ID
   */
  getActiveSessionId(sessions: ChatSession[]): string {
    const activeId = localStorage.getItem(STORAGE_ACTIVE_ID);
    if (activeId && sessions.some((s) => s.id === activeId)) {
      return activeId;
    }
    const fallbackId = sessions[0]?.id || `session-${Date.now()}`;
    this.setActiveSessionId(fallbackId);
    return fallbackId;
  },

  /**
   * Set active session ID
   */
  setActiveSessionId(id: string): void {
    try {
      localStorage.setItem(STORAGE_ACTIVE_ID, id);
    } catch (e) {
      console.error('[ConversationManager] Failed to set active session ID:', e);
    }
  },

  /**
   * Create a new session and prepend to history
   */
  createNewSession(
    moniker: string = 'Isabirye Latif',
    existingSessions: ChatSession[]
  ): { sessions: ChatSession[]; newSession: ChatSession } {
    const sessionNumber = existingSessions.length + 1;
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: `Focus Session ${sessionNumber}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userMoniker: moniker,
      lastSummaryMsgCount: 1,
      messages: [
        {
          id: `init-${Date.now()}`,
          role: 'assistant',
          text: `Focus session #${sessionNumber} initiated with ${moniker}. Rama maintains continuous awareness of your ongoing directives and past sessions. What is our target?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };

    const updated = [newSession, ...existingSessions];
    this.saveSessions(updated);
    this.setActiveSessionId(newSession.id);
    return { sessions: updated, newSession };
  },

  /**
   * Delete a session
   */
  deleteSession(
    sessionId: string,
    existingSessions: ChatSession[],
    moniker: string = 'Isabirye Latif'
  ): { sessions: ChatSession[]; nextActiveId: string } {
    const filtered = existingSessions.filter((s) => s.id !== sessionId);

    if (filtered.length === 0) {
      const reset = this.createNewSession(moniker, []);
      return { sessions: reset.sessions, nextActiveId: reset.newSession.id };
    }

    this.saveSessions(filtered);
    const nextActiveId = filtered[0].id;
    this.setActiveSessionId(nextActiveId);
    return { sessions: filtered, nextActiveId };
  },

  /**
   * Update messages in session and optionally auto-title
   */
  updateSessionMessages(
    sessionId: string,
    messages: Message[],
    sessions: ChatSession[]
  ): ChatSession[] {
    const updated = sessions.map((sess) => {
      if (sess.id !== sessionId) return sess;

      let title = sess.title;
      // Auto-title on first real user message if default title
      if (title.startsWith('Focus Session') || title === 'Operational Genesis') {
        const firstUser = messages.find((m) => m.role === 'user');
        if (firstUser && firstUser.text) {
          title = firstUser.text.slice(0, 32).trim() + (firstUser.text.length > 32 ? '...' : '');
        }
      }

      return {
        ...sess,
        title,
        messages,
        updatedAt: new Date().toISOString()
      };
    });

    this.saveSessions(updated);
    return updated;
  },

  /**
   * Update session summary
   */
  updateSessionSummary(
    sessionId: string,
    summary: string,
    sessions: ChatSession[]
  ): ChatSession[] {
    const updated = sessions.map((sess) => {
      if (sess.id !== sessionId) return sess;
      return {
        ...sess,
        summary,
        lastSummaryMsgCount: sess.messages.length,
        lastSummaryTimestamp: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });

    this.saveSessions(updated);
    return updated;
  },

  /**
   * Retrieve the concise ongoing 'Conversation Context' used for AI awareness
   */
  getConversationContext(): string {
    try {
      const stored = localStorage.getItem(STORAGE_CONVERSATION_CONTEXT);
      if (stored) return stored;
      const rolling = localStorage.getItem(STORAGE_ROLLING_SUMMARY);
      if (rolling) return rolling;
    } catch {
      // Ignore
    }
    return `[Architect Trajectory & User Identity]:
- Architect: Isabirye Latif (Solo Architect).
- Core Discipline: Universal Cymatic Hub execution, strict phone/app lockdown during focus.
- Spiritual Anchors: 5 daily prayers, 15m post-prayer centering, workspace order.
- Trajectory: High-performance software engineering and uninterrupted execution.`;
  },

  /**
   * Save the concise ongoing Conversation Context
   */
  saveConversationContext(context: string): void {
    try {
      localStorage.setItem(STORAGE_CONVERSATION_CONTEXT, context);
      localStorage.setItem(STORAGE_ROLLING_SUMMARY, context);
    } catch (e) {
      console.error('[ConversationManager] Failed to save conversation context:', e);
    }
  },

  /**
   * Generate an overview of past sessions to inject into prompt
   */
  generatePastSessionsOverview(sessions: ChatSession[], currentSessionId: string): string {
    const past = sessions.filter((s) => s.id !== currentSessionId);
    if (past.length === 0) return 'No prior session history.';

    return past
      .slice(0, 5)
      .map((s, idx) => {
        const date = new Date(s.createdAt).toLocaleDateString();
        const summarySnippet = s.summary
          ? s.summary.slice(0, 160).replace(/\n/g, ' ') + '...'
          : `Contained ${s.messages.length} exchanges.`;
        return `[Prior Session #${idx + 1} "${s.title}" (${date})]: ${summarySnippet}`;
      })
      .join('\n');
  },

  // =========================================================================
  // SUMMARY ENGINE: Periodic generation & Context Maintenance
  // =========================================================================

  /**
   * Checks whether the periodic summary engine should trigger for the session
   */
  shouldTriggerPeriodicSummary(session: ChatSession): boolean {
    const currentCount = session.messages.length;
    const lastCount = session.lastSummaryMsgCount || 0;
    // Trigger if at least PERIODIC_SUMMARY_INTERVAL new messages have occurred
    return currentCount >= 4 && currentCount - lastCount >= PERIODIC_SUMMARY_INTERVAL;
  },

  /**
   * Periodically generates a concise conversation context for the AI
   * to maintain user identity and past interaction awareness across sessions.
   */
  async generatePeriodicContext(
    sessions: ChatSession[],
    currentSession: ChatSession,
    userContext: any
  ): Promise<{ conversationContext: string; sessionSummary: string }> {
    const allExchanges = sessions.flatMap((s) => s.messages);
    const recentMessages = currentSession.messages.slice(-10);
    const moniker = userContext?.moniker || currentSession.userMoniker || 'Isabirye Latif';
    const previousContext = this.getConversationContext();

    try {
      const res = await fetch('/api/chat/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: recentMessages.map((m) => ({
            role: m.role,
            parts: [{ text: m.text }]
          })),
          userContext,
          previousSummary: previousContext,
          mode: 'rolling'
        })
      });

      if (!res.ok) throw new Error(`Summary API returned status ${res.status}`);
      const data = await res.json();
      const generated = data.summary || previousContext;

      // Extract concise context representation for AI prompt injection
      const conciseContext = this.condenseSummaryForContext(generated, moniker);
      this.saveConversationContext(conciseContext);

      return {
        conversationContext: conciseContext,
        sessionSummary: generated
      };
    } catch (err) {
      console.warn('[ConversationManager] Fallback periodic context generator engaged:', err);
      // Client-side synthesis fallback
      const fallbackSummary = this.synthesizeClientContext(sessions, currentSession, userContext);
      this.saveConversationContext(fallbackSummary);
      return {
        conversationContext: fallbackSummary,
        sessionSummary: fallbackSummary
      };
    }
  },

  /**
   * Condenses a long executive markdown briefing into a high-density conversation context
   */
  condenseSummaryForContext(longSummary: string, moniker: string): string {
    const lines = longSummary
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('---') && !l.startsWith('*Generated'));

    const keyPoints = lines
      .filter((l) => l.startsWith('-') || l.startsWith('*') || l.startsWith('1.') || l.startsWith('2.'))
      .slice(0, 8)
      .join('\n');

    return `[Rama Continuous Memory Context // ${moniker}]:
${keyPoints || longSummary.slice(0, 400)}`;
  },

  /**
   * Pure client-side synthesis of conversation context when offline or fast updating
   */
  synthesizeClientContext(
    sessions: ChatSession[],
    currentSession: ChatSession,
    userContext: any
  ): string {
    const moniker = userContext?.moniker || currentSession.userMoniker || 'Isabirye Latif';
    const totalMsgCount = sessions.reduce((acc, s) => acc + s.messages.length, 0);

    // Scan for key themes from user messages
    const userTexts = currentSession.messages
      .filter((m) => m.role === 'user')
      .map((m) => m.text.toLowerCase());

    const hasPrayer = userTexts.some((t) => t.includes('pray') || t.includes('namaz') || t.includes('spiritual'));
    const hasLockdown = userTexts.some((t) => t.includes('lock') || t.includes('focus') || t.includes('block'));
    const hasCode = userTexts.some((t) => t.includes('code') || t.includes('app') || t.includes('feature') || t.includes('build'));

    return `[Rama Continuous Memory Context // ${moniker}]:
- User Moniker: ${moniker} (Primary Architect).
- Sessions History: ${sessions.length} sessions recorded (${totalMsgCount} total exchanges).
- Current Active Focus: "${currentSession.title}".
- Ongoing Commitments:
  * Spiritual discipline: ${hasPrayer ? 'Active prayer checkpoints monitored' : 'Standard 5 daily prayers'}.
  * Focus enforcement: ${hasLockdown ? 'Lockdown shield protocol engaged' : 'Deep work discipline'}.
  * Technical target: ${hasCode ? 'Universal Cymatic Hub code and execution' : 'High-impact task completion'}.
- System State: ${userContext?.lockdownActive ? 'Shield Lock Active' : 'Monitor Standby'}.`;
  },

  // =========================================================================
  // EXPORT & SHARE FUNCTIONS
  // =========================================================================

  /**
   * Copy text or summary to clipboard
   */
  async exportToClipboard(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Export summary via email client
   */
  exportToEmail(summaryText: string, userMoniker: string = 'Architect'): void {
    const subject = `Cymatic OS - Rama Executive Briefing for ${userMoniker}`;
    const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(summaryText)}`;
    window.location.href = mailto;
  },

  /**
   * Download summary or transcript as text/markdown/json file
   */
  exportToFile(content: string, filename: string, mimeType: string = 'text/markdown;charset=utf-8'): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Export summary as PDF document
   */
  exportToPdf(params: {
    title?: string;
    summaryText: string;
    userMoniker: string;
    userEmail?: string;
    lockdownActive: boolean;
  }): void {
    exportSummaryAsPdf(params);
  },

  /**
   * Web launch deep-link for PWA shortcuts or sharing
   */
  getShareableLink(sessionId?: string): string {
    const baseUrl = window.location.origin + window.location.pathname;
    if (sessionId) {
      return `${baseUrl}#/?action=summon_rama&session=${encodeURIComponent(sessionId)}`;
    }
    return `${baseUrl}#/?action=summon_rama`;
  },

  /**
   * WhatsApp share link
   */
  getWhatsAppShareUrl(text: string): string {
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  },

  /**
   * Generic social share link generator (Twitter/X, WhatsApp, LinkedIn, Email)
   */
  getSocialShareUrl(
    platform: 'twitter' | 'whatsapp' | 'linkedin' | 'email',
    text: string,
    url?: string
  ): string {
    const shareUrl = url || this.getShareableLink();
    switch (platform) {
      case 'twitter':
        return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text.slice(0, 240))}&url=${encodeURIComponent(shareUrl)}`;
      case 'whatsapp':
        return `https://api.whatsapp.com/send?text=${encodeURIComponent(text + '\n' + shareUrl)}`;
      case 'linkedin':
        return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
      case 'email':
        return `mailto:?subject=${encodeURIComponent('Cymatic OS - Rama AI Briefing')}&body=${encodeURIComponent(text + '\n\n' + shareUrl)}`;
      default:
        return shareUrl;
    }
  }
};
