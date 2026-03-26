import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, ArrowUp, ArrowDown, Home, Beaker, Clock, Sparkles, Award } from "lucide-react";
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

    const update = type === "up"
      ? { upvotes: entry.upvotes + 1 }
      : { downvotes: entry.downvotes + 1 };

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
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <Home className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[hsl(var(--aion-gradient-start))] to-[hsl(var(--aion-gradient-end))] flex items-center justify-center">
                <Beaker className="h-3 w-3 text-primary-foreground" />
              </div>
              <span className="text-sm font-bold text-foreground tracking-tight">AION</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Challenge Leaderboard</span>
          </div>
          <div />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Sort tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {sortButtons.map(({ mode, label, icon: Icon }) => (
            <button
              key={mode}
              onClick={() => setSortMode(mode)}
              className={`flex items-center gap-1.5 text-xs px-4 py-2 rounded-xl border transition-all ${
                sortMode === mode
                  ? "border-primary/30 bg-primary/10 text-primary font-semibold"
                  : "border-border bg-card/50 text-muted-foreground hover:text-foreground hover:border-primary/20"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Entries */}
        {loading ? (
          <div className="text-center text-muted-foreground py-20">Loading submissions…</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20">
            <Trophy className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No submissions yet. Be the first!</p>
            <button onClick={() => navigate("/")} className="aion-glow-button text-sm mt-6 px-6 py-3">
              Start Research
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry, rank) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: rank * 0.03 }}
                className="glass-panel-elevated p-4 flex items-start gap-4"
              >
                {/* Rank */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${
                  rank === 0 ? "bg-amber-500/10 text-amber-500" :
                  rank === 1 ? "bg-slate-400/10 text-slate-400" :
                  rank === 2 ? "bg-orange-600/10 text-orange-600" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {rank + 1}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground truncate">{entry.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{entry.query}</p>
                  {entry.abstract && (
                    <p className="text-xs text-foreground/60 mt-1.5 line-clamp-2 leading-relaxed">{entry.abstract}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-muted-foreground">{entry.author_name}</span>
                    {entry.novelty_score > 0 && (
                      <span className="text-[10px] font-mono text-primary">
                        Novelty: {Math.round(Number(entry.novelty_score) * 100)}%
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground/60">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Votes */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <button
                    onClick={() => vote(entry.id, "up")}
                    className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-500 transition-colors"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-bold font-mono text-foreground">
                    {entry.upvotes - entry.downvotes}
                  </span>
                  <button
                    onClick={() => vote(entry.id, "down")}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
