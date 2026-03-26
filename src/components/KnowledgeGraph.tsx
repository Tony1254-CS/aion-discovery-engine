import { useState, useRef, useMemo, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { GraphNode, GraphEdge } from "@/lib/research-types";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { X, BookOpen, AlertTriangle, ThumbsUp, ThumbsDown } from "lucide-react";

const NODE_COLORS: Record<GraphNode["type"], { main: string; glow: string }> = {
  paper: { main: "#6ba3d4", glow: "#6ba3d4" },
  concept: { main: "#5cb89a", glow: "#5cb89a" },
  hypothesis: { main: "#d4956b", glow: "#d4956b" },
};

const NODE_SIZES: Record<GraphNode["type"], number> = {
  paper: 0.12,
  concept: 0.15,
  hypothesis: 0.2,
};

function GlowSphere({ node, isHovered, isSelected, onHover, onClick }: {
  node: GraphNode; isHovered: boolean; isSelected: boolean;
  onHover: (n: GraphNode | null) => void; onClick: (n: GraphNode) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const baseSize = NODE_SIZES[node.type];
  const colors = NODE_COLORS[node.type];
  const initialY = useRef(node.y);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    meshRef.current.position.y = initialY.current + Math.sin(t * 0.8 + node.x * 2) * 0.04;
    const targetScale = isSelected ? 1.8 : isHovered ? 1.6 : 1;
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

    if (glowRef.current) {
      glowRef.current.position.copy(meshRef.current.position);
      const glowScale = isSelected ? 3.2 : isHovered ? 2.8 : 1.8;
      glowRef.current.scale.lerp(new THREE.Vector3(glowScale, glowScale, glowScale), 0.1);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = isSelected ? 0.25 : isHovered ? 0.2 : 0.08;
    }
  });

  return (
    <group>
      <mesh ref={glowRef} position={[node.x, node.y, node.z]}>
        <sphereGeometry args={[baseSize, 24, 24]} />
        <meshBasicMaterial color={colors.glow} transparent opacity={0.08} />
      </mesh>
      <mesh
        ref={meshRef}
        position={[node.x, node.y, node.z]}
        onPointerEnter={(e) => { e.stopPropagation(); onHover(node); document.body.style.cursor = "pointer"; }}
        onPointerLeave={() => { onHover(null); document.body.style.cursor = "default"; }}
        onClick={(e) => { e.stopPropagation(); onClick(node); }}
      >
        <sphereGeometry args={[baseSize, 32, 32]} />
        <meshPhysicalMaterial
          color={colors.main}
          emissive={colors.main}
          emissiveIntensity={isSelected ? 1 : isHovered ? 0.8 : 0.35}
          roughness={0.15}
          metalness={0.1}
          clearcoat={0.8}
          clearcoatRoughness={0.1}
        />
      </mesh>
    </group>
  );
}

function AnimatedEdges({ edges, nodes }: { edges: GraphEdge[]; nodes: GraphNode[] }) {
  const linesRef = useRef<THREE.Group>(null);

  const geometries = useMemo(() => {
    return edges.map((e) => {
      const from = nodes.find((n) => n.id === e.from);
      const to = nodes.find((n) => n.id === e.to);
      if (!from || !to) return null;
      const mid = new THREE.Vector3(
        (from.x + to.x) / 2 + (Math.random() - 0.5) * 0.3,
        (from.y + to.y) / 2 + (Math.random() - 0.5) * 0.3,
        (from.z + to.z) / 2 + (Math.random() - 0.5) * 0.3
      );
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(from.x, from.y, from.z),
        mid,
        new THREE.Vector3(to.x, to.y, to.z)
      );
      return new THREE.BufferGeometry().setFromPoints(curve.getPoints(20));
    });
  }, [edges, nodes]);

  useFrame((state) => {
    if (!linesRef.current) return;
    linesRef.current.children.forEach((child, i) => {
      if ((child as any).material) {
        (child as any).material.opacity = 0.12 + Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.06;
      }
    });
  });

  return (
    <group ref={linesRef}>
      {geometries.map((geo, i) =>
        geo ? (
          <line key={i}>
            <bufferGeometry attach="geometry" {...geo} />
            <lineBasicMaterial attach="material" color="#0f766e" opacity={0.15} transparent linewidth={1} />
          </line>
        ) : null
      )}
    </group>
  );
}

