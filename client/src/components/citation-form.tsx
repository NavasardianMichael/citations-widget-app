import type { ReactNode } from 'react'
import { Text, View } from 'react-native'

import { FormField } from '@/components/form-field'
import { TogglePill } from '@/components/toggle-pill'
import { ToggleRow } from '@/components/toggle-row'
import type { SourceType } from '@/types/citation'

export type CitationFormValues = {
  text: string
  author: string
  sourceType: SourceType
  shareProfile: boolean
}

export const emptyCitationFormValues = (): CitationFormValues => ({
  text: '',
  author: '',
  sourceType: 'bible',
  shareProfile: true,
})

export const citationToFormValues = (citation: {
  text: string
  author: string | null
  sourceRef: string | null
  sourceType: SourceType
  shareProfile: boolean
}): CitationFormValues => ({
  text: citation.text,
  author: citation.author ?? citation.sourceRef ?? '',
  sourceType: citation.sourceType,
  shareProfile: citation.shareProfile,
})

type CitationFormProps = {
  values: CitationFormValues
  onChange: (values: CitationFormValues) => void
  footer?: ReactNode
  disabled?: boolean
}

export function CitationForm({
  values,
  onChange,
  footer,
  disabled = false,
}: CitationFormProps) {
  function patch<K extends keyof CitationFormValues>(
    key: K,
    value: CitationFormValues[K],
  ) {
    onChange({ ...values, [key]: value })
  }

  return (
    <View
      className='rounded-xl bg-surface-container-low p-6 md:p-10'
      style={{ boxShadow: '0 4px 20px rgba(2, 26, 53, 0.15)' }}
    >
      <FormField
        label='Citation Text'
        value={values.text}
        onChangeText={(text) => patch('text', text)}
        placeholder='Enter the text to be preserved...'
        multiline
        variant='paper'
        editable={!disabled}
      />

      <View className='mb-8 flex-col gap-8 md:flex-row'>
        <View className='flex-1'>
          <FormField
            label='Author / Source'
            value={values.author}
            onChangeText={(author) => patch('author', author)}
            placeholder='e.g., C.S. Lewis'
            variant='paper'
            editable={!disabled}
          />
        </View>
        <View className='flex-1'>
          <Text className='mb-3 font-label-sm text-label-sm text-primary'>
            Category
          </Text>
          <TogglePill
            variant='category'
            options={[
              { value: 'bible' as const, label: 'Theology' },
              { value: 'fiction' as const, label: 'Literature' },
            ]}
            value={values.sourceType}
            onChange={(sourceType) => patch('sourceType', sourceType)}
            disabled={disabled}
          />
        </View>
      </View>

      <View className={footer ? 'mb-10' : ''}>
        <ToggleRow
          title="Share my profile on other users' widgets if approved"
          value={values.shareProfile}
          onValueChange={(shareProfile) => patch('shareProfile', shareProfile)}
          disabled={disabled}
        />
      </View>

      {footer ? (
        <View className='border-t border-outline-variant/30 pt-6'>
          {footer}
        </View>
      ) : null}
    </View>
  )
}
