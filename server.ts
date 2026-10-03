import express from 'express';
import { GoogleGenAI } from '@google/genai';
import vite from 'vite';

const app = express();
app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
});

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: messages,
    config: {
      systemInstruction: "You are Rama, a strict, no-nonsense AI consultant for self-discipline and room organization. You provide direct, actionable advice to keep the user focused on their goals."
    }
  });
  res.json({ message: response.text });
});

app.listen(3000, () => console.log('Server running on port 3000'));
