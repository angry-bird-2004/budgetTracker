export type Currency = 'PKR' | 'USD';
export type PeriodKey = 'all' | 'today' | 'weekly' | 'monthly' | 'financial-year' | 'yearly';
export type TransactionType = 'income' | 'expense' | 'fill';
export type TaxApplication = 'exclusive' | 'inclusive';
export type PaymentMethod = 'cash' | 'card' | 'bank' | 'other';
export type OutboxEntity = 'envelope' | 'incomeEnvelope' | 'transaction' | 'transfer' | 'settings';
export type OutboxOp = 'create' | 'update' | 'delete';

export type AuthUser = {
  _id: string;
  username: string;
  email: string;
};

export type Session = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

export type Envelope = {
  clientId: string;
  serverId: string | null;
  name: string;
  allocatedAmount: number;
  isSystem: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  consumed: number;
  credited: number;
  currentBalance: number;
};

export type IncomeEnvelope = {
  clientId: string;
  serverId: string | null;
  name: string;
  allocatedAmount: number;
  createdAt: string | null;
  updatedAt: string | null;
  consumed: number;
  income: number;
  tax: number;
  currentBalance: number;
};

export type UpdateLog = {
  before: number;
  after: number;
  diff: number;
  reason: string;
  timestamp: string;
};

export type Transaction = {
  clientId: string;
  serverId: string | null;
  title: string;
  amount: number;
  type: TransactionType;
  envelopeClientId: string | null;
  incomeClientId: string | null;
  paymentMethod: string;
  purpose: string;
  taxPercentage: number | null;
  taxAmount: number | null;
  taxApplication: TaxApplication | null;
  date: string;
  updateLogs: UpdateLog[];
  createdAt: string | null;
  updatedAt: string | null;
  envelopeName?: string | null;
  incomeName?: string | null;
};

export type Settings = {
  transactionPageSize: number;
};

export type OutboxItem = {
  id: string;
  entity: OutboxEntity;
  op: OutboxOp;
  clientId: string;
  payload: string;
  createdAt: string;
  retries: number;
  lastError: string | null;
};

export type SyncStatus = {
  online: boolean;
  syncing: boolean;
  pending: number;
  lastError: string | null;
  lastSyncedAt: string | null;
};
