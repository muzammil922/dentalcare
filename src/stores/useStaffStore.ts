import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { FirebaseService } from '../services/firebaseService';
import toast from 'react-hot-toast';

export interface Staff {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  joinDate: string;
  status: 'active' | 'inactive' | 'on_leave';
  salary?: number;
  // Additional fields from Staff Details modal
  gender?: 'male' | 'female' | 'other';
  age?: number;
  address?: string;
  qualifications?: string;
  experience?: string;
  jobTerm?: 'permanent' | 'contract' | 'temporary';
  department?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  notes?: string;
  // Firebase fields
  userId?: string;
  createdAt?: any;
  updatedAt?: any;
  // Sync status
  syncError?: boolean;
  isOffline?: boolean;
}

interface StaffState {
  // Data
  staff: Staff[];
  isLoading: boolean;
  isInitialized: boolean;
  
  // Real-time listener
  unsubscribe?: () => void;
  
  // Actions
  initialize: () => Promise<void>;
  addStaff: (staff: Omit<Staff, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateStaff: (id: string, updates: Partial<Staff>) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
  
  // Utility actions
  getStaffById: (id: string) => Staff | undefined;
  getActiveStaff: () => Staff[];
  getStaffByDepartment: (department: string) => Staff[];
  
  // Cleanup
  cleanup: () => void;
}

export const useStaffStore = create<StaffState>()(
  devtools(
    (set, get) => ({
      // Initial state
      staff: [],
      isLoading: false,
      isInitialized: false,
      unsubscribe: undefined,

      // Initialize store with Firebase data
      initialize: async () => {
        const state = get();
        if (state.isInitialized) return;

        set({ isLoading: true });

        try {
          // Set up real-time listener
          const unsubscribe = FirebaseService.subscribeToCollection(
            'staff',
            (docs) => {
              set({ 
                staff: docs,
                isInitialized: true,
                isLoading: false
              });
            },
            'createdAt'
          );

          set({ unsubscribe });
        } catch (error) {
          console.error('Error initializing staff store:', error);
          set({ isLoading: false });
          toast.error('Failed to load staff data');
        }
      },

      // Add staff with optimistic UI
      addStaff: async (staffData) => {
        const state = get();
        
        // Generate temporary ID for optimistic UI
        const tempId = `temp-${Date.now()}`;
        const newStaff: Staff = {
          ...staffData,
          id: tempId,
          syncError: false,
          isOffline: false
        };

        // Optimistic update
        set({
          staff: [...state.staff, newStaff]
        });

        try {
          // Add to Firebase
          const firebaseId = await FirebaseService.addDocument('staff', staffData);
          
          // Update with real Firebase ID
          set({
            staff: state.staff.map(s => 
              s.id === tempId ? { ...s, id: firebaseId, syncError: false } : s
            )
          });

          toast.success('Staff member added successfully');
        } catch (error) {
          console.error('Error adding staff:', error);
          
          // Mark as sync error
          set({
            staff: state.staff.map(s => 
              s.id === tempId ? { ...s, syncError: true, isOffline: true } : s
            )
          });

          toast.error('Failed to save staff member. Will retry when online.');
        }
      },

      // Update staff with optimistic UI
      updateStaff: async (id, updates) => {
        const state = get();
        const staffMember = state.staff.find(s => s.id === id);
        if (!staffMember) return;

        // Optimistic update
        set({
          staff: state.staff.map(s => 
            s.id === id ? { ...s, ...updates, syncError: false } : s
          )
        });

        try {
          // Update in Firebase
          await FirebaseService.updateDocument('staff', id, updates);
          toast.success('Staff member updated successfully');
        } catch (error) {
          console.error('Error updating staff:', error);
          
          // Revert optimistic update and mark as sync error
          set({
            staff: state.staff.map(s => 
              s.id === id ? { ...staffMember, syncError: true, isOffline: true } : s
            )
          });

          toast.error('Failed to update staff member. Will retry when online.');
        }
      },

      // Delete staff with optimistic UI
      deleteStaff: async (id) => {
        const state = get();
        const staffMember = state.staff.find(s => s.id === id);
        if (!staffMember) return;

        // Optimistic update
        set({
          staff: state.staff.filter(s => s.id !== id)
        });

        try {
          // Delete from Firebase
          await FirebaseService.deleteDocument('staff', id);
          toast.success('Staff member deleted successfully');
        } catch (error) {
          console.error('Error deleting staff:', error);
          
          // Restore staff member and mark as sync error
          set({
            staff: [...state.staff, { ...staffMember, syncError: true, isOffline: true }]
          });

          toast.error('Failed to delete staff member. Will retry when online.');
        }
      },

      // Utility functions
      getStaffById: (id) => {
        const state = get();
        return state.staff.find(s => s.id === id);
      },

      getActiveStaff: () => {
        const state = get();
        return state.staff.filter(s => s.status === 'active');
      },

      getStaffByDepartment: (department) => {
        const state = get();
        return state.staff.filter(s => s.department === department);
      },

      // Cleanup
      cleanup: () => {
        const state = get();
        if (state.unsubscribe) {
          state.unsubscribe();
        }
        set({ 
          staff: [],
          isInitialized: false,
          unsubscribe: undefined
        });
      }
    }),
    {
      name: 'staff-store'
    }
  )
);
