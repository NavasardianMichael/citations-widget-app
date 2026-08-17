import CitationWidget from '@/widgets/CitationWidget'
import type { HomeWidgetSnapshot } from '@/widgets/types'

try {
  CitationWidget.updateSnapshot({
    quoteText: 'Hello widget',
    sourceText: '',
    emptyMessage: 'Hello widget',
  } as HomeWidgetSnapshot)
} catch {
  // Native module / App Group unavailable until the host app is running.
}

export default CitationWidget
