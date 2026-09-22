/**
 * Widget features that are built but deliberately not shipped.
 *
 * The code behind each flag stays compiled and referenced rather than deleted,
 * so it keeps type-checking and cannot silently rot against the code around it.
 * Flipping a flag back to `true` is meant to be the whole change.
 *
 * See `docs/parked-features.md` for what each one does and every place
 * it is wired in.
 */

/**
 * The refresh chip that pulls a new citation straight from the widget.
 *
 * Off on both platforms. When off, the chip is not rendered and the fetch it
 * triggers never runs; nothing else about the widget changes.
 *
 * Wired in four places:
 * - `widgets/android/CitationAndroidWidget.tsx` — the chip in the action row
 * - `widgets/android/task-handler.tsx` — the `REFRESH` click, which calls
 *   `refreshCitationSnapshot(true)`
 * - `widgets/CitationWidget.ios.tsx` — the chip. The extension evaluates that
 *   layout in a bare JavaScriptCore context where imports are `undefined`, so
 *   the flag is inlined there as a literal and has to be changed in both spots.
 * - `app/widget-action.tsx` — the `refresh` deep link the iOS chip opens
 *
 * `refreshCitationSnapshot` itself stays live: it is also what fetches the
 * first citation when a widget is added, which is unrelated to this chip.
 */
export const WIDGET_REFRESH_ACTION_ENABLED = false;
