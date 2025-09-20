import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { FirebaseService } from '../services/firebaseService';
import toast from 'react-hot-toast';

export interface Feedback {
  id: string;
  patientId: string;
  patientName: string;
  rating: number;
  comment?: string;
  date: string;
  status: 'pending' | 'reviewed' | 'resolved';
  // Firebase fields
  userId?: string;
  createdAt?: any;
  updatedAt?: any;
  // Sync status
  syncError?: boolean;
  isOffline?: boolean;
}

interface FeedbackState {
  // Data
  feedback: Feedback[];
  isLoading: boolean;
  isInitialized: boolean;
  
  // Real-time listener
  unsubscribe?: () => void;
  
  // Actions
  initialize: () => Promise<void>;
  addFeedback: (feedback: Omit<Feedback, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateFeedback: (id: string, updates: Partial<Feedback>) => Promise<void>;
  deleteFeedback: (id: string) => Promise<void>;
  
  // Utility actions
  getFeedbackById: (id: string) => Feedback | undefined;
  getFeedbackByPatient: (patientId: string) => Feedback[];
  getFeedbackByStatus: (status: string) => Feedback[];
  getAverageRating: () => number;
  
  // Cleanup
  cleanup: () => void;
}

export const useFeedbackStore = create<FeedbackState>()(
  devtools(
    (set, get) => ({
      // Initial state
      feedback: [],
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
            'feedback',
            (docs) => {
              set({ 
                feedback: docs,
                isInitialized: true,
                isLoading: false
              });
            },
            'createdAt'
          );

          set({ unsubscribe });
        } catch (error) {
          console.error('Error initializing feedback store:', error);
          set({ isLoading: false });
          toast.error('Failed to load feedback data');
        }
      },

      // Add feedback with optimistic UI
      addFeedback: async (feedbackData) => {
        const state = get();
        
        // Generate temporary ID for optimistic UI
        const tempId = `temp-${Date.now()}`;
        const newFeedback: Feedback = {
          ...feedbackData,
          id: tempId,
          syncError: false,
          isOffline: false
        };

        // Optimistic update
        set({
          feedback: [...state.feedback, newFeedback]
        });

        try {
          // Add to Firebase
          const firebaseId = await FirebaseService.addDocument('feedback', feedbackData);
          
          // Update with real Firebase ID
          set({
            feedback: state.feedback.map(f => 
              f.id === tempId ? { ...f, id: firebaseId, syncError: false } : f
            )
          });

          toast.success('Feedback submitted successfully');
        } catch (error) {
          console.error('Error adding feedback:', error);
          
          // Mark as sync error
          set({
            feedback: state.feedback.map(f => 
              f.id === tempId ? { ...f, syncError: true, isOffline: true } : f
            )
          });

          toast.error('Failed to save feedback. Will retry when online.');
        }
      },

      // Update feedback with optimistic UI
      updateFeedback: async (id, updates) => {
        const state = get();
        const feedbackItem = state.feedback.find(f => f.id === id);
        if (!feedbackItem) return;

        // Optimistic update
        set({
          feedback: state.feedback.map(f => 
            f.id === id ? { ...f, ...updates, syncError: false } : f
          )
        });

        try {
          // Update in Firebase
          await FirebaseService.updateDocument('feedback', id, updates);
          toast.success('Feedback updated successfully');
        } catch (error) {
          console.error('Error updating feedback:', error);
          
          // Revert optimistic update and mark as sync error
          set({
            feedback: state.feedback.map(f => 
              f.id === id ? { ...feedbackItem, syncError: true, isOffline: true } : f
            )
          });

          toast.error('Failed to update feedback. Will retry when online.');
        }
      },

      // Delete feedback with optimistic UI
      deleteFeedback: async (id) => {
        const state = get();
        const feedbackItem = state.feedback.find(f => f.id === id);
        if (!feedbackItem) return;

        // Optimistic update
        set({
          feedback: state.feedback.filter(f => f.id !== id)
        });

        try {
          // Delete from Firebase
          await FirebaseService.deleteDocument('feedback', id);
          toast.success('Feedback deleted successfully');
        } catch (error) {
          console.error('Error deleting feedback:', error);
          
          // Restore feedback and mark as sync error
          set({
            feedback: [...state.feedback, { ...feedbackItem, syncError: true, isOffline: true }]
          });

          toast.error('Failed to delete feedback. Will retry when online.');
        }
      },

      // Utility functions
      getFeedbackById: (id) => {
        const state = get();
        return state.feedback.find(f => f.id === id);
      },

      getFeedbackByPatient: (patientId) => {
        const state = get();
        return state.feedback.filter(f => f.patientId === patientId);
      },

      getFeedbackByStatus: (status) => {
        const state = get();
        return state.feedback.filter(f => f.status === status);
      },

      getAverageRating: () => {
        const state = get();
        if (state.feedback.length === 0) return 0;
        const totalRating = state.feedback.reduce((sum, f) => sum + f.rating, 0);
        return totalRating / state.feedback.length;
      },

      // Cleanup
      cleanup: () => {
        const state = get();
        if (state.unsubscribe) {
          state.unsubscribe();
        }
        set({ 
          feedback: [],
          isInitialized: false,
          unsubscribe: undefined
        });
      }
    }),
    {
      name: 'feedback-store'
    }
  )
);
