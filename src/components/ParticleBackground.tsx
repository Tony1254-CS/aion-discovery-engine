import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function Particles() {
  const meshRef = useRef<THREE.Points>(null);
  const count = 500;

  const [positions, speeds, offsets] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    const off = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12;
      spd[i] = 0.0005 + Math.random() * 0.002;
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
      posArr[i * 3] += Math.sin(t * 0.15 + offsets[i]) * 0.0006;
      if (posArr[i * 3 + 1] > 15) posArr[i * 3 + 1] = -15;
    }
    geo.attributes.position.needsUpdate = true;
    meshRef.current.rotation.y = t * 0.002;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} />
      </bufferGeometry>
      <pointsMaterial size={0.018} color="#d4956b" transparent opacity={0.18} sizeAttenuation />
    </points>
  );
}

function GlowOrbs() {
  const ref = useRef<THREE.Group>(null);

  const orbs = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => ({
      position: [
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 10,
        -4 - Math.random() * 5,
      ] as [number, number, number],
      scale: 1.5 + Math.random() * 2,
      speed: 0.1 + Math.random() * 0.15,
      offset: i * 1.3,
      color: ["#d4956b", "#c96b7a", "#8b6bb5", "#6ba3d4", "#d4b86b"][i],
    }));
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.children.forEach((child, i) => {
      const orb = orbs[i];
      child.position.y = orb.position[1] + Math.sin(state.clock.elapsedTime * orb.speed + orb.offset) * 0.5;
      child.position.x = orb.position[0] + Math.cos(state.clock.elapsedTime * orb.speed * 0.6 + orb.offset) * 0.25;
    });
  });

  return (
    <group ref={ref}>
      {orbs.map((orb, i) => (
        <mesh key={i} position={orb.position}>
          <sphereGeometry args={[orb.scale, 24, 24]} />
          <meshBasicMaterial color={orb.color} transparent opacity={0.008} />
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
