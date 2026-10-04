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

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || '',
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
  });

  app.post('/api/chat', async (req, res) => {
    const { messages } = req.body;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: messages,
        config: {
          systemInstruction: "You are Rama, a strict, no-nonsense AI consultant for self-discipline and room organization."
        }
      });
      res.json({ message: response.text });
    } catch (err: any) {
      console.error('AI error:', err);
      res.status(500).json({ message: 'Rama is temporarily offline.' });
    }
  });

  // 2. Vite Integration
  const vite = await createViteServer({
    server: { 
      middlewareMode: true,
      host: '0.0.0.0',
      watch: {
        usePolling: true,
        interval: 100
      },
      /*
      hmr: {
        // Handle HMR in proxied environments
        clientPort: 443,
        path: '/@vite/hmr'
      }
      */
    },
    appType: 'custom'
  });

  app.use(vite.middlewares);

  // 3. SPA Routing & HTML Transformation
  app.get('*', async (req, res, next) => {
    const url = req.originalUrl;
    console.log(`[Server] Request: ${req.method} ${url} (Accept: ${req.headers.accept})`);

    // Only serve index.html for GET requests that don't look like static assets
    const hasExtension = path.extname(url.split('?')[0]) !== '';
    if (req.method !== 'GET' || (hasExtension && !url.endsWith('.html'))) {
      return next();
    }

    try {
      const templatePath = path.resolve(__dirname, 'index.html');
      let template = fs.readFileSync(templatePath, 'utf-8');

      // Transform HTML with Vite plugins
      let html = await vite.transformIndexHtml(url, template);

      // Inject preamble flag as the very first script
      html = html.replace(
        /<head[^>]*>/i,
        '$&<script type="module">window.__vite_plugin_react_preamble_installed__ = true;</script>'
      );

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
