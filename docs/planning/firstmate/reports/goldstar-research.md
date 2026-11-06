# Gold Star Shoes Nepal: scroll-driven 3D product storytelling research

Date: 2026-11-04. Research only, no build.

## How this was verified

- Every URL marked **Live** returned HTTP 200 to `curl -L` with a desktop Chrome user agent on 2026-11-04.
- For the sites marked **(scanned)**, I downloaded the HTML and up to 25 first-level `<script src>` bundles, then grepped them for library signatures: `THREE.WebGLRenderer`, `REVISION`, `@react-three`, `ScrollTrigger`, `ScrollSmoother`, `lenis`, `theatre`, `DRACOLoader`, `meshopt`, `KTX2Loader`, `.glb`, `@splinetool`, `.splinecode`, `model-viewer`, `<canvas>`, `.mp4/.webm/.m3u8`, `prefers-reduced-motion`, `drawImage`, and video `currentTime`/scrub code.
- Libraries listed as **detected** were found that way. Anything marked **likely** is an inference from tags, award listings or page text.
- Limits: lazily loaded chunks are not covered, so a missing library does not prove it is absent. I did not watch any of the scroll sequences in a real browser. Scroll descriptions come from page text, award write-ups and the code signatures.

Interesting finding: the current **goldstarshoes.com** (Live, scanned) is WordPress with the BeTheme theme, WooCommerce, Revolution Slider and Smart Slider 3. The Three.js and GSAP code in its bundles comes from Revolution Slider, so it is not a custom 3D build. A new 3D site is either a separate microsite or a custom front end. It is not a plugin you can add to the current theme.

---

## 1. Reference sites

### Footwear

| # | Site | URL | Status |
|---|------|-----|--------|
| 1 | SOLK (sneaker brand prelaunch), Awwwards Site of the Day 13 Jun 2025, by Astral and Thibaut Foussard | https://solk.com/ (award page: https://www.awwwards.com/sites/solk) | Live, scanned |
| 2 | On: LightSpray tech story | https://www.on.com/en-us/explore/lightspray | Live, scanned |
| 3 | Finely Crafted: Jack Daniel's x The Shoe Surgeon, by Monks, Site of the Day 7 May 2021 | https://www.finely-crafted.com/ (award page: https://www.awwwards.com/sites/finely-crafted) | Live, scanned |
| 4 | 3D Shoe Explorer (Bramus, scroll-driven-animations.style) | https://scroll-driven-animations.style/demos/3d-shoe-explorer/css/ | Live, scanned |
| 5 | Shoes Box: 144 Nike and New Balance shoes in a 3D grid | https://shoes-box.pages.dev (case study: https://craftsite.it.com/work/shoes-box/en) | Live |
| 6 | Shoemania (Three.js shoe viewer shop, from a three.js forum showcase) | https://shoemania.netlify.app/ (forum post: https://discourse.threejs.org/t/3d-shoe-website/64897) | Live, scanned |
| 7 | "Awwwards Adidas" R3F scroll template (Adidas-themed; the products are garments) | https://awwwards-adidas.vercel.app/ (repo: https://github.com/zoeyzb/stryde-sneakers) | Live, scanned |
| - | Nike "Infinite Space" (Air Max Dn8), Awwwards Honorable Mention 18 Apr 2025, by does interactive | https://www.awwwards.com/sites/nike-infinite-space. The live site, airmax-dn8.com, **no longer resolves** (DNS failure). | Award page only |

**1. SOLK.** The site follows a storytelling scroll: hero ("Built to last. Made to Fade."), image grids, then a "Considered in every detail" section, with links out to the SOLK System and Craftsmanship & Materials pages. Awwwards tags it Infinite Scroll, Storytelling, 3D and Sound.
- Callouts: editorial blocks for materials and craft, each section with its own headline.
- Technique: **detected** GSAP with ScrollTrigger (dozens of references) and Lenis smooth scroll, on a Shopify storefront, and the code respects `prefers-reduced-motion`. The 3D tag appears to cover WebGL and media moments rather than a configurable shoe model. The `model-viewer` hits come only from Shopify's built-in feature registry, so they don't count.
- Why it matters: this is the closest current example of a shoe brand selling through a story. It is also a good reminder that a premium feel can come from scroll choreography with very little real-time 3D.

