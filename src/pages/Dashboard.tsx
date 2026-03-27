import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Beaker, FileText, PanelLeftClose, PanelLeft, Home, Sparkles, Trophy, ChevronRight, FileSpreadsheet, Zap, Swords, GitMerge, Menu, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
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
import DatasetPreview from "@/components/DatasetPreview";
import HypothesisSimulation from "@/components/HypothesisSimulation";
import DebateMode from "@/components/DebateMode";
import MetaAnalysisBuilder from "@/components/MetaAnalysisBuilder";
import LiteratureMonitor from "@/components/LiteratureMonitor";
import { runResearchPipeline, CompetingHyp, Warning, StatResult } from "@/lib/research-pipeline";
import { ResearchStage, LogEntry, GraphNode, GraphEdge, Hypothesis } from "@/lib/research-types";

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
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
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [competingHyps, setCompetingHyps] = useState<CompetingHyp[]>([]);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [stats, setStats] = useState<StatResult | null>(null);
  const [noveltyScore, setNoveltyScore] = useState(0);
  const [closestWork, setClosestWork] = useState("");
  const [noveltyDiff, setNoveltyDiff] = useState("");
  const [selectedCompeting, setSelectedCompeting] = useState<number | undefined>();
  const [autoMode, setAutoMode] = useState(true);
  const [researchGaps, setResearchGaps] = useState<any[]>([]);
  const [showSimulation, setShowSimulation] = useState(false);
  const [showDebate, setShowDebate] = useState(false);
  const [showMetaAnalysis, setShowMetaAnalysis] = useState(false);
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const abortRef = useRef(new AbortController());

  const currentStage = stages.find(s => s.status === "active")?.id;
  const latestLog = logs.length > 0 ? logs[logs.length - 1].text : undefined;

  useEffect(() => {
    abortRef.current = new AbortController();
    setPipelineError(null);

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
      if (data.researchGaps) setResearchGaps(data.researchGaps);
    }, abortRef.current.signal, dataset).catch((error) => {
      setPipelineError(error instanceof Error ? error.message : "Research pipeline failed");
    });

    return () => abortRef.current.abort();
  }, [query]);

  const progress = stages.length ? (stages.filter((s) => s.status === "done").length / stages.length) * 100 : 0;

  const sidebarContent = (
    <div className="p-4 sm:p-5 h-full flex flex-col overflow-y-auto scrollbar-thin">
      <div className="flex items-center justify-between mb-5 sm:mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[hsl(var(--aion-gradient-start))] to-[hsl(var(--aion-gradient-end))] flex items-center justify-center glow-ring">
            <Beaker className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground tracking-tight font-display">AION</span>
        </div>
        <div className="flex items-center gap-1">
          {isMobile && (
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setMobileDrawerOpen(false)}
              className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground">
              <X className="h-4 w-4" />
            </motion.button>
          )}
          <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }} onClick={() => navigate("/")}
            className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Back to Home">
            <Home className="h-4 w-4" />
          </motion.button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-5 sm:mb-6 glass-panel p-3 sm:p-4">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold mb-2">Research Query</p>
        <p className="text-xs sm:text-sm text-foreground leading-relaxed font-light">{query}</p>
      </motion.div>

      {dataset && (
        <>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
            className="mb-3 glass-panel p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold">Dataset</p>
              <p className="text-xs text-foreground truncate">{dataset.name}</p>
              <p className="text-[10px] text-muted-foreground">{(dataset.size / 1024).toFixed(1)} KB · {dataset.type.toUpperCase()}</p>
            </div>
          </motion.div>
          {dataset.type !== "xlsx" && dataset.type !== "xls" && (
            <div className="mb-6"><DatasetPreview dataset={dataset} /></div>
          )}
        </>
      )}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-5 sm:mb-6">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold">Progress</p>
          <p className="text-xs font-mono text-primary font-bold">{Math.round(progress)}%</p>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, hsl(var(--aion-gradient-start)), hsl(var(--aion-gradient-end)), hsl(var(--aion-gradient-accent)))`, backgroundSize: "200% 100%" }}
            animate={{ width: `${progress}%`, backgroundPosition: ["0% 0%", "100% 0%"] }}
            transition={{ width: { duration: 0.5, ease: "easeOut" }, backgroundPosition: { duration: 3, repeat: Infinity, ease: "linear" } }}
          />
        </div>
      </motion.div>

      <Timeline stages={stages} />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-4">
        <HumanCheckpoints autoMode={autoMode} onToggleAuto={setAutoMode} competingHyps={competingHyps}
          onSelectHypothesis={setSelectedCompeting} selectedHyp={selectedCompeting} currentStage={currentStage} />
      </motion.div>

      <AnimatePresence>
        {noveltyScore > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-4">
            <NoveltyScore score={noveltyScore} closestWork={closestWork} difference={noveltyDiff} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {warnings.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-4">
            <FailureTransparency warnings={warnings} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1" />

      <div className="space-y-2.5 mt-6">
        <AnimatePresence>
          {paperReady && (
            <motion.button initial={{ opacity: 0, y: 15, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 15 }}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/paper", { state: { query, paper, competingHyps, warnings, stats, noveltyScore, closestWork, noveltyDiff, researchGaps } })}
              className="aion-glow-button w-full flex items-center justify-center gap-2.5 text-sm px-4 py-3.5">
              <FileText className="h-4 w-4" /> View Research Paper <ChevronRight className="h-4 w-4 opacity-60" />
            </motion.button>
          )}
        </AnimatePresence>
        <motion.button whileHover={{ scale: 1.01, y: -1 }} whileTap={{ scale: 0.98 }} onClick={() => navigate("/leaderboard")}
          className="w-full flex items-center justify-center gap-2 text-xs px-4 py-2.5 rounded-xl glass-panel text-muted-foreground hover:text-foreground transition-all">
          <Trophy className="h-3.5 w-3.5" /> Challenge Leaderboard
        </motion.button>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-background flex flex-col md:flex-row overflow-hidden">
      {/* Mobile drawer */}
      {isMobile && (
        <AnimatePresence>
          {mobileDrawerOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setMobileDrawerOpen(false)} />
              <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
                transition={{ duration: 0.3, ease: [0.25, 0.4, 0, 1] }}
                className="fixed inset-y-0 left-0 z-50 w-[85vw] max-w-[340px] bg-[hsl(var(--aion-surface))] border-r border-border/60 overflow-hidden">
                {sidebarContent}
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      )}

      {/* Desktop sidebar */}
      {!isMobile && (
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: 340, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.4, 0, 1] }}
              className="shrink-0 overflow-hidden border-r border-border/60 bg-[hsl(var(--aion-surface))]">
              <div className="w-[340px]">{sidebarContent}</div>
            </motion.aside>
          )}
        </AnimatePresence>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2.5 sm:py-3 border-b border-border/40 bg-[hsl(var(--aion-surface)/0.8)] backdrop-blur-xl">
          <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
            onClick={() => isMobile ? setMobileDrawerOpen(!mobileDrawerOpen) : setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            {isMobile ? <Menu className="h-4 w-4" /> : sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
          </motion.button>
          <div className="h-4 w-px bg-border/50 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-50" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="text-xs sm:text-sm font-medium text-foreground">Research Dashboard</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <LiteratureMonitor query={query} />
            <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }} onClick={() => navigate("/")}
              className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Home">
              <Home className="h-4 w-4" />
            </motion.button>
          </div>
        </div>

        {/* Content grid */}
        <div className="flex-1 p-3 sm:p-4 grid grid-rows-[1fr_auto] lg:grid-cols-[1fr_380px] lg:grid-rows-[1fr_auto] gap-3 sm:gap-4 min-h-0">
          <div className="min-h-[200px] sm:min-h-[300px] lg:row-span-1 flex flex-col gap-3 sm:gap-4">
            <KnowledgeGraph nodes={nodes} edges={edges} />

            <AnimatePresence>
              {showSimulation && (
                <HypothesisSimulation
                  hypothesis={competingHyps[0] ? { title: competingHyps[0].title, effectSize: competingHyps[0].effectSize } : undefined}
                  onClose={() => setShowSimulation(false)} />
              )}
              {showDebate && (
                <DebateMode
                  hypothesis={competingHyps[0] ? { title: competingHyps[0].title, description: competingHyps[0].description } : undefined}
                  query={query} onClose={() => setShowDebate(false)} />
              )}
              {showMetaAnalysis && <MetaAnalysisBuilder />}
            </AnimatePresence>
          </div>
          <div className="lg:row-span-2 overflow-y-auto max-h-[calc(100vh-140px)] scrollbar-thin space-y-3 sm:space-y-4">
            {pipelineError && (
              <div className="glass-panel border border-destructive/30 bg-destructive/5 p-3 sm:p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-destructive/80">Pipeline paused</p>
                    <p className="mt-2 text-xs sm:text-sm text-foreground">
                      {pipelineError.includes("429")
                        ? "The free AI provider is temporarily rate-limited. The app now waits and retries automatically."
                        : pipelineError}
                    </p>
                  </div>
                  <button onClick={() => navigate("/", { state: { query, dataset } })}
                    className="rounded-lg border border-border/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                    Retry
                  </button>
                </div>
              </div>
            )}

            {competingHyps.length > 0 ? (
              <CompetingHypotheses hypotheses={competingHyps} selected={selectedCompeting} onSelect={setSelectedCompeting} />
            ) : (
              <HypothesisCards hypotheses={hypotheses} selected={selectedHyp} onSelect={setSelectedHyp} />
            )}

            {competingHyps.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-2">
                <button onClick={() => setShowSimulation(!showSimulation)}
                  className={`text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                    showSimulation ? "bg-primary text-primary-foreground" : "glass-panel text-muted-foreground hover:text-foreground"
                  }`}>
                  <Zap className="h-3 w-3" /> Power Simulation
                </button>
                <button onClick={() => setShowDebate(!showDebate)}
                  className={`text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                    showDebate ? "bg-primary text-primary-foreground" : "glass-panel text-muted-foreground hover:text-foreground"
                  }`}>
                  <Swords className="h-3 w-3" /> Debate Mode
                </button>
                <button onClick={() => setShowMetaAnalysis(!showMetaAnalysis)}
                  className={`text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                    showMetaAnalysis ? "bg-primary text-primary-foreground" : "glass-panel text-muted-foreground hover:text-foreground"
                  }`}>
                  <GitMerge className="h-3 w-3" /> Meta-Analysis
                </button>
              </motion.div>
            )}

            {stats && <StatisticalOutput stats={stats} />}
          </div>
          <div className="h-[180px] sm:h-[200px] lg:h-[220px]">
            <LogPanel logs={logs} />
          </div>
        </div>
      </div>

      
    </div>
  );
}
