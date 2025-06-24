import React, { useState } from 'react';
import { ArrowLeft, Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import TaskItem from '@/components/TaskItem';
import { SmoothTasksList } from '@/components/SmoothTasksList';
import type { Task, NewTask } from '@/types/task';
import AddTaskForm from '@/components/AddTaskForm';

interface DayDetailPageProps {
  tasks: Task[];
  selectedDate: string;
  onAddTask: (task: NewTask) => void;
  onToggleTask: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNavigateBack: () => void;
}

// Main Day Detail Page Component
const DayDetailPage: React.FC<DayDetailPageProps> = ({ 
  tasks, 
  selectedDate, 
  onAddTask, 
  onToggleTask, 
  searchQuery, 
  onSearchChange, 
  onNavigateBack 
}) => {
  const [showAddForm, setShowAddForm] = useState(false);

  const selectedDateTasks = tasks.filter(task => task.date === selectedDate);
  const filteredTasks = selectedDateTasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const completedCount = selectedDateTasks.filter(t => t.completed).length;

  const handleAddTask = (newTask: NewTask) => {
    onAddTask(newTask);
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={onNavigateBack}
            className="flex items-center space-x-2 p-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-lg font-medium">
            {new Date(selectedDate).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}
          </h2>
          <Badge variant="outline" className="text-xs">
            {completedCount}/{selectedDateTasks.length} completed
          </Badge>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-md mx-auto">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-transparent border-none"
          />
        </div>
      </div>

      {/* Tasks */}
      <div className="max-w-xl mx-auto">
        <SmoothTasksList
          tasks={filteredTasks}
          emptyState={
            <Card className='border-none bg-transparent'>
              <CardContent className="py-22 text-center text-sm">
                No tasks for this day
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
          selectedDate={selectedDate}
          className="sm:max-w-sm"
        />
      )}
    </div>
  );
};

export default DayDetailPage;