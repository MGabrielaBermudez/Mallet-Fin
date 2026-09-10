import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { ArrowDownToLine, ArrowUpFromLine, Gift } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/format';
import { formatDayLong, pad, todayKey } from '../utils/dates';
import { buildMarkedDates, getEventsForDate } from '../utils/events';
import { Card, EmptyState, ModalSheet } from '../components/ui';
import type { CalendarEvent, CalendarEventKind } from '../models/types';

LocaleConfig.locales['es'] = {
  monthNames: [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ],
  monthNamesShort: [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
  ],
  dayNames: [
    'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado',
  ],
  dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  today: 'Hoy',
};
LocaleConfig.defaultLocale = 'es';

export function CalendarScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { payables, receivables, goals, incomes } = useFinance();

  const today = todayKey();
  const [selected, setSelected] = useState<string>(today);
  const [sheetOpen, setSheetOpen] = useState(false);

  const source = useMemo(
    () => ({ payables, receivables, goals, incomes }),
    [payables, receivables, goals, incomes]
  );
  const markedDates = useMemo(
    () => buildMarkedDates(source, selected, colors),
    [source, selected, colors]
  );

  const dayEvents = useMemo(() => getEventsForDate(source, selected), [source, selected]);

  const dayIncome = useMemo(
    () =>
      incomes
        .filter((i) => {
          if (i.type === 'variable') return i.date === selected;
          return selected.endsWith(`-${pad(i.dayOfMonth ?? 1)}`);
        })
        .reduce((acc, i) => acc + i.amount, 0),
    [incomes, selected]
  );

  const openDay = (key: string) => {
    setSelected(key);
    setSheetOpen(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.text }]}>Calendario Financiero</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Toca un día para ver el desglose de tus movimientos.
        </Text>

        {/* Leyenda */}
        <View style={styles.legendRow}>
          <LegendDot color={colors.legend.pay} label="Por pagar" />
          <LegendDot color={colors.legend.collect} label="Cobrar / Ingresos" />
          <LegendDot color={colors.legend.goal} label="Abonos a metas" />
        </View>

        {/* Calendario */}
        <Card style={{ padding: 8, borderRadius: colors.radius }}>
          <Calendar
            current={today}
            markedDates={markedDates}
            onDayPress={(day) => openDay(day.dateString)}
            enableSwipeMonths
            firstDay={1}
            theme={{
              calendarBackground: 'transparent',
              textSectionTitleColor: colors.muted,
              dayTextColor: colors.text,
              monthTextColor: colors.text,
              selectedDayBackgroundColor: colors.primary,
              arrowColor: colors.primary,
              todayTextColor: colors.primary,
              textDisabledColor: colors.muted + '66',
              textDayFontWeight: '500',
              textMonthFontWeight: '700',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 15,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 12,
            }}
          />
        </Card>
      </ScrollView>

      {/* BottomSheet del día */}
      <ModalSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={formatDayLong(selected)}
      >
        {dayEvents.length === 0 && dayIncome <= 0 ? (
          <EmptyState
            icon="calendar-clear-outline"
            title="Sin movimientos"
            subtitle="Este día no tiene pagos, cobros ni abonos programados."
          />
        ) : (
          <>
            {dayIncome > 0 && (
              <View style={[styles.row, { borderBottomColor: colors.border }]}>
                <View style={[styles.rowIcon, { backgroundColor: colors.legend.collect + '18' }]}>
                  <ArrowUpFromLine size={18} color={colors.legend.collect} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '600' }}>Ingresos del día</Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>Entradas esperadas</Text>
                </View>
                <Text style={{ color: colors.legend.collect, fontWeight: '700' }}>
                  +{formatCurrency(dayIncome)}
                </Text>
              </View>
            )}
            {dayEvents.map((event, idx) => (
              <View
                key={`${event.kind}-${event.sourceId}-${idx}`}
                style={[styles.row, idx < dayEvents.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
              >
                <View style={[styles.rowIcon, { backgroundColor: kindColor(event.kind, colors) + '18' }]}>
                  <EventIcon kind={event.kind} color={kindColor(event.kind, colors)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '600' }}>{event.title}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>{kindLabel(event.kind)}</Text>
                </View>
                {event.amount > 0 && (
                  <Text style={{ color: kindColor(event.kind, colors), fontWeight: '700' }}>
                    {event.kind === 'pay' ? '-' : '+'}
                    {formatCurrency(event.amount)}
                  </Text>
                )}
              </View>
            ))}
          </>
        )}
      </ModalSheet>
    </View>
  );
}

// ------------------------------------------------------------- helpers

function kindColor(kind: CalendarEventKind, colors: ReturnType<typeof useTheme>['colors']): string {
  if (kind === 'pay') return colors.legend.pay;
  if (kind === 'collect') return colors.legend.collect;
  return colors.legend.goal;
}

function EventIcon({ kind, color }: { kind: CalendarEventKind; color: string }) {
  if (kind === 'pay') return <ArrowDownToLine size={18} color={color} />;
  if (kind === 'collect') return <ArrowUpFromLine size={18} color={color} />;
  return <Gift size={18} color={color} />;
}

function kindLabel(kind: CalendarEventKind): string {
  if (kind === 'pay') return 'Cuota por pagar';
  if (kind === 'collect') return 'Cobro pendiente';
  return 'Abono a meta';
}

function LegendDot({ color, label }: { color: string; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={{ color: colors.muted, fontSize: 12 }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 14,
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 16,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});