/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return false;
  }
  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

export const sendNotification = (title: string, body: string) => {
  if (Notification.permission === 'granted') {
    new Notification(title, { body });
  }
};
