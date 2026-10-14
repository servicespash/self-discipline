// @ts-nocheck -- ported from servicespash/self-discipline (looser original tsconfig)
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Cymatic Discipline OS - Production Auth Service (Supabase)
 */

import { supabase } from './supabase';

export interface AuthResponse {
  success: boolean;
  error?: string;
  user?: any;
}

export const authService = {
  async signInWithEmail(email: string, password: string):Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Authentication failed' };
    }
  },

  async signUpWithEmail(email: string, password: string, moniker: string, role: string = 'member'): Promise<AuthResponse> {
    try {
      const cleanEmail = email.trim();
      const cleanMoniker = moniker.trim() || cleanEmail.split('@')[0];

      // 1. Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            moniker: cleanMoniker,
            role,
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const authUser = data.user;
      if (!authUser) {
        return { success: false, error: 'User registration failed to return user object.' };
      }

      // 2. Automatically sign in after registration to establish active session
      await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      // 3. Provision or upsert user record in public.users table
      const { error: dbError } = await supabase.from('users').upsert({
        uid: authUser.id,
        email: cleanEmail,
        moniker: cleanMoniker,
        role: role,
      }, { onConflict: 'uid' });

      if (dbError) {
        console.warn('Warning provisioning public.users record:', dbError.message);
      }

      return { success: true, user: authUser };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Registration failed' };
    }
  },

  async sendMagicLink(email: string): Promise<AuthResponse> {
    try {
      const cleanEmail = email.trim();
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: window.location.origin,
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to dispatch magic link' };
    }
  },

  async signOut(): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Sign out failed' };
    }
  }
};
