import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palettes, themeNames, ThemeId } from '../theme/colors';
import { useTheme, ThemeMode } from '../theme/ThemeContext';
import { AppLogo } from '../components/AppLogo';
import { ThemePicker } from '../components/ThemePicker';

/**
 * Onboarding visual: el usuario elige su familia de paleta la primera vez
 * que abre la app (o si nunca la configuró). Al confirmar, se persiste.
 */
export function ThemeSetupScreen() {
  const insets = useSafeAreaInsets();
  const { mode, setThemeId, setMode } = useTheme();
  const [preview, setPreview] = useState<ThemeId>('elegant');
  const [previewMode, setPreviewMode] = useState<ThemeMode>(mode);

  const palette = palettes[preview][previewMode];

  const apply = () => {
    setThemeId(preview);
    setMode(previewMode);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={{ paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24, paddingHorizontal: 24 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Marca */}
      <View style={styles.brand}>
        <AppLogo size={84} color={palette.primary} gridColor={palette.text} bg={palette.card} />
        <Text style={[styles.title, { color: palette.text }]}>Ivvy Plan</Text>
        <Text style={[styles.subtitle, { color: palette.muted }]}>
          Tu calendario financiero, con tu estilo.
        </Text>
      </View>

      <ThemePicker
        selectedId={preview}
        mode={previewMode}
        palette={palette}
        onSelectTheme={setPreview}
        onSelectMode={setPreviewMode}
      />

      <Pressable
        onPress={apply}
        style={[
          styles.cta,
          {
            backgroundColor: palette.primary,
            borderRadius: palette.radius,
            marginTop: 26,
          },
        ]}
      >
        <Text style={{ color: palette.onPrimary, fontWeight: '800', fontSize: 16 }}>
          Empezar con {themeNames[preview].name}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  brand: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -1,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  cta: {
    alignItems: 'center',
    paddingVertical: 16,
  },
});