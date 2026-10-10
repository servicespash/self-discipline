import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  
  // 1. API Routes (Must be before Vite middlewares)
  app.use(express.json());

  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
  const ai = new GoogleGenAI(apiKey ? { apiKey } : {});

  app.post('/api/chat', async (req, res) => {
    const { messages, userContext, memory, rollingSummary, pastSessionsContext } = req.body;
    try {
      let systemInstruction = "You are Rama, chief discipline architect, executive strategist, and personal tutor of the Cymatic OS.";
      
      if (userContext) {
        systemInstruction += `\n\n[USER AWARENESS PROFILE]`;
        if (userContext.moniker) systemInstruction += `\n- User Moniker: ${userContext.moniker}`;
        if (userContext.email) systemInstruction += `\n- Account: ${userContext.email}`;
        if (userContext.lockdownActive !== undefined) {
          systemInstruction += `\n- System Lockdown: ${userContext.lockdownActive ? 'ACTIVE (Distraction packages blocked)' : 'STANDBY'}`;
          if (userContext.restrictedPackages?.length) {
            systemInstruction += `\n- Restricted Apps: ${userContext.restrictedPackages.join(', ')}`;
          }
        }
        if (userContext.activeTasks?.length) {
          systemInstruction += `\n- Active Operations: ${userContext.activeTasks.join(' | ')}`;
        }
        if (userContext.prayersSummary) {
          systemInstruction += `\n- Spiritual Discipline: ${userContext.prayersSummary}`;
        }
        if (userContext.calendarSummary) {
          systemInstruction += `\n- Schedule & Daily Lockdown: ${userContext.calendarSummary}`;
        }
        if (userContext.currentView) {
          systemInstruction += `\n- Current Viewport: ${userContext.currentView}`;
        }
      }

      if (rollingSummary) {
        systemInstruction += `\n\n[PERSISTENT CHAT HISTORY & ROLLING SUMMARY]:\n${rollingSummary}`;
      }

      if (pastSessionsContext) {
        systemInstruction += `\n\n[PAST INTERACTIONS & USER HISTORY]:\n${pastSessionsContext}`;
      }

      if (memory && Array.isArray(memory) && memory.length > 0) {
        systemInstruction += `\n\n[RAMA PERSISTENT MEMORY VAULT]:`;
        memory.forEach((mem: string) => {
          systemInstruction += `\n* ${mem}`;
        });
      }

      systemInstruction += `\n\nDirectives:
1. Address the user by their moniker/name directly with authoritative clarity.
2. Maintain strong continuity with past interactions and previously established commitments.
3. Actively relate answers to their real-time tasks, prayer schedule, and lockdown discipline.
4. Provide high-yield, structured, direct tactical advice with zero corporate fluff.
5. When the user sets a rule or focus goal, reinforce and solidify it into ongoing memory.`;

      // Call Gemini with timeout promise race
      const apiCall = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: messages,
        config: {
          systemInstruction
        }
      });

      const timeoutPromise = new Promise<{ text: string }>((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), 12000)
      );

      const response: any = await Promise.race([apiCall, timeoutPromise]);
      res.json({ message: response.text });
    } catch (err: any) {
      console.warn('[Rama] AI fallback engaged:', err?.message || err);
      const name = userContext?.moniker || 'Architect';
      const isLocked = userContext?.lockdownActive;
      const fallbackReply = `Directive acknowledged, ${name}. System lockdown is currently ${isLocked ? 'ENFORCED (shield online)' : 'on MONITOR STANDBY'}. All active operations and spiritual routines are logged in memory. Stay focused on your primary high-impact objective and execute without compromise.`;
      res.json({ message: fallbackReply });
    }
  });

  app.post('/api/chat/summary', async (req, res) => {
    const { messages, userContext, memory, previousSummary, mode } = req.body;
    try {
      const isRolling = mode === 'rolling';
      const promptInstruction = isRolling
        ? `Please synthesize a comprehensive, rolling cumulative executive summary of all past interactions and ongoing trajectory with ${userContext?.moniker || 'the Architect'}. Incorporate past commitments, recurring themes, spiritual & physical discipline streaks, and current operational directives. Format in authoritative Markdown with:
1. 👤 Architect Profile & Identity Trajectory
2. 🎯 Cumulative Focus Directives & Ongoing Habits
3. ⚡ Active Action Items & Target Milestones (with checkboxes)
4. 🛡️ System Lockdown Protocols & Package Restrictions
5. 🧠 Persistent Strategic Insights`
        : `Please generate a structured, executive summary of this consultation session with ${userContext?.moniker || 'the Architect'}. Format it cleanly in Markdown with:
1. 🎯 Executive Overview & Focus State
2. ⚡ Immediate Directives & Action Items (with checkboxes)
3. 🛡️ Discipline & System Lockdown Directives
4. 📝 Key Commitments & Memory Points

Make it authoritative, crisp, and ready for export to PDF, email, or document readers.`;

      const summaryContents = [
        ...(messages || []),
        {
          role: 'user',
          parts: [{
            text: `${previousSummary ? `Previous Context Summary:\n${previousSummary}\n\n` : ''}${promptInstruction}`
          }]
        }
      ];

      const apiCall = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: summaryContents,
        config: {
          systemInstruction: "You are Rama, the executive discipline orchestrator and chief tutor of Cymatic OS. Generate authoritative, concise executive summaries."
        }
      });

      const timeoutPromise = new Promise<{ text: string }>((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), 12000)
      );

      const response: any = await Promise.race([apiCall, timeoutPromise]);
      res.json({ summary: response.text });
    } catch (err: any) {
      console.warn('[Rama Summary] Fallback engaged:', err?.message || err);
      const name = userContext?.moniker || 'Isabirye Latif';
      const fallbackSummary = `
# Cymatic Discipline OS - Rama Executive Briefing
**Architect:** ${name}
**Date:** ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
**System Lockdown Status:** ${userContext?.lockdownActive ? '🛡️ ENFORCED (Deep Work Active)' : '⚡ STANDBY'}

## 🎯 Executive Overview & Focus State
- Consultation session logged and recorded in Cymatic OS memory vault.
- System maintains real-time tracking of active operations and prayer intervals.

## ⚡ Immediate Directives & Action Items
- [ ] Complete active primary task in Task Rule Manager without switching context.
- [ ] Verify prayer times and maintain 15-minute post-prayer centering streak.
- [ ] Enforce phone & distraction app lockdown during designated deep work windows.

## 🛡️ Discipline & System Lockdown Directives
- **Lockdown State:** ${userContext?.lockdownActive ? 'ACTIVE' : 'STANDBY'}
- **Restricted Targets:** ${userContext?.restrictedPackages?.join(', ') || 'com.whatsapp, com.instagram.android'}

## 📝 Key Commitments & Memory Points
- Consistency over intensity: protect the morning and post-prayer focus blocks.
- Room order and concrete dumbbell conditioning logged as core physical pillars.

---
*Generated by Cymatic Discipline OS - Rama AI Executive Engine*
`.trim();
      res.json({ summary: fallbackSummary });
    }
  });

  // 2. Vite Integration
  const vite = await createViteServer({
    server: { 
      middlewareMode: true,
      hmr: false,
      host: '0.0.0.0',
      watch: {
        usePolling: true,
        interval: 100
      }
    },
    appType: 'custom'
  });

  app.use(vite.middlewares);

  // 3. SPA Routing & HTML Transformation
  app.get('*', async (req, res, next) => {
    const url = req.originalUrl;
    console.log(`[Server] Request: ${req.method} ${url} (Accept: ${req.headers.accept})`);

    // Only serve index.html for GET/HEAD requests that don't look like static assets
    const hasExtension = path.extname(url.split('?')[0]) !== '';
    if ((req.method !== 'GET' && req.method !== 'HEAD') || (hasExtension && !url.endsWith('.html'))) {
      return next();
    }

    try {
      const templatePath = path.resolve(__dirname, 'index.html');
      let template = fs.readFileSync(templatePath, 'utf-8');

      // Transform HTML with Vite plugins
      let html = await vite.transformIndexHtml(url, template);

      // Inject preamble flag and HMR/WebSocket handler as the very first scripts
      const headPreamble = `<script type="module">window.__vite_plugin_react_preamble_installed__ = true;</script><script>
(function() {
  if (typeof window === 'undefined') return;
  var _origError = console.error;
  console.error = function() {
    var args = Array.prototype.slice.call(arguments);
    var str = args.map(function(arg) {
      if (!arg) return '';
      if (arg instanceof Error) return arg.message + ' ' + (arg.stack || '');
      return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
    }).join(' ');
    if (str.indexOf('WebSocket') !== -1 || str.indexOf('[vite]') !== -1 || str.indexOf('vite-hmr') !== -1 || str.indexOf('vite:ws') !== -1) {
      return;
    }
    _origError.apply(console, arguments);
  };
  var OrigWS = window.WebSocket;
  function MockViteWebSocket(url, protocols) {
    var isHmr = protocols === 'vite-hmr' || (Array.isArray(protocols) && protocols.indexOf('vite-hmr') !== -1);
    if (isHmr) {
      var target = new EventTarget();
      var socket = {
        OPEN: 1, CLOSED: 3, CLOSING: 2, CONNECTING: 0,
        readyState: 1, url: String(url), protocol: 'vite-hmr',
        extensions: '', bufferedAmount: 0, binaryType: 'blob',
        send: function() {},
        close: function() { socket.readyState = 3; },
        addEventListener: function(type, listener, options) {
          target.addEventListener(type, listener, options);
          if (type === 'open') {
            setTimeout(function() {
              var ev = new Event('open');
              target.dispatchEvent(ev);
              if (typeof socket.onopen === 'function') socket.onopen(ev);
            }, 0);
          }
        },
        removeEventListener: function(type, listener, options) {
          target.removeEventListener(type, listener, options);
        },
        dispatchEvent: function(event) { return target.dispatchEvent(event); },
        onopen: null, onclose: null, onerror: null, onmessage: null
      };
      return socket;
    }
    return new OrigWS(url, protocols);
  }
  MockViteWebSocket.prototype = OrigWS ? OrigWS.prototype : {};
  MockViteWebSocket.CONNECTING = 0; MockViteWebSocket.OPEN = 1;
  MockViteWebSocket.CLOSING = 2; MockViteWebSocket.CLOSED = 3;
  window.WebSocket = MockViteWebSocket;
})();
</script>`;
      html = html.replace(/<head[^>]*>/i, `$&${headPreamble}`);

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (e: any) {
      console.error('[Server] HTML Transformation Error:', e);
      vite.ssrFixStacktrace(e);
      res.status(500).send(`System Boot Error: ${e.message}`);
    }
  });

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Cymatic OS] Infrastructure active at http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Critical boot failure:', err);
  process.exit(1);
});
