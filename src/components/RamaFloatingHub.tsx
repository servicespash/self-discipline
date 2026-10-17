/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * RamaFloatingHub - Content-Aware Voice & Dynamic AI Execution Assistant
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  BotMessageSquare,
  X,
  Send,
  Loader2,
  Sparkles,
  Trash2,
  Minus,
  Maximize2,
  Share2,
  Download,
  Copy,
  Check,
  Brain,
  ExternalLink,
  RefreshCw,
  Plus,
  History,
  MessageSquare,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Compass,
  Lock,
  Phone,
  PhoneCall,
  Music,
  Video,
  Camera,
  Radio,
  Sliders,
  ShieldCheck,
  Mail,
  FolderOpen,
  Image as ImageIcon,
  Signal,
  Smartphone,
  Info,
  Layers,
  ChevronRight,
  Eye,
  EyeOff,
  Activity,
  ScanLine,
  Waves,
  Cpu,
  Menu
} from 'lucide-react';
import { DisciplineBridge, SystemLockdownPayload } from '../DisciplineBridge';
import { LocalUserSession } from '../types/session';
import {
  ConversationManager,
  ChatSession,
  Message
} from '../utils/ConversationManager';
import { RamaActionEngine, RamaActionResult } from '../utils/ramaActionEngine';
import { RamaVoice, RamaVoiceState } from '../utils/ramaVoiceService';
import { RamaPermissionsManager, RamaPermissionDefinition, RamaPermissionId } from '../utils/ramaPermissions';
import { InAppMediaService, StreamingPlatform } from '../utils/inAppMediaService';
import { RamaIntentParser } from '../utils/ramaIntentParser';
import { RamaComponentRegistry } from '../utils/ramaComponentRegistry';
import { RamaChatPanel } from './rama/RamaChatPanel';
import CommandCatalog from './CommandCatalog';

interface RamaProps {
  context?: string;
  session?: LocalUserSession | null;
  onClose?: () => void;
}

const MEMORY_STORAGE_KEY = 'cymatic_rama_memory_v1';

