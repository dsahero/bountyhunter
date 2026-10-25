/** The cockpit's shared materials: panels, frames, brushed metal, the diamond-plate floor, trim, seat. */
import { useMemo } from 'react';
import * as THREE from 'three';
import {
  brushedMetalTexture,
  consoleTexture,
  diamondPlateTexture,
} from '../../../procedural/textures';

export function useCockpitMaterials() {
  return useMemo(() => {
    const map = consoleTexture();
    return {
      panel: new THREE.MeshStandardMaterial({
        map,
        color: '#9aa0a8',
        metalness: 0.75,
        roughness: 0.42,
      }),
      frame: new THREE.MeshStandardMaterial({ color: '#2e3237', metalness: 0.85, roughness: 0.38 }),
      shiny: new THREE.MeshStandardMaterial({
        map: brushedMetalTexture(),
        color: '#c9cfd6',
        metalness: 0.9,
        roughness: 0.28,
      }),
      floor: new THREE.MeshStandardMaterial({
        map: diamondPlateTexture(),
        color: '#b0b5bb',
        metalness: 0.8,
        roughness: 0.45,
      }),
      trim: new THREE.MeshStandardMaterial({ color: '#6e1f2c', metalness: 0.3, roughness: 0.6 }),
      seat: new THREE.MeshStandardMaterial({ color: '#3b2a22', roughness: 0.85 }),
    };
  }, []);
}

export type Mats = ReturnType<typeof useCockpitMaterials>;
