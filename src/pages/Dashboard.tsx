import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Beaker, FileText, PanelLeftClose, PanelLeft } from "lucide-react";
import Timeline from "@/components/Timeline";
import LogPanel from "@/components/LogPanel";
import KnowledgeGraph from "@/components/KnowledgeGraph";
import HypothesisCards from "@/components/HypothesisCards";
import { runResearchPipeline } from "@/lib/research-pipeline";
import { ResearchStage, LogEntry, GraphNode, GraphEdge, Hypothesis } from "@/lib/research-types";

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const query = (location.state as any)?.query || "What is the effect of microplastics on coral reef microbiomes?";

  const [stages, setStages] = useState<ResearchStage[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [selectedHyp, setSelectedHyp] = useState<number | null>(null);
  const [paperReady, setPaperReady] = useState(false);
  const [paper, setPaper] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const abortRef = useRef(new AbortController());

  useEffect(() => {
    abortRef.current = new AbortController();
    runResearchPipeline(query, (data) => {
      setStages(data.stages);
      setLogs(data.logs);
      setNodes(data.nodes);
      setEdges(data.edges);
      setHypotheses(data.hypotheses);
      setPaperReady(data.paperReady);
      if (data.paper) setPaper(data.paper);
    }, abortRef.current.signal);
    return () => abortRef.current.abort();
  }, [query]);

  const progress = stages.length ? (stages.filter((s) => s.status === "done").length / stages.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 0, opacity: sidebarOpen ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="shrink-0 overflow-hidden border-r border-border bg-[hsl(var(--aion-surface))]"
      >
        <div className="p-5 h-full flex flex-col w-[280px]">
          <div className="flex items-center gap-2 mb-6">
            <Beaker className="h-5 w-5 text-primary" />
            <span className="font-bold text-foreground">AION</span>
          </div>
          <div className="mb-6">
            <p className="text-xs text-muted-foreground mb-1">Research Query</p>
            <p className="text-sm text-foreground leading-snug">{query}</p>
          </div>
          <div className="mb-6">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{Math.round(progress)}% complete</p>
          </div>
          <Timeline stages={stages} />
          <div className="flex-1" />
          {paperReady && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => navigate("/paper", { state: { query, paper } })}
              className="aion-glow-button w-full flex items-center justify-center gap-2 text-sm mt-4 px-4 py-3"
            >
              <FileText className="h-4 w-4" />
              View Paper
            </motion.button>
          )}
        </div>
      </motion.aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
            {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
          </button>
          <span className="text-sm font-medium text-foreground">Research Dashboard</span>
        </div>

        <div className="flex-1 p-4 grid grid-rows-[1fr_auto] lg:grid-cols-[1fr_340px] lg:grid-rows-[1fr_auto] gap-4 min-h-0">
          <div className="min-h-[300px] lg:row-span-1">
            <KnowledgeGraph nodes={nodes} edges={edges} />
          </div>
          <div className="lg:row-span-2 overflow-y-auto max-h-[calc(100vh-140px)]">
            <HypothesisCards hypotheses={hypotheses} selected={selectedHyp} onSelect={setSelectedHyp} />
          </div>
          <div className="h-[200px] lg:h-[220px]">
            <LogPanel logs={logs} />
          </div>
        </div>
      </div>
    </div>
  );
}
