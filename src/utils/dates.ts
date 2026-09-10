export function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** Convierte un Date a clave de día "yyyy-MM-dd". */
export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function parseKey(key: string): Date {
  return new Date(`${key}T12:00:00`);
}

export function formatDate(key: string): string {
  return parseKey(key).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDayLong(key: string): string {
  return parseKey(key).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function addDays(key: string, n: number): string {
  const d = parseKey(key);
  d.setDate(d.getDate() + n);
  return toDateKey(d);
}

export function addMonthsClamped(key: string, m: number): string {
  const [y, mo, day] = key.split('-').map(Number);
  if (y === undefined || mo === undefined || day === undefined) return key;
  const target = mo - 1 + m;
  const y2 = y + Math.floor(target / 12);
  const m2 = ((target % 12) + 12) % 12;
  const lastDay = new Date(y2, m2 + 1, 0).getDate();
  const d2 = Math.min(day, lastDay);
  return `${y2}-${pad(m2 + 1)}-${pad(d2)}`;
}

/** Avanza una fecha según la frecuencia de pago de una deuda. */
export function addFrequency(key: string, freq: 'weekly' | 'biweekly' | 'monthly'): string {
  if (freq === 'weekly') return addDays(key, 7);
  if (freq === 'biweekly') return addDays(key, 14);
  return addMonthsClamped(key, 1);
}

export function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function isInMonth(key: string, monthKey: string): boolean {
  return key.startsWith(monthKey);
}