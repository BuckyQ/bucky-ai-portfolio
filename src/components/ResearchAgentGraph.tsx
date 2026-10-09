"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, StepForward } from "lucide-react";

type NodeId = "state" | "decide" | "route" | "continue" | "search" | "replan" | "generate";
const nodes: { id: NodeId; label: string; detail: string; x: number; y: number }[] = [
  { id: "state", label: "Shared state", detail: "Query, plan, evidence, analyses, current step, attempts, and answer live in one AgentState.", x: 50, y: 9 },
  { id: "decide", label: "Model decision", detail: "getDecision returns an action and a confidence score using a shared Zod schema.", x: 50, y: 30 },
  { id: "route", label: "Confidence gate", detail: "resolveDecision accepts scores ≥ 0.6. Lower scores route to REPLAN.", x: 50, y: 51 },
  { id: "continue", label: "CONTINUE", detail: "Execute one planned web-search or analysis step, then advance currentStep.", x: 12.5, y: 78 },
  { id: "search", label: "SEARCH_MORE", detail: "Create a targeted query, search the web, and append the new evidence.", x: 37.5, y: 78 },
  { id: "replan", label: "REPLAN", detail: "Replace the remaining plan and reset currentStep to zero.", x: 62.5, y: 78 },
  { id: "generate", label: "GENERATE", detail: "Write an answer from evidence and analyses, then leave the loop.", x: 87.5, y: 78 },
];
type Frame = { node: NodeId; round: number; evidence: number; analyses: number; step: number; confidence: string; message: string; answer?: boolean };
const frames: Frame[] = [
  { node: "state", round: 1, evidence: 0, analyses: 0, step: 0, confidence: "—", message: "Start with a question and a two-step plan covering features only." },
  { node: "decide", round: 1, evidence: 0, analyses: 0, step: 0, confidence: "0.92", message: "The plan has an unexecuted search step. Decision: CONTINUE." },
  { node: "route", round: 1, evidence: 0, analyses: 0, step: 0, confidence: "0.92", message: "Confidence meets the 0.6 threshold. Accept CONTINUE." },
  { node: "continue", round: 1, evidence: 1, analyses: 0, step: 1, confidence: "0.92", message: "Run the feature search, append one evidence item, and advance the step." },
  { node: "state", round: 2, evidence: 1, analyses: 0, step: 1, confidence: "—", message: "The updated state returns to the decision layer." },
  { node: "decide", round: 2, evidence: 1, analyses: 0, step: 1, confidence: "0.88", message: "The next planned step analyzes the feature evidence. Decision: CONTINUE." },
  { node: "route", round: 2, evidence: 1, analyses: 0, step: 1, confidence: "0.88", message: "Accept CONTINUE and dispatch the analysis step." },
  { node: "continue", round: 2, evidence: 1, analyses: 1, step: 2, confidence: "0.88", message: "Store the analysis and advance beyond the initial plan." },
  { node: "state", round: 3, evidence: 1, analyses: 1, step: 2, confidence: "—", message: "Features are covered. Pricing and production limitations still need evidence." },
  { node: "decide", round: 3, evidence: 1, analyses: 1, step: 2, confidence: "0.85", message: "The model selects SEARCH_MORE to fill the missing coverage." },
  { node: "route", round: 3, evidence: 1, analyses: 1, step: 2, confidence: "0.85", message: "Accept SEARCH_MORE." },
  { node: "search", round: 3, evidence: 2, analyses: 1, step: 2, confidence: "0.85", message: "Generate a targeted follow-up query and append its search evidence." },
  { node: "state", round: 4, evidence: 2, analyses: 1, step: 2, confidence: "—", message: "Return with more evidence and an exhausted initial plan." },
  { node: "decide", round: 4, evidence: 2, analyses: 1, step: 2, confidence: "0.42", message: "The model suggests GENERATE, but reports low confidence." },
  { node: "route", round: 4, evidence: 2, analyses: 1, step: 2, confidence: "0.42", message: "0.42 is below 0.6. Override the proposed action with REPLAN." },
  { node: "replan", round: 4, evidence: 2, analyses: 1, step: 0, confidence: "0.42", message: "Replace the plan with remaining work and reset the step pointer." },
  { node: "state", round: 5, evidence: 2, analyses: 1, step: 0, confidence: "—", message: "The fifth round sees the same evidence and the revised plan." },
  { node: "decide", round: 5, evidence: 2, analyses: 1, step: 0, confidence: "0.91", message: "For this illustrative trace, the model judges the evidence sufficient and selects GENERATE." },
  { node: "route", round: 5, evidence: 2, analyses: 1, step: 0, confidence: "0.91", message: "Accept GENERATE. A revised plan does not force its steps to execute." },
  { node: "generate", round: 5, evidence: 2, analyses: 1, step: 0, confidence: "0.91", message: "Generate the final answer and stop. If no answer existed, the CLI would use best-effort fallback generation.", answer: true },
];

