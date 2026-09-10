import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, parseAmount } from '../utils/format';
import { formatDate, todayKey } from '../utils/dates';
import {
  AppButton,
  Badge,
  Card,
  DateField,
  EmptyState,
  Field,
  ModalSheet,
  ProgressBar,
  SectionHeader,
  TInput,
} from '../components/ui';
import type { Goal } from '../models/types';

export function GoalsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { goals, contributions, addGoal, addContribution, removeGoal } = useFinance();

  // Modal nueva meta
  const [goalModal, setGoalModal] = useState(false);
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [nextDate, setNextDate] = useState<string | null>(null);

  // Modal abonar
  const [payFor, setPayFor] = useState<Goal | null>(null);
  const [amount, setAmount] = useState('');
  const [payDate, setPayDate] = useState<string>(todayKey());

  const activeGoals = goals.filter((g) => g.status === 'in_progress');
  const completedGoals = goals.filter((g) => g.status === 'completed');

  const saveGoal = async () => {
    const value = parseAmount(target);
    if (!title.trim() || !value) return;
    await addGoal({ title: title.trim(), targetAmount: value, scheduledContributionDate: nextDate });
    setGoalModal(false);
    setTitle('');
    setTarget('');
    setNextDate(null);
  };

  const saveContribution = async () => {
    const value = parseAmount(amount);
    if (!payFor || !value) return;
    await addContribution(payFor.id, value, payDate);
    setPayFor(null);
    setAmount('');
    setPayDate(todayKey());
  };

  const confirmRemove = (goal: Goal) => {
    Alert.alert('Eliminar meta', `¿Quitar "${goal.title}" y sus abonos?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => removeGoal(goal.id) },
    ]);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Metas de compra</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Ahorra para lo que realmente quieres.
          </Text>
        </View>
        <Pressable
          onPress={() => setGoalModal(true)}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Nueva meta</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        {activeGoals.length === 0 && completedGoals.length === 0 ? (
          <Card>
            <EmptyState
              icon="gift-outline"
              title="Aún no tienes metas"
              subtitle="Crea una meta, define el monto objetivo y registra abonos para ver tu progreso."
            />
          </Card>
        ) : (
          <>
            {activeGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                color={colors.success}
                onPay={() => setPayFor(goal)}
                onDelete={() => confirmRemove(goal)}
                contributionCount={contributions.filter((c) => c.goalId === goal.id).length}
              />
            ))}

            {completedGoals.length > 0 && (
              <>
                <SectionHeader title="Completadas" />
                {completedGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    color={colors.primary}
                    onPay={() => {}}
                    onDelete={() => confirmRemove(goal)}
                    contributionCount={contributions.filter((c) => c.goalId === goal.id).length}
                  />
                ))}
              </>
            )}
          </>
        )}
      </View>

      {/* Nueva meta */}
      <ModalSheet visible={goalModal} onClose={() => setGoalModal(false)} title="Nueva meta">
        <Field label="¿Qué quieres comprar?">
          <TInput placeholder="Ej. Teléfono nuevo, laptops, viaje…" value={title} onChangeText={setTitle} />
        </Field>
        <Field label="Monto objetivo">
          <TInput placeholder="0.00" keyboardType="decimal-pad" value={target} onChangeText={setTarget} />
        </Field>
        <DateField
          label="Próximo abono programado (opcional)"
          value={nextDate}
          onChange={setNextDate}
        />
        <AppButton label="Crear meta" icon="checkmark" onPress={saveGoal} />
      </ModalSheet>

      {/* Abonar */}
      <ModalSheet
        visible={payFor !== null}
        onClose={() => setPayFor(null)}
        title={payFor ? `Abonar a: ${payFor.title}` : 'Abonar'}
      >
        {payFor && (
          <>
            <Field label="Monto del abono">
              <TInput
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
                autoFocus
              />
            </Field>
            <DateField label="Fecha del abono" value={payDate} onChange={setPayDate} />
            <AppButton label="Registrar abono" icon="gift" onPress={saveContribution} />
          </>
        )}
      </ModalSheet>
    </ScrollView>
  );
}

function GoalCard({
  goal,
  color,
  onPay,
  onDelete,
  contributionCount,
}: {
  goal: Goal;
  color: string;
  onPay: () => void;
  onDelete: () => void;
  contributionCount: number;
}) {
  const { colors } = useTheme();
  const progress = goal.currentAmount / goal.targetAmount;
  const completed = goal.status === 'completed';

  return (
    <Card>
      <View style={styles.goalHeader}>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700', flex: 1 }}>
          {goal.title}
        </Text>
        <Badge
          label={completed ? 'Completado ✓' : 'En proceso'}
          color={completed ? colors.success : colors.warning}
          bg={`${completed ? colors.success : colors.warning}1a`}
        />
      </View>

      <ProgressBar progress={progress} color={completed ? colors.success : color} height={10} />

      <View style={styles.goalAmountRow}>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>
          {formatCurrency(goal.currentAmount)}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 13 }}>
          de {formatCurrency(goal.targetAmount)}
        </Text>
        <Text style={{ color: color, fontWeight: '800', marginLeft: 'auto' }}>
          {Math.round(progress * 100)}%
        </Text>
      </View>

      <Text style={{ color: colors.muted, fontSize: 12 }}>
        {contributionCount} abono{contributionCount === 1 ? '' : 's'}
        {goal.scheduledContributionDate ? ` · próximo: ${formatDate(goal.scheduledContributionDate)}` : ''}
      </Text>

      <View style={styles.actions}>
        {!completed && (
          <AppButton label="Abonar" icon="add-circle-outline" onPress={onPay} />
        )}
        <Pressable onPress={onDelete} style={[styles.trashBtn, { borderColor: colors.border }]}>
          <Ionicons name="trash-outline" size={18} color={colors.danger} />
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 2 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  content: { paddingHorizontal: 20, marginTop: 12, gap: 16 },
  goalHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  goalAmountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  trashBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});