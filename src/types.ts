export type TransactionType = 'expense' | 'income';

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'lodging'
  | 'activity'
  | 'shopping'
  | 'emergency'
  | 'other'
  | 'income';

export type PaymentMethod = 'cash' | 'card' | 'qr' | 'transfer';

export interface ExpenseItem {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  title: string;
  type: TransactionType;
  category: ExpenseCategory;
  amount: number;
  paymentMethod: PaymentMethod;
  note?: string;
  lat: number;
  lng: number;
  locationName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetConfig {
  monthlyBudget: number;
  dailyTarget: number;
  alertThresholdPercent: number; // e.g. 80
}

export interface CategoryMeta {
  id: ExpenseCategory;
  label: string;
  iconName: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const CATEGORIES: Record<ExpenseCategory, CategoryMeta> = {
  food: {
    id: 'food',
    label: 'อาหารและเครื่องดื่ม',
    iconName: 'Utensils',
    color: '#f97316',
    bgColor: '#ffedd5',
    borderColor: '#fdba74',
  },
  transport: {
    id: 'transport',
    label: 'เดินทาง / ยานพาหนะ',
    iconName: 'Car',
    color: '#0284c7',
    bgColor: '#e0f2fe',
    borderColor: '#7dd3fc',
  },
  lodging: {
    id: 'lodging',
    label: 'ที่พัก / โรงแรม',
    iconName: 'BedDouble',
    color: '#7c3aed',
    bgColor: '#ede9fe',
    borderColor: '#c4b5fd',
  },
  activity: {
    id: 'activity',
    label: 'เที่ยว / บัตรเข้าชม',
    iconName: 'Ticket',
    color: '#059669',
    bgColor: '#d1fae5',
    borderColor: '#6ee7b7',
  },
  shopping: {
    id: 'shopping',
    label: 'ช้อปปิ้ง / ซื้อของ',
    iconName: 'ShoppingBag',
    color: '#db2777',
    bgColor: '#fce7f3',
    borderColor: '#f472b6',
  },
  emergency: {
    id: 'emergency',
    label: 'ฉุกเฉิน / พยาบาล',
    iconName: 'AlertTriangle',
    color: '#dc2626',
    bgColor: '#fee2e2',
    borderColor: '#fca5a5',
  },
  other: {
    id: 'other',
    label: 'อื่นๆ',
    iconName: 'Tag',
    color: '#4b5563',
    bgColor: '#f3f4f6',
    borderColor: '#d1d5db',
  },
  income: {
    id: 'income',
    label: 'รายรับ / งบเติม',
    iconName: 'Wallet',
    color: '#16a34a',
    bgColor: '#dcfce7',
    borderColor: '#86efac',
  },
};

export interface FilterState {
  search: string;
  type: 'all' | TransactionType;
  category: 'all' | ExpenseCategory;
  startDate: string;
  endDate: string;
  paymentMethod: 'all' | PaymentMethod;
}
