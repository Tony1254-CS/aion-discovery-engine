import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Shield, Brain, BookOpen, Zap, FlaskConical, Swords,
  BarChart3, FileText, Eye, Lock, Lightbulb, Target, CheckCircle2,
  Sparkles, Globe, Users, TrendingUp, AlertTriangle, Microscope
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.5, ease: [0.25, 0.4, 0, 1] },
  }),
};

const features = [
  { icon: BookOpen, title: "Automated Literature Review", desc: "Scans thousands of real academic papers from OpenAlex, Semantic Scholar, and arXiv in seconds. No manual searching required." },
  { icon: Brain, title: "Hypothesis Generation", desc: "AI generates competing, testable hypotheses — primary, alternative, and null — with predicted outcomes and statistical approaches." },
  { icon: FlaskConical, title: "Experiment Design", desc: "Automatically designs experiments with independent/dependent variables, control groups, sample sizes, and statistical methods." },
  { icon: FileText, title: "Full Paper Generation", desc: "Produces complete research papers with abstract, introduction, methodology, results, discussion, and properly formatted references." },
  { icon: Swords, title: "AI Debate Mode", desc: "A proponent, opponent, and moderator debate your hypothesis in real-time to stress-test ideas from multiple angles." },
  { icon: BarChart3, title: "Meta-Analysis Builder", desc: "Synthesize findings across multiple studies with forest plots, heterogeneity analysis, and publication bias detection." },
  { icon: Eye, title: "Peer Review System", desc: "AI peer reviewers score your paper on strengths, weaknesses, and provide actionable suggestions — just like real journal review." },
  { icon: Target, title: "Novelty Score", desc: "Evaluates how novel your research question is compared to existing literature, helping you find truly original angles." },
  { icon: Lightbulb, title: "Research Gap Detection", desc: "Identifies unanswered questions, contradictions, and under-explored areas in your field to guide future research." },
  { icon: Sparkles, title: "Paper Refinement Chat", desc: "Interactively refine any section of your paper through natural conversation with AI, tracking all changes." },
  { icon: Microscope, title: "Interactive Figures", desc: "Auto-generated data visualizations and charts that bring your statistical findings to life." },
  { icon: TrendingUp, title: "Power Simulation", desc: "Monte Carlo simulations estimate statistical power across different sample sizes to optimize your study design." },
];

const safetyItems = [
  { icon: Shield, title: "No Data Stored", desc: "Your research queries and generated papers are processed in real-time. We don't store or train on your ideas." },
  { icon: Lock, title: "Transparent AI", desc: "Every AI decision is logged. You can see exactly which model generated each section and review the reasoning." },
  { icon: AlertTriangle, title: "Honest Limitations", desc: "We clearly flag simulated data, low statistical power, and conflicting literature — no hiding limitations." },
  { icon: CheckCircle2, title: "Human Checkpoints", desc: "The pipeline pauses at critical stages for your review. You remain in control of every research decision." },
];

