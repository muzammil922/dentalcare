import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePatientsStore } from '../stores/usePatientsStore';
import { useAppointmentsStore } from '../stores/useAppointmentsStore';
import { useStaffStore } from '../stores/useStaffStore';
import { useInvoicesStore } from '../stores/useInvoicesStore';
import { useInventoryStore } from '../stores/useInventoryStore';
import { useFeedbackStore } from '../stores/useFeedbackStore';
import { useAttendanceStore } from '../stores/useAttendanceStore';
import { useSalaryStore } from '../stores/useSalaryStore';
import { useReportsStore } from '../stores/useReportsStore';
import { useSettingsStore } from '../stores/useSettingsStore';

export const useFirebaseStores = () => {
  const { user, loading } = useAuth();
  
  // Get all store actions
  const { initialize: initializePatients, cleanup: cleanupPatients } = usePatientsStore();
  const { initialize: initializeAppointments, cleanup: cleanupAppointments } = useAppointmentsStore();
  const { initialize: initializeStaff, cleanup: cleanupStaff } = useStaffStore();
  const { initialize: initializeInvoices, cleanup: cleanupInvoices } = useInvoicesStore();
  const { initialize: initializeInventory, cleanup: cleanupInventory } = useInventoryStore();
  const { initialize: initializeFeedback, cleanup: cleanupFeedback } = useFeedbackStore();
  const { initialize: initializeAttendance, cleanup: cleanupAttendance } = useAttendanceStore();
  const { initialize: initializeSalary, cleanup: cleanupSalary } = useSalaryStore();
  const { initialize: initializeReports, cleanup: cleanupReports } = useReportsStore();
  const { initialize: initializeSettings, cleanup: cleanupSettings } = useSettingsStore();

  useEffect(() => {
    if (!loading && user) {
      console.log('Initializing Firebase stores for user:', user.uid);
      // Initialize all stores when user is authenticated
      const initializeAll = async () => {
        try {
          await Promise.all([
            initializePatients(),
            initializeAppointments(),
            initializeStaff(),
            initializeInvoices(),
            initializeInventory(),
            initializeFeedback(),
            initializeAttendance(),
            initializeSalary(),
            initializeReports(),
            initializeSettings()
          ]);
          console.log('All Firebase stores initialized successfully');
        } catch (error) {
          console.error('Error initializing Firebase stores:', error);
        }
      };
      
      initializeAll();
    } else if (!loading && !user) {
      console.log('Cleaning up Firebase stores - user logged out');
      // Cleanup stores when user logs out
      cleanupPatients();
      cleanupAppointments();
      cleanupStaff();
      cleanupInvoices();
      cleanupInventory();
      cleanupFeedback();
      cleanupAttendance();
      cleanupSalary();
      cleanupReports();
      cleanupSettings();
    }

    // Cleanup on unmount
    return () => {
      cleanupPatients();
      cleanupAppointments();
      cleanupStaff();
      cleanupInvoices();
      cleanupInventory();
      cleanupFeedback();
      cleanupAttendance();
      cleanupSalary();
      cleanupReports();
      cleanupSettings();
    };
  }, [user, loading]);
};
