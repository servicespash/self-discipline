/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * RamaChatPanel: responsive Gemini-inspired conversation interface with professional chat controls.
 */

import React, { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  ArrowUp,
  Bot,
  Check,
  CircleStop,
  ImagePlus,
  Mic,
  MicOff,
  Plus,
  Sparkles,
  LoaderCircle,
  User,
  HelpCircle,
  X,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Pin,
  Archive,
  GitBranch,
  PlusCircle,
  Trash2
} from 'lucide-react';
import type { Message } from '../../utils/ConversationManager';

interface RamaChatPanelProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isListening: boolean;
  onToggleListening: () => void;
  isProcessing: boolean;
  userName: string;
  onTriggerAttachment: () => void;
  pendingClarification?: {
    prompt: string;
    onRespond: (answer: string) => void;
  } | null;
  onNewChat?: () => void;
  onClearChat?: () => void;
  onPinChat?: () => void;
  onArchiveChat?: () => void;
  onBranchChat?: (text: string) => void;
}

const suggestions = [
  {
    title: 'Plan my day',
    description: 'Organize priorities and focus time',
    prompt: 'Help me plan my day around my most important priorities.'
  },
  {
    title: 'Explore an idea',
    description: 'Think through a problem with me',
    prompt: 'Help me analyze an idea and identify its strengths and weaknesses.'
  },
  {
    title: 'Work on a project',
    description: 'Break a task into clear steps',
    prompt: 'Help me break my current project into practical implementation steps.'
  },
  {
    title: 'Review my progress',
    description: 'Reflect and decide what comes next',
    prompt: 'Help me review my progress and identify the next useful step.'
  }
];

