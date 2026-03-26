import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function Particles() {
  const meshRef = useRef<THREE.Points>(null);
  const count = 600;

  const [positions, speeds, offsets] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    const off = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 14;
      spd[i] = 0.0004 + Math.random() * 0.0015;
      off[i] = Math.random() * Math.PI * 2;
    }
    return [pos, spd, off];
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const geo = meshRef.current.geometry;
    const posArr = geo.attributes.position.array as Float32Array;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      posArr[i * 3 + 1] += speeds[i];
      posArr[i * 3] += Math.sin(t * 0.12 + offsets[i]) * 0.0005;
      if (posArr[i * 3 + 1] > 15) posArr[i * 3 + 1] = -15;
    }
    geo.attributes.position.needsUpdate = true;
    meshRef.current.rotation.y = t * 0.0015;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} />
      </bufferGeometry>
      <pointsMaterial size={0.015} color="#5b8dde" transparent opacity={0.22} sizeAttenuation />
    </points>
  );
}

function GlowOrbs() {
  const ref = useRef<THREE.Group>(null);

  const orbs = useMemo(() => {
    return [
      { pos: [-4, 2, -6] as [number, number, number], s: 2.5, sp: 0.08, off: 0, color: "#4a7ddb" },
      { pos: [5, -1, -7] as [number, number, number], s: 3, sp: 0.06, off: 1.5, color: "#8b5dd4" },
      { pos: [-1, -3, -5] as [number, number, number], s: 2, sp: 0.1, off: 3, color: "#5bbfd6" },
      { pos: [3, 4, -8] as [number, number, number], s: 2.8, sp: 0.05, off: 4.5, color: "#d45b8b" },
    ];
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.children.forEach((child, i) => {
      const o = orbs[i];
      child.position.y = o.pos[1] + Math.sin(state.clock.elapsedTime * o.sp + o.off) * 0.6;
      child.position.x = o.pos[0] + Math.cos(state.clock.elapsedTime * o.sp * 0.7 + o.off) * 0.3;
    });
  });

  return (
    <group ref={ref}>
      {orbs.map((o, i) => (
        <mesh key={i} position={o.pos}>
          <sphereGeometry args={[o.s, 32, 32]} />
          <meshBasicMaterial color={o.color} transparent opacity={0.012} />
        </mesh>
      ))}
    </group>
  );
}

export default function ParticleBackground() {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 7], fov: 50 }} gl={{ alpha: true }} dpr={[1, 1.5]}>
        <Particles />
        <GlowOrbs />
      </Canvas>
    </div>
  );
}
