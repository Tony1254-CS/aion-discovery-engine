import { useRef, useMemo, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { GraphNode, GraphEdge } from "@/lib/research-types";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";

const NODE_COLORS: Record<GraphNode["type"], { main: string; glow: string }> = {
  paper: { main: "#4a9eff", glow: "#4a9eff" },
  concept: { main: "#34d399", glow: "#34d399" },
  hypothesis: { main: "#fbbf24", glow: "#fbbf24" },
};

const NODE_SIZES: Record<GraphNode["type"], number> = {
  paper: 0.12,
  concept: 0.15,
  hypothesis: 0.2,
};

function GlowSphere({ node, isHovered, onHover }: { node: GraphNode; isHovered: boolean; onHover: (n: GraphNode | null) => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const baseSize = NODE_SIZES[node.type];
  const colors = NODE_COLORS[node.type];
  const initialY = useRef(node.y);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    // Gentle floating
    meshRef.current.position.y = initialY.current + Math.sin(t * 0.8 + node.x * 2) * 0.04;
    // Hover scale
    const targetScale = isHovered ? 1.6 : 1;
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

    if (glowRef.current) {
      glowRef.current.position.copy(meshRef.current.position);
      const glowScale = isHovered ? 2.8 : 1.8;
      glowRef.current.scale.lerp(new THREE.Vector3(glowScale, glowScale, glowScale), 0.1);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = isHovered ? 0.2 : 0.08;
    }
  });

  return (
    <group>
      {/* Glow sphere */}
      <mesh ref={glowRef} position={[node.x, node.y, node.z]}>
        <sphereGeometry args={[baseSize, 24, 24]} />
        <meshBasicMaterial color={colors.glow} transparent opacity={0.08} />
      </mesh>
      {/* Main sphere */}
      <mesh
        ref={meshRef}
        position={[node.x, node.y, node.z]}
        onPointerEnter={(e) => { e.stopPropagation(); onHover(node); document.body.style.cursor = "pointer"; }}
        onPointerLeave={() => { onHover(null); document.body.style.cursor = "default"; }}
      >
        <sphereGeometry args={[baseSize, 32, 32]} />
        <meshPhysicalMaterial
          color={colors.main}
          emissive={colors.main}
          emissiveIntensity={isHovered ? 0.8 : 0.35}
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

      // Create curved line using QuadraticBezierCurve3
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
      const points = curve.getPoints(20);
      return new THREE.BufferGeometry().setFromPoints(points);
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
    const screenX = (pos.x * 0.5 + 0.5) * size.width;
    const screenY = (-pos.y * 0.5 + 0.5) * size.height;
    onPosition({ node, screenX, screenY });
  });

  return null;
}

interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export default function KnowledgeGraph({ nodes, edges }: Props) {
  const [hovered, setHovered] = useState<GraphNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState<NodeTooltipData | null>(null);

  const handleTooltipPos = useCallback((data: NodeTooltipData) => {
    setTooltipPos(data);
  }, []);

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
    <div className="glass-panel-elevated h-full overflow-hidden relative group">
      {/* Legend */}
      <div className="absolute top-4 left-4 z-20 flex gap-4 text-[11px] font-medium text-muted-foreground">
        {[
          { color: "bg-[hsl(var(--aion-node-paper))]", label: "Papers" },
          { color: "bg-[hsl(var(--aion-node-concept))]", label: "Concepts" },
          { color: "bg-[hsl(var(--aion-node-hypothesis))]", label: "Hypotheses" },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${color} shadow-sm`} />
            {label}
          </span>
        ))}
      </div>

      {/* Node count */}
      <div className="absolute top-4 right-4 z-20 text-[10px] text-muted-foreground/60 font-mono">
        {nodes.length} nodes · {edges.length} connections
      </div>

      <Canvas camera={{ position: [0, 0, 6], fov: 45 }} dpr={[1, 2]}>
        <SceneSetup />
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.6} color="#ffffff" />
        <directionalLight position={[-3, -2, -3]} intensity={0.2} color="#4a9eff" />
        <pointLight position={[0, 0, 0]} intensity={0.3} color="#0f766e" distance={10} />

        <OrbitControls
          enableZoom
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.3}
          minDistance={3}
          maxDistance={12}
          enableDamping
          dampingFactor={0.05}
        />

        <AmbientParticles />
        <AnimatedEdges edges={edges} nodes={nodes} />

        {nodes.map((n) => (
          <GlowSphere key={n.id} node={n} isHovered={hovered?.id === n.id} onHover={setHovered} />
        ))}

        {hovered && <TooltipTracker node={hovered} onPosition={handleTooltipPos} />}
      </Canvas>

      {/* HTML Tooltip overlay */}
      <AnimatePresence>
        {hovered && tooltipPos && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-30 pointer-events-none"
            style={{
              left: tooltipPos.screenX,
              top: tooltipPos.screenY,
              transform: "translate(-50%, -100%)",
              marginTop: "-12px",
            }}
          >
            <div className="glass-panel px-4 py-3 max-w-[260px] shadow-xl">
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: NODE_COLORS[hovered.type].main }}
                />
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                  {hovered.type}
                </span>
              </div>
              <p className="text-xs font-semibold text-foreground leading-snug">{hovered.label}</p>
              {hovered.summary && (
                <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed line-clamp-3">
                  {hovered.summary}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
