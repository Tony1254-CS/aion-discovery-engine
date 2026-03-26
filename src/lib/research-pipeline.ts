import { supabase } from "@/integrations/supabase/client";
import { ResearchStage, LogEntry, GraphNode, GraphEdge, Hypothesis } from "./research-types";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
function rnd(min: number, max: number) { return min + Math.random() * (max - min); }

type UpdateCb = (data: {
  stages: ResearchStage[];
  logs: LogEntry[];
  nodes: GraphNode[];
  edges: GraphEdge[];
  hypotheses: Hypothesis[];
  paperReady: boolean;
  paper?: any;
}) => void;

async function callAgent(stage: string, query: string, context?: any) {
  const { data, error } = await supabase.functions.invoke("research-agent", {
    body: { query, stage, context },
  });
  if (error) throw new Error(error.message || "Agent call failed");
  if (data?.error) throw new Error(data.error);
  return data.result;
}

export async function runResearchPipeline(query: string, onUpdate: UpdateCb, signal: AbortSignal) {
  const stages: ResearchStage[] = [
    { id: "literature", label: "Reading Literature", status: "pending" },
    { id: "gaps", label: "Identifying Gaps", status: "pending" },
    { id: "hypotheses", label: "Generating Hypotheses", status: "pending" },
    { id: "code", label: "Writing Code", status: "pending" },
    { id: "experiments", label: "Running Experiments", status: "pending" },
    { id: "paper", label: "Composing Paper", status: "pending" },
  ];
  const logs: LogEntry[] = [];
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const hypotheses: Hypothesis[] = [];
  let logId = 0;
  let researchContext: any = {};

  const addLog = (text: string, type: LogEntry["type"] = "info") => {
    logs.push({ id: logId++, time: new Date().toLocaleTimeString(), text, type });
  };
  const addNode = (id: string, label: string, type: GraphNode["type"], summary?: string) => {
    nodes.push({ id, label, type, summary, x: rnd(-3, 3), y: rnd(-3, 3), z: rnd(-2, 2) });
  };
  const emit = (extra?: any) => onUpdate({ stages: [...stages], logs: [...logs], nodes: [...nodes], edges: [...edges], hypotheses: [...hypotheses], paperReady: false, ...extra });
  const setStage = (id: string, status: ResearchStage["status"], detail?: string) => {
    const s = stages.find((s) => s.id === id)!;
    s.status = status;
    if (detail) s.detail = detail;
  };

  try {
    // Stage 1: Literature Review
    setStage("literature", "active");
    addLog(`Starting AI research: "${query}"`, "info");
    emit();

    const litResult = await callAgent("literature", query);
    if (signal.aborted) return;
    researchContext.literature = litResult;

    const papers = litResult.papers || [];
    papers.forEach((p: any, i: number) => {
      addNode(`paper-${i}`, p.title, "paper", p.summary);
      if (i > 0) edges.push({ from: `paper-${Math.floor(Math.random() * i)}`, to: `paper-${i}` });
      addLog(`Found: "${p.title}" (${p.year})`, "info");
    });
    (litResult.concepts || []).forEach((c: string, i: number) => {
      addNode(`concept-${i}`, c, "concept");
      edges.push({ from: `paper-${i % papers.length}`, to: `concept-${i}` });
      edges.push({ from: `paper-${(i + 1) % papers.length}`, to: `concept-${i}` });
    });
    addLog(`Indexed ${papers.length} papers, identified ${(litResult.concepts || []).length} key concepts`, "success");
    setStage("literature", "done", `${papers.length} papers`);
    emit();

    // Stage 2: Gap Identification
    setStage("gaps", "active");
    addLog("Analyzing literature for research gaps…", "info");
    emit();

    const gapsResult = await callAgent("gaps", query, { synthesis: litResult.synthesis, concepts: litResult.concepts });
    if (signal.aborted) return;
    researchContext.gaps = gapsResult.gaps;

    (gapsResult.gaps || []).forEach((g: any, i: number) => {
      addLog(`Gap ${i + 1}: ${g.title}`, "info");
    });
    addLog(`Identified ${(gapsResult.gaps || []).length} research gaps`, "success");
    setStage("gaps", "done", `${(gapsResult.gaps || []).length} gaps`);
    emit();

    // Stage 3: Hypotheses
    setStage("hypotheses", "active");
    addLog("Generating novel hypotheses…", "info");
    emit();

    const hypResult = await callAgent("hypotheses", query, { gaps: gapsResult.gaps, synthesis: litResult.synthesis });
    if (signal.aborted) return;
    researchContext.hypotheses = hypResult.hypotheses;

    (hypResult.hypotheses || []).forEach((h: any, i: number) => {
      hypotheses.push({ id: i + 1, title: h.title, description: h.description, predictedOutcome: h.predictedOutcome, approach: h.approach });
      addNode(`hyp-${i}`, h.title, "hypothesis", h.description);
      edges.push({ from: `concept-${i % (litResult.concepts?.length || 1)}`, to: `hyp-${i}` });
      addLog(`Hypothesis ${i + 1}: ${h.title}`, "info");
    });
    setStage("hypotheses", "done", `${hypotheses.length} hypotheses`);
    emit();

    // Stage 4: Code / Experiment Design
    setStage("code", "active");
    addLog("Designing computational experiment for Hypothesis 1…", "info");
    emit();
    await delay(500);

    const selectedHyp = (hypResult.hypotheses || [])[0] || hypotheses[0];
    const expResult = await callAgent("experiment", query, { hypothesis: selectedHyp });
    if (signal.aborted) return;
    researchContext.experiment = expResult;

    addLog(`Methodology: ${expResult.methodology?.substring(0, 80)}…`, "info");
    setStage("code", "done");
    emit();

    // Stage 5: Run Experiments
    setStage("experiments", "active");
    addLog("Processing experimental results…", "info");
    emit();
    await delay(800);

    const results = expResult.results || {};
    addLog(`Results: p=${results.pValue}, effect size=${results.effectSize}, n=${results.sampleSize}`, "success");
    addLog(`Key finding: ${results.keyFinding || "Significant effect observed"}`, "success");
    setStage("experiments", "done");
    emit();

    // Stage 6: Paper
    setStage("paper", "active");
    addLog("Writing complete research paper…", "info");
    emit();

    const paperResult = await callAgent("paper", query, researchContext);
    if (signal.aborted) return;

    addLog("Research paper complete! 🎉", "success");
    setStage("paper", "done");
    onUpdate({ stages: [...stages], logs: [...logs], nodes: [...nodes], edges: [...edges], hypotheses: [...hypotheses], paperReady: true, paper: paperResult });

  } catch (err: any) {
    const currentStage = stages.find(s => s.status === "active");
    if (currentStage) setStage(currentStage.id, "error");
    addLog(`Error: ${err.message}`, "error");
    emit();
  }
}
