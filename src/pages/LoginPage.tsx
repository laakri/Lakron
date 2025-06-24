import React, { useState, useEffect, type FormEvent } from 'react';
import { dbOperations, type Profile } from '../services/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthProvider';

const LoginScreen: React.FC = () => {
  const [_profiles, setProfiles] = useState<Profile[]>([]);
  const [showCreateProfile, setShowCreateProfile] = useState<boolean>(false);
  const [newProfileName, setNewProfileName] = useState<string>('');
  const [newProfilePassword, setNewProfilePassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [loginPassword, setLoginPassword] = useState<string>('');

  const { login, createProfile } = useAuth();

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async (): Promise<void> => {
    try {
      const data = await dbOperations.getProfiles();
      setProfiles(data);
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  const handleLogin = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!loginPassword) {
      setError('Please enter your password');
      return;
    }
    setLoading(true);
    setError('');
    const result = await login(loginPassword);
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
    setLoading(false);
  };

  const handleCreateProfile = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!newProfileName || !newProfilePassword) {
      setError('Please enter name and password');
      return;
    }

    setLoading(true);
    setError('');

    const result = await createProfile(newProfileName, newProfilePassword);
    if (result.success) {
      await loadProfiles();
      setShowCreateProfile(false);
      setNewProfileName('');
      setNewProfilePassword('');
    } else {
      setError(result.error || 'Failed to create profile');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-semibold">Lakron Scheduler</h1>
          <p className="text-muted-foreground text-sm">Enter your password to continue</p>
        </div>

        {!showCreateProfile ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Password
              </label>
              <Input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                disabled={loading}
              placeholder="Enter your password"
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm text-center">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => setShowCreateProfile(true)}
                className="text-sm"
              >
                Create New Profile
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCreateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Profile Name
              </label>
              <Input
                type="text"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder="Enter your name"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Password
              </label>
              <Input
                type="password"
                value={newProfilePassword}
                onChange={(e) => setNewProfilePassword(e.target.value)}
                placeholder="Create a password"
                disabled={loading}
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm text-center">
                {error}
              </div>
            )}
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateProfile(false);
                  setError('');
                }}
                className="flex-1"
                disabled={loading}
              >
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Profile'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;
