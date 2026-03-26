import { useState, useMemo, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Zap, TrendingUp, AlertTriangle, X } from "lucide-react";

const Plot = lazy(() => import("react-plotly.js"));

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normalRandom(rng: () => number): number {
  const u1 = rng(), u2 = rng();
  return Math.sqrt(-2 * Math.log(u1 + 1e-10)) * Math.cos(2 * Math.PI * u2);
}

/** Run Monte Carlo power simulation */
function runPowerAnalysis(
  effectSize: number,
  nSims: number,
  sampleSizes: number[],
  alpha: number,
  testType: "t-test" | "correlation"
) {
  const results = sampleSizes.map((n) => {
    let significant = 0;
    const pValues: number[] = [];

    for (let s = 0; s < nSims; s++) {
      const rng = mulberry32(s * 137 + n);

      if (testType === "t-test") {
        // Two-sample t-test simulation
        const g1: number[] = [], g2: number[] = [];
        for (let i = 0; i < Math.floor(n / 2); i++) g1.push(normalRandom(rng));
        for (let i = 0; i < Math.ceil(n / 2); i++) g2.push(normalRandom(rng) + effectSize);
        const m1 = g1.reduce((a, b) => a + b, 0) / g1.length;
        const m2 = g2.reduce((a, b) => a + b, 0) / g2.length;
        const s1 = Math.sqrt(g1.reduce((a, b) => a + (b - m1) ** 2, 0) / (g1.length - 1));
        const s2 = Math.sqrt(g2.reduce((a, b) => a + (b - m2) ** 2, 0) / (g2.length - 1));
        const se = Math.sqrt(s1 ** 2 / g1.length + s2 ** 2 / g2.length);
        const t = Math.abs((m2 - m1) / (se + 1e-10));
        const df = g1.length + g2.length - 2;
        const p = Math.max(0.0001, 2 * Math.exp(-0.717 * t - 0.416 * t * t / df));
        pValues.push(p);
        if (p < alpha) significant++;
      } else {
        // Correlation simulation
        const x: number[] = [], y: number[] = [];
        for (let i = 0; i < n; i++) {
          const xi = normalRandom(rng);
          x.push(xi);
          y.push(effectSize * xi + normalRandom(rng) * Math.sqrt(1 - effectSize ** 2 + 0.01));
        }
        const mx = x.reduce((a, b) => a + b, 0) / n;
        const my = y.reduce((a, b) => a + b, 0) / n;
        let sxy = 0, sxx = 0, syy = 0;
        for (let i = 0; i < n; i++) {
          sxy += (x[i] - mx) * (y[i] - my);
          sxx += (x[i] - mx) ** 2;
          syy += (y[i] - my) ** 2;
        }
        const r = sxy / (Math.sqrt(sxx * syy) + 1e-10);
        const t = r * Math.sqrt((n - 2) / (1 - r * r + 1e-10));
        const p = Math.max(0.0001, 2 * Math.exp(-0.717 * Math.abs(t) - 0.416 * t * t / n));
        pValues.push(p);
        if (p < alpha) significant++;
      }
    }

    const power = significant / nSims;
    const medianCI = 1.96 / Math.sqrt(n); // approximate CI half-width
    return { n, power, medianCI, pValues };
  });

  return results;
}

interface Props {
  hypothesis?: { title?: string; effectSize?: number };
  onClose?: () => void;
}

