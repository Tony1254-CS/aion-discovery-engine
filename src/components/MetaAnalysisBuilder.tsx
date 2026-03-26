import { useState, useMemo, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { GitMerge, Plus, Trash2, BarChart3 } from "lucide-react";

const Plot = lazy(() => import("react-plotly.js"));

interface Study {
  id: number;
  label: string;
  effectSize: number;
  standardError: number;
  sampleSize: number;
}

function runMetaAnalysis(studies: Study[]) {
  if (studies.length === 0) return null;

  // DerSimonian-Laird random-effects meta-analysis
  const weights = studies.map((s) => 1 / (s.standardError ** 2));
  const totalW = weights.reduce((a, b) => a + b, 0);
  const fixedEffect = studies.reduce((acc, s, i) => acc + weights[i] * s.effectSize, 0) / totalW;

  // Q statistic for heterogeneity
  const Q = studies.reduce((acc, s, i) => acc + weights[i] * (s.effectSize - fixedEffect) ** 2, 0);
  const df = studies.length - 1;
  const C = totalW - studies.reduce((acc, _, i) => acc + weights[i] ** 2, 0) / totalW;
  const tau2 = Math.max(0, (Q - df) / C);

  // Random-effects weights
  const reWeights = studies.map((s) => 1 / (s.standardError ** 2 + tau2));
  const reTotalW = reWeights.reduce((a, b) => a + b, 0);
  const pooledEffect = studies.reduce((acc, s, i) => acc + reWeights[i] * s.effectSize, 0) / reTotalW;
  const pooledSE = Math.sqrt(1 / reTotalW);
  const pooledCI: [number, number] = [pooledEffect - 1.96 * pooledSE, pooledEffect + 1.96 * pooledSE];

  // I² = ((Q - df) / Q) * 100
  const I2 = df > 0 ? Math.max(0, ((Q - df) / Q) * 100) : 0;

  // Q-test p-value (approximate)
  const qP = Math.max(0.0001, Math.exp(-0.5 * Math.max(0, Q - df)));

  return { pooledEffect, pooledSE, pooledCI, Q, I2, qP, tau2, reWeights, reTotalW };
}

export default function MetaAnalysisBuilder() {
  const [studies, setStudies] = useState<Study[]>([
    { id: 1, label: "Study 1", effectSize: 0.45, standardError: 0.12, sampleSize: 120 },
    { id: 2, label: "Study 2", effectSize: 0.62, standardError: 0.15, sampleSize: 85 },
    { id: 3, label: "Study 3", effectSize: 0.33, standardError: 0.10, sampleSize: 200 },
    { id: 4, label: "Study 4", effectSize: 0.55, standardError: 0.18, sampleSize: 60 },
    { id: 5, label: "Study 5", effectSize: 0.28, standardError: 0.08, sampleSize: 350 },
  ]);
  const [nextId, setNextId] = useState(6);

  const result = useMemo(() => runMetaAnalysis(studies), [studies]);

  const addStudy = () => {
    setStudies((prev) => [...prev, {
      id: nextId, label: `Study ${nextId}`, effectSize: 0.4, standardError: 0.12, sampleSize: 100,
    }]);
    setNextId((n) => n + 1);
  };

  const removeStudy = (id: number) => {
    setStudies((prev) => prev.filter((s) => s.id !== id));
  };

  const updateStudy = (id: number, field: keyof Study, value: number | string) => {
    setStudies((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s));
  };

  // Forest plot data
  const forestData = result ? (() => {
    const labels = [...studies.map((s) => s.label), "Pooled Effect"];
    const effects = [...studies.map((s) => s.effectSize), result.pooledEffect];
    const lowerCI = [...studies.map((s) => s.effectSize - 1.96 * s.standardError), result.pooledCI[0]];
    const upperCI = [...studies.map((s) => s.effectSize + 1.96 * s.standardError), result.pooledCI[1]];

    return [
      {
        x: effects,
        y: labels,
        type: "scatter" as const,
        mode: "markers" as const,
        marker: {
          color: [...studies.map(() => "hsl(195, 75%, 45%)"), "hsl(168, 70%, 40%)"],
          size: [...studies.map((s) => Math.min(20, Math.max(6, Math.sqrt(s.sampleSize / 5)))), 14],
          symbol: [...studies.map(() => "circle"), "diamond"],
        },
        error_x: {
          type: "data" as const,
          symmetric: false,
          array: upperCI.map((u, i) => u - effects[i]),
          arrayminus: effects.map((e, i) => e - lowerCI[i]),
          color: "rgba(148, 163, 184, 0.5)",
          thickness: 1.5,
        },
        hovertemplate: "%{y}<br>Effect: %{x:.3f}<extra></extra>",
      },
      {
        x: [0, 0],
        y: [labels[0], labels[labels.length - 1]],
        type: "scatter" as const,
        mode: "lines" as const,
        line: { color: "rgba(148, 163, 184, 0.3)", width: 1, dash: "dash" as const },
        hoverinfo: "skip" as const,
      },
    ];
  })() : [];

  // Funnel plot data
  const funnelData = result ? [
    {
      x: studies.map((s) => s.effectSize),
      y: studies.map((s) => s.standardError),
      type: "scatter" as const,
      mode: "markers" as const,
      marker: { color: "hsl(195, 75%, 45%)", size: 8, opacity: 0.7 },
      hovertemplate: "%{text}<br>Effect: %{x:.3f}<br>SE: %{y:.3f}<extra></extra>",
      text: studies.map((s) => s.label),
    },
    {
      x: [result.pooledEffect, result.pooledEffect],
      y: [0, Math.max(...studies.map((s) => s.standardError)) * 1.2],
      type: "scatter" as const,
      mode: "lines" as const,
      line: { color: "hsl(168, 70%, 40%)", width: 1.5, dash: "dash" as const },
      hoverinfo: "skip" as const,
    },
  ] : [];

  const baseLayout = {
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    font: { family: "Inter, system-ui", color: "#6b7280", size: 11 },
    margin: { t: 35, r: 15, b: 45, l: 100 },
    showlegend: false,
    autosize: true,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel-elevated p-5 sm:p-6"
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <GitMerge className="h-3.5 w-3.5 text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Meta-Analysis Builder</h3>
        <Badge variant="outline" className="text-[10px] gap-1 px-2 py-0.5 border-primary/30 text-primary">
          Random Effects
        </Badge>
      </div>

      {/* Study editor */}
      <div className="space-y-2 mb-5 max-h-[250px] overflow-y-auto scrollbar-thin pr-1">
        {studies.map((s) => (
          <div key={s.id} className="flex items-center gap-2 glass-panel p-2.5 rounded-xl">
            <input
              value={s.label}
              onChange={(e) => updateStudy(s.id, "label", e.target.value)}
              className="w-24 text-xs px-2 py-1 rounded-lg bg-muted/50 border border-border/40 text-foreground outline-none focus:border-primary/40"
            />
            <div className="flex-1 grid grid-cols-3 gap-2">
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-muted-foreground/60 shrink-0">d:</span>
                <input
                  type="number"
                  step="0.01"
                  value={s.effectSize}
                  onChange={(e) => updateStudy(s.id, "effectSize", parseFloat(e.target.value) || 0)}
                  className="w-full text-xs px-1.5 py-1 rounded-lg bg-muted/50 border border-border/40 text-foreground outline-none focus:border-primary/40 font-mono"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-muted-foreground/60 shrink-0">SE:</span>
                <input
                  type="number"
                  step="0.01"
                  value={s.standardError}
                  onChange={(e) => updateStudy(s.id, "standardError", parseFloat(e.target.value) || 0.01)}
                  className="w-full text-xs px-1.5 py-1 rounded-lg bg-muted/50 border border-border/40 text-foreground outline-none focus:border-primary/40 font-mono"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-muted-foreground/60 shrink-0">n:</span>
                <input
                  type="number"
                  step="1"
                  value={s.sampleSize}
                  onChange={(e) => updateStudy(s.id, "sampleSize", parseInt(e.target.value) || 10)}
                  className="w-full text-xs px-1.5 py-1 rounded-lg bg-muted/50 border border-border/40 text-foreground outline-none focus:border-primary/40 font-mono"
                />
              </div>
            </div>
            <button onClick={() => removeStudy(s.id)} className="p-1 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      <button onClick={addStudy} className="w-full text-xs py-2 rounded-xl border border-dashed border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors flex items-center justify-center gap-1.5 mb-5">
        <Plus className="h-3 w-3" /> Add Study
      </button>

      {/* Charts */}
      {result && (
        <Suspense fallback={<div className="h-[240px] flex items-center justify-center text-muted-foreground text-sm">Computing…</div>}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
            <div className="bg-background/30 rounded-xl p-2">
              <Plot
                data={forestData}
                layout={{
                  ...baseLayout,
                  title: { text: "Forest Plot", font: { size: 12, color: "#9ca3af" } },
                  xaxis: { gridcolor: "rgba(100,116,139,0.08)", zeroline: true, zerolinecolor: "rgba(148,163,184,0.3)", title: { text: "Effect Size (d)", font: { size: 10 } } },
                  yaxis: { gridcolor: "rgba(100,116,139,0.08)", autorange: "reversed" as const },
                }}
                config={{ responsive: true, displayModeBar: false }}
                style={{ width: "100%", height: 260 }}
              />
            </div>
            <div className="bg-background/30 rounded-xl p-2">
              <Plot
                data={funnelData}
                layout={{
                  ...baseLayout,
                  margin: { ...baseLayout.margin, l: 50 },
                  title: { text: "Funnel Plot", font: { size: 12, color: "#9ca3af" } },
                  xaxis: { gridcolor: "rgba(100,116,139,0.08)", zeroline: false, title: { text: "Effect Size (d)", font: { size: 10 } } },
                  yaxis: { gridcolor: "rgba(100,116,139,0.08)", autorange: "reversed" as const, title: { text: "Standard Error", font: { size: 10 } } },
                }}
                config={{ responsive: true, displayModeBar: false }}
                style={{ width: "100%", height: 260 }}
              />
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="text-center py-3 px-2 rounded-xl bg-primary/10 glow-ring">
              <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Pooled Effect</p>
              <p className="text-lg font-bold font-mono text-primary">{result.pooledEffect.toFixed(3)}</p>
              <p className="text-[9px] text-muted-foreground font-mono">[{result.pooledCI[0].toFixed(3)}, {result.pooledCI[1].toFixed(3)}]</p>
            </div>
            <div className="text-center py-3 px-2 rounded-xl bg-muted/50">
              <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">I² Heterogeneity</p>
              <p className={`text-lg font-bold font-mono ${result.I2 > 75 ? "text-red-400" : result.I2 > 50 ? "text-amber-500" : "text-foreground"}`}>
                {result.I2.toFixed(1)}%
              </p>
            </div>
            <div className="text-center py-3 px-2 rounded-xl bg-muted/50">
              <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Q-test p</p>
              <p className="text-lg font-bold font-mono text-foreground">{result.qP < 0.001 ? "< .001" : result.qP.toFixed(3)}</p>
            </div>
            <div className="text-center py-3 px-2 rounded-xl bg-muted/50">
              <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">τ²</p>
              <p className="text-lg font-bold font-mono text-foreground">{result.tau2.toFixed(4)}</p>
            </div>
          </div>
        </Suspense>
      )}
    </motion.div>
  );
}
