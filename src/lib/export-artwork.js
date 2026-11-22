import sansUrl from "@fontsource-variable/geist/files/geist-latin-wght-normal.woff2?url";
import monoUrl from "@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2?url";

async function embeddedFace(family, url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Font unavailable");
  const bytes = new Uint8Array(await response.arrayBuffer());
  const base64 = btoa(
    Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""),
  );
  return `@font-face{font-family:'${family}';font-weight:100 900;src:url(data:font/woff2;base64,${base64}) format('woff2')}`;
}

export async function artworkMarkup(svg) {
  const artwork = svg.cloneNode(true);
  artwork.querySelectorAll(".edit-cue").forEach((cue) => cue.remove());
  const families = new Set(
    Array.from(
      artwork.querySelectorAll("text"),
      (node) => node.getAttribute("font-family")?.split(",")[0],
    ),
  );
  const styles = await Promise.allSettled(
    [
      ["Geist", sansUrl],
      ["Geist Mono", monoUrl],
    ]
      .filter(([family]) => families.has(family))
      .map(([family, url]) => embeddedFace(family, url)),
  );
  const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
  style.textContent = styles
    .filter((item) => item.status === "fulfilled")
    .map((item) => item.value)
    .join("\n");
  if (style.textContent) artwork.prepend(style);
  return new XMLSerializer().serializeToString(artwork);
}
