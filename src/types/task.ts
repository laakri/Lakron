export type RecurrenceRule = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export interface Task {
  id: string;
  title: string;
  time: string;
  date: string;
  completed: boolean;
  type: 'task' | 'event';
  description?: string;
  priority: number;
  recurring: boolean;
  recurrence_rule?: RecurrenceRule;
  completedDates?: string[];
}

export type NewTask = Omit<Task, 'id'>; 