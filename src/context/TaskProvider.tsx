import React, { useState, useEffect, useMemo, useContext, createContext, useRef } from 'react';
import type { ReactNode } from 'react';
import { dbOperations } from '../services/supabase';
import type { Task as DatabaseTask } from '../services/supabase';
import CryptoJS from 'crypto-js';
import { useAuth } from './AuthProvider';
import { isTaskDueToday } from '../utils/taskUtils';

const ENCRYPTION_SALT = import.meta.env.VITE_ENCRYPTION_KEY || 'fallback-salt';

// === Types ===
export interface Task {
  id: string;
  title: string;
  time: string;
  date: string;
  completed: boolean;
  type: 'task' | 'event';
  description?: string;
  profile_id?: number;
  priority: number; // 1=High, 2=Medium, 3=Low
  recurring: boolean;
  recurrence_rule?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  completedDates?: string[];
}

interface TaskContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'profile_id'>) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isLoading: boolean;
}

// === Context ===
const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const useTaskContext = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (!context) throw new Error('useTaskContext must be used within a TaskProvider');
  return context;
};

// === Helper Functions ===
const decrypt = (cipher: string, key: string): string => {
  try {
    if (!cipher || !key) return cipher;
    const decrypted = CryptoJS.AES.decrypt(cipher, key).toString(CryptoJS.enc.Utf8);
    return decrypted || cipher; // Fallback to original if decryption returns empty
  } catch (error) {
    return cipher; // Return original if decryption fails
  }
};

// Helper function to normalize recurrence rule from database
const normalizeRecurrenceRule = (rule: string | undefined): 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom' | undefined => {
  if (!rule) return undefined;
  const normalized = rule.toLowerCase();
  switch (normalized) {
    case 'daily':
      return 'daily';
    case 'weekly':
      return 'weekly';
    case 'monthly':
      return 'monthly';
    case 'yearly':
      return 'yearly';
    default:
      return 'custom';
  }
};

// Helper function to convert DatabaseTask to Task
const convertDatabaseTaskToTask = (dbTask: DatabaseTask, decryptionKey: string): Task => {
  return {
    ...dbTask,
    title: decrypt(dbTask.title, decryptionKey),
    description: dbTask.description ? decrypt(dbTask.description, decryptionKey) : undefined,
    recurrence_rule: normalizeRecurrenceRule(dbTask.recurrence_rule),
  };
};

