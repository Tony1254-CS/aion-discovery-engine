import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Beaker, FileText, PanelLeftClose, PanelLeft, Home, Sparkles, Trophy, ChevronRight, FileSpreadsheet } from "lucide-react";
import Timeline from "@/components/Timeline";
import LogPanel from "@/components/LogPanel";
import KnowledgeGraph from "@/components/KnowledgeGraph";
import HypothesisCards from "@/components/HypothesisCards";
import CompetingHypotheses from "@/components/CompetingHypotheses";
import StatisticalOutput from "@/components/StatisticalOutput";
import FailureTransparency from "@/components/FailureTransparency";
import NoveltyScore from "@/components/NoveltyScore";
import AIAvatar from "@/components/AIAvatar";
import HumanCheckpoints from "@/components/HumanCheckpoints";
import { runResearchPipeline, CompetingHyp, Warning, StatResult } from "@/lib/research-pipeline";
import { ResearchStage, LogEntry, GraphNode, GraphEdge, Hypothesis } from "@/lib/research-types";

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const query = (location.state as any)?.query || "What is the effect of microplastics on coral reef microbiomes?";
  const dataset = (location.state as any)?.dataset as { name: string; size: number; data: string; type: string } | null;

  const [stages, setStages] = useState<ResearchStage[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [selectedHyp, setSelectedHyp] = useState<number | null>(null);
  const [paperReady, setPaperReady] = useState(false);
  const [paper, setPaper] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [competingHyps, setCompetingHyps] = useState<CompetingHyp[]>([]);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [stats, setStats] = useState<StatResult | null>(null);
  const [noveltyScore, setNoveltyScore] = useState(0);
  const [closestWork, setClosestWork] = useState("");
  const [noveltyDiff, setNoveltyDiff] = useState("");
  const [selectedCompeting, setSelectedCompeting] = useState<number | undefined>();
  const [autoMode, setAutoMode] = useState(true);
  const abortRef = useRef(new AbortController());

  const currentStage = stages.find(s => s.status === "active")?.id;
  const latestLog = logs.length > 0 ? logs[logs.length - 1].text : undefined;

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
      if (data.competingHypotheses) setCompetingHyps(data.competingHypotheses);
      if (data.warnings) setWarnings(data.warnings);
      if (data.stats) setStats(data.stats);
      if (data.noveltyScore) setNoveltyScore(data.noveltyScore);
      if (data.closestWork) setClosestWork(data.closestWork);
      if (data.noveltyDifference) setNoveltyDiff(data.noveltyDifference);
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
            animate={{ width: 340, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.4, 0, 1] }}
            className="shrink-0 overflow-hidden border-r border-border/60 bg-[hsl(var(--aion-surface))]"
          >
            <div className="p-5 h-full flex flex-col w-[340px] overflow-y-auto scrollbar-thin">
              {/* Logo + Home */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[hsl(var(--aion-gradient-start))] to-[hsl(var(--aion-gradient-end))] flex items-center justify-center glow-ring">
                    <Beaker className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-foreground tracking-tight font-display">AION</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/")}
                  className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  title="Back to Home"
                >
                  <Home className="h-4 w-4" />
                </motion.button>
              </div>

              {/* Query */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-6 glass-panel p-4"
              >
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold mb-2">Research Query</p>
                <p className="text-sm text-foreground leading-relaxed font-light">{query}</p>
              </motion.div>

              {/* Dataset indicator */}
              {dataset && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 }}
                  className="mb-6 glass-panel p-3 flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold">Dataset</p>
                    <p className="text-xs text-foreground truncate">{dataset.name}</p>
                    <p className="text-[10px] text-muted-foreground">{(dataset.size / 1024).toFixed(1)} KB · {dataset.type.toUpperCase()}</p>
                  </div>
                </motion.div>
              )}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mb-6"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold">Progress</p>
                  <p className="text-xs font-mono text-primary font-bold">{Math.round(progress)}%</p>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, hsl(var(--aion-gradient-start)), hsl(var(--aion-gradient-end)), hsl(var(--aion-gradient-accent)))`,
                      backgroundSize: "200% 100%",
                    }}
                    animate={{
                      width: `${progress}%`,
                      backgroundPosition: ["0% 0%", "100% 0%"],
                    }}
                    transition={{
                      width: { duration: 0.5, ease: "easeOut" },
                      backgroundPosition: { duration: 3, repeat: Infinity, ease: "linear" },
                    }}
                  />
                </div>
              </motion.div>

              <Timeline stages={stages} />

              {/* Human-in-the-Loop Checkpoints */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-4"
              >
                <HumanCheckpoints
                  autoMode={autoMode}
                  onToggleAuto={setAutoMode}
                  competingHyps={competingHyps}
                  onSelectHypothesis={setSelectedCompeting}
                  selectedHyp={selectedCompeting}
                  currentStage={currentStage}
                />
              </motion.div>

              {/* Novelty Score */}
              <AnimatePresence>
                {noveltyScore > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4"
                  >
                    <NoveltyScore score={noveltyScore} closestWork={closestWork} difference={noveltyDiff} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Warnings */}
              <AnimatePresence>
                {warnings.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4"
                  >
                    <FailureTransparency warnings={warnings} />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex-1" />

              {/* View Paper + Leaderboard buttons */}
              <div className="space-y-2.5 mt-6">
                <AnimatePresence>
                  {paperReady && (
                    <motion.button
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 15 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => navigate("/paper", { state: { query, paper, competingHyps, warnings, stats, noveltyScore, closestWork, noveltyDiff } })}
                      className="aion-glow-button w-full flex items-center justify-center gap-2.5 text-sm px-4 py-3.5"
                    >
                      <FileText className="h-4 w-4" />
                      View Research Paper
                      <ChevronRight className="h-4 w-4 opacity-60" />
                    </motion.button>
                  )}
                </AnimatePresence>
                <motion.button
                  whileHover={{ scale: 1.01, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate("/leaderboard")}
                  className="w-full flex items-center justify-center gap-2 text-xs px-4 py-2.5 rounded-xl glass-panel text-muted-foreground hover:text-foreground transition-all"
                >
                  <Trophy className="h-3.5 w-3.5" />
                  Challenge Leaderboard
                </motion.button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border/40 bg-[hsl(var(--aion-surface)/0.8)] backdrop-blur-xl">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
          </motion.button>
          <div className="h-4 w-px bg-border/50" />
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-50" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="text-sm font-medium text-foreground">Research Dashboard</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/")}
            className="ml-auto p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Home"
          >
            <Home className="h-4 w-4" />
          </motion.button>
        </div>

        {/* Content grid */}
        <div className="flex-1 p-4 grid grid-rows-[1fr_auto] lg:grid-cols-[1fr_380px] lg:grid-rows-[1fr_auto] gap-4 min-h-0">
          <div className="min-h-[300px] lg:row-span-1">
            <KnowledgeGraph nodes={nodes} edges={edges} />
          </div>
          <div className="lg:row-span-2 overflow-y-auto max-h-[calc(100vh-140px)] scrollbar-thin space-y-4">
            {competingHyps.length > 0 ? (
              <CompetingHypotheses hypotheses={competingHyps} selected={selectedCompeting} onSelect={setSelectedCompeting} />
            ) : (
              <HypothesisCards hypotheses={hypotheses} selected={selectedHyp} onSelect={setSelectedHyp} />
            )}
            {stats && <StatisticalOutput stats={stats} />}
          </div>
          <div className="h-[200px] lg:h-[220px]">
            <LogPanel logs={logs} />
          </div>
        </div>
      </div>

      {/* AI Avatar */}
      <AIAvatar currentStage={currentStage} latestLog={latestLog} />
    </div>
  );
}
