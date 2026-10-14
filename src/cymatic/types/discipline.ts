/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Universal Personal Discipline OS Types
 */

export interface FinancialEntry {
  id: string;
  label: string;
  amount: number;
  category: 'expense' | 'income' | 'savings';
  timestamp: number;
}

export interface DynamicCapitalConfig {
  currencySymbol: string;
  totalBudget: number;
  entries: FinancialEntry[];
}

export interface UserCustomGoal {
  id: string;
  title: string;
  targetMetric: number;
  currentProgress: number;
  unit: string;
  completed: boolean;
}

export interface RoutineHabit {
  id: string;
  label: string;
  completed: boolean;
}

export interface UniversalDisciplineState {
  capital: DynamicCapitalConfig;
  customGoals: UserCustomGoal[];
  dailyRoutines: RoutineHabit[];
  lastUpdated: number;
}
