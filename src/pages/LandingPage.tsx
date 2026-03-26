import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Upload, ArrowRight, Beaker, BookOpen, Brain, Zap, ArrowUpRight, Microscope, FlaskConical, Trophy } from "lucide-react";
import ParticleBackground from "@/components/ParticleBackground";
import { useNavigate } from "react-router-dom";

const exampleQueries = [
  { q: "What is the effect of microplastics on coral reef microbiomes?", short: "Microplastics & Coral", icon: Microscope },
  { q: "Can we repurpose existing drugs for Alzheimer's treatment?", short: "Drug Repurposing", icon: FlaskConical },
  { q: "How does sleep deprivation affect gene expression in neurons?", short: "Sleep & Genes", icon: Brain },
];

const features = [
  { icon: BookOpen, label: "Literature Review", desc: "Scans thousands of papers in seconds", color: "from-[hsl(var(--aion-node-paper))] to-[hsl(var(--aion-gradient-end))]" },
  { icon: Brain, label: "Hypothesis Engine", desc: "Generates competing testable hypotheses", color: "from-[hsl(var(--aion-gradient-start))] to-[hsl(var(--aion-node-concept))]" },
  { icon: Zap, label: "Auto Validation", desc: "AI-driven experiments & statistical analysis", color: "from-[hsl(var(--aion-node-hypothesis))] to-[hsl(var(--destructive))]" },
];

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } } },
  item: { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.4, 0, 1] } } },
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
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-background mesh-gradient-bg">
      <ParticleBackground />

      {/* Nav */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.4, 0, 1] }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12"
      >
        <div className="flex items-center gap-2.5">
          <motion.div
            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.05 }}
            transition={{ duration: 0.5 }}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-[hsl(var(--aion-gradient-start))] to-[hsl(var(--aion-gradient-end))] flex items-center justify-center glow-ring"
          >
            <Beaker className="h-4.5 w-4.5 text-primary-foreground" />
          </motion.div>
          <span className="text-lg font-bold tracking-tight text-foreground font-display">AION</span>
        </div>
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/leaderboard")}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted/50"
          >
            <Trophy className="h-3.5 w-3.5" />
            Leaderboard
          </motion.button>
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-full glass-panel text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="font-medium text-muted-foreground">AI Scientist Online</span>
          </div>
        </div>
      </motion.nav>

      {/* Hero */}
      <div className="relative z-10 flex flex-col items-center px-4 max-w-3xl w-full">
        <motion.div
          variants={stagger.container}
          initial="hidden"
          animate="show"
          className="text-center mb-12"
        >
          <motion.div
            variants={stagger.item}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-xs font-medium mb-8"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-foreground">Executable Research Pipeline with Automated Validation</span>
          </motion.div>
          <motion.h1
            variants={stagger.item}
            className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.05] mb-6 font-display"
          >
            From Question to
            <br />
            <span className="aion-gradient-text">Research Paper</span>
          </motion.h1>
          <motion.p
            variants={stagger.item}
            className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto leading-relaxed"
          >
            AION autonomously reviews literature, generates competing hypotheses,
            runs validated experiments, and writes complete research papers — in minutes.
          </motion.p>
        </motion.div>

        {/* Input Area */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.5, ease: [0.25, 0.4, 0, 1] }}
          className={`w-full glass-panel-hero p-1.5 mb-6 transition-all duration-500 ${
            focused ? "glow-ring-strong" : ""
          }`}
        >
          <div className="bg-background/40 rounded-2xl p-5">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Ask a scientific question…"
              rows={3}
              className="w-full bg-transparent border-none outline-none resize-none text-foreground placeholder:text-muted-foreground/50 text-base sm:text-lg leading-relaxed font-light"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && query.trim()) { e.preventDefault(); handleLaunch(); } }}
            />
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
              <button className="flex items-center gap-2 text-sm text-muted-foreground/60 hover:text-foreground transition-colors group px-3 py-1.5 rounded-lg hover:bg-muted/40">
                <Upload className="h-4 w-4 group-hover:text-primary transition-colors" />
                <span className="hidden sm:inline">Upload dataset</span>
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleLaunch}
                disabled={!query.trim()}
                className="aion-glow-button aion-pulse flex items-center gap-2.5 disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none text-sm sm:text-base px-6 py-3 sm:px-8 sm:py-3.5"
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
          transition={{ duration: 0.8, delay: 0.9 }}
          className="flex flex-wrap justify-center gap-2"
        >
          <span className="text-xs text-muted-foreground/50 mr-1 self-center">Try:</span>
          {exampleQueries.map(({ q, short, icon: QIcon }, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 + i * 0.08 }}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setQuery(q)}
              className="text-xs px-4 py-2 rounded-xl glass-panel
                text-foreground/70 hover:text-foreground hover:border-primary/30
                transition-all duration-200 flex items-center gap-1.5"
            >
              <QIcon className="h-3 w-3 text-primary/60" />
              {short}
              <ArrowUpRight className="h-3 w-3 opacity-30" />
            </motion.button>
          ))}
        </motion.div>

        {/* Feature badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="flex flex-wrap justify-center gap-6 sm:gap-10 mt-20"
        >
          {features.map(({ icon: Icon, label, desc, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 + i * 0.1, ease: [0.25, 0.4, 0, 1] }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="flex flex-col items-center gap-2.5 text-center group cursor-default"
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center
                shadow-lg group-hover:shadow-xl transition-shadow duration-300 float-gentle`}
                style={{ animationDelay: `${i * 0.7}s` }}
              >
                <Icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-sm font-semibold text-foreground">{label}</span>
              <span className="text-xs text-muted-foreground max-w-[140px]">{desc}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none z-[5]" />
    </div>
  );
}
