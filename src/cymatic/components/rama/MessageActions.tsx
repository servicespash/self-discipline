import React, { useEffect, useRef, useState } from 'react';
import { Copy, Check, ThumbsUp, ThumbsDown, MoreVertical, MessageSquarePlus, Link2, Share2, Bookmark, Trash2 } from 'lucide-react';

interface Msg { id: string; role: string; text: string; timestamp: string }

interface Props {
  message: Msg;
  onReferenceInNewChat: (m: Msg) => void;
  onDelete: (m: Msg) => void;
  onNotify: (text: string) => void;
}

const FEEDBACK_KEY = 'cymatic_rama_feedback_v1';
const SAVED_KEY = 'cymatic_rama_saved_messages_v1';

function readJson<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || '') ?? fallback; } catch { return fallback; }
}

/** Per-message toolbar: copy, like/dislike, and an overflow menu. Every action reports its real outcome. */
export default function MessageActions({ message, onReferenceInNewChat, onDelete, onNotify }: Props) {
  const [copied, setCopied] = useState(false);
  const [vote, setVote] = useState<'up' | 'down' | null>(null);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVote(readJson<Record<string, 'up' | 'down'>>(FEEDBACK_KEY, {})[message.id] ?? null);
  }, [message.id]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      onNotify(`${label} copied.`);
      return true;
    } catch {
      onNotify('Copy failed: clipboard access was blocked by the device.');
      return false;
    }
  };

  const setFeedback = (v: 'up' | 'down') => {
    const next = vote === v ? null : v;
    const all = readJson<Record<string, string>>(FEEDBACK_KEY, {});
    if (next) all[message.id] = next; else delete all[message.id];
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(all));
    setVote(next);
  };

  const link = () => `${window.location.origin}${window.location.pathname}#/dashboard?rama_msg=${encodeURIComponent(message.id)}`;

  const share = async () => {
    setOpen(false);
    if (navigator.share) {
      try { await navigator.share({ title: 'Rama', text: message.text }); onNotify('Message shared.'); }
      catch (e: any) { if (e?.name !== 'AbortError') onNotify('Sharing failed on this device.'); }
    } else {
      await copyText(message.text, 'Sharing isn’t supported here, so the message was');
    }
  };

  const save = () => {
    setOpen(false);
    const saved = readJson<Msg[]>(SAVED_KEY, []);
    if (saved.some((m) => m.id === message.id)) { onNotify('Message is already saved.'); return; }
    localStorage.setItem(SAVED_KEY, JSON.stringify([message, ...saved]));
    onNotify('Message saved on this device.');
  };

  const btn = 'p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer';
  const item = 'w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-200 hover:bg-gray-800 text-left cursor-pointer';

  return (
    <div className="flex items-center gap-0.5 mt-1 relative" ref={menuRef}>
      <button type="button" className={btn} title="Like" aria-label="Like"
        onClick={() => setFeedback('up')}>
        <ThumbsUp size={14} className={vote === 'up' ? 'text-emerald-400 fill-emerald-400/30' : ''} />
      </button>
      <button type="button" className={btn} title="Dislike" aria-label="Dislike"
        onClick={() => setFeedback('down')}>
        <ThumbsDown size={14} className={vote === 'down' ? 'text-red-400 fill-red-400/30' : ''} />
      </button>
      <button type="button" className={btn} title="Copy" aria-label="Copy message"
        onClick={async () => { if (await copyText(message.text, 'Message')) { setCopied(true); setTimeout(() => setCopied(false), 1500); } }}>
        {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
      </button>
      <button type="button" className={btn} title="More" aria-label="More actions" onClick={() => setOpen((o) => !o)}>
        <MoreVertical size={14} />
      </button>
      <span className="text-[9px] font-mono text-gray-500 ml-1">{message.timestamp}</span>

      {open && (
        <div className="absolute left-0 bottom-full mb-1 z-50 w-56 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl py-1">
          <button type="button" className={item} onClick={() => { setOpen(false); onReferenceInNewChat(message); }}>
            <MessageSquarePlus size={14} /> Reference in new chat
          </button>
          <button type="button" className={item} onClick={() => { setOpen(false); copyText(link(), 'Message link'); }}>
            <Link2 size={14} /> Copy message link
          </button>
          <button type="button" className={item} onClick={share}><Share2 size={14} /> Share message</button>
          <button type="button" className={item} onClick={save}><Bookmark size={14} /> Save message</button>
          <button type="button" className={`${item} text-red-300`} onClick={() => { setOpen(false); onDelete(message); onNotify('Message deleted.'); }}>
            <Trash2 size={14} /> Delete message
          </button>
        </div>
      )}
    </div>
  );
}
