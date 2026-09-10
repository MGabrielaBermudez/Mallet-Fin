import React, { useMemo, useState } from 'react';
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
  Segmented,
  TInput,
} from '../components/ui';
import type { DebtPayable, DebtReceivable, PaymentFrequency } from '../models/types';

type TabKey = 'pay' | 'collect';

export function DebtsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const {
    payables,
    receivables,
    addPayable,
    payInstallment,
    removePayable,
    addReceivable,
    markCollected,
    removeReceivable,
  } = useFinance();

  const [tab, setTab] = useState<TabKey>('pay');

  // Modal deuda por pagar
  const [payModal, setPayModal] = useState(false);
  const [creditor, setCreditor] = useState('');
  const [payDesc, setPayDesc] = useState('');
  const [total, setTotal] = useState('');
  const [installments, setInstallments] = useState('1');
  const [frequency, setFrequency] = useState<PaymentFrequency>('monthly');
  const [firstDue, setFirstDue] = useState<string | null>(todayKey());

  // Modal pagar cuota
  const [paying, setPaying] = useState<DebtPayable | null>(null);
  const [quotaAmount, setQuotaAmount] = useState('');

  // Modal cuenta por cobrar
  const [collModal, setCollModal] = useState(false);
  const [debtor, setDebtor] = useState('');
  const [collDesc, setCollDesc] = useState('');
  const [collAmount, setCollAmount] = useState('');
  const [dueDate, setDueDate] = useState<string | null>(todayKey());

  const activePayables = useMemo(
    () => payables.filter((p) => p.status === 'active'),
    [payables]
  );
  const pendingReceivables = useMemo(
    () => receivables.filter((r) => r.status === 'pending'),
    [receivables]
  );

  const savePayable = async () => {
    const value = parseAmount(total);
    const qty = Math.max(1, Number(installments) || 1);
    if (!creditor.trim() || !value || !firstDue) return;
    await addPayable({
      creditor: creditor.trim(),
      description: payDesc.trim() || null,
      totalAmount: value,
      installmentsTotal: qty,
      frequency,
      nextPaymentDate: firstDue,
    });
    setPayModal(false);
    setCreditor('');
    setPayDesc('');
    setTotal('');
    setInstallments('1');
  };

  const saveQuota = async () => {
    if (!paying) return;
    const value = parseAmount(quotaAmount) ?? paying.remainingAmount;
    await payInstallment(paying.id, value);
    setPaying(null);
    setQuotaAmount('');
  };

  const saveReceivable = async () => {
    const value = parseAmount(collAmount);
    if (!debtor.trim() || !value || !dueDate) return;
    await addReceivable({ debtor: debtor.trim(), description: collDesc.trim() || null, amount: value, dueDate });
    setCollModal(false);
    setDebtor('');
    setCollDesc('');
    setCollAmount('');
  };

  const confirmRemovePayable = (d: DebtPayable) => {
    Alert.alert('Eliminar deuda', `¿Quitar la deuda con ${d.creditor}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => removePayable(d.id) },
    ]);
  };

  const confirmRemoveReceivable = (r: DebtReceivable) => {
    Alert.alert('Eliminar cobro', `¿Quitar el cobro a ${r.debtor}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => removeReceivable(r.id) },
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
          <Text style={[styles.title, { color: colors.text }]}>Deudas</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Controla lo que debes y lo que te deben.
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <Segmented
          options={[
            { key: 'pay', label: `Por pagar (${activePayables.length})` },
            { key: 'collect', label: `Por cobrar (${pendingReceivables.length})` },
          ]}
          value={tab}
          onChange={setTab}
        />

        {tab === 'pay' ? (
          <>
            <Pressable
              onPress={() => setPayModal(true)}
              style={[styles.addCard, { backgroundColor: colors.card, borderColor: colors.primary }]}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: '700' }}>Registrar deuda por pagar</Text>
            </Pressable>

            {activePayables.length === 0 ? (
              <Card>
                <EmptyState icon="checkmark-done-outline" title="Sin deudas activas" subtitle="Registra tus cuotas y planifica los vencimientos en el calendario." />
              </Card>
            ) : (
              activePayables.map((debt) => (
                <Card key={debt.id}>
                  <View style={styles.rowHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>{debt.creditor}</Text>
                      {debt.description ? (
                        <Text style={{ color: colors.muted, fontSize: 13 }}>{debt.description}</Text>
                      ) : null}
                    </View>
                    <Badge label="Pendiente" color={colors.warning} bg={`${colors.warning}1a`} />
                  </View>

                  <View style={styles.debtProgress}>
                    <Text style={{ color: colors.text, fontWeight: '800', fontSize: 20 }}>
                      {formatCurrency(debt.remainingAmount)}
                    </Text>
                    <Text style={{ color: colors.muted, fontSize: 13 }}>
                      de {formatCurrency(debt.totalAmount)}
                    </Text>
                  </View>

                  {debt.installmentsTotal > 1 && (
                    <Text style={{ color: colors.muted, fontSize: 12 }}>
                      Cuota {debt.installmentsPaid} de {debt.installmentsTotal}
                    </Text>
                  )}

                  <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>
                    Próxima cuota: <Text style={{ color: colors.danger, fontWeight: '700' }}>
                      {formatDate(debt.nextPaymentDate)}
                    </Text>
                  </Text>

                  <View style={styles.actions}>
                    <AppButton
                      label="Pagar cuota"
                      icon="card"
                      onPress={() => {
                        const quota = debt.installmentsTotal > 0 ? debt.totalAmount / debt.installmentsTotal : debt.remainingAmount;
                        setQuotaAmount(String(quota.toFixed(2)));
                        setPaying(debt);
                      }}
                    />
                    <Pressable onPress={() => confirmRemovePayable(debt)} style={[styles.trashBtn, { borderColor: colors.border }]}>
                      <Ionicons name="trash-outline" size={18} color={colors.danger} />
                    </Pressable>
                  </View>
                </Card>
              ))
            )}
          </>
        ) : (
          <>
            <Pressable
              onPress={() => setCollModal(true)}
              style={[styles.addCard, { backgroundColor: colors.card, borderColor: colors.primary }]}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: '700' }}>Registrar cuenta por cobrar</Text>
            </Pressable>

            {pendingReceivables.length === 0 ? (
              <Card>
                <EmptyState icon="checkmark-done-outline" title="Nada por cobrar" subtitle="Cuando alguien te deba dinero, regístralo aquí con su fecha límite." />
              </Card>
            ) : (
              pendingReceivables.map((r) => (
                <Card key={r.id}>
                  <View style={styles.rowHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>{r.debtor}</Text>
                      {r.description ? <Text style={{ color: colors.muted, fontSize: 13 }}>{r.description}</Text> : null}
                    </View>
                    <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 17 }}>
                      {formatCurrency(r.amount)}
                    </Text>
                  </View>
                  <Text style={{ color: colors.muted, fontSize: 13 }}>
                    Vence: <Text style={{ color: colors.primary, fontWeight: '700' }}>{formatDate(r.dueDate)}</Text>
                  </Text>
                  <View style={styles.actions}>
                    <AppButton label="Marcar cobrado" icon="checkmark-circle" variant="ghost" onPress={() => markCollected(r.id, true)} />
                    <Pressable onPress={() => confirmRemoveReceivable(r)} style={[styles.trashBtn, { borderColor: colors.border }]}>
                      <Ionicons name="trash-outline" size={18} color={colors.danger} />
                    </Pressable>
                  </View>
                </Card>
              ))
            )}
          </>
        )}
      </View>

      {/* Modal: deuda por pagar */}
      <ModalSheet visible={payModal} onClose={() => setPayModal(false)} title="Nueva deuda por pagar">
        <Field label="¿A quién le debes?">
          <TInput placeholder="Ej. Banco, tienda, amigo…" value={creditor} onChangeText={setCreditor} />
        </Field>
        <Field label="Descripción (opcional)">
          <TInput placeholder="Ej. Préstamo personal" value={payDesc} onChangeText={setPayDesc} />
        </Field>
        <Field label="Monto total">
          <TInput placeholder="0.00" keyboardType="decimal-pad" value={total} onChangeText={setTotal} />
        </Field>
        <Field label="Número de cuotas">
          <TInput placeholder="1" keyboardType="number-pad" value={installments} onChangeText={setInstallments} />
        </Field>
        <Field label="Frecuencia de pago">
          <Segmented
            options={[
              { key: 'weekly', label: 'Semanal' },
              { key: 'biweekly', label: 'Quincenal' },
              { key: 'monthly', label: 'Mensual' },
            ]}
            value={frequency}
            onChange={setFrequency}
          />
        </Field>
        <DateField label="Primera cuota" value={firstDue} onChange={setFirstDue} />
        <AppButton label="Guardar deuda" icon="checkmark" onPress={savePayable} />
      </ModalSheet>

      {/* Modal: pagar cuota */}
      <ModalSheet
        visible={paying !== null}
        onClose={() => setPaying(null)}
        title={paying ? `Pagar cuota · ${paying.creditor}` : 'Pagar cuota'}
      >
        {paying && (
          <>
            <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 12 }}>
              Saldo restante: {formatCurrency(paying.remainingAmount)} · Vence: {formatDate(paying.nextPaymentDate)}
            </Text>
            <Field label="Monto a pagar">
              <TInput placeholder="0.00" keyboardType="decimal-pad" value={quotaAmount} onChangeText={setQuotaAmount} />
            </Field>
            <AppButton label="Confirmar pago" icon="checkmark" onPress={saveQuota} />
          </>
        )}
      </ModalSheet>

      {/* Modal: cuenta por cobrar */}
      <ModalSheet visible={collModal} onClose={() => setCollModal(false)} title="Nueva cuenta por cobrar">
        <Field label="¿Quién te debe?">
          <TInput placeholder="Ej. Carlos, empresa…" value={debtor} onChangeText={setDebtor} />
        </Field>
        <Field label="Descripción (opcional)">
          <TInput placeholder="Ej. Préstamo entre amigos" value={collDesc} onChangeText={setCollDesc} />
        </Field>
        <Field label="Monto">
          <TInput placeholder="0.00" keyboardType="decimal-pad" value={collAmount} onChangeText={setCollAmount} />
        </Field>
        <DateField label="Fecha límite de cobro" value={dueDate} onChange={setDueDate} />
        <AppButton label="Guardar cobro" icon="checkmark" onPress={saveReceivable} />
      </ModalSheet>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerRow: { paddingHorizontal: 20, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 2 },
  content: { paddingHorizontal: 20, marginTop: 12, gap: 14 },
  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  debtProgress: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  trashBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});