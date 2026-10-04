/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * System Main Entry Point & Recovery Runtime Shell
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class SystemErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[System Fault Captured]:', error, errorInfo);
  }

  private handleReset = () => {
    localStorage.removeItem('sdc_discipline_bridge_state');
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center p-6 text-center font-mono">
          <div className="max-w-md w-full bg-gray-900 border border-red-500/30 p-8 rounded-3xl shadow-2xl space-y-6">
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl w-fit mx-auto">
              <ShieldAlert size={36} className="text-red-400" />
            </div>

            <div className="space-y-2">
              <h1 className="text-lg font-black uppercase text-white tracking-wider">
                System Execution Fault
              </h1>
              <p className="text-xs text-red-400 leading-relaxed bg-red-950/40 p-3 rounded-xl border border-red-900/50 break-words text-left">
                {this.state.error?.message || 'An unexpected runtime crash occurred inside the application tree.'}
              </p>
            </div>

            <button
              onClick={this.handleReset}
              className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-950/50"
            >
              <RefreshCw size={16} /> Reset State & Reboot System
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to locate root DOM node.');

createRoot(rootElement).render(
  <React.StrictMode>
    <SystemErrorBoundary>
      <App />
    </SystemErrorBoundary>
  </React.StrictMode>
);
