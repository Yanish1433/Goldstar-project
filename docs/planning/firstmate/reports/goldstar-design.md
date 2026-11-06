# Goldstar Shoes Nepal: design direction and resourcing

Prepared 2026-11-04. Scope: brand analysis, art direction, homepage blueprint, 3D and asset sourcing, stack, open questions. No site code.

How facts were checked: the live site was fetched with WebFetch and with raw `curl`, and the HTML/CSS was grepped for colours, fonts, prices and leftovers. Brand history was cross-checked across Wikipedia, Dawn, Arab News (AFP) and Asia News Network (Kathmandu Post). Where sources disagree, both versions are given. Anything I could not verify is marked **(unverified)**.

---

## 1. Brand analysis

### 1.1 Identity as it stands

| Item | Finding | Source |
|---|---|---|
| Name and wordmark | The wordmark reads "goldstar" (alt text) and is served as a raster PNG (`/wp-content/uploads/2025/09/logo-desktop.png`, 1080x230; there is also a mobile version). The asset is called "goldstar-logo-blue-shoes", so the logo is blue. There is no SVG or vector logo on the site. | goldstarshoes.com HTML |
| Legal entity in the footer | GOLDSTAR STRIDE LTD. Manufacturing: Kiran Shoes Manufacturers Pvt. Ltd (KSM) and Modern Slipper Industries Pvt. Ltd (MSI), part of Universal Group. | goldstarshoes.com/about, Wikipedia, Arab News |
| Tagline | "Walking the World for Over Five Decades." | homepage |
| Footer line | "MADE WITH LOVE IN NEPAL." | homepage |
| Theme | WordPress + WooCommerce + BeTheme child theme (Store2 demo), Elementor, Smart Slider 3 **and** Revolution Slider | HTML |

### 1.2 Colours actually in the CSS (BeTheme `--mfn-*` variables and theme CSS)

| Hex | Role on the current site | Count in HTML |
|---|---|---|
| `#2A27E9` | Theme colour: primary buttons, links, selection, shop button background, price highlights | 57+3 |
| `#120FBF` | Hover state for primary button and links | 15 |
| `#0B1A48` | All headings h1 to h3 and the text logo (deep navy) | 17 |
| `#EBC989` | Pale gold, used for links inside some sections (the only "gold" in the system) | 14 |
| `#EDEDFF` / `#DBDBFF` | Secondary button background and hover (pale lavender) | n/a |
| `#4C4D52` / `#434346` | Body and WooCommerce text | n/a |
| `#FCFCFC` | Page ground (`html{background-color}`) | 4 |
| `#0A0A0A`, `#2A2B39`, `#161922` | Dark text and surfaces | n/a |
| `#0089F7`, `#5ACB65` | Cookie (GDPR) widget blue and green, not brand colours | n/a |

Read: the brand's real colour is **electric blue + navy + white**. This matches the classic blue-and-white trainer described by Dawn. The "gold" in Goldstar is barely used (`#EBC989` only). `#2A27E9` leans violet. That is probably a theme-tuned value and may not be the logo's true blue. **We need the vector logo and brand guide to confirm the official blue.**

### 1.3 Fonts actually loaded

- **Plus Jakarta Sans** (Google): body, h1 to h4, buttons (16px / 600). Loaded twice, once with 7 weights.
- **Jost** (Google): 14 inline uses, presumably for menus and accents.
- Also referenced: Roboto, Lato and revicons from slider plugins. That makes four Latin families on one page. Nothing on the site handles Devanagari.

### 1.4 Tone of voice

Short, upbeat slogan copy in all-caps blocks: "GET YOUR GOLDSTAR", "TREK EVERYDAY: Everyday Trails, Everyday Tales", "Sneak into Comfort, Stride with Purpose", "Where Fashion Meets Function", "Himalayan Crafted", "50 Years of Himalayan Heritage". It is warm and proud of Nepal, but generic. The product copy is spec-sheet caps (see G10-401 below). There is no Nepali-language copy.

### 1.5 Product lines (from the mega menu)

- **Men / Women**: shop by New Arrival, Best Seller, Winter Neo, Best Deal, Offers.
  - **Classic**: Legends, Low Profile, White Shoes, Runners, Trainers, Slip On, Boots, Trending, Above All
  - **G-10 Series**: Lifestyle, Running, Training, Hiking, Trending, Above All
  - **Republic Leather** (men only): Oxford, Derby (spelled "Durby" on the site), Loafer, Boots
  - **Open Footwear**: Slippers, Sandals, Closed Breathable Slippers
