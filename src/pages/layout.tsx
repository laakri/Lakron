import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface LayoutProps {
  children: React.ReactNode;
  tasks?: { completed: boolean; date: string }[];
}

const Layout: React.FC<LayoutProps> = ({ children, tasks = [] }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(task => task.date === today);
  const completedCount = todayTasks.filter(t => t.completed).length;

  return (
    <div className="min-h-screen bg-background relative">
      {/* Header Section - Always at top */}
      <div className="w-full pt-8 pb-6">
        <div className="max-w-md mx-auto px-4">
          <Card className="bg-transparent border-none">
            <CardContent className="text-center">
              <div className="text-5xl font-light tabular-nums">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="my-2 text-2xl">
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long', month: 'long', day: 'numeric' 
                })}
              </div>
              {tasks.length > 0 && (
                <Badge variant="outline">
                  {completedCount}/{todayTasks.length} completed today
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content Section - Below header */}
      <div className="w-full max-w-2xl mx-auto px-4 mt-6 pb-24">
        {children}
      </div>
    </div>
  );
};

export default Layout;