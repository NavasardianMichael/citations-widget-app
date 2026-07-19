/** Convert `rgba(r,g,b,a)` or `#RRGGBB` to `#AARRGGBB` for SwiftUI modifiers. */
export function toArgbHex(color: string): string {
  const rgba = color.match(
    /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\s*\)$/i,
  );
  if (rgba) {
    const r = Number(rgba[1]);
    const g = Number(rgba[2]);
    const b = Number(rgba[3]);
    const a = Math.round(Math.min(1, Math.max(0, Number(rgba[4]))) * 255);
    return `#${toHex(a)}${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
  if (/^#[0-9a-fA-F]{6}$/.test(color)) return `#FF${color.slice(1)}`;
  if (/^#[0-9a-fA-F]{8}$/.test(color)) return color;
  return color;
}

function toHex(n: number) {
  return Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0").toUpperCase();
}
