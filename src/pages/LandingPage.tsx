import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Upload, ArrowRight, Beaker, BookOpen, Brain } from "lucide-react";
import ParticleBackground from "@/components/ParticleBackground";
import { useNavigate } from "react-router-dom";

const exampleQueries = [
  "What is the effect of microplastics on coral reef microbiomes?",
  "Can we repurpose existing drugs for Alzheimer's treatment?",
  "How does sleep deprivation affect gene expression in neurons?",
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
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12"
      >
        <div className="flex items-center gap-2">
          <Beaker className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold tracking-tight text-foreground">AION</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="hidden sm:inline">Autonomous AI Scientist</span>
        </div>
      </motion.nav>

      {/* Hero */}
      <div className="relative z-10 flex flex-col items-center px-4 max-w-3xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Scientific Discovery
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-tight mb-4">
            From Question to
            <br />
            <span className="aion-gradient-text">Research Paper</span>
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            AION autonomously reviews literature, generates hypotheses, runs experiments, and writes complete research papers.
          </p>
        </motion.div>

        {/* Input Area */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="w-full glass-panel p-6 mb-6"
        >
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a scientific question…"
            rows={3}
            className="w-full bg-transparent border-none outline-none resize-none text-foreground placeholder:text-muted-foreground text-base sm:text-lg leading-relaxed"
          />
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Upload dataset</span>
            </button>
            <button
              onClick={handleLaunch}
              disabled={!query.trim()}
              className="aion-glow-button aion-pulse flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none text-sm sm:text-lg px-5 py-2.5 sm:px-8 sm:py-4"
            >
              Launch Research
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </motion.div>

        {/* Example Queries */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-2 items-center"
        >
          <span className="text-xs text-muted-foreground mr-1">Try:</span>
          {exampleQueries.map((q, i) => (
            <button
              key={i}
              onClick={() => setQuery(q)}
              className="text-xs px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground hover:bg-accent transition-colors truncate max-w-[220px]"
            >
              {q}
            </button>
          ))}
        </motion.div>

        {/* Feature badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="flex flex-wrap justify-center gap-6 mt-16 text-muted-foreground"
        >
          {[
            { icon: BookOpen, label: "Literature Review" },
            { icon: Brain, label: "Hypothesis Generation" },
            { icon: Beaker, label: "Experiment Execution" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-sm">
              <Icon className="h-4 w-4 text-primary" />
              {label}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
