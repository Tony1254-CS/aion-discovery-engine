import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, User, Bot, Pause, Play, X, Loader2, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

interface DebateMessage {
  id: number;
  role: "proponent" | "opponent" | "moderator" | "user";
  content: string;
}

interface Props {
  hypothesis?: { title?: string; description?: string };
  query: string;
  onClose?: () => void;
}

export default function DebateMode({ hypothesis, query, onClose }: Props) {
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [round, setRound] = useState(0);
  const [summary, setSummary] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const maxRounds = 4;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

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
        context: {
          role,
          systemPrompt: systemPrompts[role],
          history: conversationHistory,
          hypothesis: hypothesis,
        },
      },
    });

    if (error) throw error;
    return typeof data?.result === "string" ? data.result : data?.result?.raw || data?.result?.response || JSON.stringify(data?.result);
  };

  const startDebate = async () => {
    setIsRunning(true);
    setIsPaused(false);
    setSummary(null);
    abortRef.current = new AbortController();

    const allMessages: DebateMessage[] = [];
    let id = 0;

    // Opening from moderator
    allMessages.push({
      id: id++,
      role: "moderator",
      content: `Welcome to the scientific debate on: **"${hypothesis?.title || query}"**. The proponent will present supporting arguments, followed by the opponent's critique. Let us begin.`,
    });
    setMessages([...allMessages]);

    try {
      for (let r = 0; r < maxRounds; r++) {
        if (abortRef.current?.signal.aborted) break;
        setRound(r + 1);

        // Proponent turn
        const proArg = await callDebateAgent("proponent", allMessages);
        if (abortRef.current?.signal.aborted) break;
        allMessages.push({ id: id++, role: "proponent", content: proArg });
        setMessages([...allMessages]);

        // Wait if paused
        while (isPaused && !abortRef.current?.signal.aborted) {
          await new Promise((r) => setTimeout(r, 500));
        }

        // Small delay for readability
        await new Promise((r) => setTimeout(r, 800));

        // Opponent turn
        const oppArg = await callDebateAgent("opponent", allMessages);
        if (abortRef.current?.signal.aborted) break;
        allMessages.push({ id: id++, role: "opponent", content: oppArg });
        setMessages([...allMessages]);

        await new Promise((r) => setTimeout(r, 800));
      }

      // Moderator summary
      if (!abortRef.current?.signal.aborted) {
        const modSummary = await callDebateAgent("moderator", allMessages);
        allMessages.push({ id: id++, role: "moderator", content: modSummary });
        setMessages([...allMessages]);
        setSummary(modSummary);
      }
    } catch (e: any) {
      allMessages.push({ id: id++, role: "moderator", content: `Debate paused due to an error: ${e.message}` });
      setMessages([...allMessages]);
    }

    setIsRunning(false);
  };

  const addUserInterjection = async () => {
    if (!userInput.trim()) return;
    const newMsg: DebateMessage = { id: messages.length, role: "user", content: userInput };
    setMessages((prev) => [...prev, newMsg]);
    setUserInput("");
  };

  const stopDebate = () => {
    abortRef.current?.abort();
    setIsRunning(false);
  };

  const roleConfig = {
    proponent: { icon: Bot, color: "text-emerald-500", bg: "bg-emerald-500/10", label: "Proponent" },
    opponent: { icon: Bot, color: "text-red-400", bg: "bg-red-500/10", label: "Opponent" },
    moderator: { icon: Swords, color: "text-primary", bg: "bg-primary/10", label: "Moderator" },
    user: { icon: User, color: "text-amber-500", bg: "bg-amber-500/10", label: "You" },
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
          <Badge variant="outline" className="text-[10px] gap-1 px-2 py-0.5 border-primary/30 text-primary animate-pulse">
            Round {round}/{maxRounds}
          </Badge>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-[200px] max-h-[400px] scrollbar-thin pr-1">
        <AnimatePresence>
          {messages.map((msg) => {
            const cfg = roleConfig[msg.role];
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
                  <p className={`text-[10px] font-semibold uppercase tracking-wider ${cfg.color} mb-1`}>{cfg.label}</p>
                  <div className="text-xs text-foreground/85 leading-relaxed glass-panel p-3 rounded-xl prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {isRunning && messages.length > 0 && (
          <div className="flex items-center gap-2 text-muted-foreground text-xs pl-10">
            <Loader2 className="h-3 w-3 animate-spin" />
            Thinking…
          </div>
        )}
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
          <div className="flex gap-2 w-full">
            <button onClick={startDebate} className="aion-glow-button text-xs px-4 py-2 flex items-center gap-1.5 flex-1 justify-center">
              <Play className="h-3.5 w-3.5" />
              New Debate
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
