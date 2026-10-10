/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Spiritual & Native Push Notification Service
 */

import { DisciplineBridge } from '../DisciplineBridge';
import { GoogleServiceBridge } from './GoogleServiceBridge';

class SpiritualNotificationEngine {
  private timer: any = null;

  public async init() {
    if (typeof window === 'undefined') return;

    // Request browser notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    // Register native push notifications if Capacitor is available
    if ((window as any).Capacitor?.isPluginAvailable('PushNotifications')) {
      try {
        const push = (window as any).Capacitor.Plugins.PushNotifications;
        await push.requestPermissions();
        await push.register();
        
        push.addListener('pushNotificationReceived', (notification: any) => {
          this.handleIncomingPush(notification);
        });
      } catch (e) {
        console.warn('[SpiritualNotifications] Native push registration warning:', e);
      }
    }

    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.pollDeadlines();
    }, 45000); // Poll every 45s
  }

  private handleIncomingPush(notification: any) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title || 'Discipline OS Alert', {
        body: notification.body || 'High priority reminder.',
        icon: '/favicon.ico'
      });
    }
  }

  private async pollDeadlines() {
    try {
      if (GoogleServiceBridge.isAuthenticated()) {
        const events = await GoogleServiceBridge.fetchCalendarEvents();
        const now = Date.now();
        events.forEach(ev => {
          if (ev.start.dateTime) {
            const startTime = new Date(ev.start.dateTime).getTime();
            // If event starts within next 5 minutes
            if (startTime > now && startTime - now <= 300000) {
              this.notifyDeadline('Google Calendar Event Starting', ev.summary);
            }
          }
        });
      }
    } catch (e) {
      // Silent catch for network drops
    }
  }

  private notifyDeadline(title: string, message: string) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: message, icon: '/favicon.ico' });
    }
  }
}

export const SpiritualNotifications = new SpiritualNotificationEngine();
