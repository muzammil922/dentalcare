import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { FirebaseService } from '../services/firebaseService';
import toast from 'react-hot-toast';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientGender: 'male' | 'female' | 'other';
  date: string;
  time: string;
  duration?: string;
  type: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  priority: 'normal' | 'high' | 'urgent';
  reminder?: string;
  notes?: string;
  createdAt: string;
  // Firebase fields
  userId?: string;
  updatedAt?: any;
  // Sync status
  syncError?: boolean;
  isOffline?: boolean;
}

interface AppointmentsState {
  // Data
  appointments: Appointment[];
  isLoading: boolean;
  isInitialized: boolean;
  
  // Real-time listener
  unsubscribe?: () => void;
  
  // Actions
  initialize: () => Promise<void>;
  addAppointment: (appointment: Omit<Appointment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAppointment: (id: string, updates: Partial<Appointment>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  
  // Utility actions
  getAppointmentById: (id: string) => Appointment | undefined;
  getAppointmentsByDate: (date: string) => Appointment[];
  getAppointmentsByPatient: (patientId: string) => Appointment[];
  
  // Cleanup
  cleanup: () => void;
}

export const useAppointmentsStore = create<AppointmentsState>()(
  devtools(
    (set, get) => ({
      // Initial state
      appointments: [],
      isLoading: false,
      isInitialized: false,
      unsubscribe: undefined,

      // Initialize store with Firebase data
      initialize: async () => {
        const state = get();
        if (state.isInitialized) {
          console.log('Appointments store already initialized');
          return;
        }

        console.log('Initializing appointments store...');
        set({ isLoading: true });

        try {
          // Set up real-time listener
          const unsubscribe = FirebaseService.subscribeToCollection(
            'appointments',
            (docs) => {
              console.log('Appointments data received:', docs.length, 'documents');
              set({ 
                appointments: docs,
                isInitialized: true,
                isLoading: false
              });
            },
            'date'
          );

          set({ unsubscribe });
        } catch (error) {
          console.error('Error initializing appointments store:', error);
          set({ isLoading: false, isInitialized: true });
          // Don't show error toast, just log it
        }
      },

      // Add appointment with optimistic UI
      addAppointment: async (appointmentData) => {
        const state = get();
        
        // Generate temporary ID for optimistic UI
        const tempId = `temp-${Date.now()}`;
        const newAppointment: Appointment = {
          ...appointmentData,
          id: tempId,
          syncError: false,
          isOffline: false
        };

        // Optimistic update
        set({
          appointments: [...state.appointments, newAppointment]
        });

        try {
          // Add to Firebase
          const firebaseId = await FirebaseService.addDocument('appointments', appointmentData);
          
          // Update with real Firebase ID
          set({
            appointments: state.appointments.map(a => 
              a.id === tempId ? { ...a, id: firebaseId, syncError: false } : a
            )
          });

          toast.success('Appointment scheduled successfully');
        } catch (error) {
          console.error('Error adding appointment:', error);
          
          // Mark as sync error
          set({
            appointments: state.appointments.map(a => 
              a.id === tempId ? { ...a, syncError: true, isOffline: true } : a
            )
          });

          toast.error('Failed to save appointment. Will retry when online.');
        }
      },

      // Update appointment with optimistic UI
      updateAppointment: async (id, updates) => {
        const state = get();
        const appointment = state.appointments.find(a => a.id === id);
        if (!appointment) return;

        // Optimistic update
        set({
          appointments: state.appointments.map(a => 
            a.id === id ? { ...a, ...updates, syncError: false } : a
          )
        });

        try {
          // Update in Firebase
          await FirebaseService.updateDocument('appointments', id, updates);
          toast.success('Appointment updated successfully');
        } catch (error) {
          console.error('Error updating appointment:', error);
          
          // Revert optimistic update and mark as sync error
          set({
            appointments: state.appointments.map(a => 
              a.id === id ? { ...appointment, syncError: true, isOffline: true } : a
            )
          });

          toast.error('Failed to update appointment. Will retry when online.');
        }
      },

      // Delete appointment with optimistic UI
      deleteAppointment: async (id) => {
        const state = get();
        const appointment = state.appointments.find(a => a.id === id);
        if (!appointment) return;

        // Optimistic update
        set({
          appointments: state.appointments.filter(a => a.id !== id)
        });

        try {
          // Delete from Firebase
          await FirebaseService.deleteDocument('appointments', id);
          toast.success('Appointment deleted successfully');
        } catch (error) {
          console.error('Error deleting appointment:', error);
          
          // Restore appointment and mark as sync error
          set({
            appointments: [...state.appointments, { ...appointment, syncError: true, isOffline: true }]
          });

          toast.error('Failed to delete appointment. Will retry when online.');
        }
      },

      // Utility functions
      getAppointmentById: (id) => {
        const state = get();
        return state.appointments.find(a => a.id === id);
      },

      getAppointmentsByDate: (date) => {
        const state = get();
        return state.appointments.filter(a => a.date === date);
      },

      getAppointmentsByPatient: (patientId) => {
        const state = get();
        return state.appointments.filter(a => a.patientId === patientId);
      },

      // Cleanup
      cleanup: () => {
        const state = get();
        if (state.unsubscribe) {
          state.unsubscribe();
        }
        set({ 
          appointments: [],
          isInitialized: false,
          unsubscribe: undefined
        });
      }
    }),
    {
      name: 'appointments-store'
    }
  )
);
