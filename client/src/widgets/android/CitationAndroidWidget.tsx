import {
  FlexWidget,
  IconWidget,
  ImageWidget,
  OverlapWidget,
  TextWidget,
} from "react-native-android-widget";
import type { ColorProp } from "react-native-android-widget";

import { getWidgetBackgroundImage } from "@/constants/widget-designs";
import {
  colorWithOpacity,
  getQuoteLineHeight,
  WIDGET_ICON_FONT_FAMILY,
  WIDGET_ICON_GLYPH,
  WIDGET_LAYOUT,
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

function ActionChip({
  icon,
  color,
  backgroundColor,
  clickAction,
  clickActionData,
}: {
  icon: string;
  color: string;
  backgroundColor: string;
  clickAction: string;
  clickActionData?: Record<string, string>;
}) {
  return (
    <FlexWidget
      clickAction={clickAction}
      clickActionData={clickActionData}
      style={{
        height: WIDGET_LAYOUT.actionSize,
        width: WIDGET_LAYOUT.actionSize,
        borderRadius: WIDGET_LAYOUT.actionSize / 2,
        backgroundColor: asColor(backgroundColor),
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <IconWidget
        icon={icon}
        size={WIDGET_LAYOUT.actionIconSize}
        font={WIDGET_ICON_FONT_FAMILY}
        style={{ color: asColor(color) }}
      />
    </FlexWidget>
  );
}

function WidgetBody({ snapshot }: { snapshot: HomeWidgetSnapshot }) {
  const content = snapshot.quoteText || snapshot.emptyMessage;
  const ornamentColor = colorWithOpacity(
    snapshot.ornamentColor,
    snapshot.ornamentOpacity,
  );
  const largeQuoteColor = colorWithOpacity(
    snapshot.ornamentColor,
    Math.min(1, snapshot.ornamentOpacity + 0.15),
  );

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
            color: asColor(snapshot.quoteColor),
            fontFamily: snapshot.androidFontFile,
            width: "match_parent",
          }}
        />
      </FlexWidget>

      <FlexWidget
        style={{
          width: "match_parent",
          flexDirection: "column",
          flexGap: WIDGET_LAYOUT.metaBlockGap,
          marginTop: WIDGET_LAYOUT.sectionGap,
        }}
      >
        <FlexWidget
          style={{
            width: "match_parent",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            flexGap: WIDGET_LAYOUT.actionGap,
          }}
        >
          {snapshot.sourceText ? (
            <FlexWidget style={{ flex: 1 }}>
              <TextWidget
                text={snapshot.sourceText.toUpperCase()}
                maxLines={1}
                truncate="END"
                allowFontScaling={false}
                style={{
                  fontSize: WIDGET_LAYOUT.metaFontSize,
                  lineHeight: WIDGET_LAYOUT.metaLineHeight,
                  letterSpacing: WIDGET_LAYOUT.metaLetterSpacing,
                  color: asColor(snapshot.metaColor),
                  fontFamily: snapshot.androidFontFile,
                  fontWeight: "600",
                }}
              />
            </FlexWidget>
          ) : (
            <FlexWidget style={{ flex: 1 }} />
          )}

          {snapshot.showActions ? (
            <FlexWidget
              style={{
                flexDirection: "row",
                flexGap: WIDGET_LAYOUT.actionGap,
                alignItems: "center",
              }}
            >
              <ActionChip
                icon={WIDGET_ICON_GLYPH.refresh}
                color={snapshot.actionIconColor}
                backgroundColor={snapshot.actionBg}
                clickAction="REFRESH"
              />
              <ActionChip
                icon={WIDGET_ICON_GLYPH.settings}
                color={snapshot.actionIconColor}
                backgroundColor={snapshot.actionBg}
                clickAction="OPEN_URI"
                clickActionData={{ uri: "citationswidget://settings" }}
              />
              <ActionChip
                icon={WIDGET_ICON_GLYPH.bookmark}
                color={snapshot.actionIconColor}
                backgroundColor={snapshot.actionBg}
                clickAction="OPEN_URI"
                clickActionData={{ uri: "citationswidget:///" }}
              />
              <ActionChip
                icon={WIDGET_ICON_GLYPH.share}
                color={snapshot.actionIconColor}
                backgroundColor={snapshot.actionBg}
                clickAction="OPEN_URI"
                clickActionData={{ uri: "citationswidget:///" }}
              />
            </FlexWidget>
          ) : null}
        </FlexWidget>

        {snapshot.attributionText ? (
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
  const bgImage = getWidgetBackgroundImage(snapshot.backgroundImageIndex);
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
          <WidgetBody snapshot={snapshot} />
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
      <WidgetBody snapshot={snapshot} />
    </FlexWidget>
  );
}
