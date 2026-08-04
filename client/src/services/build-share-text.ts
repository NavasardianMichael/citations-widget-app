export function buildShareText(
  text: string,
  source?: string | null,
): string | null {
  const quote = text.trim()
  if (!quote) return null

  const sourceLine = source?.trim()
  const body = sourceLine ? `${quote}\n\n— ${sourceLine}` : quote

  return body
}
