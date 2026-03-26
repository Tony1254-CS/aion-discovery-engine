import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Beaker, FileText, PanelLeftClose, PanelLeft, ArrowLeft, Home, Sparkles } from "lucide-react";
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
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="shrink-0 overflow-hidden border-r border-border bg-[hsl(var(--aion-surface))]"
          >
            <div className="p-6 h-full flex flex-col w-[300px]">
              {/* Logo + Back */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(var(--aion-gradient-start))] to-[hsl(var(--aion-gradient-end))] flex items-center justify-center">
                    <Beaker className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-foreground tracking-tight">AION</span>
                </div>
                <button
                  onClick={() => navigate("/")}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  title="Back to Home"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              </div>

              {/* Query */}
              <div className="mb-8">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-semibold mb-2">Research Query</p>
                <p className="text-sm text-foreground leading-relaxed font-light">{query}</p>
              </div>

              {/* Progress */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-semibold">Progress</p>
                  <p className="text-xs font-mono text-primary font-semibold">{Math.round(progress)}%</p>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[hsl(var(--aion-gradient-start))] to-[hsl(var(--aion-gradient-end))]"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>

              <Timeline stages={stages} />

              <div className="flex-1" />

              {/* View Paper Button */}
              <AnimatePresence>
                {paperReady && (
                  <motion.button
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15 }}
                    onClick={() => navigate("/paper", { state: { query, paper } })}
                    className="aion-glow-button w-full flex items-center justify-center gap-2.5 text-sm mt-4 px-4 py-3.5"
                  >
                    <FileText className="h-4 w-4" />
                    View Research Paper
                    <Sparkles className="h-3.5 w-3.5 opacity-70" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border bg-[hsl(var(--aion-surface))]">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
          </button>
          <div className="h-4 w-px bg-border" />
          <span className="text-sm font-medium text-foreground">Research Dashboard</span>
          {!sidebarOpen && (
            <button
              onClick={() => navigate("/")}
              className="ml-auto p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Home
            </button>
          )}
        </div>

        {/* Content grid */}
        <div className="flex-1 p-4 grid grid-rows-[1fr_auto] lg:grid-cols-[1fr_360px] lg:grid-rows-[1fr_auto] gap-4 min-h-0">
          <div className="min-h-[300px] lg:row-span-1">
            <KnowledgeGraph nodes={nodes} edges={edges} />
          </div>
          <div className="lg:row-span-2 overflow-y-auto max-h-[calc(100vh-140px)] scrollbar-thin">
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
