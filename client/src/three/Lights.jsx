import { Environment, Lightformer } from '@react-three/drei';
import { tokens } from '../theme/tokens.js';
import { SHOE } from './shoe.config.js';

// Product-studio lighting (Addendum B U1): a large soft key above-front-left, two narrow warm strips behind
// left and right that run a thin highlight along the collar, heel and toe spring, and a very low fill.
// Baked once (frames=1): no per-frame cost, no HDR download, no realtime shadows.
export default function Lights() {
  return (
    <>
      <Environment resolution={256} frames={1} environmentIntensity={SHOE.look.environmentIntensity}>
        <Lightformer form="rect" intensity={2.0} color={tokens.softbox} scale={[9, 5, 1]} position={[-3, 4.5, 4]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={3.0} color={tokens.rim} scale={[1.2, 6, 1]} position={[-4.2, 1.2, -3.8]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={3.0} color={tokens.rim} scale={[1.2, 6, 1]} position={[4.2, 1.2, -3.8]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.3} color={tokens.softbox} scale={[8, 3, 1]} position={[0, 0.5, 7]} target={[0, 0, 0]} />
      </Environment>
      <directionalLight position={[-3, 5, 4]} intensity={1.3} color={tokens.lightKey} />
      <directionalLight position={[2.5, 2, -4]} intensity={2.0} color={tokens.rim} />
    </>
  );
}
