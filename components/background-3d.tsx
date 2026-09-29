"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
// @ts-expect-error maath does not have types
import * as random from "maath/random/dist/maath-random.esm";
import * as THREE from "three";

function Starfield(props: Record<string, unknown>) {
  const ref = useRef<THREE.Points>(null);
  const sphere = random.inSphere(new Float32Array(5000), { radius: 1.5 });

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 10;
      ref.current.rotation.y -= delta / 15;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere as Float32Array} stride={3} frustumCulled={false} {...props}>
        <PointMaterial
          transparent
          color="#22d3ee"
          size={0.005}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  );
}

export default function Background3D() {
  return (
    <div className="absolute inset-0 -z-10 bg-transparent opacity-40">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <Starfield />
      </Canvas>
    </div>
  );
}
