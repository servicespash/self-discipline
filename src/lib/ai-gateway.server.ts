// Server-only helper: streams a chat completion from Lovable AI Gateway and returns the full text.
type GeminiMsg = { role: string; parts?: { text?: string }[] };

export class GatewayError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function streamChatText(messages: GeminiMsg[], system: string): Promise<string> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new GatewayError(500, "AI is not configured");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      stream: true,
      store: false,
      reasoning: { effort: "low" },
      instructions: system,
      input: [
        ...messages.map((m) => ({
          role: m.role === "assistant" || m.role === "model" ? "assistant" : "user",
          content: (m.parts ?? []).map((p) => p.text ?? "").join("\n"),
        })),
      ],
    }),
  });
  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => "");
    throw new GatewayError(res.status, body || `AI request failed (${res.status})`);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let out = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      const t = line.trim();
      if (!t.startsWith("data:")) continue;
      const data = t.slice(5).trim();
      if (data === "[DONE]") continue;
      try {
        const ev = JSON.parse(data);
        if (ev.type === "response.output_text.delta") out += ev.delta ?? "";
      } catch {
        /* partial */
      }
    }
  }
  return out;
}
