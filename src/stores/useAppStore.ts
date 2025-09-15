import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

export interface Patient {
  id: string
  name: string
  age: number
  gender: 'male' | 'female' | 'other'
  phone: string
  email: string
  address: string
  medicalHistory: string
  status: 'active' | 'inactive' | 'pending'
  registrationDate: string
  lastVisit?: string
  notes?: string
}

export interface Appointment {
  id: string
  patientId: string
  patientName: string
  patientGender: 'male' | 'female' | 'other' // Add patient gender
  date: string
  time: string
  duration?: string
  type: string
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show'
  priority: 'normal' | 'high' | 'urgent'
  reminder?: string
  notes?: string
  createdAt: string
}

export interface Invoice {
  id: string
  patientId: string
  patientName: string
  invoiceNumber: string
  invoiceDate: string
  dueDate: string
  treatments: Treatment[]
  subtotal: number
  tax: number
  discount: number
  total: number
  status: 'pending' | 'paid' | 'overdue' | 'cancelled'
  paymentMethod?: string
  notes?: string
  createdAt: string
}

export interface Treatment {
  id: string
  type: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface Staff {
  id: string
  name: string
  role: string
  phone: string
  email: string
  joinDate: string
  status: 'active' | 'inactive' | 'on_leave'
  salary?: number
  // Additional fields from Staff Details modal
  gender?: 'male' | 'female' | 'other'
  age?: number
  address?: string
  qualifications?: string
  experience?: string
  jobTerm?: 'permanent' | 'contract' | 'temporary'
  department?: string
  emergencyContact?: string
  emergencyPhone?: string
  notes?: string
}

export interface Attendance {
  id: string
  staffId: string
  staffName: string
  date: string
  checkIn: string
  checkOut?: string
  status: 'present' | 'absent' | 'late' | 'leave' | 'half-day'
  notes?: string
}

export interface Salary {
  id: string
  staffId: string
  staffName: string
  month: string
  year: number
  basicSalary: number
  allowances: Allowance[] | number
  deductions: Deduction[] | number
  totalSalary: number
  status: 'pending' | 'paid'
  paymentDate?: string
  department?: string
  overtime?: number
  bonus?: number
  grossSalary?: number
  netSalary?: number
  // Attendance data
  presentDays?: number
  absentDays?: number
  leaveDays?: number
  lateDays?: number
  halfDays?: number
  workingDays?: number
  notes?: string
}

export interface Allowance {
  id: string
  name: string
  amount: number
}

export interface Deduction {
  id: string
  name: string
  amount: number
}

export interface InventoryItem {
  id: string
  name: string
  category: string
  unit: string
  vendor: string
  quantity: number
  price: number
  status: 'in-stock' | 'low-stock' | 'out-of-stock' | 'discontinued'
  minQuantity: number
  maxQuantity: number
  expiryDate?: string
  notes?: string
}

export interface UsageRecord {
  id: string
  itemId: string
  itemName: string
  quantity: number
  reason: string
  date: string
  staffId: string
  staffName: string
}

export interface Feedback {
  id: string
  patientId: string
  patientName: string
  rating: number
  comment?: string
  date: string
  status: 'pending' | 'reviewed' | 'resolved'
}

interface AppState {
  // Current section and tab
  currentSection: string
  currentTab: string
  currentFilter: string
  
  // Data arrays
  patients: Patient[]
  appointments: Appointment[]
  invoices: Invoice[]
  staff: Staff[]
  attendance: Attendance[]
  salaries: Salary[]
  inventory: InventoryItem[]
  usageRecords: UsageRecord[]
  feedback: Feedback[]
  
  // Pagination
  patientsPerPage: number
  currentPatientPage: number
  appointmentsPerPage: number
  currentAppointmentPage: number
  billingPerPage: number
  
  // Selected items
  selectedAppointments: Set<string>
  selectedInvoices: Set<string>
  
  // Loading states
  isLoading: boolean
  
  // Actions
  setCurrentSection: (section: string) => void
  setCurrentTab: (tab: string) => void
  setCurrentFilter: (filter: string) => void
  