function AmbientParticles() {
  const ref = useRef<THREE.Points>(null);
  const count = 200;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.02;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.01) * 0.1;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} />
      </bufferGeometry>
      <pointsMaterial size={0.015} color="#0f766e" transparent opacity={0.25} sizeAttenuation />
    </points>
  );
}

function SceneSetup() {
  const { gl } = useThree();
  gl.toneMapping = THREE.ACESFilmicToneMapping;
  gl.toneMappingExposure = 1.2;
  return null;
}

interface NodeTooltipData {
  node: GraphNode;
  screenX: number;
  screenY: number;
}

function TooltipTracker({ node, onPosition }: { node: GraphNode; onPosition: (data: NodeTooltipData) => void }) {
  const { camera, size } = useThree();
  useFrame(() => {
    const pos = new THREE.Vector3(node.x, node.y + 0.3, node.z);
    pos.project(camera);
    onPosition({ node, screenX: (pos.x * 0.5 + 0.5) * size.width, screenY: (-pos.y * 0.5 + 0.5) * size.height });
  });
  return null;
}

// Generate mock claims/contradictions for node detail sidebar
function generateNodeDetails(node: GraphNode, allNodes: GraphNode[]) {
  const relatedNodes = allNodes.filter(n => n.id !== node.id).slice(0, 3);
  const stances: ("support" | "oppose" | "neutral")[] = ["support", "oppose", "neutral"];
  
  return {
    claims: [
      `${node.label} demonstrates significant correlation with the primary variables.`,
      `Evidence suggests a measurable effect size in the context of ${node.label.toLowerCase()}.`,
    ],
    relations: relatedNodes.map((rn, i) => ({
      node: rn,
      stance: stances[i % stances.length],
      reason: i % 2 === 0 
        ? `Supports the findings related to ${rn.label.toLowerCase()}`
        : `Presents contradictory evidence regarding ${rn.label.toLowerCase()}`,
    })),
    citationCount: Math.floor(Math.random() * 150) + 5,
  };
}

interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export default function KnowledgeGraph({ nodes, edges }: Props) {
  const [hovered, setHovered] = useState<GraphNode | null>(null);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState<NodeTooltipData | null>(null);
  const [showConflictsOnly, setShowConflictsOnly] = useState(false);

  const handleTooltipPos = useCallback((data: NodeTooltipData) => {
    setTooltipPos(data);
  }, []);

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelected(prev => prev?.id === node.id ? null : node);
  }, []);

  const selectedDetails = useMemo(() => {
    if (!selected) return null;
    return generateNodeDetails(selected, nodes);
  }, [selected, nodes]);

  if (nodes.length === 0) {
    return (
      <div className="glass-panel h-full flex flex-col items-center justify-center gap-3">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-border flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-primary/30 animate-pulse" />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full border border-border flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--aion-node-paper))]" />
          </div>
          <div className="absolute -bottom-1 -left-2 w-3.5 h-3.5 rounded-full border border-border flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--aion-node-concept))]" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Knowledge graph building…</p>
      </div>
    );
  }

  return (
    <div className="glass-panel-elevated h-full overflow-hidden relative group flex">
      {/* Graph area */}
      <div className={`flex-1 relative ${selected ? "lg:mr-0" : ""}`}>
        {/* Legend */}
        <div className="absolute top-3 left-3 z-20 flex gap-3 text-[10px] font-medium text-muted-foreground">
          {[
            { color: "bg-[hsl(var(--aion-node-paper))]", label: "Papers" },
            { color: "bg-[hsl(var(--aion-node-concept))]", label: "Concepts" },
            { color: "bg-[hsl(var(--aion-node-hypothesis))]", label: "Hypotheses" },
          ].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${color} shadow-sm`} />
              {label}
            </span>
          ))}
        </div>

        {/* Controls */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
          <button
            onClick={() => setShowConflictsOnly(!showConflictsOnly)}
            className={`text-[10px] px-2.5 py-1 rounded-lg border transition-colors ${
              showConflictsOnly
                ? "bg-destructive/10 border-destructive/30 text-destructive"
                : "bg-muted/50 border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {showConflictsOnly ? "Conflicts Only" : "Show All"}
          </button>
          <span className="text-[10px] text-muted-foreground/60 font-mono">
            {nodes.length}n · {edges.length}e
          </span>
        </div>

        <Canvas camera={{ position: [0, 0, 6], fov: 45 }} dpr={[1, 2]}>
          <SceneSetup />
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={0.6} color="#ffffff" />
          <directionalLight position={[-3, -2, -3]} intensity={0.2} color="#4a9eff" />
          <pointLight position={[0, 0, 0]} intensity={0.3} color="#0f766e" distance={10} />
          <OrbitControls
            enableZoom enablePan={false} autoRotate autoRotateSpeed={0.3}
            minDistance={3} maxDistance={12} enableDamping dampingFactor={0.05}
          />
          <AmbientParticles />
          <AnimatedEdges edges={edges} nodes={nodes} />
          {nodes.map((n) => (
            <GlowSphere
              key={n.id}
              node={n}
              isHovered={hovered?.id === n.id}
              isSelected={selected?.id === n.id}
              onHover={setHovered}
              onClick={handleNodeClick}
            />
          ))}
          {hovered && !selected && <TooltipTracker node={hovered} onPosition={handleTooltipPos} />}
        </Canvas>

        {/* Tooltip */}
        <AnimatePresence>
          {hovered && !selected && tooltipPos && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 5 }}
              transition={{ duration: 0.15 }}
              className="absolute z-30 pointer-events-none"
              style={{ left: tooltipPos.screenX, top: tooltipPos.screenY, transform: "translate(-50%, -100%)", marginTop: "-12px" }}
            >
              <div className="glass-panel px-3 py-2.5 max-w-[240px] shadow-xl">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: NODE_COLORS[hovered.type].main }} />
                  <span className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">{hovered.type}</span>
                </div>
                <p className="text-xs font-semibold text-foreground leading-snug">{hovered.label}</p>
                {hovered.summary && <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed line-clamp-2">{hovered.summary}</p>}
                <p className="text-[9px] text-primary mt-1.5 font-medium">Click for details →</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Detail Sidebar */}
      <AnimatePresence>
        {selected && selectedDetails && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="border-l border-border bg-[hsl(var(--aion-surface))] overflow-hidden shrink-0"
          >
            <div className="w-[280px] h-full flex flex-col overflow-y-auto">
              {/* Header */}
              <div className="p-4 border-b border-border flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: NODE_COLORS[selected.type].main }} />
                    <span className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">{selected.type}</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground leading-snug">{selected.label}</p>
                </div>
                <button onClick={() => setSelected(null)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground shrink-0">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Summary */}
              {selected.summary && (
                <div className="px-4 py-3 border-b border-border/50">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-semibold mb-1">Summary</p>
                  <p className="text-xs text-foreground/80 leading-relaxed">{selected.summary}</p>
                </div>
              )}

              {/* Citation count */}
              <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-semibold">Citations</span>
                <span className="text-sm font-mono font-bold text-foreground">{selectedDetails.citationCount}</span>
              </div>

              {/* Claims */}
              <div className="px-4 py-3 border-b border-border/50">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-semibold mb-2 flex items-center gap-1.5">
                  <BookOpen className="h-3 w-3" />
                  Extracted Claims
                </p>
                <div className="space-y-2">
                  {selectedDetails.claims.map((c, i) => (
                    <p key={i} className="text-[11px] text-foreground/75 leading-relaxed pl-3 border-l-2 border-primary/30">{c}</p>
                  ))}
                </div>
              </div>

              {/* Relations with stance */}
              <div className="px-4 py-3">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-semibold mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3" />
                  Relations & Stance
                </p>
                <div className="space-y-2">
                  {selectedDetails.relations.map((rel, i) => (
                    <div key={i} className={`rounded-xl p-2.5 border ${
                      rel.stance === "support" ? "border-emerald-500/30 bg-emerald-500/5" :
                      rel.stance === "oppose" ? "border-red-500/30 bg-red-500/5" :
                      "border-border bg-muted/30"
                    }`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        {rel.stance === "support" ? <ThumbsUp className="h-3 w-3 text-emerald-500" /> :
                         rel.stance === "oppose" ? <ThumbsDown className="h-3 w-3 text-red-500" /> :
                         <span className="w-3 h-3 text-muted-foreground text-[10px]">—</span>}
                        <span className="text-[10px] font-semibold text-foreground truncate">{rel.node.label}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">{rel.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
