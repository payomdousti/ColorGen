# ColorGen

**One palette. Every room. Every outfit.**

Generate color palettes grounded in color science, then apply them to your spaces and wardrobe with algorithms that know where colors belong.

[Try it live](https://colorgen.vercel.app)

---

## Start with a palette.

Lock in the colors you already have — scan your floors, walls, and furniture with a color tool, or just type hex codes. Pick a harmony mode. Hit generate. ColorGen produces multiple variations using perceptually uniform color math (CIELAB/LCH), so what looks balanced on screen looks balanced in real life.

Five harmony modes: **Complementary**, **Analogous**, **Triadic**, **Split-Complementary**, and **Delta-E Smart** (maximizes perceptual distance between every color). Pin the palettes you like.

## Design your rooms.

Select a room template, pick a pinned palette, and auto-fill. The algorithm splits your palette into two lanes:

- **Structural items** (floors, walls, doors, drapes) get neutral tones matched to their expected lightness — dark for floors, light for walls. A guardrail desaturates any color that's too chromatic before it touches a structural surface.
- **Accent items** (couch, rug, accent wall, bookshelf) get the palette's expressive colors, spread across the lightness range for contrast.

Every item in the catalog has a weight, a role, and a lightness range. Floors know they should be dark. Walls know they should be light. The algorithm respects that. Change any color manually and the room harmony score updates in real time. The color picker shows you exactly what fits, what could work, and what to avoid.

## Build your outfits.

Same idea, different rules. 20 outfit templates from Casual to Formal to Athleisure, with 55+ cataloged garment types. The auto-fill uses nearest-target lightness matching:

- **Foundation pieces** (shoes, belts, bags) share dark neutrals — matching boots and belt is how people actually dress
- **Accent pieces** (tops, outerwear) get distinct chromatic colors, most constrained items picking first so nothing ends up the wrong shade

## The color science.

All math runs in **CIELAB** and **LCH** color space via [chroma-js](https://github.com/gka/chroma.js). These are perceptually uniform — a distance of 10 between two colors always *looks* like the same amount of difference, unlike RGB or HSL. Palette generation uses a seeded PRNG for reproducible variations, and every palette gets automatic dark and light neutral anchors injected so there's always an appropriate color for structural surfaces.

Harmony scoring weighs three things: hue cohesion relative to the palette's cluster structure, saturation coherence across all room colors, and lightness reasonableness (penalizes monotone rooms and tonal gaps, not wide range — light walls with dark floors is normal).

## Run it.

```bash
git clone git@github.com:payomdousti/ColorGen.git
cd ColorGen
npm install
npm run dev
```

Opens at `http://localhost:5173`. No backend. All state persists in `localStorage`.

## Stack

React 19 / TypeScript 5.9 / Vite 7 / [chroma-js](https://github.com/gka/chroma.js) / Vercel

## License

MIT
