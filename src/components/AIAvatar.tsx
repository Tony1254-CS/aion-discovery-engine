import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, Bot, MessageSquare } from "lucide-react";

type AvatarState = "idle" | "thinking" | "reading" | "writing" | "eureka" | "speaking";

interface Props {
  currentStage?: string;
  name?: string;
  personality?: "curious" | "cautious" | "creative";
  latestLog?: string;
}

const stateEmoji: Record<AvatarState, string> = {
  idle: "🧬",
  thinking: "🤔",
  reading: "📖",
  writing: "✍️",
  eureka: "💡",
  speaking: "🗣️",
};

const stateLabel: Record<AvatarState, string> = {
  idle: "Ready",
  thinking: "Analyzing…",
  reading: "Reading papers…",
  writing: "Writing…",
  eureka: "Discovery!",
  speaking: "Summarizing…",
};

function stageToState(stage?: string): AvatarState {
  if (!stage) return "idle";
  if (stage === "literature") return "reading";
  if (stage === "gaps") return "thinking";
  if (stage === "hypotheses") return "eureka";
  if (stage === "code" || stage === "experiments") return "thinking";
  if (stage === "paper") return "writing";
  return "idle";
}

export default function AIAvatar({ currentStage, name = "ARIA", personality = "curious", latestLog }: Props) {
  const [state, setState] = useState<AvatarState>("idle");
  const [muted, setMuted] = useState(true);
  const [showBubble, setShowBubble] = useState(false);
  const [bubbleText, setBubbleText] = useState("");
  const bubbleTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const newState = stageToState(currentStage);
    setState(newState);
  }, [currentStage]);

  useEffect(() => {
    if (latestLog && latestLog.length > 10) {
      setBubbleText(latestLog);
      setShowBubble(true);
      clearTimeout(bubbleTimer.current);
      bubbleTimer.current = setTimeout(() => setShowBubble(false), 5000);

      // Web Speech API
      if (!muted && typeof window !== "undefined" && "speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(latestLog.slice(0, 120));
        utterance.rate = 1.1;
        utterance.pitch = personality === "creative" ? 1.2 : personality === "cautious" ? 0.9 : 1.0;
        utterance.volume = 0.6;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }
    }
    return () => clearTimeout(bubbleTimer.current);
  }, [latestLog, muted, personality]);

  // Animated gradient background
  const pulseClass = state === "eureka" ? "animate-bounce" : state === "thinking" ? "animate-pulse" : "";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="fixed bottom-6 left-6 z-40 flex flex-col items-start gap-2"
    >
      {/* Speech bubble */}
      <AnimatePresence>
        {showBubble && bubbleText && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            className="glass-panel px-3 py-2 max-w-[220px] mb-1 relative"
          >
            <p className="text-[11px] text-foreground leading-relaxed line-clamp-3">{bubbleText}</p>
            <div className="absolute -bottom-1 left-5 w-2 h-2 bg-[hsl(var(--aion-glass)/0.8)] border-b border-r border-[hsl(var(--aion-glass-border)/0.5)] rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar */}
      <div className="flex items-end gap-2">
        <motion.div
          className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br from-[hsl(var(--aion-gradient-start))] to-[hsl(var(--aion-gradient-end))] flex items-center justify-center shadow-lg cursor-pointer ${pulseClass}`}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowBubble(!showBubble)}
        >
          {/* Animated ring */}
          {state !== "idle" && (
            <motion.div
              className="absolute inset-0 rounded-2xl border-2 border-primary/40"
              animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}

          <span className="text-2xl">{stateEmoji[state]}</span>

          {/* Status dot */}
          <div className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${
            state === "idle" ? "bg-muted-foreground" : state === "eureka" ? "bg-amber-400" : "bg-emerald-400"
          }`} />
        </motion.div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-foreground tracking-tight">{name}</span>
          <span className="text-[9px] text-muted-foreground">{stateLabel[state]}</span>
        </div>

        {/* Mute toggle */}
        <button
          onClick={() => {
            setMuted(!muted);
            if (!muted) window.speechSynthesis?.cancel();
          }}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          title={muted ? "Unmute" : "Mute"}
        >
          {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
        </button>
      </div>
    </motion.div>
  );
}
