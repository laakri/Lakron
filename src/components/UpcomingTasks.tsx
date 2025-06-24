import React from 'react';
import { useTaskContext } from '../context/TaskProvider';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { CalendarDays, Clock, Repeat } from 'lucide-react';

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

const recurrenceStyles: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  daily: {
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    label: 'Daily',
    icon: <Repeat className="w-3 h-3" />,
  },
  weekly: {
    color: 'bg-green-100 text-green-700 border-green-300',
    label: 'Weekly',
    icon: <Repeat className="w-3 h-3" />,
  },
  monthly: {
    color: 'bg-purple-100 text-purple-700 border-purple-300',
    label: 'Monthly',
    icon: <Repeat className="w-3 h-3" />,
  },
  yearly: {
    color: 'bg-orange-100 text-orange-700 border-orange-300',
    label: 'Yearly',
    icon: <Repeat className="w-3 h-3" />,
  },
  custom: {
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    label: 'Custom',
    icon: <Repeat className="w-3 h-3" />,
  },
};

const UpcomingTasks: React.FC = () => {
  const { upcomingTasks, isLoading } = useTaskContext();

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading upcoming tasks...</div>;
  }

  if (!upcomingTasks.length) {
    return (
      <Card className="bg-dark-card border-none my-4">
        <CardContent className="py-8 text-center text-muted-foreground">
          <CalendarDays className="mx-auto mb-2 w-6 h-6 opacity-60" />
          No upcoming tasks in the next week
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {upcomingTasks.map(group => (
        <Card key={group.date} className="bg-dark-card border border-dark-border">
          <CardContent className="py-4">
            <div className="flex items-center gap-3 mb-2">
              <CalendarDays className="w-4 h-4 text-blue-400" />
              <span className="font-semibold text-lg text-white">{group.dayName}</span>
              <span className="text-sm text-muted-foreground">{group.date}</span>
              <Badge variant="outline" className="ml-2 text-xs bg-blue-900/30 border-blue-700 text-blue-200">
                {group.daysFromNow === 1 ? 'Tomorrow' : `${group.daysFromNow} days`}
              </Badge>
            </div>
            <div className="space-y-2">
              {group.tasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg bg-dark-bg/60 hover:bg-dark-bg/80 transition">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[task.priority]}`}>{priorityLabels[task.priority]}</span>
                  <span className="font-medium text-white">{task.title}</span>
                  <Badge variant="outline" className="flex items-center gap-1 border border-gray-600 bg-gray-800 text-gray-200">
                    <Clock className="w-3 h-3" />
                    {task.time}
                  </Badge>
                  {task.recurring && (
                    (() => {
                      const rule = (task.recurrence_rule || '').toLowerCase();
                      const style = recurrenceStyles[rule] || recurrenceStyles['custom'];
                      return (
                        <Badge
                          variant="outline"
                          className={`flex items-center gap-1 border ${style.color} px-2 py-0.5 rounded-full text-xs font-semibold`}
                          title={style.label}
                        >
                          {style.icon}
                          {style.label}
                        </Badge>
                      );
                    })()
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default UpcomingTasks; 