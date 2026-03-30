import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Upload, ArrowRight, Beaker, BookOpen, Brain, Zap, ArrowUpRight, Microscope, FlaskConical, Trophy, X, FileSpreadsheet, AlertCircle, BellRing, Lightbulb, Info } from "lucide-react";
import ParticleBackground from "@/components/ParticleBackground";
import AionShowcase from "@/components/landing/AionShowcase";
import LiteratureMonitor from "@/components/LiteratureMonitor";
import IdeaReview from "@/components/IdeaReview";
import { useNavigate } from "react-router-dom";

const exampleQueries = [
  { q: "What is the effect of microplastics on coral reef microbiomes?", short: "Microplastics & Coral", icon: Microscope },
  { q: "Can we repurpose existing drugs for Alzheimer's treatment?", short: "Drug Repurposing", icon: FlaskConical },
  { q: "How does sleep deprivation affect gene expression in neurons?", short: "Sleep & Genes", icon: Brain },
];

const features = [
  { icon: BookOpen, label: "Literature Review", desc: "Scans thousands of papers in seconds" },
  { icon: Brain, label: "Hypothesis Engine", desc: "Generates competing testable hypotheses" },
  { icon: Zap, label: "Auto Validation", desc: "AI-driven experiments & statistical analysis" },
];

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.5 } } },
  item: { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } } },
};

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
const ACCEPTED_TYPES = ".csv,.json,.xlsx,.xls,.tsv";

