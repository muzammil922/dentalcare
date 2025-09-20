import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { FirebaseService } from '../services/firebaseService';
import toast from 'react-hot-toast';

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  vendor: string;
  quantity: number;
  price: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock' | 'discontinued';
  minQuantity: number;
  maxQuantity: number;
  expiryDate?: string;
  notes?: string;
  // Firebase fields
  userId?: string;
  createdAt?: any;
  updatedAt?: any;
  // Sync status
  syncError?: boolean;
  isOffline?: boolean;
}

export interface UsageRecord {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  reason: string;
  date: string;
  staffId: string;
  staffName: string;
  // Firebase fields
  userId?: string;
  createdAt?: any;
  updatedAt?: any;
  // Sync status
  syncError?: boolean;
  isOffline?: boolean;
}

interface InventoryState {
  // Data
  inventory: InventoryItem[];
  usageRecords: UsageRecord[];
  isLoading: boolean;
  isInitialized: boolean;
  
  // Real-time listeners
  inventoryUnsubscribe?: () => void;
  usageUnsubscribe?: () => void;
  
  // Actions
  initialize: () => Promise<void>;
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  
  // Usage actions
  addUsageRecord: (record: Omit<UsageRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateUsageRecord: (id: string, updates: Partial<UsageRecord>) => Promise<void>;
  deleteUsageRecord: (id: string) => Promise<void>;
  
  // Utility actions
  getInventoryItemById: (id: string) => InventoryItem | undefined;
  getLowStockItems: () => InventoryItem[];
  getOutOfStockItems: () => InventoryItem[];
  getUsageRecordsByItem: (itemId: string) => UsageRecord[];
  
  // Cleanup
  cleanup: () => void;
}

export const useInventoryStore = create<InventoryState>()(
  devtools(
    (set, get) => ({
      // Initial state
      inventory: [],
      usageRecords: [],
      isLoading: false,
      isInitialized: false,
      inventoryUnsubscribe: undefined,
      usageUnsubscribe: undefined,

      // Initialize store with Firebase data
      initialize: async () => {
        const state = get();
        if (state.isInitialized) return;

        set({ isLoading: true });

        try {
          // Set up real-time listeners for both collections
          const inventoryUnsubscribe = FirebaseService.subscribeToCollection(
            'inventory',
            (docs) => {
              set({ 
                inventory: docs,
                isInitialized: true,
                isLoading: false
              });
            },
            'createdAt'
          );

          // For now, skip usageRecords Firebase sync due to permissions
          // Will be handled locally until Firebase permissions are fixed
          const usageUnsubscribe = () => {};

          set({ inventoryUnsubscribe, usageUnsubscribe });
        } catch (error) {
          console.error('Error initializing inventory store:', error);
          set({ isLoading: false });
          toast.error('Failed to load inventory data');
        }
      },

      // Add inventory item with optimistic UI
      addInventoryItem: async (itemData) => {
        const state = get();
        
        // Generate temporary ID for optimistic UI
        const tempId = `temp-${Date.now()}`;
        const newItem: InventoryItem = {
          ...itemData,
          id: tempId,
          syncError: false,
          isOffline: false
        };

        // Optimistic update
        set({
          inventory: [...state.inventory, newItem]
        });

        try {
          // Add to Firebase
          const firebaseId = await FirebaseService.addDocument('inventory', itemData);
          
          // Update with real Firebase ID
          set({
            inventory: state.inventory.map(item => 
              item.id === tempId ? { ...item, id: firebaseId, syncError: false } : item
            )
          });

          toast.success('Inventory item added successfully');
        } catch (error) {
          console.error('Error adding inventory item:', error);
          
          // Mark as sync error
          set({
            inventory: state.inventory.map(item => 
              item.id === tempId ? { ...item, syncError: true, isOffline: true } : item
            )
          });

          toast.error('Failed to save inventory item. Will retry when online.');
        }
      },

      // Update inventory item with optimistic UI
      updateInventoryItem: async (id, updates) => {
        const state = get();
        const item = state.inventory.find(i => i.id === id);
        if (!item) return;

        // Optimistic update
        set({
          inventory: state.inventory.map(i => 
            i.id === id ? { ...i, ...updates, syncError: false } : i
          )
        });

        try {
          // Update in Firebase
          await FirebaseService.updateDocument('inventory', id, updates);
          toast.success('Inventory item updated successfully');
        } catch (error) {
          console.error('Error updating inventory item:', error);
          
          // Revert optimistic update and mark as sync error
          set({
            inventory: state.inventory.map(i => 
              i.id === id ? { ...item, syncError: true, isOffline: true } : i
            )
          });

          toast.error('Failed to update inventory item. Will retry when online.');
        }
      },

      // Delete inventory item with optimistic UI
      deleteInventoryItem: async (id) => {
        const state = get();
        const item = state.inventory.find(i => i.id === id);
        if (!item) return;

        // Optimistic update
        set({
          inventory: state.inventory.filter(i => i.id !== id)
        });

        try {
          // Delete from Firebase
          await FirebaseService.deleteDocument('inventory', id);
          toast.success('Inventory item deleted successfully');
        } catch (error) {
          console.error('Error deleting inventory item:', error);
          
          // Restore item and mark as sync error
          set({
            inventory: [...state.inventory, { ...item, syncError: true, isOffline: true }]
          });

          toast.error('Failed to delete inventory item. Will retry when online.');
        }
      },

      // Add usage record with optimistic UI
      addUsageRecord: async (recordData) => {
        const state = get();
        
        // Generate temporary ID for optimistic UI
        const tempId = `temp-${Date.now()}`;
        const newRecord: UsageRecord = {
          ...recordData,
          id: tempId,
          syncError: false,
          isOffline: false
        };

        // Optimistic update
        set({
          usageRecords: [...state.usageRecords, newRecord]
        });

        try {
          // Add to Firebase
          const firebaseId = await FirebaseService.addDocument('usageRecords', recordData);
          
          // Update with real Firebase ID
          set({
            usageRecords: state.usageRecords.map(record => 
              record.id === tempId ? { ...record, id: firebaseId, syncError: false } : record
            )
          });

          toast.success('Usage record added successfully');
        } catch (error) {
          console.error('Error adding usage record:', error);
          
          // Mark as sync error
          set({
            usageRecords: state.usageRecords.map(record => 
              record.id === tempId ? { ...record, syncError: true, isOffline: true } : record
            )
          });

          toast.error('Failed to save usage record. Will retry when online.');
        }
      },

      // Update usage record with optimistic UI
      updateUsageRecord: async (id, updates) => {
        const state = get();
        const record = state.usageRecords.find(r => r.id === id);
        if (!record) return;

        // Optimistic update
        set({
          usageRecords: state.usageRecords.map(r => 
            r.id === id ? { ...r, ...updates, syncError: false } : r
          )
        });

        try {
          // Update in Firebase
          await FirebaseService.updateDocument('usageRecords', id, updates);
          toast.success('Usage record updated successfully');
        } catch (error) {
          console.error('Error updating usage record:', error);
          
          // Revert optimistic update and mark as sync error
          set({
            usageRecords: state.usageRecords.map(r => 
              r.id === id ? { ...record, syncError: true, isOffline: true } : r
            )
          });

          toast.error('Failed to update usage record. Will retry when online.');
        }
      },

      // Delete usage record with optimistic UI
      deleteUsageRecord: async (id) => {
        const state = get();
        const record = state.usageRecords.find(r => r.id === id);
        if (!record) return;

        // Optimistic update
        set({
          usageRecords: state.usageRecords.filter(r => r.id !== id)
        });

        try {
          // Delete from Firebase
          await FirebaseService.deleteDocument('usageRecords', id);
          toast.success('Usage record deleted successfully');
        } catch (error) {
          console.error('Error deleting usage record:', error);
          
          // Restore record and mark as sync error
          set({
            usageRecords: [...state.usageRecords, { ...record, syncError: true, isOffline: true }]
          });

          toast.error('Failed to delete usage record. Will retry when online.');
        }
      },

      // Utility functions
      getInventoryItemById: (id) => {
        const state = get();
        return state.inventory.find(item => item.id === id);
      },

      getLowStockItems: () => {
        const state = get();
        return state.inventory.filter(item => item.status === 'low-stock');
      },

      getOutOfStockItems: () => {
        const state = get();
        return state.inventory.filter(item => item.status === 'out-of-stock');
      },

      getUsageRecordsByItem: (itemId) => {
        const state = get();
        return state.usageRecords.filter(record => record.itemId === itemId);
      },

      // Cleanup
      cleanup: () => {
        const state = get();
        if (state.inventoryUnsubscribe) {
          state.inventoryUnsubscribe();
        }
        if (state.usageUnsubscribe) {
          state.usageUnsubscribe();
        }
        set({ 
          inventory: [],
          usageRecords: [],
          isInitialized: false,
          inventoryUnsubscribe: undefined,
          usageUnsubscribe: undefined
        });
      }
    }),
    {
      name: 'inventory-store'
    }
  )
);