  // Patient actions
  addPatient: (patient: Omit<Patient, 'id'>) => void
  updatePatient: (id: string, updates: Partial<Patient>) => void
  deletePatient: (id: string) => void
  
  // Appointment actions
  addAppointment: (appointment: Omit<Appointment, 'id'>) => void
  updateAppointment: (id: string, updates: Partial<Appointment>) => void
  deleteAppointment: (id: string) => void
  
  // Invoice actions
  addInvoice: (invoice: Omit<Invoice, 'id'>) => void
  updateInvoice: (id: string, updates: Partial<Invoice>) => void
  deleteInvoice: (id: string) => void
  
  // Staff actions
  addStaff: (staff: Omit<Staff, 'id'>) => void
  updateStaff: (id: string, updates: Partial<Staff>) => void
  deleteStaff: (id: string) => void
  
  // Attendance actions
  addAttendance: (attendance: Attendance) => void
  updateAttendance: (id: string, updates: Partial<Attendance>) => void
  deleteAttendance: (id: string) => void
  
  // Salary actions
  addSalary: (salary: Salary) => void
  updateSalary: (id: string, updates: Partial<Salary>) => void
  deleteSalary: (id: string) => void
  
  // Inventory actions
  addInventoryItem: (item: InventoryItem) => void
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void
  deleteInventoryItem: (id: string) => void
  
  // Usage actions
  addUsageRecord: (record: UsageRecord) => void
  updateUsageRecord: (id: string, updates: Partial<UsageRecord>) => void
  deleteUsageRecord: (id: string) => void
  
  // Feedback actions
  addFeedback: (feedback: Feedback) => void
  updateFeedback: (id: string, updates: Partial<Feedback>) => void
  deleteFeedback: (id: string) => void
  
  // Pagination actions
  setPatientsPerPage: (perPage: number) => void
  setCurrentPatientPage: (page: number) => void
  setAppointmentsPerPage: (perPage: number) => void
  setCurrentAppointmentPage: (page: number) => void
  setBillingPerPage: (perPage: number) => void
  
  // Selection actions
  toggleSelectedAppointment: (id: string) => void
  toggleSelectedInvoice: (id: string) => void
  clearSelectedAppointments: () => void
  clearSelectedInvoices: () => void
  
  // Loading actions
  setLoading: (loading: boolean) => void
  
          // Utility actions
        getPatientById: (id: string) => Patient | undefined
        getPatientsForSelect: () => { value: string; label: string }[]
        
        // ID generation utilities
        generatePatientId: () => string
        generateAppointmentId: () => string
        generateInvoiceId: () => string
        generateStaffId: () => string
        
        // Migration function
        migrateExistingIds: () => void
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentSection: 'dashboard',
        currentTab: 'patient-management',
        currentFilter: 'all',
        
