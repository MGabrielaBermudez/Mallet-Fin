import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { openDatabase } from './src/db/database';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { FinanceProvider } from './src/context/FinanceContext';
import { ThemeSetupScreen } from './src/screens/ThemeSetupScreen';
import RootNavigator from './src/navigation/RootNavigator';
import { LoadingView } from './src/components/ui';

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Boot de la base local en paralelo con la carga del tema (kv-store).
  useEffect(() => {
    openDatabase()
      .then(() => setReady(true))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent ready={ready} error={error} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function AppContent({ ready, error }: { ready: boolean; error: string | null }) {
  const { colors, isDark, ready: themeReady, chosen } = useTheme();

  // Espera a que el tema persistido se haya leído antes de pintar cualquier cosa.
  if (!themeReady) return <LoadingView />;

  // Onboarding: primera vez que se abre la app se elige la familia de paleta.
  if (!chosen) return <ThemeSetupScreen />;

  if (error) {
    return (
      <View style={[styles.errorBox, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorTitle, { color: colors.text }]}>No se pudo abrir la base de datos</Text>
        <Text style={[styles.errorMsg, { color: colors.muted }]}>{error}</Text>
      </View>
    );
  }

  if (!ready) return <LoadingView />;

  const base = isDark ? DarkTheme : DefaultTheme;

  return (
    <NavigationContainer
      theme={{
        ...base,
        colors: {
          ...base.colors,
          primary: colors.primary,
          background: colors.background,
          card: colors.card,
          text: colors.text,
          border: colors.border,
        },
      }}
    >
      <FinanceProvider>
        <RootNavigator />
      </FinanceProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  errorBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 8,
  },
  errorTitle: { fontSize: 18, fontWeight: '700' },
  errorMsg: { fontSize: 13, textAlign: 'center' },
});