const whyItems = [
  { title: "Democratize Research", desc: "Make advanced research tools accessible to everyone — students, independent researchers, and professionals worldwide." },
  { title: "Accelerate Discovery", desc: "What takes weeks of manual literature review and paper writing, AION does in minutes while maintaining rigor." },
  { title: "Fight Bias", desc: "Competing hypotheses and AI debates expose blind spots that single-perspective research often misses." },
  { title: "Open & Free", desc: "Built on open-source AI models. No subscription walls, no vendor lock-in, no hidden costs." },
];

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-accent transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            <span className="font-semibold text-lg tracking-tight">About AION</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-16">
        {/* Hero */}
        <motion.section variants={fadeUp} custom={0} initial="hidden" animate="visible" className="text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-primary via-accent-foreground to-primary bg-clip-text text-transparent">
            AION Discovery Engine
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            An AI-powered autonomous research platform that transforms a single question into a complete, peer-reviewed scientific paper — with real references, statistical analysis, and full transparency.
          </p>
        </motion.section>

        {/* What is AION */}
        <motion.section variants={fadeUp} custom={1} initial="hidden" animate="visible" className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" /> What is AION?
          </h2>
          <div className="bg-card rounded-2xl border border-border p-6 space-y-3 text-muted-foreground leading-relaxed">
            <p>
              AION (Autonomous Intelligence for Original Narratives) is a next-generation research engine that automates the entire scientific research pipeline — from literature review to final paper generation.
            </p>
            <p>
              Unlike generic AI chatbots that produce surface-level summaries, AION executes a structured, multi-stage pipeline: it searches real academic databases, generates competing hypotheses, designs experiments, runs statistical simulations, writes a full paper, and subjects it to AI peer review.
            </p>
            <p>
              Every output is grounded in real published research with verifiable DOI links. AION doesn't just write — it <em>thinks</em>, <em>validates</em>, and <em>challenges</em> its own findings.
            </p>
          </div>
        </motion.section>

        {/* Why We Built This */}
        <motion.section variants={fadeUp} custom={2} initial="hidden" animate="visible" className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" /> Why We Built This
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {whyItems.map((item, i) => (
              <motion.div key={i} variants={fadeUp} custom={3 + i} initial="hidden" animate="visible"
                className="bg-card rounded-xl border border-border p-5 space-y-2 hover:border-primary/30 transition-colors">
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Features */}
        <motion.section variants={fadeUp} custom={4} initial="hidden" animate="visible" className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary" /> What AION Offers
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div key={i} variants={fadeUp} custom={5 + i * 0.5} initial="hidden" animate="visible"
                className="bg-card rounded-xl border border-border p-5 space-y-3 hover:border-primary/30 transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-sm">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* How It Works */}
        <motion.section variants={fadeUp} custom={6} initial="hidden" animate="visible" className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" /> How It Works
          </h2>
          <div className="bg-card rounded-2xl border border-border p-6">
            <ol className="space-y-4">
              {[
                { step: "1", title: "Ask a Question", desc: "Enter any research question — from microplastics to gene therapy. Optionally upload a dataset." },
                { step: "2", title: "AI Searches Literature", desc: "AION queries OpenAlex, Semantic Scholar, and arXiv for real, published papers relevant to your topic." },
                { step: "3", title: "Hypotheses & Experiments", desc: "Competing hypotheses are generated with full experiment designs, including variables, controls, and sample sizes." },
                { step: "4", title: "Paper Generation", desc: "A complete research paper is written with proper academic structure, citations, and statistical analysis." },
                { step: "5", title: "Peer Review & Refinement", desc: "AI reviewers score the paper, identify weaknesses, and you can interactively refine any section." },
                { step: "6", title: "Export & Share", desc: "Download as PDF, export reproducibility packages, or submit to the community leaderboard." },
              ].map((s, i) => (
                <li key={i} className="flex gap-4 items-start">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/15 text-primary font-bold text-sm flex items-center justify-center">
                    {s.step}
                  </span>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{s.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </motion.section>

        {/* Safety & Accuracy */}
        <motion.section variants={fadeUp} custom={7} initial="hidden" animate="visible" className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" /> Safety, Accuracy & Transparency
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {safetyItems.map((item, i) => (
              <motion.div key={i} variants={fadeUp} custom={8 + i} initial="hidden" animate="visible"
                className="bg-card rounded-xl border border-border p-5 space-y-3 hover:border-primary/30 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="font-semibold text-foreground text-sm">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
          <div className="bg-card rounded-2xl border border-border p-6 space-y-3 text-muted-foreground text-sm leading-relaxed">
            <p>
              <strong className="text-foreground">Accuracy Note:</strong> AION uses real academic references from established databases. However, AI-generated analysis and statistical results are simulated for demonstration purposes. Always verify findings through independent research before drawing conclusions.
            </p>
            <p>
              <strong className="text-foreground">Not a Replacement:</strong> AION is a research accelerator, not a replacement for domain expertise. It's designed to help researchers explore ideas faster, not to produce publish-ready papers without human oversight.
            </p>
          </div>
        </motion.section>

        {/* CTA */}
        <motion.section variants={fadeUp} custom={9} initial="hidden" animate="visible" className="text-center pb-10">
          <button onClick={() => navigate("/")}
            className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
            Start Researching
          </button>
        </motion.section>
      </main>
    </div>
  );
}
