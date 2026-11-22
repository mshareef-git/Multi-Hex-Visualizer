import { parse } from "culori";
import { artworkMarkup } from "./export-artwork.js";
import {
  formats,
  separators,
  presets,
  makeGroup,
  parseInput,
  rowsFor,
  hex,
  value,
  hsv,
  ordered,
  serialize,
  colorName,
} from "./colors.js";
import {
  layouts,
  esc,
  picture,
  normalizeLabels,
  defaultLabels,
  labelFields,
} from "./preview.js";

const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)];
const icon = (id) =>
  '<svg class="icon" aria-hidden="true"><use href="#icon-' + id + '"/></svg>';
const options = (items, sel) =>
  items
    .map(
      (s) =>
        "<option " + (s === sel ? "selected" : "") + ">" + esc(s) + "</option>",
    )
    .join("");
const route = document.body.dataset.format,
  storage = "multihex-v1-" + route;
const sample = (name, format = "Auto") =>
  presets[name]
    .map((c) => (format === "Auto" ? c : value(parse(c), format)))
    .join(", ");
function initial() {
  const g = makeGroup(sample("Desert Bloom", route));
  g.format = route;
  return {
    groups: [g],
    active: 0,
    multi: false,
    layout: "Sharp Grid",
    interactive: true,
    labels: [...defaultLabels],
    hideLabels: false,
    theme: "Light",
    output: "Original",
    outSep: "Comma",
    outCustom: ", ",
  };
}
function restore(data) {
  if (!Array.isArray(data?.groups) || !data.groups.length) return initial();
  const state = initial();
  state.groups = data.groups
    .slice(0, 4)
    .filter((g) => g && typeof g.raw === "string")
    .map((g) => ({
      raw: g.raw,
      format: ["Auto", ...formats].includes(g.format) ? g.format : "Auto",
      sep: [...Object.keys(separators), "Custom"].includes(g.sep)
        ? g.sep
        : "Auto",
      custom: String(g.custom || "").slice(0, 12),
      names: Array.isArray(g.names)
        ? g.names.slice(0, 250).map((v) => String(v || "").slice(0, 80))
        : [],
      shift: Math.max(-180, Math.min(180, Number(g.shift) || 0)),
    }));
  if (!state.groups.length) return initial();
  for (const [k, items] of Object.entries({
    layout: layouts,
    theme: ["Light", "Dark"],
    output: ["Original", ...formats],
    outSep: [...Object.keys(separators), "Custom"],
  }))
    if (items.includes(data[k])) state[k] = data[k];
  state.labels = normalizeLabels(data);
  state.hideLabels = data.hideLabels === true || data.metadata === "Hidden";
  if (data.theme === "System")
    state.theme = matchMedia("(prefers-color-scheme:dark)").matches
      ? "Dark"
      : "Light";
  state.outCustom = String(data.outCustom ?? ", ").slice(0, 12);
  state.multi = !!data.multi;
  state.interactive = data.interactive !== false;
  state.active = state.multi
    ? Math.min(Math.max(0, Number(data.active) | 0), state.groups.length - 1)
    : 0;
  return state;
}
let state = initial(),
  loadMessage = "";
try {
  const shared = location.hash.startsWith("#palette=")
    ? decodeURIComponent(location.hash.slice(9))
    : null;
  state = restore(
    JSON.parse(shared || localStorage.getItem(storage) || "null"),
  );
  const preferred = localStorage.getItem("multihex-theme");
  if (preferred === "Light" || preferred === "Dark") state.theme = preferred;
  if (shared)
    history.replaceState(null, "", location.pathname + location.search);
} catch {
  loadMessage = "Could not restore this palette.";
}
let undo = [],
  redo = [],
  lastKey = "",
  lastTime = 0,
  timer,
  sets = [],
  drag = null,
  edit = null;
