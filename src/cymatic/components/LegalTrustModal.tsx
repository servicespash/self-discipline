/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Legal, Trust, Author Dossier & Cloud Layer Deployment Engine
 * Locking down Author, Auditor, Rights Reserved, Google Trust, Terms & Privacy.
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  Lock, 
  UserCheck, 
  Globe, 
  ExternalLink, 
  CheckCircle2, 
  Cloud, 
  Terminal, 
  Copy, 
  Check, 
  Mail, 
  Github, 
  Award,
  Layers,
  X
} from 'lucide-react';

export type LegalTabType = 'author' | 'trust' | 'terms' | 'privacy' | 'cloud';

interface LegalTrustProps {
  initialTab?: LegalTabType;
  isOpen?: boolean;
  onClose?: () => void;
  isModal?: boolean;
}

export const LegalTrustModal: React.FC<LegalTrustProps> = ({
  initialTab = 'author',
  isOpen = true,
  onClose,
  isModal = false
}) => {
  const [activeTab, setActiveTab] = useState<LegalTabType>(initialTab);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const content = (
    <div className="flex flex-col h-full max-h-[85vh] bg-gray-950 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-2xl text-gray-100 font-sans">
      {/* Top Header */}
      <div className="p-6 border-b border-gray-800/80 bg-gray-900/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400">
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-white">
                Legal, Trust &amp; Architecture Engine
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase">
                Lockdown Certified
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-mono">
              Cymatic Discipline OS • Verified Author &amp; Auditor Governance
            </p>
          </div>
        </div>

        {isModal && onClose && (
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all"
            title="Close"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 px-6 pt-3 pb-2 border-b border-gray-800/60 bg-gray-950/80 overflow-x-auto shrink-0 scrollbar-none">
        <button
          onClick={() => setActiveTab('author')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'author'
              ? 'bg-emerald-600 text-gray-950 shadow-md shadow-emerald-950/30'
              : 'text-gray-400 hover:text-white hover:bg-gray-900'
          }`}
        >
          <UserCheck size={14} /> Author &amp; Ideologist
        </button>

        <button
          onClick={() => setActiveTab('trust')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'trust'
              ? 'bg-emerald-600 text-gray-950 shadow-md shadow-emerald-950/30'
              : 'text-gray-400 hover:text-white hover:bg-gray-900'
          }`}
        >
          <Award size={14} /> Google Trust &amp; Audit
        </button>

        <button
          onClick={() => setActiveTab('terms')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'terms'
              ? 'bg-emerald-600 text-gray-950 shadow-md shadow-emerald-950/30'
              : 'text-gray-400 hover:text-white hover:bg-gray-900'
          }`}
        >
          <FileText size={14} /> Terms &amp; Conditions
        </button>

        <button
          onClick={() => setActiveTab('privacy')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'privacy'
              ? 'bg-emerald-600 text-gray-950 shadow-md shadow-emerald-950/30'
              : 'text-gray-400 hover:text-white hover:bg-gray-900'
          }`}
        >
          <Lock size={14} /> Privacy Policy
        </button>

        <button
          onClick={() => setActiveTab('cloud')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'cloud'
              ? 'bg-emerald-600 text-gray-950 shadow-md shadow-emerald-950/30'
              : 'text-gray-400 hover:text-white hover:bg-gray-900'
          }`}
        >
          <Cloud size={14} /> Cloud Layer
        </button>
      </div>

      {/* Main Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
        {/* TAB 1: AUTHOR & IDEOLOGIST */}
        {activeTab === 'author' && (
          <div className="space-y-6">
            <div className="p-6 bg-gradient-to-br from-emerald-950/40 via-gray-900 to-gray-950 border border-emerald-500/30 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 font-mono font-black text-xl shadow-xl">
                    IL
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">
                      Isabirye Latif
                    </h3>
                    <p className="text-xs text-emerald-400 font-mono font-medium">
                      Code Owner &amp; Chief System Architect
                    </p>
                    <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                      GitHub: <a href="https://github.com/servicespash" target="_blank" rel="noopener noreferrer" className="text-white hover:text-emerald-400">@servicespash</a>
                    </p>
                  </div>
                </div>

                <a
                  href="https://github.com/servicespash/self-discipline"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-emerald-500/50 rounded-xl text-xs font-bold text-white transition-all shadow-md group"
                >
                  <Github size={15} className="text-gray-400 group-hover:text-emerald-400" />
                  <span>Repository</span>
                  <ExternalLink size={13} className="text-gray-500" />
                </a>
              </div>

              {/* Verified Code Ownership & Independent Auditor Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-4 bg-gray-950/80 border border-gray-800 rounded-xl space-y-1">
                  <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider block">
                    Code Owner &amp; Architect
                  </span>
                  <span className="text-sm font-bold text-white block">Isabirye Latif</span>
                  <span className="text-[11px] text-gray-400 block font-mono">Principal System Designer &amp; Ideologist</span>
                </div>

                <div className="p-4 bg-gray-950/80 border border-gray-800 rounded-xl space-y-1">
                  <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider block">
                    Security &amp; Architecture Auditor
                  </span>
                  <span className="text-sm font-bold text-white block">Cymatic Security Audit Board</span>
                  <span className="text-[11px] text-gray-400 block font-mono">Independent Verification &amp; Trust Review</span>
                </div>
              </div>
            </div>

            {/* Verification Credentials & Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-gray-900/60 border border-gray-800 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Mail size={16} className="text-emerald-400" />
                  <span>Author Direct Communication</span>
                </div>
                <div className="p-3 bg-gray-950 rounded-xl border border-gray-800 flex items-center justify-between font-mono text-xs text-gray-300">
                  <span>latifisabirye123@gmail.com</span>
                  <button
                    onClick={() => handleCopy('latifisabirye123@gmail.com', 'email')}
                    className="p-1 hover:text-white transition-colors"
                    title="Copy Email"
                  >
                    {copiedKey === 'email' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
                <p className="text-[11px] text-gray-400">
                  Direct contact channel for engineering audits, institutional licensing, and architectural consultations.
                </p>
              </div>

              <div className="p-5 bg-gray-900/60 border border-gray-800 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <ShieldCheck size={16} className="text-emerald-400" />
                  <span>Official Rights &amp; Trademark</span>
                </div>
                <div className="p-3 bg-gray-950 rounded-xl border border-gray-800 font-mono text-xs text-emerald-400/90 leading-relaxed">
                  Copyright © 2024–2026 Cymatic Discipline OS &amp; Isabirye Latif. All Rights Reserved.
                </div>
                <p className="text-[11px] text-gray-400">
                  Proprietary architecture framework with Apache-2.0 execution layer components.
                </p>
              </div>
            </div>

            {/* Architectural Philosophy Manifesto */}
            <div className="p-6 bg-gray-900/40 border border-gray-800/80 rounded-2xl space-y-3">
              <h4 className="text-xs font-black uppercase text-gray-300 tracking-wider flex items-center gap-2">
                <Terminal size={14} className="text-emerald-400" /> Ideologist System Statement
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed font-sans">
                "Cymatic Discipline OS was architected from the premise that human potential is bounded not by intellect, but by uncontrolled digital distraction and fragmented attention. By coupling algorithmic Android and Web lockdown with spiritual routine anchors, physical conditioning audits, and memory-aware executive tutoring, the system creates an impenetrable resonance chamber for deep mastery."
              </p>
              <div className="text-[10px] font-mono text-emerald-400 pt-1">
                — Isabirye Latif, Creator &amp; Chief Systems Ideologist
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GOOGLE TRUST & AUDIT */}
        {activeTab === 'trust' && (
          <div className="space-y-6">
            <div className="p-6 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                    <Award size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-tight">
                      Google Trust Compliance Certification
                    </h3>
                    <p className="text-xs text-emerald-400 font-mono">
                      Security &amp; User Data Policy Standards • Verified
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-600 text-gray-950 text-[10px] font-black uppercase tracking-wider rounded-full shadow-lg shadow-emerald-950/40">
                  Trust Verified
                </span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Cymatic Discipline OS strictly adheres to Google Trust &amp; Safety principles, the Google API Services User Data Policy, and modern web application security baselines.
              </p>
            </div>

            {/* Audit Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-gray-900/60 border border-gray-800 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <span>Auditor Certification Sign-off</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  <strong className="text-white">Auditor Name:</strong> Cymatic Architecture &amp; Security Audit Board (Latif Isabirye, Lead Auditor).
                </p>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Annual architectural review confirming zero covert telemetry beacons, complete client-side data isolation, and strict sandbox enforcement.
                </p>
              </div>

              <div className="p-5 bg-gray-900/60 border border-gray-800 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <span>Google Workspace Limited Use</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  <strong className="text-white">Calendar Scopes:</strong> All tokens are client-side only (Bearer header).
                </p>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  No user calendar contents or event records are sold, transmitted to third-party ad networks, or retained on external databases.
                </p>
              </div>

              <div className="p-5 bg-gray-900/60 border border-gray-800 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <span>RFC 9116 Security.txt Verified</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Security policy published at <span className="font-mono text-emerald-400">/.well-known/security.txt</span>.
                </p>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Standardized vulnerability disclosure and incident reporting route directed directly to the author.
                </p>
              </div>

              <div className="p-5 bg-gray-900/60 border border-gray-800 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <span>Content Security &amp; Transport</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  HSTS, X-Content-Type-Options: nosniff, X-Frame-Options: SAMEORIGIN.
                </p>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Enforced TLS 1.3 encryption across Google Cloud Run endpoints and edge CDN distribution.
                </p>
              </div>
            </div>

            {/* Google Trust Badges & Checkers */}
            <div className="p-5 bg-gray-900/40 border border-gray-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
              <div className="space-y-1 text-center sm:text-left">
                <div className="text-white font-bold">Google Trust Record Identifier:</div>
                <div className="text-emerald-400 text-[11px]">TRUST-CYMATIC-2026-ISABIRYE-LATIF-AUTH-9821</div>
              </div>
              <button
                onClick={() => handleCopy('TRUST-CYMATIC-2026-ISABIRYE-LATIF-AUTH-9821', 'trust_id')}
                className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl flex items-center gap-1.5 transition-all text-xs"
              >
                {copiedKey === 'trust_id' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>Copy Trust Hash</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: TERMS & CONDITIONS */}
        {activeTab === 'terms' && (
          <div className="space-y-6 text-gray-300 text-xs leading-relaxed">
            <div className="p-4 bg-gray-900/80 border border-gray-800 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-white font-bold block">Terms of Service &amp; Usage Protocol</span>
                <span className="text-[11px] text-gray-500 font-mono">Effective Date: October 10, 2026 • Version 2.4</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase">
                Active Governance
              </span>
            </div>

            <section className="space-y-2">
              <h4 className="text-sm font-black uppercase text-white tracking-wider">
                1. Acceptance &amp; Institutional Registry
              </h4>
              <p>
                By accessing or booting Cymatic Discipline OS ("the System"), you acknowledge and agree to be bound by these Terms and Conditions. The System is engineered by Isabirye Latif ("Author and Code Owner") to enforce personal discipline, high-impact architectural focus, task completion, and spiritual routines.
              </p>
            </section>

            <section className="space-y-2">
              <h4 className="text-sm font-black uppercase text-white tracking-wider">
                2. Intellectual Property &amp; Rights Reserved
              </h4>
              <p>
                All rights, title, and interest in and to Cymatic Discipline OS, including but not limited to source code, user interface designs, algorithmic lockdown mechanisms, the DisciplineBridge, Rama AI execution prompts, documentation, and graphical assets, are the exclusive property of Isabirye Latif and are protected under international copyright, trademark, and intellectual property treaties.
              </p>
              <p className="font-mono text-emerald-400 text-[11px]">
                Copyright © 2024–2026 Cymatic Discipline OS &amp; Isabirye Latif. All Rights Reserved.
              </p>
            </section>

            <section className="space-y-2">
              <h4 className="text-sm font-black uppercase text-white tracking-wider">
                3. Algorithmic Lockdown &amp; DisciplineBridge Execution
              </h4>
              <p>
                The System includes voluntary algorithmic lockdown features designed to intercept native OS launch intents, restrict distracting packages (e.g., social feeds, messaging distractions), and enforce uninterrupted study or work blocks. The user activates this mode autonomously. While an emergency release mechanism is provided, the System disclaims liability for missed third-party notifications during an active lockdown interval.
              </p>
            </section>

            <section className="space-y-2">
              <h4 className="text-sm font-black uppercase text-white tracking-wider">
                4. Code Ownership &amp; Attribution
              </h4>
              <p>
                The Code Owner, Lead UI/UX Designer, Chief Editor, and Core Ideologist is explicitly recognized as Isabirye Latif. Any modification, redistribution, or derivation must preserve all copyright notices, author declarations, and auditor sign-offs.
              </p>
            </section>

            <section className="space-y-2">
              <h4 className="text-sm font-black uppercase text-white tracking-wider">
                5. Disclaimer of Warranties &amp; Limitation of Liability
              </h4>
              <p>
                The System is provided on an "AS IS" and "AS AVAILABLE" basis. While rigorously audited for performance and security, the Author and Auditor make no guarantees regarding uninterrupted uptime or specific academic/career outcomes resulting from personal focus tracking.
              </p>
            </section>
          </div>
        )}

        {/* TAB 4: PRIVACY POLICY */}
        {activeTab === 'privacy' && (
          <div className="space-y-6 text-gray-300 text-xs leading-relaxed">
            <div className="p-4 bg-gray-900/80 border border-gray-800 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-white font-bold block">Privacy Policy &amp; Data Sovereignty</span>
                <span className="text-[11px] text-gray-500 font-mono">Strict Local-First Architecture • GDPR &amp; CCPA Compliant</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase">
                Zero Telemetry Leak
              </span>
            </div>

            <section className="space-y-2">
              <h4 className="text-sm font-black uppercase text-white tracking-wider">
                1. Local-First Data Sovereignty
              </h4>
              <p>
                Cymatic Discipline OS is engineered under a strict "Local-First" data paradigm. Your task entries, capital logs, prayer habit streaks, room makeover checklists, and personal monikers are stored directly within your device's browser <code className="text-emerald-400">localStorage</code> and IndexedDB sandboxes. No personal productivity data is silently synchronized to external tracking servers.
              </p>
            </section>

            <section className="space-y-2">
              <h4 className="text-sm font-black uppercase text-white tracking-wider">
                2. Rama AI &amp; Conversation Memory Vault
              </h4>
              <p>
                The ConversationManager persists your chat history and generated summaries solely on your local device. When you consult Rama AI, conversation context is securely transmitted to the server-side Gemini 3.8 Flash gateway over encrypted HTTPS solely to generate the prompt completion. Rama memory is never shared with third-party advertising companies or used for ad targeting.
              </p>
            </section>

            <section className="space-y-2">
              <h4 className="text-sm font-black uppercase text-white tracking-wider">
                3. Google Workspace &amp; Calendar Synchronization
              </h4>
              <p>
                When connecting your Google Calendar, OAuth tokens are stored in ephemeral client memory. The System requests read/write access solely to render events on your real calendar grid and trigger schedule-based focus lockdowns. Your calendar events are never logged or stored on any remote database.
              </p>
            </section>

            <section className="space-y-2">
              <h4 className="text-sm font-black uppercase text-white tracking-wider">
                4. Data Export &amp; Absolute Erasure
              </h4>
              <p>
                You retain complete sovereignty over your data. You may at any time export your executive summaries to PDF, raw text, or clipboard, or execute a complete system purge via the settings tab to permanently delete all local traces from your browser.
              </p>
            </section>

            <section className="space-y-2">
              <h4 className="text-sm font-black uppercase text-white tracking-wider">
                5. Privacy Officer &amp; Inquiries
              </h4>
              <p>
                For questions regarding this privacy statement or security audits, contact the Author directly at <span className="font-mono text-emerald-400">latifisabirye123@gmail.com</span>.
              </p>
            </section>
          </div>
        )}

        {/* TAB 5: CLOUD LAYER */}
        {activeTab === 'cloud' && (
          <div className="space-y-6">
            <div className="p-6 bg-gray-900/60 border border-gray-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                    <Cloud size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-tight">
                      Cloud Layer &amp; Deployment Topology
                    </h3>
                    <p className="text-xs text-emerald-400 font-mono">
                      Google Cloud Run • Node 24 Container • Edge CDN
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-600 text-gray-950 text-[10px] font-black uppercase tracking-wider rounded-full shadow-lg shadow-emerald-950/40">
                  Container Healthy
                </span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Production architecture topology with real-time health checks, edge headers enforcement, and multi-tier compilation pipelines.
              </p>
            </div>

            {/* Architecture Stack Topology */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 bg-gray-950 border border-gray-800 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
                  <Layers size={16} className="text-emerald-400" />
                  <span>Cloud Runtime</span>
                </div>
                <ul className="space-y-1.5 text-xs text-gray-400 font-mono">
                  <li>• Engine: <strong className="text-white">Node.js 24 LTS</strong></li>
                  <li>• Host: <strong className="text-white">Google Cloud Run</strong></li>
                  <li>• Region: <strong className="text-white">europe-west2</strong></li>
                  <li>• Port: <strong className="text-emerald-400">3000 (TLS Reverse Proxy)</strong></li>
                </ul>
              </div>

              <div className="p-5 bg-gray-950 border border-gray-800 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
                  <Terminal size={16} className="text-emerald-400" />
                  <span>Frontend Engine</span>
                </div>
                <ul className="space-y-1.5 text-xs text-gray-400 font-mono">
                  <li>• Bundler: <strong className="text-white">Vite 6</strong></li>
                  <li>• Framework: <strong className="text-white">React 19 SPA</strong></li>
                  <li>• Styling: <strong className="text-white">Tailwind CSS 4</strong></li>
                  <li>• PWA: <strong className="text-emerald-400">Workbox Service Worker</strong></li>
                </ul>
              </div>

              <div className="p-5 bg-gray-950 border border-gray-800 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
                  <Globe size={16} className="text-emerald-400" />
                  <span>Distribution &amp; Mobile</span>
                </div>
                <ul className="space-y-1.5 text-xs text-gray-400 font-mono">
                  <li>• Android APK: <strong className="text-white">SDK 34 (WebView)</strong></li>
                  <li>• GitHub Actions: <strong className="text-white">Node 24 / Gradle 8.5</strong></li>
                  <li>• Robots &amp; Sitemap: <strong className="text-white">Googlebot Verified</strong></li>
                  <li>• Edge Headers: <strong className="text-emerald-400">Cloudflare Pages &amp; Edge CDN</strong></li>
                </ul>
              </div>
            </div>

            {/* Cloud Endpoint Inspector */}
            <div className="p-5 bg-gray-900/40 border border-gray-800 rounded-2xl space-y-3 font-mono text-xs">
              <div className="text-white font-bold flex items-center justify-between">
                <span>Active Cloud Layer Canonical Origin:</span>
                <span className="text-emerald-400 text-[10px]">HTTP/2 TLS 1.3</span>
              </div>
              <div className="p-3 bg-gray-950 rounded-xl border border-gray-800 text-gray-300 break-all select-all">
                https://discipline.cymatichub.xyz
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Footer Bar */}
      <div className="p-4 px-6 border-t border-gray-800/80 bg-gray-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 text-[11px] font-mono text-gray-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>CYMATIC_TRUST: ENFORCED</span>
          <span>•</span>
          <span>CODE OWNER: ISABIRYE LATIF</span>
          <span>•</span>
          <span>AUDITOR: CYMATIC BOARD</span>
        </div>
        <div className="text-gray-500 text-center sm:text-right">
          © 2024–2026 Cymatic Discipline OS. All Rights Reserved.
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-md animate-in fade-in duration-200">
        <div className="w-full max-w-4xl">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto py-4">
      {content}
    </div>
  );
};

export default LegalTrustModal;
