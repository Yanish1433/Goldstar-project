import { Environment, Lightformer } from '@react-three/drei';

// One product-studio light for every canvas (home story, product viewer, cart box). The boot is a deep charcoal
// PBR model, so the look comes from shape light, not fill: a soft overhead key for the nubuck grain, two hard white
// strip rims behind that cut a crisp edge along the collar, heel, toe spring and sole on any ground colour, a kicker
// strip low at the front for the outsole lugs, and very little front fill so blacks stay black (no grey wash).
// Baked once into the environment (frames=1): no per-frame cost, no HDR download.
export default function StudioLights({ intensity = 1 }) {
  return (
    <>
      <Environment resolution={256} frames={1} environmentIntensity={intensity}>
        <Lightformer form="rect" intensity={2.2} color="#ffffff" scale={[9, 4, 1]} position={[-1.5, 6, 3]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={7} color="#ffffff" scale={[0.7, 8, 1]} position={[-5.5, 1.5, -3.5]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={6} color="#ffffff" scale={[0.7, 8, 1]} position={[5.5, 1.5, -3.5]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={3} color="#ffffff" scale={[10, 0.5, 1]} position={[0, -1.2, 6]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.5} color="#ffffff" scale={[10, 4, 1]} position={[2, 1, 7]} target={[0, 0, 0]} />
      </Environment>
      <directionalLight position={[-3, 5, 4]} intensity={0.9} />
      <directionalLight position={[4, 2.5, -5]} intensity={1.8} />
      <directionalLight position={[-4, 2, -4]} intensity={1.5} />
    </>
  );
}
