import {
  FlexWidget,
  IconWidget,
  ImageWidget,
  OverlapWidget,
  SvgWidget,
  TextWidget,
} from "react-native-android-widget";
import type { ColorProp } from "react-native-android-widget";

import {
  designShowsOrnament,
  resolveWidgetBackgroundImage,
} from "@/constants/widget-designs";
import {
  colorWithOpacity,
  getQuoteLineHeight,
  WIDGET_ATTRIBUTION_NAME_FONT_WEIGHT,
  WIDGET_ICON_FONT_FAMILY,
  WIDGET_ICON_GLYPH,
  WIDGET_LAYOUT,
  WIDGET_QUOTE_FONT_WEIGHT,
  WIDGET_SOURCE_FONT_WEIGHT,
} from "@/constants/widget-layout";
import { buildShareText } from "@/services/build-share-text";
import type { HomeWidgetSnapshot } from "@/widgets/types";
import {
  clampQuotePageIndex,
  computeQuotePages,
  QUOTE_PAGE_ARROW_ICON_SIZE,
  QUOTE_PAGE_ARROW_SIZE,
} from "@/widgets/android/quote-paging";

type Props = {
  snapshot: HomeWidgetSnapshot;
  width: number;
  height: number;
};

function asColor(value: string): ColorProp {
  return value as ColorProp;
}

/**
 * Static circular spinner sized like action icons. The widget host paints to a
 * bitmap, so a ProgressBar cannot animate — this keeps chip dimensions stable.
 */
