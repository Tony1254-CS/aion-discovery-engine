import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function Particles() {
  const meshRef = useRef<THREE.Points>(null);
  const count = 800;

  const [positions, speeds, offsets, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    const off = new Float32Array(count);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 28;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 28;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
      spd[i] = 0.0008 + Math.random() * 0.003;
      off[i] = Math.random() * Math.PI * 2;
      sz[i] = 0.015 + Math.random() * 0.025;
    }
    return [pos, spd, off, sz];
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const geo = meshRef.current.geometry;
    const posArr = geo.attributes.position.array as Float32Array;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      posArr[i * 3 + 1] += speeds[i];
      posArr[i * 3] += Math.sin(t * 0.2 + offsets[i]) * 0.001;
      posArr[i * 3 + 2] += Math.cos(t * 0.15 + offsets[i]) * 0.0005;
      if (posArr[i * 3 + 1] > 14) posArr[i * 3 + 1] = -14;
    }
    geo.attributes.position.needsUpdate = true;
    meshRef.current.rotation.y = t * 0.003;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} />
      </bufferGeometry>
      <pointsMaterial size={0.022} color="#0f766e" transparent opacity={0.3} sizeAttenuation />
    </points>
  );
}

function GlowOrbs() {
  const ref = useRef<THREE.Group>(null);

  const orbs = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => ({
      position: [
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 8,
        -3 - Math.random() * 4,
      ] as [number, number, number],
      scale: 1 + Math.random() * 1.8,
      speed: 0.15 + Math.random() * 0.25,
      offset: i * 1.1,
      color: i % 3 === 0 ? "#0f766e" : i % 3 === 1 ? "#0c7a9e" : "#7c3aed",
    }));
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.children.forEach((child, i) => {
      const orb = orbs[i];
      child.position.y = orb.position[1] + Math.sin(state.clock.elapsedTime * orb.speed + orb.offset) * 0.6;
      child.position.x = orb.position[0] + Math.cos(state.clock.elapsedTime * orb.speed * 0.7 + orb.offset) * 0.3;
    });
  });

  return (
    <group ref={ref}>
      {orbs.map((orb, i) => (
        <mesh key={i} position={orb.position}>
          <sphereGeometry args={[orb.scale, 24, 24]} />
          <meshBasicMaterial color={orb.color} transparent opacity={0.012} />
        </mesh>
      ))}
    </group>
  );
}

export default function ParticleBackground() {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 6], fov: 55 }} gl={{ alpha: true }} dpr={[1, 1.5]}>
        <Particles />
        <GlowOrbs />
      </Canvas>
    </div>
  );
}