        patients: [
          {
            id: 'p-01',
            name: 'John Doe',
            age: 35,
            gender: 'male' as const,
            phone: '+91 9876543210',
            email: 'john.doe@email.com',
            address: '123 Main Street, Delhi',
            medicalHistory: 'No known allergies',
            status: 'active' as const,
            registrationDate: '2024-01-15',
            lastVisit: '2024-01-20'
          },
          {
            id: 'p-02',
            name: 'Jane Smith',
            age: 28,
            gender: 'female' as const,
            phone: '+91 9876543211',
            email: 'jane.smith@email.com',
            address: '456 Oak Avenue, Mumbai',
            medicalHistory: 'Diabetes',
            status: 'active' as const,
            registrationDate: '2024-01-10',
            lastVisit: '2024-01-18'
          }
        ],
        appointments: [
          {
            id: 'a-01',
            patientId: 'p-01',
            patientName: 'John Doe',
            patientGender: 'male' as const,
            date: '2024-01-25',
            time: '10:00',
            duration: '30 mins',
            type: 'Cleaning',
            status: 'scheduled' as const,
            priority: 'normal' as const,
            notes: 'Regular checkup',
            createdAt: '2024-01-20T10:00:00Z'
          },
          {
            id: 'a-02',
            patientId: 'p-02',
            patientName: 'Jane Smith',
            patientGender: 'female' as const,
            date: '2024-01-26',
            time: '14:00',
            duration: '45 mins',
            type: 'Root Canal',
            status: 'confirmed' as const,
            priority: 'high' as const,
            notes: 'Follow-up treatment',
            createdAt: '2024-01-20T14:00:00Z'
          },
          {
            id: 'a-03',
            patientId: 'p-01',
            patientName: 'John Doe',
            patientGender: 'male' as const,
            date: '2024-01-27',
            time: '11:00',
            duration: '60 mins',
            type: 'Filling',
            status: 'scheduled' as const,
            priority: 'normal' as const,
            notes: 'Cavity treatment',
            createdAt: '2024-01-21T11:00:00Z'
          }
        ],
        invoices: [],
        staff: [
          {
            id: 's-01',
            name: 'Dr. Sarah Johnson',
            role: 'Senior Dentist',
            phone: '+91 9876543220',
            email: 'sarah.johnson@clinic.com',
            joinDate: '2023-01-15',
            status: 'active' as const,
            salary: 120000,
            gender: 'female' as const,
            age: 35,
            address: '123 Medical Street, Delhi',
            qualifications: 'BDS, MDS Orthodontics',
            experience: '10 years',
            jobTerm: 'permanent' as const,
            department: 'Orthodontics',
            emergencyContact: 'Dr. Johnson\'s Husband',
            emergencyPhone: '+91 9876543221',
            notes: 'Specialist in orthodontic treatments'
          },
          {
            id: 's-02',
            name: 'Nurse Mary Wilson',
            role: 'Senior Nurse',
            phone: '+91 9876543222',
            email: 'mary.wilson@clinic.com',
            joinDate: '2023-03-20',
            status: 'on_leave' as const,
            salary: 45000,
            gender: 'female' as const,
            age: 28,
            address: '456 Care Avenue, Mumbai',
            qualifications: 'BSc Nursing',
            experience: '5 years',
            jobTerm: 'permanent' as const,
            department: 'Patient Care',
            emergencyContact: 'Wilson Family',
            emergencyPhone: '+91 9876543223',
            notes: 'Currently on maternity leave'
          },
          {
            id: 's-03',
            name: 'John Smith',
            role: 'Receptionist',
            phone: '+91 9876543224',
            email: 'john.smith@clinic.com',
            joinDate: '2023-06-10',
            status: 'inactive' as const,
            salary: 25000,
            gender: 'male' as const,
            age: 24,
            address: '789 Reception Road, Delhi',
            qualifications: 'High School',
            experience: '2 years',
            jobTerm: 'contract' as const,
            department: 'Administration',
            emergencyContact: 'Smith Family',
            emergencyPhone: '+91 9876543225',
            notes: 'Temporarily inactive due to personal reasons'
          }
        ],
        attendance: [],
        salaries: [],
        inventory: [],
        usageRecords: [],
        feedback: [],
        
        patientsPerPage: 10,
        currentPatientPage: 1,
        appointmentsPerPage: 10,
        currentAppointmentPage: 1,
        billingPerPage: 10,
        
        selectedAppointments: new Set(),
        selectedInvoices: new Set(),
        
        isLoading: false,
        
        // Actions
        setCurrentSection: (section) => set({ currentSection: section }),
        setCurrentTab: (tab) => set({ currentTab: tab }),
        setCurrentFilter: (filter) => set({ currentFilter: filter }),
        
        // Patient actions
        addPatient: (patient) => set((state) => {
          // Generate patient ID with prefix p-01, p-02, etc.
          const patientCount = state.patients.length + 1
          const patientId = `p-${patientCount.toString().padStart(2, '0')}`
          
          return {
            patients: [...state.patients, { ...patient, id: patientId }]
          }
        }),
        
        updatePatient: (id, updates) => set((state) => ({
          patients: state.patients.map(p => 
            p.id === id ? { ...p, ...updates } : p
          )
        })),
        
        deletePatient: (id) => set((state) => ({
          patients: state.patients.filter(p => p.id !== id)
        })),
        