function actionSpinnerSvg(color: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="9" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="40 56"/></svg>`;
}

function ActionChip({
  icon,
  color,
  backgroundColor,
  clickAction,
  clickActionData,
  loading = false,
}: {
  icon: string;
  color: string;
  backgroundColor: string;
  clickAction?: string;
  clickActionData?: Record<string, string>;
  loading?: boolean;
}) {
  const enabled = Boolean(clickAction) && !loading;
  const iconColor = enabled ? color : colorWithOpacity(color, 0.45);

  return (
    <FlexWidget
      clickAction={enabled ? clickAction : undefined}
      clickActionData={enabled ? clickActionData : undefined}
      style={{
        height: WIDGET_LAYOUT.actionSize,
        width: WIDGET_LAYOUT.actionSize,
        borderRadius: WIDGET_LAYOUT.actionSize / 2,
        backgroundColor: asColor(backgroundColor),
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {loading ? (
        <SvgWidget
          svg={actionSpinnerSvg(iconColor)}
          style={{
            width: WIDGET_LAYOUT.actionIconSize,
            height: WIDGET_LAYOUT.actionIconSize,
          }}
        />
      ) : (
        <IconWidget
          icon={icon}
          size={WIDGET_LAYOUT.actionIconSize}
          font={WIDGET_ICON_FONT_FAMILY}
          style={{
            color: asColor(iconColor),
          }}
        />
      )}
    </FlexWidget>
  );
}

type WidgetAction = {
  id: string;
  icon: string;
  clickAction?: string;
  clickActionData?: Record<string, string>;
  loading?: boolean;
};

function actionsPerRow(widgetWidth: number): number {
  const inner = Math.max(0, widgetWidth - WIDGET_LAYOUT.padding * 2);
  const cell = WIDGET_LAYOUT.actionSize + WIDGET_LAYOUT.actionGap;
  // n * size + (n - 1) * gap <= inner  →  n <= (inner + gap) / cell
  return Math.max(1, Math.floor((inner + WIDGET_LAYOUT.actionGap) / cell));
}

function chunkActions(actions: WidgetAction[], perRow: number): WidgetAction[][] {
  const rows: WidgetAction[][] = [];
  for (let i = 0; i < actions.length; i += perRow) {
    rows.push(actions.slice(i, i + perRow));
  }
  return rows;
}

function PageArrow({
  icon,
  color,
  backgroundColor,
  clickAction,
}: {
  icon: string;
  color: string;
  backgroundColor: string;
  clickAction?: string;
}) {
  const enabled = Boolean(clickAction);
  const iconColor = enabled ? color : colorWithOpacity(color, 0.35);
  return (
    <FlexWidget
      clickAction={enabled ? clickAction : undefined}
      style={{
        height: QUOTE_PAGE_ARROW_SIZE,
        width: QUOTE_PAGE_ARROW_SIZE,
        borderRadius: QUOTE_PAGE_ARROW_SIZE / 2,
        backgroundColor: asColor(backgroundColor),
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <IconWidget
        icon={icon}
        size={QUOTE_PAGE_ARROW_ICON_SIZE}
        font={WIDGET_ICON_FONT_FAMILY}
        style={{ color: asColor(iconColor) }}
      />
    </FlexWidget>
  );
}

function WidgetBody({
  snapshot,
  width,
  height,
}: {
  snapshot: HomeWidgetSnapshot;
  width: number;
  height: number;
}) {
  const isRefreshing = Boolean(snapshot.isRefreshing);
  const isSaving = Boolean(snapshot.isSaving);
  const fullQuote = isRefreshing
    ? snapshot.loadingMessage || snapshot.emptyMessage
    : snapshot.quoteText || snapshot.emptyMessage;
  const quoteColor = isRefreshing
    ? snapshot.attributionColor
    : snapshot.quoteColor;
  const ornamentColor = colorWithOpacity(
    snapshot.ornamentColor,
    snapshot.ornamentOpacity,
  );
  const largeQuoteColor = colorWithOpacity(
    snapshot.ornamentColor,
    Math.min(1, snapshot.ornamentOpacity + 0.15),
  );
  const shareText = buildShareText(
    snapshot.citationText,
    snapshot.citationSource,
  );
  const actions: WidgetAction[] = snapshot.showActions
    ? [
        {
          id: "refresh",
          icon: WIDGET_ICON_GLYPH.refresh,
          loading: isRefreshing,
          // Only the busy action is disabled; others stay tappable.
          clickAction: isRefreshing ? undefined : "REFRESH",
        },
        {
          id: "save",
          icon: snapshot.isSaved
            ? WIDGET_ICON_GLYPH.bookmarkRemove
            : WIDGET_ICON_GLYPH.bookmarkBorder,
          loading: isSaving,
          clickAction: isSaving || !snapshot.citationId ? undefined : "TOGGLE_SAVE",
        },
        {
          id: "share",
          icon: WIDGET_ICON_GLYPH.share,
          // Native SHARE opens the system chooser without launching the app.
          clickAction: shareText ? "SHARE" : undefined,
          clickActionData: shareText ? { text: shareText } : undefined,
        },
      ]
    : [];
  const perRow = actionsPerRow(width);
  const actionRows = chunkActions(actions, perRow);
  const hasSource = !isRefreshing && Boolean(snapshot.sourceText);
  const hasAttribution = !isRefreshing && Boolean(snapshot.attributionName);

  const paging = computeQuotePages({
    text: fullQuote,
    widgetWidth: width,
    widgetHeight: height,
    fontSize: snapshot.fontSize,
    showOrnament: designShowsOrnament(snapshot.designId),
    showLargeQuotes: snapshot.showLargeQuotes,
    hasSource,
    showActions: actions.length > 0,
    actionRowCount: actionRows.length,
    hasAttribution,
  });
  const showPageControls = !isRefreshing && paging.pageCount > 1;
  const pageIndex = clampQuotePageIndex(
    snapshot.quotePageIndex ?? 0,
    paging.pageCount,
  );
  const content = showPageControls
    ? paging.pages[pageIndex] ?? fullQuote
    : fullQuote;
  const quoteLineHeight = getQuoteLineHeight(snapshot.fontSize);
  const quoteMaxLines = showPageControls
    ? paging.linesPerPage
    : Math.max(paging.linesPerPage, 8);

  return (
    <FlexWidget
      style={{
        height: "match_parent",
        width: "match_parent",
        flexDirection: "column",
        // Quote + source stay together at the top; actions/attribution pin to the
        // bottom. A flex:1 spacer between siblings isn't reliably honored by
        // RemoteViews' weight translation, so use space-between instead.
        justifyContent: "space-between",
        padding: WIDGET_LAYOUT.padding,
      }}
    >
      <FlexWidget
        style={{
          width: "match_parent",
          flexDirection: "column",
        }}
      >
        {designShowsOrnament(snapshot.designId) ? (
          <FlexWidget
            style={{
              width: "match_parent",
              flexDirection: "row",
              justifyContent: "flex-end",
              marginBottom: 4,
            }}
          >
            <IconWidget
              icon={WIDGET_ICON_GLYPH.flare}
              size={WIDGET_LAYOUT.ornamentIconSize}
              font={WIDGET_ICON_FONT_FAMILY}
              style={{ color: asColor(ornamentColor) }}
            />
          </FlexWidget>
        ) : null}

        {snapshot.showLargeQuotes ? (
          <TextWidget
            text="“"
            allowFontScaling={false}
            style={{
              fontSize: WIDGET_LAYOUT.largeQuoteFontSize,
              color: asColor(largeQuoteColor),
              fontFamily: snapshot.androidFontFile,
              lineHeight: WIDGET_LAYOUT.largeQuoteFontSize,
              marginBottom: -8,
            }}
          />
        ) : null}

        <FlexWidget
          style={{
            width: "match_parent",
            flexDirection: "column",
            flexGap: WIDGET_LAYOUT.quoteSourceGap,
          }}
        >
          <FlexWidget
            style={{
              width: "match_parent",
              flexDirection: "row",
              alignItems: "flex-start",
              flexGap: WIDGET_LAYOUT.actionGap,
            }}
          >
            {/*
              flex:1 fills leftover width from the real layout (not widgetInfo's
              often-too-small MIN_WIDTH), so wraps use the full quote column.
            */}
            <FlexWidget
              style={{
                flex: 1,
                width: 0,
                flexDirection: "column",
              }}
            >
              <TextWidget
                text={content}
                maxLines={quoteMaxLines}
                truncate="END"
                allowFontScaling={false}
                style={{
                  fontSize: snapshot.fontSize,
                  lineHeight: quoteLineHeight,
                  color: asColor(quoteColor),
                  fontFamily: snapshot.androidFontFile,
                  fontWeight: WIDGET_QUOTE_FONT_WEIGHT,
                  width: "match_parent",
                }}
              />
            </FlexWidget>
            {showPageControls ? (
              <FlexWidget
                style={{
                  flexDirection: "column",
                  flexGap: 6,
                  alignItems: "center",
                  justifyContent: "flex-start",
                }}
              >
                <PageArrow
                  icon={WIDGET_ICON_GLYPH.expandLess}
                  color={snapshot.actionIconColor}
                  backgroundColor={snapshot.actionBg}
                  clickAction={pageIndex > 0 ? "PAGE_PREV" : undefined}
                />
                <TextWidget
                  text={`${pageIndex + 1}/${paging.pageCount}`}
                  allowFontScaling={false}
                  style={{
                    fontSize: 11,
                    lineHeight: 14,
                    color: asColor(snapshot.metaColor),
                    fontFamily: snapshot.androidFontFile,
                  }}
                />
                <PageArrow
                  icon={WIDGET_ICON_GLYPH.expandMore}
                  color={snapshot.actionIconColor}
                  backgroundColor={snapshot.actionBg}
                  clickAction={
                    pageIndex < paging.pageCount - 1 ? "PAGE_NEXT" : undefined
                  }
                />
              </FlexWidget>
            ) : null}
          </FlexWidget>

          {hasSource ? (
            <TextWidget
              text={snapshot.sourceText}
              maxLines={2}
              truncate="END"
              allowFontScaling={false}
              style={{
                fontSize: snapshot.fontSize,
                lineHeight: quoteLineHeight,
                color: asColor(snapshot.metaColor),
                fontFamily: snapshot.androidFontFile,
                fontWeight: WIDGET_SOURCE_FONT_WEIGHT,
                width: "match_parent",
              }}
            />
          ) : null}
        </FlexWidget>
      </FlexWidget>

      {actionRows.length > 0 || (!isRefreshing && snapshot.attributionName) ? (
        <FlexWidget
          style={{
            width: "match_parent",
            flexDirection: "column",
            flexGap: WIDGET_LAYOUT.metaBlockGap,
            marginTop: WIDGET_LAYOUT.sectionGap,
          }}
        >
          {actionRows.length > 0 ? (
            <FlexWidget
              style={{
                width: "match_parent",
                flexDirection: "column",
                flexGap: WIDGET_LAYOUT.sourceActionsGap,
              }}
            >
              {actionRows.map((row, rowIndex) => (
                <FlexWidget
                  key={`action-row-${rowIndex}`}
                  style={{
                    width: "match_parent",
                    flexDirection: "row",
                    flexGap: WIDGET_LAYOUT.actionGap,
                    alignItems: "center",
                    justifyContent: "flex-end",
                  }}
                >
                  {row.map((action) => (
                    <ActionChip
                      key={action.id}
                      icon={action.icon}
                      color={snapshot.actionIconColor}
                      backgroundColor={snapshot.actionBg}
                      clickAction={action.clickAction}
                      clickActionData={action.clickActionData}
                      loading={action.loading}
                    />
                  ))}
                </FlexWidget>
              ))}
            </FlexWidget>
          ) : null}

          {!isRefreshing && snapshot.attributionName ? (
            <FlexWidget
              style={{
                width: "match_parent",
                flexDirection: "row",
                alignItems: "flex-end",
              }}
            >
              {snapshot.attributionBefore ? (
                <TextWidget
                  text={snapshot.attributionBefore}
                  allowFontScaling={false}
                  style={{
                    fontSize: WIDGET_LAYOUT.attributionFontSize,
                    lineHeight: WIDGET_LAYOUT.attributionLineHeight,
                    color: asColor(snapshot.attributionColor),
                    fontFamily: snapshot.androidFontFile,
                  }}
                />
              ) : null}
              {snapshot.attributionUrl ? (
                // Library TextWidget has no underline style — bottom border approximates it.
                <FlexWidget
                  clickAction="OPEN_URI"
                  clickActionData={{ uri: snapshot.attributionUrl }}
                  style={{
                    flexDirection: "row",
                    borderBottomWidth: 1,
                    borderBottomColor: asColor(snapshot.attributionColor),
                  }}
                >
                  <TextWidget
                    text={snapshot.attributionName}
                    allowFontScaling={false}
                    style={{
                      fontSize: WIDGET_LAYOUT.attributionFontSize,
                      lineHeight: WIDGET_LAYOUT.attributionLineHeight,
                      color: asColor(snapshot.attributionColor),
                      fontFamily: snapshot.androidFontFile,
                      fontWeight: WIDGET_ATTRIBUTION_NAME_FONT_WEIGHT,
                    }}
                  />
                </FlexWidget>
              ) : (
                <TextWidget
                  text={snapshot.attributionName}
                  allowFontScaling={false}
                  style={{
                    fontSize: WIDGET_LAYOUT.attributionFontSize,
                    lineHeight: WIDGET_LAYOUT.attributionLineHeight,
                    color: asColor(snapshot.attributionColor),
                    fontFamily: snapshot.androidFontFile,
                    fontWeight: WIDGET_ATTRIBUTION_NAME_FONT_WEIGHT,
                  }}
                />
              )}
              {snapshot.attributionAfter ? (
                <TextWidget
                  text={snapshot.attributionAfter}
                  allowFontScaling={false}
                  style={{
                    fontSize: WIDGET_LAYOUT.attributionFontSize,
                    lineHeight: WIDGET_LAYOUT.attributionLineHeight,
                    color: asColor(snapshot.attributionColor),
                    fontFamily: snapshot.androidFontFile,
                  }}
                />
              ) : null}
            </FlexWidget>
          ) : null}
        </FlexWidget>
      ) : null}
    </FlexWidget>
  );
}

/** Home-screen widget — layout/typography mirrors settings `WidgetPreview`. */
export function CitationAndroidWidget({ snapshot, width, height }: Props) {
  const bgImage = snapshot.hasBackgroundImage
    ? resolveWidgetBackgroundImage(snapshot.designId, snapshot.backgroundImageIndex)
    : undefined;
  const imgW = Math.max(1, Math.round(width));
  const imgH = Math.max(1, Math.round(height));

  if (typeof bgImage === "number") {
    return (
      <OverlapWidget
        clickAction="OPEN_APP"
        style={{
          height: "match_parent",
          width: "match_parent",
          borderRadius: WIDGET_LAYOUT.borderRadius,
          borderColor: asColor(snapshot.panelBorderColor),
          borderWidth: 1,
          borderLeftWidth: Math.max(snapshot.accentBorderWidth, 1),
          borderLeftColor: asColor(snapshot.accentBorderColor),
          overflow: "hidden",
        }}
      >
        <ImageWidget
          image={bgImage}
          imageWidth={imgW}
          imageHeight={imgH}
          resizeMode="cover"
          radius={WIDGET_LAYOUT.borderRadius}
          style={{
            // Pin to the same dp as the cover-cropped bitmap so FIT_XY cannot re-stretch.
            width: imgW,
            height: imgH,
          }}
        />
        <FlexWidget
          style={{
            width: "match_parent",
            height: "match_parent",
            backgroundColor: asColor(snapshot.overlayColor ?? "transparent"),
          }}
        >
          <WidgetBody snapshot={snapshot} width={width} height={height} />
        </FlexWidget>
      </OverlapWidget>
    );
  }

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: "match_parent",
        width: "match_parent",
        flexDirection: "column",
        justifyContent: "flex-start",
        backgroundColor: asColor(snapshot.panelBg),
        borderColor: asColor(snapshot.panelBorderColor),
        borderWidth: 1,
        borderLeftWidth: Math.max(snapshot.accentBorderWidth, 1),
        borderLeftColor: asColor(snapshot.accentBorderColor),
        borderRadius: WIDGET_LAYOUT.borderRadius,
      }}
    >
      <WidgetBody snapshot={snapshot} width={width} height={height} />
    </FlexWidget>
  );
}
