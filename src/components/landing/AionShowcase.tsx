import { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import {
  BookOpen, Beaker, GraduationCap, Building2, MessageSquare,
  CheckCircle2, X, ArrowRight, Lightbulb, Database,
  BarChart3, Package, Shield, GitFork, Network, Users,
  Sparkles, Zap, Code2, FlaskConical
} from "lucide-react";

/* ── animation presets ── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40, filter: "blur(8px)" },
  whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] },
});

const scaleIn = (delay = 0) => ({
  initial: { opacity: 0, scale: 0.92, filter: "blur(6px)" },
  whileInView: { opacity: 1, scale: 1, filter: "blur(0px)" },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] },
});

const slideFromLeft = (delay = 0) => ({
  initial: { opacity: 0, x: -50, filter: "blur(6px)" },
  whileInView: { opacity: 1, x: 0, filter: "blur(0px)" },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] },
});

const slideFromRight = (delay = 0) => ({
  initial: { opacity: 0, x: 50, filter: "blur(6px)" },
  whileInView: { opacity: 1, x: 0, filter: "blur(0px)" },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] },
});

/* ── data ── */
const pipelineSteps = [
  { num: "01", text: "Enter a research question", icon: Sparkles, accent: "from-primary/20 to-[hsl(var(--aion-cyan))]/20" },
  { num: "02", text: "Upload your own dataset (optional)", icon: Database, accent: "from-[hsl(var(--aion-cyan))]/20 to-[hsl(var(--aion-violet))]/20" },
  { num: "03", text: "Watch AI work in real time", icon: Zap, accent: "from-[hsl(var(--aion-violet))]/20 to-primary/20" },
  { num: "04", text: "Intervene at checkpoints", icon: Users, accent: "from-primary/20 to-[hsl(var(--aion-rose))]/20" },
  { num: "05", text: "Review interactive figures & stats", icon: BarChart3, accent: "from-[hsl(var(--aion-rose))]/20 to-[hsl(var(--aion-cyan))]/20" },
  { num: "06", text: "Export reproducibility package", icon: Package, accent: "from-[hsl(var(--aion-cyan))]/20 to-primary/20" },
];

const useCases = [
  { icon: GraduationCap, label: "Academic Research", desc: "Accelerate hypothesis testing & literature review" },
  { icon: Database, label: "Data Science", desc: "Rigorous statistical exploration with real datasets" },
  { icon: BookOpen, label: "Education", desc: "Teach the scientific method interactively" },
  { icon: Building2, label: "Industry R&D", desc: "Validate ideas rapidly with real data" },
  { icon: MessageSquare, label: "Communication", desc: "Create shareable, interactive research artifacts" },
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

const stats = [
  { value: "6", suffix: "+", label: "Pipeline Stages" },
  { value: "3", suffix: "", label: "Competing Hypotheses" },
  { value: "1", suffix: "-Click", label: "Reproducibility" },
];

/* ── animated counter ── */
function AnimatedStat({ value, suffix, label, delay }: { value: string; suffix: string; label: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      {...scaleIn(delay)}
      className="text-center"
    >
      <div className="text-4xl sm:text-5xl font-black aion-gradient-text font-display tabular-nums">
        {isInView ? value : "0"}{suffix}
      </div>
      <div className="mt-2 text-[11px] text-muted-foreground/60 uppercase tracking-[0.2em] font-medium">{label}</div>
    </motion.div>
  );
}

/* ── section header ── */
function SectionHeader({ tag, title, gradient }: { tag: string; title: React.ReactNode; gradient?: boolean }) {
  return (
    <motion.div {...fadeUp()} className="text-center mb-16">
      <motion.span
        {...scaleIn(0.1)}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel text-[10px] font-semibold tracking-[0.25em] uppercase text-primary/70 mb-5"
      >
        <span className="w-1 h-1 rounded-full bg-primary/50" />
        {tag}
        <span className="w-1 h-1 rounded-full bg-primary/50" />
      </motion.span>
      <motion.h2
        {...fadeUp(0.15)}
        className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-[-0.03em] text-white font-display leading-tight"
      >
        {title}
      </motion.h2>
    </motion.div>
  );
}

/* ── main component ── */
export default function AionShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const parallaxY1 = useTransform(scrollYProgress, [0, 1], [80, -80]);
  const parallaxY2 = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const bgOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <section
      ref={sectionRef}
      className="relative z-10 w-full max-w-5xl mx-auto px-5 sm:px-8 py-28"
    >
      {/* Floating ambient orbs that parallax */}
      <motion.div
        style={{ y: parallaxY1, opacity: bgOpacity }}
        className="absolute -left-40 top-[20%] w-[400px] h-[400px] rounded-full bg-primary/[0.03] blur-[120px] pointer-events-none"
      />
      <motion.div
        style={{ y: parallaxY2, opacity: bgOpacity }}
        className="absolute -right-40 top-[50%] w-[350px] h-[350px] rounded-full bg-[hsl(var(--aion-violet))]/[0.04] blur-[100px] pointer-events-none"
      />
      <motion.div
        style={{ y: parallaxY1, opacity: bgOpacity }}
        className="absolute left-1/2 top-[75%] w-[300px] h-[300px] rounded-full bg-[hsl(var(--aion-cyan))]/[0.03] blur-[100px] pointer-events-none -translate-x-1/2"
      />

      <div className="premium-divider" />

      <div className="space-y-44 mt-20">
        {/* ════════ What is AION ════════ */}
        <div>
          <SectionHeader tag="Discover" title={<>What is <span className="aion-gradient-text">AION</span>?</>} />

          <motion.div
            {...scaleIn(0.2)}
            className="glass-panel-elevated rounded-3xl p-8 sm:p-12 max-w-3xl mx-auto relative overflow-hidden group"
          >
            {/* Shimmer edge on hover */}
            <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent" />

            <p className="relative text-muted-foreground text-sm sm:text-[15px] leading-[2] font-light">
              AION is an <span className="text-white font-medium">executable research pipeline</span> — not a chatbot that writes essays.
              It reads scientific literature, formulates testable hypotheses with formal variables, matches real-world datasets,
              executes statistical code, tests competing explanations, and produces a fully reproducible paper
              with interactive figures and verified results. It also features an{" "}
              <span className="text-white font-medium">Idea & Proposal Peer Review</span> system — submit any research idea, abstract,
              or draft and receive structured AI feedback with novelty scoring, similar published works with DOI links,
              and actionable next steps to refine your research.
            </p>

            {/* Animated highlight features */}
            <div className="relative grid grid-cols-2 sm:grid-cols-5 gap-3 mt-8 pt-8 border-t border-white/[0.04]">
              {[
                { icon: BookOpen, label: "Reads Literature" },
                { icon: FlaskConical, label: "Tests Hypotheses" },
                { icon: Code2, label: "Executes Code" },
                { icon: Package, label: "Reproducible" },
                { icon: MessageSquare, label: "Peer Review" },
              ].map(({ icon: Icon, label }, i) => (
                <motion.div
                  key={label}
                  {...fadeUp(0.3 + i * 0.08)}
                  className="flex flex-col items-center gap-2 py-3"
                >
                  <div className="w-9 h-9 rounded-xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary/60" />
                  </div>
                  <span className="text-[10px] text-muted-foreground/70 font-medium tracking-wide">{label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ════════ Stats Strip ════════ */}
        <div className="flex justify-center gap-10 sm:gap-16 md:gap-24">
          {stats.map((s, i) => (
            <AnimatedStat key={s.label} {...s} delay={i * 0.12} />
          ))}
        </div>

        {/* ════════ How It Works ════════ */}
        <div>
          <SectionHeader tag="Get Started" title="How It Works" />

          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/[0.06] to-transparent hidden lg:block" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pipelineSteps.map(({ num, text, icon: Icon, accent }, i) => (
                <motion.div
                  key={num}
                  {...(i % 2 === 0 ? slideFromLeft(i * 0.08) : slideFromRight(i * 0.08))}
                  whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } }}
                  className="glass-panel rounded-2xl p-6 group hover:border-primary/15 transition-all duration-500 relative overflow-hidden cursor-default"
                >
                  {/* Gradient accent background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-2xl`} />

                  <div className="relative flex items-start gap-4">
                    <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-[hsl(var(--aion-violet))]/10 border border-white/[0.06] flex items-center justify-center
                      group-hover:border-primary/20 group-hover:shadow-[0_0_20px_-4px_hsl(var(--primary)/0.2)] transition-all duration-500">
                      <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-500" />
                    </div>
                    <div>
                      <span className="text-lg font-black aion-gradient-text font-display">{num}</span>
                      <p className="mt-1 text-[13px] text-muted-foreground leading-relaxed font-light group-hover:text-foreground/70 transition-colors duration-500">{text}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* ════════ Built For ════════ */}
        <div>
          <SectionHeader tag="Applications" title="Built For" />

          <div className="flex flex-wrap justify-center gap-4">
            {useCases.map(({ icon: Icon, label, desc }, i) => (
              <motion.div
                key={label}
                {...scaleIn(i * 0.08)}
                whileHover={{
                  y: -8,
                  scale: 1.03,
                  transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
                }}
                className="glass-panel rounded-2xl p-7 w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.33%-0.75rem)] text-center group relative overflow-hidden cursor-default"
              >
                {/* Glow on hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-primary/[0.06] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                <div className="relative">
                  <motion.div
                    className="w-12 h-12 mx-auto rounded-2xl border border-white/[0.06] bg-white/[0.03] flex items-center justify-center mb-5
                      group-hover:border-primary/20 group-hover:bg-primary/[0.08] group-hover:shadow-[0_0_30px_-6px_hsl(var(--primary)/0.25)] transition-all duration-500"
                  >
                    <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors duration-500" />
                  </motion.div>
                  <h3 className="text-[14px] font-semibold text-white/90 mb-1.5">{label}</h3>
                  <p className="text-[11px] text-muted-foreground font-light leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ════════ Comparison Table ════════ */}
        <div>
          <SectionHeader
            tag="Comparison"
            title={<>Why AION is <span className="aion-gradient-text">Different</span></>}
          />

          <motion.div {...scaleIn(0.15)} className="glass-panel-elevated rounded-3xl overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[1.3fr_1fr_1.3fr] text-[10px] font-semibold uppercase tracking-[0.15em] border-b border-white/[0.05]">
              <div className="p-5 text-muted-foreground/50">Feature</div>
              <div className="p-5 text-muted-foreground/30 text-center">Generic AI</div>
              <div className="p-5 text-center aion-gradient-text">AION</div>
            </div>

            {comparison.map(({ feature, generic, aion, icon: Icon }, i) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.5, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className={`grid grid-cols-[1.3fr_1fr_1.3fr] text-[13px] border-b border-white/[0.03] last:border-b-0
                  ${i % 2 === 0 ? "bg-white/[0.015]" : ""} hover:bg-white/[0.035] transition-colors duration-300 group`}
              >
                <div className="p-4 sm:p-5 flex items-center gap-2.5 font-medium text-white/80">
                  <Icon className="h-3.5 w-3.5 text-primary/40 shrink-0 hidden sm:block group-hover:text-primary/70 transition-colors duration-300" />
                  {feature}
                </div>
                <div className="p-4 sm:p-5 flex items-center justify-center gap-1.5 text-muted-foreground/30 text-center text-[12px]">
                  <X className="h-3 w-3 text-destructive/40 shrink-0" />
                  <span className="hidden sm:inline">{generic}</span>
                </div>
                <div className="p-4 sm:p-5 flex items-center justify-center gap-1.5 text-white/70 text-center text-[12px] font-medium">
                  <CheckCircle2 className="h-3 w-3 text-primary/70 shrink-0 group-hover:text-primary transition-colors duration-300" />
                  <span className="hidden sm:inline">{aion}</span>
                  <span className="sm:hidden">{aion.split(" ").slice(0, 3).join(" ")}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* ════════ CTA ════════ */}
        <motion.div
          {...fadeUp()}
          className="text-center pt-8"
        >
          <motion.p
            {...fadeUp(0.1)}
            className="text-muted-foreground/50 text-sm mb-8 font-light"
          >
            Ready to experience the future of research?
          </motion.p>
          <motion.button
            {...scaleIn(0.2)}
            whileHover={{ scale: 1.04, boxShadow: "0 0 40px -8px hsl(var(--primary) / 0.4)" }}
            whileTap={{ scale: 0.97 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="aion-glow-button inline-flex items-center gap-2.5 text-sm sm:text-base px-8 py-3.5"
          >
            Start Your Research
            <ArrowRight className="h-5 w-5" />
          </motion.button>
        </motion.div>
      </div>

      <div className="premium-divider mt-20" />
    </section>
  );
}
