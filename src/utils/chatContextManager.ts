/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Chat Context Management System - Rama Floating Hub
 * Persistent multi-session history, rolling summary awareness, and multi-channel export.
 */

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
  pinned?: boolean;
}

const STORAGE_SESSIONS = 'cymatic_rama_chat_sessions_v2';
const STORAGE_ACTIVE_ID = 'cymatic_rama_active_session_id_v2';
const STORAGE_ROLLING_SUMMARY = 'cymatic_rama_rolling_summary_v1';
const STORAGE_LEGACY_CHAT = 'cymatic_rama_chat_v1';

export const ChatContextManager = {
  /**
   * Load all conversation sessions with backward-compatible migration
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
            userMoniker: defaultMoniker
          };
          const initialSessions = [migratedSession];
          localStorage.setItem(STORAGE_SESSIONS, JSON.stringify(initialSessions));
          localStorage.setItem(STORAGE_ACTIVE_ID, migratedSession.id);
          return initialSessions;
        }
      }
    } catch (e) {
      console.error('[ChatContext] Failed to load sessions:', e);
    }

    // Default first session
    const defaultSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: 'Operational Genesis',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userMoniker: defaultMoniker,
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
   * Persist sessions to local storage
   */
  saveSessions(sessions: ChatSession[]): void {
    try {
      localStorage.setItem(STORAGE_SESSIONS, JSON.stringify(sessions));
    } catch (e) {
      console.error('[ChatContext] Failed to save sessions:', e);
    }
  },

  /**
   * Get ID of active session
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
      console.error('[ChatContext] Failed to set active session ID:', e);
    }
  },

  /**
   * Create a new chat session
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
      messages: [
        {
          id: `init-${Date.now()}`,
          role: 'assistant',
          text: `Focus session #${sessionNumber} initiated with ${moniker}. Rama maintains awareness of your ongoing directives and past sessions. What is our target?`,
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
   * Update messages in current session and update title if initial message
   */
  updateSessionMessages(
    sessionId: string,
    messages: Message[],
    sessions: ChatSession[]
  ): ChatSession[] {
    const updated = sessions.map((sess) => {
      if (sess.id !== sessionId) return sess;

      let title = sess.title;
      // If default title, auto-name based on first user query
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
        updatedAt: new Date().toISOString()
      };
    });

    this.saveSessions(updated);
    return updated;
  },

  /**
   * Load rolling cumulative summary of all past interactions
   */
  loadRollingSummary(): string {
    try {
      const stored = localStorage.getItem(STORAGE_ROLLING_SUMMARY);
      if (stored) return stored;
    } catch {
      // Ignore
    }
    return `Architect Trajectory:
- Focus on high-yield software architecture and deep discipline.
- System lockdown protocols blocking distractions during work blocks.
- 5 daily prayer anchors with centering and room order.`;
  },

  /**
   * Save rolling summary
   */
  saveRollingSummary(summary: string): void {
    try {
      localStorage.setItem(STORAGE_ROLLING_SUMMARY, summary);
    } catch (e) {
      console.error('[ChatContext] Failed to save rolling summary:', e);
    }
  },

  /**
   * Generate an overview of past sessions for the AI prompt
   */
  generatePastSessionsOverview(sessions: ChatSession[], currentSessionId: string): string {
    const past = sessions.filter((s) => s.id !== currentSessionId);
    if (past.length === 0) return 'No prior session history.';

    return past
      .slice(0, 5)
      .map((s, idx) => {
        const date = new Date(s.createdAt).toLocaleDateString();
        const summarySnippet = s.summary
          ? s.summary.slice(0, 150).replace(/\n/g, ' ') + '...'
          : `Contained ${s.messages.length} messages.`;
        return `[Prior Session ${idx + 1}: "${s.title}" (${date})]: ${summarySnippet}`;
      })
      .join('\n');
  },

  /**
   * Export summary to clipboard
   */
  async exportToClipboard(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      // Fallback
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
   * Export summary to Email client
   */
  exportToEmail(summaryText: string, userMoniker: string = 'Architect'): void {
    const subject = `Cymatic OS - Rama Executive Briefing for ${userMoniker}`;
    const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(summaryText)}`;
    window.location.href = mailto;
  },

  /**
   * Export summary to File (Markdown or Plain Text)
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
   * Get Shareable deep-link with shortcut parameters
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
  }
};
