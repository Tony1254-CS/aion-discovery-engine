import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { GraphNode, GraphEdge } from "@/lib/research-types";
import * as THREE from "three";
import { useState } from "react";

const colorMap: Record<GraphNode["type"], string> = {
  paper: "#3b82f6",
  concept: "#22c55e",
  hypothesis: "#f59e0b",
};

function Node({ node, onHover }: { node: GraphNode; onHover: (n: GraphNode | null) => void }) {
  const ref = useRef<THREE.Mesh>(null);
  const scale = node.type === "hypothesis" ? 0.18 : node.type === "concept" ? 0.14 : 0.1;

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.position.y += Math.sin(Date.now() * 0.001 + node.x) * delta * 0.05;
    }
  });

  return (
    <mesh
      ref={ref}
      position={[node.x, node.y, node.z]}
      onPointerEnter={() => onHover(node)}
      onPointerLeave={() => onHover(null)}
    >
      <sphereGeometry args={[scale, 16, 16]} />
      <meshStandardMaterial color={colorMap[node.type]} emissive={colorMap[node.type]} emissiveIntensity={0.4} />
    </mesh>
  );
}

function Edges({ edges, nodes }: { edges: GraphEdge[]; nodes: GraphNode[] }) {
  const lines = useMemo(() => {
    return edges.map((e) => {
      const from = nodes.find((n) => n.id === e.from);
      const to = nodes.find((n) => n.id === e.to);
      if (!from || !to) return null;
      const points = [new THREE.Vector3(from.x, from.y, from.z), new THREE.Vector3(to.x, to.y, to.z)];
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      return geo;
    });
  }, [edges, nodes]);

  return (
    <>
      {lines.map((geo, i) =>
        geo ? (
          <line key={i}>
            <bufferGeometry attach="geometry" {...geo} />
            <lineBasicMaterial attach="material" color="#0f766e" opacity={0.25} transparent />
          </line>
        ) : null
      )}
    </>
  );
}

function Tooltip({ node }: { node: GraphNode }) {
  return (
    <Html position={[node.x, node.y + 0.3, node.z]} center>
      <div className="glass-panel px-3 py-2 text-xs max-w-[200px] pointer-events-none">
        <span className="font-semibold text-foreground">{node.label}</span>
        <span className="block text-muted-foreground capitalize mt-0.5">{node.type}</span>
      </div>
    </Html>
  );
}

interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export default function KnowledgeGraph({ nodes, edges }: Props) {
  const [hovered, setHovered] = useState<GraphNode | null>(null);

  if (nodes.length === 0) {
    return (
      <div className="glass-panel h-full flex items-center justify-center text-muted-foreground text-sm">
        Knowledge graph will appear here…
      </div>
    );
  }

  return (
    <div className="glass-panel h-full overflow-hidden relative">
      {/* Legend */}
      <div className="absolute top-3 left-3 z-20 flex gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-aion-paper" /> Papers</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-aion-concept" /> Concepts</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-aion-hypothesis" /> Hypotheses</span>
      </div>
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[5, 5, 5]} intensity={0.8} />
        <OrbitControls enableZoom enablePan autoRotate autoRotateSpeed={0.5} />
        {nodes.map((n) => (
          <Node key={n.id} node={n} onHover={setHovered} />
        ))}
        <Edges edges={edges} nodes={nodes} />
        {hovered && <Tooltip node={hovered} />}
      </Canvas>
    </div>
  );
}
