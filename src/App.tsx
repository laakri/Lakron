import React, { useState } from 'react';
import TodayPage from './pages/TodayPage';
import SchedulePage from './pages/SchedulePage';
import DayDetailPage from './pages/DayDetailPage';
import Layout from './pages/layout';
import { ThemeProvider } from '@/components/theme-provider';
import LoginScreen from './pages/LoginPage';
import { Loader2 } from 'lucide-react';
import { TaskProvider, useTaskContext } from './context/TaskProvider';
import { AuthProvider, useAuth } from './context/AuthProvider';


// === Router Hook ===
type Page = 'today' | 'schedule' | 'day-detail';
interface RouterState {
  currentPage: Page;
  selectedDate?: string;
}

const useRouter = () => {
  const [state, setState] = useState<RouterState>({ currentPage: 'today' });
  const navigate = (page: Page, selectedDate?: string) => setState({ currentPage: page, selectedDate });
  return { ...state, navigate };
};

// === Loading Component ===
const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="min-h-screen flex items-center justify-center ">
    <div className="text-center">
      <Loader2 className="animate-spin mx-auto mb-4" size={48} />
      <p>{message}</p>
    </div>
  </div>
);

// === Main App ===
const App: React.FC = () => {
  const { currentPage, selectedDate, navigate } = useRouter();
  const { tasks, addTask, toggleTask, searchQuery, setSearchQuery, isLoading } = useTaskContext();

  if (isLoading) {
    console.log('[App] Loading tasks...');
    return <LoadingSpinner message="Loading your schedule..." />;
  }

  const renderPage = () => {
    const pageProps = {
      tasks,
      onAddTask: addTask,
      onToggleTask: toggleTask,
      searchQuery,
      onSearchChange: setSearchQuery,
    };

    switch (currentPage) {
      case 'today':
        console.log('[App] Rendering TodayPage');
        return <TodayPage {...pageProps} onNavigateToSchedule={() => navigate('schedule')} />;
      case 'schedule':
        console.log('[App] Rendering SchedulePage');
        return <SchedulePage tasks={tasks} onNavigateBack={() => navigate('today')} onNavigateToDay={date => navigate('day-detail', date)} />;
      case 'day-detail':
        console.log('[App] Rendering DayDetailPage');
        return <DayDetailPage {...pageProps} selectedDate={selectedDate!} onNavigateBack={() => navigate('schedule')} />;
      default:
        console.log('[App] Rendering Default (TodayPage)');
        return <TodayPage {...pageProps} onNavigateToSchedule={() => navigate('schedule')} />;
    }
  };

  console.log('[App] Rendered with tasks:', tasks.length);
  return <Layout tasks={tasks}>{renderPage()}</Layout>;
};

// === Protected App ===
const ProtectedApp: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <LoginScreen />;
  return <TaskProvider><App /></TaskProvider>;
};

// === Root ===
const LakronScheduler: React.FC = () => (
  <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
    <AuthProvider>
      <ProtectedApp />
    </AuthProvider>
  </ThemeProvider>
);

export default LakronScheduler;