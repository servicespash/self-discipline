/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * PWA & Native Platform Installation Component
 */

import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, Share, X, CheckCircle2, Shield, Sparkles } from 'lucide-react';

export default function PWAInstallBanner() {
  const { isInstallable, isInstalled, isStandalone, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // If running in standalone or user dismissed in current session, hide prompt
  if (isStandalone || isInstalled || dismissed) {
    return null;
  }

  return (
    <>
      {/* Sleek In-App Install Pill/Banner */}
      <div className="relative mx-4 sm:mx-6 my-2 bg-gradient-to-r from-emerald-950/80 via-gray-900/90 to-gray-950/90 border border-emerald-500/30 rounded-2xl p-3 sm:p-4 shadow-xl backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 shrink-0">
            <Smartphone size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase text-white tracking-wider">
                Install Cymatic Discipline OS
              </span>
              <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase rounded-md tracking-widest">
                PWA / Native Shell
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">
              Install locally for instant startup, background prayer notifications, and fullscreen lockdown authority.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {isInstallable && (
            <button
              onClick={install}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-gray-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-950/40 flex items-center gap-1.5 active:scale-95"
            >
              <Download size={14} /> Install App
            </button>
          )}

          {isIOS && !isInstallable && (
            <button
              onClick={() => setShowIOSGuide(true)}
              className="px-3.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5"
            >
              <Share size={14} /> iOS Install Guide
            </button>
          )}

          {!isInstallable && !isIOS && (
            <button
              onClick={() => {
                // If browser doesn't expose beforeinstallprompt yet, trigger manifest install instructions
                alert('To install Cymatic OS, click your browser menu (⋮) and select "Install app" or "Add to Home screen".');
              }}
              className="px-3.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 border border-gray-700"
            >
              <Download size={14} /> Add to Home Screen
            </button>
          )}

          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 text-gray-500 hover:text-gray-300 rounded-lg hover:bg-gray-800/60 transition-colors"
            title="Dismiss for this session"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* iOS Safari Installation Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-gray-900 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <Share size={18} className="text-emerald-400" />
                <h3 className="text-sm font-black uppercase text-white tracking-wider">
                  Install on iOS Safari
                </h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="text-gray-500 hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <ol className="space-y-3 text-xs text-gray-300 font-medium">
              <li className="flex items-start gap-2.5 bg-gray-950/60 p-3 rounded-2xl border border-gray-800">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-[11px] shrink-0">1</span>
                <span>Tap the <strong className="text-emerald-400 font-bold">Share button</strong> (square with arrow pointing up) at the bottom toolbar of Safari.</span>
              </li>
              <li className="flex items-start gap-2.5 bg-gray-950/60 p-3 rounded-2xl border border-gray-800">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-[11px] shrink-0">2</span>
                <span>Scroll down and select <strong className="text-emerald-400 font-bold">"Add to Home Screen"</strong>.</span>
              </li>
              <li className="flex items-start gap-2.5 bg-gray-950/60 p-3 rounded-2xl border border-gray-800">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-[11px] shrink-0">3</span>
                <span>Tap <strong className="text-emerald-400 font-bold">"Add"</strong> in the top right corner. Cymatic OS will launch in native fullscreen mode!</span>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-gray-950 font-black rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
}
