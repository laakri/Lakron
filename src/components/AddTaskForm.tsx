import React, { useState } from 'react';
import { Clock, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { NewTask, RecurrenceRule } from '@/types/task';

interface AddTaskFormProps {
  onAdd: (task: NewTask) => void;
  onCancel: () => void;
  selectedDate: string;
  className?: string;
}

const AddTaskForm: React.FC<AddTaskFormProps> = ({ 
  onAdd, 
  onCancel, 
  selectedDate,
  className = "sm:max-w-lg" // Default to larger size, can be overridden
}) => {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [date, setDate] = useState(selectedDate);
  const [type, setType] = useState<'task' | 'event'>('task');
  const [priority, setPriority] = useState(2); // 2 = Medium
  const [recurring, setRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule | undefined>(undefined);

  const handleSubmit = () => {
    if (title.trim() && time && date) {
      onAdd({
        title: title.trim(),
        time,
        date,
        type,
        completed: false,
        priority,
        recurring,
        recurrence_rule: recurring ? recurrenceRule : undefined,
      });
      
      // Reset form
      setTitle('');
      setTime('');
      setDate(selectedDate);
      setType('task');
      setPriority(2);
      setRecurring(false);
      setRecurrenceRule(undefined);
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className={className} aria-describedby="task-form-description">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
        </DialogHeader>
        <div id="task-form-description" className="sr-only">
          Form to add a new task or event to your schedule. Fill in the details like title, date, time, and type.
        </div>

        <div className="space-y-6">
          {/* Title Input */}
          <div>
            <Input
              type="text"
              placeholder="What do you need to do?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          {/* Time and Date Row */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              Time
            </label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="bg-muted/50 border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center">
              <CalendarDays className="w-3 h-3 mr-1" />
              Date
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-muted/50 border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
            />
          </div>

          {/* Priority Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Priority</label>
            <select
              className="w-full rounded-md border border-gray-300 p-2 bg-muted/50"
              value={priority}
              onChange={e => setPriority(Number(e.target.value))}
            >
              <option value={1}>High</option>
              <option value={2}>Medium</option>
              <option value={3}>Low</option>
            </select>
          </div>

          {/* Recurring Checkbox and Rule */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <input
                type="checkbox"
                checked={recurring}
                onChange={e => setRecurring(e.target.checked)}
              />
              Recurring
            </label>
            {recurring && (
              <select
                className="w-full rounded-md border border-gray-300 p-2 bg-muted/50"
                value={recurrenceRule || ''}
                onChange={e => {
                  const value = e.target.value;
                  setRecurrenceRule(value ? value as RecurrenceRule : undefined);
                }}
              >
                <option value="">Select recurrence</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="custom">Custom</option>
              </select>
            )}
          </div>

          {/* Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Type</label>
            <div className="flex bg-muted rounded-lg p-1">
              <Button
                variant={type === 'task' ? 'default' : 'ghost'}
                onClick={() => setType('task')}
                className="flex-1 h-8"
                size="sm"
              >
                Task
              </Button>
              <Button
                variant={type === 'event' ? 'default' : 'ghost'}
                onClick={() => setType('event')}
                className="flex-1 h-8"
                size="sm"
              >
                Event
              </Button>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || !time || !date}
            className="w-full transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Add {type}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddTaskForm; 