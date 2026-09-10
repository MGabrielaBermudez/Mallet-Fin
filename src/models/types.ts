export type IncomeType = 'monthly' | 'variable';

export interface Income {
  id: number;
  name: string;
  amount: number;
  type: IncomeType;
  /** 1-31. Only for type === "monthly". */
  dayOfMonth: number | null;
  /** yyyy-MM-dd. Only for type === "variable". */
  date: string | null;
  createdAt: string;
}

export type GoalStatus = 'in_progress' | 'completed';

export interface Goal {
  id: number;
  title: string;
  targetAmount: number;
  currentAmount: number;
  status: GoalStatus;
  /** yyyy-MM-dd — próximo abono programado (se marca en el calendario). */
  scheduledContributionDate: string | null;
  createdAt: string;
}

export interface GoalContribution {
  id: number;
  goalId: number;
  amount: number;
  date: string;
  note: string | null;
  createdAt: string;
}

export type DebtStatus = 'active' | 'paid';
export type PaymentFrequency = 'weekly' | 'biweekly' | 'monthly';

export interface DebtPayable {
  id: number;
  creditor: string;
  description: string | null;
  totalAmount: number;
  remainingAmount: number;
  installmentsTotal: number;
  installmentsPaid: number;
  frequency: PaymentFrequency;
  /** yyyy-MM-dd — próxima cuota por pagar. */
  nextPaymentDate: string;
  status: DebtStatus;
  createdAt: string;
}

export type ReceivableStatus = 'pending' | 'collected';

export interface DebtReceivable {
  id: number;
  debtor: string;
  description: string | null;
  amount: number;
  /** yyyy-MM-dd — fecha límite de cobro. */
  dueDate: string;
  status: ReceivableStatus;
  createdAt: string;
}

export type CalendarEventKind = 'pay' | 'collect' | 'goal';

export interface CalendarEvent {
  kind: CalendarEventKind;
  /** id del registro fuente (deuda, cobro o meta). */
  sourceId: number;
  title: string;
  amount: number;
  date: string;
}

// ------------------------------------------------------------------- Spec
// Mapeo al spec "Ivvy Plan":
//  - Income        → { id, title, amount, frequency: monthly|biweekly|variable, date }
//                    Aquí: `name` ~ title, `type` ~ frequency (biweekly se proyecta
//                    como variable o mensual según sea el caso), `dayOfMonth`/`date`.
//  - Goal          → { id, title, targetAmount, currentAmount, isCompleted, deadline }
//                    Aquí: `status` ~ isCompleted, `scheduledContributionDate` ~ deadline.
//  - GoalContribution → { id, goalId, amount, date } (1:1).
//  - Debt          → { id, person, totalAmount, remainingAmount, type: 'PAY'|'COLLECT', dueDate, installmentCount }
//                    Se modela en dos tablas (split aprobado): DebtPayable = type 'PAY',
//                    DebtReceivable = type 'COLLECT'. `Debt` es la unión de ambos.

export type DebtKind = 'PAY' | 'COLLECT';

export type Debt = DebtPayable | DebtReceivable;

export function debtKind(d: Debt): DebtKind {
  return 'installmentsTotal' in d ? 'PAY' : 'COLLECT';
}

export function debtCounterparty(d: Debt): string {
  return 'creditor' in d ? d.creditor : d.debtor;
}