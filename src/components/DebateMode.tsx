import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, User, Bot, Play, X, Loader2, MessageSquare, Pause } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

interface DebateMessage {
  id: number;
  role: "proponent" | "opponent" | "moderator" | "user";
  content: string;
  isStreaming?: boolean;
}

interface Props {
  hypothesis?: { title?: string; description?: string };
  query: string;
  onClose?: () => void;
}

const ROLE_CONFIG = {
  proponent: { icon: Bot, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30", label: "Proponent", emoji: "🟢" },
  opponent: { icon: Bot, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", label: "Opponent", emoji: "🔴" },
  moderator: { icon: Swords, color: "text-primary", bg: "bg-primary/10", border: "border-primary/30", label: "Moderator", emoji: "⚖️" },
  user: { icon: User, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/30", label: "You", emoji: "💬" },
} as const;

const MAX_ROUNDS = 4;
const STREAM_INTERVAL = 18; // ms per word

export default function DebateMode({ hypothesis, query, onClose }: Props) {
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [round, setRound] = useState(0);
  const [currentSpeaker, setCurrentSpeaker] = useState<keyof typeof ROLE_CONFIG | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const pausedRef = useRef(false);

  useEffect(() => { pausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, currentSpeaker]);

  const streamMessage = useCallback((role: DebateMessage["role"], fullText: string, id: number): Promise<void> => {
    return new Promise((resolve) => {
      const words = fullText.split(/(\s+)/);
      let index = 0;
      const tick = () => {
        if (abortRef.current?.signal.aborted) { resolve(); return; }
        index += 3; // 3 tokens at a time for speed
        const partial = words.slice(0, Math.min(index, words.length)).join("");
        const done = index >= words.length;
        setMessages(prev => {
          const existing = prev.findIndex(m => m.id === id);
          const msg: DebateMessage = { id, role, content: done ? fullText : partial, isStreaming: !done };
          if (existing >= 0) {
            const copy = [...prev];
            copy[existing] = msg;
            return copy;
          }
          return [...prev, msg];
        });
        if (done) resolve();
        else setTimeout(tick, STREAM_INTERVAL);
      };
      tick();
    });
  }, []);

  const callDebateAgent = async (role: string, history: DebateMessage[]) => {
    const systemPrompts: Record<string, string> = {
      proponent: `You are a scientific PROPONENT defending this hypothesis: "${hypothesis?.title || query}". Use supporting evidence, cite plausible studies, and build a compelling case. Be rigorous but persuasive. Keep responses to 2-3 paragraphs. Respond in plain text, no JSON.`,
      opponent: `You are a scientific OPPONENT challenging this hypothesis: "${hypothesis?.title || query}". Identify methodological weaknesses, alternative explanations, confounds, and contradictory evidence. Be rigorous and fair but critical. Keep responses to 2-3 paragraphs. Respond in plain text, no JSON.`,
      moderator: `You are a neutral MODERATOR summarizing a scientific debate about: "${hypothesis?.title || query}". Synthesize both sides fairly, highlight the strongest arguments, identify areas of agreement and remaining disagreements. Keep to 2-3 paragraphs.`,
    };

    const conversationHistory = history.map((m) => ({
      role: "user" as const,
      content: `[${m.role.toUpperCase()}]: ${m.content}`,
    }));

    const { data, error } = await supabase.functions.invoke("research-agent", {
      body: {
        query,
        stage: "debate",
        context: { role, systemPrompt: systemPrompts[role], history: conversationHistory, hypothesis },
      },
    });

    if (error) throw error;
    if (data?.rateLimited) throw new Error("AI is temporarily rate-limited. Please try again in a moment.");
    return typeof data?.result === "string" ? data.result : data?.result?.raw || data?.result?.response || JSON.stringify(data?.result);
  };

  const startDebate = async () => {
    setIsRunning(true);
    setIsPaused(false);
    setCurrentSpeaker(null);
    abortRef.current = new AbortController();

    const history: DebateMessage[] = [];
    let id = 0;

    // Moderator opening
    const openingText = `Welcome to the scientific debate on: **"${hypothesis?.title || query}"**. The proponent will present supporting arguments, followed by the opponent's critique. Let us begin.`;
    setCurrentSpeaker("moderator");
    await streamMessage("moderator", openingText, id);
    history.push({ id: id++, role: "moderator", content: openingText });

    try {
      for (let r = 0; r < MAX_ROUNDS; r++) {
        if (abortRef.current?.signal.aborted) break;
        setRound(r + 1);

        // Wait if paused
        while (pausedRef.current && !abortRef.current?.signal.aborted) {
          await new Promise(res => setTimeout(res, 400));
        }

        // Proponent
        setCurrentSpeaker("proponent");
        const proArg = await callDebateAgent("proponent", history);
        if (abortRef.current?.signal.aborted) break;
        const proId = id++;
        await streamMessage("proponent", proArg, proId);
        history.push({ id: proId, role: "proponent", content: proArg });

        while (pausedRef.current && !abortRef.current?.signal.aborted) {
          await new Promise(res => setTimeout(res, 400));
        }

        await new Promise(res => setTimeout(res, 600));

        // Opponent
        setCurrentSpeaker("opponent");
        const oppArg = await callDebateAgent("opponent", history);
        if (abortRef.current?.signal.aborted) break;
        const oppId = id++;
        await streamMessage("opponent", oppArg, oppId);
        history.push({ id: oppId, role: "opponent", content: oppArg });

        await new Promise(res => setTimeout(res, 600));
      }

      // Moderator summary
      if (!abortRef.current?.signal.aborted) {
        setCurrentSpeaker("moderator");
        const modSummary = await callDebateAgent("moderator", history);
        const modId = id++;
        await streamMessage("moderator", modSummary, modId);
        history.push({ id: modId, role: "moderator", content: modSummary });
      }
    } catch (e: any) {
      const errId = id++;
      const errMsg = `Debate interrupted: ${e.message}`;
      setMessages(prev => [...prev, { id: errId, role: "moderator", content: errMsg }]);
    }

    setCurrentSpeaker(null);
    setIsRunning(false);
  };

  const addUserInterjection = () => {
    if (!userInput.trim()) return;
    setMessages(prev => [...prev, { id: Date.now(), role: "user", content: userInput }]);
    setUserInput("");
  };

  const stopDebate = () => {
    abortRef.current?.abort();
    setIsRunning(false);
    setCurrentSpeaker(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      className="glass-panel-elevated p-5 sm:p-6 relative flex flex-col"
      style={{ maxHeight: "70vh" }}
    >
      {onClose && (
        <button onClick={() => { stopDebate(); onClose(); }} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground z-10">
          <X className="h-4 w-4" />
        </button>
      )}

      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Swords className="h-3.5 w-3.5 text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Scientific Debate</h3>
        {isRunning && (
          <Badge variant="outline" className="text-[10px] gap-1 px-2 py-0.5 border-primary/30 text-primary">
            Round {round}/{MAX_ROUNDS}
          </Badge>
        )}
      </div>

      {/* Active speaker banner */}
      <AnimatePresence>
        {currentSpeaker && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`flex items-center gap-2 mb-3 px-3 py-1.5 rounded-lg border ${ROLE_CONFIG[currentSpeaker].bg} ${ROLE_CONFIG[currentSpeaker].border}`}
          >
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${ROLE_CONFIG[currentSpeaker].color === "text-emerald-500" ? "bg-emerald-400" : ROLE_CONFIG[currentSpeaker].color === "text-red-400" ? "bg-red-400" : "bg-primary"}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${ROLE_CONFIG[currentSpeaker].color === "text-emerald-500" ? "bg-emerald-500" : ROLE_CONFIG[currentSpeaker].color === "text-red-400" ? "bg-red-500" : "bg-primary"}`} />
            </span>
            <span className={`text-[11px] font-medium ${ROLE_CONFIG[currentSpeaker].color}`}>
              {ROLE_CONFIG[currentSpeaker].emoji} {ROLE_CONFIG[currentSpeaker].label} is responding…
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-[200px] max-h-[400px] scrollbar-thin pr-1">
        <AnimatePresence>
          {messages.map((msg) => {
            const cfg = ROLE_CONFIG[msg.role];
            const Icon = cfg.icon;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div className={`w-7 h-7 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                  <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                </div>
                <div className={`flex-1 ${msg.role === "user" ? "text-right" : ""}`}>
                  <p className={`text-[10px] font-semibold uppercase tracking-wider ${cfg.color} mb-1`}>
                    {cfg.label}
                    {msg.isStreaming && <span className="ml-1 inline-block w-1.5 h-3 bg-current animate-pulse rounded-sm align-middle" />}
                  </p>
                  <div className="text-xs text-foreground/85 leading-relaxed glass-panel p-3 rounded-xl prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {!isRunning && messages.length === 0 && (
          <button onClick={startDebate} className="aion-glow-button text-xs px-4 py-2 flex items-center gap-1.5 w-full justify-center">
            <Swords className="h-3.5 w-3.5" />
            Start Debate
          </button>
        )}

        {isRunning && (
          <>
            <button onClick={() => { setIsPaused(p => !p); }} className={`p-2 rounded-xl transition-colors ${isPaused ? "bg-amber-500/20 text-amber-400" : "bg-muted/50 text-muted-foreground hover:text-foreground"}`}>
              {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            </button>
            <input
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addUserInterjection()}
              placeholder="Interject a question…"
              className="flex-1 text-xs px-3 py-2 rounded-xl bg-muted/50 border border-border/50 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/40 transition-colors"
            />
            <button onClick={addUserInterjection} className="p-2 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors text-primary">
              <MessageSquare className="h-3.5 w-3.5" />
            </button>
            <button onClick={stopDebate} className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-colors text-red-400">
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        )}

        {!isRunning && messages.length > 0 && (
          <button onClick={() => { setMessages([]); setRound(0); startDebate(); }} className="aion-glow-button text-xs px-4 py-2 flex items-center gap-1.5 w-full justify-center">
            <Play className="h-3.5 w-3.5" />
            New Debate
          </button>
        )}
      </div>
    </motion.div>
  );
}
