/**
 * Cabin lighting that responds to the attack: during the emergency every
 * light fades slowly down and up together (a 4-second breath, never a flash),
 * almost to darkness, while red emergency lamps glow on the opposite beat.
 */
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAttack, isEmergency } from '../../../hub/attack';

const PERIOD = 4;

/** 0..1, smooth: how "up" the slow emergency cycle is right now. */
export function emergencyPulse(t: number) {
  return 0.5 - 0.5 * Math.cos((t / PERIOD) * Math.PI * 2);
}

/** Multiplier for normal cabin lights: 1 normally; nearly dark, slowly breathing, in an emergency. */
export function cabinLevel(t: number) {
  if (!isEmergency(useAttack.getState().stage)) return 1;
  return 0.02 + 0.16 * emergencyPulse(t);
}

/** A point light that follows the cabin level. */
export function CabinLight({ intensity = 1, ...props }: JSX.IntrinsicElements['pointLight']) {
  const light = useRef<THREE.PointLight>(null);
  const base = typeof intensity === 'number' ? intensity : 1;
  useFrame(({ clock }) => {
    if (light.current) light.current.intensity = base * cabinLevel(clock.elapsedTime);
  });
  return <pointLight ref={light} intensity={base} {...props} />;
}
