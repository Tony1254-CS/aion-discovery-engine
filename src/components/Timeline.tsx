import { ResearchStage } from "@/lib/research-types";
import { motion } from "framer-motion";
import { Check, Loader2, Circle, AlertCircle } from "lucide-react";

interface Props {
  stages: ResearchStage[];
}

const iconMap = {
  pending: <Circle className="h-3.5 w-3.5 text-muted-foreground/40" />,
  active: <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />,
  done: <Check className="h-3.5 w-3.5 text-primary" />,
  error: <AlertCircle className="h-3.5 w-3.5 text-destructive" />,
};

export default function Timeline({ stages }: Props) {
  return (
    <div className="flex flex-col gap-0">
      <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-semibold mb-4">Pipeline</h3>
      {stages.map((stage, i) => (
        <div key={stage.id} className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: stage.status === "active" ? 1.15 : 1 }}
              className={`relative z-10 flex items-center justify-center w-7 h-7 rounded-full transition-colors duration-300 ${
                stage.status === "done"
                  ? "bg-accent border-2 border-primary/20"
                  : stage.status === "active"
                  ? "bg-accent border-2 border-primary/40 shadow-[0_0_12px_hsl(var(--aion-glow)/0.2)]"
                  : "bg-muted border border-border"
              }`}
            >
              {iconMap[stage.status]}
            </motion.div>
            {i < stages.length - 1 && (
              <div className={`w-px h-6 transition-colors duration-500 ${
                stage.status === "done" ? "bg-primary/40" : "bg-border/50"
              }`} />
            )}
          </div>
          <div className="pt-1">
            <p className={`text-[13px] font-medium transition-colors duration-300 ${
              stage.status === "active"
                ? "text-primary"
                : stage.status === "done"
                ? "text-foreground"
                : "text-muted-foreground/60"
            }`}>
              {stage.label}
            </p>
            {stage.detail && (
              <p className="text-[11px] text-muted-foreground/60 mt-0.5">{stage.detail}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
