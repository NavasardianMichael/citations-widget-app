import {
  FlexWidget,
  IconWidget,
  ImageWidget,
  OverlapWidget,
  SvgWidget,
  TextWidget,
} from "react-native-android-widget";
import type { ColorProp } from "react-native-android-widget";

import { resolveWidgetBackgroundImage } from "@/constants/widget-designs";
import {
  colorWithOpacity,
  getQuoteLineHeight,
  WIDGET_ICON_FONT_FAMILY,
  WIDGET_ICON_GLYPH,
  WIDGET_LAYOUT,
  WIDGET_QUOTE_FONT_WEIGHT,
  WIDGET_SOURCE_FONT_WEIGHT,
} from "@/constants/widget-layout";
import type { HomeWidgetSnapshot } from "@/widgets/types";

type Props = {
  snapshot: HomeWidgetSnapshot;
  width: number;
  height: number;
};

function asColor(value: string): ColorProp {
  return value as ColorProp;
}

/** Plain-text body for the system share sheet (no app UI). */
function buildShareText(snapshot: HomeWidgetSnapshot): string | null {
  const text = snapshot.citationText.trim();
  if (!text) return null;
  const source = snapshot.citationSource.trim();
  return source ? `${text}\n\n— ${source}` : text;
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

function WidgetBody({
  snapshot,
  width,
}: {
  snapshot: HomeWidgetSnapshot;
  width: number;
}) {
  const isRefreshing = Boolean(snapshot.isRefreshing);
  const isSaving = Boolean(snapshot.isSaving);
  const content = isRefreshing
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
  const shareText = buildShareText(snapshot);
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
  const actionRows = chunkActions(actions, actionsPerRow(width));

  return (
    <FlexWidget
      style={{
        height: "match_parent",
        width: "match_parent",
        flexDirection: "column",
        // Two groups (top content, bottom meta/actions) pushed to opposite ends — a
        // flex:1 spacer between siblings isn't reliably honored by RemoteViews' weight
        // translation, so the action row must always sit at the bottom of the widget.
        justifyContent: "space-between",
        padding: WIDGET_LAYOUT.padding,
      }}
    >
      <FlexWidget style={{ width: "match_parent", flexDirection: "column" }}>
        {snapshot.showOrnament ? (
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

        <TextWidget
          text={content}
          maxLines={8}
          truncate="END"
          allowFontScaling={false}
          style={{
            fontSize: snapshot.fontSize,
            lineHeight: getQuoteLineHeight(snapshot.fontSize),
            color: asColor(quoteColor),
            fontFamily: snapshot.androidFontFile,
            fontWeight: WIDGET_QUOTE_FONT_WEIGHT,
            width: "match_parent",
          }}
        />

        {!isRefreshing && snapshot.sourceText ? (
          <TextWidget
            text={snapshot.sourceText}
            maxLines={2}
            truncate="END"
            allowFontScaling={false}
            style={{
              fontSize: snapshot.fontSize,
              lineHeight: getQuoteLineHeight(snapshot.fontSize),
              color: asColor(snapshot.metaColor),
              fontFamily: snapshot.androidFontFile,
              fontWeight: WIDGET_SOURCE_FONT_WEIGHT,
              width: "match_parent",
              marginTop: WIDGET_LAYOUT.metaBlockGap,
            }}
          />
        ) : null}
      </FlexWidget>

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

        {!isRefreshing && snapshot.attributionText ? (
          <TextWidget
            text={snapshot.attributionText}
            maxLines={1}
            truncate="END"
            allowFontScaling={false}
            style={{
              fontSize: WIDGET_LAYOUT.attributionFontSize,
              lineHeight: WIDGET_LAYOUT.attributionLineHeight,
              color: asColor(snapshot.attributionColor),
              fontFamily: snapshot.androidFontFile,
              width: "match_parent",
            }}
          />
        ) : null}
      </FlexWidget>
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
            backgroundColor: asColor(snapshot.overlayColor),
          }}
        >
          <WidgetBody snapshot={snapshot} width={width} />
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
      <WidgetBody snapshot={snapshot} width={width} />
    </FlexWidget>
  );
}