**2. On LightSpray.** The tech story runs hero, flagship shoe (Cloudboom Strike 2), athlete proof, second shoe, "Behind the tech" process section, events, FAQ.
- Callouts: big single-number claims, for example an upper of "as little as 30 grams", a 1.5 km filament sprayed by a robot arm in about 3 minutes, and a percentage for foam and CO2.
- Technique: **detected** GSAP with ScrollTrigger and ScrollSmoother. The process is shown with hosted MP4 video, so it is **likely** scroll-triggered or scrubbed video and photography rather than real-time 3D.
- Why it matters: this is the best model for spec copy. One number per screen, each one tied to a manufacturing fact.

**3. Finely Crafted.** An immersive tour of a sneaker studio: you move through the space and each stop tells part of how the custom shoe was made.
- Callouts: chapter stops along the route, with video.
- Technique: **detected** GSAP with ScrollTrigger and MP4 video chapters (intro, school, sneaker-2018 and so on). Awwwards also tags WebGL and Vue.js.
- Why it matters: it shows the "craft and build quality" story told as a walkthrough, which fits Gold Star's "five decades" heritage angle.

**4. 3D Shoe Explorer.** Four shoe cards (Air Max 90, Chuck Taylor, an Adidas, a DC). As each card scrolls through the viewport, its GLB model turns about 450 degrees. Users can't drag the models.
- Callouts: only headings that clip in and out, plus footers that fade, all on CSS `view-timeline`.
- Technique: **detected** Google's `<model-viewer>` (Three.js inside, with Draco, Meshopt and KTX2 decoders bundled), CSS scroll-driven animations, and a small `trackProgress` helper (`@bramus/sda-utilities`) that copies animation progress into the camera orbit on each `requestAnimationFrame`. The page says it needs Chrome 115 or newer.
- Why it matters: this is the cheapest real-time 3D option. One web component plus a GLB, with no framework.

**5. Shoes Box.** A 3D grid you can browse and filter by brand, colour and price, with a minimap.
- Callouts: holographic product cards drawn with GLSL.
- Technique, per the case study: React Three Fiber, custom GLSL shaders, Next.js 16, hosted on Cloudflare Pages.
- Why it matters: a catalogue-browsing pattern, useful for a "shop all" page more than for the hero.

**6. Shoemania.** A shoe shop where you rotate, zoom and inspect each shoe from any angle.
- Technique: **detected** Three.js with React Three Fiber (`@react-three`), GLB and glTF models, and Draco, Meshopt and KTX2 loaders. Built with create-react-app.
- Why it matters: a basic but real example of 360 drag and zoom on a shoe.

**7. Awwwards Adidas R3F template.** Scroll scenes move a 3D product (`ShirtScrolling.glb`) through studio sets (`MainStudio.glb`, `SportStudio.glb` and others), and every scene ends in a store link.
- Technique: **detected** React Three Fiber, GSAP with ScrollTrigger, and Draco, Meshopt and KTX2 loaders.
- Licence warning: the repo says the third-party models and textures were published without a licence. Use it for study only; don't copy it.
- Why it matters: a working code skeleton of the exact stack recommended below. Swap the garment for a shoe.

**Nike Infinite Space.** A WebAR portal that opens into an endless WebGL space themed on the Air Max Dn8. It is listed for the record but **not usable as a live reference**, because the domain is gone. Campaign microsites often disappear after the campaign, which matters if Gold Star is weighing a microsite against investing in its main site.

### Strong non-footwear product examples

