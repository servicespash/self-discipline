/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Cymatic OS - Token-Based Authentication Interceptor & Security Guard
 * Intercepts incoming shared contract links and cross-platform tokens,
 * ensuring unauthenticated external users must authenticate before viewing sensitive data.
 */

export interface SharedLinkPayload {
  token: string;
  contractId?: string;
  action?: string;
}

const PENDING_SHARED_TOKEN_KEY = 'cymatic_pending_shared_token_v1';

export class AuthInterceptor {
  public static interceptUrl(): SharedLinkPayload | null {
    if (typeof window === 'undefined') return null;

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');

      const token = urlParams.get('token') || hashParams.get('token') || urlParams.get('audit_token') || hashParams.get('audit_token');
      const contractId = urlParams.get('contract') || hashParams.get('contract') || urlParams.get('contractId') || hashParams.get('contractId');
      const action = urlParams.get('action') || hashParams.get('action');

      if (token || contractId) {
        const payload: SharedLinkPayload = {
          token: token || 'ext_token_' + Date.now(),
          contractId: contractId || undefined,
          action: action || 'view_contract'
        };

        localStorage.setItem(PENDING_SHARED_TOKEN_KEY, JSON.stringify(payload));
        return payload;
      }

      // Check if any pending token exists in storage
      const saved = localStorage.getItem(PENDING_SHARED_TOKEN_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('[AuthInterceptor] Failed to parse shared link token:', e);
    }

    return null;
  }

  public static clearPendingToken(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(PENDING_SHARED_TOKEN_KEY);
    } catch {}
  }

  public static requiresAuthentication(): boolean {
    const payload = this.interceptUrl();
    if (!payload) return false;

    // Check if user has an active session
    try {
      const session = localStorage.getItem('cymatic_session_v2');
      if (!session) return true;
      const parsed = JSON.parse(session);
      return !parsed || !parsed.uid;
    } catch {
      return true;
    }
  }
}
