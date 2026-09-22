# Parked features

Features that are fully built but deliberately not shipped. The code stays in the
tree, compiled and referenced through a flag, so it keeps type-checking and cannot
rot against the code around it. Turning one back on is meant to be the flag and
nothing else.

Flags live next to the feature they gate, not in one central file — widget flags
in [`../src/widgets/widget-features.ts`](../src/widgets/widget-features.ts), a
single-component flag at the top of that component.

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

## Tutorial video links — `TUTORIAL_VIDEO_LINKS_ENABLED` (off)

The "Video guides" subtitle and the two YouTube links under it, one per OS.

Off everywhere. The component returns `null`, so nothing renders and the links
cannot be opened.

### Where it is gated

One place:
[`../src/components/tutorial-video-links.tsx`](../src/components/tutorial-video-links.tsx).
The flag is an early `return null` inside `TutorialVideoLinks` itself, not a
condition at the call sites.

That is deliberate. There are three call sites and none of them know about each
other:

| File | Context |
|------|---------|
| [`../src/app/(tabs)/index.tsx`](../src/app/(tabs)/index.tsx) | under the "open tutorial" button, when the CTA is showing |
| [`../src/app/(tabs)/settings.tsx`](../src/app/(tabs)/settings.tsx) | at the foot of the page, for signed-out users with no widget placed |
| [`../src/components/tutorial-modal.tsx`](../src/components/tutorial-modal.tsx) | inside the `longPress` step, under the heading |

Gating each of them separately would let the feature come back on in one place
and stay off in another. Gating the component keeps all three rendering it
exactly as before, and makes the flag the only thing to change.

None of the three leaves a hole behind: in `index.tsx` and `settings.tsx` it sits
among siblings, and in `tutorial-modal.tsx` the `gap-2` wrapper only spaces
between rendered children, so a `null` child adds nothing.

### What stays live

`TUTORIAL_VIDEO_URLS` in `constants/tutorial-videos.ts` and the
`tutorial.videoGuide*` message keys are untouched, and the component still
type-checks against both.

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