- **Kids**
- **ARC**: the category page currently shows "No products were found", while the sidebar filter shows "ARC [1]".
- Collections: Trek Collection, Sneakers, Casual, Slippers, Winter Neo.
- Sister brand: **Haathi / HATHI** slippers ("Hattichaap"), launched in the early 1980s per the About page. Dawn says Haathi slippers date from 1970.

### 1.6 Hero products and verified model facts

- **G10-401**: the most featured product (Black, Olive, "On Sale" variants). Spec copy from the product page, quoted exactly: "EVA MIDSOLE FOR BOUNCE", "RUBBER OUTSOLE FOR DURABILITY & SLIP RESISTANCE", "PU SYNTHETIC LEATHER", "CANVAS MESH", "METAL EYELETS FOR RUGGEDNESS", "HIGH DENSITY FOAM", "ARCH SUPPORT & CUSHIONED FOOTBED", "OFF-ROADING". Sizes shown: UK 6 to 9. Prices on related listings: NPR 3,400 (Black), NPR 2,775 (Olive). **This is the only model with ready-made callout data, so it is the natural 3D hero.**
- **G10 L2102**: NPR 3,500 (also a grey-pink colourway).
- **AX, AX-1/A (Coffee), AX-3**: featured on the homepage.
- **Goldstar 032**: launched 1993 and called the flagship shoe; this is the classic blue-and-white trainer (Dawn). It is not obviously on the current homepage. It is the heritage icon.
- **Spark**: the first shoe, 1986, with PVC sole (Dawn).
- **ARC Series**: worn by Prime Minister Balendra Shah to Parliament, nicknamed "Balen shoes". Goldstar sold out its white-sneaker stock and struggled to meet demand. Price cited around Rs 1,500 (Kathmandu Post via Asia News Network, 10 June 2026). **This is the brand's biggest moment of 2026, and the site's ARC page is empty.**
- **"G10" as a series**: verified on the site as "G-10 Series". I found no reliable launch date for it. A 2026 blog claiming a "2026 G10 debut" reads as spam and was not used.

### 1.7 Price positioning

This is mass-market value. Men's category prices cluster at **NPR 2,000 / 2,700 / 3,000**, and G10 runs NPR 2,775 to 3,500. ARC is reported around Rs 1,500. The historic trainer was NPR 890 (about $6.75, Dawn), and Arab News described it as "$8 trainers" in 2018. The brand's stated line is "quality, durability and affordability" (Amir Rana, Dawn). **Design implication:** the site can look premium and futuristic, but it must never read as expensive or foreign. The prices should be visible and proud.

### 1.8 Audience

Two audiences, in this order:
1. Young urban Nepalis (Kathmandu, Pokhara, and the diaspora in India, the Gulf, Malaysia and Australia), roughly 16 to 35, mobile-first, buying local as identity. Arab News quoted a fan: "Wearing a Goldstar now is like being a part of a movement." The ARC/Balen moment amplified this.
2. Value buyers: students, workers, trekkers and families who want durability per rupee.
3. A third, smaller group: B2B/export buyers (the site has a B2B page; the company claims Best Exporter awards and a goal of every continent by 2026).

### 1.9 Story facts we can use (with conflicts flagged)

- Founder: Noor Pratap Rana (Wikipedia, Dawn). Current leaders: Amir Pratap JB Rana (Chairman/MD) and Vidushi Rana (Executive Director; MD and MP per the 2026 Kathmandu Post report).
- **Founding date conflicts:**
  - Wikipedia gives 1970 / mid-1970s.
  - Dawn says Haathi began in 1970 and the first shoe came in 1986.
  - The site's About page says "Established in 1990" and also "52+ Years Experience".
  - Arab News says the brand was founded in 1990.
  - The homepage says "Over Five Decades".
  - **The client must give one canonical date.** The likely reconciliation is company/Haathi 1970s and the Goldstar shoe brand 1990.
- Production: about 75,000 pairs per day (About page, Wikipedia, Dawn). An older Wikipedia revision said 25,000.
- Workforce: "3000+" and "3500+" on the About page, and about 3,300 per Dawn. About 80% of workers are women from disadvantaged backgrounds (About page).
- Units: "five operating units in Kathmandu" (About page) vs "three units" (Dawn).
- Claims on the About page: 12M+ customers, 1,500+ SKUs.
- Maoist-era association (1996 to 2006): wearing Goldstars could get you profiled or arrested (Wikipedia, Arab News, Dawn). **This is sensitive.** I recommend acknowledging "the shoe Nepal walked through everything in" without politics, unless the client wants it told.
- Counterfeits are common (Wikipedia, Dawn). The site could carry a "how to spot a real Goldstar" angle.

### 1.10 What the current site does badly (verified)

