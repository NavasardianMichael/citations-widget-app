import { t } from "@/i18n";

const NAME_MARKER = "\u0001";

/** Split `settings.addedBy` around `{name}` so the name can be styled/linked alone. */
export function splitAddedByLabel(name: string): {
  before: string;
  after: string;
  full: string;
} {
  const templated = t("settings.addedBy", { name: NAME_MARKER });
  const idx = templated.indexOf(NAME_MARKER);
  if (idx < 0) {
    return { before: "", after: "", full: t("settings.addedBy", { name }) };
  }
  return {
    before: templated.slice(0, idx),
    after: templated.slice(idx + NAME_MARKER.length),
    full: t("settings.addedBy", { name }),
  };
}

/**
 * Prefer structured `addedByUrl`; peel legacy `"Name · https://…"` from `addedBy`
 * so older cached widget payloads still render correctly.
 */
export function resolveAttributionParts(
  addedBy: string | null | undefined,
  addedByUrl?: string | null,
): { name: string | null; url: string | null } {
  const raw = addedBy?.trim() || "";
  if (!raw) return { name: null, url: null };
  const explicitUrl = addedByUrl?.trim() || null;
  if (explicitUrl) return { name: raw, url: explicitUrl };
  const sep = " · ";
  const sepAt = raw.lastIndexOf(sep);
  if (sepAt > 0) {
    const maybeUrl = raw.slice(sepAt + sep.length).trim();
    if (/^https?:\/\//i.test(maybeUrl)) {
      return { name: raw.slice(0, sepAt).trim() || null, url: maybeUrl };
    }
  }
  return { name: raw, url: null };
}
