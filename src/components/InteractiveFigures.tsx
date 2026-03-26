import { lazy, Suspense, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { SlidersHorizontal, BarChart3 } from "lucide-react";

const Plot = lazy(() => import("react-plotly.js"));

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function runSimulation(sampleSize: number, effectSize: number, noise: number) {
  const rng = mulberry32(42);
  const x: number[] = [];
  const y: number[] = [];
  for (let i = 0; i < sampleSize; i++) {
    const u1 = rng(), u2 = rng();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
    const xi = z0 * 2;
    x.push(xi);
    y.push(effectSize * xi + z1 * noise);
  }
  const mx = x.reduce((a, b) => a + b, 0) / x.length;
  const my = y.reduce((a, b) => a + b, 0) / y.length;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < x.length; i++) {
    sxy += (x[i] - mx) * (y[i] - my);
    sxx += (x[i] - mx) ** 2;
    syy += (y[i] - my) ** 2;
  }
  const r = sxy / Math.sqrt(sxx * syy) || 0;
  const t = r * Math.sqrt((x.length - 2) / (1 - r * r + 1e-10));
  const p = Math.max(0.0001, Math.min(1, 2 * Math.exp(-0.717 * Math.abs(t) - 0.416 * t * t / x.length)));
  const d = (2 * r) / Math.sqrt(1 - r * r + 1e-10);
  return { x, y, r, p, d, n: x.length };
}

interface Props {
  context?: {
    xLabel?: string;
    yLabel?: string;
    title?: string;
  };
}

export default function InteractiveFigures({ context }: Props) {
  const [sampleSize, setSampleSize] = useState(200);
  const [effectSize, setEffectSize] = useState(0.6);
  const [noise, setNoise] = useState(1.5);

  const sim = useMemo(() => runSimulation(sampleSize, effectSize, noise), [sampleSize, effectSize, noise]);

  const xLabel = context?.xLabel || "Independent Variable";
  const yLabel = context?.yLabel || "Dependent Variable";

  const xRange = [Math.min(...sim.x) - 0.5, Math.max(...sim.x) + 0.5];
  const slope = effectSize;
  const intercept = 0;
  const fitX = [xRange[0], xRange[1]];
  const fitY = fitX.map((v) => slope * v + intercept);

  const residuals = sim.x.map((xi, i) => sim.y[i] - (slope * xi + intercept));

  const scatterData = [
    {
      x: sim.x,
      y: sim.y,
      mode: "markers" as const,
      type: "scatter" as const,
      marker: {
        color: sim.y.map((_, i) => Math.abs(residuals[i])),
        colorscale: [[0, "hsl(168, 65%, 40%)"], [0.5, "hsl(195, 75%, 45%)"], [1, "hsl(280, 60%, 55%)"]] as any,
        size: 5,
        opacity: 0.55,
        line: { width: 0.5, color: "rgba(255,255,255,0.3)" },
      },
      name: "Observations",
      hovertemplate: `${xLabel}: %{x:.2f}<br>${yLabel}: %{y:.2f}<extra></extra>`,
    },
    {
      x: fitX,
      y: fitY,
      mode: "lines" as const,
      type: "scatter" as const,
      line: { color: "hsl(168, 78%, 26%)", width: 2.5, dash: "dot" as const },
      name: `Fit (β=${effectSize.toFixed(2)})`,
    },
  ];

  const histData = [
    {
      x: residuals,
      type: "histogram" as const,
      marker: {
        color: "hsl(195, 75%, 45%)",
        opacity: 0.6,
        line: { color: "hsl(195, 75%, 35%)", width: 1 },
      },
      nbinsx: Math.min(30, Math.round(sim.n / 5)),
      name: "Residuals",
    },
  ];

  const chartLayout = {
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    font: { family: "Inter, system-ui", color: "#6b7280", size: 11 },
    margin: { t: 35, r: 15, b: 45, l: 50 },
    xaxis: { gridcolor: "rgba(100,116,139,0.08)", zeroline: false, title: { text: xLabel, font: { size: 11 } } },
    yaxis: { gridcolor: "rgba(100,116,139,0.08)", zeroline: false, title: { text: yLabel, font: { size: 11 } } },
    showlegend: false,
    autosize: true,
  };

  const residualLayout = {
    ...chartLayout,
    xaxis: { ...chartLayout.xaxis, title: { text: "Residual", font: { size: 11 } } },
    yaxis: { ...chartLayout.yaxis, title: { text: "Frequency", font: { size: 11 } } },
  };

  const isSignificant = sim.p < 0.05;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-panel p-5 sm:p-6"
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <BarChart3 className="h-3.5 w-3.5 text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Interactive Figures</h3>
        <Badge variant="outline" className="text-[10px] gap-1 px-2 py-0.5 border-primary/30 text-primary">
          <SlidersHorizontal className="h-2.5 w-2.5" />
          What-If Mode
        </Badge>
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <SliderControl label="Sample Size" value={sampleSize} min={30} max={1000} step={10} display={`n = ${sampleSize}`} onChange={setSampleSize} />
        <SliderControl label="Effect Size (β)" value={effectSize} min={0} max={2} step={0.05} display={`β = ${effectSize.toFixed(2)}`} onChange={setEffectSize} />
        <SliderControl label="Noise (σ)" value={noise} min={0.1} max={4} step={0.1} display={`σ = ${noise.toFixed(1)}`} onChange={setNoise} />
      </div>

      {/* Charts */}
      <Suspense fallback={<div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">Loading charts…</div>}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-background/30 rounded-xl p-2">
            <Plot
              data={scatterData}
              layout={{ ...chartLayout, title: { text: `${xLabel} vs ${yLabel}`, font: { size: 12, color: "#9ca3af" } } }}
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: "100%", height: 260 }}
            />
          </div>
          <div className="bg-background/30 rounded-xl p-2">
            <Plot
              data={histData}
              layout={{ ...residualLayout, title: { text: "Residual Distribution", font: { size: 12, color: "#9ca3af" } } }}
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: "100%", height: 260 }}
            />
          </div>
        </div>
      </Suspense>

      {/* Stats Summary */}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatChip label="n" value={sim.n.toString()} />
        <StatChip label="r" value={sim.r.toFixed(3)} />
        <StatChip label="p" value={sim.p < 0.001 ? "< .001" : sim.p.toFixed(4)} highlight={isSignificant} />
        <StatChip label="Cohen's d" value={Math.abs(sim.d).toFixed(2)} />
      </div>

      <div className={`mt-3 text-xs font-medium text-center py-2 rounded-lg ${
        isSignificant ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
      }`}>
        {isSignificant
          ? `✓ Statistically significant (p = ${sim.p < 0.001 ? "< .001" : sim.p.toFixed(4)}, r = ${sim.r.toFixed(3)})`
          : `⚠ Not significant at α = 0.05 (p = ${sim.p.toFixed(4)})`}
      </div>
    </motion.div>
  );
}

function SliderControl({ label, value, min, max, step, display, onChange }: {
  label: string; value: number; min: number; max: number; step: number; display: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
        <span className="text-[11px] font-mono text-primary font-semibold">{display}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} className="cursor-pointer" />
    </div>
  );
}

function StatChip({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`text-center py-2 px-2 rounded-lg ${highlight ? "bg-primary/10 glow-ring" : "bg-muted/50"}`}>
      <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-bold font-mono ${highlight ? "text-primary" : "text-foreground"}`}>{value}</p>
    </div>
  );
}
