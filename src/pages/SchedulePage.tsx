import React, { useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Task } from '@/types/task';
import { isTaskDueToday } from '@/utils/taskUtils';

// Types
interface SchedulePageProps {
  tasks: Task[];
  onNavigateBack: () => void;
  onNavigateToDay: (date: string) => void;
}

// Utilities
const getTodayString = (): string => new Date().toISOString().split('T')[0];

// Calendar Component
interface CalendarProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  tasks: Task[];
}

const Calendar: React.FC<CalendarProps> = ({ selectedDate, onDateSelect, tasks }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const today = new Date();
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  
  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  
  // Generate calendar days
  const calendarDays = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateStr = date.toISOString().split('T')[0];
    
    // Check for tasks due on this day, including recurring ones
    const dayTasks = tasks.filter(task => {
      // Create a temporary task object with the current date to check for recurrence
      const taskOnThisDay = { ...task, date: dateStr };
      if (!task.recurring) {
        return task.date === dateStr;
      }
      return isTaskDueToday(taskOnThisDay);
    });
    
    calendarDays.push({
      day,
      date: dateStr,
      isToday: dateStr === today.toISOString().split('T')[0],
      isSelected: dateStr === selectedDate,
      taskCount: dayTasks.length,
      completedCount: dayTasks.filter(t => t.completed).length,
      isPast: date < today && dateStr !== today.toISOString().split('T')[0]
    });
  }
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(year, month - 1));
  };
  
  const goToNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1));
  };
  
  return (
    <Card>
      <CardHeader>
        {/* Month Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPreviousMonth}
            className="p-1"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <CardTitle className="text-lg font-medium">
            {monthNames[month]} {year}
          </CardTitle>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextMonth}
            className="p-1"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        {/* Week Days */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs py-2">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => (
            <div key={index} className="aspect-square">
              {day ? (
                <Button
                  variant="ghost"
                  onClick={() => onDateSelect(day.date)}
                  className={`w-full h-full rounded-lg text-sm font-medium transition-all relative p-0 ${
                    day.isSelected
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : day.isToday
                      ? 'bg-blue-900 text-blue-100 border border-blue-600 hover:bg-blue-800'
                      : day.isPast
                      ? 'text-gray-600 hover:bg-gray-700'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`.replace(/bg-[^\s]+|text-[^\s]+|border-[^\s]+|hover:bg-[^\s]+/g, '')}
                >
                  <span>{day.day}</span>
                  {day.taskCount > 0 && (
                    <Badge
                      className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs p-0 flex items-center justify-center ${
                        day.completedCount === day.taskCount
                          ? 'bg-green-500 hover:bg-green-500 text-white'
                          : 'bg-orange-500 hover:bg-orange-500 text-white'
                      }`.replace(/bg-[^\s]+|text-[^\s]+|hover:bg-[^\s]+/g, '')}
                    >
                      {day.taskCount}
                    </Badge>
                  )}
                </Button>
              ) : (
                <div></div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Main Schedule Page Component
const SchedulePage: React.FC<SchedulePageProps> = ({ 
  tasks, 
  onNavigateBack, 
  onNavigateToDay 
}) => {
  const [selectedDate, setSelectedDate] = useState(getTodayString());

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    onNavigateToDay(date);
  };

  return (
    <div className="space-y-4 max-w-sm mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={onNavigateBack}
          className="flex items-center space-x-2 p-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-lg font-medium">Schedule</h2>
        <div className="w-20"></div>
      </div>

      {/* Calendar */}
      <Calendar
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
        tasks={tasks}
      />

      {/* Quick Stats */}
      {/* <Card className='p-2'>
        <CardHeader className='-mb-4'>
          <CardTitle className="text-sm">Quick Stats</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className='flex'>
              <Badge variant="outline" className="text-xs">
              <div className="text-xl font-bold">
                {tasks.filter(t => t.date === getTodayString()).length}
              </div>
                Today
              </Badge>
            </div>
            <div className='flex'>
              <Badge variant="outline" className="text-xs">
              <div className="text-xl font-bold">
                {tasks.filter(t => t.completed).length}
              </div>
                Completed
              </Badge>
            </div>
            
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
};

export default SchedulePage;