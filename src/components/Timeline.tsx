import { ResearchStage } from "@/lib/research-types";
import { motion } from "framer-motion";
import { Check, Loader2, Circle, AlertCircle } from "lucide-react";

interface Props {
  stages: ResearchStage[];
}

const iconMap = {
  pending: <Circle className="h-3.5 w-3.5 text-muted-foreground/30" />,
  active: <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />,
  done: <Check className="h-3.5 w-3.5 text-primary" />,
  error: <AlertCircle className="h-3.5 w-3.5 text-destructive" />,
};

export default function Timeline({ stages }: Props) {
  return (
    <div className="flex flex-col gap-0">
      <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold mb-4">Pipeline</h3>
      {stages.map((stage, i) => (
        <motion.div
          key={stage.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05, duration: 0.3, ease: [0.25, 0.4, 0, 1] }}
          className="flex items-start gap-3"
        >
          <div className="flex flex-col items-center">
            <motion.div
              animate={{
                scale: stage.status === "active" ? [1, 1.15, 1] : 1,
              }}
              transition={{
                duration: 1.5,
                repeat: stage.status === "active" ? Infinity : 0,
                ease: "easeInOut",
              }}
              className={`relative z-10 flex items-center justify-center w-7 h-7 rounded-full transition-all duration-500 ${
                stage.status === "done"
                  ? "bg-primary/10 border-2 border-primary/25"
                  : stage.status === "active"
                  ? "bg-primary/15 border-2 border-primary/40 glow-ring-strong"
                  : stage.status === "error"
                  ? "bg-destructive/10 border-2 border-destructive/25"
                  : "bg-muted/60 border border-border/60"
              }`}
            >
              {iconMap[stage.status]}
            </motion.div>
            {i < stages.length - 1 && (
              <motion.div
                className="w-px h-6 transition-all duration-700"
                style={{
                  background: stage.status === "done"
                    ? `linear-gradient(to bottom, hsl(var(--aion-gradient-start) / 0.4), hsl(var(--aion-gradient-end) / 0.2))`
                    : `hsl(var(--border) / 0.4)`,
                }}
              />
            )}
          </div>
          <div className="pt-1 pb-1">
            <p className={`text-[13px] font-medium transition-all duration-300 ${
              stage.status === "active"
                ? "text-primary"
                : stage.status === "done"
                ? "text-foreground"
                : "text-muted-foreground/50"
            }`}>
              {stage.label}
            </p>
            {stage.detail && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[11px] text-primary/60 mt-0.5 font-mono"
              >
                {stage.detail}
              </motion.p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
