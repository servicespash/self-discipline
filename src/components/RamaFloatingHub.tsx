import { useState, useRef } from 'react';
import Draggable from 'react-draggable';
import { BotMessageSquare, X, Send } from 'lucide-react';

export default function RamaFloatingHub({ context }: { context: string }) {
  const nodeRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', text: string }[]>([
    { role: 'assistant', text: 'Rama here. What do you need to focus on?' }
  ]);
  const [input, setInput] = useState('');

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    
    try {
      // Send to server
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })), { role: 'user', parts: [{ text: `Context: ${context}. Question: ${input}` }] }]
        })
      });
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', text: data.message }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Rama is temporarily unavailable. (Check API quota or connection)' }]);
    }
  };

  return (
    <Draggable nodeRef={nodeRef} handle=".handle">
      <div ref={nodeRef} className="fixed bottom-6 right-6 z-50">
        {!isOpen ? (
          <button onClick={() => setIsOpen(true)} className="p-4 bg-gray-900/80 backdrop-blur-md border border-emerald-500/30 rounded-full text-emerald-400 shadow-2xl">
            <BotMessageSquare size={24} />
          </button>
        ) : (
          <div className="w-80 h-96 bg-gray-900/90 backdrop-blur-md border border-emerald-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="handle p-3 border-b border-gray-800 cursor-grab flex justify-between items-center bg-gray-950">
              <span className="font-bold text-emerald-400">Rama AI</span>
              <button onClick={() => setIsOpen(false)}><X size={18} className="text-gray-400"/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`text-sm ${m.role === 'user' ? 'text-right text-emerald-100' : 'text-left text-gray-300'}`}>
                  {m.text}
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-gray-800 flex gap-2">
              <input 
                value={input} 
                onChange={e => setInput(e.target.value)}
                className="flex-1 bg-gray-800 rounded-lg p-2 text-sm text-white" 
                placeholder="Ask Rama..."
              />
              <button onClick={sendMessage} className="p-2 bg-emerald-600 rounded-lg"><Send size={16}/></button>
            </div>
          </div>
        )}
      </div>
    </Draggable>
  );
}
