import type { CalendarEvent, DebtPayable, Goal, DebtReceivable, Income } from '../models/types';
import type { Palette } from '../theme/colors';
import { addDays, todayKey } from './dates';

export interface EventSource {
  payables: DebtPayable[];
  receivables: DebtReceivable[];
  goals: Goal[];
  incomes: Income[];
}

/** Monto de la cuota fija de una deuda (para mostrar en el calendario). */
export function installmentAmount(p: DebtPayable): number {
  return p.installmentsTotal > 0 ? p.totalAmount / p.installmentsTotal : p.remainingAmount;
}

/** Unifica deudas por pagar, por cobrar y abonos de metas en un solo feed. */
export function allEvents(source: EventSource): CalendarEvent[] {
  const events: CalendarEvent[] = [
    ...source.payables
      .filter((p) => p.status === 'active')
      .map((p) => ({
        kind: 'pay' as const,
        sourceId: p.id,
        title: `Pagar a ${p.creditor}`,
        amount: installmentAmount(p),
        date: p.nextPaymentDate,
      })),
    ...source.receivables
      .filter((r) => r.status === 'pending')
      .map((r) => ({
        kind: 'collect' as const,
        sourceId: r.id,
        title: `Cobrar a ${r.debtor}`,
        amount: r.amount,
        date: r.dueDate,
      })),
    ...source.goals
      .filter((g) => g.status === 'in_progress' && g.scheduledContributionDate)
      .map((g) => ({
        kind: 'goal' as const,
        sourceId: g.id,
        title: `Abono: ${g.title}`,
        amount: 0,
        date: g.scheduledContributionDate as string,
      })),
  ];
  return events.sort((a, b) => a.date.localeCompare(b.date));
}

export function getEventsForDate(source: EventSource, date: string): CalendarEvent[] {
  return allEvents(source).filter((e) => e.date === date);
}

export function getUpcomingEvents(source: EventSource, windowDays = 7): CalendarEvent[] {
  const today = todayKey();
  const limit = addDays(today, windowDays - 1);
  return allEvents(source).filter((e) => e.date >= today && e.date <= limit);
}

export interface DayMarking {
  marked?: boolean;
  dotColor?: string;
  selected?: boolean;
  selectedColor?: string;
  selectedTextColor?: string;
  today?: boolean;
  todayTextColor?: string;
  /** Interno: orden de prioridad cuando varios tipos coinciden el mismo día. */
  __priority?: number;
}

/** Devuelve las claves de día en las que el income corresponde (mensual o variable). */
export function incomeDates(i: Income): string[] {
  if (i.date) return [i.date];
  // Ingreso mensual: el día que cae en el primer mes válido y posteriores.
  return [];
}

/** Builds the `markedDates` prop para react-native-calendars. */
export function buildMarkedDates(
  source: EventSource,
  selected: string,
  colors: Palette
): Record<string, DayMarking> {
  const marked: Record<string, DayMarking> = {};

  // Prioridad si un día concentra varios tipos: pay > collect > goal > income.
  const push = (date: string, dotColor: string, priority: number) => {
    const current = marked[date];
    if (current && current.__priority !== undefined && current.__priority <= priority) return;
    marked[date] = {
      ...(current ?? {}),
      marked: true,
      dotColor,
      __priority: priority,
    };
  };

  source.payables
    .filter((p) => p.status === 'active')
    .forEach((p) => push(p.nextPaymentDate, colors.legend.pay, 0));

  source.receivables
    .filter((r) => r.status === 'pending')
    .forEach((r) => push(r.dueDate, colors.legend.collect, 1));

  source.goals
    .filter((g) => g.status === 'in_progress' && g.scheduledContributionDate)
    .forEach((g) => push(g.scheduledContributionDate as string, colors.legend.goal, 2));

  // Ingresos: mensuales (día del mes en todos los meses) y variables (fecha exacta).
  source.incomes.forEach((i) => {
    if (i.date) {
      push(i.date, colors.legend.collect, 3);
    } else if (i.dayOfMonth) {
      const year = new Date().getFullYear();
      for (let m = 0; m < 12; m++) {
        const key = `${year}-${String(m + 1).padStart(2, '0')}-${String(i.dayOfMonth).padStart(2, '0')}`;
        push(key, colors.legend.collect, 3);
      }
    }
  });

  if (selected) {
    marked[selected] = {
      ...(marked[selected] ?? {}),
      selected: true,
      selectedColor: colors.primary,
      selectedTextColor: '#ffffff',
    };
  }

  const today = todayKey();
  if (!selected || selected === today) {
    marked[today] = { ...(marked[today] ?? {}), today: true, todayTextColor: colors.primary };
  }

  return marked;
}