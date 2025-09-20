import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { FirebaseService } from '../services/firebaseService';
import toast from 'react-hot-toast';

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email: string;
  address: string;
  medicalHistory: string;
  status: 'active' | 'inactive' | 'pending';
  registrationDate: string;
  lastVisit?: string;
  notes?: string;
  // Firebase fields
  userId?: string;
  createdAt?: any;
  updatedAt?: any;
  // Sync status
  syncError?: boolean;
  isOffline?: boolean;
}

interface PatientsState {
  // Data
  patients: Patient[];
  isLoading: boolean;
  isInitialized: boolean;
  
  // Real-time listener
  unsubscribe?: () => void;
  
  // Actions
  initialize: () => Promise<void>;
  addPatient: (patient: Omit<Patient, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePatient: (id: string, updates: Partial<Patient>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  
  // Utility actions
  getPatientById: (id: string) => Patient | undefined;
  getPatientsForSelect: () => { value: string; label: string }[];
  
  // Cleanup
  cleanup: () => void;
}

export const usePatientsStore = create<PatientsState>()(
  devtools(
    (set, get) => ({
      // Initial state
      patients: [],
      isLoading: false,
      isInitialized: false,
      unsubscribe: undefined,

      // Initialize store with Firebase data
      initialize: async () => {
        const state = get();
        if (state.isInitialized) {
          console.log('Patients store already initialized');
          return;
        }

        console.log('Initializing patients store...');
        set({ isLoading: true });

        try {
          // Set up real-time listener
          const unsubscribe = FirebaseService.subscribeToCollection(
            'patients',
            (docs) => {
              console.log('Patients data received:', docs.length, 'documents');
              set({ 
                patients: docs,
                isInitialized: true,
                isLoading: false
              });
            },
            'createdAt'
          );

          set({ unsubscribe });
        } catch (error) {
          console.error('Error initializing patients store:', error);
          set({ isLoading: false, isInitialized: true });
          // Don't show error toast, just log it
        }
      },

      // Add patient with optimistic UI
      addPatient: async (patientData) => {
        const state = get();
        
        // Generate temporary ID for optimistic UI
        const tempId = `temp-${Date.now()}`;
        const newPatient: Patient = {
          ...patientData,
          id: tempId,
          syncError: false,
          isOffline: false
        };

        // Optimistic update
        set({
          patients: [...state.patients, newPatient]
        });

        try {
          // Add to Firebase
          const firebaseId = await FirebaseService.addDocument('patients', patientData);
          
          // Update with real Firebase ID
          set({
            patients: state.patients.map(p => 
              p.id === tempId ? { ...p, id: firebaseId, syncError: false } : p
            )
          });

          toast.success('Patient added successfully');
        } catch (error) {
          console.error('Error adding patient:', error);
          
          // Mark as sync error
          set({
            patients: state.patients.map(p => 
              p.id === tempId ? { ...p, syncError: true, isOffline: true } : p
            )
          });

          toast.error('Failed to save patient. Will retry when online.');
        }
      },

      // Update patient with optimistic UI
      updatePatient: async (id, updates) => {
        const state = get();
        const patient = state.patients.find(p => p.id === id);
        if (!patient) return;

        // Optimistic update
        set({
          patients: state.patients.map(p => 
            p.id === id ? { ...p, ...updates, syncError: false } : p
          )
        });

        try {
          // Update in Firebase
          await FirebaseService.updateDocument('patients', id, updates);
          toast.success('Patient updated successfully');
        } catch (error) {
          console.error('Error updating patient:', error);
          
          // Revert optimistic update and mark as sync error
          set({
            patients: state.patients.map(p => 
              p.id === id ? { ...patient, syncError: true, isOffline: true } : p
            )
          });

          toast.error('Failed to update patient. Will retry when online.');
        }
      },

      // Delete patient with optimistic UI
      deletePatient: async (id) => {
        const state = get();
        const patient = state.patients.find(p => p.id === id);
        if (!patient) return;

        // Optimistic update
        set({
          patients: state.patients.filter(p => p.id !== id)
        });

        try {
          // Delete from Firebase
          await FirebaseService.deleteDocument('patients', id);
          toast.success('Patient deleted successfully');
        } catch (error) {
          console.error('Error deleting patient:', error);
          
          // Restore patient and mark as sync error
          set({
            patients: [...state.patients, { ...patient, syncError: true, isOffline: true }]
          });

          toast.error('Failed to delete patient. Will retry when online.');
        }
      },

      // Utility functions
      getPatientById: (id) => {
        const state = get();
        return state.patients.find(p => p.id === id);
      },

      getPatientsForSelect: () => {
        const state = get();
        return state.patients.map(p => ({
          value: p.id,
          label: p.name
        }));
      },

      // Cleanup
      cleanup: () => {
        const state = get();
        if (state.unsubscribe) {
          state.unsubscribe();
        }
        set({ 
          patients: [],
          isInitialized: false,
          unsubscribe: undefined
        });
      }
    }),
    {
      name: 'patients-store'
    }
  )
);