const group = () => state.groups[state.active];
function checkpoint(key = "") {
  const now = Date.now();
  if (!key || key !== lastKey || now - lastTime > 700) {
    undo.push(JSON.stringify(state));
    if (undo.length > 65) undo.shift();
  }
  redo = [];
  lastTime = now;
  lastKey = key;
}
function notify(s) {
  const t = $("#toast");
  if ($("#dialog").open) $("#dialog").append(t);
  else document.body.append(t);
  t.textContent = s;
  t.hidden = false;
  clearTimeout(timer);
  timer = setTimeout(() => (t.hidden = true), 2600);
}
function theme() {
  document.documentElement.toggleAttribute("data-dark", state.theme === "Dark");
  const themeButton = $('[data-act="theme"]');
  themeButton.querySelector("use").setAttribute(
    "href",
    state.theme === "Dark" ? "#icon-moon" : "#icon-sun",
  );
  $("#themeLabel").textContent = state.theme;
  const nextTheme = state.theme === "Dark" ? "Light" : "Dark";
  themeButton.setAttribute("aria-label", "Switch to " + nextTheme + " theme");
  themeButton.title = "Switch to " + nextTheme + " theme";
}
function render() {
  theme();
  const g = group();
  const activeGroups = state.multi ? state.groups : [state.groups[0]];
  let remaining = 250;
  sets = activeGroups.map((g) => {
    const r = rowsFor(g, remaining);
    remaining -= r.colors.length;
    return r;
  });
  for (const [id, val] of Object.entries({
    raw: g.raw,
    format: g.format,
    sep: g.sep,
    custom: g.custom,
    layout: state.layout,
  }))
    if ($("#" + id).value !== val) $("#" + id).value = val;
  $("#custom").hidden = g.sep !== "Custom";
  const examples = ["#D95D39", "#437F78"]
    .map((c) => (g.format === "Auto" ? c : value(parse(c), g.format)))
    .join(g.sep === "Custom" ? g.custom : separators[g.sep]);
  $("#raw").placeholder = "Paste or type colors, e.g. " + examples;
  $("#example").textContent = "Example · " + examples.replaceAll("\n", " ↵ ");
  const fan = sets[state.active].colors;
  $$(".chip").forEach((chip, i) => {
    chip.style.setProperty(
      "--c",
      fan.length ? hex(fan[(5 - i) % fan.length].c) : "var(--line)",
    );
  });
  const current = sets[state.active];
  $("#count").textContent = current.colors.length + " / 250 colors";
  $("#validation").textContent = [
    g.sep === "Custom" && !g.custom ? "Enter your custom separator." : "",
    current.invalid.length
      ? "Unrecognized: " +
        current.invalid
          .slice(0, 3)
          .map((x) => x.slice(0, 45))
          .join(", ") +
        (current.invalid.length > 3 ? " …" : "")
      : "",
    sets.some((r) => r.total > r.colors.length)
      ? "Showing the first 250 colors across visible groups."
      : "",
  ]
    .filter(Boolean)
    .join(" ");
  for (const [key, flag] of Object.entries({
    single: !state.multi,
    multi: state.multi,
    interactive: state.interactive,
    visual: !state.interactive,
  }))
    $('[data-act="' + key + '"]').setAttribute("aria-pressed", flag);
  $("[data-act=undo]").disabled = !undo.length;
  $("[data-act=redo]").disabled = !redo.length;
  $("#groups").innerHTML = state.multi
    ? state.groups
        .map(
          (g, i) =>
            '<button data-group="' +
            i +
            '" aria-pressed="' +
            (state.active === i) +
            '">Group ' +
            (i + 1) +
            "</button>",
        )
        .join("") +
      (state.groups.length < 4
        ? '<button data-act="add">' + icon("plus") + "Add group</button>"
        : "")
    : "";
  $("#previews").className = state.multi ? "multi" : "";
  $("#previews").innerHTML = sets
    .map(
      (_, i) =>
        "<div>" +
        (state.multi
          ? '<div class="grouphead">Group ' + (i + 1) + "</div>"
          : "") +
        '<div class="board" data-board="' +
        i +
        '"></div></div>',
    )
    .join("");
  draw();
  $("#hint").textContent = state.interactive
    ? "Select a swatch to inspect or edit"
    : "Colors only";
  try {
    localStorage.setItem(storage, JSON.stringify(state));
  } catch {
    /* Storage may be unavailable in private windows. */
  }
}
function draw() {
  const bg = getComputedStyle(document.documentElement)
    .getPropertyValue("--paper")
    .trim();
  $$(".board").forEach((board, i) => {
    const w = Math.max(240, Math.round(board.clientWidth));
    board.innerHTML =
      picture(
        sets[i].colors,
        state,
        w,
        bg,
        undefined,
        document.fullscreenElement && !state.multi
          ? window.innerHeight - 130
          : 0,
      ) || '<p class="empty">Paste colors above to see your palette.</p>';
  });
}
function commitRows(rows, g = group()) {
  const sep = g.sep === "Custom" ? g.custom || ", " : separators[g.sep];
  const { invalid } = parseInput(g.raw, g.format, g.sep, g.custom);
  g.raw = [...rows.map((r) => r.token), ...invalid].join(sep);
  g.names = rows.map((r) => r.name || "");
  g.shift = 0;
}
function editableRows(i = state.active) {
  return rowsFor(state.groups[i], Infinity).colors.map((r) => ({
    ...r,
    token: state.groups[i].shift ? value(r.c, r.type) : r.token,
  }));
}
function modal(title, html) {
  $("#dialog").classList.toggle("guide-dialog", title === "Workspace guide");
  $("#dialogTitle").textContent = title;
  $("#dialogBody").innerHTML = html;
  const d = $("#dialog");
  if (!d.open) {
    (document.fullscreenElement || document.body).append(d);
    d.showModal();
  }
}
window.addEventListener("hashchange", () => {
  if (!location.hash.startsWith("#palette=")) return;
  try {
    const data = JSON.parse(decodeURIComponent(location.hash.slice(9)));
    modify(() => (state = restore(data)));
    history.replaceState(null, "", location.pathname + location.search);
  } catch {
    notify("Could not restore this palette link.");
  }
});
function close() {
  if ($("#dialog").open) $("#dialog").close();
}
function selectField(label, id, items, sel) {
  return (
    "<label>" +
    label +
    '<select id="' +
    id +
    '">' +
    options(items, sel) +
    "</select></label>"
  );
}
function modify(fn) {
  checkpoint();
  fn();
  render();
}
function adjust() {
  modal(
    "Visualization settings",
    selectField(
      "Swatch labels",
      "labelMode",
      ["Custom Labels", "Hidden"],
      state.hideLabels ? "Hidden" : "Custom Labels",
    ) +
      '<fieldset class="label-fields" id="labelFields"><legend class="sr-only">Visible color values</legend>' +
      labelFields
        .map(
          (f) =>
            `<label><input type="checkbox" data-label="${f}" ${state.labels.includes(f) ? "checked" : ""}>${f === "Name" ? "Color name" : f}</label>`,
        )
        .join("") +
      "</fieldset>" +
      '<label>Hue shift <span id="degrees">' +
      group().shift +
      '°</span><input id="shift" type="range" min="-180" max="180" value="' +
      group().shift +
      '"></label><div class="row wrap"><button data-act="resetShift">Reset hue</button><button data-sort="Reverse">Reverse order</button></div><p>Sort the active group</p><div class="row wrap">' +
      ["Hue", "Brightness", "Saturation"]
        .map((x) => '<button data-sort="' + x + '">' + x + "</button>")
        .join("") +
      "</div>" +
      selectField(
        "Copy and text export format",
        "output",
        ["Original", ...formats],
        state.output,
      ) +
      selectField(
        "Output separator",
        "outSep",
        [...Object.keys(separators).filter((s) => s !== "Auto"), "Custom"],
        state.outSep,
      ) +
      '<label id="customOutLabel">Custom output separator<input id="outCustom" maxlength="12"></label>',
  );
  if (state.multi && state.groups.length > 1)
    $("#dialogBody").insertAdjacentHTML(
      "beforeend",
      '<button data-act="removeGroup">Remove active group</button>',
    );
  $("#labelFields").hidden = state.hideLabels;
  $("#outCustom").value = state.outCustom;
  $("#customOutLabel").hidden = state.outSep !== "Custom";
}
function openColor(gi, i) {
  const r = sets[gi].colors[i];
  edit = { gi, i, c: r.c, name: r.name };
  const v = hsv(r.c);
  modal(
    "Edit swatch",
    '<div class="sv" id="sv" aria-label="Saturation and brightness picker"><i></i></div><label>Hue<input class="hue" id="pickHue" type="range" min="0" max="360" value="' +
      (v.h || 0) +
      '"></label><div class="fieldgrid">' +
      ["Saturation", "Brightness", "Opacity"]
        .map(
          (k, j) =>
            "<label>" +
            k +
            '<input type="range" id="pick' +
            k +
            '" min="0" max="100" value="' +
            Math.round([v.s, v.v, v.alpha ?? 1][j] * 100) +
            '"></label>',
        )
        .join("") +
      '</div><label>Name<input id="pickName" maxlength="80" placeholder="' +
      esc(colorName(r.c)) +
      '" value="' +
      esc(r.name) +
      '"></label><label>Color value<input id="pickValue" value="' +
      hex(r.c) +
      '"></label><div class="fields" id="values"></div><div class="row wrap"><button data-act="earlier">Move earlier</button><button data-act="later">Move later</button><button class="primary" data-act="apply">Apply</button></div>',
  );
  paintPicker(false);
}
function paintPicker(updateValue = true) {
  const h = Number($("#pickHue").value),
    s = Number($("#pickSaturation").value),
    v = Number($("#pickBrightness").value);
  $("#sv").style.setProperty("--hue", "hsl(" + h + " 100% 50%)");
  $("#sv i").style.left = s + "%";
  $("#sv i").style.top = 100 - v + "%";
  if (updateValue) $("#pickValue").value = hex(edit.c);
  $("#pickName").placeholder = colorName(edit.c);
  $("#values").innerHTML = ["Name", ...formats]
    .map(
      (f) =>
        '<div class="valrow"><span>' +
        esc(
          f === "Name"
            ? $("#pickName").value || colorName(edit.c)
            : value(edit.c, f),
        ) +
        '</span><button data-copyvalue="' +
        f +
        '" aria-label="Copy ' +
        f +
        '">' +
        icon("copy") +
        "</button></div>",
    )
    .join("");
}
function pickerChanged() {
  edit.c = {
    mode: "hsv",
    h: +$("#pickHue").value,
    s: +$("#pickSaturation").value / 100,
    v: +$("#pickBrightness").value / 100,
    alpha: +$("#pickOpacity").value / 100,
  };
  paintPicker();
}
function applyEdit(move = 0) {
  const input = parseInput($("#pickValue").value);
  if (input.colors.length !== 1 || input.invalid.length) {
    notify("Enter one valid color value.");
    return;
  }
  const { gi, i } = edit,
    rows = editableRows(gi),
    row = rows[i],
    target = i + move;
  if (target < 0 || target >= rows.length) {
    notify("Already at the end of this group.");
    return;
  }
  checkpoint();
  row.c = edit.c;
  row.token = value(row.c, row.type);
  row.name = $("#pickName").value.trim();
  if (move) {
    rows.splice(i, 1);
    rows.splice(target, 0, row);
  }
  commitRows(rows, state.groups[gi]);
  render();
  close();
}
async function copy(s, feedback) {
  try {
    await navigator.clipboard.writeText(s);
    notify(feedback);
  } catch {
    modal("Copy manually", '<textarea id="manual" readonly></textarea>');
    $("#manual").value = s;
    $("#manual").select();
  }
}
function download(blob, file) {
  const a = document.createElement("a");
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = file;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function outputRows() {
  return sets[state.active].colors.map((r) => ({
    ...r,
    token: group().shift ? value(r.c, r.type) : r.token,
  }));
}
function bulk(rows) {
  return serialize(
    rows,
    state.output,
    state.outSep === "Custom" ? state.outCustom : separators[state.outSep],
  );
}
async function exportFile(ext) {
  const rows = outputRows();
  if (!rows.length) {
    notify("Add colors to export.");
    return;
  }
  let content, mime;
  if (["PNG", "SVG"].includes(ext)) {
    const svg = $('[data-board="' + state.active + '"] svg');
    content = await artworkMarkup(svg);
    mime = "image/svg+xml";
    if (ext === "PNG") {
      const img = new Image(),
        url = URL.createObjectURL(new Blob([content], { type: mime }));
      try {
        img.src = url;
        await img.decode();
        const canvas = document.createElement("canvas");
        canvas.width = svg.width.baseVal.value;
        canvas.height = svg.height.baseVal.value;
        canvas.getContext("2d").drawImage(img, 0, 0);
        const blob = await new Promise((r) => canvas.toBlob(r));
        if (!blob) throw Error();
        download(blob, "palette.png");
      } catch {
        notify("PNG export failed. Try SVG.");
        return;
      } finally {
        URL.revokeObjectURL(url);
      }
    }
  } else if (ext === "CSS") {
    content =
      ":root {\n" +
      rows
        .map((r, i) => "  --color-" + (i + 1) + ": " + value(r.c, r.type) + ";")
        .join("\n") +
      "\n}";
    mime = "text/css";
  } else if (ext === "JSON") {
    content = JSON.stringify(
      rows.map((r) => ({
        name: r.name || colorName(r.c),
        value: value(r.c, r.type),
        hex: hex(r.c),
      })),
      null,
      2,
    );
    mime = "application/json";
  } else {
    content = bulk(rows);
    mime = "text/plain";
  }
  if (ext !== "PNG")
    download(
      new Blob([content], { type: mime }),
      "palette." + ext.toLowerCase(),
    );
  close();
  notify(ext + " exported");
}
function travel(back) {
  const from = back ? undo : redo,
    to = back ? redo : undo;
  if (!from.length) return;
  to.push(JSON.stringify(state));
  const theme = state.theme;
  state = restore(JSON.parse(from.pop()));
  state.theme = theme;
  lastKey = "";
  render();
}
async function act(a) {
  if (a === "close") {
    close();
    return;
  }
  if (a === "single" || a === "multi") {
    if (state.multi === (a === "multi")) return;
    modify(() => {
      state.multi = a === "multi";
      state.active = 0;
      if (state.multi && state.groups.length === 1)
        state.groups.push(makeGroup(sample("Ocean Study")));
    });
    return;
  }
  if (a === "interactive" || a === "visual") {
    modify(() => (state.interactive = a === "interactive"));
    return;
  }
  if (a === "undo" || a === "redo") {
    travel(a === "undo");
    return;
  }
  if (a === "theme") {
    state.theme = state.theme === "Dark" ? "Light" : "Dark";
    try {
      localStorage.setItem("multihex-theme", state.theme);
    } catch {}
    render();
    return;
  }
  if (a === "guide") {
    modal("Workspace guide", $("#guideTemplate").innerHTML);
    return;
  }
  if (a === "add") {
    if (state.groups.length < 4)
      modify(() => {
        state.groups.push(makeGroup());
        state.active = state.groups.length - 1;
      });
    return;
  }
  if (a === "removeGroup") {
    if (state.multi && state.groups.length > 1) {
      modify(() => {
        state.groups.splice(state.active, 1);
        state.active = Math.min(state.active, state.groups.length - 1);
      });
      close();
      notify("Group removed · Undo available");
    }
    return;
  }
  if (a === "clear") {
    modify(() => Object.assign(group(), { raw: "", names: [], shift: 0 }));
    $("#raw").focus();
    return;
  }
  if (a === "samples") {
    modal(
      "Load a sample",
      Object.entries(presets)
        .map(
          ([name, colors]) =>
            '<button class="preset" data-preset="' +
            name +
            '">' +
            name +
            '<span class="strip">' +
            colors.map((c) => '<i style="background:' + c + '"></i>').join("") +
            "</span></button>",
        )
        .join(""),
    );
    return;
  }
  if (a === "adjust") {
    adjust();
    return;
  }
  if (a === "resetShift") {
    modify(() => (group().shift = 0));
    adjust();
    return;
  }
  if (a === "apply" || a === "earlier" || a === "later") {
    applyEdit(a === "earlier" ? -1 : a === "later" ? 1 : 0);
    return;
  }
  if (a === "fullscreen") {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await $("#previewPanel").requestFullscreen();
    } catch {
      notify("Fullscreen is unavailable in this browser.");
    }
    return;
  }
  if (a === "copy") {
    const r = outputRows();
    if (r.length) await copy(bulk(r), "Copied " + r.length + " colors");
    else notify("Add colors to copy.");
    return;
  }
  if (a === "share") {
    const url =
      location.origin +
      location.pathname +
      "#palette=" +
      encodeURIComponent(JSON.stringify(state));
    if (url.length > 16000) {
      modal(
        "Workspace is too large to link",
        '<p>Save a workspace file to share all groups and settings.</p><button data-act="saveWorkspace">Download workspace</button>',
      );
      return;
    }
    await copy(url, "Workspace link copied");
    return;
  }
  if (a === "saveWorkspace") {
    download(
      new Blob([JSON.stringify(state)], { type: "application/json" }),
      "workspace.json",
    );
    close();
    return;
  }
  if (a === "export") {
    modal(
      "Export palette",
      '<p>Export the active group or save its current preview.</p><div class="row wrap">' +
        ["PNG", "SVG", "CSS", "JSON", "TXT"]
          .map((f) => '<button data-export="' + f + '">' + f + "</button>")
          .join("") +
        '</div><label>Restore a workspace file<input type="file" id="restore" accept=".json,application/json"></label>',
    );
    return;
  }
}
document.addEventListener("click", (e) => {
  const t = e.target.closest("button,[data-index]");
  if (!t) return;
  const d = t.dataset;
  if (d.act) act(d.act);
  else if (d.index !== undefined && state.interactive)
    openColor(+t.closest(".board").dataset.board, +d.index);
  else if (d.group !== undefined) {
    state.active = +d.group;
    render();
  } else if (d.preset) {
    modify(() => {
      const g = group();
      g.raw = presets[d.preset]
        .map((c) => (g.format === "Auto" ? c : value(parse(c), g.format)))
        .join(g.sep === "Custom" ? g.custom || ", " : separators[g.sep]);
      g.names = [];
      g.shift = 0;
    });
    close();
  } else if (d.sort) {
    modify(() => commitRows(ordered(editableRows(), d.sort)));
    close();
  } else if (d.export) exportFile(d.export);
  else if (d.copyvalue)
    copy(
      d.copyvalue === "Name"
        ? $("#pickName").value || colorName(edit.c)
        : value(edit.c, d.copyvalue),
      "Copied " + d.copyvalue,
    );
});
document.addEventListener("input", (e) => {
  const { id, value: v } = e.target;
  if (id === "raw" || id === "custom") {
    checkpoint(id + state.active);
    if (id === "raw") {
      const before = editableRows(),
        named = new Map();
      for (const r of before) {
        const k = hex(r.c);
        if (!named.has(k)) named.set(k, []);
        named.get(k).push(r.name);
      }
      group().raw = v;
      group().shift = 0;
      group().names = parseInput(
        v,
        group().format,
        group().sep,
        group().custom,
      ).colors.map((r) => named.get(hex(r.c))?.shift() || "");
    } else group().custom = v;
    render();
  } else if (id === "shift") {
    checkpoint("shift");
    group().shift = +v;
    $("#degrees").textContent = v + "°";
    render();
  } else if (id === "outCustom") {
    state.outCustom = v;
    render();
  } else if (
    ["pickHue", "pickBrightness", "pickSaturation", "pickOpacity"].includes(id)
  )
    pickerChanged();
  else if (id === "pickName") paintPicker(false);
  else if (id === "pickValue") {
    const r = parseInput(v);
    if (r.colors.length === 1 && !r.invalid.length) {
      edit.c = r.colors[0].c;
      const c = hsv(edit.c);
      for (const [k, n] of Object.entries({
        Hue: c.h || 0,
        Saturation: c.s * 100,
        Brightness: c.v * 100,
        Opacity: (c.alpha ?? 1) * 100,
      }))
        $("#pick" + k).value = n;
      paintPicker(false);
    }
  }
});
document.addEventListener("change", async (e) => {
  const { id, value: v } = e.target;
  if (id === "format" || id === "sep") {
    modify(() => (group()[id] = v));
  }
  if (id === "labelMode") {
    modify(() => (state.hideLabels = v === "Hidden"));
    $("#labelFields").hidden = state.hideLabels;
  }
  if (e.target.dataset.label)
    modify(
      () =>
        (state.labels = $$("#labelFields input:checked").map(
          (input) => input.dataset.label,
        )),
    );
  if (["layout", "output", "outSep"].includes(id)) {
    modify(() => (state[id] = v));
    if (id === "outSep") $("#customOutLabel").hidden = v !== "Custom";
  }
  if (id === "restore") {
    try {
      const data = JSON.parse(await e.target.files[0].text());
      if (!Array.isArray(data.groups)) throw Error();
      modify(() => (state = restore(data)));
      close();
      notify("Workspace restored");
    } catch {
      notify("Choose a valid workspace JSON file.");
    }
  }
});
document.addEventListener("keydown", (e) => {
  if ($("#dialog").open) return;
  if ((e.ctrlKey || e.metaKey) && ["z", "y"].includes(e.key.toLowerCase())) {
    e.preventDefault();
    travel(!e.shiftKey && e.key.toLowerCase() === "z");
  }
  if (["Enter", " "].includes(e.key) && e.target.hasAttribute("data-index")) {
    e.preventDefault();
    openColor(
      +e.target.closest(".board").dataset.board,
      +e.target.dataset.index,
    );
  }
});
function pickAt(e) {
  const box = $("#sv").getBoundingClientRect(),
    clamp = (x) => Math.min(1, Math.max(0, x));
  $("#pickSaturation").value = clamp((e.clientX - box.x) / box.width) * 100;
  $("#pickBrightness").value =
    (1 - clamp((e.clientY - box.y) / box.height)) * 100;
  pickerChanged();
}
document.addEventListener("pointerdown", (e) => {
  if (e.target.closest("#sv")) {
    e.preventDefault();
    $("#sv").setPointerCapture(e.pointerId);
    pickAt(e);
    return;
  }
  const tile = e.target.closest("[data-index]");
  if (tile)
    drag = {
      el: tile,
      x: e.clientX,
      y: e.clientY,
      gi: +tile.closest(".board").dataset.board,
      i: +tile.dataset.index,
    };
});
document.addEventListener("pointermove", (e) => {
  if ($("#sv")?.hasPointerCapture(e.pointerId)) pickAt(e);
});
document.addEventListener("pointercancel", () => (drag = null));
document.addEventListener("pointerup", (e) => {
  if (!drag) return;
  const start = drag;
  drag = null;
  if (Math.hypot(e.clientX - start.x, e.clientY - start.y) < 6) return;
  const tile = document
    .elementFromPoint(e.clientX, e.clientY)
    ?.closest("[data-index]");
  if (
    !tile ||
    +tile.closest(".board").dataset.board !== start.gi ||
    +tile.dataset.index === start.i
  )
    return;
  modify(() => {
    const rows = editableRows(start.gi);
    rows.splice(+tile.dataset.index, 0, rows.splice(start.i, 1)[0]);
    commitRows(rows, state.groups[start.gi]);
  });
});
$("#dialog").addEventListener("close", () => {
  document.body.append($("#toast"));
  document.body.append($("#dialog"));
  edit = null;
});
$("#dialog").addEventListener("click", (e) => {
  if (e.target === $("#dialog")) {
    const b = e.target.getBoundingClientRect();
    if (
      e.clientX < b.left ||
      e.clientX > b.right ||
      e.clientY < b.top ||
      e.clientY > b.bottom
    )
      close();
  }
});
let frame;
window.addEventListener("resize", () => {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(draw);
});
document.addEventListener("fullscreenchange", draw);
render();
if (loadMessage) notify(loadMessage);
