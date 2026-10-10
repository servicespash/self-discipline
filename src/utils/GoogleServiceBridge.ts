/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Unified GoogleServiceBridge - Authentication, Token Management & Google Workspace APIs
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
  private tokenExpiry: number = 0;

  constructor() {
    this.accessToken = localStorage.getItem('sdc_google_access_token');
    const expiry = localStorage.getItem('sdc_google_token_expiry');
    if (expiry) this.tokenExpiry = parseInt(expiry, 10);
  }

  public setAccessToken(token: string, expiresInSeconds: number = 3600) {
    this.accessToken = token;
    this.tokenExpiry = Date.now() + expiresInSeconds * 1000;
    localStorage.setItem('sdc_google_access_token', token);
    localStorage.setItem('sdc_google_token_expiry', this.tokenExpiry.toString());
  }

  public getAccessToken(): string | null {
    if (this.accessToken && Date.now() > this.tokenExpiry) {
      console.warn('[GoogleServiceBridge] Token expired. Re-authentication required.');
      this.clearToken();
      return null;
    }
    return this.accessToken;
  }

  public clearToken() {
    this.accessToken = null;
    this.tokenExpiry = 0;
    localStorage.removeItem('sdc_google_access_token');
    localStorage.removeItem('sdc_google_token_expiry');
  }

  public isAuthenticated(): boolean {
    return this.getAccessToken() !== null;
  }

  public async fetchCalendarEvents(): Promise<GoogleEvent[]> {
    const token = this.getAccessToken();
    if (!token) throw new Error('Unauthenticated Google Workspace session.');

    const now = new Date().toISOString();
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now}&singleEvents=true&orderBy=startTime`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error(`Google Calendar API error: ${res.status}`);
    const data = await res.json();
    return data.items || [];
  }

  public async fetchGoogleTasks(): Promise<GoogleTask[]> {
    const token = this.getAccessToken();
    if (!token) throw new Error('Unauthenticated Google Workspace session.');

    const res = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists/@default/tasks', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error(`Google Tasks API error: ${res.status}`);
    const data = await res.json();
    return data.items || [];
  }
}

export const GoogleServiceBridge = new GoogleServiceBridgeEngine();
