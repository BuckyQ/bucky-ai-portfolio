import { runAgent } from "@/lib/agent/run";
import { reserveAiOperation } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 120;
export async function POST(request: Request) {
  let query: unknown;
  try {
    if (Number(request.headers.get("content-length")) > 4096) return Response.json({ error: "Query is too large." }, { status: 413 });
    const text = await request.text();
    if (text.length > 4096) return Response.json({ error: "Query is too large." }, { status: 413 });
    query = JSON.parse(text).query;
  } catch { return Response.json({ error: "Invalid research request." }, { status: 400 }); }
  if (typeof query !== "string" || !query.trim() || query.length > 400) return Response.json({ error: "Enter a research query of 1–400 characters." }, { status: 400 });
  if (!process.env.OPENAI_API_KEY) return Response.json({ error: "Research is not configured." }, { status: 503 });
  try {
    const reservation = await reserveAiOperation(request, { namespace: "research", limit: 3, windowSeconds: 86400 });
    if (!reservation.allowed) return Response.json({ error: "Today's research limit has been reached." }, { status: 429, headers: { "Retry-After": String(reservation.retryAfterSeconds) } });
  } catch { return Response.json({ error: "Research is temporarily unavailable. Please try again later." }, { status: 503 }); }
  const controller = new AbortController();
  const signal = AbortSignal.any([request.signal, controller.signal, AbortSignal.timeout(110_000)]);
  const encoder = new TextEncoder();
  const researchQuery = query.trim();
  const stream = new ReadableStream({
    async start(output) {
      const send = (event: string, data: object) => { if (!controller.signal.aborted) output.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)); };
      try {
        const answer = await runAgent(researchQuery, status => send("progress", { status }), signal);
        send("result", { answer });
      } catch {
        send("error", { error: "Research could not complete. Please try again later.", status: "Error" });
      } finally { if (!controller.signal.aborted) output.close(); }
    },
    cancel() { controller.abort(); },
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no" } });
}