export const RamaChatPanel: React.FC<RamaChatPanelProps> = ({
  messages,
  onSendMessage,
  isListening,
  onToggleListening,
  isProcessing,
  userName,
  onTriggerAttachment,
  pendingClarification,
  onNewChat,
  onClearChat,
  onPinChat,
  onArchiveChat,
  onBranchChat
}) => {
  const [inputText, setInputText] = useState('');
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, 'like' | 'dislike'>>({});
  const [thinkingStep, setThinkingStep] = useState<string>('Analyzing request & context...');

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const conversationIsEmpty = messages.length === 0;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end'
    });
  }, [messages, isProcessing, pendingClarification]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    input.style.height = '0px';
    input.style.height = `${Math.min(input.scrollHeight, 160)}px`;
  }, [inputText]);

  useEffect(() => {
    if (!isProcessing) return;
    const steps = [
      'Analyzing request & workspace context...',
      'Querying pro web search & knowledge base...',
      'Synthesizing actionable executive response...'
    ];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % steps.length;
      setThinkingStep(steps[idx]);
    }, 1200);
    return () => clearInterval(interval);
  }, [isProcessing]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const value = inputText.trim();
    if (!value || isProcessing) return;

    setInputText('');

    if (pendingClarification) {
      pendingClarification.onRespond(value);
    } else {
      onSendMessage(value);
    }

    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const handleSuggestion = (prompt: string) => {
    if (!isProcessing) onSendMessage(prompt);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRate = (id: string, rating: 'like' | 'dislike') => {
    setRatings(prev => ({ ...prev, [id]: rating }));
  };

  return (
    <section className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#080b10] text-gray-100">
      {/* Soft ambient background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.10),transparent_68%)]"
      />

      {/* Professional Chat Session Control Bar */}
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-[#0d131d]/80 px-4 py-2 text-xs backdrop-blur-md">
        <div className="flex items-center gap-1.5">
          {onNewChat && (
            <button
              type="button"
              onClick={onNewChat}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
              title="Start a new chat session"
            >
              <PlusCircle size={13} />
              <span>New Chat</span>
            </button>
          )}
          {onPinChat && (
            <button
              type="button"
              onClick={onPinChat}
              className="flex items-center gap-1 rounded-lg bg-white/[0.04] px-2 py-1 text-gray-300 hover:bg-white/[0.08] hover:text-white transition-colors"
              title="Pin session"
            >
              <Pin size={13} />
            </button>
          )}
          {onArchiveChat && (
            <button
              type="button"
              onClick={onArchiveChat}
              className="flex items-center gap-1 rounded-lg bg-white/[0.04] px-2 py-1 text-gray-300 hover:bg-white/[0.08] hover:text-white transition-colors"
              title="Archive session"
            >
              <Archive size={13} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {onClearChat && (
            <button
              type="button"
              onClick={onClearChat}
              className="flex items-center gap-1 rounded-lg bg-red-500/10 px-2 py-1 text-red-300 border border-red-500/20 hover:bg-red-500/20 transition-colors"
              title="Clear current conversation"
            >
              <Trash2 size={13} />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Conversation canvas */}
      <main
        className="relative z-0 min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-smooth"
        aria-label="Rama conversation"
        aria-live="polite"
      >
        <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col px-3 pb-3 pt-3 sm:px-5 sm:pt-5 md:px-7">
          {conversationIsEmpty ? (
            <div className="flex flex-1 flex-col justify-center py-4 sm:py-6">
              <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-[20px] border border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300 shadow-[0_0_48px_rgba(16,185,129,0.10)]">
                <Sparkles size={27} strokeWidth={1.7} />
              </div>

              <p className="mb-2 text-sm font-medium tracking-wide text-emerald-300">
                Your workspace, your direction
              </p>

              <h1 className="max-w-2xl text-3xl font-medium leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
                What are we working on today
                <span className="text-emerald-300">?</span>
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-gray-400 sm:text-base">
                Ask a question, develop an idea, or search the web for live insights.
                Rama maintains full content awareness and live execution authority.
              </p>

              <div className="mt-9 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {suggestions.map((item) => (
                  <button
                    key={item.title}
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleSuggestion(item.prompt)}
                    className="group flex min-h-[94px] flex-col items-start justify-between gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 text-left transition-colors hover:border-emerald-400/30 hover:bg-emerald-400/[0.045] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="text-sm font-medium text-gray-100">
                      {item.title}
                    </span>
                    <span className="flex w-full items-center justify-between gap-3 text-xs text-gray-500">
                      {item.description}
                      <ArrowUp
                        size={15}
                        className="rotate-45 shrink-0 text-gray-600 transition-colors group-hover:text-emerald-300"
                      />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 py-2 sm:gap-5">
              {messages.map((message) => {
                const isUser = message.role === 'user';
                const currentRating = ratings[message.id];
                const isCopied = copiedId === message.id;

                return (
                  <article
                    key={message.id}
                    className={`flex w-full gap-3 sm:gap-4 group ${
                      isUser ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {!isUser && (
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300">
                        <Bot size={17} />
                      </div>
                    )}

                    <div
                      className={`min-w-0 ${
                        isUser
                          ? 'max-w-[88%] sm:max-w-[78%]'
                          : 'max-w-full flex-1'
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2 text-xs text-gray-500">
                        <div className="flex items-center gap-2">
                          <span className={isUser ? 'text-gray-300' : 'text-emerald-300'}>
                            {isUser ? (userName || 'You') : 'Rama'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <time>{message.timestamp}</time>
                        </div>

                        {/* Professional message toolbar on hover */}
                        <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleCopy(message.id, message.text)}
                            className="p-1 rounded hover:bg-white/[0.08] text-gray-400 hover:text-white transition-colors"
                            title="Copy message"
                          >
                            {isCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                          </button>
                          {!isUser && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleRate(message.id, 'like')}
                                className={`p-1 rounded hover:bg-white/[0.08] transition-colors ${currentRating === 'like' ? 'text-emerald-400' : 'text-gray-400 hover:text-white'}`}
                                title="Helpful"
                              >
                                <ThumbsUp size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRate(message.id, 'dislike')}
                                className={`p-1 rounded hover:bg-white/[0.08] transition-colors ${currentRating === 'dislike' ? 'text-red-400' : 'text-gray-400 hover:text-white'}`}
                                title="Not helpful"
                              >
                                <ThumbsDown size={13} />
                              </button>
                            </>
                          )}
                          {onBranchChat && (
                            <button
                              type="button"
                              onClick={() => onBranchChat(message.text)}
                              className="p-1 rounded hover:bg-white/[0.08] text-gray-400 hover:text-white transition-colors"
                              title="Branch conversation from here"
                            >
                              <GitBranch size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div
                        className={
                          isUser
                            ? 'rounded-2xl rounded-br-md border border-emerald-400/15 bg-emerald-400/[0.11] px-3.5 py-2.5 text-[13px] leading-5 text-gray-100 sm:px-4 sm:text-sm sm:leading-6'
                            : 'text-[15px] leading-7 text-gray-200 sm:text-base sm:leading-8'
                        }
                      >
                        <div className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                          {message.text}
                        </div>
                      </div>
                    </div>

                    {isUser && (
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-gray-300">
                        <User size={16} />
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          {pendingClarification && (
            <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-4 sm:p-5">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-amber-300">
                <HelpCircle size={17} />
                A little more information is needed
              </div>
              <p className="text-sm leading-6 text-gray-300">
                {pendingClarification.prompt}
              </p>
            </div>
          )}

          {isProcessing && (
            <div className="mt-6 flex items-center gap-3 self-start rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3 text-sm text-emerald-300 shadow-lg animate-in fade-in">
              <LoaderCircle size={18} className="animate-spin text-emerald-400 shrink-0" />
              <div className="flex flex-col">
                <span className="font-semibold tracking-wide">Rama Executive Engine</span>
                <span className="text-xs text-gray-400 font-mono">{thinkingStep}</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} className="h-2 shrink-0" />
        </div>
      </main>

      {/* Composer stays in the layout instead of covering the conversation */}
      <footer className="relative z-10 shrink-0 border-t border-white/[0.045] bg-[#080b10]/95 px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl sm:px-6 sm:pt-4">
        <div className="mx-auto w-full max-w-4xl">
          {pendingClarification && (
            <div className="mb-2 flex items-center gap-2 text-xs text-amber-300/90">
              <HelpCircle size={14} />
              Answer Rama's clarification to continue.
            </div>
          )}

          {isListening && (
            <div className="mb-2 flex items-center gap-2 text-xs text-emerald-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
              Voice input is active
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="rounded-[25px] border border-white/[0.10] bg-[#111720] p-2 shadow-[0_8px_40px_rgba(0,0,0,0.22)] transition-colors focus-within:border-emerald-400/35"
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === 'Enter' &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              disabled={isProcessing}
              aria-label="Message Rama"
              placeholder={
                pendingClarification
                  ? 'Answer the question...'
                  : 'Ask Rama anything or search the web...'
              }
              className="block max-h-32 min-h-10 w-full resize-none bg-transparent px-3 py-2 text-sm leading-5 text-gray-100 outline-none placeholder:text-gray-500 disabled:opacity-60 sm:px-4"
            />

            <div className="flex items-center justify-between gap-2 px-1 pb-1">
              <div className="relative flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowAttachmentMenu((open) => !open)}
                  aria-label="Attachment options"
                  aria-expanded={showAttachmentMenu}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-white/[0.07] hover:text-white"
                >
                  {showAttachmentMenu ? <X size={19} /> : <Plus size={20} />}
                </button>

                {showAttachmentMenu && (
                  <div className="absolute bottom-12 left-0 z-30 min-w-48 rounded-2xl border border-white/10 bg-[#171e29] p-2 shadow-2xl">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAttachmentMenu(false);
                        onTriggerAttachment();
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-gray-200 hover:bg-white/[0.06]"
                    >
                      <ImagePlus size={17} className="text-emerald-300" />
                      Attach image or file
                    </button>
                  </div>
                )}

                <span className="hidden pl-1 text-xs text-gray-500 sm:inline">
                  Shift + Enter for a new line
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onToggleListening}
                  aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                  className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                    isListening
                      ? 'bg-red-500/15 text-red-300'
                      : 'text-gray-400 hover:bg-white/[0.07] hover:text-white'
                  }`}
                >
                  {isListening ? <MicOff size={19} /> : <Mic size={19} />}
                </button>

                <button
                  type="submit"
                  disabled={!inputText.trim() || isProcessing}
                  aria-label={isProcessing ? 'Processing request' : 'Send message'}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400 text-[#07110d] transition-all hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-white/[0.08] disabled:text-gray-600"
                >
                  {isProcessing ? (
                    <CircleStop size={18} />
                  ) : (
                    <ArrowUp size={21} strokeWidth={2.5} />
                  )}
                </button>
              </div>
            </div>
          </form>

          <p className="px-2 pt-2 text-center text-[10px] leading-4 text-gray-600 sm:text-xs">
            Rama maintains active execution authority and real-time web intelligence.
          </p>
        </div>
      </footer>
    </section>
  );
};

export default RamaChatPanel;
