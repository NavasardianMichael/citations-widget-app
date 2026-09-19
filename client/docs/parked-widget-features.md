# Parked widget features

Features that are fully built but deliberately not shipped. The code stays in the
tree, compiled and referenced through a flag in
[`../src/widgets/widget-features.ts`](../src/widgets/widget-features.ts), so it
keeps type-checking and cannot rot against the code around it. Turning one back on
is meant to be the flag and nothing else.

Delete a parked feature only when we decide we will not want it — not to tidy up.

## Refresh action — `WIDGET_REFRESH_ACTION_ENABLED` (off)

A chip on the widget that pulls a new citation without going through the app.

Off on both platforms: the chip is not rendered, and the fetch behind it does not
run. Save and share are unaffected, and so is everything else about the widget.

### What it does when on

| Platform | Behaviour |
|----------|-----------|
| Android | The chip shows a spinner and `task-handler.tsx` fetches a new citation in the widget's own background JS task. Never opens the app. |
| iOS | The chip deep-links to `citationswidget://widget-action?action=refresh`, which opens the app, refreshes, and returns to the tabs. WidgetKit cannot run our JS or reach the network, so the app has to do the work. |

That difference is the platform, not an oversight: Android widgets get a headless
JS task, iOS widgets get neither the network nor a JS runtime of ours.

### Every place it is wired

| File | What is gated |
|------|---------------|
| [`../src/widgets/android/CitationAndroidWidget.tsx`](../src/widgets/android/CitationAndroidWidget.tsx) | The chip in the action row |
| [`../src/widgets/android/task-handler.tsx`](../src/widgets/android/task-handler.tsx) | The `REFRESH` click, which calls `refreshCitationSnapshot(true)` |
| [`../src/widgets/CitationWidget.ios.tsx`](../src/widgets/CitationWidget.ios.tsx) | The chip — **the flag is inlined here as a literal `refreshActionEnabled`** |
| [`../src/app/widget-action.tsx`](../src/app/widget-action.tsx) | The `refresh` deep link, which calls `runRefresh()` |

**The iOS copy has to be changed by hand.** That layout is serialized at build
time and evaluated inside the widget extension in a bare JavaScriptCore context
where module-scope imports are `undefined`, so it cannot read the shared
constant. Both spots have to move together.

The click and deep-link guards are not dead code: a widget left on a home screen
from an older build still has a chip, and would otherwise still fire.

### What stays live

`refreshCitationSnapshot()` in `task-handler.tsx` is **not** gated. It is also
what fetches the first citation when a widget is added, which has nothing to do
with this chip. Gating it would leave new widgets permanently empty.

`WidgetActionId` still includes `'refresh'`, and `runRefresh()` in
`widget-action.tsx` is still compiled — only its call site is behind the flag.

## Still open: save and share open the app on iOS

Not parked, just not solved. Both chips deep-link into the app, because a widget
extension cannot make network calls or run our JS — the app has to do the work.
Android does it in place through its headless task.

iOS 17+ could do save in place: `Button` is a supported node in
`expo-widgets`' `DynamicView.swift`, and `WidgetUserInteraction` in
`AppIntent.swift` fires without opening the app. It would flip the star
optimistically and sync on the next launch. Two caveats: refresh still cannot
work that way, since the fetch needs the network; and that intent reads the
timeline out of `UserDefaults`, which does not reach the extension here — it
would need the same App Group file treatment as `parseTimeline`.
