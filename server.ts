import 'dotenv/config';
import express from 'express';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
});

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: messages,
      config: {
        systemInstruction: "You are Rama, a strict, no-nonsense AI consultant for self-discipline and room organization. You provide direct, actionable advice to keep the user focused on their goals."
      }
    });
    res.json({ message: response.text });
  } catch (err: any) {
    console.error('AI chat error:', err);
    res.status(500).json({ message: 'Rama is temporarily unavailable. (Check API quota or connection)' });
  }
});

app.listen(3001, '0.0.0.0', () => {
  console.log('API Server running on http://localhost:3001');
});
