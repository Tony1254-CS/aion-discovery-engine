import { LogEntry } from "@/lib/research-types";
import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal } from "lucide-react";

interface Props {
  logs: LogEntry[];
}

const dotColor: Record<LogEntry["type"], string> = {
  info: "bg-muted-foreground/30",
  success: "bg-primary",
  warning: "bg-[hsl(var(--aion-node-hypothesis))]",
  error: "bg-destructive",
};

const dotGlow: Record<LogEntry["type"], string> = {
  info: "",
  success: "shadow-[0_0_6px_hsl(var(--aion-glow)/0.4)]",
  warning: "shadow-[0_0_6px_hsl(var(--aion-node-hypothesis)/0.3)]",
  error: "shadow-[0_0_6px_hsl(var(--destructive)/0.3)]",
};

export default function LogPanel({ logs }: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs.length]);

  return (
    <div className="glass-panel p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg bg-muted/80 flex items-center justify-center">
          <Terminal className="h-3 w-3 text-muted-foreground/60" />
        </div>
        <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold">Live Log</h3>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/50">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-50" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
          </span>
          <span className="text-[9px] text-muted-foreground/50 font-mono">{logs.length}</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-0.5 text-[12px] font-mono scrollbar-thin">
        <AnimatePresence initial={false}>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -8, height: 0 }}
              animate={{ opacity: 1, x: 0, height: "auto" }}
              transition={{ duration: 0.25, ease: [0.25, 0.4, 0, 1] }}
              className="flex items-start gap-2 py-0.5"
            >
              <span className="text-[10px] text-muted-foreground/30 whitespace-nowrap pt-0.5 select-none tabular-nums">{log.time}</span>
              <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${dotColor[log.type]} ${dotGlow[log.type]}`} />
              <span className={`leading-snug ${log.type === "success" ? "text-primary/80" : log.type === "error" ? "text-destructive/80" : "text-foreground/60"}`}>
                {log.text}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={endRef} />
      </div>
    </div>
  );
}
