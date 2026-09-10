export interface ThemeLegend {
  /** Rojo / rosa — deudas por pagar. */
  pay: string;
  /** Verde / menta — cuentas por cobrar e ingresos. */
  collect: string;
  /** Morado / azul — abonos programados a metas. */
  goal: string;
}

export interface Palette {
  background: string;
  card: string;
  cardAlt: string;
  text: string;
  muted: string;
  border: string;
  primary: string;
  success: string;
  danger: string;
  warning: string;
  info: string;
  onPrimary: string;
  /** Radios de borde del sistema (hereda el "carácter" de la familia). */
  radius: number;
  /** Colores semánticos del calendario financiero. */
  legend: ThemeLegend;
}

export type ThemeId = 'elegant' | 'pastel';

// ---------------------------------------------------------------- Elegante
// Alto contraste, negro carbón / gris neutro y acento en verde esmeralda.

const elegantLight: Palette = {
  background: '#F7F7F5',
  card: '#FFFFFF',
  cardAlt: '#EFEFEB',
  text: '#16161D',
  muted: '#6F6F7A',
  border: '#E4E4DE',
  primary: '#059669',
  success: '#10B981',
  danger: '#E11D48',
  warning: '#D97706',
  info: '#7C3AED',
  onPrimary: '#FFFFFF',
  radius: 16,
  legend: { pay: '#E11D48', collect: '#059669', goal: '#7C3AED' },
};

const elegantDark: Palette = {
  background: '#0C0C0D',
  card: '#16161A',
  cardAlt: '#202027',
  text: '#F4F4F6',
  muted: '#A0A0AB',
  border: '#2A2A31',
  primary: '#10B981',
  success: '#34D399',
  danger: '#FB7185',
  warning: '#FBBF24',
  info: '#A78BFA',
  onPrimary: '#052E25',
  radius: 16,
  legend: { pay: '#FB7185', collect: '#34D399', goal: '#A78BFA' },
};

// ----------------------------------------------------------------- Pastel
// Verde menta, rosa suave y morado pastel con bordes suaves.

const pastelLight: Palette = {
  background: '#F4FBF8',
  card: '#FFFFFF',
  cardAlt: '#E9F6EF',
  text: '#26413B',
  muted: '#7FA197',
  border: '#D9EDE4',
  primary: '#2FB896',
  success: '#4ADE80',
  danger: '#F28BA8',
  warning: '#F6C177',
  info: '#A78BFA',
  onPrimary: '#FFFFFF',
  radius: 24,
  legend: { pay: '#F28BA8', collect: '#2FB896', goal: '#A78BFA' },
};

const pastelDark: Palette = {
  background: '#1C2B28',
  card: '#243834',
  cardAlt: '#2E463F',
  text: '#F0FAF6',
  muted: '#9BBBB3',
  border: '#36504A',
  primary: '#5EEAD4',
  success: '#7CF0B0',
  danger: '#FDA4B6',
  warning: '#FCD34D',
  info: '#C4B5FD',
  onPrimary: '#0B3A2E',
  radius: 24,
  legend: { pay: '#FDA4B6', collect: '#5EEAD4', goal: '#C4B5FD' },
};

export const palettes: Record<ThemeId, { light: Palette; dark: Palette }> = {
  elegant: { light: elegantLight, dark: elegantDark },
  pastel: { light: pastelLight, dark: pastelDark },
};

export const themeNames: Record<ThemeId, { name: string; tagline: string }> = {
  elegant: { name: 'Elegante Dark & Light', tagline: 'Contraste, carbón y verde esmeralda' },
  pastel: { name: 'Pastel Soft', tagline: 'Menta, rosa y morado con bordes suaves' },
};