export default function RamaFloatingHub({ context = '', session, onClose }: RamaProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const assistantVideoRef = useRef<HTMLVideoElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);

  // User identity
  const userMoniker = useMemo(() => {
    return session?.moniker || 'Architect';
  }, [session]);

  const userEmail = useMemo(() => {
    return session?.email || 'architect@cymatic.local';
  }, [session]);

  // Window states: mode can be 'window' (full card) or 'assistant' (Gemini-style Mini HUD)
  const [displayMode, setDisplayMode] = useState<'window' | 'assistant'>(() => 
    (localStorage.getItem('rama_display_mode') as 'window' | 'assistant') || 'window'
  );
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');

  useEffect(() => {
    localStorage.setItem('rama_display_mode', displayMode);
  }, [displayMode]);

  // Primary Tab state
  const [activeTab, setActiveTab] = useState<'chat' | 'tools' | 'history' | 'memory' | 'permissions'>('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeHubView, setActiveHubView] = useState<{ view: string; data: any }>({ view: 'default', data: null });

  useEffect(() => {
    const unsub = RamaComponentRegistry.subscribe((view, data) => {
      setActiveHubView({ view, data });
    });
    return () => unsub();
  }, []);

  // Video / Camera Preview State
  const [isVideoActive, setIsVideoActive] = useState<boolean>(false);
  const [isVisionSimulation, setIsVisionSimulation] = useState<boolean>(false);
  const [videoSourceType, setVideoSourceType] = useState<'camera' | 'screen'>('camera');
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  // Call Setup Dialog State
  const [showCallModal, setShowCallModal] = useState<boolean>(false);
  const [callNumber, setCallNumber] = useState<string>('');
  const [callCarrier, setCallCarrier] = useState<'SIM 1 (Cellular)' | 'SIM 2 (Secondary SIM)' | 'VoIP / Native Dialer'>('SIM 1 (Cellular)');

  // Message & Email Designer Modal State
  const [showMessageDesigner, setShowMessageDesigner] = useState<boolean>(false);
  const [designerType, setDesignerType] = useState<'whatsapp' | 'sms' | 'email'>('whatsapp');
  const [designerRecipient, setDesignerRecipient] = useState<string>('');
  const [designerSubject, setDesignerSubject] = useState<string>('Cymatic Discipline OS // Executive Dispatch');
  const [designerBody, setDesignerBody] = useState<string>('Discipline is execution without delay. Transmitting operational report.');

  // Image & Device Storage Sharing State
  const [showImageModal, setShowImageModal] = useState<boolean>(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // In-App Music Search Prompt State
  const [showMusicSearch, setShowMusicSearch] = useState<boolean>(false);
  const [musicSearchQuery, setMusicSearchQuery] = useState<string>('');
  const [musicPlatform, setMusicPlatform] = useState<StreamingPlatform>('youtube');

  // Permission Prompt Modal State
  const [permissionPromptTarget, setPermissionPromptTarget] = useState<RamaPermissionDefinition | null>(null);
  const [permissions, setPermissions] = useState<RamaPermissionDefinition[]>(() => RamaPermissionsManager.getAllDefinitions());

  // Voice Listening & Audio TTS State
  const [voiceState, setVoiceState] = useState<RamaVoiceState>(() => RamaVoice.getState());
  const [enableTts, setEnableTts] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Context Management State via ConversationManager
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    return ConversationManager.loadSessions(userMoniker);
  });
  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return ConversationManager.getActiveSessionId(sessions);
  });

  // Memory Vault State
  const [memories, setMemories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(MEMORY_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('[Rama] Memory load error:', e);
    }
    return [
      `User Identity: ${userMoniker} (${userEmail})`,
      'Primary Focus: High-performance architecture and digital discipline',
      'Communication Permission: WhatsApp message dispatch & direct phone dialer granted',
      'In-App Audio: Embedded YouTube, Spotify, and device storage music active',
      'Security Mode: Restrict distracting packages and enforce daily focus windows',
      'Audio Assistant: Responsive to "Hi Rama" and natural voice commands'
    ];
  });
  const [newMemoryText, setNewMemoryText] = useState('');

  // Lockdown State
  const [lockdownState, setLockdownState] = useState<SystemLockdownPayload>(() =>
    DisciplineBridge.getState()
  );

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(memories));
    } catch (e) {
      console.warn('[Rama] Memory save error:', e);
    }
  }, [memories]);

  useEffect(() => {
    const unsubscribe = DisciplineBridge.subscribe((state) => {
      setLockdownState(state);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubVoice = RamaVoice.subscribe((s) => setVoiceState(s));
    const unsubCommand = RamaVoice.onCommand((command) => handleSendMessage(command));
    const unsubWakeWord = (wakeWord: string) => {
      setIsOpen(true);
      setIsMinimized(false);
      setDisplayMode('assistant');
      showToast(`🎙️ Activated by voice wake word "${wakeWord}"`);
    };
    const unsub = RamaVoice.onWakeWord(unsubWakeWord);
    const handleCloseHub = () => setIsOpen(false);
    window.addEventListener('cymatic-close-hub', handleCloseHub);

    return () => {
      unsubVoice();
      unsubCommand();
      unsub();
      window.removeEventListener('cymatic-close-hub', handleCloseHub);
    };
  }, [activeSessionId, sessions, userMoniker]);

  const activeSession = useMemo(() => {
    return (
      sessions.find((s) => s.id === activeSessionId) ||
      sessions[0] || {
        id: 'fallback-session',
        title: 'Tactical Workspace Session',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
        userMoniker
      }
    );
  }, [sessions, activeSessionId, userMoniker]);

  const messages = activeSession.messages;

  const startVideoStream = async (type: 'camera' | 'screen') => {
    if (!RamaPermissionsManager.isGranted('camera_vision')) {
      const def = permissions.find(p => p.id === 'camera_vision');
      if (def) {
        setPermissionPromptTarget(def);
        return;
      }
    }

    if (videoStream) {
      videoStream.getTracks().forEach(t => t.stop());
      setVideoStream(null);
    }

    let stream: MediaStream | null = null;
    let fallbackToSimulated = true;

    try {
      if (type === 'camera') {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false
        });
        fallbackToSimulated = false;
      } else {
        if (navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function') {
          stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
          fallbackToSimulated = false;
        }
      }
    } catch {
      console.info('[Rama] Hardware stream deferred; engaging Optical AI Vision HUD.');
    }

    setIsVideoActive(true);
    setVideoSourceType(type);

    if (stream && !fallbackToSimulated) {
      setVideoStream(stream);
      setIsVisionSimulation(false);
      if (videoRef.current) videoRef.current.srcObject = stream;
      if (assistantVideoRef.current) assistantVideoRef.current.srcObject = stream;
      showToast(`📹 Hardware ${type === 'camera' ? 'Camera' : 'Screen'} preview online.`);
    } else {
      setIsVisionSimulation(true);
      showToast(`📹 Rama Optical AI Vision & Posture HUD active.`);
    }
  };

  const stopVideoStream = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(t => t.stop());
      setVideoStream(null);
    }
    setIsVideoActive(false);
    setIsVisionSimulation(false);
    showToast('Vision stream deactivated.');
  };

  const handleAskAboutScreen = () => {
    const video = videoRef.current || assistantVideoRef.current;
    if (!video || !isVideoActive) {
      showToast('Please start screen share or camera stream first.');
      return;
    }
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setImagePreviewUrl(dataUrl);
        setShowImageModal(true);
        showToast('Screen capture acquired for Rama AI analysis.');
      }
    } catch (e) {
      console.error('[Rama] Screen capture error:', e);
      showToast('Failed to capture screen frame.');
    }
  };

  const handleExecuteCall = () => {
    if (!callNumber.trim()) {
      showToast('Please enter a valid telephone number.');
      return;
    }
    const cleanNum = callNumber.replace(/[^0-9+]/g, '');
    window.location.href = `tel:${cleanNum}`;
    showToast(`Dialing ${cleanNum} via ${callCarrier}...`);
    setShowCallModal(false);
  };

  const handleSendMessageDesigner = () => {
    if (designerType === 'whatsapp') {
      const cleanPhone = designerRecipient.replace(/[^0-9]/g, '');
      const url = cleanPhone
        ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(designerBody)}`
        : `https://api.whatsapp.com/send?text=${encodeURIComponent(designerBody)}`;
      window.open(url, '_blank');
    } else if (designerType === 'sms') {
      window.location.href = `sms:${designerRecipient.replace(/[^0-9+]/g, '')}?body=${encodeURIComponent(designerBody)}`;
    } else if (designerType === 'email') {
      window.location.href = `mailto:${designerRecipient}?subject=${encodeURIComponent(designerSubject)}&body=${encodeURIComponent(designerBody)}`;
    }
    setShowMessageDesigner(false);
  };

  const handleTriggerInAppMusic = (query: string, platform: StreamingPlatform) => {
    InAppMediaService.playTrack(query, platform);
    showToast(`Playing "${query}" inside embedded ${platform.toUpperCase()} player.`);
    setShowMusicSearch(false);
  };

  const getSystemSnapshot = useCallback(() => {
    let tasks: string[] = [];
    try {
      const storedTasks = localStorage.getItem('sdc_local_operations_v2');
      if (storedTasks) {
        const parsed = JSON.parse(storedTasks);
        if (Array.isArray(parsed)) {
          tasks = parsed.filter((t: any) => !t.completed).map((t: any) => t.title);
        }
      }
    } catch {}

    return {
      moniker: userMoniker,
      email: userEmail,
      lockdownActive: lockdownState.active,
      currentView: context || 'Cymatic Discipline OS',
      activeTasks: tasks.slice(0, 5),
      restrictedPackages: lockdownState.restrictedPackages || []
    };
  }, [userMoniker, userEmail, lockdownState, context]);

  const handleSendMessage = async (textToSend?: string) => {
    const rawQuery = (textToSend ?? input).trim();
    if (!rawQuery || isLoading) return;

    const query = rawQuery.replace(
      /^(?:hi|hello|hey)\s+rama\b[,\s:!]*/i,
      ''
    ).trim() || rawQuery;

    const intent = RamaIntentParser.parse(query);

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: rawQuery,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    const newMessages = [...messages, userMsg];
    setSessions(
      ConversationManager.updateSessionMessages(
        activeSessionId,
        newMessages,
        sessions
      )
    );

    if (!textToSend) setInput('');
    setIsLoading(true);

    const appendAssistantMessage = (text: string) => {
      const assistantMsg: Message = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        text,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })
      };

      setSessions(
        ConversationManager.updateSessionMessages(
          activeSessionId,
          [...newMessages, assistantMsg],
          sessions
        )
      );

      if (enableTts) RamaVoice.speak(text.slice(0, 250));
    };

    try {
      // Incomplete commands must be clarified before opening external-app UI.
      if (intent.needsClarification) {
        appendAssistantMessage(
          intent.clarificationPrompt ||
          'I need a little more information before I can carry out that request.'
        );
        return;
      }

      // Preserve the existing confirmation/composer flows for these actions.
      if (intent.actionType === 'CALL_PHONE' && intent.payload) {
        setCallNumber(intent.payload.phone || '');
        setShowCallModal(true);
        return;
      }

      if (intent.actionType === 'SEND_WHATSAPP' && intent.payload) {
        setDesignerType('whatsapp');
        setDesignerRecipient(intent.payload.phone || '');
        setDesignerBody(intent.payload.body || '');
        setShowMessageDesigner(true);
        return;
      }

      // General conversation goes to chat. Never invent a navigation action.
      if (
        intent.actionType === 'GENERAL_CHAT' ||
        !intent.payload
      ) {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: newMessages.map((m) => ({
              role: m.role,
              parts: [{ text: m.text }]
            })),
            userContext: getSystemSnapshot(),
            memory: memories
          })
        });

        if (!res.ok) {
          throw new Error(`Chat service returned HTTP ${res.status}`);
        }

        const data = await res.json();
        if (typeof data.message !== 'string' || !data.message.trim()) {
          throw new Error('Chat service returned an invalid response.');
        }

        appendAssistantMessage(data.message);
        return;
      }

      // Only parsed, explicit actions reach the action engine.
      const actionResult = await RamaActionEngine.executeAction(intent.payload);

      if (actionResult.status === 'succeeded') {
        appendAssistantMessage(
          `🎯 **[ACTION SUCCEEDED: ${actionResult.title}]**\n\n${actionResult.summary}`
        );
      } else {
        const statusLabel = actionResult.status.replace(/_/g, ' ').toUpperCase();
        appendAssistantMessage(
          `**[ACTION ${statusLabel}: ${actionResult.title}]**\n\n${actionResult.summary}`
        );
      }
    } catch (error) {
      const reason = error instanceof Error
        ? error.message
        : 'An unexpected error occurred.';

      appendAssistantMessage(
        `I couldn't complete that request. ${reason}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  /* =========================================================================
     MODE 1: GEMINI-STYLE MINI ASSISTANT HUD
     ========================================================================= */
  if (displayMode === 'assistant') {
    return (
      <div className="fixed bottom-4 right-4 sm:right-6 z-[150] w-[95vw] max-w-md animate-in slide-in-from-bottom-6 duration-200">
        <div className="bg-gray-950/95 border border-emerald-500/50 rounded-3xl p-4 shadow-2xl backdrop-blur-2xl ring-1 ring-emerald-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                Rama AI Assistant
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setDisplayMode('window')}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-900 transition-colors cursor-pointer"
                title="Expand to Full Hub"
              >
                <Maximize2 size={15} />
              </button>
              <button
                type="button"
                onClick={() => { setIsOpen(false); if (onClose) onClose(); }}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-900 transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          <div className="p-3 bg-gray-900/80 rounded-2xl border border-gray-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => RamaVoice.toggleListening()}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                  voiceState.isListening ? 'bg-red-500 text-white shadow-lg animate-pulse' : 'bg-emerald-600 text-gray-950'
                }`}
              >
                {voiceState.isListening ? <Mic size={18} /> : <MicOff size={18} />}
              </button>
              <div className="min-w-0">
                <div className="text-xs font-black text-white truncate">
                  {voiceState.isListening ? (voiceState.transcript || 'Listening...') : 'Say "Hi Rama"'}
                </div>
                <div className="text-[10px] text-gray-400 font-mono truncate">Voice Assistant Standby</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask Rama..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-emerald-500 font-sans"
            />
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={isLoading || !input.trim()}
              className="p-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-gray-950 rounded-xl font-bold cursor-pointer shrink-0"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================================
     MODE 2: FULL FLOATING EXPANDED WINDOW WITH RamaChatPanel
     ========================================================================= */
  return (
    <div
      ref={nodeRef}
      className="fixed bottom-2 right-2 z-[120] w-[calc(100vw-1rem)] sm:bottom-4 sm:right-4 sm:w-[500px] md:w-[600px] h-[min(82dvh,750px)] max-h-[calc(100dvh-1rem)] flex flex-col bg-gray-950/95 border border-gray-800 rounded-3xl shadow-2xl backdrop-blur-2xl ring-1 ring-emerald-500/20 overflow-hidden"
    >
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="absolute top-14 left-4 right-4 z-50 p-2.5 bg-emerald-950/95 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-mono font-bold flex items-center gap-2 animate-in fade-in shadow-xl">
          <Sparkles size={14} className="text-emerald-400 shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="px-4 py-3 bg-gray-900/90 border-b border-gray-800 flex items-center justify-between select-none shrink-0 relative">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => setIsSidebarOpen((open) => !open)}
            aria-label={isSidebarOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isSidebarOpen}
            aria-controls="rama-navigation-drawer"
            className="p-1.5 bg-gray-900 hover:bg-gray-850 border border-gray-800 rounded-xl text-emerald-400 cursor-pointer transition-colors"
          >
            <Menu size={16} />
          </button>
          <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <BotMessageSquare size={17} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-white truncate">Rama AI Assistant</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono font-bold">
                Online
              </span>
            </div>
            <div className="text-[10px] text-gray-400 font-mono truncate">Gemini Architecture Shell</div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setDisplayMode('assistant')}
            className="p-1.5 text-gray-400 hover:text-emerald-400 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
            title="Switch to Mini HUD"
          >
            <Radio size={14} />
          </button>
          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <Minus size={14} />
          </button>
          <button
            type="button"
            onClick={() => { setIsOpen(false); if (onClose) onClose(); }}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {isSidebarOpen && !isMinimized && (
        <>
          <button
            type="button"
            aria-label="Close navigation menu"
            className="absolute inset-0 z-30 bg-black/60"
            onClick={() => setIsSidebarOpen(false)}
          />
          <aside
            id="rama-navigation-drawer"
            aria-label="Rama navigation"
            className="absolute inset-y-0 left-0 z-40 flex w-[min(82vw,290px)] flex-col border-r border-gray-800 bg-gray-950 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-800 px-4 py-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-emerald-400">
                  Rama Workspace
                </p>
                <p className="mt-1 text-[11px] text-gray-500">
                  Navigate assistant features
                </p>
              </div>
              <button
                type="button"
                aria-label="Close navigation menu"
                onClick={() => setIsSidebarOpen(false)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
              >
                <X size={17} />
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {[
                { id: 'chat', label: 'Conversation', icon: MessageSquare },
                { id: 'tools', label: 'Tools & Commands', icon: Sliders },
                { id: 'permissions', label: 'Permissions', icon: ShieldCheck },
                { id: 'history', label: 'Conversation History', icon: History },
                { id: 'memory', label: 'Memory Vault', icon: Brain },
              ].map((item) => {
                const Icon = item.icon;
                const selected = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-current={selected ? 'page' : undefined}
                    onClick={() => {
                      setActiveTab(item.id as typeof activeTab);
                      setIsSidebarOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-colors ${
                      selected
                        ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                        : 'text-gray-300 hover:bg-gray-900 hover:text-white'
                    }`}
                  >
                    <Icon size={17} />
                    <span className="flex-1">{item.label}</span>
                    {selected && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                  </button>
                );
              })}
            </nav>

            <div className="border-t border-gray-800 px-4 py-3 text-[10px] text-gray-500">
              Rama AI Assistant
            </div>
          </aside>
        </>
      )}

      {!isMinimized && (
        <>
          {/* TAB 1: INTEGRATED RamaChatPanel */}
          {activeTab === 'chat' && (
            <div className="flex-1 min-h-0 relative">
              <RamaChatPanel
                messages={messages}
                onSendMessage={handleSendMessage}
                isListening={voiceState.isListening}
                onToggleListening={() => RamaVoice.toggleListening()}
                isProcessing={isLoading}
                userName={userMoniker}
                onTriggerAttachment={() => imageInputRef.current?.click()}
              />
            </div>
          )}

          {/* TAB 2: TOOLS */}
          {activeTab === 'tools' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              <CommandCatalog onExecuteCommand={(cmd) => handleSendMessage(cmd)} />
            </div>
          )}

          {/* TAB 3: PERMISSIONS */}
          {activeTab === 'permissions' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              <div className="space-y-3">
                {permissions.map((perm) => (
                  <div key={perm.id} className="p-3.5 bg-gray-900/90 rounded-2xl border border-gray-800 space-y-1">
                    <div className="text-xs font-bold text-white">{perm.title}</div>
                    <p className="text-[11px] text-gray-300">{perm.detailedDesc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: HISTORY */}
          {activeTab === 'history' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {sessions.map(s => (
                <div
                  key={s.id}
                  onClick={() => { setActiveSessionId(s.id); setActiveTab('chat'); }}
                  className="p-3 rounded-2xl border border-gray-800 bg-gray-900 cursor-pointer text-xs text-white"
                >
                  {s.title || 'Session'} ({s.messages.length} msgs)
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: MEMORY */}
          {activeTab === 'memory' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {memories.map((m, i) => (
                <div key={i} className="p-3 bg-gray-900 rounded-2xl border border-gray-800 text-xs text-gray-200">
                  {m}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
