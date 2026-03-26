import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Upload, ArrowRight, Beaker, BookOpen, Brain, Zap, ArrowUpRight, Microscope, FlaskConical, Trophy } from "lucide-react";
import ParticleBackground from "@/components/ParticleBackground";
import AionShowcase from "@/components/landing/AionShowcase";
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
  container: { hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.4 } } },
  item: { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.4, 0, 1] } } },
};

export default function LandingPage() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const navigate = useNavigate();

  const handleLaunch = () => {
    if (!query.trim()) return;
    navigate("/dashboard", { state: { query: query.trim() } });
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center overflow-hidden bg-background mesh-gradient-bg">
      <ParticleBackground />

      {/* Nav */}
      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-5 md:px-12"
      >
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.08 }}
            transition={{ duration: 0.3 }}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-[hsl(var(--aion-gradient-start))] to-[hsl(var(--aion-gradient-end))] flex items-center justify-center glow-ring"
          >
            <Beaker className="h-4 w-4 text-primary-foreground" />
          </motion.div>
          <span className="text-lg font-bold tracking-tight text-foreground font-display">AION</span>
        </div>
        <div className="flex items-center gap-5">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/leaderboard")}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-300 px-3 py-1.5 rounded-lg hover:bg-secondary/60"
          >
            <Trophy className="h-3.5 w-3.5" />
            Leaderboard
          </motion.button>
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-full glass-panel text-xs">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-50" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
            </span>
            <span className="font-medium text-muted-foreground">Online</span>
          </div>
        </div>
      </motion.nav>

      {/* Hero */}
      <div className="relative min-h-screen flex flex-col items-center justify-center w-full">
        <div className="relative z-10 flex flex-col items-center px-4 max-w-3xl w-full">
          <motion.div
            variants={stagger.container}
            initial="hidden"
            animate="show"
            className="text-center mb-14"
          >
            <motion.div
              variants={stagger.item}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-xs font-medium mb-10"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">Executable Research Pipeline</span>
            </motion.div>
            <motion.h1
              variants={stagger.item}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-foreground leading-[1.02] mb-7 font-display"
            >
              From Question
              <br />
              to <span className="aion-gradient-text">Discovery</span>
            </motion.h1>
            <motion.p
              variants={stagger.item}
              className="text-muted-foreground text-base sm:text-lg max-w-lg mx-auto leading-relaxed font-light"
            >
              AION autonomously reviews literature, generates hypotheses,
              runs experiments, and writes research papers — in minutes.
            </motion.p>
          </motion.div>

          {/* Input */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8, ease: [0.25, 0.4, 0, 1] }}
            className={`w-full glass-panel-hero p-1.5 mb-6 transition-all duration-700 ${
              focused ? "glow-ring-strong" : ""
            }`}
          >
            <div className="bg-background/30 rounded-[1.25rem] p-5 sm:p-6">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Ask a scientific question…"
                rows={3}
                className="w-full bg-transparent border-none outline-none resize-none text-foreground placeholder:text-muted-foreground/40 text-base sm:text-lg leading-relaxed font-light"
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && query.trim()) { e.preventDefault(); handleLaunch(); } }}
              />
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/20">
                <button className="flex items-center gap-2 text-sm text-muted-foreground/50 hover:text-foreground transition-colors duration-300 group px-3 py-1.5 rounded-lg hover:bg-secondary/50">
                  <Upload className="h-4 w-4 group-hover:text-primary transition-colors duration-300" />
                  <span className="hidden sm:inline">Upload dataset</span>
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleLaunch}
                  disabled={!query.trim()}
                  className="aion-glow-button aion-pulse flex items-center gap-2.5 disabled:opacity-20 disabled:cursor-not-allowed disabled:shadow-none disabled:animate-none text-sm sm:text-base px-6 py-3 sm:px-8 sm:py-3.5"
                >
                  Launch Research
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Example Queries */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="flex flex-wrap justify-center gap-2"
          >
            <span className="text-xs text-muted-foreground/40 mr-1 self-center">Try:</span>
            {exampleQueries.map(({ q, short, icon: QIcon }, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 + i * 0.1 }}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setQuery(q)}
                className="text-xs px-4 py-2 rounded-xl glass-panel
                  text-muted-foreground hover:text-foreground hover:border-primary/20
                  transition-all duration-300 flex items-center gap-1.5"
              >
                <QIcon className="h-3 w-3 text-primary/50" />
                {short}
                <ArrowUpRight className="h-3 w-3 opacity-20" />
              </motion.button>
            ))}
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.6 }}
            className="flex flex-wrap justify-center gap-10 sm:gap-14 mt-24"
          >
            {features.map(({ icon: Icon, label, desc }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.7 + i * 0.12, duration: 0.6 }}
                whileHover={{ y: -3, transition: { duration: 0.25 } }}
                className="flex flex-col items-center gap-3 text-center group cursor-default"
              >
                <div className="w-12 h-12 rounded-2xl bg-secondary/80 border border-border/50 flex items-center justify-center
                  group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-500 float-gentle"
                  style={{ animationDelay: `${i * 1}s` }}
                >
                  <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors duration-500" />
                </div>
                <span className="text-sm font-semibold text-foreground">{label}</span>
                <span className="text-xs text-muted-foreground max-w-[140px] font-light">{desc}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Showcase */}
      <AionShowcase />

      {/* Gradient fade at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent pointer-events-none z-[5]" />
    </div>
  );
}