        // Appointment actions
        addAppointment: (appointment) => set((state) => {
          // Generate appointment ID with prefix a-01, a-02, etc.
          const appointmentCount = state.appointments.length + 1
          const appointmentId = `a-${appointmentCount.toString().padStart(2, '0')}`
          
          return {
            appointments: [...state.appointments, { ...appointment, id: appointmentId }]
          }
        }),
        
        updateAppointment: (id, updates) => set((state) => ({
          appointments: state.appointments.map(a => 
            a.id === id ? { ...a, ...updates } : a
          )
        })),
        
        deleteAppointment: (id) => set((state) => ({
          appointments: state.appointments.filter(a => a.id !== id)
        })),
        
        // Invoice actions
        addInvoice: (invoice) => set((state) => {
          // Generate invoice ID with prefix b-01, b-02, etc.
          const invoiceCount = state.invoices.length + 1
          const invoiceId = `b-${invoiceCount.toString().padStart(2, '0')}`
          
          return {
            invoices: [...state.invoices, { ...invoice, id: invoiceId }]
          }
        }),
        
        updateInvoice: (id, updates) => set((state) => ({
          invoices: state.invoices.map(i => 
            i.id === id ? { ...i, ...updates } : i
          )
        })),
        
        deleteInvoice: (id) => set((state) => ({
          invoices: state.invoices.filter(i => i.id !== id)
        })),
        
        // Staff actions
        addStaff: (staff) => set((state) => {
          // Generate staff ID with prefix s-01, s-02, etc.
          const staffCount = state.staff.length + 1
          const staffId = `s-${staffCount.toString().padStart(2, '0')}`
          
          return {
            staff: [...state.staff, { ...staff, id: staffId }]
          }
        }),
        
        updateStaff: (id, updates) => set((state) => ({
          staff: state.staff.map(s => 
            s.id === id ? { ...s, ...updates } : s
          )
        })),
        
        deleteStaff: (id) => set((state) => ({
          staff: state.staff.filter(s => s.id !== id)
        })),
        
        // Attendance actions
        addAttendance: (attendance) => set((state) => ({
          attendance: [...state.attendance, attendance]
        })),
        
        updateAttendance: (id, updates) => set((state) => ({
          attendance: state.attendance.map(a => 
            a.id === id ? { ...a, ...updates } : a
          )
        })),
        
        deleteAttendance: (id) => set((state) => ({
          attendance: state.attendance.filter(a => a.id !== id)
        })),
        
        // Salary actions
        addSalary: (salary) => set((state) => ({
          salaries: [...state.salaries, salary]
        })),
        
        updateSalary: (id, updates) => set((state) => ({
          salaries: state.salaries.map(s => 
            s.id === id ? { ...s, ...updates } : s
          )
        })),
        
        deleteSalary: (id) => set((state) => ({
          salaries: state.salaries.filter(s => s.id !== id)
        })),
        
        // Inventory actions
        addInventoryItem: (item) => set((state) => ({
          inventory: [...state.inventory, item]
        })),
        
        updateInventoryItem: (id, updates) => set((state) => ({
          inventory: state.inventory.map(i => 
            i.id === id ? { ...i, ...updates } : i
          )
        })),
        
        deleteInventoryItem: (id) => set((state) => ({
          inventory: state.inventory.filter(i => i.id !== id)
        })),
        
        // Usage actions
        addUsageRecord: (record) => set((state) => ({
          usageRecords: [...state.usageRecords, record]
        })),
        
        updateUsageRecord: (id, updates) => set((state) => ({
          usageRecords: state.usageRecords.map(r => 
            r.id === id ? { ...r, ...updates } : r
          )
        })),
        
        deleteUsageRecord: (id) => set((state) => ({
          usageRecords: state.usageRecords.filter(r => r.id !== id)
        })),
        
        // Feedback actions
        addFeedback: (feedback) => set((state) => ({
          feedback: [...state.feedback, feedback]
        })),
        
        updateFeedback: (id, updates) => set((state) => ({
          feedback: state.feedback.map(f => 
            f.id === id ? { ...f, ...updates } : f
          )
        })),
        
        deleteFeedback: (id) => set((state) => ({
          feedback: state.feedback.filter(f => f.id !== id)
        })),
        
