import { getQuoteLineHeight, WIDGET_LAYOUT } from "@/constants/widget-layout";

/** Compact page-control column beside the quote. */
export const QUOTE_PAGE_ARROW_SIZE = 32;
export const QUOTE_PAGE_ARROW_ICON_SIZE = 20;

/** Up + gap + "n/m" + gap + down — quote should fill at least this when paging. */
const ARROW_COLUMN_HEIGHT =
  QUOTE_PAGE_ARROW_SIZE + 6 + 14 + 6 + QUOTE_PAGE_ARROW_SIZE;

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
};

export type QuotePagingResult = {
  pages: string[];
  linesPerPage: number;
  pageCount: number;
};

/**
 * Average glyph width factor for wrap *budgeting* (page splits only).
 * Display wrapping is done by TextWidget at the real view width — we must not
 * inject `\n` or lines stay short while empty space remains on the right.
 * ~0.5 matches Armenian UI fonts better than 0.72 (which forced 2–3 words/line).
 */
function avgCharWidth(fontSize: number): number {
  return fontSize * 0.5;
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

function estimateChromeHeight(
  input: QuotePagingInput,
  lineHeight: number,
): number {
  // Padding only — do not add sectionGap: justifyContent space-between already
  // separates the top quote block from bottom actions, and counting it here
  // made linesPerPage collapse to 1 on typical 4×4 sizes.
  let used = WIDGET_LAYOUT.padding * 2;

  if (input.showOrnament) {
    used += WIDGET_LAYOUT.ornamentIconSize + 4;
  }
  if (input.showLargeQuotes) {
    used += Math.max(0, WIDGET_LAYOUT.largeQuoteFontSize - 8);
  }
  if (input.hasSource) {
    // Source allows maxLines={2}; reserve one line (common) + gap.
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

  // Small RemoteViews / launcher inset fudge — keep tiny so we actually fill.
  used += 8;
  return used;
}

function quoteTextWidth(widgetWidth: number, reserveArrowColumn: boolean): number {
  // Portrait often reports APPWIDGET_MIN_WIDTH, which can track minResize (~110dp)
  // after we allow shrinking. Floor helps page budgets match the drawn size.
  const layoutWidth = Math.max(widgetWidth, 250);
  let textWidth = layoutWidth - WIDGET_LAYOUT.padding * 2;
  if (reserveArrowColumn) {
    textWidth -= QUOTE_PAGE_ARROW_SIZE + WIDGET_LAYOUT.actionGap;
  }
  return Math.max(40, textWidth);
}

/**
 * Estimate how many quote lines fit and paginate the text.
 * Source / actions / attribution stay outside the paged area.
 */
export function computeQuotePages(input: QuotePagingInput): QuotePagingResult {
  const lineHeight = getQuoteLineHeight(input.fontSize);
  const chrome = estimateChromeHeight(input, lineHeight);
  const available = Math.max(lineHeight, input.widgetHeight - chrome);
  let linesPerPage = Math.max(1, Math.floor(available / lineHeight));

  let textWidth = quoteTextWidth(input.widgetWidth, false);
  let maxChars = Math.max(8, Math.floor(textWidth / avgCharWidth(input.fontSize)));

  // avgCharWidth is a rough per-font guess — RemoteViews gives us no real text
  // metrics to measure against. When the whole quote is only marginally over
  // the estimated single-page budget, greedily packing to the exact budget
  // strands a tiny trailing chunk (sometimes one word) alone on page 2, while
  // page 1 still has real spare room below it (the estimate ran conservative).
  // Give a single page some slack before committing to pagination at all.
  const normalized = input.text.replace(/\s+/g, " ").trim();
  const SINGLE_PAGE_TOLERANCE = 1.2;
  if (normalized.length <= linesPerPage * maxChars * SINGLE_PAGE_TOLERANCE) {
    return { pages: [normalized], linesPerPage, pageCount: 1 };
  }

  // Budget each page as one word-wrap pass over its *whole* character budget
  // (linesPerPage * maxChars), not linesPerPage separate per-line wraps then
  // joined. Wrapping line-by-line and re-joining with spaces throws away the
  // greedy-wrap's leftover slack once per fake line instead of once per page,
  // which under-fills a page by up to a full line and defers that text to
  // the next page even though it would have fit here.
  let pages = wrapTextToLines(input.text, linesPerPage * maxChars);

  if (pages.length > 1) {
    // Arrows appear — re-budget for the narrower column and fill at least the
    // control stack height so we don't show one lonely line beside ↑ 1/N ↓.
    textWidth = quoteTextWidth(input.widgetWidth, true);
    maxChars = Math.max(8, Math.floor(textWidth / avgCharWidth(input.fontSize)));

    const minBesideArrows = Math.max(
      2,
      Math.ceil(ARROW_COLUMN_HEIGHT / lineHeight),
    );
    linesPerPage = Math.max(linesPerPage, minBesideArrows);
    pages = wrapTextToLines(input.text, linesPerPage * maxChars);
  }

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