1. **Template leftovers:**
   - "Up to 20% off **patio**" in the promo bar, with `href="#"`.
   - Account menu links point to `themes.muffingroup.com/betheme-store2/...`, which is the theme vendor's demo site. This is a trust and security smell.
2. **The ARC category is empty** during the biggest demand spike in the brand's history.
3. **No price** on the G10-401 product page itself. Prices appear only on related items.
4. **Contradictory heritage numbers:** 1990, "52+ years" and "five decades" all on the same site.
5. **Heavy:** about 430 KB of HTML and 99 `<script>` tags on the homepage, two slider plugins, four font families, WordPress gradient presets. This is poor for mid-range Android on Nepali 4G.
6. **Generic look:** the BeTheme Store2 demo with brand colours swapped in, 8px rounded buttons, and icon-box feature rows ("Durable Sole and Grip / Very Durable Material / Durable Laces").
7. **Stores page:** four listings, area names only (Maharajgunj, New Road, Koteshwor, Jamal), no map. Every store shows "Mon to Fri 10 to 6", which is unlikely for retail.
8. **No Nepali language**, no raster-free logo, and email addresses obfuscated by Cloudflare.
9. A cookie banner with only "Accept all".

Sources: [goldstarshoes.com](https://goldstarshoes.com/), [About](https://goldstarshoes.com/about/), [Stores](https://goldstarshoes.com/stores/), [G10-401](https://goldstarshoes.com/product/g10-401/), [Men category](https://goldstarshoes.com/product-category/men/), [ARC category](https://goldstarshoes.com/product-category/arc/), [Wikipedia: Goldstar shoes](https://en.wikipedia.org/wiki/Goldstar_shoes), [Dawn: The shoes that ran a revolution](https://www.dawn.com/news/1732490), [Arab News / AFP 2018](https://www.arabnews.com/node/1247476), [Asia News Network / Kathmandu Post 2026: "Balen shoes" craze](https://asianews.network/balen-shoes-craze-gives-nepali-footwear-brands-a-boost/), [New Business Age profile](https://www.newbusinessage.com/article/shinning-brand-of-nepalgoldstar) (listed, not relied on).

---

## 2. Art direction

### 2.1 Subject inventory (what only Goldstar has)

This is the raw material for the idea. A competitor (Caliber, KD, Nike) cannot use any of these.

1. The **star** in the name, and blue-and-white as the brand's real colours.
2. **75,000 pairs a day** from Kathmandu factory units, roughly 80% made by women.
3. The **032** (1993): the blue-and-white trainer a whole country wore through a war.
4. **Ringroad, Sankhapark, Maharajgunj, New Road**: the brand's real streets.
5. The **G10-401's real build list**: EVA midsole, rubber outsole, PU synthetic leather, canvas mesh, metal eyelets, high-density foam, arch support.
6. Price as a point of pride: **NPR 2,000 to 3,500**.
7. The **ARC / "Balen shoes"** moment of 2026.
8. Terrain: Kathmandu dust, monsoon mud, trekking trails ("Trek Everyday").
9. Haathi, the elephant slipper and the family's first product.
10. Devanagari: गोल्डस्टार. The name in Nepali script is a typographic asset no global brand has.

**Idea sentence (recommended):** On this page, **the G10-401's own build list (the 7 parts on its spec sheet)** becomes **a pinned 3D shoe that comes apart part by part as you scroll, each part labelled with its real spec line and the Kathmandu line that makes it.**

**Competitor test:** the generic version ("a sneaker explodes into layers") belongs to every shoe brand. What makes this one Goldstar is three things together: the real spec words from Goldstar's own page, the price stamped on the outsole, and the Nepali name.

**One live thing:** a **terrain and colourway switch** on the pinned shoe. It offers the G10-401's real colourways (Black, Olive) and three real Nepali grounds: Ringroad asphalt, monsoon mud, trail scree. Each ground swaps the floor texture and lighting under the shoe, and the outsole callout changes ("Rubber outsole: slip resistance"). It is thumb-sized on a phone. The no-script fallback is a static image per colourway.

### Direction A: "Night Shift" (factory-at-night futurism) — RECOMMENDED

**Mood.** The factory floor at 2 a.m., when the line never stops. The look is deep navy and black, but it is not a sci-fi void. The darkness comes from a real place: the Kathmandu factory under work lights. The shoe is lit like a product on a quality-control table. The futurism comes from precision: exact callouts, measured motion, and big confident type. It does not come from glow, neon or particles.

Colour changes chapter by chapter, in flat fields: navy, then a full Goldstar-blue field for the materials chapter, then white for the collection.

**Palette**

| Role | Hex | Use |
|---|---|---|
| Ground | `#0A1230` | Deep navy (a darker cousin of the site's `#0B1A48`). Hero, anatomy |
| Ground 2 (tone step) | `#121C42` | Surfaces and panels, separated by tone, never by lines |
| Ink | `#F4F2EC` | Warm white for all running text on dark |
| Accent / action | `#2A27E9` | Goldstar blue for the buy button and one chapter field. Swap for the logo's official blue once confirmed |
| Accent on blue field | `#FFFFFF` | Text on the blue chapter |
| Star gold (rare) | `#E9C46A` | Only the star mark and price figures, a warmer and more legible version of the site's `#EBC989` |
| Light chapter ground | `#F4F2EC` | Collection and stores (dark ink `#0A1230`) |

Contrast check: `#F4F2EC` on `#0A1230` is about 16:1. White on `#2A27E9` is about 7.6:1 (AA for body text). Gold `#E9C46A` on navy is about 10:1.

**Type**

- **Archivo** (Google, OFL, variable `wdth` 62 to 125 and `wght` 100 to 900). One family covers everything:
  - Display: expanded 900 for headlines (for example "७५,००० pairs a day.")
  - Callouts: condensed 600 for spec labels
  - Text: normal width 400 for body
  - Because it is one variable file of roughly 100 KB as subset woff2, it is cheap on mobile.
- **Mukta** (Google, OFL, Ek Type, Devanagari + Latin) for Nepali copy and the गोल्डस्टार name moments. It is metrically friendly next to Archivo.
- This retires Plus Jakarta Sans and Jost. If the client insists on keeping Plus Jakarta Sans, use it for text and Archivo only for display.

**Motion language**

- Mechanical and exact, like a line that never pauses.
- Easing:
  - Scroll-scrubbed scenes: `power2.inOut` (GSAP), roughly `cubic-bezier(0.65,0,0.35,1)`
  - Entrances: `expo.out`, roughly `cubic-bezier(0.16,1,0.3,1)`
- Durations:
  - Entrances 600 to 800 ms
  - Stagger 70 ms
  - UI feedback 150 ms
- Scroll pace: each 3D chapter holds about 150 to 250vh of scroll. Parts separate along straight axes, as if pulled off a jig, with no wobble or bounce. Labels snap in after their part settles.
- One signature move: the exploded anatomy.
- `prefers-reduced-motion`: show the exploded view as a still image with all callouts visible.

**Photography and render style**

- Renders: neutral studio HDRI with one hard key light from above-left, the way a QC lamp lights a product. Real material response: mesh weave visible, rubber matte, PU leather with a slight sheen. Square-cornered frames.
- Photography (commission, about one day): the real factory units, hands at the lasting machine, stacks of soles, the women who make the shoes (with consent and names). Shoot under the factory's own light with a cool cast, and grade toward navy.
- No stock photos of "runners at sunrise".

**Why it fits.** It answers the captain's "futuristic" without the generic dark-glow template, because the darkness is a real place and the precision is real data. The scroll-driven exploded view is native to it. Dark grounds also hide compression artefacts in mobile textures.

### Direction B: "Blue Print 032" (bright technical lab)

**Mood.** A clean white lab bench and a technical drawing. The shoe is an engineered object. The 032 heritage, a blue-and-white trainer, is literally the palette.

The futurism is optimistic and bright, like Swiss transit design meeting a Kathmandu workshop. It is the most "honest brand" option and the closest to the existing colours.

**Palette**

| Role | Hex | Use |
|---|---|---|
| Ground | `#FFFFFF` | Most of the page |
| Ground 2 | `#EEF0F7` | Tone-step panels |
| Ink | `#0B1A48` | Existing heading navy, used for all text |
| Accent / field | `#2A27E9` | Full-bleed blue chapters plus the button |
| Signal | `#E23B2E` | Sparing: sale prices only (a nod to the Nepali flag crimson without copying `#DC143C`) |

**Type**

- **Instrument Sans** (Google, OFL, variable width and weight) for everything, display at condensed 700.
- **Noto Sans Devanagari** (Google, OFL) for Nepali.

**Motion.** Crisp and light: `power3.out`, 500 ms, generous white space between moves. The shoe draws itself first as a blue line drawing (an SVG or 3D wireframe pass), then "fills" with real materials on scroll.

**Render and photo style.** High-key white seamless background, soft overhead light, no dramatic shadows. Flat-lay photos of parts on white.

**Risk.** It is the easiest of the three to slide into a generic SaaS-white template, and it is less "futuristic" than the captain asked for.

### Direction C: "Ringroad" (bold street)

**Mood.** Kathmandu street culture and the ARC/"Balen" moment. The shoe is in the city: Ringroad traffic, New Road crowds, painted shop signs, monsoon puddles.

It is loud, local and proud. It uses huge type, the name as a monument across the screen (गोल्डस्टार / GOLDSTAR), full colour fields, and documentary street photography. Futurism comes only through the 3D shoe moving through real street photos.

**Palette**

| Role | Hex | Use |
|---|---|---|
| Ground | `#F2EEE6` | Concrete-dust off-white |
| Ink | `#111111` | Text |
| Field 1 | `#2A27E9` | Goldstar blue |
| Field 2 | `#F2C230` | Taxi and shop-sign yellow (Kathmandu signage) |
| Action | `#111111` | Black buttons on yellow, white on blue |

**Type**

- **Big Shoulders Display** (Google, OFL; signage-born, condensed) for display.
- **Public Sans** (Google, OFL) for text.
- **Yatra One** (Google, OFL, Devanagari display) for Nepali signage moments.
- Note that this is three faces. The house rule is two at most, so drop Public Sans and use Big Shoulders Text or Mukta for body.

**Motion.** Fast and percussive: `power4.out`, 400 ms, hard cuts between full-bleed photos, and the shoe pinned while street panels slide under it.

**Photo style.** Commission a documentary street shoot in Kathmandu (natural light, flash at dusk, real people wearing Goldstars).

**Risk.** It depends heavily on new photography. It is also the most dated-by-trend option and the least about build quality.

### Recommendation

Use **Direction A, "Night Shift"**, and borrow two things from C:
- the Devanagari name-as-monument moment in the hero or footer
- one street-photo band in the Made-in-Nepal story

A carries the 3D-and-spec brief best. It uses the brand's real blue and navy, and its imagery is the factory, which only Goldstar has.

House rules to hold in every direction:
- No gradients, no glows, no glass panels.
- No icon-topped feature cards (they replace the current "Durable Sole / Material / Laces" row).
- No tiny tracked uppercase labels. Callouts are sentence case at a readable size.
- No hairline grids. Callout leaders are solid 2px strokes in ink and end in a filled dot.
- Square buttons.
- No 01/02/03 numbering.

---

## 3. Homepage section blueprint (Direction A)

The 3D shoe is one persistent canvas pinned behind the content. Each section drives its state.

| # | Section | What the 3D shoe does | Copy goal | Mobile note |
|---|---|---|---|---|
| 1 | **Hero**: "Nepal's shoe. Since 1970s/1990 [client to confirm]." with one sentence and a "Shop G10-401, NPR 3,400" button | The assembled G10-401 rests on a QC-table plane, rotating slowly (about 6°/s idle). A hard key light rakes across it. The star logo sits on the tongue. The first frame is a **static poster image**, and WebGL fades in once loaded. | Say what this is and what it costs within 5 seconds. Name, origin, price, one action. | The poster image is the LCP (AVIF, under 120 KB). 3D loads after first interaction or idle, and only if the device passes the capability check (§5). Headline at most 2 lines at 390px. |
| 2 | **Scroll reveal** ("Turn it over.") | Scroll-scrubbed: the camera orbits 180° to show the outsole tread, then the profile, then the heel. The text side swaps three short lines. | Earn attention for build quality. Turn "cheap" into "engineered". | Reduce the orbit to 2 keyframes. The canvas fills the top 60% of the viewport with text below (no overlay on the headline). |
| 3 | **Exploded anatomy** (signature) | Pinned for about 250vh. The shoe separates on straight axes into 7 parts, each with a callout using the real spec words: canvas mesh upper, PU synthetic leather overlays, metal eyelets, high-density foam collar, arch-support cushioned footbed, EVA midsole, rubber outsole. Parts snap back at the end. | Prove the quality claim with Goldstar's own spec text, rewritten into sentence case with a plain-language "what it does". | Callouts become a bottom sheet that steps through parts one at a time (swipe or scroll), with one callout visible at once. Leader lines are hidden on phones; the active part is highlighted instead. |
| 4 | **Materials** (full Goldstar-blue field) | The shoe hides. Large macro **photographs** of each material (mesh weave, rubber tread, EVA cross-section) appear, with an optional small rotating material sample, for example a sphere or swatch with the real texture. | Materials as tactile proof, plus where they are made (Kathmandu units). | Images only, no 3D. Horizontal swipe gallery with scroll snap. |
| 5 | **Live thing: terrain + colourway** | The shoe returns, assembled. Toggles: Black / Olive, and Ringroad / monsoon mud / trail. They swap the floor texture, the light, and one outsole callout. | Make it the visitor's shoe. "This is how it looks on your road." | Two thumb-sized segmented controls below the canvas. The fallback is static images per colourway. |
| 6 | **Collection / colourways** (light ground) | The canvas is off. Product rail of real lines (G-10 Series, Classic Legends, ARC, Republic Leather, Trek) with real prices from WooCommerce. | Route to shopping. Prices visible and proud. | One-column cards are not allowed; use a horizontal snap rail with large photos and prices. Lazy-load images. |
| 7 | **Made in Nepal story** (dark) | Optional: a single 032 heritage model or photo. Better as photography: the factory, hands, women on the line, and the one street band borrowed from C. Big figures from verified sources: "75,000 pairs a day", "Made in Kathmandu". Avoid unverifiable numbers unless the client confirms them. | Pride and trust: a 50-year local maker, not an import. Handle the war era lightly or not at all (client decision). | Stack the photos. Use statements, not headlines (at most 25 words). Bilingual line in Mukta. |
| 8 | **Stores / CTA** | No 3D. A real map (static image on mobile, with a link out to Google Maps) of the 4 stores plus HQ. Big "Find a Goldstar store" and "Shop online" actions. Include the "spot a fake" note. | Convert: buy online or walk in. Counter counterfeits. | Tap-to-call phone numbers. List first, map second. |
| 9 | **Footer** | The Devanagari name गोल्डस्टार set at full width as a monument, with the star in gold. | Close with the name. Socials (Facebook, Instagram, TikTok, Pinterest), B2B link, legal entity. | The name is still full width (it scales with viewport units). Links sit in 2 columns. |

---

## 4. 3D and asset sourcing

Note: prices below are typical market ranges from 2025 and 2026 marketplace listings and experience. They are estimates; get real quotes. Nothing was downloaded or bought.

### 4.1 Getting the shoe model, compared

| Option | Quality for exploded view | Cost | Time | Notes |
|---|---|---|---|---|
| **A. Hire a 3D modeler from reference** (recommended) | Best. Separate, clean parts named for animation. | Fiverr product modelers roughly **US$80 to 400**. Upwork / ArtStation freelancers for a hero-quality shoe with PBR textures and 7 separable parts roughly **US$400 to 2,000**. Kathmandu has 3D, game and archviz studios, so a local hire is possible (quote in NPR, and they can handle the real shoe in person). | 1 to 3 weeks | Give them: the real shoe (or a size 8 pair), orthographic photos, a measured outsole trace, macro texture photos. Require the deliverables in §4.2. |
| **B. Photogrammetry / scan, then a modeler cleans it up** | Good surface realism; the scan is fused, so a modeler must still split parts and retopologize. | Apps: **Polycam** (free tier; paid about US$20 to 30 per month, check current), **KIRI Engine** (free tier plus Pro), **RealityScan** (Epic, free), **RealityCapture** (free for companies under US$1M revenue under Epic's licence) or **Meshroom** (free, open source). Cleanup modeler time US$150 to 800. | 2 to 5 days of scanning and cleanup, plus modeling | Shoes are hard to scan: mesh, white panels and shine. Use a turntable, diffuse light and a vanishing scanning spray (for example AESUB). Luma AI moved its focus to video generation, so its 3D capture is no longer a sure path **(unverified current status)**. Gaussian splats look great but cannot be exploded into parts; do not use them for the anatomy. |
| **C. AI image-to-3D** (Meshy, Tripo, Hyper3D Rodin, Tencent Hunyuan3D (open weights), Microsoft TRELLIS (open)) | Poor for the hero: a single fused mesh, lighting baked into textures, mushy laces and eyelets, wrong logos, messy topology. | Free tiers, or about US$10 to 60 per month | Minutes | Useful only for **blocking and previs**: build the scroll choreography in week 1 before the real model arrives. Never ship as the product. |
| **D. Placeholder stock models** | Varies; not Goldstar's shoe. | **Sketchfab**: check each model's licence. CC-BY is OK with credit; **CC-BY-NC is not allowed** (commercial site); Standard / Editorial licences vary. **CGTrader**: Royalty Free licence, models about US$10 to 100. **TurboSquid**: Standard licence. **Poly Haven**: CC0, but it has HDRIs and textures and few or no shoe models. | Same day | **Every placeholder must be replaced by the real Goldstar model before launch.** A generic sneaker on Goldstar's site would be a false product claim. Prefer a pre-split "exploded sneaker" model so the choreography transfers. |

**Recommended path:**
1. Week 1: build the choreography with an AI-generated or CC-BY placeholder.
2. Meanwhile, a modeler (local Kathmandu or Upwork) builds the real G10-401 from the physical shoe plus a phone scan for proportions.
3. Swap the model in. Same part names means no code changes.

### 4.2 Deliverables to require from the modeler

- Blender `.blend` plus `.glb` with these named meshes: `upper_mesh`, `overlay_pu`, `eyelets`, `laces`, `collar_foam`, `footbed`, `midsole_eva`, `outsole_rubber`, `logo_star`, `tongue`.
- The pivot of each part at its assembled position. The explode is driven in code; optionally also deliver a baked animation clip.
- Two LODs:
  - hero: 40 to 60k triangles
  - mobile: 15 to 25k triangles
- PBR textures:
  - baseColor, normal, ORM
  - 2K for desktop and 1K for mobile
  - one UV set
  - separate texture sets per colourway (Black, Olive), or a shared normal/ORM with swapped baseColor
- Real-world scale (a UK 8 shoe is about 28 cm long), with Y up.

### 4.3 Textures, HDRIs, icons, fonts (all free for commercial use)

- **HDRIs**: [Poly Haven](https://polyhaven.com/hdris) (CC0). Studio sets such as "studio_small" types and "photo_studio" give a QC-table look.
- **Ground textures** for the terrain toggle (asphalt, mud, gravel): [Poly Haven textures](https://polyhaven.com/textures) and [ambientCG](https://ambientcg.com/) (CC0).
- **Icons**: only for UI chrome (cart, search, menu), from [Lucide](https://lucide.dev/) (ISC) or [Phosphor](https://phosphoricons.com/) (MIT). No icon feature cards.
- **Fonts**, all from Google Fonts under the SIL OFL, self-hosted and subset:
  - [Archivo](https://fonts.google.com/specimen/Archivo)
  - [Mukta](https://fonts.google.com/specimen/Mukta)
  - for B: Instrument Sans and Noto Sans Devanagari
  - for C: Big Shoulders Display and Yatra One
- **Decoders**: Draco and Meshopt decoders and the Basis/KTX2 transcoder ship with three.js examples. Self-host them; don't pull from a CDN.

### 4.4 Client checklist (what we need from Goldstar)

1. **Physical samples**: two pairs of the hero model (UK 8), one to scan or measure and one that can be cut in half for a cross-section photo of the midsole and footbed layers. If possible, also the 032 classic and an ARC pair.
2. **Vector logo** (SVG/AI/PDF), the star mark on its own, the official brand blue (Pantone, CMYK, hex) and any brand guidelines. There is also a Devanagari logo if one exists.
3. **Canonical history facts**: founding year(s) (1970 Haathi? 1986 first shoe? 1990 Goldstar?), number of factory units, workforce number, pairs per day, the "12M customers" basis, and award names and years.
4. **Spec data per model**: materials for upper, overlays, midsole, outsole and footbed; weight per pair; sizes; colourways; price (MRP and sale); care notes; any test data (slip resistance, flex cycles), and only what is real.
5. **Product photography**: existing packshots (front, side, back, top, sole, 3/4) per colourway at full resolution, plus macro shots of the materials.
6. **Factory access** for a one-day photo shoot. Name and consent releases for workers shown.
7. **Store data**: full addresses, map pins, real opening hours, phone numbers, which stores carry which lines. Authorised resellers and Daraz/online sellers, for the anti-counterfeit section.
8. **Commerce decision and access**: keep WooCommerce? Payment methods in use (eSewa, Khalti, Fonepay, cash on delivery; none were found in the homepage HTML, so ask). Shipping zones. Admin or API access.
9. **Nepali copy approval**: who signs off Devanagari text.
10. **Positioning on the ARC / Balen moment and the Maoist-era history**: use, mention, or avoid.
11. **Social and UGC rights**: permission to show customer Instagram posts, and the names in the seven existing testimonials (with consent).

---

## 5. Tech stack recommendation

### 5.1 Front end

- **Astro (static output) + one React island running React Three Fiber + drei**, with **GSAP + ScrollTrigger** for scroll choreography and **Lenis** for smooth scroll on desktop only. Use native scroll on touch devices.
  - Why Astro over a full Next.js SPA: almost the whole page is static HTML and images. Only the shoe canvas needs JS. This keeps the JavaScript shipped to a Nepali mid-range phone small (target under 150 KB JS before three.js). three.js plus R3F, about 250 KB gzip, then loads after the poster.
  - Alternative: Vite + React SPA (simpler for a React-only team, but larger first load). Next.js only if the shop becomes headless with server-rendered product pages.
- GSAP is now fully free, plugins included, after Webflow's acquisition (verify licence wording at build time). ScrollTrigger drives one timeline; R3F reads its progress in `useFrame`.
- drei helpers: `useGLTF` (with Draco/Meshopt), `useKTX2`, `Environment` (a prefiltered small HDRI, 1K), `ContactShadows` (baked once, not per frame), `PerformanceMonitor`, `AdaptiveDpr`.

### 5.2 Model pipeline

Blender, then glTF 2.0 (`.glb`), then **gltf-transform** CLI:
- `dedup`, `prune`, `weld`
- `simplify` for the mobile LOD
- `meshopt` compression (faster to decode on phones than Draco; either is fine)
- `ktx2` textures (`etc1s` for baseColor, `uastc` for normal maps)
- `resize` to 2K / 1K

Budgets:

| Item | Budget |
|---|---|
| Mobile `.glb` including textures | **≤ 1.5 MB** |
| Desktop `.glb` including textures | ≤ 4 MB |
| Hero poster (AVIF) | ≤ 120 KB |
| Page total before 3D | ≤ 600 KB |

Inspect the model with `gltf-transform inspect` and the three.js editor.

### 5.3 Mobile performance (Nepal, mid-range Android, variable 4G)

- **Tiered experience**. Check `navigator.deviceMemory`, `hardwareConcurrency`, the WebGL2 and KTX2 support, `navigator.connection.effectiveType` and `saveData`.
  - **Tier 1** (desktop and strong phones): live 3D.
  - **Tier 2** (mid-range phones): live 3D with the mobile LOD, DPR capped at 1.5, no realtime shadows, one light plus the environment.
  - **Tier 3** (low-end, 3G, or Save-Data): a **pre-rendered image sequence** of the explode (for example 60 AVIF/WebP frames, about 25 KB each, scrubbed on a canvas) or simply stills with callouts. The page is complete without WebGL.
- Render only while visible (`frameloop="demand"` and invalidation on scroll). Pause when the tab is hidden.
- Respect `prefers-reduced-motion` (stills).
- Self-host and subset fonts (Latin plus Devanagari subsets) with `font-display: swap`.
- Test on a real device in the Rs 20 to 35k class (for example Redmi Note or Samsung A-series) over a throttled "Fast 3G / slow 4G" profile. Target LCP under 2.5 s and INP under 200 ms.

### 5.4 Hosting

- **Cloudflare Pages** (free tier: unlimited static bandwidth, global CDN). Cloudflare's network map lists a Kathmandu location **(verify on cloudflare.com/network)**. This is the best fit for a Nepali audience. Serve `.glb`/`.ktx2` with long cache headers and Brotli.
- Netlify free is fine as a second choice.
- **Avoid Vercel Hobby**: its terms restrict Hobby to non-commercial use, and this is a commercial client site (Vercel Pro is US$20/month).

### 5.5 CMS and e-commerce

- Keep the **existing WooCommerce** as the shop of record. Clean up the BeTheme demo links, fill ARC and show prices.
- The new marketing homepage either:
  1. links "Shop" and "Buy" buttons to WooCommerce product URLs (cheapest, fastest), or
  2. reads live prices and stock from the **WooCommerce Store API** at build time or on the client.
- Content the marketing team edits (spec callouts, story copy) can live in Astro content collections (Markdown/JSON in the repo) for v1. Add a headless CMS (Sanity or Decap, both with free tiers) only if non-developers must edit it.
- Optional: put the new site on `goldstarshoes.com` and move WooCommerce to `shop.goldstarshoes.com`. This needs the client's DNS decision.

---

## 6. Open questions for the captain

1. **Sell or showcase?** Does the new site replace the WooCommerce shop, sit in front of it (linking to it), or stay showcase-only? I recommend sitting in front of it and linking to it.
2. **Which shoe is the 3D hero?**
   - **G10-401**: it has real spec copy now. Recommended.
   - **ARC**: the 2026 demand spike, but there is no product data online yet.
   - **032 classic**: the heritage icon.
3. **3D modeler budget and route:** a local Kathmandu modeler working from the physical shoe, or a remote Upwork/ArtStation freelancer? Rough range US$400 to 2,000 for a hero-quality, part-split model.
4. **Direction sign-off:** A "Night Shift" (recommended), B "Blue Print 032", or C "Ringroad"?
5. **Is Goldstar a real client engaged with us?** We need the samples, logo files, factory access and fact sign-off in §4.4. Without them we can only build a spec prototype, and it must not go public with placeholder shoes or unconfirmed claims.
6. **Bilingual?** Nepali and English, or English with Nepali accents only? This affects copy budget and fonts.
7. **Sensitive history:** should the story mention the Maoist-era association and the PM/"Balen shoes" moment, or stay purely on craft and heritage?
