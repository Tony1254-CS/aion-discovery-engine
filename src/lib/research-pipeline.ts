import { ResearchStage, LogEntry, GraphNode, GraphEdge, Hypothesis } from "./research-types";

// Simulated research pipeline
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

type UpdateCb = (data: {
  stages: ResearchStage[];
  logs: LogEntry[];
  nodes: GraphNode[];
  edges: GraphEdge[];
  hypotheses: Hypothesis[];
  paperReady: boolean;
}) => void;

function rnd(min: number, max: number) {
  return min + Math.random() * (max - min);
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

  const addLog = (text: string, type: LogEntry["type"] = "info") => {
    logs.push({ id: logId++, time: new Date().toLocaleTimeString(), text, type });
  };
  const addNode = (id: string, label: string, type: GraphNode["type"]) => {
    nodes.push({ id, label, type, x: rnd(-3, 3), y: rnd(-3, 3), z: rnd(-2, 2) });
  };
  const emit = () => onUpdate({ stages: [...stages], logs: [...logs], nodes: [...nodes], edges: [...edges], hypotheses: [...hypotheses], paperReady: false });

  const setStage = (id: string, status: ResearchStage["status"], detail?: string) => {
    const s = stages.find((s) => s.id === id)!;
    s.status = status;
    if (detail) s.detail = detail;
  };

  // Stage 1: Literature
  setStage("literature", "active");
  addLog(`Starting research: "${query}"`, "info");
  emit();
  await delay(800);
  if (signal.aborted) return;

  const papers = ["Microplastic accumulation in marine sediments", "Coral-associated bacterial diversity", "Effects of polymer leachates on biofilm formation", "Reef resilience under anthropogenic stress", "Chemotaxis in marine bacteria", "Nanoplastic ingestion by coral polyps"];
  for (let i = 0; i < papers.length; i++) {
    addNode(`paper-${i}`, papers[i], "paper");
    addLog(`Found paper: "${papers[i]}"`, "info");
    if (i > 0) edges.push({ from: `paper-${Math.floor(Math.random() * i)}`, to: `paper-${i}` });
    emit();
    await delay(400);
    if (signal.aborted) return;
  }
  addLog(`Indexed ${papers.length} relevant papers from ArXiv & PubMed`, "success");
  setStage("literature", "done", `${papers.length} papers`);
  emit();

  // Stage 2: Gaps
  setStage("gaps", "active");
  await delay(600);
  if (signal.aborted) return;
  const concepts = ["Microplastic biofilm colonization", "Coral holobiont disruption", "Bacterial chemotaxis alteration"];
  concepts.forEach((c, i) => {
    addNode(`concept-${i}`, c, "concept");
    edges.push({ from: `paper-${i}`, to: `concept-${i}` });
    edges.push({ from: `paper-${i + 1}`, to: `concept-${i}` });
  });
  addLog("Identified 3 key research gaps via semantic clustering", "success");
  setStage("gaps", "done", "3 gaps");
  emit();

  // Stage 3: Hypotheses
  setStage("hypotheses", "active");
  await delay(800);
  if (signal.aborted) return;
  const hyps: Hypothesis[] = [
    { id: 1, title: "Biofilm-Mediated Toxin Transfer", description: "Microplastic surfaces host pathogenic biofilms that transfer toxins to coral tissue.", predictedOutcome: "Increased coral bleaching rate proportional to microplastic density.", approach: "In-vitro biofilm assays + statistical modeling" },
    { id: 2, title: "Chemotaxis Disruption Hypothesis", description: "Polymer leachates interfere with bacterial chemotaxis, reducing symbiont recruitment.", predictedOutcome: "Reduced bacterial motility in leachate-exposed treatments.", approach: "Motility tracking + gradient assays" },
    { id: 3, title: "Immune Suppression via Nanoplastics", description: "Nanoplastic ingestion suppresses coral innate immune pathways.", predictedOutcome: "Downregulation of TLR and complement genes.", approach: "RNA-seq differential expression analysis" },
  ];
  hyps.forEach((h, i) => {
    hypotheses.push(h);
    addNode(`hyp-${i}`, h.title, "hypothesis");
    edges.push({ from: `concept-${i % concepts.length}`, to: `hyp-${i}` });
    addLog(`Hypothesis ${i + 1}: ${h.title}`, "info");
  });
  setStage("hypotheses", "done", "3 hypotheses");
  emit();

  // Stage 4: Code
  setStage("code", "active");
  addLog("Generating Python experiment code for Hypothesis 1…", "info");
  emit();
  await delay(1200);
  if (signal.aborted) return;
  addLog("Code generated: Monte Carlo simulation of biofilm toxin transfer", "success");
  setStage("code", "done");
  emit();

  // Stage 5: Experiments
  setStage("experiments", "active");
  addLog("Executing simulation (5000 iterations)…", "info");
  emit();
  await delay(1500);
  if (signal.aborted) return;
  addLog("Simulation complete. p-value = 0.003, effect size d = 1.24", "success");
  addLog("Generated 3 figures: scatter plot, heatmap, box plot", "success");
  setStage("experiments", "done");
  emit();

  // Stage 6: Paper
  setStage("paper", "active");
  addLog("Composing research paper sections…", "info");
  emit();
  await delay(1000);
  if (signal.aborted) return;
  addLog("Abstract, Introduction, Methods, Results, Discussion, References — all complete", "success");
  setStage("paper", "done");
  addLog("Research paper ready! 🎉", "success");
  onUpdate({ stages: [...stages], logs: [...logs], nodes: [...nodes], edges: [...edges], hypotheses: [...hypotheses], paperReady: true });
}
