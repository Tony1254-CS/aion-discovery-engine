import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, ArrowUp, ArrowDown, Home, Beaker, Clock, Sparkles, Award, Crown, Medal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type SortMode = "top" | "newest" | "innovative" | "reproducible";

interface LeaderboardEntry {
  id: string;
  created_at: string;
  title: string;
  query: string;
  abstract: string | null;
  novelty_score: number;
  upvotes: number;
  downvotes: number;
  author_name: string;
}

const rankIcons = [
  { icon: Crown, bg: "bg-amber-500/15", text: "text-amber-500", ring: "shadow-[0_0_20px_hsl(45_90%_50%/0.15)]" },
  { icon: Medal, bg: "bg-slate-400/15", text: "text-slate-400", ring: "" },
  { icon: Medal, bg: "bg-orange-600/15", text: "text-orange-600", ring: "" },
];

export default function Leaderboard() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>("top");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntries();
  }, [sortMode]);

  const loadEntries = async () => {
    setLoading(true);
    let query = supabase.from("leaderboard").select("*");
    if (sortMode === "top") query = query.order("upvotes", { ascending: false });
    else if (sortMode === "newest") query = query.order("created_at", { ascending: false });
    else if (sortMode === "innovative") query = query.order("novelty_score", { ascending: false });
    else query = query.order("upvotes", { ascending: false });
    const { data, error } = await query.limit(50);
    if (!error && data) setEntries(data as LeaderboardEntry[]);
    setLoading(false);
  };

  const vote = async (id: string, type: "up" | "down") => {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;
    const update = type === "up" ? { upvotes: entry.upvotes + 1 } : { downvotes: entry.downvotes + 1 };
    await supabase.from("leaderboard").update(update).eq("id", id);
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...update } : e));
  };

  const sortButtons: { mode: SortMode; label: string; icon: any }[] = [
    { mode: "top", label: "Top Rated", icon: Trophy },
    { mode: "innovative", label: "Most Innovative", icon: Sparkles },
    { mode: "reproducible", label: "Most Reproducible", icon: Award },
    { mode: "newest", label: "Newest", icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-background mesh-gradient-bg">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-[hsl(var(--aion-surface)/0.75)] backdrop-blur-2xl border-b border-border/40"
      >
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/")}
              className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <Home className="h-4 w-4" />
            </motion.button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[hsl(var(--aion-gradient-start))] to-[hsl(var(--aion-gradient-end))] flex items-center justify-center glow-ring">
                <Beaker className="h-3 w-3 text-primary-foreground" />
              </div>
              <span className="text-sm font-bold text-foreground tracking-tight font-display">AION</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Challenge Leaderboard</span>
          </div>
          <div className="w-20" />
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
        {/* Sort tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2 mb-8"
        >
          {sortButtons.map(({ mode, label, icon: Icon }) => (
            <motion.button
              key={mode}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSortMode(mode)}
              className={`flex items-center gap-1.5 text-xs px-4 py-2.5 rounded-xl transition-all duration-200 ${
                sortMode === mode
                  ? "glass-panel-elevated text-primary font-semibold glow-ring"
                  : "glass-panel text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </motion.button>
          ))}
        </motion.div>

        {/* Entries */}
        {loading ? (
          <div className="flex flex-col items-center py-20 gap-4">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Trophy className="h-5 w-5 text-primary animate-pulse" />
            </div>
            <p className="text-muted-foreground text-sm">Loading submissions…</p>
          </div>
        ) : entries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 rounded-3xl bg-muted/60 flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <p className="text-muted-foreground mb-2">No submissions yet.</p>
            <p className="text-sm text-muted-foreground/60 mb-6">Be the first to contribute to scientific discovery!</p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/")}
              className="aion-glow-button text-sm px-6 py-3"
            >
              Start Research
            </motion.button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {entries.map((entry, rank) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: rank * 0.04, ease: [0.25, 0.4, 0, 1] }}
                  whileHover={{ y: -2, transition: { duration: 0.15 } }}
                  className={`glass-panel-elevated p-4 sm:p-5 flex items-start gap-4 ${rank < 3 ? rankIcons[rank].ring : ""}`}
                >
                  {/* Rank */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${
                    rank < 3
                      ? `${rankIcons[rank].bg} ${rankIcons[rank].text}`
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {rank < 3 ? (() => { const RIcon = rankIcons[rank].icon; return <RIcon className="h-4 w-4" />; })() : rank + 1}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground truncate">{entry.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{entry.query}</p>
                    {entry.abstract && (
                      <p className="text-xs text-foreground/60 mt-2 line-clamp-2 leading-relaxed">{entry.abstract}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2.5">
                      <span className="text-[10px] text-muted-foreground">{entry.author_name}</span>
                      {entry.novelty_score > 0 && (
                        <span className="text-[10px] font-mono text-primary font-semibold px-2 py-0.5 rounded-full bg-primary/10">
                          {Math.round(Number(entry.novelty_score) * 100)}% novel
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground/50">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Votes */}
                  <div className="flex flex-col items-center gap-0.5 shrink-0">
                    <motion.button
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => vote(entry.id, "up")}
                      className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-500 transition-colors"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </motion.button>
                    <span className="text-sm font-bold font-mono text-foreground">
                      {entry.upvotes - entry.downvotes}
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => vote(entry.id, "down")}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
