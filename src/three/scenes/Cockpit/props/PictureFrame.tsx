/** A framed snapshot of the hunter and Sniffles, drawn in a canvas. */
import { useMemo } from 'react';
import * as THREE from 'three';
import { PROPS } from '../../../../hub/layout';
import { lore } from '../../../../content/lore';
import { facePilot, metal } from './materials';

export function PictureFrame() {
  const texture = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 320;
    const g = c.getContext('2d')!;
    const sky = g.createLinearGradient(0, 0, 0, 240);
    sky.addColorStop(0, '#f2a65a');
    sky.addColorStop(1, '#f6d9a8');
    g.fillStyle = sky;
    g.fillRect(0, 0, 256, 240);
    g.fillStyle = '#7a5a3a';
    g.fillRect(0, 196, 256, 44);
    // The hunter: long dark hair over the shoulders, steel armor, maroon trim.
    g.fillStyle = '#2a1d16';
    g.beginPath();
    g.ellipse(100, 112, 30, 52, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#3b3f45';
    g.fillRect(66, 128, 70, 72); // flight suit
    g.fillStyle = '#a7aeb5';
    g.fillRect(74, 132, 54, 34); // chest plate
    g.fillStyle = '#8d949b';
    g.fillRect(74, 168, 54, 12); // belt plate
    g.fillStyle = '#6e1f2c';
    g.fillRect(74, 158, 54, 5); // maroon trim
    g.fillStyle = '#a7aeb5';
    g.beginPath();
    g.ellipse(64, 136, 13, 9, -0.4, 0, Math.PI * 2); // pauldrons
    g.ellipse(138, 136, 13, 9, 0.4, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#c99a78';
    g.beginPath();
    g.ellipse(101, 92, 19, 23, 0, 0, Math.PI * 2); // face
    g.fill();
    g.fillStyle = '#2a1d16';
    g.beginPath();
    g.ellipse(101, 76, 22, 13, 0, Math.PI, 0); // hairline
    g.fill();
    g.fillRect(80, 76, 7, 62); // hair falling either side
    g.fillRect(115, 76, 7, 62);
    g.fillStyle = '#1b1b1b';
    g.fillRect(93, 90, 4, 4); // eyes
    g.fillRect(106, 90, 4, 4);
    g.fillStyle = '#8a4a3a';
    g.fillRect(96, 103, 11, 3); // smile
    // The helmet under one arm.
    g.fillStyle = '#a7aeb5';
    g.beginPath();
    g.arc(52, 176, 19, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#111';
    g.fillRect(40, 170, 24, 5);
    g.fillRect(49, 170, 6, 16);
    // Sniffles: a black-and-white (tuxedo) cat.
    g.fillStyle = '#141414';
    g.beginPath();
    g.ellipse(184, 180, 32, 22, 0, 0, Math.PI * 2); // body
    g.fill();
    g.beginPath();
    g.arc(186, 146, 19, 0, Math.PI * 2); // head
    g.fill();
    g.beginPath();
    g.moveTo(170, 136);
    g.lineTo(173, 116);
    g.lineTo(183, 131);
    g.moveTo(189, 131);
    g.lineTo(199, 116);
    g.lineTo(202, 137);
    g.fill();
    g.beginPath();
    g.moveTo(214, 188);
    g.quadraticCurveTo(238, 176, 230, 150); // tail
    g.lineWidth = 7;
    g.strokeStyle = '#141414';
    g.stroke();
    g.fillStyle = '#f4f4f0';
    g.beginPath();
    g.moveTo(186, 146);
    g.lineTo(176, 166);
    g.lineTo(196, 166);
    g.fill(); // white muzzle blaze
    g.beginPath();
    g.ellipse(184, 186, 14, 14, 0, 0, Math.PI * 2); // white chest
    g.fill();
    g.fillRect(166, 196, 9, 6); // white paws
    g.fillRect(192, 196, 9, 6);
    g.fillStyle = '#c8e05a';
    g.fillRect(177, 141, 5, 4); // eyes
    g.fillRect(190, 141, 5, 4);
    // Caption
    g.fillStyle = '#f5efe0';
    g.fillRect(0, 240, 256, 80);
    g.fillStyle = '#3a2a1e';
    g.font = '22px "Share Tech Mono", monospace';
    g.textAlign = 'center';
    g.fillText(lore.picture.caption, 128, 288, 236);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  const frame = useMemo(() => metal('#6a4a2a', 0.5), []);
  return (
    <group rotation-y={facePilot(PROPS.picture)}>
      <group position={[0, 0.085, 0]} rotation-x={-0.18}>
        <mesh material={frame}>
          <boxGeometry args={[0.13, 0.16, 0.01]} />
        </mesh>
        <mesh position={[0, 0, 0.0055]}>
          <planeGeometry args={[0.11, 0.14]} />
          <meshStandardMaterial map={texture} roughness={0.8} />
        </mesh>
      </group>
      <mesh position={[0, 0.04, -0.03]} rotation-x={0.5} material={frame}>
        <boxGeometry args={[0.02, 0.09, 0.005]} />
      </mesh>
    </group>
  );
}
