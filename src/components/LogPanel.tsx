import { LogEntry } from "@/lib/research-types";
import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal } from "lucide-react";

interface Props {
  logs: LogEntry[];
}

const dotColor: Record<LogEntry["type"], string> = {
  info: "bg-muted-foreground/40",
  success: "bg-primary",
  warning: "bg-[hsl(var(--aion-node-hypothesis))]",
  error: "bg-destructive",
};

export default function LogPanel({ logs }: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs.length]);

  return (
    <div className="glass-panel p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Terminal className="h-3.5 w-3.5 text-muted-foreground/50" />
        <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-semibold">Live Log</h3>
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[9px] text-muted-foreground/50 font-mono">{logs.length} events</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1 text-[12px] font-mono scrollbar-thin">
        <AnimatePresence initial={false}>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-start gap-2 py-0.5"
            >
              <span className="text-[10px] text-muted-foreground/40 whitespace-nowrap pt-0.5 select-none">{log.time}</span>
              <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${dotColor[log.type]}`} />
              <span className="text-foreground/70 leading-snug">{log.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={endRef} />
      </div>
    </div>
  );
}
