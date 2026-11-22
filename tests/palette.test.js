import test from "node:test";
import assert from "node:assert/strict";
import {
  parseInput,
  makeGroup,
  rowsFor,
  hex,
  ordered,
  serialize,
  value,
  formats,
} from "../src/lib/colors.js";
import { picture, layouts } from "../src/lib/preview.js";
test("mixed syntax, separators and invalid entries", () => {
  const r = parseInput(
    "#abcd rgb(1, 2, 3);oops | hsl(90 50% 25% / .5),oklch(.5 .1 99)",
  );
  assert.equal(r.colors.length, 4);
  assert.deepEqual(r.invalid, ["oops"]);
  assert.equal(hex(r.colors[0].c), "#AABBCCDD");
  assert.equal(parseInput("abc::def", "HEX", "Custom", "::").colors.length, 2);
});
test("conversion preserves translucent colors within display precision", () => {
  const c = parseInput("#C83A7280").colors[0].c;
  for (const f of formats) {
    assert.equal(hex(parseInput(value(c, f)).colors[0].c), hex(c));
  }
});
test("ordering, copying and hue changes preserve the original input", () => {
  const g = makeGroup("#fff, #000");
  const rows = rowsFor(g).colors;
  assert.equal(
    serialize(ordered(rows, "Brightness"), "Original", "|"),
    "#000|#fff",
  );
  assert.equal(serialize(rows, "HEX", ";"), "#FFFFFF;#000000");
  const red = makeGroup("#f00");
  red.shift = 120;
  assert.equal(hex(rowsFor(red).colors[0].c), "#00FF00");
  assert.equal(red.raw, "#f00");
});
test("every layout renders, escapes labels and supports a clean export", () => {
  const rows = rowsFor(makeGroup("#fff,#123")).colors;
  rows[0].name = "<name>";
  for (const layout of layouts) {
    const svg = picture(rows, { layout, interactive: false, metadata: "Name" });
    assert.ok(svg.startsWith("<svg"));
    assert.ok(!svg.includes("data-index"));
  }
  assert.match(
    picture(rows, {
      layout: "Sharp Grid",
      interactive: true,
      metadata: "Name",
    }),
    /&lt;name&gt;/,
  );
});
test("typography keeps each full sentence on one bold line", () => {
  const rows = rowsFor(makeGroup("#fff,#222")).colors;
  const svg = picture(rows, { layout: "Typography", interactive: false }, 320);
  const quotes = [
    ...svg.matchAll(/<text [^>]*font-weight="760"[^>]*>([^<]+)<\/text>/g),
  ];
  assert.deepEqual(
    quotes.map((m) => m[1]),
    Array(2).fill(
      "Wisdom is knowing when to balance, when to give your all, and when to let go",
    ),
  );
});
test("default, custom, hidden and legacy labels", () => {
  const rows = rowsFor(makeGroup("#f00")).colors;
  const render = (settings) =>
    picture(
      rows,
      { layout: "Sharp Grid", interactive: true, ...settings },
      480,
    );
  const labels = (svg) =>
    [...svg.matchAll(/<text class="swatch-label"[^>]*>([^<]*)<\/text>/g)].map(
      (m) => m[1],
    );
  assert.deepEqual(labels(render({})), ["Red", "#FF0000", "rgb(255, 0, 0)"]);
  assert.deepEqual(labels(render({ labels: ["HEX", "HSL"] })), [
    "#FF0000",
    "hsl(0, 100%, 50%)",
  ]);
  assert.deepEqual(labels(render({ hideLabels: true })), []);
  assert.deepEqual(labels(render({ metadata: "Name + HEX" })), [
    "Red",
    "#FF0000",
  ]);
  assert.doesNotMatch(render({ interactive: false }), /edit-cue|swatch-label/);
});
