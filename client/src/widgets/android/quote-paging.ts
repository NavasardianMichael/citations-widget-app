import { getQuoteLineHeight, WIDGET_LAYOUT } from "@/constants/widget-layout";

/** Compact page-control column beside the quote. */
export const QUOTE_PAGE_ARROW_SIZE = 32;
export const QUOTE_PAGE_ARROW_ICON_SIZE = 20;

export type QuotePagingInput = {
  text: string;
  widgetWidth: number;
  widgetHeight: number;
  fontSize: number;
  showOrnament: boolean;
  showLargeQuotes: boolean;
  hasSource: boolean;
  showActions: boolean;
  actionRowCount: number;
  hasAttribution: boolean;
  /** Reserve trailing width for the arrow column. */
  reserveArrowColumn: boolean;
};

export type QuotePagingResult = {
  pages: string[];
  linesPerPage: number;
  pageCount: number;
};

/** Rough average glyph width for Armenian/Latin at this size (dp). */
function avgCharWidth(fontSize: number): number {
  return fontSize * 0.55;
}

export function wrapTextToLines(text: string, maxChars: number): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];
  if (maxChars < 4) return [normalized];

  const words = normalized.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (!current) {
      if (word.length <= maxChars) {
        current = word;
      } else {
        for (let i = 0; i < word.length; i += maxChars) {
          lines.push(word.slice(i, i + maxChars));
        }
        current = "";
      }
      continue;
    }

    const next = `${current} ${word}`;
    if (next.length <= maxChars) {
      current = next;
    } else {
      lines.push(current);
      if (word.length <= maxChars) {
        current = word;
      } else {
        for (let i = 0; i < word.length; i += maxChars) {
          const piece = word.slice(i, i + maxChars);
          if (i + maxChars < word.length) lines.push(piece);
          else current = piece;
        }
      }
    }
  }
  if (current) lines.push(current);
  return lines;
}

function chunkLines(lines: string[], linesPerPage: number): string[] {
  if (lines.length === 0) return [""];
  const per = Math.max(1, linesPerPage);
  const pages: string[] = [];
  for (let i = 0; i < lines.length; i += per) {
    pages.push(lines.slice(i, i + per).join("\n"));
  }
  return pages;
}

/**
 * Estimate how many quote lines fit and paginate the text.
 * Source / actions / attribution stay outside the paged area.
 */
export function computeQuotePages(input: QuotePagingInput): QuotePagingResult {
  const lineHeight = getQuoteLineHeight(input.fontSize);
  let used = WIDGET_LAYOUT.padding * 2 + WIDGET_LAYOUT.sectionGap;

  if (input.showOrnament) {
    used += WIDGET_LAYOUT.ornamentIconSize + 4;
  }
  if (input.showLargeQuotes) {
    // TextWidget uses lineHeight = fontSize and marginBottom: -8.
    used += Math.max(0, WIDGET_LAYOUT.largeQuoteFontSize - 8);
  }
  if (input.hasSource) {
    used += WIDGET_LAYOUT.quoteSourceGap + lineHeight;
  }
  if (input.showActions && input.actionRowCount > 0) {
    used +=
      input.actionRowCount * WIDGET_LAYOUT.actionSize +
      Math.max(0, input.actionRowCount - 1) * WIDGET_LAYOUT.sourceActionsGap;
  }
  if (input.hasAttribution) {
    used +=
      (input.showActions ? WIDGET_LAYOUT.metaBlockGap : 0) +
      WIDGET_LAYOUT.attributionLineHeight;
  }

  const available = Math.max(lineHeight, input.widgetHeight - used);
  const linesPerPage = Math.max(1, Math.floor(available / lineHeight));

  let textWidth = input.widgetWidth - WIDGET_LAYOUT.padding * 2;
  if (input.reserveArrowColumn) {
    textWidth -= QUOTE_PAGE_ARROW_SIZE + WIDGET_LAYOUT.actionGap;
  }
  textWidth = Math.max(40, textWidth);

  const maxChars = Math.max(
    8,
    Math.floor(textWidth / avgCharWidth(input.fontSize)),
  );
  const lines = wrapTextToLines(input.text, maxChars);
  const pages = chunkLines(lines, linesPerPage);

  return {
    pages,
    linesPerPage,
    pageCount: pages.length,
  };
}

/** Clamp page index; returns 0 for empty/invalid. */
export function clampQuotePageIndex(index: number, pageCount: number): number {
  if (pageCount <= 0) return 0;
  if (!Number.isFinite(index) || index < 0) return 0;
  return Math.min(Math.floor(index), pageCount - 1);
}
