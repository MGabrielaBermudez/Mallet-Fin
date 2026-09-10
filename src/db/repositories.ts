import { db } from './database';
import type {
  Income,
  Goal,
  GoalContribution,
  DebtPayable,
  DebtReceivable,
  PaymentFrequency,
} from '../models/types';
import { addFrequency } from '../utils/dates';

const INCOME_SELECT = `
  SELECT id, name, amount, type, day_of_month AS dayOfMonth, date, created_at AS createdAt
  FROM incomes`;

const GOAL_SELECT = `
  SELECT id, title, target_amount AS targetAmount, current_amount AS currentAmount,
         status, scheduled_contribution_date AS scheduledContributionDate, created_at AS createdAt
  FROM goals`;

const CONTRIBUTION_SELECT = `
  SELECT id, goal_id AS goalId, amount, date, note, created_at AS createdAt
  FROM goal_contributions`;

const PAYABLE_SELECT = `
  SELECT id, creditor, description, total_amount AS totalAmount, remaining_amount AS remainingAmount,
         installments_total AS installmentsTotal, installments_paid AS installmentsPaid,
         frequency, next_payment_date AS nextPaymentDate, status, created_at AS createdAt
  FROM debts_payable`;

const RECEIVABLE_SELECT = `
  SELECT id, debtor, description, amount, due_date AS dueDate, status, created_at AS createdAt
  FROM debts_receivable`;

// ---------------------------------------------------------------- Ingresos

export const incomeRepo = {
  async all(): Promise<Income[]> {
    return db.getAllAsync<Income>(`${INCOME_SELECT} ORDER BY id`);
  },
  async insert(data: {
    name: string;
    amount: number;
    type: Income['type'];
    dayOfMonth?: number | null;
    date?: string | null;
  }) {
    await db.runAsync(
      `INSERT INTO incomes (name, amount, type, day_of_month, date) VALUES (?,?,?,?,?)`,
      [data.name, data.amount, data.type, data.dayOfMonth ?? null, data.date ?? null]
    );
  },
  async remove(id: number) {
    await db.runAsync('DELETE FROM incomes WHERE id = ?', [id]);
  },
};

// ------------------------------------------------------------------- Metas

export const goalRepo = {
  async all(): Promise<Goal[]> {
    return db.getAllAsync<Goal>(`${GOAL_SELECT} ORDER BY status, id DESC`);
  },
  async get(id: number): Promise<Goal | null> {
    return db.getFirstAsync<Goal>(`${GOAL_SELECT} WHERE id = ?`, [id]);
  },
  async insert(data: {
    title: string;
    targetAmount: number;
    scheduledContributionDate?: string | null;
  }) {
    await db.runAsync(
      `INSERT INTO goals (title, target_amount, scheduled_contribution_date) VALUES (?,?,?)`,
      [data.title, data.targetAmount, data.scheduledContributionDate ?? null]
    );
  },
  async contributionsFor(goalId: number): Promise<GoalContribution[]> {
    return db.getAllAsync<GoalContribution>(
      `${CONTRIBUTION_SELECT} WHERE goal_id = ? ORDER BY date DESC`,
      [goalId]
    );
  },
  async allContributions(): Promise<GoalContribution[]> {
    return db.getAllAsync<GoalContribution>(`${CONTRIBUTION_SELECT} ORDER BY date DESC`);
  },
  /**
   * Registra un abono y actualiza current_amount/status de la meta
   * en una sola transacción.
   */
  async addContribution(
    goalId: number,
    amount: number,
    date: string,
    note?: string | null
  ): Promise<void> {
    await db.withTransactionAsync(async () => {
      const goal = await db.getFirstAsync<Goal>(`${GOAL_SELECT} WHERE id = ?`, [goalId]);
      if (!goal) throw new Error('Meta no encontrada');
      const newCurrent = goal.currentAmount + amount;
      const status = newCurrent >= goal.targetAmount ? 'completed' : 'in_progress';
      await db.runAsync(
        `INSERT INTO goal_contributions (goal_id, amount, date, note) VALUES (?,?,?,?)`,
        [goalId, amount, date, note ?? null]
      );
      await db.runAsync(
        `UPDATE goals SET current_amount = ?, status = ? WHERE id = ?`,
        [newCurrent, status, goalId]
      );
    });
  },
  async remove(id: number) {
    await db.runAsync('DELETE FROM goals WHERE id = ?', [id]);
  },
};

// ----------------------------------------------------------- Cuentas por pagar

export const payableRepo = {
  async all(): Promise<DebtPayable[]> {
    return db.getAllAsync<DebtPayable>(`${PAYABLE_SELECT} ORDER BY status, nextPaymentDate`);
  },
  async insert(data: {
    creditor: string;
    description?: string | null;
    totalAmount: number;
    installmentsTotal: number;
    frequency: PaymentFrequency;
    nextPaymentDate: string;
  }) {
    const remaining = data.totalAmount;
    await db.runAsync(
      `INSERT INTO debts_payable
        (creditor, description, total_amount, remaining_amount, installments_total, frequency, next_payment_date)
       VALUES (?,?,?,?,?,?,?)`,
      [
        data.creditor,
        data.description ?? null,
        data.totalAmount,
        remaining,
        data.installmentsTotal,
        data.frequency,
        data.nextPaymentDate,
      ]
    );
  },
  /**
   * Registra el pago de una cuota: reduce remaining, avanza de cuota,
   * recalcula next_payment_date según la frecuencia y cierra la deuda si
   * llega a cero.
   */
  async pay(id: number, amount: number): Promise<void> {
    const payable = await db.getFirstAsync<DebtPayable>(`${PAYABLE_SELECT} WHERE id = ?`, [id]);
    if (!payable) return;
    const remaining = Math.max(0, payable.remainingAmount - amount);
    const installmentsPaid = Math.min(
      payable.installmentsTotal,
      payable.installmentsPaid + (payable.installmentsTotal > 0 ? 1 : 0)
    );
    const status: DebtPayable['status'] = remaining <= 0 ? 'paid' : 'active';
    const nextPaymentDate =
      status === 'paid'
        ? payable.nextPaymentDate
        : addFrequency(payable.nextPaymentDate, payable.frequency);
    await db.runAsync(
      `UPDATE debts_payable
         SET remaining_amount = ?, installments_paid = ?, status = ?, next_payment_date = ?
       WHERE id = ?`,
      [remaining, installmentsPaid, status, nextPaymentDate, id]
    );
  },
  async remove(id: number) {
    await db.runAsync('DELETE FROM debts_payable WHERE id = ?', [id]);
  },
};

// ----------------------------------------------------------- Cuentas por cobrar

export const receivableRepo = {
  async all(): Promise<DebtReceivable[]> {
    return db.getAllAsync<DebtReceivable>(`${RECEIVABLE_SELECT} ORDER BY status, dueDate`);
  },
  async insert(data: {
    debtor: string;
    description?: string | null;
    amount: number;
    dueDate: string;
  }) {
    await db.runAsync(
      `INSERT INTO debts_receivable (debtor, description, amount, due_date) VALUES (?,?,?,?)`,
      [data.debtor, data.description ?? null, data.amount, data.dueDate]
    );
  },
  async markCollected(id: number) {
    await db.runAsync(`UPDATE debts_receivable SET status = 'collected' WHERE id = ?`, [id]);
  },
  async markPending(id: number) {
    await db.runAsync(`UPDATE debts_receivable SET status = 'pending' WHERE id = ?`, [id]);
  },
  async remove(id: number) {
    await db.runAsync('DELETE FROM debts_receivable WHERE id = ?', [id]);
  },
};