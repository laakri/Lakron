import React, { useState } from 'react';
import { Plus, Search, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import TaskItem from '@/components/TaskItem';
import SmoothTasksList from '@/components/SmoothTasksList';
import type { Task, NewTask } from '@/types/task';
import { isTaskDueToday } from '../utils/taskUtils';
import AddTaskForm from '@/components/AddTaskForm';

// Types
interface TodayPageProps {
  tasks: Task[];
  onAddTask: (task: NewTask) => void;
  onToggleTask: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNavigateToSchedule: () => void;
}

// Utilities
const getTodayString = (): string => new Date().toISOString().split('T')[0];

// Main Today Page Component
const TodayPage: React.FC<TodayPageProps> = ({ 
  tasks, 
  onAddTask, 
  onToggleTask, 
  searchQuery, 
  onSearchChange, 
  onNavigateToSchedule 
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const today = getTodayString();

  // Filter tasks to show:
  // 1. Non-recurring tasks scheduled for today.
  // 2. All recurring tasks that are due today.
  const todayTasks = tasks.filter(task => {
    if (!task.recurring) {
      return task.date === today;
    }
    return isTaskDueToday(task);
  });

  const filteredTasks = todayTasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddTask = (newTask: NewTask) => {
    onAddTask(newTask);
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Search and Navigation */}
      <div className="max-w-md mx-auto">
        <div className='flex w-full gap-2'>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search today's tasks..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-transparent border-none"
            />
          </div>

          <Button
            variant="secondary"
            onClick={onNavigateToSchedule}
          >
            <Calendar className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Tasks */}
      <div className="max-w-xl mx-auto">
        <SmoothTasksList
          tasks={filteredTasks}
          emptyState={
            <Card className='border-none bg-transparent'>
              <CardContent className="py-22 text-center text-sm">
                No tasks for today
              </CardContent>
            </Card>
          }
          renderTask={(task) => (
            <TaskItem 
              key={task.id} 
              task={task} 
              onToggle={onToggleTask}
            />
          )}
          className="bg-muted/10 rounded-2xl p-4"
          maxHeight={450}
        />
      </div>

      {/* Add Button */}
      <div className="fixed bottom-6 right-6 z-10">
        <Button
          size="lg"
          onClick={() => setShowAddForm(true)}
          className="rounded-full w-12 h-12 shadow-lg bg-primary hover:bg-primary/90"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* Add Task Form */}
      {showAddForm && (
        <AddTaskForm
          onAdd={handleAddTask}
          onCancel={() => setShowAddForm(false)}
          selectedDate={today}
        />
      )}
    </div>
  );
};

export default TodayPage;