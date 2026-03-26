export interface ResearchStage {
  id: string;
  label: string;
  status: "pending" | "active" | "done" | "error";
  detail?: string;
}

export interface LogEntry {
  id: number;
  time: string;
  text: string;
  type: "info" | "success" | "warning" | "error";
}

export interface GraphNode {
  id: string;
  label: string;
  type: "paper" | "concept" | "hypothesis";
  summary?: string;
  x: number;
  y: number;
  z: number;
}

export interface GraphEdge {
  from: string;
  to: string;
}

export interface Hypothesis {
  id: number;
  title: string;
  description: string;
  predictedOutcome: string;
  approach: string;
}

export const STAGES: ResearchStage[] = [
  { id: "literature", label: "Reading Literature", status: "pending" },
  { id: "gaps", label: "Identifying Gaps", status: "pending" },
  { id: "hypotheses", label: "Generating Hypotheses", status: "pending" },
  { id: "code", label: "Writing Code", status: "pending" },
  { id: "experiments", label: "Running Experiments", status: "pending" },
  { id: "paper", label: "Composing Paper", status: "pending" },
];
