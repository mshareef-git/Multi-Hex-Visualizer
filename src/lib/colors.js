import {
  parse,
  converter,
  formatHex,
  formatHex8,
  formatHsl,
  formatRgb,
  wcagLuminance,
  colorsNamed,
} from "culori";

export const formats = ["HEX", "RGB", "RGBA", "HSL", "OKLCH"];
export const separators = {
  Auto: ", ",
  Comma: ", ",
  Space: " ",
  Newline: "\n",
  Semicolon: "; ",
  Pipe: " | ",
};
export const presets = {
  "Gruvbox · Dark Medium": [
    "#282828",
    "#FB4934",
    "#FE8019",
    "#FABD2F",
    "#B8BB26",
    "#83A598",
    "#D3869B",
    "#EBDBB2",
  ],
  "Tokyo Night · Night": [
    "#1A1B26",
    "#F7768E",
    "#FF9E64",
    "#E0AF68",
    "#9ECE6A",
    "#7DCFFF",
    "#7AA2F7",
    "#BB9AF7",
  ],
  "Catppuccin · Mocha": [
    "#1E1E2E",
    "#F38BA8",
    "#FAB387",
    "#F9E2AF",
    "#A6E3A1",
    "#94E2D5",
    "#89B4FA",
    "#CBA6F7",
  ],
  "Everforest · Dark Medium": [
    "#2D353B",
    "#E67E80",
    "#E69875",
    "#DBBC7F",
    "#A7C080",
    "#83C092",
    "#7FBBB3",
    "#D699B6",
  ],
  "Desert Bloom": [
    "#D95D39",
    "#F2A65A",
    "#F3DFA2",
    "#A8C3A0",
    "#437F78",
    "#254441",
  ],
  "After Hours": [
    "#201E39",
    "#423A64",
    "#766799",
    "#B599C6",
    "#EBC2CB",
    "#F3D9BA",
  ],
  "Ocean Study": [
    "#073B4C",
    "#126782",
    "#219EBC",
    "#73C2CC",
    "#B7E4DC",
    "#E4F5EF",
  ],
  "Primary Forms": [
    "#F04E3E",
    "#FFB400",
    "#F6EAC2",
    "#2366B0",
    "#242424",
    "#BCC4C9",
  ],
};
export const sentence =
  "Wisdom is knowing when to balance, when to give your all, and when to let go";
export const hsl = converter("hsl"),
  hsv = converter("hsv"),
  rgb = converter("rgb"),
  lab = converter("oklab"),
  lch = converter("oklch");
export function hex(c) {
  return (c.alpha < 1 ? formatHex8(c) : formatHex(c)).toUpperCase();
}
export function value(c, type) {
  if (type === "HEX") return hex(c);
  if (type === "HSL") return formatHsl(c);
  if (type === "OKLCH") {
    const { l, c: ch, h = 0, alpha = 1 } = lch(c);
    return (
      "oklch(" +
      [+l.toFixed(5), +ch.toFixed(5), +h.toFixed(2)].join(" ") +
      (alpha < 1 ? " / " + alpha : "") +
      ")"
    );
  }
  const s = formatRgb(c);
  return type === "RGBA" && !s.startsWith("rgba")
    ? s.replace("rgb(", "rgba(").replace(")", ", 1)")
    : s;
}
export function splitColors(raw, separator = "Auto", custom = "") {
  const delimiter = {
    Comma: ",",
    Space: /\s/,
    Newline: /[\r\n]/,
    Semicolon: ";",
    Pipe: "|",
    Custom: custom,
    Auto: /[,;|\s]/,
  }[separator];
  let depth = 0,
    token = "",
    tokens = [];
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    const match =
      depth === 0 &&
      (delimiter instanceof RegExp
        ? delimiter.test(ch)
        : delimiter && raw.startsWith(delimiter, i));
    if (match) {
      if (token.trim()) tokens.push(token.trim());
      token = "";
      if (typeof delimiter === "string") i += delimiter.length - 1;
      continue;
    }
    if (ch === "(") depth++;
    if (ch === ")") depth = Math.max(0, depth - 1);
    token += ch;
  }
  if (token.trim()) tokens.push(token.trim());
  return tokens;
}
export function parseInput(raw, format = "Auto", sep = "Auto", custom = "") {
  const colors = [],
    invalid = [];
  for (const token of splitColors(raw, sep, custom)) {
    const isHex = /^#?(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.test(token);
    const type = isHex
      ? "HEX"
      : token
          .match(/^(rgb|rgba|hsla?|oklch)\(/i)?.[1]
          .toUpperCase()
          .replace("HSLA", "HSL");
    const c =
      type && parse(isHex && !token.startsWith("#") ? "#" + token : token);
    if (
      !c ||
      (format !== "Auto" &&
        format !== type &&
        !(format === "RGB" && type === "RGBA"))
    )
      invalid.push(token);
    else colors.push({ c, type, token });
  }
  return { colors, invalid };
}
const names = Object.keys(colorsNamed).map((key) => [key, lab(key)]);
const nameCache = new Map();
export function colorName(c) {
  const key = formatHex(c);
  if (nameCache.has(key)) return nameCache.get(key);
  const p = lab(c);
  let best = "",
    distance = Infinity;
  for (const [name, n] of names) {
    const d = (p.l - n.l) ** 2 + (p.a - n.a) ** 2 + (p.b - n.b) ** 2;
    if (d < distance) {
      best = name;
      distance = d;
    }
  }
  const result =
    (distance > 1e-10 ? "≈ " : "") + best[0].toUpperCase() + best.slice(1);
  if (nameCache.size > 1500) nameCache.clear();
  nameCache.set(key, result);
  return result;
}
export function brightness(c) {
  return wcagLuminance(c);
}
export function shifted(c, degrees) {
  if (!degrees) return c;
  const color = hsl(c);
  return { ...color, h: (color.h ?? 0) + degrees };
}
export function rowsFor(group, limit = 250) {
  const parsed = parseInput(group.raw, group.format, group.sep, group.custom);
  return {
    ...parsed,
    total: parsed.colors.length,
    colors: parsed.colors.slice(0, Math.max(0, limit)).map((item, i) => ({
      ...item,
      c: shifted(item.c, group.shift),
      name: group.names[i] || "",
    })),
  };
}
export function makeGroup(raw = "") {
  return { raw, format: "Auto", sep: "Auto", custom: "", names: [], shift: 0 };
}
export function serialize(rows, format, sep) {
  return rows
    .map((row) => (format === "Original" ? row.token : value(row.c, format)))
    .join(sep);
}
export function ordered(rows, by) {
  if (by === "Reverse") return [...rows].reverse();
  const key = (c) =>
    by === "Brightness"
      ? brightness(c)
      : by === "Hue"
        ? (hsl(c).h ?? 0)
        : hsl(c).s;
  return [...rows].sort((a, b) => key(a.c) - key(b.c));
}
