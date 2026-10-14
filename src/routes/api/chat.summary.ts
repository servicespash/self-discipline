import { createFileRoute } from "@tanstack/react-router";
import { streamChatText, GatewayError } from "@/lib/ai-gateway.server";

export const Route = createFileRoute("/api/chat/summary")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body: any = await request.json().catch(() => ({}));
        try {
const { messages, userContext, previousSummary, mode } = body;
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

      const summary = await streamChatText(summaryContents, "You are Rama, the executive discipline orchestrator and chief tutor of Cymatic OS. Generate authoritative, concise executive summaries.");
          return Response.json({ summary });
        } catch (err: any) {
          const status = err instanceof GatewayError ? err.status : 500;
          console.error("[Rama]", status, err?.message);
          return Response.json({ error: err?.message || "AI request failed" }, { status });
        }
      },
    },
  },
});
