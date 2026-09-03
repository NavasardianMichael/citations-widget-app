import type { HomeWidgetSnapshot } from "@/widgets/types";

/** What actually crosses into the widget extension: the snapshot as one string. */
export type IosWidgetProps = { json: string };

/**
 * A snapshot is ~40 mixed strings, numbers and booleans, and that dictionary does
 * not survive the trip into the App Group's `UserDefaults`: the app reads its own
 * write back with nearly every key gone (`propKeys=3`), and the extension finds no
 * entry at all (`tl=0`). The layout crosses the same boundary intact because it is
 * stored as a single string, so send the props as one too and parse them inside
 * the layout.
 *
 * Nulls are safe here — they stay inside the string instead of arriving as
 * `NSNull`, which is what used to make the whole insert raise, so this also
 * retires `withoutNullProps`.
 */
export function toIosWidgetProps(snapshot: HomeWidgetSnapshot): IosWidgetProps {
  return { json: JSON.stringify(snapshot) };
}
