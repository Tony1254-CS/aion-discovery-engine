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
      pos[i * 3] = (Math.random() - 0.5) * 24;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 24;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8;
      spd[i] = 0.001 + Math.random() * 0.003;
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
      posArr[i * 3] += Math.sin(t * 0.3 + offsets[i]) * 0.0008;
      if (posArr[i * 3 + 1] > 12) posArr[i * 3 + 1] = -12;
    }
    geo.attributes.position.needsUpdate = true;
    meshRef.current.rotation.y = t * 0.005;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} />
      </bufferGeometry>
      <pointsMaterial size={0.025} color="#0f766e" transparent opacity={0.35} sizeAttenuation />
    </points>
  );
}

function GlowOrbs() {
  const ref = useRef<THREE.Group>(null);

  const orbs = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => ({
      position: [
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 6,
        -2 - Math.random() * 3,
      ] as [number, number, number],
      scale: 0.8 + Math.random() * 1.2,
      speed: 0.2 + Math.random() * 0.3,
      offset: i * 1.2,
    }));
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.children.forEach((child, i) => {
      const orb = orbs[i];
      child.position.y = orb.position[1] + Math.sin(state.clock.elapsedTime * orb.speed + orb.offset) * 0.5;
    });
  });

  return (
    <group ref={ref}>
      {orbs.map((orb, i) => (
        <mesh key={i} position={orb.position}>
          <sphereGeometry args={[orb.scale, 16, 16]} />
          <meshBasicMaterial color="#0f766e" transparent opacity={0.015} />
        </mesh>
      ))}
    </group>
  );
}

export default function ParticleBackground() {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }} gl={{ alpha: true }} dpr={[1, 1.5]}>
        <Particles />
        <GlowOrbs />
      </Canvas>
    </div>
  );
}
