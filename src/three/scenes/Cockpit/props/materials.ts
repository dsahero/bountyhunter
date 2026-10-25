/** Shared materials and helpers for the cockpit props. */
import * as THREE from 'three';
import { EYE, type Vec3 } from '../../../../hub/layout';

export const metal = (color: string, roughness = 0.35) =>
  new THREE.MeshStandardMaterial({ color, metalness: 0.85, roughness });
export const plastic = (color: string, roughness = 0.6) =>
  new THREE.MeshStandardMaterial({ color, roughness });
export const glow = (color: string) => new THREE.MeshBasicMaterial({ color, toneMapped: false });

/** Rotation around Y that turns local +Z toward the pilot's eye. */
export const facePilot = ([x, , z]: Vec3) => Math.atan2(EYE[0] - x, EYE[2] - z);
