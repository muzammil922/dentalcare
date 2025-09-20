import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { FirebaseService } from '../services/firebaseService';
import toast from 'react-hot-toast';

export interface Treatment {
  id: string;
  type: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  patientId: string;
  patientName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  treatments: Treatment[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paymentMethod?: string;
  receiptNumber?: string;
  notes?: string;
  createdAt: string;
  // Firebase fields
  userId?: string;
  updatedAt?: any;
  // Sync status
  syncError?: boolean;
  isOffline?: boolean;
}

interface InvoicesState {
  // Data
  invoices: Invoice[];
  isLoading: boolean;
  isInitialized: boolean;
  
  // Real-time listener
  unsubscribe?: () => void;
  
  // Actions
  initialize: () => Promise<void>;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  
  // Utility actions
  getInvoiceById: (id: string) => Invoice | undefined;
  getInvoicesByPatient: (patientId: string) => Invoice[];
  getInvoicesByStatus: (status: string) => Invoice[];
  getTotalRevenue: () => number;
  
  // Cleanup
  cleanup: () => void;
}

export const useInvoicesStore = create<InvoicesState>()(
  devtools(
    (set, get) => ({
      // Initial state
      invoices: [],
      isLoading: false,
      isInitialized: false,
      unsubscribe: undefined,

      // Initialize store with Firebase data
      initialize: async () => {
        const state = get();
        if (state.isInitialized) {
          console.log('Invoices store already initialized');
          return;
        }

        console.log('Initializing invoices store...');
        set({ isLoading: true });

        try {
          // Set up real-time listener
          const unsubscribe = FirebaseService.subscribeToCollection(
            'invoices',
            (docs) => {
              console.log('Invoices data received:', docs.length, 'documents');
              set({ 
                invoices: docs,
                isInitialized: true,
                isLoading: false
              });
            },
            'createdAt'
          );

          set({ unsubscribe });
        } catch (error) {
          console.error('Error initializing invoices store:', error);
          set({ isLoading: false, isInitialized: true });
          // Don't show error toast, just log it
        }
      },

      // Add invoice with optimistic UI
      addInvoice: async (invoiceData) => {
        const state = get();
        
        // Generate temporary ID for optimistic UI
        const tempId = `temp-${Date.now()}`;
        const newInvoice: Invoice = {
          ...invoiceData,
          id: tempId,
          syncError: false,
          isOffline: false
        };

        // Optimistic update
        set({
          invoices: [...state.invoices, newInvoice]
        });

        try {
          // Add to Firebase
          const firebaseId = await FirebaseService.addDocument('invoices', invoiceData);
          
          // Update with real Firebase ID
          set({
            invoices: state.invoices.map(i => 
              i.id === tempId ? { ...i, id: firebaseId, syncError: false } : i
            )
          });

          toast.success('Invoice created successfully');
        } catch (error) {
          console.error('Error adding invoice:', error);
          
          // Mark as sync error
          set({
            invoices: state.invoices.map(i => 
              i.id === tempId ? { ...i, syncError: true, isOffline: true } : i
            )
          });

          toast.error('Failed to save invoice. Will retry when online.');
        }
      },

      // Update invoice with optimistic UI
      updateInvoice: async (id, updates) => {
        const state = get();
        const invoice = state.invoices.find(i => i.id === id);
        if (!invoice) return;

        // Optimistic update
        set({
          invoices: state.invoices.map(i => 
            i.id === id ? { ...i, ...updates, syncError: false } : i
          )
        });

        try {
          // Update in Firebase
          await FirebaseService.updateDocument('invoices', id, updates);
          toast.success('Invoice updated successfully');
        } catch (error) {
          console.error('Error updating invoice:', error);
          
          // Revert optimistic update and mark as sync error
          set({
            invoices: state.invoices.map(i => 
              i.id === id ? { ...invoice, syncError: true, isOffline: true } : i
            )
          });

          toast.error('Failed to update invoice. Will retry when online.');
        }
      },

      // Delete invoice with optimistic UI
      deleteInvoice: async (id) => {
        const state = get();
        const invoice = state.invoices.find(i => i.id === id);
        if (!invoice) return;

        // Optimistic update
        set({
          invoices: state.invoices.filter(i => i.id !== id)
        });

        try {
          // Delete from Firebase
          await FirebaseService.deleteDocument('invoices', id);
          toast.success('Invoice deleted successfully');
        } catch (error) {
          console.error('Error deleting invoice:', error);
          
          // Restore invoice and mark as sync error
          set({
            invoices: [...state.invoices, { ...invoice, syncError: true, isOffline: true }]
          });

          toast.error('Failed to delete invoice. Will retry when online.');
        }
      },

      // Utility functions
      getInvoiceById: (id) => {
        const state = get();
        return state.invoices.find(i => i.id === id);
      },

      getInvoicesByPatient: (patientId) => {
        const state = get();
        return state.invoices.filter(i => i.patientId === patientId);
      },

      getInvoicesByStatus: (status) => {
        const state = get();
        return state.invoices.filter(i => i.status === status);
      },

      getTotalRevenue: () => {
        const state = get();
        return state.invoices.reduce((sum, invoice) => sum + invoice.total, 0);
      },

      // Cleanup
      cleanup: () => {
        const state = get();
        if (state.unsubscribe) {
          state.unsubscribe();
        }
        set({ 
          invoices: [],
          isInitialized: false,
          unsubscribe: undefined
        });
      }
    }),
    {
      name: 'invoices-store'
    }
  )
);
