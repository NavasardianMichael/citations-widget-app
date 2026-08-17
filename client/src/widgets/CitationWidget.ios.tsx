import { Text, VStack } from '@expo/ui/swift-ui'
import {
  containerBackground,
  font,
  foregroundStyle,
  padding,
} from '@expo/ui/swift-ui/modifiers'
import { createWidget, type WidgetEnvironment } from 'expo-widgets'

import type { HomeWidgetSnapshot } from '@/widgets/types'

/**
 * WidgetKit redacts placeholder Text into gray bars. The native EntryView
 * is patched with `.unredacted()`. Keep this function referentially free.
 */
const CitationWidgetView = (
  props: HomeWidgetSnapshot,
  _environment: WidgetEnvironment,
) => {
  'widget'

  const quote = props.quoteText || props.emptyMessage || 'Մեջբերում չկա'
  const source = props.sourceText || ''

  return (
    <VStack
      alignment='leading'
      spacing={12}
      modifiers={[
        containerBackground('#12100C', 'widget'),
        padding({ all: 16 }),
      ]}
    >
      <Text modifiers={[font({ weight: 'bold', size: 18 }), foregroundStyle('#FBF9F8')]}>
        {quote}
      </Text>
      <Text modifiers={[font({ weight: 'regular', size: 14 }), foregroundStyle('#FED65B')]}>
        {source}
      </Text>
    </VStack>
  )
}

export default createWidget<HomeWidgetSnapshot>('CitationWidget', CitationWidgetView)
