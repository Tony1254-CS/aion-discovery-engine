import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

type Message = { role: "user" | "assistant"; content: string };

interface PaperChatProps {
  paper: any;
  query: string;
  onPaperUpdate: (paper: any) => void;
}

const sectionKeyToLabel: Record<string, string> = {
  title: "Title",
  abstract: "Abstract",
  introduction: "Introduction",
  literatureReview: "Literature Review",
  methods: "Methods",
  results: "Results",
  discussion: "Discussion",
  conclusion: "Conclusion",
};

const trackedSections = Object.keys(sectionKeyToLabel);

const normalize = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const detectChangedSections = (previousPaper: any, nextPaper: any) => {
  return trackedSections.filter((key) => normalize(previousPaper?.[key]) !== normalize(nextPaper?.[key]));
};

const buildAssistantMessage = (
  changedSections: string[],
  previousRefCount: number,
  nextRefCount: number,
  updateNotes?: string,
  model?: string,
  wasFallback?: boolean,
) => {
  if (updateNotes && updateNotes.trim().length > 0) {
    return updateNotes;
  }

  const refDelta = nextRefCount - previousRefCount;

  if (changedSections.length === 0 && refDelta === 0) {
    return wasFallback
      ? "AI providers are currently rate-limited, so I applied a local fallback refinement to keep your workflow moving. Please retry in a few minutes for a full AI rewrite."
      : "I reviewed your request, but I could not make a reliable revision to the draft this round. Please try a more specific instruction (for example: *rewrite the discussion to compare findings against 3 cited studies*).";
  }

  const changedLabels = changedSections.map((key) => sectionKeyToLabel[key] || key);
  const sectionLine = changedLabels.length > 0
    ? `- **Updated sections:** ${changedLabels.slice(0, 5).join(", ")}${changedLabels.length > 5 ? "…" : ""}`
    : "- **Updated sections:** targeted wording edits";

  const referenceLine = refDelta !== 0
    ? `- **References:** ${refDelta > 0 ? `added ${refDelta}` : `removed ${Math.abs(refDelta)}`}`
    : "- **References:** unchanged";

  const modelLine = model ? `- **Engine:** ${model}` : null;
  const modeLine = wasFallback ? "- **Mode:** local fallback (providers currently unavailable)" : null;

  return [
    wasFallback ? "I applied a local fallback update to your paper." : "I updated the paper based on your request.",
    "",
    sectionLine,
    referenceLine,
    modeLine,
    modelLine,
  ].filter(Boolean).join("\n");
};

export default function PaperChat({ paper, query, onPaperUpdate }: PaperChatProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    const userMsg: Message = { role: "user", content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("research-agent", {
        body: {
          query: text,
          stage: "refine",
          context: {
            paper,
            chatHistory: nextMessages.slice(-10),
            originalQuery: query,
          },
        },
      });

      if (error) throw error;

      const result = data?.result;
      if (result && typeof result === "object" && result.title) {
        const changedSections = detectChangedSections(paper, result);
        const previousRefCount = Array.isArray(paper?.references) ? paper.references.length : 0;
        const nextRefCount = Array.isArray(result?.references) ? result.references.length : 0;
        const providerError = typeof data?.error === "string" ? data.error : undefined;
        const wasFallback = Boolean(data?.rateLimited) || (typeof result?.updateNotes === "string" && result.updateNotes.toLowerCase().includes("fallback"));

        onPaperUpdate(result);

        const assistantReply = buildAssistantMessage(
          changedSections,
          previousRefCount,
          nextRefCount,
          typeof result?.updateNotes === "string" ? result.updateNotes : undefined,
          typeof data?.model === "string" ? data.model : undefined,
          wasFallback,
        );

        const finalReply = providerError && wasFallback
          ? `${assistantReply}\n\n⚠️ Provider status: ${providerError}`
          : assistantReply;

        setMessages((prev) => [...prev, { role: "assistant", content: finalReply }]);
      } else if (result?.raw && typeof result.raw === "string") {
        setMessages((prev) => [...prev, { role: "assistant", content: result.raw }]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "I received the request, but the revision payload was incomplete. Please try again with a specific section target.",
          },
        ]);
      }
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Sorry, something went wrong: ${e.message || "Please try again."}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
          >
            <MessageCircle className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-4rem)] rounded-2xl border border-border bg-background shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Refine Paper</span>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground text-xs mt-8 space-y-2">
                  <p className="font-medium">Ask me to refine the paper</p>
                  <p>e.g. "Expand the discussion section" or "Add more citations to the introduction"</p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                </div>
              )}
            </div>

            <div className="px-3 py-3 border-t border-border">
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                  placeholder="Refine a section…"
                  disabled={loading}
                  className="flex-1 bg-muted/50 border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                />
                <button
                  onClick={send}
                  disabled={!input.trim() || loading}
                  className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
