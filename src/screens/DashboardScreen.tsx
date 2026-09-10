import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Settings2, Plus, ArrowDownToLine, ArrowUpFromLine, Gift, CalendarDays } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, parseAmount } from '../utils/format';
import { currentMonthKey, formatDayLong, isInMonth, todayKey } from '../utils/dates';
import { getUpcomingEvents, installmentAmount } from '../utils/events';
import type { RootTabParamList } from '../navigation/types';
import { AppLogo } from '../components/AppLogo';
import { ThemePicker } from '../components/ThemePicker';
import {
  AppButton,
  Card,
  DateField,
  EmptyState,
  Field,
  ModalSheet,
  ProgressBar,
  SectionHeader,
  Segmented,
  TInput,
} from '../components/ui';
import type { Income } from '../models/types';
import type { CalendarEventKind } from '../models/types';

type Nav = BottomTabNavigationProp<RootTabParamList>;

export function DashboardScreen() {
  const { colors, mode, themeId, setThemeId, setMode } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { incomes, goals, payables, receivables, addIncome, removeIncome } = useFinance();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [incomeModal, setIncomeModal] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<Income['type']>('monthly');
  const [dayOfMonth, setDayOfMonth] = useState('');
  const [incomeDate, setIncomeDate] = useState<string | null>(todayKey());

  // ---------------------------------------------------------- Resumen del mes
  const month = useMemo(() => {
    const monthKey = currentMonthKey();
    const fixedIncome = incomes
      .filter((i) => i.type === 'monthly')
      .reduce((acc, i) => acc + i.amount, 0);
    const variableIncome = incomes
      .filter((i) => i.type === 'variable' && i.date && isInMonth(i.date, monthKey))
      .reduce((acc, i) => acc + i.amount, 0);
    const expectedIncome = fixedIncome + variableIncome;

    const payments = payables
      .filter((p) => p.status === 'active' && isInMonth(p.nextPaymentDate, monthKey))
      .reduce((acc, p) => acc + installmentAmount(p), 0);
    const collection = receivables
      .filter((r) => r.status === 'pending' && isInMonth(r.dueDate, monthKey))
      .reduce((acc, r) => acc + r.amount, 0);

    return {
      expectedIncome,
      payments,
      collection,
      balance: expectedIncome - payments,
    };
  }, [incomes, payables, receivables]);

  const weekly = useMemo(
    () => getUpcomingEvents({ payables, receivables, goals, incomes }, 7),
    [payables, receivables, goals, incomes]
  );

  const activeGoals = useMemo(() => goals.filter((g) => g.status === 'in_progress'), [goals]);
  const wishlistTotal = useMemo(() => {
    const target = goals.reduce((a, g) => a + g.targetAmount, 0);
    const current = goals.reduce((a, g) => a + g.currentAmount, 0);
    return target > 0 ? Math.round((current / target) * 100) : 0;
  }, [goals]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }, []);

  // -------------------------------------------------------- Ingresos
  const saveIncome = async () => {
    const value = parseAmount(amount);
    if (!name.trim() || !value) return;
    const day =
      type === 'monthly' && dayOfMonth ? Math.min(31, Math.max(1, Number(dayOfMonth))) : null;
    await addIncome({
      name: name.trim(),
      amount: value,
      type,
      dayOfMonth: day || null,
      date: type === 'variable' ? incomeDate : null,
    });
    setIncomeModal(false);
    setName('');
    setAmount('');
    setDayOfMonth('');
  };

  const confirmRemoveIncome = (income: Income) => {
    Alert.alert('Eliminar ingreso', `¿Quitar "${income.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => removeIncome(income.id) },
    ]);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <AppLogo size={46} color={colors.primary} gridColor={colors.text} bg={colors.card} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.greeting, { color: colors.muted }]}>{greeting} 👋</Text>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Ivvy Plan</Text>
        </View>
        <Pressable
          onPress={() => setSettingsOpen(true)}
          style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Settings2 size={20} color={colors.text} />
        </Pressable>
      </View>

      {/* Balance del mes */}
      <Card style={[styles.balanceCard, { backgroundColor: colors.primary, borderRadius: colors.radius }]}>
        <Text style={styles.balanceLabel}>Balance del mes</Text>
        <Text style={styles.balanceAmount}>{formatCurrency(month.balance)}</Text>
        <View style={styles.balanceRow}>
          <View>
            <Text style={styles.balanceLabel}>Ingresos esperados</Text>
            <Text style={styles.balanceValue}>{formatCurrency(month.expectedIncome)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.balanceLabel}>Pagos del mes</Text>
            <Text style={styles.balanceValuePink}>{formatCurrency(month.payments)}</Text>
          </View>
        </View>
      </Card>

      {/* Quick actions */}
      <View style={styles.quickRow}>
        <QuickAction
          icon={<CalendarDays size={22} color={colors.legend.goal} />}
          label="Calendario"
          color={colors.legend.goal}
          onPress={() => navigation.navigate('Calendario')}
        />
        <QuickAction
          icon={<Gift size={22} color={colors.legend.goal} />}
          label="Metas"
          color={colors.legend.goal}
          onPress={() => navigation.navigate('Metas')}
        />
        <QuickAction
          icon={<ArrowDownToLine size={22} color={colors.legend.pay} />}
          label="Deudas"
          color={colors.legend.pay}
          onPress={() => navigation.navigate('Deudas')}
        />
      </View>

      {/* Ingresos esperados */}
      <SectionHeader
        title="Ingresos esperados"
        action={
          <Pressable onPress={() => setIncomeModal(true)} style={[styles.addBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Plus size={16} color={colors.primary} />
            <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>Agregar</Text>
          </Pressable>
        }
      />
      <Card>
        {incomes.length === 0 ? (
          <EmptyState icon="wallet-outline" title="Sin ingresos" subtitle="Registra tu primer ingreso mensual o variable." />
        ) : (
          <>
            {incomes.map((income) => (
              <Pressable
                key={income.id}
                style={[styles.listRow, { borderBottomColor: colors.border }]}
                onLongPress={() => confirmRemoveIncome(income)}
              >
                <View style={[styles.listIcon, { backgroundColor: colors.legend.collect + '18' }]}>
                  <ArrowUpFromLine size={18} color={colors.legend.collect} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '600' }}>{income.name}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>
                    {income.type === 'monthly'
                      ? `Día ${income.dayOfMonth ?? 1} de cada mes`
                      : income.date
                        ? formatDayLong(income.date)
                        : 'Variable'}
                  </Text>
                </View>
                <Text style={{ color: colors.text, fontWeight: '700' }}>
                  {formatCurrency(income.amount)}
                </Text>
              </Pressable>
            ))}
            <View style={[styles.totalRow, { borderTopColor: colors.border, backgroundColor: colors.cardAlt }]}>
              <Text style={{ color: colors.muted, fontWeight: '600', fontSize: 13 }}>
                Total esperado del mes
              </Text>
              <Text style={{ color: colors.legend.collect, fontWeight: '800' }}>
                {formatCurrency(month.expectedIncome)}
              </Text>
            </View>
          </>
        )}
      </Card>

      {/* Vencimientos de la semana */}
      <SectionHeader
        title="Vencimientos de la semana"
        action={
          <Pressable onPress={() => navigation.navigate('Calendario')}>
            <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>Ver todo</Text>
          </Pressable>
        }
      />
      <Card>
        {weekly.length === 0 ? (
          <EmptyState icon="checkmark-circle-outline" title="Semana despejada" subtitle="Nada por pagar, cobrar o abonar en los próximos 7 días." />
        ) : (
          weekly.map((event) => (
            <View key={`${event.kind}-${event.sourceId}`} style={[styles.listRow, { borderBottomColor: colors.border }]}>
              <View style={[styles.listIcon, { backgroundColor: eventColor(event.kind, colors) + '18' }]}>
                <EventIcon kind={event.kind} color={eventColor(event.kind, colors)} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '600' }}>{event.title}</Text>
                <Text style={{ color: colors.muted, fontSize: 12 }}>{formatDayLong(event.date)}</Text>
              </View>
              {event.amount > 0 && (
                <Text style={{ color: eventColor(event.kind, colors), fontWeight: '700' }}>
                  {event.kind === 'pay' ? '-' : '+'}
                  {formatCurrency(event.amount)}
                </Text>
              )}
            </View>
          ))
        )}
      </Card>

      {/* Wishlist (metas) */}
      <SectionHeader
        title="Wishlist"
        action={
          <Pressable onPress={() => navigation.navigate('Metas')}>
            <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>Ver todas</Text>
          </Pressable>
        }
      />
      <Card>
        <View style={[styles.totalRow, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
          <Text style={{ color: colors.muted, fontWeight: '600', fontSize: 13 }}>
            Progreso global de ahorro
          </Text>
          <Text style={{ color: colors.legend.goal, fontWeight: '800' }}>{wishlistTotal}%</Text>
        </View>
        {activeGoals.length === 0 ? (
          <EmptyState icon="gift-outline" title="Sin metas activas" subtitle="Crea una meta de la Wishlist y empieza a abonar." />
        ) : (
          activeGoals.map((goal) => (
            <View key={goal.id} style={[styles.listRow, { borderBottomColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '600' }}>{goal.title}</Text>
                <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 8 }}>
                  {formatCurrency(goal.currentAmount)} de {formatCurrency(goal.targetAmount)}
                </Text>
                <ProgressBar progress={goal.currentAmount / goal.targetAmount} color={colors.legend.goal} />
              </View>
              <Text style={{ color: colors.legend.goal, fontWeight: '700', fontSize: 13 }}>
                {Math.round((goal.currentAmount / goal.targetAmount) * 100)}%
              </Text>
            </View>
          ))
        )}
      </Card>

      {/* Modal: ajustes / tema */}
      <ModalSheet visible={settingsOpen} onClose={() => setSettingsOpen(false)} title="Personalizar Ivvy Plan">
        <ThemePicker
          selectedId={themeId}
          mode={mode}
          palette={colors}
          onSelectTheme={setThemeId}
          onSelectMode={setMode}
        />
        <AppButton label="Listo" icon="checkmark" onPress={() => setSettingsOpen(false)} />
      </ModalSheet>

      {/* Modal: nuevo ingreso */}
      <ModalSheet visible={incomeModal} onClose={() => setIncomeModal(false)} title="Nuevo ingreso">
        <Field label="Nombre">
          <TInput placeholder="Ej. Salario, freelance, ventas…" value={name} onChangeText={setName} />
        </Field>
        <Field label="Monto">
          <TInput placeholder="0.00" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
        </Field>
        <Field label="Tipo">
          <Segmented
            options={[
              { key: 'monthly', label: 'Mensual' },
              { key: 'variable', label: 'Variable' },
            ]}
            value={type}
            onChange={setType}
          />
        </Field>
        {type === 'monthly' ? (
          <Field label="Día del mes">
            <TInput placeholder="1" keyboardType="number-pad" value={dayOfMonth} onChangeText={setDayOfMonth} />
          </Field>
        ) : (
          <DateField label="Fecha de ingreso" value={incomeDate} onChange={setIncomeDate} />
        )}
        <AppButton label="Guardar ingreso" icon="checkmark" onPress={saveIncome} />
      </ModalSheet>
    </ScrollView>
  );
}

// ------------------------------------------------------------- helpers

function eventColor(kind: CalendarEventKind, colors: ReturnType<typeof useTheme>['colors']): string {
  if (kind === 'pay') return colors.legend.pay;
  if (kind === 'collect') return colors.legend.collect;
  return colors.legend.goal;
}

function EventIcon({ kind, color }: { kind: CalendarEventKind; color: string }) {
  if (kind === 'pay') return <ArrowDownToLine size={18} color={color} />;
  if (kind === 'collect') return <ArrowUpFromLine size={18} color={color} />;
  return <Gift size={18} color={color} />;
}

function QuickAction({
  icon,
  label,
  color,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.quickAction, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      {icon}
      <Text style={{ color: colors.text, fontSize: 12, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  greeting: { fontSize: 14 },
  headerTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceCard: {
    marginHorizontal: 20,
    borderWidth: 0,
    paddingVertical: 26,
  },
  balanceLabel: { color: 'rgba(255,255,255,0.78)', fontSize: 12, fontWeight: '700' },
  balanceAmount: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
    marginVertical: 6,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  balanceValue: { color: '#fff', fontSize: 18, fontWeight: '800' },
  balanceValuePink: { color: '#FFD7DE', fontSize: 18, fontWeight: '800' },
  quickRow: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 20,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  listIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
});