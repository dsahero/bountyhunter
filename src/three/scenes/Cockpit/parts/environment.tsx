/** Cabin lighting helpers: the local reflection environment and the ambient fill (both dim in an emergency). */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { cabinLevel } from '../cabinLight';

/**
 * A local reflection environment (three's RoomEnvironment through PMREM, no
 * network), so the metal surfaces have something to shine with.
 */
export function RoomEnv({ intensity }: { intensity: number }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const env = useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const texture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    return texture;
  }, [gl]);
  useEffect(() => {
    const before = scene.environment;
    scene.environment = env;
    return () => {
      scene.environment = before;
    };
  }, [env, scene]);
  useFrame(({ clock }) => {
    scene.environmentIntensity = intensity * cabinLevel(clock.elapsedTime);
  });
  return null;
}

export function CabinAmbient({ intensity }: { intensity: number }) {
  const light = useRef<THREE.AmbientLight>(null);
  useFrame(({ clock }) => {
    if (light.current) light.current.intensity = intensity * cabinLevel(clock.elapsedTime);
  });
  return <ambientLight ref={light} intensity={intensity} color="#8090a0" />;
}
