import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { FirebaseService } from '../services/firebaseService';
import toast from 'react-hot-toast';

export interface Report {
  id: string;
  name: string;
  type: string;
  format?: string;
  date: string;
  size: string;
  data: any;
  timestamp: number;
  // Firebase fields
  userId?: string;
  createdAt?: any;
  updatedAt?: any;
  // Sync status
  syncError?: boolean;
  isOffline?: boolean;
}

interface ReportsState {
  // Data
  reports: Report[];
  isLoading: boolean;
  isInitialized: boolean;
  
  // Real-time listener
  unsubscribe?: () => void;
  
  // Actions
  initialize: () => Promise<void>;
  addReport: (report: Omit<Report, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateReport: (id: string, updates: Partial<Report>) => Promise<void>;
  deleteReport: (id: string) => Promise<void>;
  
  // Utility actions
  getReportById: (id: string) => Report | undefined;
  getReportsByType: (type: string) => Report[];
  getReportsByDateRange: (startDate: string, endDate: string) => Report[];
  getRecentReports: (limit?: number) => Report[];
  
  // Cleanup
  cleanup: () => void;
}

export const useReportsStore = create<ReportsState>()(
  devtools(
    (set, get) => ({
      // Initial state
      reports: [],
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
            'reports',
            (docs) => {
              set({ 
                reports: docs,
                isInitialized: true,
                isLoading: false
              });
            },
            'createdAt'
          );

          set({ unsubscribe });
        } catch (error) {
          console.error('Error initializing reports store:', error);
          set({ isLoading: false });
          toast.error('Failed to load reports data');
        }
      },

      // Add report with optimistic UI
      addReport: async (reportData) => {
        const state = get();
        
        // Generate temporary ID for optimistic UI
        const tempId = `temp-${Date.now()}`;
        const newReport: Report = {
          ...reportData,
          id: tempId,
          syncError: false,
          isOffline: false
        };

        // Optimistic update
        set({
          reports: [...state.reports, newReport]
        });

        try {
          // Add to Firebase
          const firebaseId = await FirebaseService.addDocument('reports', reportData);
          
          // Update with real Firebase ID
          set({
            reports: state.reports.map(r => 
              r.id === tempId ? { ...r, id: firebaseId, syncError: false } : r
            )
          });

          toast.success('Report generated successfully');
        } catch (error) {
          console.error('Error adding report:', error);
          
          // Mark as sync error
          set({
            reports: state.reports.map(r => 
              r.id === tempId ? { ...r, syncError: true, isOffline: true } : r
            )
          });

          toast.error('Failed to save report. Will retry when online.');
        }
      },

      // Update report with optimistic UI
      updateReport: async (id, updates) => {
        const state = get();
        const report = state.reports.find(r => r.id === id);
        if (!report) return;

        // Optimistic update
        set({
          reports: state.reports.map(r => 
            r.id === id ? { ...r, ...updates, syncError: false } : r
          )
        });

        try {
          // Update in Firebase
          await FirebaseService.updateDocument('reports', id, updates);
          toast.success('Report updated successfully');
        } catch (error) {
          console.error('Error updating report:', error);
          
          // Revert optimistic update and mark as sync error
          set({
            reports: state.reports.map(r => 
              r.id === id ? { ...report, syncError: true, isOffline: true } : r
            )
          });

          toast.error('Failed to update report. Will retry when online.');
        }
      },

      // Delete report with optimistic UI
      deleteReport: async (id) => {
        const state = get();
        const report = state.reports.find(r => r.id === id);
        if (!report) return;

        // Optimistic update
        set({
          reports: state.reports.filter(r => r.id !== id)
        });

        try {
          // Delete from Firebase
          await FirebaseService.deleteDocument('reports', id);
          toast.success('Report deleted successfully');
        } catch (error) {
          console.error('Error deleting report:', error);
          
          // Restore report and mark as sync error
          set({
            reports: [...state.reports, { ...report, syncError: true, isOffline: true }]
          });

          toast.error('Failed to delete report. Will retry when online.');
        }
      },

      // Utility functions
      getReportById: (id) => {
        const state = get();
        return state.reports.find(r => r.id === id);
      },

      getReportsByType: (type) => {
        const state = get();
        return state.reports.filter(r => r.type === type);
      },

      getReportsByDateRange: (startDate, endDate) => {
        const state = get();
        return state.reports.filter(r => r.date >= startDate && r.date <= endDate);
      },

      getRecentReports: (limit = 10) => {
        const state = get();
        return state.reports
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, limit);
      },

      // Cleanup
      cleanup: () => {
        const state = get();
        if (state.unsubscribe) {
          state.unsubscribe();
        }
        set({ 
          reports: [],
          isInitialized: false,
          unsubscribe: undefined
        });
      }
    }),
    {
      name: 'reports-store'
    }
  )
);