// === Task Provider ===
export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { currentProfile } = useAuth();
  
  // Track subscription state to prevent multiple subscriptions
  const subscriptionRef = useRef<(() => void) | null>(null);
  const currentProfileIdRef = useRef<number | null>(null);

  const generateKey = useMemo(() => {
    if (!currentProfile?.password) return '';
    return CryptoJS.PBKDF2(currentProfile.password, ENCRYPTION_SALT, { keySize: 256 / 32 }).toString();
  }, [currentProfile?.password]);

  // Clean up subscription function
  const cleanupSubscription = () => {
    if (subscriptionRef.current) {
      try {
        subscriptionRef.current();
      } catch (e) {
        // Unsubscribe failed during cleanup
      }
      subscriptionRef.current = null;
    }
  };

  // Load tasks from database
  const loadTasks = async () => {
    if (!currentProfile || !generateKey) {
      setTasks([]);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const data = await dbOperations.getTasks(currentProfile.id, generateKey);
      
      // Convert database tasks to app tasks and process recurring logic
      const today = new Date().toISOString().split('T')[0];
      const processedTasks = (data ?? []).map(dbTask => {
        const task = convertDatabaseTaskToTask(dbTask, generateKey);
        
        if (task.recurring) {
          const completedDates = Array.isArray(task.completedDates) ? task.completedDates : [];
          const isDueToday = isTaskDueToday(task);
          const isCompletedToday = completedDates.includes(today);
          
          // For daily tasks, always show them if they're not completed today
          if (task.recurrence_rule === 'daily') {
            const taskDate = new Date(task.date);
            const currentDate = new Date(today);
            if (taskDate <= currentDate) {
              return {
                ...task,
                completed: isCompletedToday
              };
            }
          }
          
          // For other recurring tasks
          return {
            ...task,
            completed: isDueToday ? isCompletedToday : false,
          };
        }
        return task;
      });
      
      // Filter out tasks that shouldn't be shown today
      const visibleTasks = processedTasks.filter(task => {
        if (!task.recurring) return true;
        if (task.recurrence_rule === 'daily') {
          const taskDate = new Date(task.date);
          const currentDate = new Date(today);
          return taskDate <= currentDate;
        }
        return isTaskDueToday(task);
      });
      
      setTasks(visibleTasks);
    } catch (error) {
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Set up real-time subscription
  const setupSubscription = () => {
    if (!currentProfile || !generateKey) {
      return;
    }
    cleanupSubscription();
    try {
      const unsubscribe = dbOperations.subscribeToTasks(currentProfile.id, (payload: any) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        setTasks(prevTasks => {
          let updatedTasks = [...prevTasks];
          const today = new Date().toISOString().split('T')[0];
          
          switch (eventType) {
            case 'INSERT':
              if (newRecord) {
                const exists = prevTasks.find(task => task.id === newRecord.id);
                if (exists) {
                  return prevTasks;
                }
                
                const convertedTask = convertDatabaseTaskToTask(newRecord, generateKey);
                
                // Process recurring task completion status
                if (convertedTask.recurring) {
                  const completedDates = Array.isArray(convertedTask.completedDates) ? convertedTask.completedDates : [];
                  const isDueToday = isTaskDueToday(convertedTask);
                  const isCompletedToday = completedDates.includes(today);
                  
                  // For daily tasks
                  if (convertedTask.recurrence_rule === 'daily') {
                    const taskDate = new Date(convertedTask.date);
                    const currentDate = new Date(today);
                    if (taskDate <= currentDate) {
                      convertedTask.completed = isCompletedToday;
                      updatedTasks = [...prevTasks, convertedTask];
                      return updatedTasks;
                    }
                  }
                  
                  // For other recurring tasks
                  convertedTask.completed = isDueToday ? isCompletedToday : false;
                }
                
                // Only add the task if it should be visible today
                if (!convertedTask.recurring || isTaskDueToday(convertedTask)) {
                  updatedTasks = [...prevTasks, convertedTask];
                }
              }
              break;
              
            case 'UPDATE':
              if (newRecord) {
                const convertedTask = convertDatabaseTaskToTask(newRecord, generateKey);
                
                // Process recurring task completion status
                if (convertedTask.recurring) {
                  const completedDates = Array.isArray(convertedTask.completedDates) ? convertedTask.completedDates : [];
                  const isDueToday = isTaskDueToday(convertedTask);
                  const isCompletedToday = completedDates.includes(today);
                  
                  // For daily tasks
                  if (convertedTask.recurrence_rule === 'daily') {
                    const taskDate = new Date(convertedTask.date);
                    const currentDate = new Date(today);
                    if (taskDate <= currentDate) {
                      convertedTask.completed = isCompletedToday;
                    }
                  } else {
                    // For other recurring tasks
                    convertedTask.completed = isDueToday ? isCompletedToday : false;
                  }
                }
                
                // Only update if the task should be visible today
                if (!convertedTask.recurring || 
                    (convertedTask.recurrence_rule === 'daily' && new Date(convertedTask.date) <= new Date(today)) ||
                    isTaskDueToday(convertedTask)) {
                  updatedTasks = prevTasks.map(task => 
                    task.id === newRecord.id ? convertedTask : task
                  );
                } else {
                  // Remove task if it shouldn't be visible today
                  updatedTasks = prevTasks.filter(task => task.id !== newRecord.id);
                }
              }
              break;
              
            case 'DELETE':
              if (oldRecord) {
                updatedTasks = prevTasks.filter(task => task.id !== oldRecord.id);
              }
              break;
              
            default:
              return prevTasks;
          }
          
          return updatedTasks;
        });
      });
      
      if (typeof unsubscribe === 'function') {
        subscriptionRef.current = unsubscribe;
      } else if (typeof unsubscribe === 'object' && unsubscribe !== null && typeof (unsubscribe as { unsubscribe?: () => void }).unsubscribe === 'function') {
        subscriptionRef.current = () => (unsubscribe as { unsubscribe: () => void }).unsubscribe();
      }
    } catch (error) {
      // Failed to set up subscription
    }
  };

  // Main effect for profile changes
  useEffect(() => {
    // Clean up previous subscription when profile changes
    if (currentProfileIdRef.current !== currentProfile?.id) {
      cleanupSubscription();
      currentProfileIdRef.current = currentProfile?.id || null;
    }
    if (!currentProfile) {
      setTasks([]);
      setIsLoading(false);
      return;
    }
    const initializeTasks = async () => {
      await loadTasks();
      setupSubscription();
    };
    initializeTasks();
    return cleanupSubscription;
  }, [currentProfile?.id, generateKey]);

  const addTask = async (task: Omit<Task, 'id' | 'profile_id'>) => {
    if (!currentProfile) {
      throw new Error('No active profile');
    }

    if (!currentProfile.id) {
      throw new Error('Invalid profile ID');
    }

    try {
      // Verify profile exists in database
      const profiles = await dbOperations.getProfiles();
      const profileExists = profiles.some(p => p.id === currentProfile.id);
      if (!profileExists) {
        throw new Error('Profile does not exist in database');
      }

      // Ensure new fields are present with defaults
      const fullTask: Omit<DatabaseTask, 'id' | 'created_at'> = {
        ...task,
        priority: typeof task.priority === 'number' ? task.priority : 2,
        recurring: typeof task.recurring === 'boolean' ? task.recurring : false,
        recurrence_rule: task.recurring && task.recurrence_rule ? task.recurrence_rule : undefined,
        completedDates: task.recurring ? [] : undefined,
        profile_id: currentProfile.id,
      };

      await dbOperations.addTask(fullTask, currentProfile.id, generateKey);
      await loadTasks(); // Load tasks immediately after adding
    } catch (error) {
      console.error('Failed to add task:', error);
      await loadTasks(); // Reload tasks to ensure consistency
      throw error;
    }
  };

  const toggleTask = async (id: string) => {
    const target = tasks.find(t => t.id === id);
    if (!target) return;

    const today = new Date().toISOString().split('T')[0];

    if (target.recurring) {
      // Handle recurring task toggle
      const completedDates = Array.isArray(target.completedDates) ? [...target.completedDates] : [];
      const isCompletedToday = completedDates.includes(today);
      const isDueToday = isTaskDueToday(target);
      
      if (!isDueToday) {
        // If task is not due today, don't allow toggle
        return;
      }
      
      let newCompletedDates: string[];
      let newCompletedStatus: boolean;
      
      if (isCompletedToday) {
        // Remove today from completed dates
        newCompletedDates = completedDates.filter(d => d !== today);
        newCompletedStatus = false;
      } else {
        // Add today to completed dates
        newCompletedDates = [...completedDates, today].sort();
        newCompletedStatus = true;
      }

      // Optimistically update UI
      setTasks(prev => {
        const updated = prev.map(task =>
          task.id === id 
            ? { ...task, completed: newCompletedStatus, completedDates: newCompletedDates }
            : task
        );
        return updated;
      });

      try {
        await dbOperations.updateTask(id, { completedDates: newCompletedDates } as Partial<DatabaseTask>);
      } catch (error) {
        // Revert on error
        setTasks(prev => {
          const reverted = prev.map(task =>
            task.id === id 
              ? { ...task, completed: isCompletedToday, completedDates }
              : task
          );
          return reverted;
        });
        throw error;
      }
    } else {
      // Handle regular task toggle
      const newCompletedStatus = !target.completed;

      // Optimistically update UI
      setTasks(prev => {
        const updated = prev.map(task =>
          task.id === id ? { ...task, completed: newCompletedStatus } : task
        );
        return updated;
      });

      try {
        await dbOperations.updateTask(id, { completed: newCompletedStatus });
      } catch (error) {
        // Revert on error
        setTasks(prev => {
          const reverted = prev.map(task =>
            task.id === id ? { ...task, completed: target.completed } : task
          );
          return reverted;
        });
        throw error;
      }
    }
  };

  const contextValue = useMemo(() => ({
    tasks,
    addTask,
    toggleTask,
    searchQuery,
    setSearchQuery,
    isLoading,
  }), [tasks, searchQuery, isLoading]);

  return (
    <TaskContext.Provider value={contextValue}>
      {children}
    </TaskContext.Provider>
  );
};