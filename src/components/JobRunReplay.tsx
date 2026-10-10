"use client";
import { useEffect, useState } from "react";
import { jobStages, type JobRun, type JobStage } from "@/lib/job-agent";
export default function JobRunReplay({ run }: { run: JobRun }) {
  const duration = run.events.at(-1)?.elapsedMs || 1;
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [selected, setSelected] = useState<JobStage | null>(null);
  useEffect(() => {
    if (!playing) return;
    const start = performance.now() - elapsed;
    const timer = window.setInterval(() => {
      const next = Math.min(duration, performance.now() - start);
      setElapsed(next); if (next === duration) setPlaying(false);
    }, 200);
    return () => window.clearInterval(timer);
  // elapsed is a snapshot when playback starts; changing it should not restart the clock.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, duration]);
  const visible = run.events.filter(event => event.elapsedMs <= elapsed);
  const latest = visible.filter(event => event.status === "complete").at(-1);
  const selectedEvent = selected ? run.events.find(event => event.stage === selected && event.status === "complete") : latest;
  return <section className="recorded-job-run" id="recorded-run" aria-labelledby="recorded-title">
    <div className="replay-heading"><div><p className="section-label">Recorded execution / Real API calls</p><h2 id="recorded-title">From research to an interview plan.</h2></div><span>{(duration / 1000).toFixed(1)}s · {run.model}</span></div>
    <p>Real run of the BYOK workflow. Topify AI research + a clearly hypothetical AI Product Engineer brief + selected public resume evidence. Recorded <time dateTime={run.recordedAt}>{run.recordedAt.slice(0,10)}</time>. Playback makes no API calls.</p>
    <div className="replay-controls"><button type="button" onClick={() => { setSelected(null); if (elapsed >= duration) setElapsed(0); setPlaying(current => !current); }}>{playing ? "Pause replay" : "Play recorded run"}</button><button type="button" onClick={() => { setPlaying(false); setElapsed(duration); setSelected("Interview Plan"); }}>View final plan</button><label>Replay position<input type="range" min={0} max={duration} step={100} value={elapsed} onChange={event => { setPlaying(false); setSelected(null); setElapsed(Number(event.target.value)); }} /></label><span>{(elapsed/1000).toFixed(1)} / {(duration/1000).toFixed(1)}s</span></div>
    <div className="replay-stage-grid" aria-label="Recorded job agent stages">{jobStages.map((stage, index) => {
      const event = visible.filter(event => event.stage === stage).at(-1);
      return <button key={stage} type="button" aria-pressed={selectedEvent?.stage === stage} onClick={() => { setPlaying(false); setSelected(stage); }}><span>0{index+1} / {event?.status || "pending"}</span><strong>{stage}</strong></button>;
    })}</div>
    <article className="replay-output" aria-live={playing ? "off" : "polite"}><h3>{selectedEvent?.stage || "User"} output</h3><p>{selectedEvent?.output || "Press play to replay the recorded execution, or select a stage to inspect its saved result."}</p></article>
    <a href="/projects/ai-job-intelligence/recorded-run.json" download>Download the recorded run (JSON) →</a>
  </section>;
}
