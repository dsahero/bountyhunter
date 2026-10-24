import { useLayoutEffect } from 'react';
import { useThree } from '@react-three/fiber';
import type * as THREE from 'three';

/** Each scene picks its own lens: tighter for the exterior, wider in the cockpit. */
export function useFov(fov: number) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }, [camera, fov]);
}
