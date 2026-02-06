export interface ExpenseItem {
  id: string;
  name: string;
  predictedCost: number;
  actualCost: number;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  predictedTotal: number;
  actualTotal: number;
  items: ExpenseItem[];
}

export interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  isCompleted: boolean;
  predictedTotal?: number;
  actualTotal?: number;
}