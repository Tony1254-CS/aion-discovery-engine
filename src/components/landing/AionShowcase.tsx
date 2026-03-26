import { motion } from "framer-motion";
import {
  BookOpen, Beaker, GraduationCap, Building2, MessageSquare,
  CheckCircle2, XCircle, ArrowRight, Lightbulb, Database,
  BarChart3, Package, Shield, GitFork, Network, Users
} from "lucide-react";

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } } },
  item: { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.4, 0, 1] } } },
};

const steps = [
  { num: "01", text: 'Enter a research question (e.g., "Does microplastic exposure affect coral microbiome diversity?")' },
  { num: "02", text: "Optionally upload your own dataset" },
  { num: "03", text: 'Click "Launch Research"' },
  { num: "04", text: "Watch the AI work: literature review → hypothesis → dataset matching → code execution → paper" },
  { num: "05", text: "Intervene at any checkpoint: choose hypothesis, adjust variables, select test" },
  { num: "06", text: "Receive a full paper with interactive figures, stats, and a reproducibility package" },
];

const useCases = [
  { icon: GraduationCap, label: "Academic Research", desc: "Accelerate literature review and hypothesis testing" },
  { icon: Database, label: "Data Science", desc: "Explore datasets with rigorous statistical tests" },
  { icon: BookOpen, label: "Education", desc: "Teach the scientific method interactively" },
  { icon: Building2, label: "Industry R&D", desc: "Validate ideas quickly with real data" },
  { icon: MessageSquare, label: "Science Communication", desc: "Create interactive, shareable research artifacts" },
];

const comparison = [
  { feature: "Output", generic: "Text that sounds scientific", aion: "Executable, reproducible experiment", icon: Beaker },
  { feature: "Hypothesis", generic: "Plausible guess", aion: "Formally defined with IV, DV, controls", icon: Lightbulb },
  { feature: "Data", generic: "None or imaginary", aion: "Matched real dataset or rigorous simulation", icon: Database },
  { feature: "Analysis", generic: "Descriptive narrative", aion: "Executed code with statistical tests", icon: BarChart3 },
  { feature: "Results", generic: "Narrative", aion: "Effect size, CI, p-value, sample size", icon: BarChart3 },
  { feature: "Reproducibility", generic: "None", aion: "One-click export of code, data, seed, env", icon: Package },
  { feature: "Verification", generic: "None", aion: "Peer-review simulation, failure transparency", icon: Shield },
  { feature: "Human Agency", generic: "Black box", aion: "Checkpoints to choose, adjust, swap", icon: Users },
  { feature: "Competing Hypotheses", generic: "None", aion: "Tests 3 hypotheses, ranks by evidence", icon: GitFork },
  { feature: "Knowledge Graph", generic: "None", aion: "Analytical graph with contradictions & stance", icon: Network },
];

export default function AionShowcase() {
  return (
    <section className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-24 space-y-32">
      {/* What is AION */}
      <motion.div variants={stagger.container} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}>
        <motion.div variants={stagger.item} className="text-center mb-12">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-3">Discover</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground font-display">
            What is <span className="aion-gradient-text">AION</span>?
          </h2>
        </motion.div>
        <motion.div variants={stagger.item} className="glass-panel-elevated rounded-3xl p-8 sm:p-12 max-w-4xl mx-auto">
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
            AION is not just another AI that writes papers. It is an <span className="text-foreground font-semibold">executable research pipeline</span> that
            reads scientific literature, formulates a testable hypothesis with formal variables, finds a relevant real-world dataset,
            writes and executes statistical code, tests competing hypotheses, and produces a fully reproducible research paper
            with interactive figures and verified statistical output.
          </p>
        </motion.div>
      </motion.div>

      {/* How to Use */}
      <motion.div variants={stagger.container} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}>
        <motion.div variants={stagger.item} className="text-center mb-12">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-3">Get Started</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-display">How to Use AION</h2>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {steps.map(({ num, text }, i) => (
            <motion.div
              key={num}
              variants={stagger.item}
              className="glass-panel rounded-2xl p-6 group hover:border-primary/30 transition-all duration-300"
            >
              <span className="text-3xl font-black aion-gradient-text font-display">{num}</span>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{text}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Where to Apply */}
      <motion.div variants={stagger.container} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}>
        <motion.div variants={stagger.item} className="text-center mb-12">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-3">Applications</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-display">Where to Apply</h2>
        </motion.div>
        <div className="flex flex-wrap justify-center gap-4">
          {useCases.map(({ icon: Icon, label, desc }) => (
            <motion.div
              key={label}
              variants={stagger.item}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="glass-panel rounded-2xl p-6 w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.33%-0.75rem)] text-center group"
            >
              <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-[hsl(var(--aion-gradient-start))] to-[hsl(var(--aion-gradient-end))] flex items-center justify-center mb-4 group-hover:shadow-lg transition-shadow">
                <Icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="text-sm font-bold text-foreground mb-1">{label}</h3>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Comparison Table */}
      <motion.div variants={stagger.container} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}>
        <motion.div variants={stagger.item} className="text-center mb-12">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-3">Comparison</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-display">
            Why AION is <span className="aion-gradient-text">Different</span>
          </h2>
        </motion.div>
        <motion.div variants={stagger.item} className="glass-panel-elevated rounded-3xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_1fr_1fr] sm:grid-cols-[1.5fr_1fr_1.2fr] text-xs font-bold uppercase tracking-wider border-b border-border/50">
            <div className="p-4 sm:p-5 text-muted-foreground">Feature</div>
            <div className="p-4 sm:p-5 text-muted-foreground/60 text-center">Generic AI</div>
            <div className="p-4 sm:p-5 text-center aion-gradient-text">AION</div>
          </div>
          {/* Rows */}
          {comparison.map(({ feature, generic, aion, icon: Icon }, i) => (
            <motion.div
              key={feature}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04, duration: 0.4 }}
              className={`grid grid-cols-[1fr_1fr_1fr] sm:grid-cols-[1.5fr_1fr_1.2fr] text-sm ${
                i % 2 === 0 ? "bg-muted/20" : ""
              } border-b border-border/20 last:border-b-0`}
            >
              <div className="p-4 sm:p-5 flex items-center gap-2.5 font-medium text-foreground">
                <Icon className="h-4 w-4 text-primary/70 shrink-0 hidden sm:block" />
                {feature}
              </div>
              <div className="p-4 sm:p-5 flex items-center justify-center gap-1.5 text-muted-foreground/60 text-center text-xs">
                <XCircle className="h-3.5 w-3.5 text-destructive/50 shrink-0" />
                <span className="hidden sm:inline">{generic}</span>
                <span className="sm:hidden">{generic.split(" ").slice(0, 3).join(" ")}…</span>
              </div>
              <div className="p-4 sm:p-5 flex items-center justify-center gap-1.5 text-foreground text-center text-xs font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="hidden sm:inline">{aion}</span>
                <span className="sm:hidden">{aion.split(" ").slice(0, 4).join(" ")}…</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="text-center"
      >
        <p className="text-muted-foreground text-sm mb-6">Ready to experience the future of research?</p>
        <a href="#research-input" className="aion-glow-button aion-pulse inline-flex items-center gap-2.5 text-base px-8 py-3.5">
          Start Your Research
          <ArrowRight className="h-5 w-5" />
        </a>
      </motion.div>
    </section>
  );
}
