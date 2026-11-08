// Cleanup for a <Shoe> instance. The GLB scene behind useGLTF is a CACHE shared with every other canvas that loads the
// same URL (e.g. the home story). A shared consumer (the add-to-cart overlay) must only release what it owns: its own
// cloned materials. It must never clear the cache entry or dispose the shared geometry/textures, or the boot vanishes
// from the main canvas. An exclusive consumer (the product viewer) releases everything.
export function disposeShoe({ ownMaterials, gltfScene, clearCache, shared }) {
  ownMaterials.forEach((m) => m.dispose());
  if (shared) return;
  clearCache();
  gltfScene.traverse((o) => {
    if (o.isMesh) {
      o.geometry?.dispose();
      Object.values(o.material).forEach((v) => v && v.isTexture && v.dispose());
    }
  });
}
