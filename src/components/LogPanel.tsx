import { LogEntry } from "@/lib/research-types";
import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  logs: LogEntry[];
}

const dotColor = {
  info: "bg-muted-foreground",
  success: "bg-primary",
  warning: "bg-aion-hypothesis",
  error: "bg-destructive",
};

export default function LogPanel({ logs }: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [logs.length]);

  return (
    <div className="glass-panel p-4 h-full flex flex-col">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Live Log</h3>
      <div className="flex-1 overflow-y-auto space-y-1.5 text-sm font-mono">
        <AnimatePresence initial={false}>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-2"
            >
              <span className="text-[10px] text-muted-foreground whitespace-nowrap pt-0.5">{log.time}</span>
              <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${dotColor[log.type]}`} />
              <span className="text-foreground/80 leading-snug">{log.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={endRef} />
      </div>
    </div>
  );
}