| # | Site | URL | Status |
|---|------|-----|--------|
| 8 | Apple AirPods Pro 3 | https://www.apple.com/airpods-pro/ | Live, scanned |
| 9 | Apple MacBook Pro | https://www.apple.com/macbook-pro/ | Live, scanned |
| 10 | Apple AirPods Max | https://www.apple.com/airpods-max/ | Live, scanned |
| 11 | Oryzo, by Lusion (parody product launch for a cork coaster) | https://oryzo.ai/ | Live, scanned |
| 12 | Shopify Editions Spring '26 | https://www.shopify.com/editions/spring2026 | Live, scanned |
| 13 | DeepSee Commerce | https://deepseecommerce.com/ | Live, scanned |
| 14 | Webflow Conf "Spline Demo: Exploding Interaction" | https://wfc23-spline-demo-2.webflow.io/ (listing: https://webflow.com/made-in-webflow/website/wfc23-spline-demo-2) | Live, scanned |
| 15 | Explore Primland (a place, not a product, but a strong camera-path example) | https://explore.ownprimland.com/ | Live, scanned |

**8 to 10. Apple product pages.**
- Scroll sequence: the hero product animates as you scroll, then highlight cards, a "Take a closer look" product viewer, and feature chapters (noise control, audio, fitness, battery), ending in a comparison table.
- Callouts: the house style is short declarative headlines, a bold lead-in word followed by one sentence, giant numbers ("8 hrs", "2x more"), a footnote on every claim, and a comparison table at the end.
- Technique, **detected**:
  - `*_startframe` and `*_endframe` still images (204 references on the AirPods page) used as first and last frames.
  - A large video "scrubber" module (`scrubberView`, `currentTime`, `Scrubbing`), plus HLS and WebM video.
  - A `.usdz` file for the AR "View in your space" button, and Apple's own copy of `three.min.js` (r92) loaded on demand for the viewer.
  - `prefers-reduced-motion` handling.
- So in 2026 Apple mostly does **video scrubbing with still start and end frames**. The famous canvas image sequence is from the 2019 AirPods Pro page, and tutorials still teach it (CSS-Tricks, GSAP forums).

**11. Oryzo.** Lusion's parody launch for a "smart" cork coaster.
- Scroll sequence: a 3D product hero, then the camera travels in depth through feature chapters.
- Callouts: big stats ("25", "9 years"), labelled mini-visualisations ("Friction coefficient (est): 0.80", "Circularity"), and a spec table with three product tiers.
- Technique: **detected** Three.js r178 with a custom WebGL pipeline (WebGPU code paths present), GSAP, and multiple `<canvas>` elements.
- Why it matters: the clearest current example of the "futuristic spec callout" look the captain asked for.

**12. Shopify Editions Spring '26.** A scroll-sequenced reveal of product features with layered panels.
- Technique: **detected** React Three Fiber, Theatre.js (`useTheatreObject`, `heroRingTheatreControls`), Lenis, GLB models, and many MP4 and WebM files.
- Notable trick: short animation loops are shipped as **KTX2 texture arrays**, for example `..._50f_427x240_etc1s.ktx2`, which is 50 frames packed in ETC1S. That is an image sequence that stays compressed on the GPU, a smart middle ground between video and PNG frames.

**13. DeepSee Commerce.** As you scroll, the camera descends through an underwater scene, with depth fog and light scattering.
- Technique: **detected** Three.js with R3F, GSAP with ScrollTrigger and ScrollSmoother, Lenis, Draco, Meshopt and KTX2 loaders, and `rockv2-transformed.glb`. The `-transformed` suffix is what `gltfjsx --transform` outputs, so the model went through gltf-transform compression.
- Per a third-party write-up (hontran.dev), it also caps device pixel ratio and only renders while the scene is visible.
- Why it matters: a good template for the asset pipeline.

**14. Webflow Conf Spline demo.** A scroll-driven "exploding" 3D object.
- Technique: **detected** the `@splinetool` runtime, a `.splinecode` scene, a single `<canvas>`, Lenis, and `prefers-reduced-motion`.
- Why it matters: an exploded view with no code, built in the Spline editor.

**15. Explore Primland.** A scroll-driven flight over 3D terrain, with atmospheric fog.
- Technique: **detected** GSAP with ScrollTrigger, Lenis, and Theatre.js.
- Why it matters: shows the camera-path style for a "journey" section, such as a factory or heritage timeline.

### Tutorials and tooling worth reading