export default function LandingPage() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [activeTab, setActiveTab] = useState<"research" | "review">("research");
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number; data: string; type: string } | null>(null);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError("");
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 100MB.`);
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["csv", "json", "xlsx", "xls", "tsv"].includes(ext || "")) {
      setUploadError("Unsupported format. Use CSV, JSON, TSV, or Excel.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setUploadedFile({
        name: file.name,
        size: file.size,
        data: result,
        type: ext || "csv",
      });
    };

    if (ext === "xlsx" || ext === "xls") {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setUploadError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleLaunch = () => {
    if (!query.trim()) return;
    navigate("/dashboard", { state: { query: query.trim(), dataset: uploadedFile } });
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center overflow-x-hidden bg-background mesh-gradient-bg">
      <ParticleBackground />

      {/* ─── Frosted Nav ─── */}
      <motion.nav
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/40"
      >
        <div className="mx-auto max-w-5xl flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-[hsl(var(--aion-violet))] flex items-center justify-center glow-ring">
              <Beaker className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight text-foreground font-display">AION</span>
          </div>
          <div className="flex items-center gap-4">
            <LiteratureMonitor />
            <button
              onClick={() => navigate("/leaderboard")}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-300 px-3 py-1.5 rounded-lg hover:bg-secondary/60"
            >
              <Trophy className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Leaderboard</span>
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel text-[11px]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--aion-cyan))] opacity-50" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[hsl(var(--aion-cyan))]" />
              </span>
              <span className="font-medium text-muted-foreground">Online</span>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* ─── Hero ─── */}
      <div className="relative min-h-screen flex flex-col items-center justify-center w-full">
        <div className="relative z-10 flex flex-col items-center px-5 max-w-3xl w-full">
          <motion.div
            variants={stagger.container}
            initial="hidden"
            animate="show"
            className="text-center mb-16"
          >
            <motion.div
              variants={stagger.item}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-[11px] font-medium mb-10 tracking-wide"
            >
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="text-muted-foreground">Executable Research Pipeline</span>
            </motion.div>

            <motion.h1
              variants={stagger.item}
              className="text-[clamp(2.5rem,8vw,5.5rem)] font-extrabold tracking-[-0.03em] text-white leading-[1.05] mb-7 font-display"
            >
              From Question
              <br />
              to <span className="aion-gradient-text">Discovery</span>
            </motion.h1>

            <motion.p
              variants={stagger.item}
              className="text-muted-foreground text-[clamp(0.95rem,2.5vw,1.15rem)] max-w-md mx-auto leading-relaxed font-light"
            >
              Executable Research Pipeline with Automated Validation & Next‑Step Suggestions
            </motion.p>
          </motion.div>

          {/* ─── Tab Toggle ─── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="flex items-center gap-1 p-1 rounded-2xl glass-panel mb-6 self-center"
          >
            <button
              onClick={() => setActiveTab("research")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 ${
                activeTab === "research"
                  ? "bg-primary/20 text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Research Query
            </button>
            <button
              onClick={() => setActiveTab("review")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 ${
                activeTab === "review"
                  ? "bg-primary/20 text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
              }`}
            >
              <Lightbulb className="h-3.5 w-3.5" />
              Idea Review
            </button>
          </motion.div>

          {/* ─── Input Area ─── */}
          <AnimatePresence mode="wait">
            {activeTab === "research" ? (
          <motion.div
            key="research-input"
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className={`w-full glass-panel-hero p-[5px] mb-6 transition-all duration-700 ${
              focused ? "glow-ring-strong" : ""
            }`}
          >
            <div className="bg-background/25 rounded-[calc(1.5rem-3px)] p-5 sm:p-6">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Ask a scientific question…"
                rows={3}
                className="w-full bg-transparent border-none outline-none resize-none text-white placeholder:text-muted-foreground/35 text-base sm:text-lg leading-relaxed font-light"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && query.trim()) { e.preventDefault(); handleLaunch(); }
                }}
              />
              {/* Uploaded file display */}
              {uploadedFile && (
                <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-primary/[0.06] border border-primary/10">
                  <FileSpreadsheet className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{uploadedFile.name}</p>
                    <p className="text-[10px] text-muted-foreground">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button onClick={removeFile} className="p-1 rounded-lg hover:bg-white/[0.06] text-muted-foreground hover:text-foreground transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {uploadError && (
                <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-destructive/[0.08] border border-destructive/15">
                  <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                  <p className="text-[11px] text-destructive">{uploadError}</p>
                </div>
              )}

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.04]">
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_TYPES}
                    onChange={handleFileUpload}
                    className="hidden"
                    id="dataset-upload"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 text-sm text-muted-foreground/60 hover:text-foreground transition-colors duration-300 group px-3 py-1.5 rounded-lg hover:bg-white/[0.04]"
                  >
                    <Upload className="h-4 w-4 group-hover:text-primary transition-colors duration-300" />
                    <span className="hidden sm:inline">{uploadedFile ? "Change file" : "Upload dataset"}</span>
                  </button>
                  <span className="text-[9px] text-muted-foreground/30 hidden sm:inline">CSV, JSON, TSV · Max 100MB</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleLaunch}
                  disabled={!query.trim()}
                  className="aion-glow-button aion-pulse flex items-center gap-2.5 disabled:opacity-15 disabled:cursor-not-allowed disabled:shadow-none disabled:animate-none text-sm sm:text-base px-6 py-3 sm:px-8 sm:py-3.5"
                >
                  Launch Research
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </motion.button>
              </div>
            </div>
          </motion.div>
            ) : (
              <motion.div
                key="review-input"
                initial={{ opacity: 0, y: 35 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="w-full mb-6"
              >
                <IdeaReview />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Example Queries ─── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.4 }}
            className="flex flex-wrap justify-center gap-2"
          >
            <span className="text-[11px] text-muted-foreground/30 mr-1 self-center">Try:</span>
            {exampleQueries.map(({ q, short, icon: QIcon }, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 + i * 0.1 }}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setQuery(q)}
                className="text-[11px] px-3.5 py-2 rounded-xl glass-panel
                  text-muted-foreground hover:text-foreground
                  transition-all duration-300 flex items-center gap-1.5"
              >
                <QIcon className="h-3 w-3 text-primary/40" />
                {short}
                <ArrowUpRight className="h-2.5 w-2.5 opacity-20" />
              </motion.button>
            ))}
          </motion.div>

          {/* ─── Feature Pills ─── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.8 }}
            className="flex flex-wrap justify-center gap-8 sm:gap-12 md:gap-16 mt-20 sm:mt-28"
          >
            {features.map(({ icon: Icon, label, desc }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.9 + i * 0.12, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -3, transition: { duration: 0.3 } }}
                className="flex flex-col items-center gap-3.5 text-center group cursor-default"
              >
                <div
                  className="w-12 h-12 rounded-2xl border border-white/[0.06] bg-white/[0.03] flex items-center justify-center
                    group-hover:border-primary/20 group-hover:bg-primary/[0.06] transition-all duration-500 float-gentle"
                  style={{ animationDelay: `${i * 1.2}s` }}
                >
                  <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors duration-500" />
                </div>
                <span className="text-[13px] font-semibold text-white/90">{label}</span>
                <span className="text-[11px] text-muted-foreground max-w-[140px] font-light leading-relaxed">{desc}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ─── Showcase ─── */}
      <AionShowcase />

      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent pointer-events-none z-[5]" />
    </div>
  );
}
