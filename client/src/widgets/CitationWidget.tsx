import { HStack, Text, VStack } from "@expo/ui/swift-ui";
import {
  background,
  containerBackground,
  font,
  foregroundStyle,
  frame,
  padding,
} from "@expo/ui/swift-ui/modifiers";
import { createWidget, type WidgetEnvironment } from "expo-widgets";

import { toArgbHex } from "@/widgets/color";
import type { HomeWidgetSnapshot } from "@/widgets/types";
import { IOS_WIDGET_NAME } from "@/widgets/types";

const EMPTY_SNAPSHOT: HomeWidgetSnapshot = {
  quoteText: "",
  sourceText: "",
  attributionText: null,
  showActions: false,
  designId: "classic",
  fontFamily: "DavelAghvor",
  androidFontFile: "davel-aghvor",
  panelBg: "rgba(255, 255, 255, 0.96)",
  panelBorderColor: "rgba(196, 198, 206, 0.45)",
  accentBorderColor: "#735c00",
  accentBorderWidth: 2,
  quoteColor: "#1b1c1c",
  metaColor: "#021a35",
  attributionColor: "#44474d",
  actionBg: "rgba(239, 237, 237, 0.92)",
  actionIconColor: "#44474d",
  ornamentColor: "#735c00",
  ornamentOpacity: 0.2,
  showOrnament: true,
  showLargeQuotes: false,
  emptyMessage: "",
  fetchedAt: 0,
};

function CitationWidgetView(props: HomeWidgetSnapshot, environment: WidgetEnvironment) {
  "widget";
  const data = { ...EMPTY_SNAPSHOT, ...props };
  const isSmall = environment.widgetFamily === "systemSmall";
  const quoteSize = isSmall ? 13 : environment.widgetFamily === "systemLarge" ? 17 : 15;

  return (
    <VStack
      spacing={8}
      alignment="leading"
      modifiers={[
        containerBackground(toArgbHex(data.panelBg), "widget"),
        padding({ all: isSmall ? 12 : 16 }),
        frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: "topLeading" }),
      ]}
    >
      {data.showLargeQuotes ? (
        <Text
          modifiers={[
            font({ size: 28, weight: "bold", family: data.fontFamily }),
            foregroundStyle(toArgbHex(data.ornamentColor)),
          ]}
        >
          “
        </Text>
      ) : null}

      <Text
        modifiers={[
          font({ size: quoteSize, weight: "regular", family: data.fontFamily }),
          foregroundStyle(toArgbHex(data.quoteColor)),
          frame({ maxWidth: Infinity, alignment: "leading" }),
        ]}
      >
        {data.quoteText || data.emptyMessage}
      </Text>

      {!isSmall && data.sourceText ? (
        <Text
          modifiers={[
            font({ size: 11, weight: "semibold", family: data.fontFamily }),
            foregroundStyle(toArgbHex(data.metaColor)),
            frame({ maxWidth: Infinity, alignment: "leading" }),
          ]}
        >
          {data.sourceText.toUpperCase()}
        </Text>
      ) : null}

      {data.attributionText ? (
        <Text
          modifiers={[
            font({ size: 10, weight: "regular", family: data.fontFamily }),
            foregroundStyle(toArgbHex(data.attributionColor)),
          ]}
        >
          {data.attributionText}
        </Text>
      ) : null}

      {data.showActions && !isSmall ? (
        <HStack spacing={8} modifiers={[padding({ top: 4 })]}>
          <Text
            modifiers={[
              font({ size: 10, weight: "medium" }),
              foregroundStyle(toArgbHex(data.actionIconColor)),
              background(toArgbHex(data.actionBg)),
              padding({ horizontal: 8, vertical: 4 }),
            ]}
          >
            ↻
          </Text>
          <Text
            modifiers={[
              font({ size: 10, weight: "medium" }),
              foregroundStyle(toArgbHex(data.actionIconColor)),
              background(toArgbHex(data.actionBg)),
              padding({ horizontal: 8, vertical: 4 }),
            ]}
          >
            ⚙
          </Text>
        </HStack>
      ) : null}
    </VStack>
  );
}

const CitationWidget = createWidget<HomeWidgetSnapshot>(IOS_WIDGET_NAME, CitationWidgetView);

export default CitationWidget;
