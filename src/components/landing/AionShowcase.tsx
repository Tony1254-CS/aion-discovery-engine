import { motion } from "framer-motion";
import {
  BookOpen, Beaker, GraduationCap, Building2, MessageSquare,
  CheckCircle2, X, ArrowRight, Lightbulb, Database,
  BarChart3, Package, Shield, GitFork, Network, Users
} from "lucide-react";

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } } },
  item: { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } } },
};

const steps = [
  { num: "01", text: "Enter a research question" },
  { num: "02", text: "Optionally upload your own dataset" },
  { num: "03", text: "Launch and watch the AI work in real time" },
  { num: "04", text: "Intervene at checkpoints if desired" },
  { num: "05", text: "Review your paper with interactive figures" },
  { num: "06", text: "Export the full reproducibility package" },
];

const useCases = [
  { icon: GraduationCap, label: "Academic Research", desc: "Accelerate hypothesis testing" },
  { icon: Database, label: "Data Science", desc: "Rigorous statistical exploration" },
  { icon: BookOpen, label: "Education", desc: "Interactive scientific method" },
  { icon: Building2, label: "Industry R&D", desc: "Rapid idea validation" },
  { icon: MessageSquare, label: "Communication", desc: "Shareable research artifacts" },
];

const comparison = [
  { feature: "Output", generic: "Text narrative", aion: "Executable experiment", icon: Beaker },
  { feature: "Hypothesis", generic: "Plausible guess", aion: "Formal IV / DV / controls", icon: Lightbulb },
  { feature: "Data", generic: "None", aion: "Matched dataset", icon: Database },
  { feature: "Analysis", generic: "Descriptive", aion: "Statistical tests", icon: BarChart3 },
  { feature: "Reproducibility", generic: "None", aion: "One-click export", icon: Package },
  { feature: "Verification", generic: "None", aion: "Peer review + transparency", icon: Shield },
  { feature: "Human Agency", generic: "Black box", aion: "Checkpoints", icon: Users },
  { feature: "Competing Hyp.", generic: "None", aion: "3 ranked by evidence", icon: GitFork },
  { feature: "Knowledge Graph", generic: "None", aion: "Analytical + citations", icon: Network },
];