- Codrops, "How to Build Cinematic 3D Scroll Experiences with GSAP" (19 Nov 2025). Uses ScrollTrigger, ScrollSmoother, a 500vh container and several camera "shots". Live: https://tympanus.net/codrops/2025/11/19/how-to-build-cinematic-3d-scroll-experiences-with-gsap/ and repo https://github.com/JosephASG/codrops-cinematic-scroll-animations
- Codrops, "On-Scroll Folding 3D Cardboard Box with Three.js and GSAP". Keeps the scroll logic separate from the 3D code. It's a good starting point for a shoebox-opening intro. Found by search; Codrops returned 403 to my fetch, so not verified.
- drei ScrollControls: https://drei.docs.pmnd.rs/controls/scroll-controls (Live)
- GSAP ScrollTrigger: https://gsap.com/docs/v3/Plugins/ScrollTrigger/ (Live)
- Theatre.js: https://www.theatrejs.com/ (Live)
- Lenis: https://github.com/darkroomengineering/lenis (Live)
- gltf-transform: https://gltf-transform.dev/ (Live)
- model-viewer: https://modelviewer.dev/ (Live)
- Spline: https://spline.design/ (Live)

---

## 2. Technique comparison

The "mid-range Android" column assumes a typical Nepal device in 2026: a Snapdragon 6-series, Helio G or Dimensity 6000-class chip, Mali or Adreno mid-tier GPU, 4 to 6 GB RAM, often on 4G with patchy throughput. The ratings are my engineering estimates, not benchmarks.

| Technique | Visual quality | Mid-range Android performance | Typical payload for one shoe story | Build effort | Assets needed | Seen in |
|---|---|---|---|---|---|---|
| **Real-time 3D, R3F with drei ScrollControls** | High. Real lighting, any angle, true exploded view. Below offline-render quality unless you bake lighting into textures. | Good if disciplined: around 50k triangles, 1 to 2 1K/2K KTX2 textures, DPR capped at 1.5, no real-time shadows (use a baked contact shadow), no heavy post-processing. Poor if you add bloom, SSR or 4K textures. | 0.3 to 0.5 MB JS (React, three, R3F, drei, gzipped) plus 1 to 3 MB model and textures | Medium to high. Needs a React and Three.js developer. ScrollControls owns its own scroll container, which complicates normal page scrolling and SEO content. | Clean GLB with parts separated (upper, midsole, outsole, insole, laces, logo) and PBR textures | Shoemania, Shoes Box, Shopify Editions, DeepSee, Adidas template |
| **GLB plus GSAP ScrollTrigger (vanilla three or R3F, normal page scroll)** | Same as above | Same as above. Normal document scroll is kinder to mobile and accessibility than a hijacked scroll container. Lenis is optional. | Around 0.15 to 0.25 MB JS (three tree-shaken plus GSAP) plus 1 to 3 MB assets | Medium. One canvas fixed behind HTML sections; ScrollTrigger timelines tween camera, rotation and part offsets. | Same GLB as above | Oryzo, DeepSee, Adidas template, Primland; the Codrops tutorial |
| **Image-sequence canvas scrub (classic Apple)** | Highest: offline renders (Blender Cycles, KeyShot) or a studio turntable. Fixed camera path only, no free rotation. | Very smooth once loaded, because `drawImage` of a decoded bitmap is cheap. Risks are download size and **decoded memory**: 150 frames at 1080x1080 RGBA is about 700 MB, which crashes low-RAM phones. Mobile needs 60 to 90 frames at around 720 px, decoded lazily. | 60 to 120 WebP or AVIF frames at 25 to 60 KB each, about 3 to 7 MB per sequence (mobile set smaller) | Low to medium. Simple JS; most of the work is rendering and exporting frames. | Pre-rendered frames from a 3D artist, or a photographed turntable (36 to 72 shots) | Apple 2019 AirPods Pro, tutorials; KTX2 variant in Shopify Editions |
| **Video scrub (`video.currentTime` on scroll)** | Highest (offline render), fixed path | Mixed. Seeking is jerky unless the file is encoded with every frame as a keyframe (`-g 1`) or a very short GOP, which inflates the file. Android Chrome seeks more slowly than desktop. Good for "play when in view" rather than frame-exact scrubbing. | 3 to 10 MB per sequence (H.264 or HEVC; AV1 where supported) | Low | Rendered video | Apple 2025-26 pages (scrubber module), On LightSpray, Finely Crafted |
| **Spline embed** | Medium to high, stylised. Exploded views and states are easy to author. | Weakest of the five on low-end GPUs. The Spline runtime is heavy and scenes are not as optimisable as a hand-built GLB. Fine for a hero; risky as a long scroll story on budget phones. | Runtime about 0.5 to 1 MB+ plus the `.splinecode` scene (often several MB) | Lowest. Designers can do it with no code; scroll events are built into Spline. | Model built or imported in Spline | Webflow Conf Spline demo |
| **model-viewer plus CSS scroll-driven animations (bonus)** | Medium to high (PBR, environment lighting) | Good. Lean, with AR on Android and iOS for free. CSS scroll timelines need Chrome 115 or newer, which most Android Chrome now meets; Safari support is newer, so keep a JS fallback. | Component about 0.25 MB plus the GLB | Lowest of the real-time options | A GLB | 3D Shoe Explorer |

