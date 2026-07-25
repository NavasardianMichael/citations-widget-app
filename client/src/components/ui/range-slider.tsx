import { useRef, useState } from "react";
import type { GestureResponderEvent, LayoutChangeEvent } from "react-native";
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
 *
 * Uses `pageX` minus the track's window X (not `locationX`): during a drag the touch
 * target can become the thumb/fill child, and `locationX` then jumps near 0 relative
 * to that child — which looked like the value snapping to min and back.
 */
export function RangeSlider({ value, min, max, onChange, accessibilityLabel }: RangeSliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const trackPageXRef = useRef(0);
  const trackRef = useRef<View>(null);

  function measureTrack(callback?: () => void) {
    trackRef.current?.measureInWindow((x, _y, width) => {
      trackPageXRef.current = x;
      if (width > 0) setTrackWidth(width);
      callback?.();
    });
  }

  function updateFromPageX(pageX: number) {
    const width = trackWidth;
    if (width <= 0) return;
    const x = pageX - trackPageXRef.current;
    const ratio = Math.min(1, Math.max(0, x / width));
    const next = Math.round(min + ratio * (max - min));
    onChange(Math.min(max, Math.max(min, next)));
  }

  function handleGrant(evt: GestureResponderEvent) {
    measureTrack(() => updateFromPageX(evt.nativeEvent.pageX));
    updateFromPageX(evt.nativeEvent.pageX);
  }

  function handleMove(evt: GestureResponderEvent) {
    updateFromPageX(evt.nativeEvent.pageX);
  }

  function handleLayout(e: LayoutChangeEvent) {
    setTrackWidth(e.nativeEvent.layout.width);
    measureTrack();
  }

  const ratio = max > min ? (value - min) / (max - min) : 0;
  const thumbCenter = ratio * trackWidth;

  return (
    <View
      ref={trackRef}
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min, max, now: value }}
      onLayout={handleLayout}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onStartShouldSetResponderCapture={() => true}
      onMoveShouldSetResponderCapture={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={handleGrant}
      onResponderMove={handleMove}
      className="h-11 justify-center"
    >
      <View
        pointerEvents="none"
        className="w-full rounded-full bg-surface-container-high"
        style={{ height: TRACK_HEIGHT }}
      />
      <View
        pointerEvents="none"
        className="absolute rounded-full bg-primary"
        style={{ height: TRACK_HEIGHT, width: Math.max(TRACK_HEIGHT, thumbCenter) }}
      />
      <View
        pointerEvents="none"
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
