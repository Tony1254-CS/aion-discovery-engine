import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellRing, Plus, X, ExternalLink, Star, TrendingUp, BookOpen, Search, Loader2, CheckCircle2, Sparkles } from "lucide-react";

interface AlertPaper {
  id: string;
  title: string;
  authors: string;
  abstract: string;
  source: string;
  relevance: number;
  date: string;
  url: string;
}

interface Subscription {
  id: string;
  topic: string;
  keywords: string[];
  createdAt: string;
  paperCount: number;
}

const MOCK_PAPERS: AlertPaper[] = [
  {
    id: "1",
    title: "Microplastic-induced dysbiosis in coral-associated bacterial communities",
    authors: "Chen et al.",
    abstract: "We demonstrate that microplastic exposure significantly alters the composition of coral-associated microbial communities, with a notable increase in pathogenic Vibrio species and decrease in beneficial Endozoicomonas...",
    source: "Nature Microbiology",
    relevance: 96,
    date: "2026-03-24",
    url: "#",
  },
  {
    id: "2",
    title: "Nanoplastic transport mechanisms in marine reef ecosystems",
    authors: "Park & Williams",
    abstract: "This study reveals novel pathways through which nanoplastics accumulate in reef structures, demonstrating bioaccumulation factors 10-100x higher than previously estimated...",
    source: "Science",
    relevance: 89,
    date: "2026-03-22",
    url: "#",
  },
  {
    id: "3",
    title: "Metagenomic analysis of pollutant-exposed coral holobiont",
    authors: "Rodriguez et al.",
    abstract: "Through shotgun metagenomics of coral holobionts exposed to environmental pollutants, we identified functional gene shifts in nitrogen cycling and stress response pathways...",
    source: "ISME Journal",
    relevance: 82,
    date: "2026-03-20",
    url: "#",
  },
  {
    id: "4",
    title: "Resilience of deep-water coral microbiomes to anthropogenic stressors",
    authors: "Thompson et al.",
    abstract: "Deep-water corals exhibit markedly different microbiome stability compared to shallow-water species when exposed to microplastic contamination...",
    source: "PNAS",
    relevance: 74,
    date: "2026-03-18",
    url: "#",
  },
];

interface LiteratureMonitorProps {
  query?: string;
  onAddToProject?: (paper: AlertPaper) => void;
}

