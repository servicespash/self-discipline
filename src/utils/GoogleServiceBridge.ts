/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Unified GoogleServiceBridge - Production Authentication & Workspace APIs
 */

export interface GoogleEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
}

export interface GoogleTask {
  id: string;
  title: string;
  status: 'needsAction' | 'completed';
}

class GoogleServiceBridgeEngine {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.loadPersistedTokens();
  }

  private loadPersistedTokens() {
    try {
      if (typeof localStorage !== 'undefined') {
        this.accessToken = localStorage.getItem('sdc_google_access_token');
        this.refreshToken = localStorage.getItem('sdc_google_refresh_token');
        const expiry = localStorage.getItem('sdc_google_token_expiry');
        if (expiry) {
          this.tokenExpiry = parseInt(expiry, 10);
        }
      }
    } catch (e) {
      console.warn('[GoogleServiceBridge] Failed to load tokens from storage:', e);
    }
  }

  public setAccessToken(token: string, expiresInSeconds: number = 3600, refreshToken?: string) {
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid access token provided.');
    }
    this.accessToken = token.trim();
    this.tokenExpiry = Date.now() + Math.max(60, expiresInSeconds) * 1000;
    if (refreshToken) {
      this.refreshToken = refreshToken.trim();
    }
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('sdc_google_access_token', this.accessToken);
        if (this.refreshToken) {
          localStorage.setItem('sdc_google_refresh_token', this.refreshToken);
        }
        localStorage.setItem('sdc_google_token_expiry', this.tokenExpiry.toString());
      }
    } catch (e) {
      console.warn('[GoogleServiceBridge] Failed to persist tokens:', e);
    }
  }

  public getAccessToken(): string | null {
    if (!this.accessToken) return null;
    if (Date.now() > this.tokenExpiry) {
      console.warn('[GoogleServiceBridge] Token expired. Attempting refresh if available.');
      if (this.refreshToken) {
        // Return null to trigger caller refresh handling or trigger async refresh
        return null;
      }
      this.clearToken();
      return null;
    }
    return this.accessToken;
  }

  public clearToken() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = 0;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('sdc_google_access_token');
        localStorage.removeItem('sdc_google_refresh_token');
        localStorage.removeItem('sdc_google_token_expiry');
      }
    } catch (e) {
      console.warn('[GoogleServiceBridge] Failed to clear token storage:', e);
    }
  }

  public isAuthenticated(): boolean {
    return this.getAccessToken() !== null;
  }

  public async fetchCalendarEvents(): Promise<GoogleEvent[]> {
    const token = this.getAccessToken();
    if (!token) throw new Error('Unauthenticated Google Workspace session. Please re-authenticate.');

    const now = new Date().toISOString();
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(now)}&singleEvents=true&orderBy=startTime`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        if (res.status === 401) {
          this.clearToken();
          throw new Error('Google Calendar authorization expired (401). Please re-authenticate.');
        }
        throw new Error(`Google Calendar API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      if (!data || typeof data !== 'object') {
        return [];
      }
      return Array.isArray(data.items) ? data.items : [];
    } catch (e: any) {
      if (e?.message?.includes('401')) {
        this.clearToken();
      }
      throw e;
    }
  }

  public async fetchGoogleTasks(): Promise<GoogleTask[]> {
    const token = this.getAccessToken();
    if (!token) throw new Error('Unauthenticated Google Workspace session. Please re-authenticate.');

    const url = 'https://www.googleapis.com/tasks/v1/users/@me/lists/@default/tasks';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        if (res.status === 401) {
          this.clearToken();
          throw new Error('Google Tasks authorization expired (401). Please re-authenticate.');
        }
        throw new Error(`Google Tasks API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      if (!data || typeof data !== 'object') {
        return [];
      }
      return Array.isArray(data.items) ? data.items : [];
    } catch (e: any) {
      if (e?.message?.includes('401')) {
        this.clearToken();
      }
      throw e;
    }
  }
}

export const GoogleServiceBridge = new GoogleServiceBridgeEngine();
