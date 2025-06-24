import type { Task } from '../types/task';

/**
 * Determines if a recurring task is due today.
 *
 * @param task The task to check.
 * @returns True if the task is due today, false otherwise.
 */
export const isTaskDueToday = (task: Task): boolean => {
  if (!task.recurring || !task.recurrence_rule) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const taskDate = new Date(task.date);
  taskDate.setHours(0, 0, 0, 0);

  // If the task's start date is in the future, it's not due yet.
  if (taskDate > today) {
    return false;
  }

  switch (task.recurrence_rule) {
    case 'daily':
      return true;

    case 'weekly':
      return taskDate.getDay() === today.getDay();

    case 'monthly':
      // This logic checks if the day of the month matches.
      return taskDate.getDate() === today.getDate();

    case 'yearly':
      return taskDate.getDate() === today.getDate() && taskDate.getMonth() === today.getMonth();

    case 'custom':
    default:
      // For 'custom' or other rules, assume it's due every day after its start date.
      return true;
  }
}; 