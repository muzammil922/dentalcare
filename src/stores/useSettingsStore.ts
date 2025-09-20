import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { FirebaseService } from '../services/firebaseService';
import toast from 'react-hot-toast';

export interface ClinicInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  website: string;
  profileImage?: string;
  logo?: string;
  // Firebase fields
  userId?: string;
  createdAt?: any;
  updatedAt?: any;
  // Sync status
  syncError?: boolean;
  isOffline?: boolean;
}

export interface UserInfo {
  name: string;
  email: string;
  // Firebase fields
  userId?: string;
  createdAt?: any;
  updatedAt?: any;
  // Sync status
  syncError?: boolean;
  isOffline?: boolean;
}

interface SettingsState {
  // Data
  clinicInfo: ClinicInfo;
  userInfo: UserInfo;
  isLoading: boolean;
  isInitialized: boolean;
  
  // Real-time listener
  unsubscribe?: () => void;
  
  // Actions
  initialize: () => Promise<void>;
  updateClinicInfo: (updates: Partial<ClinicInfo>) => Promise<void>;
  updateUserInfo: (updates: Partial<UserInfo>) => Promise<void>;
  
  // Utility actions
  getClinicInfo: () => ClinicInfo;
  getUserInfo: () => UserInfo;
  
  // Cleanup
  cleanup: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  devtools(
    (set, get) => ({
      // Initial state
      clinicInfo: {
        name: 'Dental Care Pro',
        address: '123 Main Street, City, State 12345',
        phone: '+1 (555) 123-4567',
        email: 'info@dentalcarepro.com',
        hours: 'Mon-Fri: 9:00 AM - 6:00 PM, Sat: 9:00 AM - 2:00 PM',
        website: 'www.dentalcarepro.com',
        syncError: false,
        isOffline: false
      },
      userInfo: {
        name: 'Admin User',
        email: 'admin@dentalcarepro.com',
        syncError: false,
        isOffline: false
      },
      isLoading: false,
      isInitialized: false,
      unsubscribe: undefined,

      // Initialize store with Firebase data
      initialize: async () => {
        const state = get();
        if (state.isInitialized) return;

        set({ isLoading: true });

        try {
          // For now, just mark as initialized without Firebase calls
          // Settings will be handled locally until Firebase permissions are fixed
          set({ isInitialized: true, isLoading: false });
        } catch (error) {
          console.error('Error initializing settings store:', error);
          set({ isLoading: false });
          // Don't show error toast for settings
        }
      },

      // Update clinic info with optimistic UI
      updateClinicInfo: async (updates) => {
        const state = get();
        
        // Optimistic update
        set({
          clinicInfo: { ...state.clinicInfo, ...updates, syncError: false }
        });

        try {
          // For now, just update locally
          // Firebase sync will be added later
          toast.success('Clinic information updated successfully');
        } catch (error) {
          console.error('Error updating clinic info:', error);
          toast.error('Failed to update clinic info.');
        }
      },

      // Update user info with optimistic UI
      updateUserInfo: async (updates) => {
        const state = get();
        
        // Optimistic update
        set({
          userInfo: { ...state.userInfo, ...updates, syncError: false }
        });

        try {
          // For now, just update locally
          // Firebase sync will be added later
          toast.success('User information updated successfully');
        } catch (error) {
          console.error('Error updating user info:', error);
          toast.error('Failed to update user info.');
        }
      },

      // Utility functions
      getClinicInfo: () => {
        const state = get();
        return state.clinicInfo;
      },

      getUserInfo: () => {
        const state = get();
        return state.userInfo;
      },

      // Cleanup
      cleanup: () => {
        const state = get();
        if (state.unsubscribe) {
          state.unsubscribe();
        }
        set({ 
          isInitialized: false,
          unsubscribe: undefined
        });
      }
    }),
    {
      name: 'settings-store'
    }
  )
);
