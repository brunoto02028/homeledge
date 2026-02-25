import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { BillFrequency } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateMonthlyEquivalent(amount: number, frequency: BillFrequency): number {
  switch (frequency) {
    case 'weekly':
      return (amount * 52) / 12;
    case 'monthly':
      return amount;
    case 'quarterly':
      return (amount * 4) / 12;
    case 'yearly':
      return amount / 12;
    case 'one_time':
      return 0;
    default:
      return amount;
  }
}

export function formatCurrency(amount: number, currency: string = 'GBP'): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;
  return formatDate(dateString);
}

export function getFrequencyLabel(frequency: BillFrequency): string {
  const labels: Record<BillFrequency, string> = {
    one_time: 'One-time',
    weekly: 'Weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly',
  };
  return labels[frequency] ?? frequency;
}

export function isOverdue(dueDate: string | null | undefined, status: string): boolean {
  if (!dueDate || status === 'completed' || status === 'rejected') return false;
  return new Date(dueDate) < new Date();
}

export function getUpcomingDueDate(dueDay: number): Date {
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  if (dueDay >= currentDay) {
    return new Date(currentYear, currentMonth, dueDay);
  } else {
    return new Date(currentYear, currentMonth + 1, dueDay);
  }
}

export function getDaysUntilDue(dueDay: number): number {
  const dueDate = getUpcomingDueDate(dueDay);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffMs = dueDate.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}
