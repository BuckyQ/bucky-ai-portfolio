"use client";
import { useEffect, useRef, useState } from "react";
import { jobStages, runJobAgent, type JobEvent } from "@/lib/job-agent";
export default function JobAgentDemo() {
  const [key, setKey] = useState("");
  const [company, setCompany] = useState("");
  const [job, setJob] = useState("");
  const [resume, setResume] = useState("");
  const [events, setEvents] = useState<JobEvent[]>([]);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  return <section className="job-live-demo" id="run-agent" aria-labelledby="job-live-title"><p className="section-label">Live workflow / Bring your own key</p><h2 id="job-live-title">Run an interview-preparation workflow.</h2><p>Your key goes directly from this browser to OpenAI. This website never receives or stores it. OpenAI API charges apply to your account; a run makes six model calls and one web search. Documents are sent to OpenAI; avoid confidential or sensitive information. The key is cleared from the form when a run starts.</p>
    <form onSubmit={async event => {
      event.preventDefault(); if (running) return;
      const runKey = key; setKey(""); setEvents([]); setAnswer(""); setError(""); setRunning(true);
      const abort = new AbortController(); controller.current = abort;
      try { const result = await runJobAgent({ company, job, resume }, runKey, next => setEvents(current => [...current, next]), AbortSignal.any([abort.signal, AbortSignal.timeout(180000)])); setAnswer(result.answer); }
      catch (cause) { setError(cause instanceof Error && cause.name === "AbortError" ? "Run cancelled." : cause instanceof Error ? cause.message : "Run failed."); }
      finally { controller.current = null; setRunning(false); }
    }}>
      <label>OpenAI API key<input type="password" autoComplete="off" value={key} onChange={event => setKey(event.target.value)} required disabled={running} /></label>
      <label>Company name or official URL<input value={company} maxLength={400} onChange={event => setCompany(event.target.value)} required disabled={running} /></label>
      <div className="job-input-documents"><label>Job description<textarea value={job} maxLength={12000} onChange={event => setJob(event.target.value)} required disabled={running} rows={5} /></label><label>Resume evidence<textarea value={resume} maxLength={12000} onChange={event => setResume(event.target.value)} required disabled={running} rows={5} /></label></div>
      <div className="job-run-actions"><button type="submit" disabled={running}>{running ? "Running…" : "Run with my key"}</button>{running ? <button type="button" onClick={() => controller.current?.abort()}>Cancel</button> : null}</div>
    </form>
    {events.length > 0 ? <ol className="job-progress" aria-label="Job agent execution progress" aria-live="polite">{jobStages.map(stage => { const last = events.filter(event => event.stage === stage).at(-1); return <li key={stage}>{stage}<span>{last?.status === "complete" ? "Complete" : last?.status === "running" ? "Running" : "Pending"}</span></li>; })}</ol> : null}
    {error ? <p role="alert">{error}</p> : null}
    {answer ? <article className="job-final"><h3>Interview plan</h3><p>{answer}</p></article> : null}
    {events.filter(event => event.status === "complete" && event.output && event.stage !== "Interview Plan").map(event => <details key={event.stage}><summary>{event.stage} output</summary><p className="job-stage-output">{event.output}</p></details>)}
  </section>;
}