export default function HypothesisSimulation({ hypothesis, onClose }: Props) {
  const [effectSize, setEffectSize] = useState(hypothesis?.effectSize || 0.5);
  const [nSims, setNSims] = useState(500);
  const [alpha, setAlpha] = useState(0.05);
  const [testType, setTestType] = useState<"t-test" | "correlation">("correlation");

  const sampleSizes = useMemo(() => {
    const sizes: number[] = [];
    for (let n = 20; n <= 100; n += 10) sizes.push(n);
    for (let n = 120; n <= 300; n += 20) sizes.push(n);
    for (let n = 350; n <= 500; n += 50) sizes.push(n);
    sizes.push(600, 800, 1000);
    return sizes;
  }, []);

  const results = useMemo(
    () => runPowerAnalysis(effectSize, nSims, sampleSizes, alpha, testType),
    [effectSize, nSims, sampleSizes, alpha, testType]
  );

  const minFor80 = results.find((r) => r.power >= 0.8)?.n || "> 1000";
  const typeIIat100 = results.find((r) => r.n === 100);
  const typeIIRisk = typeIIat100 ? ((1 - typeIIat100.power) * 100).toFixed(0) : "?";

  const powerCurveData = [
    {
      x: results.map((r) => r.n),
      y: results.map((r) => r.power),
      type: "scatter" as const,
      mode: "lines+markers" as const,
      marker: { color: results.map((r) => r.power >= 0.8 ? "hsl(168, 70%, 40%)" : "hsl(280, 60%, 55%)"), size: 5 },
      line: { color: "hsl(195, 75%, 45%)", width: 2.5 },
      fill: "tozeroy" as const,
      fillcolor: "rgba(56, 189, 248, 0.08)",
      name: "Power",
      hovertemplate: "n = %{x}<br>Power = %{y:.2%}<extra></extra>",
    },
    {
      x: [sampleSizes[0], sampleSizes[sampleSizes.length - 1]],
      y: [0.8, 0.8],
      type: "scatter" as const,
      mode: "lines" as const,
      line: { color: "hsl(168, 70%, 40%)", width: 1.5, dash: "dash" as const },
      name: "80% threshold",
      hoverinfo: "skip" as const,
    },
  ];

  const ciData = [
    {
      x: results.map((r) => r.n),
      y: results.map((r) => r.medianCI * 2),
      type: "scatter" as const,
      mode: "lines+markers" as const,
      marker: { color: "hsl(280, 60%, 55%)", size: 4 },
      line: { color: "hsl(280, 60%, 55%)", width: 2 },
      fill: "tozeroy" as const,
      fillcolor: "rgba(147, 51, 234, 0.08)",
      name: "CI Width",
      hovertemplate: "n = %{x}<br>CI Width = ±%{y:.3f}<extra></extra>",
    },
  ];

  const baseLayout = {
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    font: { family: "Inter, system-ui", color: "#6b7280", size: 11 },
    margin: { t: 35, r: 15, b: 45, l: 50 },
    xaxis: { gridcolor: "rgba(100,116,139,0.08)", zeroline: false },
    yaxis: { gridcolor: "rgba(100,116,139,0.08)", zeroline: false },
    showlegend: false,
    autosize: true,
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="glass-panel-elevated p-5 sm:p-6 relative"
    >
      {onClose && (
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      )}

      <div className="flex items-center gap-2 mb-5">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Zap className="h-3.5 w-3.5 text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Hypothesis Power Simulation</h3>
        <Badge variant="outline" className="text-[10px] gap-1 px-2 py-0.5 border-primary/30 text-primary">
          Monte Carlo
        </Badge>
      </div>

      {hypothesis?.title && (
        <p className="text-xs text-muted-foreground mb-4 italic">"{hypothesis.title}"</p>
      )}

      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">Effect Size (d)</span>
            <span className="text-[11px] font-mono text-primary font-semibold">{effectSize.toFixed(2)}</span>
          </div>
          <Slider value={[effectSize]} min={0.1} max={1.5} step={0.05} onValueChange={([v]) => setEffectSize(v)} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">Simulations</span>
            <span className="text-[11px] font-mono text-primary font-semibold">{nSims}</span>
          </div>
          <Slider value={[nSims]} min={100} max={2000} step={100} onValueChange={([v]) => setNSims(v)} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">α Level</span>
            <span className="text-[11px] font-mono text-primary font-semibold">{alpha}</span>
          </div>
          <Slider value={[alpha]} min={0.01} max={0.1} step={0.01} onValueChange={([v]) => setAlpha(v)} />
        </div>
        <div className="space-y-2">
          <span className="text-[11px] font-medium text-muted-foreground">Test Type</span>
          <div className="flex gap-1.5 mt-1">
            {(["t-test", "correlation"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTestType(t)}
                className={`text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all ${
                  testType === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {t === "t-test" ? "t-test" : "Correlation"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Charts */}
      <Suspense fallback={<div className="h-[240px] flex items-center justify-center text-muted-foreground text-sm">Computing simulations…</div>}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
          <div className="bg-background/30 rounded-xl p-2">
            <Plot
              data={powerCurveData}
              layout={{
                ...baseLayout,
                title: { text: "Power vs Sample Size", font: { size: 12, color: "#9ca3af" } },
                xaxis: { ...baseLayout.xaxis, title: { text: "Sample Size (n)", font: { size: 10 } } },
                yaxis: { ...baseLayout.yaxis, title: { text: "Statistical Power", font: { size: 10 } }, range: [0, 1.05] },
              }}
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: "100%", height: 240 }}
            />
          </div>
          <div className="bg-background/30 rounded-xl p-2">
            <Plot
              data={ciData}
              layout={{
                ...baseLayout,
                title: { text: "95% CI Width vs Sample Size", font: { size: 12, color: "#9ca3af" } },
                xaxis: { ...baseLayout.xaxis, title: { text: "Sample Size (n)", font: { size: 10 } } },
                yaxis: { ...baseLayout.yaxis, title: { text: "CI Width (±)", font: { size: 10 } } },
              }}
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: "100%", height: 240 }}
            />
          </div>
        </div>
      </Suspense>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="text-center py-3 px-2 rounded-xl bg-primary/10 glow-ring">
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Min n for 80%</p>
          <p className="text-lg font-bold font-mono text-primary">{minFor80}</p>
        </div>
        <div className="text-center py-3 px-2 rounded-xl bg-muted/50">
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Effect Size</p>
          <p className="text-lg font-bold font-mono text-foreground">d = {effectSize.toFixed(2)}</p>
        </div>
        <div className="text-center py-3 px-2 rounded-xl bg-muted/50">
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider flex items-center justify-center gap-1">
            <AlertTriangle className="h-2.5 w-2.5 text-amber-500" /> Type II Risk (n=100)
          </p>
          <p className="text-lg font-bold font-mono text-foreground">{typeIIRisk}%</p>
        </div>
        <div className="text-center py-3 px-2 rounded-xl bg-muted/50">
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Simulations</p>
          <p className="text-lg font-bold font-mono text-foreground">{nSims.toLocaleString()}</p>
        </div>
      </div>
    </motion.div>
  );
}
