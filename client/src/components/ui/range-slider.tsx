import { useState } from "react";
import type { GestureResponderEvent } from "react-native";
import { View } from "react-native";

type RangeSliderProps = {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  accessibilityLabel?: string;
};

const TRACK_HEIGHT = 6;
const THUMB_SIZE = 24;

/**
 * Simple drag-to-select range control — no native slider module is linked in this app.
 * Uses the raw responder props directly (rather than `PanResponder.create`, which would
 * need a persisted ref read during render) since `min`/`max`/`onChange` close over each
 * render's own values here — there is nothing stale to keep in sync.
 */
export function RangeSlider({ value, min, max, onChange, accessibilityLabel }: RangeSliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);

  function updateFromEvent(evt: GestureResponderEvent) {
    if (trackWidth <= 0) return;
    const ratio = Math.min(1, Math.max(0, evt.nativeEvent.locationX / trackWidth));
    const next = Math.round(min + ratio * (max - min));
    onChange(Math.min(max, Math.max(min, next)));
  }

  const ratio = max > min ? (value - min) / (max - min) : 0;
  const thumbCenter = ratio * trackWidth;

  return (
    <View
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min, max, now: value }}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={updateFromEvent}
      onResponderMove={updateFromEvent}
      className="h-11 justify-center"
    >
      <View
        className="w-full rounded-full bg-surface-container-high"
        style={{ height: TRACK_HEIGHT }}
      />
      <View
        className="absolute rounded-full bg-primary"
        style={{ height: TRACK_HEIGHT, width: Math.max(TRACK_HEIGHT, thumbCenter) }}
      />
      <View
        className="absolute rounded-full bg-primary"
        style={{
          height: THUMB_SIZE,
          width: THUMB_SIZE,
          left: Math.max(0, Math.min(trackWidth - THUMB_SIZE, thumbCenter - THUMB_SIZE / 2)),
          boxShadow: "0 1px 3px rgba(2, 26, 53, 0.3)",
        }}
      />
    </View>
  );
}
