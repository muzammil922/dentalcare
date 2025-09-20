import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  Timestamp,
  writeBatch,
  serverTimestamp,
  DocumentData,
  QuerySnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { auth } from '../lib/firebase';

// Generic Firebase Service
export class FirebaseService {
  private static getCurrentUserId(): string {
    const user = auth.currentUser;
    if (!user) {
      console.error('User not authenticated');
      throw new Error('User not authenticated');
    }
    console.log('Current user ID:', user.uid);
    return user.uid;
  }

  // Generic CRUD operations
  static async addDocument(collectionName: string, data: any): Promise<string> {
    const userId = this.getCurrentUserId();
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  }

  static async updateDocument(collectionName: string, docId: string, data: any): Promise<void> {
    await updateDoc(doc(db, collectionName, docId), {
      ...data,
      updatedAt: serverTimestamp()
    });
  }

  static async deleteDocument(collectionName: string, docId: string): Promise<void> {
    await deleteDoc(doc(db, collectionName, docId));
  }

  static async getDocument(collectionName: string, docId: string): Promise<any> {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  }

  static async getDocuments(collectionName: string, orderByField?: string): Promise<any[]> {
    try {
    const userId = this.getCurrentUserId();
    let q = query(
      collection(db, collectionName),
      where('userId', '==', userId)
    );
    
      const querySnapshot = await getDocs(q);
      let docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort in memory instead of using Firestore orderBy
    if (orderByField) {
        docs.sort((a, b) => {
          const aVal = a[orderByField];
          const bVal = b[orderByField];
          if (aVal && bVal) {
            return new Date(bVal).getTime() - new Date(aVal).getTime();
          }
          return 0;
        });
      }
      
      return docs;
    } catch (error) {
      console.error(`Error getting ${collectionName} documents:`, error);
      
      // Fallback: try without userId filter
      try {
        console.log(`Trying ${collectionName} without userId filter...`);
        const fallbackQ = query(collection(db, collectionName));
        const querySnapshot = await getDocs(fallbackQ);
        const docs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
        
        // Filter by userId in memory
        const filteredDocs = docs.filter(doc => doc.userId === userId);
        
        // Sort in memory
        if (orderByField) {
          filteredDocs.sort((a, b) => {
            const aVal = a[orderByField];
            const bVal = b[orderByField];
            if (aVal && bVal) {
              return new Date(bVal).getTime() - new Date(aVal).getTime();
            }
            return 0;
          });
        }
        
        return filteredDocs;
      } catch (fallbackError) {
        console.error(`Error in ${collectionName} fallback:`, fallbackError);
        return [];
      }
    }
  }

  static subscribeToCollection(
    collectionName: string, 
    callback: (docs: any[]) => void,
    orderByField?: string
  ): Unsubscribe {
    try {
    const userId = this.getCurrentUserId();
      console.log(`Setting up listener for ${collectionName} for user: ${userId}`);
      
      // Try with userId filter first
    let q = query(
      collection(db, collectionName),
      where('userId', '==', userId)
    );

    return onSnapshot(q, (querySnapshot) => {
      const docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
        
        // Sort in memory instead of using Firestore orderBy
        if (orderByField) {
          docs.sort((a, b) => {
            const aVal = a[orderByField];
            const bVal = b[orderByField];
            if (aVal && bVal) {
              return new Date(bVal).getTime() - new Date(aVal).getTime();
            }
            return 0;
          });
        }
        
        console.log(`${collectionName} data received:`, docs.length, 'documents');
        console.log(`${collectionName} sample data:`, docs.slice(0, 2)); // Show first 2 items
      callback(docs);
      }, (error) => {
        console.error(`Error in ${collectionName} listener with userId filter:`, error);
        
        // If userId filter fails, try without filter (for development)
        console.log(`Trying ${collectionName} without userId filter...`);
        const fallbackQ = query(collection(db, collectionName));
        
        return onSnapshot(fallbackQ, (querySnapshot) => {
          const docs = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Filter by userId in memory
          const filteredDocs = docs.filter(doc => doc.userId === userId);
          
          // Sort in memory
          if (orderByField) {
            filteredDocs.sort((a, b) => {
              const aVal = a[orderByField];
              const bVal = b[orderByField];
              if (aVal && bVal) {
                return new Date(bVal).getTime() - new Date(aVal).getTime();
              }
              return 0;
            });
          }
          
          console.log(`${collectionName} fallback data received:`, filteredDocs.length, 'documents');
          callback(filteredDocs);
        }, (fallbackError) => {
          console.error(`Error in ${collectionName} fallback listener:`, fallbackError);
          // Call callback with empty array on error
          callback([]);
        });
      });
    } catch (error) {
      console.error(`Error setting up ${collectionName} listener:`, error);
      // Return empty unsubscribe function
      return () => {};
    }
  }

