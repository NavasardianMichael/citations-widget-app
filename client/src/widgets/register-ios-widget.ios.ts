/**
 * `createWidget()` is what writes the serialized layout into the App Group, and
 * the widget extension shows onboarding copy until that happens. Importing this
 * module from the root layout registers the layout on every app launch instead
 * of waiting for the first widget sync to pull `CitationWidget` in, and reloads
 * WidgetKit so a widget added before this install renders without waiting for
 * the system's own refresh.
 */
import CitationWidget from '@/widgets/CitationWidget'

try {
  CitationWidget.reload()
} catch {
  // Native module unavailable (e.g. Expo Go); the widget sync retries later.
}

export default CitationWidget
