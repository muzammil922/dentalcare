import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { FirebaseService } from '../services/firebaseService';
import toast from 'react-hot-toast';

export interface Allowance {
  id: string;
  name: string;
  amount: number;
}

export interface Deduction {
  id: string;
  name: string;
  amount: number;
}

export interface Salary {
  id: string;
  staffId: string;
  staffName: string;
  month: string;
  year: number;
  basicSalary: number;
  allowances: Allowance[] | number;
  deductions: Deduction[] | number;
  totalSalary: number;
  status: 'pending' | 'paid';
  paymentDate?: string;
  department?: string;
  overtime?: number;
  bonus?: number;
  grossSalary?: number;
  netSalary?: number;
  // Attendance data
  presentDays?: number;
  absentDays?: number;
  leaveDays?: number;
  lateDays?: number;
  halfDays?: number;
  workingDays?: number;
  notes?: string;
  // Firebase fields
  userId?: string;
  createdAt?: any;
  updatedAt?: any;
  // Sync status
  syncError?: boolean;
  isOffline?: boolean;
}

interface SalaryState {
  // Data
  salaries: Salary[];
  isLoading: boolean;
  isInitialized: boolean;
  
  // Real-time listener
  unsubscribe?: () => void;
  
  // Actions
  initialize: () => Promise<void>;
  addSalary: (salary: Omit<Salary, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateSalary: (id: string, updates: Partial<Salary>) => Promise<void>;
  deleteSalary: (id: string) => Promise<void>;
  
  // Utility actions
  getSalaryById: (id: string) => Salary | undefined;
  getSalaryByStaff: (staffId: string) => Salary[];
  getSalaryByMonth: (month: string, year: number) => Salary[];
  getSalaryByStatus: (status: string) => Salary[];
  getTotalSalaryPaid: () => number;
  
  // Cleanup
  cleanup: () => void;
}

export const useSalaryStore = create<SalaryState>()(
  devtools(
    (set, get) => ({
      // Initial state
      salaries: [],
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
            'salaries',
            (docs) => {
              set({ 
                salaries: docs,
                isInitialized: true,
                isLoading: false
              });
            },
            'month'
          );

          set({ unsubscribe });
        } catch (error) {
          console.error('Error initializing salary store:', error);
          set({ isLoading: false });
          toast.error('Failed to load salary data');
        }
      },

      // Add salary with optimistic UI
      addSalary: async (salaryData) => {
        const state = get();
        
        // Generate temporary ID for optimistic UI
        const tempId = `temp-${Date.now()}`;
        const newSalary: Salary = {
          ...salaryData,
          id: tempId,
          syncError: false,
          isOffline: false
        };

        // Optimistic update
        set({
          salaries: [...state.salaries, newSalary]
        });

        try {
          // Add to Firebase
          const firebaseId = await FirebaseService.addDocument('salaries', salaryData);
          
          // Update with real Firebase ID
          set({
            salaries: state.salaries.map(s => 
              s.id === tempId ? { ...s, id: firebaseId, syncError: false } : s
            )
          });

          toast.success('Salary record created successfully');
        } catch (error) {
          console.error('Error adding salary:', error);
          
          // Mark as sync error
          set({
            salaries: state.salaries.map(s => 
              s.id === tempId ? { ...s, syncError: true, isOffline: true } : s
            )
          });

          toast.error('Failed to save salary. Will retry when online.');
        }
      },

      // Update salary with optimistic UI
      updateSalary: async (id, updates) => {
        const state = get();
        const salary = state.salaries.find(s => s.id === id);
        if (!salary) return;

        // Optimistic update
        set({
          salaries: state.salaries.map(s => 
            s.id === id ? { ...s, ...updates, syncError: false } : s
          )
        });

        try {
          // Update in Firebase
          await FirebaseService.updateDocument('salaries', id, updates);
          toast.success('Salary updated successfully');
        } catch (error) {
          console.error('Error updating salary:', error);
          
          // Revert optimistic update and mark as sync error
          set({
            salaries: state.salaries.map(s => 
              s.id === id ? { ...salary, syncError: true, isOffline: true } : s
            )
          });

          toast.error('Failed to update salary. Will retry when online.');
        }
      },

      // Delete salary with optimistic UI
      deleteSalary: async (id) => {
        const state = get();
        const salary = state.salaries.find(s => s.id === id);
        if (!salary) return;

        // Optimistic update
        set({
          salaries: state.salaries.filter(s => s.id !== id)
        });

        try {
          // Delete from Firebase
          await FirebaseService.deleteDocument('salaries', id);
          toast.success('Salary record deleted successfully');
        } catch (error) {
          console.error('Error deleting salary:', error);
          
          // Restore salary and mark as sync error
          set({
            salaries: [...state.salaries, { ...salary, syncError: true, isOffline: true }]
          });

          toast.error('Failed to delete salary. Will retry when online.');
        }
      },

      // Utility functions
      getSalaryById: (id) => {
        const state = get();
        return state.salaries.find(s => s.id === id);
      },

      getSalaryByStaff: (staffId) => {
        const state = get();
        return state.salaries.filter(s => s.staffId === staffId);
      },

      getSalaryByMonth: (month, year) => {
        const state = get();
        return state.salaries.filter(s => s.month === month && s.year === year);
      },

      getSalaryByStatus: (status) => {
        const state = get();
        return state.salaries.filter(s => s.status === status);
      },

      getTotalSalaryPaid: () => {
        const state = get();
        return state.salaries
          .filter(s => s.status === 'paid')
          .reduce((sum, s) => sum + s.totalSalary, 0);
      },

      // Cleanup
      cleanup: () => {
        const state = get();
        if (state.unsubscribe) {
          state.unsubscribe();
        }
        set({ 
          salaries: [],
          isInitialized: false,
          unsubscribe: undefined
        });
      }
    }),
    {
      name: 'salary-store'
    }
  )
);
