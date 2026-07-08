import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedIcon } from '@/components/animated-icon';
import { HintRow } from '@/components/hint-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { fetchCitations, fetchHealth } from '@/services/api';
import type { Citation } from '@/types/citation';

export default function HomeScreen() {
  const [serverStatus, setServerStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [citations, setCitations] = useState<Citation[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [health, items] = await Promise.all([fetchHealth(), fetchCitations()]);
        if (!isMounted) {
          return;
        }

        setServerStatus(health.status === 'ok' ? 'connected' : 'error');
        setCitations(items);
      } catch {
        if (isMounted) {
          setServerStatus('error');
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const firstCitation = citations[0];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.heroSection}>
          <AnimatedIcon />
          <ThemedText type="title" style={styles.title}>
            Citations Widget
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
            Expo SDK 57 + Express API
          </ThemedText>
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.stepContainer}>
          <HintRow
            title="API status"
            hint={
              serverStatus === 'loading' ? (
                <ActivityIndicator />
              ) : (
                <ThemedText type="code">
                  {serverStatus === 'connected' ? 'connected' : 'offline'}
                </ThemedText>
              )
            }
          />
          {firstCitation ? (
            <HintRow
              title="Sample citation"
              hint={
                <ThemedText type="small">
                  “{firstCitation.text}” — {firstCitation.author}
                </ThemedText>
              }
            />
          ) : null}
          <HintRow
            title="Start server"
            hint={<ThemedText type="code">cd server && npm run dev</ThemedText>}
          />
          <HintRow
            title="Run on Android"
            hint={<ThemedText type="code">cd client && npm run android</ThemedText>}
          />
        </ThemedView>

        {Platform.OS === 'web' && <WebBadge />}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  stepContainer: {
    gap: Spacing.three,
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
  },
});
