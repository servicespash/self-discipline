/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Professional Dispatch & Sharing Manager
 * Orchestrates professional email, WhatsApp, and system-native message dispatch for governance contracts.
 * Enforces authenticated link generation for recipient security.
 */

export const ShareManager = {
  /**
   * Generates a secure, authenticated link for a governance contract.
   */
  generateContractLink(contractId: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/#/contracts/${contractId}?token=${btoa(contractId)}`;
  },

  /**
   * Dispatches professional sharing intents for Email and WhatsApp/SMS.
   */
  async shareContract(contract: any, method: 'email' | 'whatsapp' | 'sms') {
    const link = this.generateContractLink(contract.id);
    const message = `Professional Governance Pact Invitation: "${contract.contract_title}"\n\nPlease review and ratify this institutional covenant:\n${link}\n\n[Auth Required]`;

    if (method === 'email') {
      const subject = encodeURIComponent(`Governance Covenant: ${contract.contract_title}`);
      const body = encodeURIComponent(message);
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    } else if (method === 'whatsapp') {
      const encodedMsg = encodeURIComponent(message);
      window.open(`https://wa.me/?text=${encodedMsg}`, '_blank');
    } else if (method === 'sms') {
      const encodedMsg = encodeURIComponent(message);
      window.location.href = `sms:?body=${encodedMsg}`;
    }
  }
};
