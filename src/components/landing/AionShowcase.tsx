import { motion } from "framer-motion";
import {
  BookOpen, Beaker, GraduationCap, Building2, MessageSquare,
  CheckCircle2, XCircle, ArrowRight, Lightbulb, Database,
  BarChart3, Package, Shield, GitFork, Network, Users
} from "lucide-react";

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } },
  item: { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.4, 0, 1] } } },
};

const steps = [
  { num: "01", text: "Enter a research question" },
  { num: "02", text: "Optionally upload your own dataset" },
  { num: "03", text: "Launch and watch the AI work in real time" },
  { num: "04", text: "Intervene at checkpoints if desired" },
  { num: "05", text: "Review your full paper with interactive figures" },
  { num: "06", text: "Export the reproducibility package" },
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
  { feature: "Hypothesis", generic: "Plausible guess", aion: "Formal IV/DV/controls", icon: Lightbulb },
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
    <section className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 py-28 space-y-36">
      {/* Divider */}
      <div className="premium-divider" />

      {/* What is AION */}
      <motion.div variants={stagger.container} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }}>
        <motion.div variants={stagger.item} className="text-center mb-10">
          <span className="inline-block text-[10px] font-semibold tracking-[0.25em] uppercase text-primary/70 mb-4">Discover</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground font-display leading-tight">
            What is <span className="aion-gradient-text">AION</span>?
          </h2>
        </motion.div>
        <motion.div variants={stagger.item} className="glass-panel-elevated rounded-3xl p-8 sm:p-12 max-w-3xl mx-auto">
          <p className="text-muted-foreground text-sm sm:text-base leading-[1.85] font-light">
            AION is an <span className="text-foreground font-medium">executable research pipeline</span> — not a chatbot that writes essays.
            It reads scientific literature, formulates testable hypotheses with formal variables, matches real-world datasets,
            executes statistical code, tests competing explanations, and produces a fully reproducible paper
            with interactive figures and verified results.
          </p>
        </motion.div>
      </motion.div>

      {/* How to Use */}
      <motion.div variants={stagger.container} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }}>
        <motion.div variants={stagger.item} className="text-center mb-10">
          <span className="inline-block text-[10px] font-semibold tracking-[0.25em] uppercase text-primary/70 mb-4">Get Started</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-display">How It Works</h2>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {steps.map(({ num, text }) => (
            <motion.div
              key={num}
              variants={stagger.item}
              className="glass-panel rounded-2xl p-6 group hover:border-primary/15 transition-all duration-500"
            >
              <span className="text-2xl font-black aion-gradient-text font-display">{num}</span>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed font-light">{text}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Where to Apply */}
      <motion.div variants={stagger.container} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }}>
        <motion.div variants={stagger.item} className="text-center mb-10">
          <span className="inline-block text-[10px] font-semibold tracking-[0.25em] uppercase text-primary/70 mb-4">Applications</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-display">Built For</h2>
        </motion.div>
        <div className="flex flex-wrap justify-center gap-4">
          {useCases.map(({ icon: Icon, label, desc }) => (
            <motion.div
              key={label}
              variants={stagger.item}
              whileHover={{ y: -4, transition: { duration: 0.3 } }}
              className="glass-panel rounded-2xl p-6 w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.33%-0.75rem)] text-center group"
            >
              <div className="w-11 h-11 mx-auto rounded-xl bg-secondary/80 border border-border/40 flex items-center justify-center mb-4
                group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-500">
                <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors duration-500" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">{label}</h3>
              <p className="text-xs text-muted-foreground font-light">{desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Comparison Table */}
      <motion.div variants={stagger.container} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }}>
        <motion.div variants={stagger.item} className="text-center mb-10">
          <span className="inline-block text-[10px] font-semibold tracking-[0.25em] uppercase text-primary/70 mb-4">Comparison</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-display">
            Why AION is <span className="aion-gradient-text">Different</span>
          </h2>
        </motion.div>
        <motion.div variants={stagger.item} className="glass-panel-elevated rounded-3xl overflow-hidden">
          <div className="grid grid-cols-[1.2fr_1fr_1.2fr] text-[10px] sm:text-xs font-semibold uppercase tracking-wider border-b border-border/30">
            <div className="p-4 sm:p-5 text-muted-foreground/60">Feature</div>
            <div className="p-4 sm:p-5 text-muted-foreground/40 text-center">Generic AI</div>
            <div className="p-4 sm:p-5 text-center text-primary/80">AION</div>
          </div>
          {comparison.map(({ feature, generic, aion, icon: Icon }, i) => (
            <motion.div
              key={feature}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.03, duration: 0.5 }}
              className={`grid grid-cols-[1.2fr_1fr_1.2fr] text-sm border-b border-border/15 last:border-b-0 ${
                i % 2 === 0 ? "bg-secondary/20" : ""
              } hover:bg-secondary/30 transition-colors duration-300`}
            >
              <div className="p-4 sm:p-5 flex items-center gap-2.5 font-medium text-foreground/90 text-xs sm:text-sm">
                <Icon className="h-3.5 w-3.5 text-primary/50 shrink-0 hidden sm:block" />
                {feature}
              </div>
              <div className="p-4 sm:p-5 flex items-center justify-center gap-1.5 text-muted-foreground/40 text-center text-xs">
                <XCircle className="h-3 w-3 text-destructive/40 shrink-0" />
                <span className="hidden sm:inline">{generic}</span>
              </div>
              <div className="p-4 sm:p-5 flex items-center justify-center gap-1.5 text-foreground/80 text-center text-xs font-medium">
                <CheckCircle2 className="h-3 w-3 text-primary/70 shrink-0" />
                <span className="hidden sm:inline">{aion}</span>
                <span className="sm:hidden">{aion.split(" ").slice(0, 3).join(" ")}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="text-center pt-8"
      >
        <p className="text-muted-foreground/60 text-sm mb-8 font-light">Ready to experience the future of research?</p>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="aion-glow-button inline-flex items-center gap-2.5 text-base px-8 py-3.5"
        >
          Start Your Research
          <ArrowRight className="h-5 w-5" />
        </motion.button>
      </motion.div>

      <div className="premium-divider mt-12" />
    </section>
  );
}
