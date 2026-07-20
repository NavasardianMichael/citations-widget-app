import React from "react";
import {
  FlexWidget,
  ImageWidget,
  OverlapWidget,
  TextWidget,
} from "react-native-android-widget";
import type { ColorProp } from "react-native-android-widget";

import { getWidgetBackgroundImage } from "@/constants/widget-designs";
import {
  colorWithOpacity,
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
  label,
  color,
  backgroundColor,
  clickAction,
  clickActionData,
}: {
  label: string;
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
      <TextWidget
        text={label}
        allowFontScaling={false}
        style={{
          fontSize: WIDGET_LAYOUT.actionIconSize,
          color: asColor(color),
          textAlign: "center",
        }}
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
        justifyContent: "flex-start",
        padding: WIDGET_LAYOUT.padding,
      }}
    >
      {snapshot.showOrnament ? (
        <TextWidget
          text="✦"
          allowFontScaling={false}
          style={{
            fontSize: WIDGET_LAYOUT.ornamentIconSize,
            color: asColor(ornamentColor),
            textAlign: "right",
            width: "match_parent",
            marginBottom: 4,
          }}
        />
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
          fontSize: WIDGET_LAYOUT.quoteFontSize,
          lineHeight: WIDGET_LAYOUT.quoteLineHeight,
          color: asColor(snapshot.quoteColor),
          fontFamily: snapshot.androidFontFile,
          width: "match_parent",
        }}
      />

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
                flex: 1,
              }}
            />
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
                label="↻"
                color={snapshot.actionIconColor}
                backgroundColor={snapshot.actionBg}
                clickAction="REFRESH"
              />
              <ActionChip
                label="⚙"
                color={snapshot.actionIconColor}
                backgroundColor={snapshot.actionBg}
                clickAction="OPEN_URI"
                clickActionData={{ uri: "citationswidget://settings" }}
              />
              <ActionChip
                label="☆"
                color={snapshot.actionIconColor}
                backgroundColor={snapshot.actionBg}
                clickAction="OPEN_URI"
                clickActionData={{ uri: "citationswidget:///" }}
              />
              <ActionChip
                label="↗"
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
  const bgImage = snapshot.hasBackgroundImage
    ? getWidgetBackgroundImage(snapshot.designId)
    : undefined;
  const imgW = Math.max(1, Math.round(width));
  const imgH = Math.max(1, Math.round(height));

  if (bgImage && typeof bgImage === "number") {
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
            width: "match_parent",
            height: "match_parent",
          }}
        />
        <FlexWidget
          style={{
            width: "match_parent",
            height: "match_parent",
            backgroundColor: asColor(
              snapshot.overlayColor ?? "rgba(0,0,0,0.55)",
            ),
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