---

## 3. Patterns worth stealing

| Pattern | What it looks like | Who shows it | Notes for Gold Star |
|---|---|---|---|
| **Exploded view** | Shoe separates along a vertical axis into outsole, midsole, insole, upper, laces and logo, each with a label | Webflow Spline demo (exploding object); ExplodeView, a CAD-style Three.js library (https://explodeview.com/demo); Cannes Lions shoe work where the product assembles in 3D | Needs the model split into named parts. In GSAP, animate each part's `position.y` with a stagger over one pinned section, then reverse it. This is the hero moment. |
| **Material zoom / macro** | Camera dollies right up to the stitching, mesh or sole tread; a texture detail fills the screen | Apple (camera and material close-ups via video); On LightSpray (filament process video); SOLK ("Considered in every detail") | Cheapest done as macro photography or video of a real Gold Star shoe crossfaded over the 3D. A real-time macro shot needs 2K or larger textures only for that shot. |
| **Hotspot callouts** | Pulsing dots pinned to 3D positions; on scroll or tap a leader line and spec card appear | Oryzo (labelled mini-visualisations); model-viewer hotspots (built-in `slot="hotspot"`) | Draw them as **HTML** positioned by projecting 3D points to the screen, not as text inside WebGL. They stay selectable, translatable (English and Nepali) and readable by screen readers. |
| **Big-number spec cards** | One giant figure per screen, plus one line of context | Apple ("8 hrs", "2x"); On ("30 grams", "1.5 km", "3 minutes") | Pair each number with a real manufacturing fact: sole compound, stitch count, years of the brand, pairs made per day. |
| **Colorway switcher** | Swatches change the material colour live, with no reload | Awwwards element "3D product colour change animation" (https://www.awwwards.com/inspiration/3d-product-color-change-animation-ar-fake-sneakers, Live); R3F "Shoe configurator" example in the pmndrs docs | Swapping `material.color` or a texture is cheap in real-time 3D. With image sequences each colorway multiplies the payload, a big argument for a GLB. |
| **360 drag** | User spins the shoe with a finger after the scroll story ends | Shoemania; model-viewer (`camera-controls`); Apple "Take a closer look" viewer | Turn scroll control off and drag control on in the last section ("Explore it yourself"). Add AR ("View on your foot or floor") through model-viewer's Scene Viewer on Android for little extra cost. |
| **Anatomy of the shoe** | A section labelled like a diagram: layers named with a short spec each | Exploded-view examples above; SOLK craft and materials sections | The exploded view and hotspots together form this section. Keep the copy as static HTML so it works without WebGL. |
| **Process / heritage journey** | Camera path through a factory or timeline | Finely Crafted (studio tour); Primland (camera flythrough); On "Behind the tech" | Gold Star's five-decade story: a timeline of shoes or factory footage, using video chapters triggered by ScrollTrigger. |
| **Comparison slider** | Before/after or model A versus model B drag slider; or a comparison table | Apple (comparison table at the end of every product page) | Good for "Gold Star sports shoe vs. generic" or comparing two models. Plain HTML and CSS, no 3D needed. |
| **Box-opening intro** | Shoebox folds or opens on scroll and the shoe rises out | Codrops on-scroll folding cardboard box tutorial | A charming, on-brand opener that costs little: a box is simple geometry. |
| **Packed frame textures** | Short loops stored as GPU-compressed texture arrays | Shopify Editions (`*_50f_*_etc1s.ktx2`) | Advanced. Only worth it if you need many small animated tiles. |

---

## 4. Performance and accessibility notes

**Budgets for a Nepal mobile-first site.** Aim for these over 4G:
- Under 200 KB JS before the 3D starts.
- Under 3 MB for the hero 3D payload.
- Largest Contentful Paint under 2.5 s, from an HTML and image hero shown before WebGL boots.

**Model compression**
- Run the GLB through `gltf-transform optimize` (or `gltfjsx --transform`, as DeepSee did) with **Meshopt** or **Draco** geometry compression. Meshopt decodes faster and is usually the better default for animated or separated parts; Draco can be smaller for static meshes.
- Target 30k to 80k triangles for a shoe. A photogrammetry scan must be retopologised first, because raw scans run to millions of triangles.

**Textures**
- Use **KTX2 (Basis Universal)**: ETC1S for base colour and ambient occlusion (small), UASTC for normal maps (higher quality). KTX2 stays compressed in GPU memory, which is the real win on 4 to 6 GB RAM phones.
- Use 1K textures on mobile and 2K on desktop. Pack ambient occlusion, roughness and metalness into one ORM texture.
- Every scanned reference bundles the Draco, Meshopt and KTX2 decoders, so this is standard practice.

**Rendering**
- Cap `devicePixelRatio` at 1.5 on mobile.
- No real-time shadows. Use a baked shadow plane or drei `ContactShadows` rendered once.
- Use a single environment map (around 256 to 512 px, or a small HDR) instead of many lights.
- Avoid post-processing on low-tier devices.
- Render on demand (`frameloop="demand"` in R3F) or pause when the canvas is off screen.
- Use one shared canvas, not one per section.

**Device tiering.** Detect weak devices at startup, for example with `detect-gpu`, `navigator.deviceMemory` and a quick FPS probe, and serve one of three levels:
- Full 3D.
- Lite 3D: lower DPR, no environment reflections, fewer parts.
- No WebGL: a static poster or a short image sequence.

svilenkovic.com's write-up describes the same three-level approach.

**Lazy loading**
- Show an HTML hero with a real `<img>` poster of the shoe first.
- Load three.js and the GLB when the page is idle or when the 3D section comes near the viewport (IntersectionObserver).
- Preload only the first frame of any image sequence.
- Use dynamic `import()` for the 3D chunk.

**prefers-reduced-motion.** The Apple, SOLK, DeepSee and Spline demo pages all check it. If it is set:
- Turn off Lenis smooth scrolling and pinning.
- Replace scroll-scrubbed movement with static states: the exploded view shown as a still diagram with labels, and the specs as plain cards.
- Keep 360 drag available, because the user starts it.

**Accessibility of callouts**
- Spec text lives in the DOM as real headings and paragraphs, in reading order, never only inside WebGL.
- The canvas gets `aria-hidden="true"`, or a short `aria-label`, plus a text alternative.
- Interactive controls (colorway swatches, rotate) must work from the keyboard.

**Scroll hijacking.** Prefer normal document scroll with ScrollTrigger `pin` over a full custom scroll container (drei ScrollControls or ScrollSmoother on everything). Custom containers can break Android back and forward behaviour, find-in-page, anchor links and SEO crawlers. Use Lenis lightly or not at all on touch devices: Lenis disables smoothing on touch by default (`syncTouch` is off), and keep it that way.

**Video scrub specifics**
- Encode with all-intra or a very short GOP, and keep the resolution modest (720p on mobile).
- Provide MP4 (H.264) as the base, with WebM or AV1 as an extra.
- iOS needs `playsinline muted`.

**Image-sequence specifics**
- Serve separate mobile and desktop frame sets.
- Decode with `createImageBitmap` in chunks, and keep a rolling window of decoded frames rather than all of them.
- Use WebP or AVIF, or a spritesheet.

**Data cost.** Many Nepali users are on prepaid data. Put the heavy 3D behind an idle or near-viewport trigger rather than loading it on first paint. Consider honouring `navigator.connection.saveData` by serving the lite tier.

---

## 5. Recommendation

**Use a GLB model with Three.js and GSAP ScrollTrigger on normal page scroll, with HTML spec callouts. Add a pre-rendered image-sequence or poster fallback for low-end and reduced-motion users.**

The stack can be vanilla three.js, or React Three Fiber if the team already writes React. Use plain R3F, not drei ScrollControls, as the scroll owner.

Why this fits Gold Star on a realistic budget:

1. **One asset does everything.** A single optimised shoe GLB of about 1.5 to 3 MB powers the scroll rotation, the exploded "anatomy" view, hotspots, colorway switching (a cheap material swap), 360 drag and Android AR. With image sequences or video, every colorway and every camera move is a separate heavy render and download.
2. **Mobile-safe if you keep a budget.** Low triangle count, KTX2 textures, capped DPR and no shadows or post-processing run well on mid-range Android. Spline is the riskiest option on those GPUs. Video scrub seeks jerkily on Android. Image sequences cost a lot of memory.
3. **A proven, documented stack.** Oryzo, DeepSee, Shopify Editions, the Adidas template and the Codrops tutorial all use some mix of three.js or R3F, GSAP ScrollTrigger, Lenis and Draco, Meshopt and KTX2. Talent and examples are easy to find, including freelancers in Nepal and India.
4. **The futuristic feel comes from the callouts.** Following Oryzo and On, make the callouts HTML overlays with a thin leader line, a monospace label and a big number. This keeps them crisp, translatable and accessible, and costs nothing in GPU time.
5. **The fallback reuses the same model.** Render 60 to 90 frames of the same scroll path from the same model in Blender, or just three or four still poster states. Serve those to the lowest device tier, to `saveData` users and to reduced-motion users, so nobody gets a broken page.

Suggested story order:
1. Box-opening intro.
2. Hero rotation with brand line.
3. **Exploded anatomy** with hotspots for outsole, midsole, upper, stitching and insole.
4. Material macro, using real photo or video of the Gold Star shoe.
5. Big-number build-quality cards (On and Apple style).
6. Colorway switcher with 360 drag and an AR button.
7. Heritage timeline using video chapters.
8. Shop CTA linking to the WooCommerce product page.

**Cheapest viable fallback plan**, if no 3D model can be made: photograph a real shoe on a turntable (36 to 72 shots) plus macro shots, and build an image-sequence scrub with GSAP ScrollTrigger and canvas. You lose the true exploded view (fake it with a few 2D layered renders or illustrations) and the cheap colorways. It is the lowest-cost option and still looks premium.

**Main cost driver: the 3D model, not the code.** Options, cheapest first:
1. A local 3D artist models one hero shoe in Blender from photos and measurements, with parts separated and named.
2. Photogrammetry or a scan, then retopology.
3. Gold Star's own CAD or pattern files, if its factory has them. Ask, because they make an accurate exploded view much easier.

Budget for **one hero model done properly** before considering more products.

---

## Open items

- Whether Gold Star has CAD or 3D files for any shoe, or factory photo and video footage. This affects the cost a lot.
- Where the experience lives: a standalone microsite or a custom front end in front of the existing WooCommerce store. The current WordPress BeTheme and Revolution Slider setup can't sensibly host a custom WebGL story. This is a build-phase decision; it doesn't block this research.
- I did not watch any scroll sequence in a real browser or measure frame rates on a physical Android device. The performance ratings are estimates. Before committing, test a prototype on a real mid-range phone such as a Redmi Note or Samsung A-series.
- Two references could not be checked live: Nike Infinite Space (domain gone) and the Codrops folding-box tutorial (403 to automated fetch; the URL comes from search results).
