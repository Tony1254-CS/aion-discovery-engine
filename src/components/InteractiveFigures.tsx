import { useState, useMemo, useCallback, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { SlidersHorizontal, Zap } from "lucide-react";

const Plot = lazy(() => import("react-plotly.js"));

// Seedable PRNG for reproducible "what-if" simulations
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function runSimulation(sampleSize: number, effectSize: number, noise: number) {
  const rng = mulberry32(42);
  const x: number[] = [];
  const y: number[] = [];
  for (let i = 0; i < sampleSize; i++) {
    // Box-Muller
    const u1 = rng(), u2 = rng();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
    x.push(z0);
    y.push(effectSize * z0 + noise * z1);
  }

  // Pearson r
  const n = x.length;
  const mx = x.reduce((a, b) => a + b) / n;
  const my = y.reduce((a, b) => a + b) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    num += (x[i] - mx) * (y[i] - my);
    dx += (x[i] - mx) ** 2;
    dy += (y[i] - my) ** 2;
  }
  const r = num / Math.sqrt(dx * dy);
  const t = r * Math.sqrt((n - 2) / (1 - r * r));
  // Approximate p-value from t-distribution
  const df = n - 2;
  const p = Math.exp(-0.717 * Math.abs(t) - 0.416 * t * t / df);
  const d = 2 * r / Math.sqrt(1 - r * r);

  return { x, y, r, p: Math.max(0, Math.min(1, p)), d, n };
}

export default function InteractiveFigures() {
  const [sampleSize, setSampleSize] = useState(300);
  const [effectSize, setEffectSize] = useState(0.6);
  const [noise, setNoise] = useState(0.5);

  const sim = useMemo(() => runSimulation(sampleSize, effectSize, noise), [sampleSize, effectSize, noise]);

  // Regression line
  const xSorted = [...sim.x].sort((a, b) => a - b);
  const regLine = xSorted.map(v => effectSize * v);

  // Histogram data for residuals
  const residuals = sim.x.map((xi, i) => sim.y[i] - effectSize * xi);

  const scatterData: any[] = [
    {
      x: sim.x, y: sim.y, mode: "markers", type: "scatter",
      marker: { color: "hsl(168, 78%, 36%)", size: 4, opacity: 0.5 },
      name: "Data Points",
    },
    {
      x: xSorted, y: regLine, mode: "lines", type: "scatter",
      line: { color: "hsl(0, 72%, 51%)", width: 2.5 },
      name: `Fit (r=${sim.r.toFixed(3)})`,
    },
  ];

  const histData: any[] = [
    {
      x: residuals, type: "histogram", nbinsx: 30,
      marker: { color: "hsl(168, 65%, 40%)", opacity: 0.7 },
      name: "Residuals",
    },
  ];

  const layoutBase = {
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    font: { family: "Inter, sans-serif", size: 11, color: "#888" },
    margin: { t: 35, b: 45, l: 50, r: 15 },
    xaxis: { gridcolor: "rgba(128,128,128,0.15)", zerolinecolor: "rgba(128,128,128,0.2)" },
    yaxis: { gridcolor: "rgba(128,128,128,0.15)", zerolinecolor: "rgba(128,128,128,0.2)" },
    showlegend: false,
  };

  const sliders = [
    { label: "Sample Size", value: sampleSize, min: 50, max: 2000, step: 50, set: setSampleSize, display: `n = ${sampleSize}` },
    { label: "Effect Size", value: effectSize, min: 0, max: 1.5, step: 0.05, set: setEffectSize, display: `β = ${effectSize.toFixed(2)}` },
    { label: "Noise Level", value: noise, min: 0.1, max: 2, step: 0.05, set: setNoise, display: `σ = ${noise.toFixed(2)}` },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <h3 className="font-serif text-lg font-bold text-foreground">Interactive Figures</h3>
        <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
          <Zap className="h-2.5 w-2.5" />
          Interactive
        </span>
      </div>

      {/* Sliders */}
      <div className="glass-panel p-4 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-semibold">What-If Parameters</span>
        </div>
        {sliders.map(({ label, value, min, max, step, set, display }) => (
          <div key={label} className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs text-muted-foreground">{label}</label>
              <span className="text-xs font-mono font-semibold text-foreground">{display}</span>
            </div>
            <input
              type="range"
              min={min} max={max} step={step} value={value}
              onChange={(e) => set(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-muted
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md
                [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform"
            />
          </div>
        ))}
      </div>

      {/* Figures */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel p-3 overflow-hidden">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-semibold mb-2">Scatter Plot + Regression</p>
          <Suspense fallback={<div className="h-[260px] flex items-center justify-center text-xs text-muted-foreground">Loading chart…</div>}>
            <Plot
              data={scatterData}
              layout={{
                ...layoutBase,
                title: { text: `r = ${sim.r.toFixed(3)}, p ${sim.p < 0.001 ? "< .001" : `= ${sim.p.toFixed(4)}`}`, font: { size: 12 } },
                xaxis: { ...layoutBase.xaxis, title: { text: "Independent Variable", font: { size: 10 } } },
                yaxis: { ...layoutBase.yaxis, title: { text: "Dependent Variable", font: { size: 10 } } },
                height: 260,
              }}
              config={{ displayModeBar: false, responsive: true }}
              style={{ width: "100%", height: 260 }}
            />
          </Suspense>
        </div>

        <div className="glass-panel p-3 overflow-hidden">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-semibold mb-2">Residual Distribution</p>
          <Suspense fallback={<div className="h-[260px] flex items-center justify-center text-xs text-muted-foreground">Loading chart…</div>}>
            <Plot
              data={histData}
              layout={{
                ...layoutBase,
                title: { text: `Cohen's d = ${sim.d.toFixed(3)}`, font: { size: 12 } },
                xaxis: { ...layoutBase.xaxis, title: { text: "Residual", font: { size: 10 } } },
                yaxis: { ...layoutBase.yaxis, title: { text: "Frequency", font: { size: 10 } } },
                height: 260,
              }}
              config={{ displayModeBar: false, responsive: true }}
              style={{ width: "100%", height: 260 }}
            />
          </Suspense>
        </div>
      </div>

      {/* Live stats summary */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "n", value: sim.n.toString() },
          { label: "r", value: sim.r.toFixed(4) },
          { label: "p", value: sim.p < 0.001 ? "<.001" : sim.p.toFixed(4) },
          { label: "d", value: sim.d.toFixed(3) },
        ].map(({ label, value }) => (
          <div key={label} className="glass-panel p-2.5 text-center">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground/70 font-semibold">{label}</p>
            <p className="text-sm font-mono font-bold text-foreground">{value}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
