import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { Text, View } from 'react-native'

import { Button } from '@/components/ui/button'
import { t } from '@/i18n'

type ErrorStateProps = {
  message: string
  onRetry?: () => void
  retryLabel?: string
  className?: string
}

/** Inline empty-panel style error with optional reload action. */
export function ErrorState({
  message,
  onRetry,
  retryLabel,
  className = '',
}: ErrorStateProps) {
  return (
    <View
      className={`items-center gap-4 rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-10 ${className}`}
    >
      <MaterialIcons name='error-outline' size={36} color='#ba1a1a' />
      <Text className='text-center font-body-md text-body-md text-on-surface'>
        {message}
      </Text>
      {onRetry ? (
        <Button
          label={retryLabel ?? t('common.reload')}
          variant='secondary'
          icon='refresh'
          onPress={onRetry}
          className='mt-1'
        />
      ) : null}
    </View>
  )
}
