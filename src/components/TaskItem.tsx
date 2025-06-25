import { motion, useMotionValue, useAnimation } from 'framer-motion';
import React, { useRef } from 'react';
import { Clock, Repeat, Trash, CalendarDays, CalendarCheck, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Task } from '@/types/task';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete?: (id: string) => void;
}

const priorityColors: Record<number, string> = {
  1: 'bg-red-500 text-white',    // High
  2: 'bg-yellow-500 text-white', // Medium
  3: 'bg-green-500 text-white',  // Low
};

const priorityLabels: Record<number, string> = {
  1: 'High',
  2: 'Medium',
  3: 'Low',
};

const SWIPE_THRESHOLD = -80;

const recurrenceStyles: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  daily: {
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    label: 'Daily',
    icon: <Repeat className="w-3 h-3" />,
  },
  weekly: {
    color: 'bg-green-100 text-green-700 border-green-300',
    label: 'Weekly',
    icon: <CalendarCheck className="w-3 h-3" />,
  },
  monthly: {
    color: 'bg-purple-100 text-purple-700 border-purple-300',
    label: 'Monthly',
    icon: <Calendar className="w-3 h-3" />,
  },
  yearly: {
    color: 'bg-orange-100 text-orange-700 border-orange-300',
    label: 'Yearly',
    icon: <CalendarDays className="w-3 h-3" />,
  },
  custom: {
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    label: 'Custom',
    icon: <Repeat className="w-3 h-3" />,
  },
};

// Helper function to check if a recurring task is due today
const isTaskDueToday = (task: Task): boolean => {
  if (!task.recurring || !task.recurrence_rule) return true;
  
  const today = new Date();
  const taskDate = new Date(task.date);
  
  // If task date is in the future, it's not due yet
  if (taskDate > today) return false;
  
  switch (task.recurrence_rule) {
    case 'daily':
      return true;
      
    case 'weekly':
      return taskDate.getDay() === today.getDay();
      
    case 'monthly':
      return taskDate.getDate() === today.getDate();
      
    case 'yearly':
      return (
        taskDate.getDate() === today.getDate() &&
        taskDate.getMonth() === today.getMonth()
      );
      
    case 'custom':
    default:
      return true;
  }
};

// Helper function to get completion streak for recurring tasks
const getCompletionStreak = (task: Task): number => {
  if (!task.recurring || !Array.isArray(task.completedDates)) return 0;
  
  const today = new Date();
  let streak = 0;
  const sortedDates = [...task.completedDates].sort().reverse();
  
  for (const dateStr of sortedDates) {
    const date = new Date(dateStr);
    const daysDiff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === streak) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
};

const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onDelete }) => {
  const x = useMotionValue(0);
  const controls = useAnimation();
  const cardRef = useRef<HTMLDivElement>(null);
  const isSwiped = useRef(false);

  const handleDragEnd = async (_: any, info: { offset: { x: number } }) => {
    if (info.offset.x < SWIPE_THRESHOLD && onDelete) {
      isSwiped.current = true;
      await controls.start({ x: -90 });
    } else {
      isSwiped.current = false;
      await controls.start({ x: 0 });
    }
  };


  const handleCardClick = () => {
    if (isSwiped.current) {
      controls.start({ x: 0 });
      isSwiped.current = false;
    } else {
      // For recurring tasks, only allow toggle if task is due today
      if (task.recurring && !isTaskDueToday(task)) {
        return; // Don't toggle if not due today
      }
      onToggle(task.id);
    }
  };

  const isDueToday = task.recurring ? isTaskDueToday(task) : true;
  const completionStreak = getCompletionStreak(task);
  const isOverdue = task.recurring && !isDueToday && new Date(task.date) < new Date();

  return (
    <div className="relative group">
      {/* Always-visible small delete button on the right */}
      {onDelete && (
        <button
          className="ml-2 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900 text-red-500 transition-colors absolute right-2 top-1/2 -translate-y-1/2 z-20 md:static md:translate-y-0"
          onClick={e => { e.stopPropagation(); onDelete(task.id); }}
          aria-label="Delete"
          type="button"
        >
          <Trash className="w-4 h-4" />
        </button>
      )}
      <motion.div
        ref={cardRef}
        drag={onDelete ? 'x' : false}
        dragConstraints={{ left: onDelete ? -90 : 0, right: 0 }}
        style={{ x }}
        animate={controls}
        onDragEnd={handleDragEnd}
        className={`
          p-4 mb-2 cursor-pointer transition-all duration-200
          hover:scale-[1.02] active:scale-[0.98]
          ${task.completed ? 'opacity-50' : ''}
          ${task.recurring && !isTaskDueToday(task) ? 'opacity-40 cursor-not-allowed' : ''}
          ${isOverdue ? 'border-l-4 border-l-orange-400' : ''}
          border-none bg-muted/50
          rounded-lg
          relative
          shadow
          dark:shadow-none
          flex flex-col md:flex-row md:items-center md:justify-between
          w-full
        `}
        onClick={handleCardClick}
        // Show delete button on hover (desktop)
        onMouseEnter={() => { if (onDelete && !isSwiped.current) controls.start({ x: -90 }); }}
        onMouseLeave={() => { if (onDelete && !isSwiped.current) controls.start({ x: 0 }); }}
      >
        <div className="flex flex-col md:flex-row md:items-center gap-2 w-full">
          {/* Left: Checkbox, title, badges */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Checkbox circle */}
            <div 
              className={`
                w-5 h-5 rounded-full border-2 flex items-center justify-center
                transition-colors duration-200
                ${task.completed 
                  ? 'bg-blue-500 border-blue-500' 
                  : task.recurring && !isDueToday
                    ? 'border-gray-300 bg-gray-100'
                    : 'border-gray-400 hover:border-blue-400'
                }
              `}
            >
              {task.completed && (
                <svg 
                  className="w-3 h-3 text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M5 13l4 4L19 7" 
                  />
                </svg>
              )}
            </div>
            
            {/* Task title */}
            <div className="flex flex-col">
              <span className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                {task.title}
              </span>
              {task.recurring && !isDueToday && (
                <span className="text-xs text-muted-foreground">
                  {isOverdue ? 'Next occurrence pending' : 'Not due today'}
                </span>
              )}
            </div>
            
            {/* Priority badge */}
            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${priorityColors[task.priority]}`}>
              {priorityLabels[task.priority]}
            </span>
            
            {/* Recurring badge */}
            {task.recurring && (
              (() => {
                const rule = (task.recurrence_rule || 'custom').toLowerCase();
                const style = recurrenceStyles[rule] || recurrenceStyles['custom'];
                return (
                  <Badge
                    variant="outline"
                    className={`ml-1 flex items-center gap-1 border ${style.color} px-2 py-0.5 rounded-full text-xs font-semibold`}
                    title={`${style.label}${completionStreak > 0 ? ` • ${completionStreak} day streak` : ''}`}
                  >
                    {style.icon}
                    {style.label}
                    {completionStreak > 0 && (
                      <span className="ml-1 text-xs font-bold">
                        🔥{completionStreak}
                      </span>
                    )}
                  </Badge>
                );
              })()
            )}
          </div>
          
          {/* Right: Time and type badges */}
          <div className="flex items-center gap-2 flex-shrink-0 mt-2 md:mt-0">
            {/* Time badge */}
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {task.time}
            </Badge>
            
            {/* Task type badge */}
            <Badge variant={task.type === 'event' ? 'secondary' : 'default'}>
              {task.type}
            </Badge>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TaskItem;