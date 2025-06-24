// services/supabase.ts
import { createClient, RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'
import * as argon2 from 'argon2-wasm-esm'
import CryptoJS from 'crypto-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
// Database Types
export interface Profile {
  id: number;
  name: string;
  password: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  time: string;
  date: string;
  completed: boolean;
  type: 'task' | 'event';
  description?: string;
  profile_id: number;
  created_at: string;
  priority: number; // 1=High, 2=Medium, 3=Low
  recurring: boolean;
  recurrence_rule?: string;
  completedDates?: string[];
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'id' | 'created_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      tasks: {
        Row: Task;
        Insert: Omit<Task, 'id' | 'created_at'>;
        Update: Partial<Omit<Task, 'id' | 'created_at'>>;
      };
    };
  };
}

export const supabase: SupabaseClient<Database> = createClient(supabaseUrl, supabaseKey)


let connectionState = {
  isConnecting: false,
  activeChannels: new Map<string, RealtimeChannel>(),
  retryCount: 0,
  maxRetries: 3
}



// Helper functions
function encrypt(text: string, key: string): string {
  return CryptoJS.AES.encrypt(text, key).toString();
}
function decrypt(cipher: string, key: string): string {
  return CryptoJS.AES.decrypt(cipher, key).toString(CryptoJS.enc.Utf8);
}

// Database operations
export const dbOperations = {
  // Profile operations
  async getProfiles(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data || []
  },

  async createProfile(name: string, password: string): Promise<Profile> {
    // Hash the password before storing using argon2-wasm-esm
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const result = await argon2.hash({
      pass: password,
      salt,
      type: argon2.ArgonType.Argon2id,
      hashLen: 32,
      time: 3,
      mem: 4096,
      parallelism: 1,
    });
    
    // First, check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('name', name)
      .single();
    
    if (existingProfile) {
      throw new Error('Profile with this name already exists');
    }
    
    // Create new profile
    const { data, error } = await supabase
      .from('profiles')
      .insert([{ name, password: result.encoded }])
      .select()
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('Failed to create profile');
    
    // Verify the profile was created
    const { data: verifiedProfile, error: verifyError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.id)
      .single();
    
    if (verifyError || !verifiedProfile) {
      throw new Error('Failed to verify profile creation');
    }
    
    return verifiedProfile;
  },

  async validateProfile(name: string, password: string): Promise<Profile | null> {
    // Find the profile by name
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('name', name)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    if (!data) return null

    // Verify the password using argon2-wasm-esm
    try {
      await argon2.verify({
        pass: password,
        encoded: data.password,
      });
      
      return data;
    } catch (error) {
      console.error('Password verification failed:', error);
      return null;
    }
  },

  async validateProfileByPassword(password: string): Promise<Profile | null> {
    // Fetch all profiles
    const { data, error } = await supabase
      .from('profiles')
      .select('*');
    if (error) throw error;
    if (!data) return null;

    // Check each profile for a matching password
    for (const profile of data) {
      try {
        await argon2.verify({
          pass: password,
          encoded: profile.password,
        });
        // If no error, password matches!
        console.log(`[validateProfileByPassword] Password MATCH for profile: ${profile.name}`);
        return profile;
      } catch (e) {
        console.warn(`[validateProfileByPassword] Password did NOT match for profile: ${profile.name}, hash: ${profile.password}`, e);
      }
    }
    console.log('[validateProfileByPassword] No matching profile found for password');
    return null;
  },

  // Task operations
  async getTasks(profileId: number, encryptionKey: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('profile_id', profileId)
      .order('date', { ascending: true })
      .order('time', { ascending: true })
    if (error) throw error
    return (data || []).map(task => ({
      ...task,
      title: decrypt(task.title, encryptionKey),
      description: task.description ? decrypt(task.description, encryptionKey) : undefined,
      completedDates: task.completedDates || [],
    }))
  },

  async addTask(task: Omit<Task, 'id' | 'created_at'>, profileId: number, encryptionKey: string): Promise<Task> {
    // Encrypt fields
    const encryptedTask = {
      ...task,
      title: encrypt(task.title, encryptionKey),
      description: task.description ? encrypt(task.description, encryptionKey) : undefined,
      profile_id: profileId,
      completedDates: task.completedDates || [],
    };
    const { data, error } = await supabase
      .from('tasks')
      .insert([encryptedTask])
      .select()
      .single();
    if (error) throw error;
    // Decrypt before returning
    return {
      ...data,
      title: decrypt(data.title, encryptionKey),
      description: data.description ? decrypt(data.description, encryptionKey) : undefined,
      completedDates: data.completedDates || [],
    };
  },

  async updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'created_at'>>): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async deleteTask(id: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // Real-time subscription for tasks
  subscribeToTasks: (profileId: number, callback: (payload: any) => void) => {
    const channelName = `tasks-changes-${profileId}`;
    // Check if channel already exists
    if (connectionState.activeChannels.has(channelName)) {
      const existingChannel = connectionState.activeChannels.get(channelName);
      if (existingChannel) {
        supabase.removeChannel(existingChannel);
        connectionState.activeChannels.delete(channelName);
      }
    }
    // Prevent multiple concurrent connections
    if (connectionState.isConnecting) {
      return () => {}; // Return empty cleanup function
    }
    connectionState.isConnecting = true;
    const channel = supabase.channel(channelName, {
      config: {
        presence: { key: `user-${profileId}` },
        broadcast: { self: false },
      }
    })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `profile_id=eq.${profileId}`
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe((status) => {
        connectionState.isConnecting = false;
        switch (status) {
          case 'SUBSCRIBED':
            connectionState.activeChannels.set(channelName, channel);
            connectionState.retryCount = 0;
            break;
          case 'CHANNEL_ERROR':
            connectionState.activeChannels.delete(channelName);
            if (connectionState.retryCount < connectionState.maxRetries) {
              connectionState.retryCount++;
              setTimeout(() => {
                dbOperations.subscribeToTasks(profileId, callback);
              }, 2000 * connectionState.retryCount);
            }
            break;
          case 'TIMED_OUT':
            connectionState.activeChannels.delete(channelName);
            break;
          case 'CLOSED':
            connectionState.activeChannels.delete(channelName);
            break;
        }
      });
    // Return cleanup function
    return () => {
      connectionState.isConnecting = false;
      if (connectionState.activeChannels.has(channelName)) {
        const channelToRemove = connectionState.activeChannels.get(channelName);
        if (channelToRemove) {
          supabase.removeChannel(channelToRemove);
          connectionState.activeChannels.delete(channelName);
        }
      }
    };
  },

  // Helper method to check connection health
  getConnectionStatus: () => {
    return {
      isConnecting: connectionState.isConnecting,
      activeChannels: Array.from(connectionState.activeChannels.keys()),
      retryCount: connectionState.retryCount
    };
  },

  // Method to force cleanup all connections
  cleanupAllConnections: () => {
    connectionState.activeChannels.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    connectionState.activeChannels.clear();
    connectionState.isConnecting = false;
    connectionState.retryCount = 0;
  }
}