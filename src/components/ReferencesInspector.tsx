import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, AlertTriangle, CheckCircle2, XCircle, ChevronDown, ChevronUp,
  ExternalLink, Search, Filter, FileWarning, Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SourcePaper {
  title?: string;
  authors?: string | string[];
  year?: string | number;
  journal?: string;
  source?: string;
  abstract?: string;
  url?: string;
  relevance?: number;
}

interface Reference {
  text?: string;
  authors?: string | string[];
  title?: string;
  year?: string | number;
  journal?: string;
}

interface Props {
  /** All papers fetched during the literature search stage */
  fetchedPapers: SourcePaper[];
  /** References that ended up in the final paper */
  paperReferences: Reference[];
}

type MetadataIssue = "missing-authors" | "missing-year" | "missing-journal" | "missing-title";

function analyzeReference(ref: Reference | SourcePaper): MetadataIssue[] {
  const issues: MetadataIssue[] = [];
  const text = (ref as any)?.text || "";
  const title = (ref as any)?.title || "";
  const authors = (ref as any)?.authors;
  const year = (ref as any)?.year;
  const journal = (ref as any)?.journal || (ref as any)?.source;

  if (!authors && !text.match(/[A-Z][a-z]+,?\s/)) issues.push("missing-authors");
  if (!year && !text.match(/\b(19|20)\d{2}\b/)) issues.push("missing-year");
  if (!journal && !text.match(/journal|proceedings|conference|review|letters|annals/i)) issues.push("missing-journal");
  if (!title && text.length < 20) issues.push("missing-title");

  return issues;
}

function getRefString(ref: Reference | SourcePaper): string {
  if (typeof ref === "string") return ref;
  if ((ref as any)?.text) return (ref as any).text;
  const authors = Array.isArray(ref.authors) ? ref.authors.join(", ") : ref.authors || "";
  return [authors, ref.year ? `(${ref.year})` : null, ref.title, ref.journal]
    .filter(Boolean)
    .join(". ");
}

function normalizeTitle(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 60);
}

