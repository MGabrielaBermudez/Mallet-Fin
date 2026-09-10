import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type {
  Goal,
  GoalContribution,
  DebtPayable,
  DebtReceivable,
  Income,
  PaymentFrequency,
} from '../models/types';
import { goalRepo, incomeRepo, payableRepo, receivableRepo } from '../db/repositories';

export interface FinanceSnapshot {
  incomes: Income[];
  goals: Goal[];
  contributions: GoalContribution[];
  payables: DebtPayable[];
  receivables: DebtReceivable[];
  loading: boolean;
}

interface AddGoalInput {
  title: string;
  targetAmount: number;
  scheduledContributionDate?: string | null;
}

interface AddPayableInput {
  creditor: string;
  description?: string | null;
  totalAmount: number;
  installmentsTotal: number;
  frequency: PaymentFrequency;
  nextPaymentDate: string;
}

interface AddReceivableInput {
  debtor: string;
  description?: string | null;
  amount: number;
  dueDate: string;
}

interface FinanceContextValue extends FinanceSnapshot {
  refresh: () => Promise<void>;
  contributionsFor: (goalId: number) => Promise<GoalContribution[]>;

  addIncome: (data: {
    name: string;
    amount: number;
    type: Income['type'];
    dayOfMonth?: number | null;
    date?: string | null;
  }) => Promise<void>;
  removeIncome: (id: number) => Promise<void>;

  addGoal: (data: AddGoalInput) => Promise<void>;
  addContribution: (goalId: number, amount: number, date: string) => Promise<void>;
  removeGoal: (id: number) => Promise<void>;

  addPayable: (data: AddPayableInput) => Promise<void>;
  payInstallment: (id: number, amount: number) => Promise<void>;
  removePayable: (id: number) => Promise<void>;

  addReceivable: (data: AddReceivableInput) => Promise<void>;
  markCollected: (id: number, collected: boolean) => Promise<void>;
  removeReceivable: (id: number) => Promise<void>;
}

const FinanceContext = createContext<FinanceContextValue | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [contributions, setContributions] = useState<GoalContribution[]>([]);
  const [payables, setPayables] = useState<DebtPayable[]>([]);
  const [receivables, setReceivables] = useState<DebtReceivable[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [i, g, c, p, r] = await Promise.all([
      incomeRepo.all(),
      goalRepo.all(),
      goalRepo.allContributions(),
      payableRepo.all(),
      receivableRepo.all(),
    ]);
    setIncomes(i);
    setGoals(g);
    setContributions(c);
    setPayables(p);
    setReceivables(r);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const contributionsFor = useCallback(async (goalId: number) => {
    return goalRepo.contributionsFor(goalId);
  }, []);

  const value = useMemo<FinanceContextValue>(
    () => ({
      incomes,
      goals,
      contributions,
      payables,
      receivables,
      loading,
      refresh,
      contributionsFor,

      addIncome: async (data) => {
        await incomeRepo.insert(data);
        await refresh();
      },
      removeIncome: async (id) => {
        await incomeRepo.remove(id);
        await refresh();
      },

      addGoal: async (data) => {
        await goalRepo.insert(data);
        await refresh();
      },
      addContribution: async (goalId, amount, date) => {
        await goalRepo.addContribution(goalId, amount, date);
        await refresh();
      },
      removeGoal: async (id) => {
        await goalRepo.remove(id);
        await refresh();
      },

      addPayable: async (data) => {
        await payableRepo.insert(data);
        await refresh();
      },
      payInstallment: async (id, amount) => {
        await payableRepo.pay(id, amount);
        await refresh();
      },
      removePayable: async (id) => {
        await payableRepo.remove(id);
        await refresh();
      },

      addReceivable: async (data) => {
        await receivableRepo.insert(data);
        await refresh();
      },
      markCollected: async (id, collected) => {
        if (collected) await receivableRepo.markCollected(id);
        else await receivableRepo.markPending(id);
        await refresh();
      },
      removeReceivable: async (id) => {
        await receivableRepo.remove(id);
        await refresh();
      },
    }),
    [incomes, goals, contributions, payables, receivables, loading, refresh, contributionsFor]
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance(): FinanceContextValue {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance debe usarse dentro de <FinanceProvider>');
  return ctx;
}