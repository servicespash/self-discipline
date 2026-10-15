/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Rama System Communication Provider
 * Abstracts messaging (WhatsApp, native SMS), telephony, and email dispatch into pluggable providers.
 */

export interface CommunicationPayload {
  recipient: string;
  body: string;
  subject?: string;
  contractSummary?: {
    title: string;
    targets: string[];
    expiryDate: string;
  };
}

export interface CommunicationProvider {
  name: string;
  sendWhatsApp(payload: CommunicationPayload): Promise<boolean>;
  sendSMS(payload: CommunicationPayload): Promise<boolean>;
  dispatchEmail(payload: CommunicationPayload): Promise<boolean>;
  initiateCall(phoneNumber: string): Promise<boolean>;
}

export class DefaultCommunicationProvider implements CommunicationProvider {
  public name = 'DefaultOSBridge';

  async sendWhatsApp(payload: CommunicationPayload): Promise<boolean> {
    const cleanedPhone = payload.recipient.replace(/[^0-9+]/g, '');
    let text = payload.body;
    if (payload.contractSummary) {
      text += `\n\n[Contract Summary: ${payload.contractSummary.title}]\nTargets: ${payload.contractSummary.targets.join(', ')}\nExpiry: ${payload.contractSummary.expiryDate}`;
    }
    const waUrl = cleanedPhone
      ? `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;

    if (typeof window !== 'undefined') {
      window.open(waUrl, '_blank', 'noopener,noreferrer');
      return true;
    }
    return false;
  }

  async sendSMS(payload: CommunicationPayload): Promise<boolean> {
    const cleanedPhone = payload.recipient.replace(/[^0-9+]/g, '');
    let text = payload.body;
    if (payload.contractSummary) {
      text += `\n[Contract: ${payload.contractSummary.title}]`;
    }
    const smsUrl = `sms:${cleanedPhone}?body=${encodeURIComponent(text)}`;
    if (typeof window !== 'undefined') {
      window.location.href = smsUrl;
      return true;
    }
    return false;
  }

  async dispatchEmail(payload: CommunicationPayload): Promise<boolean> {
    const res = await fetch('/api/dispatch-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: payload.recipient,
        subject: payload.subject || 'Cymatic Discipline OS // Executive Dispatch',
        body: payload.body,
        contractSummary: payload.contractSummary
      })
    });
    return res.ok;
  }

  async initiateCall(phoneNumber: string): Promise<boolean> {
    const telUrl = `tel:${phoneNumber.replace(/[^0-9+]/g, '')}`;
    if (typeof window !== 'undefined') {
      window.location.href = telUrl;
      return true;
    }
    return false;
  }
}

export const RamaCommunicationProvider = new DefaultCommunicationProvider();