        // Pagination actions
        setPatientsPerPage: (perPage) => set({ patientsPerPage: perPage }),
        setCurrentPatientPage: (page) => set({ currentPatientPage: page }),
        setAppointmentsPerPage: (perPage) => set({ appointmentsPerPage: perPage }),
        setCurrentAppointmentPage: (page) => set({ currentAppointmentPage: page }),
        setBillingPerPage: (perPage) => set({ billingPerPage: perPage }),
        
        // Selection actions
        toggleSelectedAppointment: (id) => set((state) => {
          const newSelected = new Set(state.selectedAppointments)
          if (newSelected.has(id)) {
            newSelected.delete(id)
          } else {
            newSelected.add(id)
          }
          return { selectedAppointments: newSelected }
        }),
        
        toggleSelectedInvoice: (id) => set((state) => {
          const newSelected = new Set(state.selectedInvoices)
          if (newSelected.has(id)) {
            newSelected.delete(id)
          } else {
            newSelected.add(id)
          }
          return { selectedInvoices: newSelected }
        }),
        
        clearSelectedAppointments: () => set({ selectedAppointments: new Set() }),
        clearSelectedInvoices: () => set({ selectedInvoices: new Set() }),
        
        // Loading actions
        setLoading: (loading) => set({ isLoading: loading }),
        
        // Utility actions
        getPatientById: (id) => {
          const state = get()
          return state.patients.find(p => p.id === id)
        },
        
        getPatientsForSelect: () => {
          const state = get()
          return state.patients.map(p => ({
            value: p.id,
            label: p.name
          }))
        },

        // ID generation utilities
        generatePatientId: () => {
          const state = get()
          const patientCount = state.patients.length + 1
          return `p-${patientCount.toString().padStart(2, '0')}`
        },

        generateAppointmentId: () => {
          const state = get()
          const appointmentCount = state.appointments.length + 1
          return `a-${appointmentCount.toString().padStart(2, '0')}`
        },

        generateInvoiceId: () => {
          const state = get()
          const invoiceCount = state.invoices.length + 1
          return `b-${invoiceCount.toString().padStart(2, '0')}`
        },

        generateStaffId: () => {
          const state = get()
          const staffCount = state.staff.length + 1
          return `s-${staffCount.toString().padStart(2, '0')}`
        },

        // Migration function to update existing IDs to new format
        migrateExistingIds: () => {
          const state = get()
          let hasChanges = false
          
          // Update patient IDs
          const updatedPatients = state.patients.map((patient, index) => {
            if (!patient.id.startsWith('p-')) {
              hasChanges = true
              return { ...patient, id: `p-${(index + 1).toString().padStart(2, '0')}` }
            }
            return patient
          })
          
          // Update appointment IDs
          const updatedAppointments = state.appointments.map((appointment, index) => {
            if (!appointment.id.startsWith('a-')) {
              hasChanges = true
              return { ...appointment, id: `a-${(index + 1).toString().padStart(2, '0')}` }
            }
            return appointment
          })
          
          // Update invoice IDs
          const updatedInvoices = state.invoices.map((invoice, index) => {
            if (!invoice.id.startsWith('b-')) {
              hasChanges = true
              return { ...invoice, id: `b-${(index + 1).toString().padStart(2, '0')}` }
            }
            return invoice
          })
          
          // Update staff IDs
          const updatedStaff = state.staff.map((staff, index) => {
            if (!staff.id.startsWith('s-')) {
              hasChanges = true
              return { ...staff, id: `s-${(index + 1).toString().padStart(2, '0')}` }
            }
            return staff
          })
          
          if (hasChanges) {
            set({
              patients: updatedPatients,
              appointments: updatedAppointments,
              invoices: updatedInvoices,
              staff: updatedStaff
            })
          }
        },
      }),
      {
        name: 'dentalcare-pro-storage',
        partialize: (state) => ({
          patients: state.patients,
          appointments: state.appointments,
          invoices: state.invoices,
          staff: state.staff,
          attendance: state.attendance,
          salaries: state.salaries,
          inventory: state.inventory,
          usageRecords: state.usageRecords,
          feedback: state.feedback,
        }),
      }
    )
  )
)
