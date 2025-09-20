import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { FirebaseService } from '../services/firebaseService';
import toast from 'react-hot-toast';

export interface Attendance {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'late' | 'leave' | 'half-day';
  notes?: string;
  // Firebase fields
  userId?: string;
  createdAt?: any;
  updatedAt?: any;
  // Sync status
  syncError?: boolean;
  isOffline?: boolean;
}

interface AttendanceState {
  // Data
  attendance: Attendance[];
  isLoading: boolean;
  isInitialized: boolean;
  
  // Real-time listener
  unsubscribe?: () => void;
  
  // Actions
  initialize: () => Promise<void>;
  addAttendance: (attendance: Omit<Attendance, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAttendance: (id: string, updates: Partial<Attendance>) => Promise<void>;
  deleteAttendance: (id: string) => Promise<void>;
  
  // Utility actions
  getAttendanceById: (id: string) => Attendance | undefined;
  getAttendanceByStaff: (staffId: string) => Attendance[];
  getAttendanceByDate: (date: string) => Attendance[];
  getAttendanceByDateRange: (startDate: string, endDate: string) => Attendance[];
  
  // Cleanup
  cleanup: () => void;
}

export const useAttendanceStore = create<AttendanceState>()(
  devtools(
    (set, get) => ({
      // Initial state
      attendance: [],
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
            'attendance',
            (docs) => {
              set({ 
                attendance: docs,
                isInitialized: true,
                isLoading: false
              });
            },
            'date'
          );

          set({ unsubscribe });
        } catch (error) {
          console.error('Error initializing attendance store:', error);
          set({ isLoading: false });
          toast.error('Failed to load attendance data');
        }
      },

      // Add attendance with optimistic UI
      addAttendance: async (attendanceData) => {
        const state = get();
        
        // Generate temporary ID for optimistic UI
        const tempId = `temp-${Date.now()}`;
        const newAttendance: Attendance = {
          ...attendanceData,
          id: tempId,
          syncError: false,
          isOffline: false
        };

        // Optimistic update
        set({
          attendance: [...state.attendance, newAttendance]
        });

        try {
          // Add to Firebase
          const firebaseId = await FirebaseService.addDocument('attendance', attendanceData);
          
          // Update with real Firebase ID
          set({
            attendance: state.attendance.map(a => 
              a.id === tempId ? { ...a, id: firebaseId, syncError: false } : a
            )
          });

          toast.success('Attendance recorded successfully');
        } catch (error) {
          console.error('Error adding attendance:', error);
          
          // Mark as sync error
          set({
            attendance: state.attendance.map(a => 
              a.id === tempId ? { ...a, syncError: true, isOffline: true } : a
            )
          });

          toast.error('Failed to save attendance. Will retry when online.');
        }
      },

      // Update attendance with optimistic UI
      updateAttendance: async (id, updates) => {
        const state = get();
        const attendanceRecord = state.attendance.find(a => a.id === id);
        if (!attendanceRecord) return;

        // Optimistic update
        set({
          attendance: state.attendance.map(a => 
            a.id === id ? { ...a, ...updates, syncError: false } : a
          )
        });

        try {
          // Update in Firebase
          await FirebaseService.updateDocument('attendance', id, updates);
          toast.success('Attendance updated successfully');
        } catch (error) {
          console.error('Error updating attendance:', error);
          
          // Revert optimistic update and mark as sync error
          set({
            attendance: state.attendance.map(a => 
              a.id === id ? { ...attendanceRecord, syncError: true, isOffline: true } : a
            )
          });

          toast.error('Failed to update attendance. Will retry when online.');
        }
      },

      // Delete attendance with optimistic UI
      deleteAttendance: async (id) => {
        const state = get();
        const attendanceRecord = state.attendance.find(a => a.id === id);
        if (!attendanceRecord) return;

        // Optimistic update
        set({
          attendance: state.attendance.filter(a => a.id !== id)
        });

        try {
          // Delete from Firebase
          await FirebaseService.deleteDocument('attendance', id);
          toast.success('Attendance record deleted successfully');
        } catch (error) {
          console.error('Error deleting attendance:', error);
          
          // Restore attendance and mark as sync error
          set({
            attendance: [...state.attendance, { ...attendanceRecord, syncError: true, isOffline: true }]
          });

          toast.error('Failed to delete attendance. Will retry when online.');
        }
      },

      // Utility functions
      getAttendanceById: (id) => {
        const state = get();
        return state.attendance.find(a => a.id === id);
      },

      getAttendanceByStaff: (staffId) => {
        const state = get();
        return state.attendance.filter(a => a.staffId === staffId);
      },

      getAttendanceByDate: (date) => {
        const state = get();
        return state.attendance.filter(a => a.date === date);
      },

      getAttendanceByDateRange: (startDate, endDate) => {
        const state = get();
        return state.attendance.filter(a => a.date >= startDate && a.date <= endDate);
      },

      // Cleanup
      cleanup: () => {
        const state = get();
        if (state.unsubscribe) {
          state.unsubscribe();
        }
        set({ 
          attendance: [],
          isInitialized: false,
          unsubscribe: undefined
        });
      }
    }),
    {
      name: 'attendance-store'
    }
  )
);
