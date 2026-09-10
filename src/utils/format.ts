export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

export function parseAmount(input: string): number | null {
  const n = Number(String(input).replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
}