export default function ReferencesInspector({ fetchedPapers, paperReferences }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "cited" | "unused" | "issues">("all");

  const citedTitleSet = new Set(
    paperReferences.map((r) => {
      const text = (r as any)?.text || (r as any)?.title || "";
      return normalizeTitle(text);
    })
  );

  const enrichedPapers = fetchedPapers.map((paper) => {
    const normTitle = normalizeTitle(paper.title || "");
    const isCited = citedTitleSet.has(normTitle) ||
      paperReferences.some((r) => {
        const refText = getRefString(r).toLowerCase();
        return paper.title && refText.includes(paper.title.toLowerCase().slice(0, 30));
      });
    const issues = analyzeReference(paper);
    return { ...paper, isCited, issues };
  });

  const refIssues = paperReferences.map((ref) => ({
    ref,
    text: getRefString(ref),
    issues: analyzeReference(ref),
  }));

  const totalFetched = enrichedPapers.length;
  const totalCited = enrichedPapers.filter((p) => p.isCited).length;
  const totalWithIssues = refIssues.filter((r) => r.issues.length > 0).length;
  const totalUnused = totalFetched - totalCited;

  const filteredPapers = enrichedPapers.filter((p) => {
    if (filter === "cited") return p.isCited;
    if (filter === "unused") return !p.isCited;
    if (filter === "issues") return p.issues.length > 0;
    return true;
  });

  if (totalFetched === 0 && paperReferences.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-10 rounded-2xl border border-border/40 bg-[hsl(var(--aion-surface)/0.55)] backdrop-blur-xl overflow-hidden"
    >
      {/* Collapsed header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Search className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              References Inspector
              {totalWithIssues > 0 && (
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-amber-500/40 text-amber-500">
                  {totalWithIssues} issue{totalWithIssues !== 1 ? "s" : ""}
                </Badge>
              )}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {totalFetched} fetched · {totalCited} cited · {totalUnused} unused
            </p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            {/* Stats bar */}
            <div className="px-5 pb-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <StatCard icon={BookOpen} label="Fetched" value={totalFetched} color="text-primary" />
              <StatCard icon={CheckCircle2} label="Cited" value={totalCited} color="text-emerald-500" />
              <StatCard icon={XCircle} label="Unused" value={totalUnused} color="text-muted-foreground" />
              <StatCard icon={AlertTriangle} label="Issues" value={totalWithIssues} color={totalWithIssues > 0 ? "text-amber-500" : "text-muted-foreground"} />
            </div>

            {/* Filter tabs */}
            <div className="px-5 pb-3 flex gap-1.5 flex-wrap">
              {(["all", "cited", "unused", "issues"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-[10px] font-semibold px-3 py-1 rounded-full border transition-colors capitalize ${
                    filter === f
                      ? "bg-primary/15 border-primary/30 text-primary"
                      : "bg-muted/30 border-border/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f === "all" ? `All (${totalFetched})` : f === "cited" ? `Cited (${totalCited})` : f === "unused" ? `Unused (${totalUnused})` : `Issues (${totalWithIssues})`}
                </button>
              ))}
            </div>

            {/* Paper list */}
            <div className="px-5 pb-4 max-h-[360px] overflow-y-auto scrollbar-thin space-y-2">
              {filteredPapers.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">No papers match this filter.</p>
              )}
              {filteredPapers.map((paper, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className={`rounded-xl border p-3 transition-colors ${
                    paper.isCited
                      ? "border-emerald-500/20 bg-emerald-500/5"
                      : paper.issues.length > 0
                        ? "border-amber-500/20 bg-amber-500/5"
                        : "border-border/30 bg-muted/20"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="shrink-0 mt-0.5">
                      {paper.isCited ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      ) : paper.issues.length > 0 ? (
                        <FileWarning className="h-3.5 w-3.5 text-amber-500" />
                      ) : (
                        <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground leading-snug line-clamp-2">
                        {paper.title || "Untitled"}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {paper.authors && (
                          <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                            {Array.isArray(paper.authors) ? paper.authors.slice(0, 2).join(", ") : String(paper.authors).slice(0, 40)}
                          </span>
                        )}
                        {paper.year && (
                          <span className="text-[10px] text-muted-foreground">({paper.year})</span>
                        )}
                        {(paper.journal || paper.source) && (
                          <span className="text-[10px] text-muted-foreground/70 italic truncate max-w-[150px]">
                            {paper.journal || paper.source}
                          </span>
                        )}
                      </div>
                      {paper.issues.length > 0 && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {paper.issues.map((issue) => (
                            <span key={issue} className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-medium">
                              {issue.replace("missing-", "No ")}
                            </span>
                          ))}
                        </div>
                      )}
                      {typeof paper.relevance === "number" && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <div className="h-1 flex-1 max-w-[80px] rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary/60"
                              style={{ width: `${Math.min(paper.relevance, 100)}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-muted-foreground">{paper.relevance}% relevant</span>
                        </div>
                      )}
                    </div>
                    {paper.url && (
                      <a
                        href={paper.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Citation quality summary for final references */}
            {refIssues.some((r) => r.issues.length > 0) && (
              <div className="px-5 pb-4 border-t border-border/30 pt-3">
                <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2">
                  <Sparkles className="h-3 w-3 text-primary" />
                  Citation Quality Report
                </h4>
                <div className="space-y-1.5">
                  {refIssues
                    .filter((r) => r.issues.length > 0)
                    .slice(0, 8)
                    .map((r, i) => (
                      <div key={i} className="flex items-start gap-2 text-[11px]">
                        <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                        <span className="text-foreground/70 line-clamp-1">{r.text.slice(0, 80)}…</span>
                        <span className="text-amber-500/80 shrink-0">
                          {r.issues.map((i) => i.replace("missing-", "no ")).join(", ")}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="glass-panel px-3 py-2 flex items-center gap-2">
      <Icon className={`h-3.5 w-3.5 ${color}`} />
      <div>
        <p className="text-sm font-bold text-foreground">{value}</p>
        <p className="text-[9px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