export default function AionShowcase() {
  return (
    <section className="relative z-10 w-full max-w-5xl mx-auto px-5 sm:px-8 py-28 space-y-40">
      <div className="premium-divider" />

      {/* What is AION */}
      <motion.div variants={stagger.container} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}>
        <motion.div variants={stagger.item} className="text-center mb-12">
          <span className="inline-block text-[10px] font-semibold tracking-[0.3em] uppercase text-primary/60 mb-4">Discover</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-[-0.02em] text-white font-display leading-tight">
            What is <span className="aion-gradient-text">AION</span>?
          </h2>
        </motion.div>
        <motion.div variants={stagger.item} className="glass-panel-elevated rounded-3xl p-8 sm:p-12 max-w-3xl mx-auto">
          <p className="text-muted-foreground text-sm sm:text-[15px] leading-[1.9] font-light">
            AION is an <span className="text-white font-medium">executable research pipeline</span> — not a chatbot that writes essays.
            It reads scientific literature, formulates testable hypotheses with formal variables, matches real-world datasets,
            executes statistical code, tests competing explanations, and produces a fully reproducible paper
            with interactive figures and verified results.
          </p>
        </motion.div>
      </motion.div>

      {/* How to Use */}
      <motion.div variants={stagger.container} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}>
        <motion.div variants={stagger.item} className="text-center mb-12">
          <span className="inline-block text-[10px] font-semibold tracking-[0.3em] uppercase text-primary/60 mb-4">Get Started</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.02em] text-white font-display">How It Works</h2>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {steps.map(({ num, text }) => (
            <motion.div
              key={num}
              variants={stagger.item}
              whileHover={{ y: -3, transition: { duration: 0.25 } }}
              className="glass-panel rounded-2xl p-6 group hover:border-primary/10 transition-all duration-500"
            >
              <span className="text-2xl font-black aion-gradient-text font-display">{num}</span>
              <p className="mt-3 text-[13px] text-muted-foreground leading-relaxed font-light">{text}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Where to Apply */}
      <motion.div variants={stagger.container} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}>
        <motion.div variants={stagger.item} className="text-center mb-12">
          <span className="inline-block text-[10px] font-semibold tracking-[0.3em] uppercase text-primary/60 mb-4">Applications</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.02em] text-white font-display">Built For</h2>
        </motion.div>
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
          {useCases.map(({ icon: Icon, label, desc }) => (
            <motion.div
              key={label}
              variants={stagger.item}
              whileHover={{ y: -4, transition: { duration: 0.3 } }}
              className="glass-panel rounded-2xl p-6 w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.33%-0.75rem)] text-center group"
            >
              <div className="w-11 h-11 mx-auto rounded-xl border border-white/[0.06] bg-white/[0.03] flex items-center justify-center mb-4
                group-hover:border-primary/15 group-hover:bg-primary/[0.06] transition-all duration-500">
                <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors duration-500" />
              </div>
              <h3 className="text-[13px] font-semibold text-white/90 mb-1">{label}</h3>
              <p className="text-[11px] text-muted-foreground font-light">{desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Comparison Table */}
      <motion.div variants={stagger.container} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}>
        <motion.div variants={stagger.item} className="text-center mb-12">
          <span className="inline-block text-[10px] font-semibold tracking-[0.3em] uppercase text-primary/60 mb-4">Comparison</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.02em] text-white font-display">
            Why AION is <span className="aion-gradient-text">Different</span>
          </h2>
        </motion.div>
        <motion.div variants={stagger.item} className="glass-panel-elevated rounded-3xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1.3fr_1fr_1.3fr] text-[10px] font-semibold uppercase tracking-[0.15em] border-b border-white/[0.04]">
            <div className="p-5 text-muted-foreground/50">Feature</div>
            <div className="p-5 text-muted-foreground/30 text-center">Generic AI</div>
            <div className="p-5 text-center text-primary/70">AION</div>
          </div>
          {comparison.map(({ feature, generic, aion, icon: Icon }, i) => (
            <div
              key={feature}
              className={`grid grid-cols-[1.3fr_1fr_1.3fr] text-[13px] border-b border-white/[0.03] last:border-b-0
                ${i % 2 === 0 ? "bg-white/[0.015]" : ""} hover:bg-white/[0.025] transition-colors duration-300`}
            >
              <div className="p-4 sm:p-5 flex items-center gap-2.5 font-medium text-white/80">
                <Icon className="h-3.5 w-3.5 text-primary/40 shrink-0 hidden sm:block" />
                {feature}
              </div>
              <div className="p-4 sm:p-5 flex items-center justify-center gap-1.5 text-muted-foreground/30 text-center text-[12px]">
                <X className="h-3 w-3 text-destructive/30 shrink-0" />
                <span className="hidden sm:inline">{generic}</span>
              </div>
              <div className="p-4 sm:p-5 flex items-center justify-center gap-1.5 text-white/70 text-center text-[12px] font-medium">
                <CheckCircle2 className="h-3 w-3 text-primary/60 shrink-0" />
                <span className="hidden sm:inline">{aion}</span>
                <span className="sm:hidden">{aion.split(" ").slice(0, 3).join(" ")}</span>
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="text-center pt-8"
      >
        <p className="text-muted-foreground/50 text-sm mb-8 font-light">Ready to experience the future of research?</p>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="aion-glow-button inline-flex items-center gap-2.5 text-sm sm:text-base px-8 py-3.5"
        >
          Start Your Research
          <ArrowRight className="h-5 w-5" />
        </motion.button>
      </motion.div>

      <div className="premium-divider mt-16" />
    </section>
  );
}
