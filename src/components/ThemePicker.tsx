import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Check, Moon, Sun } from 'lucide-react-native';
import { Palette, palettes, themeNames, ThemeId } from '../theme/colors';
import type { ThemeMode } from '../theme/ThemeContext';
import { AppLogo } from './AppLogo';

interface ThemePickerProps {
  selectedId: ThemeId;
  mode: ThemeMode;
  /** Paleta con la que se pinta el chrome del picker (permite previsualizar). */
  palette: Palette;
  onSelectTheme: (id: ThemeId) => void;
  onSelectMode: (mode: ThemeMode) => void;
}

const THEMES: ThemeId[] = ['elegant', 'pastel'];

export function ThemePicker({
  selectedId,
  mode,
  palette,
  onSelectTheme,
  onSelectMode,
}: ThemePickerProps) {
  const colors = palette;

  return (
    <View>
      <Text style={[styles.label, { color: colors.muted }]}>Paleta de color</Text>

      {THEMES.map((id) => {
        const preview = palettes[id][mode];
        const active = id === selectedId;
        return (
          <Pressable
            key={id}
            onPress={() => onSelectTheme(id)}
            style={[
              styles.card,
              {
                backgroundColor: preview.card,
                borderColor: active ? colors.primary : preview.border,
                borderRadius: preview.radius - 6,
              },
            ]}
          >
            <View
              style={[
                styles.previewBlock,
                {
                  backgroundColor: preview.background,
                  borderColor: preview.border,
                  borderRadius: preview.radius - 10,
                },
              ]}
            >
              <AppLogo size={46} color={preview.primary} gridColor={preview.text} bg={preview.card} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: preview.text, fontWeight: '700', fontSize: 15 }}>
                {themeNames[id].name}
              </Text>
              <Text style={{ color: preview.muted, fontSize: 12, marginTop: 2 }}>
                {themeNames[id].tagline}
              </Text>
              <View style={styles.swatches}>
                <Swatch color={preview.primary} />
                <Swatch color={preview.success} />
                <Swatch color={preview.danger} />
                <Swatch color={preview.info} />
              </View>
            </View>
            <View
              style={[
                styles.check,
                { backgroundColor: active ? colors.primary : 'transparent', borderColor: active ? colors.primary : colors.border },
              ]}
            >
              {active && <Check size={14} color={colors.onPrimary} strokeWidth={3} />}
            </View>
          </Pressable>
        );
      })}

      <Text style={[styles.label, { color: colors.muted }]}>Apariencia</Text>
      <View
        style={[
          styles.modeRow,
          { backgroundColor: colors.cardAlt, borderRadius: colors.radius - 4 },
        ]}
      >
        {(['light', 'dark'] as ThemeMode[]).map((m) => {
          const active = m === mode;
          return (
            <Pressable
              key={m}
              onPress={() => onSelectMode(m)}
              style={[
                styles.modeBtn,
                { backgroundColor: active ? colors.primary : 'transparent', borderRadius: colors.radius - 10 },
              ]}
            >
              {m === 'light' ? (
                <Sun size={16} color={active ? colors.onPrimary : colors.muted} />
              ) : (
                <Moon size={16} color={active ? colors.onPrimary : colors.muted} />
              )}
              <Text
                style={{
                  color: active ? colors.onPrimary : colors.text,
                  fontWeight: '600',
                  fontSize: 13,
                }}
              >
                {m === 'light' ? 'Claro' : 'Oscuro'}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Swatch({ color }: { color: string }) {
  return <View style={[styles.swatch, { backgroundColor: color }]} />;
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '700', marginBottom: 10, marginTop: 20 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    borderWidth: 2,
    marginBottom: 12,
  },
  previewBlock: {
    padding: 8,
    borderWidth: 1.5,
  },
  swatches: { flexDirection: 'row', gap: 6, marginTop: 10 },
  swatch: { width: 14, height: 14, borderRadius: 7 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeRow: {
    flexDirection: 'row',
    padding: 4,
    gap: 4,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
  },
});