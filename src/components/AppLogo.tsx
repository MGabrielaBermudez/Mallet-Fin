import React from 'react';
import Svg, { Circle, Path, Rect, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';

interface AppLogoProps {
  /** Tamaño del cuadrado (px). */
  size?: number;
  /** Color de acento (borde, banda, celda central). Default: primary del tema. */
  color?: string;
  /** Color de la cuadrícula del calendario. Default: texto del tema. */
  gridColor?: string;
  /** Color del cuerpo del calendario. Default: transparente. */
  bg?: string;
}

/**
 * Isotipo de Ivvy Plan: calendario minimalista con un "$" integrado
 * en la celda central de la cuadrícula.
 */
export function AppLogo({
  size = 48,
  color,
  gridColor,
  bg = 'transparent',
}: AppLogoProps) {
  const { colors } = useTheme();
  const accent = color ?? colors.primary;
  const grid = gridColor ?? colors.text;

  // Cuadrícula 3x3 (cada celda 7x7, espaciada a paso 8).
  const cols = [13, 21, 29];
  const rows = [22, 30, 38];
  const cell = 7;

  // Celda central: columna 1, fila 1.
  const centerX = cols[1] ?? 21;
  const centerY = rows[1] ?? 30;
  const textY = centerY + cell + 0.5;

  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      {/* Cuerpo del calendario */}
      <Rect
        x={6}
        y={8}
        width={36}
        height={34}
        rx={9}
        fill={bg}
        stroke={accent}
        strokeWidth={3}
      />
      {/* Banda superior */}
      <Path
        d="M6 17V12a9 9 0 0 1 9-9h18a9 9 0 0 1 9 9v5H6z"
        fill={accent}
      />
      {/* Agujeros de anillas */}
      <Circle cx={33} cy={12.8} r={1.8} fill={accent} />
      <Circle cx={39} cy={12.8} r={1.8} fill={accent} />

      {/* Cuadrícula de días */}
      {cols.map((cx, i) =>
        rows.map((cy, j) => {
          const isCenter = i === 1 && j === 1;
          return (
            <Rect
              key={`${i}-${j}`}
              x={cx}
              y={cy}
              width={cell}
              height={cell}
              rx={1.5}
              fill={isCenter ? accent : 'none'}
              stroke={isCenter ? accent : grid}
              strokeWidth={isCenter ? 0 : 1.3}
            />
          );
        })
      )}

      {/* Símbolo monetario central */}
      <SvgText
        x={centerX + cell / 2}
        y={textY}
        textAnchor="middle"
        fontSize={7.5}
        fontWeight="800"
        fill={colors.onPrimary}
      >
        $
      </SvgText>
    </Svg>
  );
}