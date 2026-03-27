import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function IdeaReview() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  const handleReview = () => {
    if (text.trim().length < 50) {
      setError("Please provide at least 50 characters to review.");
      return;
    }
    setError("");
    setLoading(true);
    // Navigate to the results page with the idea text
    navigate("/idea-review", { state: { ideaText: text.trim() } });
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="glass-panel-hero p-[5px] mb-4">
          <div className="bg-background/25 rounded-[calc(1.5rem-3px)] p-5">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your research idea, proposal, abstract, or draft here…"
              rows={8}
              maxLength={30000}
              className="w-full bg-transparent border-none outline-none resize-none text-white placeholder:text-muted-foreground/35 text-sm leading-relaxed font-light"
            />
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]">
              <span className="text-[10px] text-muted-foreground/40">
                {wordCount} words · Max ~5,000 words
              </span>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleReview}
                disabled={loading || text.trim().length < 50}
                className="aion-glow-button flex items-center gap-2 disabled:opacity-15 disabled:cursor-not-allowed disabled:shadow-none text-sm px-6 py-2.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Reviewing…
                  </>
                ) : (
                  <>
                    Review My Idea
                    <Send className="h-4 w-4" />
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/[0.08] border border-destructive/15 mt-4"
          >
            <XCircle className="h-4 w-4 text-destructive shrink-0" />
            <p className="text-xs text-destructive">{error}</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
