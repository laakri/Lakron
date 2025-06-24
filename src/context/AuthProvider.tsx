import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { dbOperations, type Profile } from '../services/supabase';

interface AuthContextType {
  currentProfile: Profile | null;
  isLoading: boolean;
  login: (password: string) => Promise<AuthResult>;
  createProfile: (name: string, password: string) => Promise<AuthResult>;
  logout: () => void;
  isAuthenticated: boolean;
}

interface AuthResult {
  success: boolean;
  error?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if user was previously logged in
    const savedProfile = localStorage.getItem('lakron_profile');
    if (savedProfile) {
      try {
        setCurrentProfile(JSON.parse(savedProfile));
      } catch (error) {
        console.error('Error parsing saved profile:', error);
        localStorage.removeItem('lakron_profile');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (password: string): Promise<AuthResult> => {
    try {
      const profile = await dbOperations.validateProfileByPassword(password);
      if (profile) {
        setCurrentProfile(profile);
        localStorage.setItem('lakron_profile', JSON.stringify(profile));
        return { success: true };
      } else {
        return { success: false, error: 'Invalid password' };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Login failed' };
    }
  };

  const createProfile = async (name: string, password: string): Promise<AuthResult> => {
    try {
      const profile = await dbOperations.createProfile(name, password);
      setCurrentProfile(profile);
      localStorage.setItem('lakron_profile', JSON.stringify(profile));
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create profile' 
      };
    }
  };

  const logout = (): void => {
    setCurrentProfile(null);
    localStorage.removeItem('lakron_profile');
  };

  const value: AuthContextType = {
    currentProfile,
    isLoading,
    login,
    createProfile,
    logout,
    isAuthenticated: !!currentProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};


