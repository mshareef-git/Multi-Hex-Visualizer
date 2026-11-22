import {
  hex,
  value,
  rgb,
  brightness,
  colorName,
  sentence,
  formats,
} from "./colors.js";
export const layouts = [
  "Sharp Grid",
  "Vertical Stripes",
  "Horizontal Stripes",
  "Radial",
  "Rounded Tiles",
  "Circular Swatches",
  "Diagonal Bands",
  "Typography",
];
export const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        ch
      ],
  );
export const labelFields = ["Name", ...formats];
export const defaultLabels = ["Name", "HEX", "RGB"];
export function normalizeLabels(data) {
  if (Array.isArray(data.labels))
    return labelFields.filter((field) => data.labels.includes(field));
  if (data.metadata === "Name + HEX") return ["Name", "HEX"];
  if (labelFields.includes(data.metadata)) return [data.metadata];
  return [...defaultLabels];
}
function swatchLabels(fields, row, name, text, x, y, width, height) {
  const inset = width > 140 ? 14 : 7;
  const room = width - inset * 2;
  if (room < 46 || height < 24) return "";
  const visible = fields.slice(0, Math.floor((height - 10) / 18));
  return visible
    .map((field, index) => {
      const isName = field === "Name";
      const str = isName ? name : value(row.c, field);
      const limit = Math.floor(room / (isName ? 8 : 7.4));
      const display = str.length > limit ? str.slice(0, limit - 1) + "…" : str;
      const baseline = y + height - inset - (visible.length - index - 1) * 18;
      return `<text class="swatch-label" fill="${text}" x="${x + inset}" y="${baseline}" font-family="${isName ? "Geist,Arial,sans-serif" : "Geist Mono,monospace"}" font-size="${isName ? 14 : 12}" font-weight="${isName ? 650 : 450}">${esc(display)}</text>`;
    })
    .join("");
}
function pencil(x, y, color) {
  return `<g class="edit-cue" aria-hidden="true" transform="translate(${x} ${y})" stroke="${color}" fill="none" stroke-width="1.45" stroke-linejoin="round"><path d="m2 10 7.5-7.5a1.5 1.5 0 0 1 2 2L4 12l-3 1zM8 4l2 2"/></g>`;
}
export function picture(
  rows,
  settings,
  w = 1050,
  bg = "#fff",
  ink = "#171717",
  fullHeight = 0,
) {
  if (!rows.length) return "";
  const { layout, interactive } = settings;
  const fields =
    settings.hideLabels || settings.metadata === "Hidden"
      ? []
      : normalizeLabels(settings);
  const typography = layout === "Typography";
  if (typography) w = Math.max(w, 1100);
  const n = rows.length;
  let cols = Math.min(
      n,
      w < 550 ? 2 : Math.min(8, Math.max(3, Math.ceil(Math.sqrt(n * 1.5)))),
    ),
    h;
  if (n === 6 && w >= 550) cols = 3;
  if (typography) cols = 1;
  const count = Math.ceil(n / cols);
  h = Math.max(
    fullHeight,
    layout === "Typography"
      ? count * 56
      : layout === "Horizontal Stripes"
        ? Math.max(
            230,
            n * (interactive ? Math.max(44, fields.length * 18 + 24) : 40),
          )
        : layout === "Radial"
          ? Math.min(w, 450)
          : layout === "Vertical Stripes" || layout === "Diagonal Bands"
            ? 245
            : count *
              (n > 24
                ? 85
                : n === 1
                  ? 210
                  : Math.max(122, fields.length * 18 + 40)),
  );
  const cw = w / cols,
    ch = h / count,
    rad = Math.min(w, h) * 0.47;
  const samples = rows.map((row, i) => {
    const fill = hex(row.c),
      name = row.name || colorName(row.c),
      base = rgb(row.c),
      a = base.alpha ?? 1;
    const back = rgb(bg);
    const luma = brightness({
      mode: "rgb",
      r: base.r * a + back.r * (1 - a),
      g: base.g * a + back.g * (1 - a),
      b: base.b * a + back.b * (1 - a),
    });
    const text = luma > 0.18 ? "#131513" : "#fff";
    let x = (i % cols) * cw,
      y = Math.floor(i / cols) * ch,
      width = cw,
      height = ch,
      shape = "",
      label = true;
    if (layout === "Vertical Stripes") {
      width = w / n;
      x = i * width;
      y = 0;
      height = h;
    }
    if (layout === "Horizontal Stripes") {
      width = w;
      x = 0;
      height = h / n;
      y = i * height;
    }
    if (layout === "Radial") {
      const ang = (j) => -Math.PI / 2 + (2 * Math.PI * j) / n,
        point = (j) =>
          [w / 2 + rad * Math.cos(ang(j)), h / 2 + rad * Math.sin(ang(j))].join(
            " ",
          );
      shape =
        n === 1
          ? '<circle cx="' + w / 2 + '" cy="' + h / 2 + '" r="' + rad + '"/>'
          : '<path d="M ' +
            w / 2 +
            " " +
            h / 2 +
            " L " +
            point(i) +
            " A " +
            rad +
            " " +
            rad +
            " 0 0 1 " +
            point(i + 1) +
            ' Z"/>';
      label = false;
    } else if (layout === "Diagonal Bands") {
      const tilt = w * 0.17,
        step = (w + tilt) / n,
        left = i * step - tilt;
      shape =
        '<polygon points="' +
        left +
        ",0 " +
        (left + step) +
        ",0 " +
        (left + step + tilt) +
        "," +
        h +
        " " +
        (left + tilt) +
        "," +
        h +
        '"/>';
      label = false;
    } else if (layout === "Circular Swatches" || layout === "Rounded Tiles") {
      const d = Math.min(width, height) - 14,
        cx = x + width / 2,
        cy = y + height / 2;
      shape =
        layout === "Circular Swatches"
          ? '<circle cx="' + cx + '" cy="' + cy + '" r="' + d / 2 + '"/>'
          : '<rect x="' +
            (cx - d / 2) +
            '" y="' +
            (cy - d / 2) +
            '" width="' +
            d +
            '" height="' +
            d +
            '" rx="' +
            d * 0.14 +
            '"/>';
      label = false;
    } else if (layout === "Typography") {
      shape = `<rect x="0" y="${y}" width="${width}" height="${height}" fill="${bg}"/><text x="38" y="${y + height / 2 + 8}" font-family="Geist,Arial,sans-serif" font-size="25" font-weight="760">${sentence}</text>`;
      label = false;
    } else
      shape =
        '<rect x="' +
        x +
        '" y="' +
        y +
        '" width="' +
        (width + 0.03) +
        '" height="' +
        height +
        '"/>';
    if (layout === "Rounded Tiles" || layout === "Circular Swatches") {
      const diameter = Math.min(width, height) - 14;
      x += (width - diameter) / 2 + diameter * 0.12;
      y += (height - diameter) / 2 + diameter * 0.18;
      width = diameter * 0.76;
      height = diameter * 0.64;
      label = true;
    } else if (layout === "Radial" && n <= 10) {
      const angle = -Math.PI / 2 + (Math.PI * (2 * i + 1)) / n;
      width = Math.min(118, (rad * 1.8) / Math.max(1, n / 3));
      height = Math.min(rad * 0.5, 28 + fields.length * 18);
      x = w / 2 + rad * 0.64 * Math.cos(angle) - width / 2;
      y = h / 2 + rad * 0.64 * Math.sin(angle) - height / 2;
      label = true;
    } else if (layout === "Diagonal Bands") {
      const step = (w * 1.17) / n;
      height = Math.min(h * 0.72, 28 + fields.length * 18);
      const center = (i + 0.5) * step - w * 0.085;
      const inner = Math.max(0, step - (w * 0.17 * height) / h);
      x = Math.max(0, center - inner / 2);
      width = Math.max(0, Math.min(w, center + inner / 2) - x);
      y = h / 2 - height / 2;
      label = true;
    }
    const labels =
      interactive && label
        ? swatchLabels(fields, row, name, text, x, y, width, height)
        : "";
    let cue = "";
    if (interactive && ((label && width >= 52 && height >= 32) || typography)) {
      const cx = typography ? 12 : x + width - 22;
      const cy = typography ? y + height / 2 - 7 : y + 6;
      cue = pencil(
        cx,
        cy,
        typography ? (brightness(bg) > 0.18 ? "#191919" : "#fff") : text,
      );
    }
    return (
      "<g " +
      (interactive
        ? 'role="button" tabindex="0" data-index="' +
          i +
          '" aria-label="' +
          esc("Edit " + name + " " + fill) +
          '" color="' + (typography ? (brightness(bg) > 0.18 ? "#191919" : "#fff") : text) + '"'
        : "") +
      ' fill="' +
      fill +
      '">' +
      shape +
      labels +
      cue +
      "</g>"
    );
  });
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" role="' +
    (interactive ? "group" : "img") +
    '" aria-label="' +
    esc(layout === "Typography" ? sentence : layout + " palette preview") +
    '" class="' +
    (typography ? "type-board" : "swatch-board") +
    '" width="' +
    w +
    '" height="' +
    h +
    '" viewBox="0 0 ' +
    w +
    " " +
    h +
    '" style="background:' +
    bg +
    ";color:" +
    ink +
    ';font-family:Arial,sans-serif"><rect width="100%" height="100%" fill="' +
    bg +
    '"/>' +
    samples.join("") +
    "</svg>"
  );
}
