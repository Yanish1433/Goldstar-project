import { Environment, Lightformer } from '@react-three/drei';

// One product-studio light for every canvas (G10 story, landing, product viewer, cart box). The boot is a PBR model
// whose look comes from shape light, not fill: a neutral soft overhead key for the nubuck grain, a soft front-left fill
// so a pure side view is not dark, two narrow hard strip rims behind (the left one slightly cool) that cut a crisp
// edge along the collar, heel, toe spring and sole on any ground colour without blowing out the back view, a kicker
// strip low at the front for the outsole lugs, and a faint narrow back-top strip as a hair light on the collar.
// Tuned in Blender 5.2 / three r187 by fm-blender (.firstmate/reports/blender-lights.json, round 2; exposure stays
// 1.05 with NeutralToneMapping). Baked once into the environment (frames=1): no per-frame cost, no HDR download.
export default function StudioLights({ intensity = 1 }) {
  return (
    <>
      <Environment resolution={256} frames={1} environmentIntensity={intensity}>
        <Lightformer form="rect" intensity={2.6} color="#ffffff" scale={[7, 5, 1]} position={[-2.5, 6, 3.5]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={7} color="#f4f7ff" scale={[0.35, 7, 1]} position={[-5.5, 1.5, -3.5]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={6} color="#ffffff" scale={[0.35, 7, 1]} position={[5.5, 1.5, -3.5]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={3} color="#ffffff" scale={[10, 0.5, 1]} position={[0, -1.2, 6]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1} color="#ffffff" scale={[9, 5, 1]} position={[-3, 3, 7]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.5} color="#ffffff" scale={[8, 0.4, 1]} position={[0, 6, -4]} target={[0, 0, 0]} />
      </Environment>
      <directionalLight position={[-3, 5, 4]} intensity={1} color="#ffffff" />
      <directionalLight position={[4, 2.5, -5]} intensity={1.8} color="#ffffff" />
      <directionalLight position={[-4, 2, -4]} intensity={1.5} color="#f2f6ff" />
    </>
  );
}
