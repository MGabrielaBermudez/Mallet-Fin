import type { SQLiteDatabase } from 'expo-sqlite';
import { toDateKey, addFrequency } from './utils/dates';

/**
 * Datos de demostración insertados únicamente en el primer arranque.
 * Se registra una flag en la tabla `meta` para no repetirlo.
 */
export async function seedIfFirstRun(db: SQLiteDatabase): Promise<void> {
  const flag = await db.getFirstAsync<{ value: string | null }>(
    'SELECT value FROM meta WHERE key = ?',
    ['seeded']
  );
  if (flag) return;

  const today = toDateKey(new Date());

  // --- Ingresos ---
  await db.runAsync(
    `INSERT INTO incomes (name, amount, type, day_of_month) VALUES (?,?,?,?)`,
    ['Salario', 3200, 'monthly', 1]
  );
  await db.runAsync(
    `INSERT INTO incomes (name, amount, type, date) VALUES (?,?,?,?)`,
    ['Proyecto freelance', 800, 'variable', today]
  );

  // --- Meta de compra + un abono inicial ---
  const goal = await db.runAsync(
    `INSERT INTO goals (title, target_amount, current_amount, status, scheduled_contribution_date) VALUES (?,?,?,?,?)`,
    ['Teléfono nuevo', 1200, 450, 'in_progress', addFrequency(today, 'monthly')]
  );
  await db.runAsync(
    `INSERT INTO goal_contributions (goal_id, amount, date, note) VALUES (?,?,?,?)`,
    [goal.lastInsertRowId, 450, today, 'Ahorro inicial']
  );

  // --- Deuda por pagar (con 4 cuotas pagadas de 12) ---
  await db.runAsync(
    `INSERT INTO debts_payable
       (creditor, description, total_amount, remaining_amount, installments_total, installments_paid, frequency, next_payment_date, status)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    ['Banco Central', 'Préstamo personal', 1500, 1000, 12, 4, 'monthly', addFrequency(today, 'monthly'), 'active']
  );

  // --- Cuenta por cobrar ---
  await db.runAsync(
    `INSERT INTO debts_receivable (debtor, description, amount, due_date, status) VALUES (?,?,?,?,?)`,
    ['Carlos', 'Préstamo entre amigos', 300, addFrequency(today, 'biweekly'), 'pending']
  );

  await db.runAsync(
    `INSERT INTO meta (key, value) VALUES ('seeded','1')`
  );
}