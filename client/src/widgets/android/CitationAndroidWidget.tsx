import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";
import type { ColorProp } from "react-native-android-widget";

import type { HomeWidgetSnapshot } from "@/widgets/types";

type Props = {
  snapshot: HomeWidgetSnapshot;
  width: number;
  height: number;
};

function asColor(value: string): ColorProp {
  return value as ColorProp;
}

export function CitationAndroidWidget({ snapshot, width, height }: Props) {
  const isCompact = width < 250 || height < 140;
  const quoteSize = isCompact ? 13 : 15;
  const content = snapshot.quoteText || snapshot.emptyMessage;

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: "match_parent",
        width: "match_parent",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: asColor(snapshot.panelBg),
        borderColor: asColor(snapshot.panelBorderColor),
        borderWidth: 1,
        borderLeftWidth: Math.max(snapshot.accentBorderWidth, 1),
        borderLeftColor: asColor(snapshot.accentBorderColor),
        borderRadius: 12,
        padding: isCompact ? 12 : 16,
      }}
    >
      <FlexWidget
        style={{
          flex: 1,
          flexDirection: "column",
          justifyContent: "center",
          width: "match_parent",
        }}
      >
        {snapshot.showLargeQuotes ? (
          <TextWidget
            text="“"
            style={{
              fontSize: 26,
              color: asColor(snapshot.ornamentColor),
              fontFamily: snapshot.androidFontFile,
            }}
          />
        ) : null}
        <TextWidget
          text={content}
          maxLines={isCompact ? 5 : 8}
          truncate="END"
          style={{
            fontSize: quoteSize,
            color: asColor(snapshot.quoteColor),
            fontFamily: snapshot.androidFontFile,
            lineHeight: quoteSize + 6,
          }}
        />
      </FlexWidget>

      <FlexWidget
        style={{
          width: "match_parent",
          flexDirection: "column",
          flexGap: 4,
          marginTop: 8,
        }}
      >
        {snapshot.sourceText ? (
          <TextWidget
            text={snapshot.sourceText.toUpperCase()}
            maxLines={1}
            truncate="END"
            style={{
              fontSize: 11,
              color: asColor(snapshot.metaColor),
              fontFamily: snapshot.androidFontFile,
              fontWeight: "600",
            }}
          />
        ) : null}
        {snapshot.attributionText ? (
          <TextWidget
            text={snapshot.attributionText}
            maxLines={1}
            truncate="END"
            style={{
              fontSize: 10,
              color: asColor(snapshot.attributionColor),
              fontFamily: snapshot.androidFontFile,
            }}
          />
        ) : null}

        {snapshot.showActions ? (
          <FlexWidget
            style={{
              flexDirection: "row",
              flexGap: 8,
              marginTop: 4,
              width: "match_parent",
            }}
          >
            <TextWidget
              text="↻"
              clickAction="REFRESH"
              style={{
                fontSize: 14,
                color: asColor(snapshot.actionIconColor),
                backgroundColor: asColor(snapshot.actionBg),
                borderRadius: 14,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            />
            <TextWidget
              text="⚙"
              clickAction="OPEN_URI"
              clickActionData={{ uri: "citationswidget://settings" }}
              style={{
                fontSize: 14,
                color: asColor(snapshot.actionIconColor),
                backgroundColor: asColor(snapshot.actionBg),
                borderRadius: 14,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            />
            <TextWidget
              text="☆"
              clickAction="OPEN_URI"
              clickActionData={{ uri: "citationswidget:///" }}
              style={{
                fontSize: 14,
                color: asColor(snapshot.actionIconColor),
                backgroundColor: asColor(snapshot.actionBg),
                borderRadius: 14,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            />
          </FlexWidget>
        ) : null}
      </FlexWidget>
    </FlexWidget>
  );
}
