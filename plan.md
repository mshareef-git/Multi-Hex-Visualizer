# Multi Hex Visualizer — Codex Build Brief

My competitor website is https://lawlesscreation.github.io/hex-color-visualiser/ (check about it) and it have some features which we need and we need to make a website better than it.


Build a polished, production-ready color visualization web app called **Multi Hex Visualizer** in my **already initialized Astro project**. Use the attached sketches as the primary layout references. Implement a working product, not merely a landing page or static mockup.

## Before coding

1. Inspect the existing project and any `DESIGN.md` I previously supplied. Preserve the current Astro setup and follow its established conventions.
2. Use the **Astro Docs MCP** and **`tailwind-4-docs` skill** for up-to-date Astro and Tailwind CSS v4 patterns.
3. Run `npx getdesign@latest add nike --out ./design-references/NIKE_DESIGN.md` to obtain the Nike design reference, and `npx impeccable install` to use the Impeccable design skill. If tooling differs, check its current instructions. Use these as **design guidance**, not as permission to replace my existing design specification or copy Nike branding.
4. Make sensible choices for architecture, components, libraries, responsiveness, and micro-interactions. I do **not** want an overengineered architecture or excessive planning documents.

## Visual direction and page structure

- Minimal, refined, grayscale-first UI (white/gray/charcoal/black) with **light, dark, and system** themes. Imported colors should be the visual focus.
- **Do not use a permanent left-input/right-output split layout.** Follow the reference sketches: an editing/paste area **above** a large visualization panel, within the same workspace/card.
- Near the top, a simple switch for **Single Group** and **Multi Group** visualization. These mean **one palette of many colors versus comparison of multiple independent palettes**—not one color versus many colors.
- Single Group: one input/editor followed by one large live preview.
- Multi Group: support **up to 4 independently editable groups**, each with its own input and preview, plus an easy way to compare the groups together. Keep this manageable on mobile and with large palettes; decide the best comparison arrangement.
- Use the sketches in `references/` as guidance, not pixel-perfect designs. You may improve hierarchy, naming, controls, and flow.

## Import and editing

- Support these **five** color formats: **HEX, RGB, RGBA, HSL, OKLCH**. Support valid shorthand HEX and alpha where appropriate.
- Large scrollable paste/type area. Let users select an input format and separator: **comma, space, newline, semicolon, pipe**, or **custom separator**; offer smart auto-detection as a convenient default. Correctly parse functional color values that themselves contain spaces or commas.
- In the input area, show friendly, concise instructions and a changing example reflecting the chosen format/separator. Clearly surface invalid entries without losing valid colors.
- **Live preview as users type/paste**, without requiring an Enter/Submit button. Aim to handle **up to ~250 colors** smoothly (choose a sensible total limit policy across groups and communicate it clearly).
- Support drag-and-drop reordering, inline color editing, custom editable color names, sorting by **hue / brightness / saturation**, reversing order, and **undo / redo**.
- An optional **whole-palette hue-shift slider** should move all colors together while maintaining their relative color differences. Make it easy to reset and undo.

## Visualization layouts

Make **Sharp Grid** the default. Also offer:

1. Vertical Stripes
2. Horizontal Stripes
3. Radial / circular segments
4. Rounded Square Tiles
5. Circular Swatches
6. Diagonal Bands
7. **Typography Preview**

Typography Preview must display **the same exact, non-editable sentence for every color**, with identical font, size, spacing, and layout. Only text color changes:

> Wisdom is knowing when to balance, when to give your all, and when to let go

For 10 imported colors, show 10 equal, consistent text samples; scale appropriately for more colors. No different headings or words for different swatches.

The preview should adapt its density for small and large palettes, remain scrollable if needed, and have a **true fullscreen mode**.

## Preview interaction

Offer two clear modes in both normal and fullscreen visualization:

- **Visualize Only:** Colors (or the identical typography samples) and nothing distracting—no codes, names, copy controls, or editing overlays.
- **Interactive:** Click/tap a swatch to inspect, edit, and copy it. Allow configurable displayed metadata (for example, name only, HEX only, name + HEX, or other selected output formats).

Each color should open a lightweight details/editor popover or panel with a **real color picker** inspired by `references/color-picker.png` (large saturation/value square and hue slider), editable name, color values/conversions, and copy actions. Determine the most usable responsive interaction.

Use automatic common/nearest color names when possible, clearly distinguishing approximate names from exact ones. Let users override names manually.

## Copy, export, and sharing

- Copy any individual color in any of the five formats; copy its editable name where applicable.
- **Copy All** with a success message/toast. By default, output in the user's **selected import format** (or preserve each color's original format in an auto/mixed import); allow overriding the output format and separator. Clearly indicate when the palette has been copied.
- Export palette or current visualization to **PNG, SVG**, and palette data to **CSS, JSON, TXT**. Keep export results accurate and usable.
- Generate **shareable URLs** that restore palette data, group arrangement, and relevant view settings; handle URLs that would become too long gracefully.
- Preserve work locally where reasonable, without requiring accounts or a backend for basic use.

## Quality bar

- Fully responsive and keyboard accessible; smooth with ~250 colors, including fullscreen and multi-group previews.
- Reasonable color accuracy and alpha handling; clear validation, edge-case behavior, empty states, and copy/export feedback.
- Use performance-conscious rendering and lightweight dependencies. Add tests for parsing, conversion, sorting, state/history, and copy/export behavior as appropriate.
- Basic SEO metadata and descriptive on-page copy, but keep the **tool itself** front and center.
- After implementation, run relevant checks/build and fix issues. Report what was implemented and any deliberate trade-offs.

**Important:** This is a product brief, not a rigid engineering blueprint. Own the implementation and choose sensible missing details without turning the interface into a cluttered Swiss Army knife. Respect the supplied layouts, interaction model, sentence, visualizer modes, and color requirements.

## Implementation decisions

- Start with a six-color sample so users can try every layout immediately. The header’s swatch fan follows the active palette.
- Apply the 250-color display limit across visible groups in group order. Keep the original input available when the preview limit is reached.
- Multi Group shows all previews together. Group tabs choose which palette to edit, copy, or export.
- Store workspace data in the URL fragment when sharing. Offer a downloadable, restorable workspace file when the link exceeds 16,000 characters.
- Provide dedicated format routes with a shared editor. Build static files suitable for Cloudflare hosting.
