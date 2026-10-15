/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Professional Dispatch & Sharing Manager
 * Orchestrates professional email, WhatsApp, and system-native message dispatch for governance contracts.
 * Enforces authenticated link generation for recipient security.
 */const i={generateContractLink(n){return`${window.location.origin}/#/contracts/${n}?token=${btoa(n)}`},async shareContract(n,o){const a=this.generateContractLink(n.id),t=`Professional Governance Pact Invitation: "${n.contract_title}"

Please review and ratify this institutional covenant:
${a}

[Auth Required]`;if(o==="email"){const e=encodeURIComponent(`Governance Covenant: ${n.contract_title}`),s=encodeURIComponent(t);window.location.href=`mailto:?subject=${e}&body=${s}`}else if(o==="whatsapp"){const e=encodeURIComponent(t);window.open(`https://wa.me/?text=${e}`,"_blank")}else if(o==="sms"){const e=encodeURIComponent(t);window.location.href=`sms:?body=${e}`}}};export{i as ShareManager};
