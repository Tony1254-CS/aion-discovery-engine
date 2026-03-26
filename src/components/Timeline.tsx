import { ResearchStage } from "@/lib/research-types";
import { motion } from "framer-motion";
import { Check, Loader2, Circle, AlertCircle } from "lucide-react";

interface Props {
  stages: ResearchStage[];
}

const iconMap = {
  pending: <Circle className="h-4 w-4 text-muted-foreground" />,
  active: <Loader2 className="h-4 w-4 text-primary animate-spin" />,
  done: <Check className="h-4 w-4 text-primary" />,
  error: <AlertCircle className="h-4 w-4 text-destructive" />,
};

export default function Timeline({ stages }: Props) {
  return (
    <div className="flex flex-col gap-0">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Pipeline</h3>
      {stages.map((stage, i) => (
        <div key={stage.id} className="flex items-start gap-3">
          {/* Vertical line + icon */}
          <div className="flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: stage.status === "active" ? 1.2 : 1 }}
              className="relative z-10 flex items-center justify-center w-7 h-7 rounded-full bg-background border border-border"
            >
              {iconMap[stage.status]}
            </motion.div>
            {i < stages.length - 1 && (
              <div className={`w-px h-8 ${stage.status === "done" ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
          {/* Label */}
          <div className="pt-1">
            <p className={`text-sm font-medium ${stage.status === "active" ? "text-primary" : stage.status === "done" ? "text-foreground" : "text-muted-foreground"}`}>
              {stage.label}
            </p>
            {stage.detail && <p className="text-xs text-muted-foreground">{stage.detail}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
