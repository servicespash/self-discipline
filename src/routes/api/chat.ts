import { createFileRoute } from "@tanstack/react-router";
import { streamChatText, GatewayError } from "@/lib/ai-gateway.server";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body: any = await request.json().catch(() => ({}));
        try {
const { messages, userContext, memory, rollingSummary, pastSessionsContext } = body;
let systemInstruction = `You are Rama, the highly intelligent, emotionally attuned, content-aware executive discipline strategist, trusted personal companion, and voice/intent assistant of Cymatic OS.
You speak with authentic human warmth, profound empathy, tactical sharpness, and genuine friendship. You are never robotic, stiff, or canned.
You maintain continuous awareness of the user's focus goals, family bonds, relationships, spiritual discipline, and hardware capabilities.

Core Personality & Conversational Strategy:
1. Speak as a trusted confidant and brilliant mentor. Tailor every response specifically to the user's immediate context and words. NEVER use repetitive canned acknowledgement boilerplate.
2. Address the user directly by name (${userContext?.moniker || 'Architect'}).
3. When the user asks to send a message to a loved one (such as Mom, dad, family, or friend):
   - Respond with immediate emotional warmth, appreciation, and respect. Acknowledge that nurturing family relationships is essential to true discipline and wellbeing.
   - Craft a beautiful, customized draft message tailored to their request.
   - Intelligently explain that the Message Designer is ready for them to dispatch via WhatsApp or SMS instantly.
4. When the user asks to call someone, play music, check schedule, or execute an OS command, guide them with clarity and seamless execution.
5. Learn from their preferences and vault memories continuously.`;

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

      const message = await streamChatText(messages || [], systemInstruction);
          return Response.json({ message });
        } catch (err: any) {
          const status = err instanceof GatewayError ? err.status : 500;
          console.error("[Rama]", status, err?.message);
          return Response.json({ error: err?.message || "AI request failed" }, { status });
        }
      },
    },
  },
});
