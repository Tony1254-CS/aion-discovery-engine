import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Upload, ArrowRight, Beaker, BookOpen, Brain, Zap, ArrowUpRight } from "lucide-react";
import ParticleBackground from "@/components/ParticleBackground";
import { useNavigate } from "react-router-dom";

const exampleQueries = [
  { q: "What is the effect of microplastics on coral reef microbiomes?", short: "Microplastics & Coral" },
  { q: "Can we repurpose existing drugs for Alzheimer's treatment?", short: "Drug Repurposing" },
  { q: "How does sleep deprivation affect gene expression in neurons?", short: "Sleep & Genes" },
];

const features = [
  { icon: BookOpen, label: "Literature Review", desc: "Scans thousands of papers" },
  { icon: Brain, label: "Hypothesis Generation", desc: "Novel testable ideas" },
  { icon: Zap, label: "Experiment Execution", desc: "AI-driven analysis" },
];

export default function LandingPage() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleLaunch = () => {
    if (!query.trim()) return;
    navigate("/dashboard", { state: { query: query.trim() } });
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-background">
      <ParticleBackground />

      {/* Nav */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-5 md:px-12"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(var(--aion-gradient-start))] to-[hsl(var(--aion-gradient-end))] flex items-center justify-center">
            <Beaker className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">AION</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/leaderboard")} className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">Leaderboard</button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-medium text-muted-foreground">AI Scientist</span>
          </div>
        </div>
      </motion.nav>

      {/* Hero */}
      <div className="relative z-10 flex flex-col items-center px-4 max-w-3xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card/60 backdrop-blur-sm text-xs font-medium mb-8 shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-foreground">AI-Powered Scientific Discovery</span>
          </motion.div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.08] mb-5">
            From Question to
            <br />
            <span className="aion-gradient-text">Research Paper</span>
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
            Executable Research Pipeline with Automated Validation. AION autonomously reviews literature, generates hypotheses, runs experiments, and writes complete research papers.
          </p>
        </motion.div>

        {/* Input Area */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="w-full glass-panel-elevated p-1.5 mb-6"
        >
          <div className="bg-background/50 rounded-xl p-5">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a scientific question…"
              rows={3}
              className="w-full bg-transparent border-none outline-none resize-none text-foreground placeholder:text-muted-foreground/60 text-base sm:text-lg leading-relaxed font-light"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && query.trim()) { e.preventDefault(); handleLaunch(); } }}
            />
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
              <button className="flex items-center gap-2 text-sm text-muted-foreground/70 hover:text-foreground transition-colors group">
                <Upload className="h-4 w-4 group-hover:text-primary transition-colors" />
                <span className="hidden sm:inline">Upload dataset</span>
              </button>
              <button
                onClick={handleLaunch}
                disabled={!query.trim()}
                className="aion-glow-button aion-pulse flex items-center gap-2.5 disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none text-sm sm:text-base px-6 py-3 sm:px-8 sm:py-3.5"
              >
                Launch Research
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Example Queries */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-wrap justify-center gap-2"
        >
          <span className="text-xs text-muted-foreground/60 mr-1 self-center">Try:</span>
          {exampleQueries.map(({ q, short }, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setQuery(q)}
              className="text-xs px-4 py-2 rounded-xl border border-border bg-card/70 backdrop-blur-sm
                text-foreground/70 hover:text-foreground hover:border-primary/30 hover:bg-accent/50
                transition-all duration-200 flex items-center gap-1.5 shadow-sm"
            >
              {short}
              <ArrowUpRight className="h-3 w-3 opacity-40" />
            </motion.button>
          ))}
        </motion.div>

        {/* Feature badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="flex flex-wrap justify-center gap-8 mt-20"
        >
          {features.map(({ icon: Icon, label, desc }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 + i * 0.1 }}
              className="flex flex-col items-center gap-2 text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-accent/60 flex items-center justify-center mb-1">
                <Icon className="h-4.5 w-4.5 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">{label}</span>
              <span className="text-xs text-muted-foreground">{desc}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
