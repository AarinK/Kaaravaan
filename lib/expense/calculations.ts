import { ExpenseCategory, ExpenseItem } from './types';

export const calculateCategoryTotals = (items: ExpenseItem[]) => {
  const predictedTotal = items.reduce((sum, item) => sum + item.predictedCost, 0);
  const actualTotal = items.reduce((sum, item) => sum + (item.actualCost || 0), 0);
  return { predictedTotal, actualTotal };
};

export const calculateTripTotals = (categories: ExpenseCategory[]) => {
  const predictedTotal = categories.reduce((sum, c) => sum + c.predictedTotal, 0);
  const actualTotal = categories.reduce((sum, c) => sum + c.actualTotal, 0);
  return { predictedTotal, actualTotal };
};

export const splitCost = (total: number, people: number): number => {
  return people > 0 ? total / people : 0;
};