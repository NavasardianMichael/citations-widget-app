import type { PressableProps } from "react-native";
import { Platform } from "react-native";

/** Suppress the default Android material ripple (blue/lighter overlay on press). */
export const pressableNoRipple: Pick<PressableProps, "android_ripple"> =
  Platform.OS === "android" ? { android_ripple: { color: "transparent" } } : {};