  static async batchWrite(operations: Array<{
    type: 'add' | 'update' | 'delete';
    collection: string;
    docId?: string;
    data?: any;
  }>): Promise<void> {
    const batch = writeBatch(db);
    const userId = this.getCurrentUserId();

    operations.forEach(op => {
      switch (op.type) {
        case 'add':
          const docRef = doc(collection(db, op.collection));
          batch.set(docRef, {
            ...op.data,
            userId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          break;
        case 'update':
          if (op.docId) {
            const updateRef = doc(db, op.collection, op.docId);
            batch.update(updateRef, {
              ...op.data,
              updatedAt: serverTimestamp()
            });
          }
          break;
        case 'delete':
          if (op.docId) {
            const deleteRef = doc(db, op.collection, op.docId);
            batch.delete(deleteRef);
          }
          break;
      }
    });

    await batch.commit();
  }
}

// Patient Service
export const patientService = {
  async addPatient(patientData: any, userId: string) {
    const docRef = await addDoc(collection(db, 'patients'), {
      ...patientData,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  },

  async updatePatient(patientId: string, patientData: any) {
    await updateDoc(doc(db, 'patients', patientId), {
      ...patientData,
      updatedAt: Timestamp.now()
    });
  },

  async deletePatient(patientId: string) {
    await deleteDoc(doc(db, 'patients', patientId));
  },

  async getPatients(userId: string) {
    const q = query(
      collection(db, 'patients'),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    let docs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort in memory
    docs.sort((a, b) => {
      const aVal = a.createdAt || a.registrationDate;
      const bVal = b.createdAt || b.registrationDate;
      if (aVal && bVal) {
        return new Date(bVal).getTime() - new Date(aVal).getTime();
      }
      return 0;
    });
    
    return docs;
  },

  async getPatient(patientId: string) {
    const docRef = doc(db, 'patients', patientId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  }
};

// Staff Service
export const staffService = {
  async addStaff(staffData: any, userId: string) {
    const docRef = await addDoc(collection(db, 'staff'), {
      ...staffData,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  },

  async updateStaff(staffId: string, staffData: any) {
    await updateDoc(doc(db, 'staff', staffId), {
      ...staffData,
      updatedAt: Timestamp.now()
    });
  },

  async deleteStaff(staffId: string) {
    await deleteDoc(doc(db, 'staff', staffId));
  },

  async getStaff(userId: string) {
    const q = query(
      collection(db, 'staff'),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    let docs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort in memory
    docs.sort((a, b) => {
      const aVal = a.createdAt;
      const bVal = b.createdAt;
      if (aVal && bVal) {
        return new Date(bVal).getTime() - new Date(aVal).getTime();
      }
      return 0;
    });
    
    return docs;
  }
};

// Appointment Service
export const appointmentService = {
  async addAppointment(appointmentData: any, userId: string) {
    const docRef = await addDoc(collection(db, 'appointments'), {
      ...appointmentData,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  },

  async updateAppointment(appointmentId: string, appointmentData: any) {
    await updateDoc(doc(db, 'appointments', appointmentId), {
      ...appointmentData,
      updatedAt: Timestamp.now()
    });
  },

  async deleteAppointment(appointmentId: string) {
    await deleteDoc(doc(db, 'appointments', appointmentId));
  },

  async getAppointments(userId: string) {
    const q = query(
      collection(db, 'appointments'),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    let docs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort in memory
    docs.sort((a, b) => {
      const aVal = a.appointmentDate || a.date;
      const bVal = b.appointmentDate || b.date;
      if (aVal && bVal) {
        return new Date(bVal).getTime() - new Date(aVal).getTime();
      }
      return 0;
    });
    
    return docs;
  }
};

// Inventory Service
export const inventoryService = {
  async addInventoryItem(itemData: any, userId: string) {
    const docRef = await addDoc(collection(db, 'inventory'), {
      ...itemData,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  },

  async updateInventoryItem(itemId: string, itemData: any) {
    await updateDoc(doc(db, 'inventory', itemId), {
      ...itemData,
      updatedAt: Timestamp.now()
    });
  },

  async deleteInventoryItem(itemId: string) {
    await deleteDoc(doc(db, 'inventory', itemId));
  },

  async getInventoryItems(userId: string) {
    const q = query(
      collection(db, 'inventory'),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    let docs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort in memory
    docs.sort((a, b) => {
      const aVal = a.createdAt;
      const bVal = b.createdAt;
      if (aVal && bVal) {
        return new Date(bVal).getTime() - new Date(aVal).getTime();
      }
      return 0;
    });
    
    return docs;
  }
};

// Invoice/Billing Service
export const invoiceService = {
  async addInvoice(invoiceData: any, userId: string) {
    const docRef = await addDoc(collection(db, 'invoices'), {
      ...invoiceData,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  },

  async updateInvoice(invoiceId: string, invoiceData: any) {
    await updateDoc(doc(db, 'invoices', invoiceId), {
      ...invoiceData,
      updatedAt: Timestamp.now()
    });
  },

  async deleteInvoice(invoiceId: string) {
    await deleteDoc(doc(db, 'invoices', invoiceId));
  },

  async getInvoices(userId: string) {
    const q = query(
      collection(db, 'invoices'),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    let docs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort in memory
    docs.sort((a, b) => {
      const aVal = a.createdAt || a.invoiceDate;
      const bVal = b.createdAt || b.invoiceDate;
      if (aVal && bVal) {
        return new Date(bVal).getTime() - new Date(aVal).getTime();
      }
      return 0;
    });
    
    return docs;
  }
};

// Feedback Service
export const feedbackService = {
  async addFeedback(feedbackData: any, userId: string) {
    const docRef = await addDoc(collection(db, 'feedback'), {
      ...feedbackData,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  },

  async getFeedback(userId: string) {
    const q = query(
      collection(db, 'feedback'),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    let docs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort in memory
    docs.sort((a, b) => {
      const aVal = a.createdAt || a.date;
      const bVal = b.createdAt || b.date;
      if (aVal && bVal) {
        return new Date(bVal).getTime() - new Date(aVal).getTime();
      }
      return 0;
    });
    
    return docs;
  }
};

// Attendance Service
export const attendanceService = {
  async addAttendance(attendanceData: any, userId: string) {
    const docRef = await addDoc(collection(db, 'attendance'), {
      ...attendanceData,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  },

  async updateAttendance(attendanceId: string, attendanceData: any) {
    await updateDoc(doc(db, 'attendance', attendanceId), {
      ...attendanceData,
      updatedAt: Timestamp.now()
    });
  },

  async deleteAttendance(attendanceId: string) {
    await deleteDoc(doc(db, 'attendance', attendanceId));
  },

  async getAttendance(userId: string) {
    const q = query(
      collection(db, 'attendance'),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    let docs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort in memory
    docs.sort((a, b) => {
      const aVal = a.date;
      const bVal = b.date;
      if (aVal && bVal) {
        return new Date(bVal).getTime() - new Date(aVal).getTime();
      }
      return 0;
    });
    
    return docs;
  },

  async getAttendanceByStaff(staffId: string, userId: string) {
    const q = query(
      collection(db, 'attendance'),
      where('userId', '==', userId),
      where('staffId', '==', staffId)
    );
    const querySnapshot = await getDocs(q);
    let docs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort in memory
    docs.sort((a, b) => {
      const aVal = a.date;
      const bVal = b.date;
      if (aVal && bVal) {
        return new Date(bVal).getTime() - new Date(aVal).getTime();
      }
      return 0;
    });
    
    return docs;
  }
};

// Salary Service
export const salaryService = {
  async addSalary(salaryData: any, userId: string) {
    const docRef = await addDoc(collection(db, 'salaries'), {
      ...salaryData,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  },

  async updateSalary(salaryId: string, salaryData: any) {
    await updateDoc(doc(db, 'salaries', salaryId), {
      ...salaryData,
      updatedAt: Timestamp.now()
    });
  },

  async deleteSalary(salaryId: string) {
    await deleteDoc(doc(db, 'salaries', salaryId));
  },

  async getSalaries(userId: string) {
    const q = query(
      collection(db, 'salaries'),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    let docs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort in memory
    docs.sort((a, b) => {
      const aVal = a.month || a.createdAt;
      const bVal = b.month || b.createdAt;
      if (aVal && bVal) {
        return new Date(bVal).getTime() - new Date(aVal).getTime();
      }
      return 0;
    });
    
    return docs;
  },

  async getSalaryByStaff(staffId: string, userId: string) {
    const q = query(
      collection(db, 'salaries'),
      where('userId', '==', userId),
      where('staffId', '==', staffId)
    );
    const querySnapshot = await getDocs(q);
    let docs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort in memory
    docs.sort((a, b) => {
      const aVal = a.month || a.createdAt;
      const bVal = b.month || b.createdAt;
      if (aVal && bVal) {
        return new Date(bVal).getTime() - new Date(aVal).getTime();
      }
      return 0;
    });
    
    return docs;
  }
};

// Billing Service (Additional billing records)
export const billingService = {
  async addBillingRecord(billingData: any, userId: string) {
    const docRef = await addDoc(collection(db, 'billing'), {
      ...billingData,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  },

  async updateBillingRecord(billingId: string, billingData: any) {
    await updateDoc(doc(db, 'billing', billingId), {
      ...billingData,
      updatedAt: Timestamp.now()
    });
  },

  async deleteBillingRecord(billingId: string) {
    await deleteDoc(doc(db, 'billing', billingId));
  },

  async getBillingRecords(userId: string) {
    const q = query(
      collection(db, 'billing'),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    let docs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort in memory
    docs.sort((a, b) => {
      const aVal = a.createdAt;
      const bVal = b.createdAt;
      if (aVal && bVal) {
        return new Date(bVal).getTime() - new Date(aVal).getTime();
      }
      return 0;
    });
    
    return docs;
  }
};

// Reports Service
export const reportsService = {
  async addReport(reportData: any, userId: string) {
    const docRef = await addDoc(collection(db, 'reports'), {
      ...reportData,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  },

  async getReports(userId: string) {
    const q = query(
      collection(db, 'reports'),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    let docs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort in memory
    docs.sort((a, b) => {
      const aVal = a.createdAt;
      const bVal = b.createdAt;
      if (aVal && bVal) {
        return new Date(bVal).getTime() - new Date(aVal).getTime();
      }
      return 0;
    });
    
    return docs;
  }
};

// Settings Service
export const settingsService = {
  async updateSettings(settingsData: any, userId: string) {
    const settingsRef = doc(db, 'settings', userId);
    await updateDoc(settingsRef, {
      ...settingsData,
      updatedAt: Timestamp.now()
    });
  },

  async getSettings(userId: string) {
    const settingsRef = doc(db, 'settings', userId);
    const settingsSnap = await getDoc(settingsRef);
    if (settingsSnap.exists()) {
      return { id: settingsSnap.id, ...settingsSnap.data() };
    }
    return null;
  }
};

// Automation Service
export const automationService = {
  async addAutomation(automationData: any, userId: string) {
    const docRef = await addDoc(collection(db, 'automation'), {
      ...automationData,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  },

  async updateAutomation(automationId: string, automationData: any) {
    await updateDoc(doc(db, 'automation', automationId), {
      ...automationData,
      updatedAt: Timestamp.now()
    });
  },

  async deleteAutomation(automationId: string) {
    await deleteDoc(doc(db, 'automation', automationId));
  },

  async getAutomations(userId: string) {
    const q = query(
      collection(db, 'automation'),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    let docs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort in memory
    docs.sort((a, b) => {
      const aVal = a.createdAt;
      const bVal = b.createdAt;
      if (aVal && bVal) {
        return new Date(bVal).getTime() - new Date(aVal).getTime();
      }
      return 0;
    });
    
    return docs;
  }
};
