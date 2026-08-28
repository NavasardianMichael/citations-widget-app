import type { HomeWidgetSnapshot } from "@/widgets/types";

/**
 * `expo-widgets` stores widget props in the App Group's `UserDefaults`, which
 * only accepts property-list types — and every JS `null` crosses into Swift as
 * `NSNull`. One null anywhere in the snapshot makes the insert raise, surfacing
 * as `Exception in HostFunction: <unknown>`, and the timeline is never written.
 * Dropping those keys is safe because `CitationWidget.ios.tsx` treats a missing
 * value and an empty one the same way.
 */
export function withoutNullProps(snapshot: HomeWidgetSnapshot): HomeWidgetSnapshot {
  return Object.fromEntries(
    Object.entries(snapshot).filter(([, value]) => value !== null && value !== undefined),
  ) as HomeWidgetSnapshot;
}