export default function LiteratureMonitor({ query, onAddToProject }: LiteratureMonitorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [papers, setPapers] = useState<AlertPaper[]>([]);
  const [newTopic, setNewTopic] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [addedPapers, setAddedPapers] = useState<Set<string>>(new Set());
  const [showSubscribeForm, setShowSubscribeForm] = useState(false);

  // Auto-subscribe to the current query topic
  useEffect(() => {
    if (query && subscriptions.length === 0) {
      const keywords = query.split(/\s+/).filter(w => w.length > 3).slice(0, 5);
      setSubscriptions([{
        id: "auto-1",
        topic: query.length > 60 ? query.slice(0, 57) + "..." : query,
        keywords,
        createdAt: new Date().toISOString(),
        paperCount: MOCK_PAPERS.length,
      }]);
      setPapers(MOCK_PAPERS);
    }
  }, [query]);

  const handleSubscribe = () => {
    if (!newTopic.trim()) return;
    setIsSearching(true);
    setTimeout(() => {
      const keywords = newTopic.split(/\s+/).filter(w => w.length > 3).slice(0, 5);
      setSubscriptions(prev => [...prev, {
        id: `sub-${Date.now()}`,
        topic: newTopic.trim(),
        keywords,
        createdAt: new Date().toISOString(),
        paperCount: Math.floor(Math.random() * 8) + 2,
      }]);
      setNewTopic("");
      setShowSubscribeForm(false);
      setIsSearching(false);
    }, 1500);
  };

  const handleUnsubscribe = (id: string) => {
    setSubscriptions(prev => prev.filter(s => s.id !== id));
  };

  const handleAddToProject = (paper: AlertPaper) => {
    setAddedPapers(prev => new Set(prev).add(paper.id));
    onAddToProject?.(paper);
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 90) return "text-[hsl(var(--aion-cyan))]";
    if (score >= 75) return "text-primary";
    return "text-muted-foreground";
  };

  const getRelevanceBg = (score: number) => {
    if (score >= 90) return "bg-[hsl(var(--aion-cyan))]/10 border-[hsl(var(--aion-cyan))]/20";
    if (score >= 75) return "bg-primary/10 border-primary/20";
    return "bg-muted/50 border-border/50";
  };

  return (
    <>
      {/* Floating bell trigger */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="relative p-2.5 rounded-xl glass-panel hover:bg-white/[0.06] transition-all group"
        title="Literature Alerts"
      >
        <BellRing className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        {papers.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center">
            {papers.length}
          </span>
        )}
      </motion.button>

      {/* Full panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, x: 400 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 400 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-[hsl(var(--aion-surface))] border-l border-border/40 z-50 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="p-5 border-b border-border/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-[hsl(var(--aion-violet))]/20 border border-primary/15 flex items-center justify-center">
                    <Bell className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Literature Monitor</h2>
                    <p className="text-[10px] text-muted-foreground">New papers matching your interests</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-thin">
                {/* Subscriptions */}
                <div className="p-5 border-b border-border/30">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold">
                      Active Subscriptions
                    </p>
                    <button
                      onClick={() => setShowSubscribeForm(!showSubscribeForm)}
                      className="text-[10px] px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" /> Subscribe
                    </button>
                  </div>

                  <AnimatePresence>
                    {showSubscribeForm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-3 overflow-hidden"
                      >
                        <div className="glass-panel p-3 flex gap-2">
                          <div className="flex-1 relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/40" />
                            <input
                              type="text"
                              value={newTopic}
                              onChange={(e) => setNewTopic(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
                              placeholder="Enter a research topic..."
                              className="w-full bg-background/40 border border-border/30 rounded-lg pl-7 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/40 transition-colors"
                            />
                          </div>
                          <button
                            onClick={handleSubscribe}
                            disabled={!newTopic.trim() || isSearching}
                            className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors flex items-center gap-1.5"
                          >
                            {isSearching ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                            Add
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-2">
                    {subscriptions.map((sub) => (
                      <motion.div
                        key={sub.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-panel p-3 flex items-start gap-3 group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-[hsl(var(--aion-cyan))]/10 border border-[hsl(var(--aion-cyan))]/15 flex items-center justify-center shrink-0 mt-0.5">
                          <BookOpen className="h-3.5 w-3.5 text-[hsl(var(--aion-cyan))]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{sub.topic}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-muted-foreground">{sub.paperCount} papers found</span>
                            <span className="text-[10px] text-muted-foreground/40">·</span>
                            <span className="text-[10px] text-muted-foreground/60">Daily alerts</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {sub.keywords.slice(0, 3).map((kw, i) => (
                              <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-md bg-muted/50 text-muted-foreground">
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={() => handleUnsubscribe(sub.id)}
                          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* New Papers */}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold">
                      New Papers & Alerts
                    </p>
                  </div>

                  <div className="space-y-3">
                    {papers.map((paper, i) => (
                      <motion.div
                        key={paper.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="glass-panel p-4 group hover:border-primary/20 transition-all duration-300"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="text-xs font-semibold text-foreground leading-snug flex-1">
                            {paper.title}
                          </h3>
                          <div className={`shrink-0 px-2 py-0.5 rounded-md border text-[10px] font-bold ${getRelevanceBg(paper.relevance)} ${getRelevanceColor(paper.relevance)}`}>
                            {paper.relevance}%
                          </div>
                        </div>

                        <p className="text-[10px] text-muted-foreground mb-2">
                          {paper.authors} · <span className="text-muted-foreground/60">{paper.source}</span> · {paper.date}
                        </p>

                        <p className="text-[11px] text-muted-foreground/80 leading-relaxed mb-3 line-clamp-2">
                          {paper.abstract}
                        </p>

                        <div className="flex items-center gap-2">
                          {addedPapers.has(paper.id) ? (
                            <span className="text-[10px] px-2.5 py-1 rounded-lg bg-[hsl(var(--aion-cyan))]/10 text-[hsl(var(--aion-cyan))] flex items-center gap-1.5 font-medium">
                              <CheckCircle2 className="h-3 w-3" /> Added to Project
                            </span>
                          ) : (
                            <button
                              onClick={() => handleAddToProject(paper)}
                              className="text-[10px] px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1.5 font-medium"
                            >
                              <Plus className="h-3 w-3" /> Add to Project
                            </button>
                          )}
                          <a
                            href={paper.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] px-2.5 py-1 rounded-lg glass-panel text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                          >
                            <ExternalLink className="h-3 w-3" /> View Paper
                          </a>
                          <div className="flex-1" />
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
                            <TrendingUp className="h-3 w-3" />
                            <span>Relevance</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-border/30 bg-[hsl(var(--aion-surface))]">
                <p className="text-[10px] text-muted-foreground/50 text-center">
                  Monitoring ArXiv, PubMed, Semantic Scholar · Updated daily
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
