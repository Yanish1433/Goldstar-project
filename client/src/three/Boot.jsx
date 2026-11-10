import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { STORY_MODEL, partColours } from '../story/model.config.js';
import { buildParts, createTinter, disposeParts, sharpenTextures } from '../story/splitModel.js';

// The G10-401 boot for the smaller canvases (product viewer, cart box): the same part rig as the home story,
// normalised to STORY_MODEL.length along +x and centred on the origin, tinted per part.
// ref: { group, built, step(dt) -> true while the colour is still easing }.
// onReady({ size: [x, y, z], built }) once placed. Shares the cached glTF; disposes only its own clones.
export const bootUrl = (tier) => (tier === 'full' ? STORY_MODEL.urls.desktop : STORY_MODEL.urls.mobile);

const Boot = forwardRef(function Boot({ url, colourKey, onReady }, ref) {
  const gltf = useGLTF(url, false, true);
  const gl = useThree((s) => s.gl);
  const built = useMemo(() => {
    sharpenTextures(gltf.scene, gl, url === STORY_MODEL.urls.mobile ? 8 : 16);
    return buildParts(gltf.scene, STORY_MODEL);
  }, [gltf, gl, url]);
  const tinter = useMemo(() => createTinter(built.parts), [built]);
  const group = useRef();
  const first = useRef(true);

  useLayoutEffect(() => {
    tinter.set(partColours(colourKey), true);
    first.current = true;
    onReady?.({ size: built.size.toArray(), built });
    return () => disposeParts(built);
  }, [built]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    tinter.set(partColours(colourKey), false);
  }, [colourKey, tinter]);

  useImperativeHandle(ref, () => ({ group: group.current, built, step: (dt) => tinter.step(dt) }), [built, tinter]);

  return (
    <group ref={group}>
      <primitive object={built.root} />
    </group>
  );
});

export default Boot;