export default function ResearchAgentGraph() {
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [selected, setSelected] = useState<NodeId | null>(null);
  const container = useRef<HTMLDivElement>(null);
  const frame = frames[cursor];
  const complete = cursor === frames.length - 1;
  const activeNode = nodes.find((node) => node.id === frame.node)!;

  useEffect(() => {
    if (!playing || complete) return;
    const timer = window.setInterval(() => setCursor((value) => Math.min(value + 1, frames.length - 1)), 1500);
    const pauseWhenHidden = () => { if (document.hidden) setPlaying(false); };
    document.addEventListener("visibilitychange", pauseWhenHidden);
    const observer = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) setPlaying(false); });
    if (container.current) observer.observe(container.current);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", pauseWhenHidden); observer.disconnect(); };
  }, [playing, complete]);

  const detail = nodes.find((node) => node.id === (selected ?? frame.node));
  return (
    <div ref={container} className={`research-graph ${playing && !complete ? "is-playing" : ""}`} id="agent-graph">
      <div className="research-graph-toolbar">
        <div><span className="research-graph-label">Interactive walkthrough</span><p>Illustrative trace · no live API calls</p></div>
        <div className="research-graph-controls">
          <button onClick={() => { if (complete) setCursor(0); setPlaying(!playing || complete); }}>
            {playing && !complete ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}{playing && !complete ? "Pause" : complete ? "Replay" : "Play"}
          </button>
          <button disabled={complete} onClick={() => { setPlaying(false); setCursor((value) => Math.min(value + 1, frames.length - 1)); }}><StepForward aria-hidden="true" />Step</button>
          <button onClick={() => { setPlaying(false); setCursor(0); setSelected(null); }}><RotateCcw aria-hidden="true" />Reset</button>
        </div>
      </div>
      <div className="research-graph-canvas" aria-label="Agent control flow; select a node to inspect its responsibility">
        <svg viewBox="0 0 1000 500" preserveAspectRatio="none" aria-hidden="true" className="research-graph-edges">
          <path d="M500 65 V135 M500 170 V240 M500 275 V325 M125 370 V325 H875 V370 M375 325 V370 M625 325 V370" />
          <path className="research-return-edge" d="M125 415 V465 H625 V415 M375 415 V465 M125 465 H30 V45 H400" />
          <path className={"research-active-edge " + frame.node} d={frame.node === "state" ? "M30 465 V45 H400" : frame.node === "decide" ? "M500 65 V135" : frame.node === "route" ? "M500 170 V240" : `M500 275 V325 H${activeNode.x * 10} V370`} />
        </svg>
        {nodes.map((node, index) => (
          <button key={node.id} className={`research-node research-node-${node.id} ${frame.node === node.id ? "is-active" : ""}`} style={{left: `${node.x}%`, top: `${node.y}%`}} aria-pressed={selected === node.id} onClick={() => setSelected(node.id)}>
            <span>{String(index + 1).padStart(2, "0")}</span><strong>{node.label}</strong><small>{node.id === "state" ? "Memory" : node.id === "decide" ? "Structured output" : node.id === "route" ? "Threshold ≥ 0.6" : node.id === "generate" ? "Answer → exit" : "Update → loop"}</small>
          </button>
        ))}
        <span className="research-loop-caption">Actions update state → next round</span>
      </div>
      <div className="research-graph-readout">
        <div className="research-trace"><span className="research-graph-label">Round {frame.round} / 5 · frame {cursor + 1} / {frames.length}</span><p role="status" aria-live={playing && !complete ? "off" : "polite"}>{frame.message}</p><div className="research-progress" aria-hidden="true"><span style={{width:`${(cursor + 1) / frames.length * 100}%`}} /></div></div>
        <dl className="research-state">{[["Evidence",frame.evidence],["Analyses",frame.analyses],["Current step",frame.step],["Confidence",frame.confidence],["Answer",frame.answer ? "Ready" : "Pending"]].map(([key,value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>
      </div>
      <div className="research-node-detail"><span className="research-graph-label">{selected ? "Inspecting" : "Active node"} / {detail?.label}</span><p>{detail?.detail}</p>{selected && <button onClick={() => setSelected(null)}>Follow active node</button>}</div>
    </div>
  );
}
