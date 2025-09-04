import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  UserPlus, 
  Download, 
  Upload, 
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Printer,
  Calendar,
  DollarSign,
  Clock,
  User,
  Receipt,
  CreditCard,
  TrendingUp,
  ChevronDown,
  CheckCircle,
  XCircle,
  RefreshCw,
  Phone,
  X,
  FileText
} from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { formatDate, formatTime, formatCurrency } from '@/lib/utils'
import PatientForm from '@/components/PatientForm'
import AppointmentForm from '@/components/AppointmentForm'
import InvoiceForm from '@/components/InvoiceForm'
import { Patient, Appointment, Invoice } from '@/stores/useAppStore'

export default function Patients() {
  const [mainTab, setMainTab] = useState('patient')
  const [currentFilter, setCurrentFilter] = useState('all')
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [showImportDropdown, setShowImportDropdown] = useState(false)
  const [showPatientForm, setShowPatientForm] = useState(false)
  const [showPatientDetails, setShowPatientDetails] = useState(false)
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null)
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPatients, setSelectedPatients] = useState<Set<string>>(new Set())
  
  // Refresh trigger states to force data re-rendering
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [appointmentRefreshTrigger, setAppointmentRefreshTrigger] = useState(0)
  const [billingRefreshTrigger, setBillingRefreshTrigger] = useState(0)
  
  // Ref for dropdown
  const filterDropdownRef = useRef<HTMLDivElement>(null)
  const appointmentFilterDropdownRef = useRef<HTMLDivElement>(null)
  const billingFilterDropdownRef = useRef<HTMLDivElement>(null)
  

  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false)
      }
      if (appointmentFilterDropdownRef.current && !appointmentFilterDropdownRef.current.contains(event.target as Node)) {
        setShowAppointmentFilterDropdown(false)
      }
      if (billingFilterDropdownRef.current && !billingFilterDropdownRef.current.contains(event.target as Node)) {
        setShowBillingFilterDropdown(false)
      }
      // Close import dropdown when clicking outside
      if (!event.target || !(event.target as Element).closest('.import-dropdown-container')) {
        setShowImportDropdown(false)
      }
      

    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Appointment states
  const [showAppointmentForm, setShowAppointmentForm] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [appointmentActiveTab, setAppointmentActiveTab] = useState('calendar')
  const [appointmentCurrentFilter, setAppointmentCurrentFilter] = useState<'all' | 'scheduled' | 'confirmed' | 'completed' | 'cancelled'>('all')
  const [appointmentSearchTerm, setAppointmentSearchTerm] = useState('')
  const [appointmentsPerPage, setAppointmentsPerPage] = useState(5)
  const [currentAppointmentPage, setCurrentAppointmentPage] = useState(1)
  const [showAppointmentFilterDropdown, setShowAppointmentFilterDropdown] = useState(false)
  
  // Appointment Details Modal
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false)
  const [viewingAppointment, setViewingAppointment] = useState<Appointment | null>(null)
  
  // Appointment selection for bulk actions
  const [selectedAppointments, setSelectedAppointments] = useState<Set<string>>(new Set())
  
  // Appointment Delete Confirmation Modal
  const [showAppointmentDeleteConfirm, setShowAppointmentDeleteConfirm] = useState(false)
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null)
  
  // Billing states
  const [showInvoiceForm, setShowInvoiceForm] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [billingActiveTab, setBillingActiveTab] = useState('invoices')
  const [billingCurrentFilter, setBillingCurrentFilter] = useState('all')
  const [billingSearchTerm, setBillingSearchTerm] = useState('')
  const [showBillingFilterDropdown, setShowBillingFilterDropdown] = useState(false)
  
  const { 
    patients, 
    appointments,
    invoices,
    addPatient, 
    updatePatient, 
    deletePatient,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    patientsPerPage,
    currentPatientPage,
    setCurrentPatientPage,
    setPatientsPerPage
  } = useAppStore()

  // Clear selected patients when page changes
  useEffect(() => {
    setSelectedPatients(new Set())
  }, [currentPatientPage, patientsPerPage])

  // Data refresh effect for patients
  useEffect(() => {
    if (refreshTrigger > 0) {
      // Force re-render of patient data by updating a state that affects the data
      console.log('Refreshing patient data...')
      // This will trigger a re-render of the filtered and paginated data
    }
  }, [refreshTrigger])

  // Data refresh effect for appointments
  useEffect(() => {
    if (appointmentRefreshTrigger > 0) {
      // Force re-render of appointment data by updating a state that affects the data
      console.log('Refreshing appointment data...')
      // This will trigger a re-render of the filtered and paginated data
    }
  }, [appointmentRefreshTrigger])

  // Data refresh effect for billing
  useEffect(() => {
    if (billingRefreshTrigger > 0) {
      // Force re-render of billing data by updating a state that affects the data
      console.log('Refreshing billing data...')
      // This will trigger a re-render of the filtered and paginated data
    }
  }, [billingRefreshTrigger])

  // Filter patients based on current filter and search
  const filteredPatients = patients.filter(patient => {
    const matchesFilter = currentFilter === 'all' || patient.status === currentFilter
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.phone.includes(searchTerm) ||
                         patient.email.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  // Pagination
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage)
  const startIndex = (currentPatientPage - 1) * patientsPerPage
  const paginatedPatients = filteredPatients.slice(startIndex, startIndex + patientsPerPage)

  // Appointment filtering and pagination
  const filteredAppointments = appointments.filter(appointment => {
    const matchesFilter = appointmentCurrentFilter === 'all' || appointment.status === appointmentCurrentFilter
    const matchesSearch = appointment.patientName.toLowerCase().includes(appointmentSearchTerm.toLowerCase()) ||
                         appointment.type.toLowerCase().includes(appointmentSearchTerm.toLowerCase()) ||
                         appointment.date.includes(appointmentSearchTerm)
    return matchesFilter && matchesSearch
  })

  const appointmentTotalPages = Math.ceil(filteredAppointments.length / appointmentsPerPage)
  const appointmentStartIndex = (currentAppointmentPage - 1) * appointmentsPerPage
  const paginatedAppointments = filteredAppointments.slice(appointmentStartIndex, appointmentStartIndex + appointmentsPerPage)

  // Pagination navigation functions
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPatientPage(page)
    }
  }

  const nextPage = () => {
    if (currentPatientPage < totalPages) {
      setCurrentPatientPage(currentPatientPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPatientPage > 1) {
      setCurrentPatientPage(currentPatientPage - 1)
    }
  }

  // Appointment pagination navigation functions
  const goToAppointmentPage = (page: number) => {
    if (page >= 1 && page <= appointmentTotalPages) {
      setCurrentAppointmentPage(page)
    }
  }

  const nextAppointmentPage = () => {
    if (currentAppointmentPage < appointmentTotalPages) {
      setCurrentAppointmentPage(currentAppointmentPage + 1)
    }
  }

  const prevAppointmentPage = () => {
    if (currentAppointmentPage > 1) {
      setCurrentAppointmentPage(currentAppointmentPage - 1)
    }
  }

  // Generate page numbers with dots
  const getPageNumbers = () => {
    const pages = []
    const current = currentPatientPage
    const total = totalPages
    
    if (total <= 7) {
      // If total pages <= 7, show all pages
      for (let i = 1; i <= total; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)
      
      if (current > 3) {
        pages.push('...')
      }
      
      // Show current page and surrounding pages
      for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        if (i > 1 && i < total) {
          pages.push(i)
        }
      }
      
      if (current < total - 2) {
        pages.push('...')
      }
      
      // Always show last page
      if (total > 1) {
        pages.push(total)
      }
    }
    
    return pages
  }

  const handleSavePatient = (patientData: Omit<Patient, 'id'>) => {
    if (editingPatient) {
      updatePatient(editingPatient.id, patientData)
      setEditingPatient(null)
    } else {
      addPatient({
        ...patientData,
        registrationDate: new Date().toISOString()
      })
    }
    setShowPatientForm(false)
  }

  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient)
    setShowPatientForm(true)
  }

  const handleDeletePatient = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId)
    if (patient) {
      setPatientToDelete(patient)
      setShowDeleteConfirm(true)
    }
  }

  const confirmDelete = () => {
    if (patientToDelete) {
      // Delete all appointments associated with this patient
      const patientAppointments = appointments.filter(a => a.patientId === patientToDelete.id)
      patientAppointments.forEach(appointment => {
        deleteAppointment(appointment.id)
      })
      
      // Delete the patient
      deletePatient(patientToDelete.id)
      
      showToast(`Patient and ${patientAppointments.length} appointments deleted successfully`, 'success')
      setShowDeleteConfirm(false)
      setPatientToDelete(null)
    }
  }

  const cancelDelete = () => {
    setShowDeleteConfirm(false)
    setPatientToDelete(null)
  }

  // Bulk selection handlers
  const handleSelectPatient = (patientId: string, checked: boolean) => {
    const newSelected = new Set(selectedPatients)
    if (checked) {
      newSelected.add(patientId)
    } else {
      newSelected.delete(patientId)
    }
    setSelectedPatients(newSelected)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPatients(new Set(paginatedPatients.map(p => p.id)))
    } else {
      setSelectedPatients(new Set())
    }
  }

  const handleSelectAppointment = (appointmentId: string, checked: boolean) => {
    const newSelected = new Set(selectedAppointments)
    if (checked) {
      newSelected.add(appointmentId)
    } else {
      newSelected.delete(appointmentId)
    }
    setSelectedAppointments(newSelected)
  }

  const handleSelectAllAppointments = (checked: boolean) => {
    if (checked) {
      setSelectedAppointments(new Set(paginatedAppointments.map(a => a.id)))
    } else {
      setSelectedAppointments(new Set())
    }
  }

  const handleBulkDelete = () => {
    if (selectedPatients.size === 0) return
    setShowBulkDeleteConfirm(true)
  }

  const handleBulkDeleteAppointments = () => {
    if (selectedAppointments.size === 0) return
    
    // Delete selected appointments
    selectedAppointments.forEach(appointmentId => {
      deleteAppointment(appointmentId)
    })
    
    // Clear selection
    setSelectedAppointments(new Set())
    showToast('Selected appointments deleted successfully', 'success')
  }

  const confirmBulkDelete = () => {
    const patientNames = Array.from(selectedPatients)
      .map(id => patients.find(p => p.id === id)?.name)
      .filter(Boolean)
      .join(', ')
    
    let totalAppointmentsDeleted = 0
    
    selectedPatients.forEach(patientId => {
      // Delete all appointments associated with this patient
      const patientAppointments = appointments.filter(a => a.patientId === patientId)
      patientAppointments.forEach(appointment => {
        deleteAppointment(appointment.id)
      })
      totalAppointmentsDeleted += patientAppointments.length
      
      // Delete the patient
      deletePatient(patientId)
    })
    
    setSelectedPatients(new Set())
    setShowBulkDeleteConfirm(false)
    showToast(`${selectedPatients.size} patients and ${totalAppointmentsDeleted} appointments deleted successfully`, 'success')
  }

  const cancelBulkDelete = () => {
    setShowBulkDeleteConfirm(false)
  }

  // Additional action handlers
  const handleViewPatient = (patient: Patient) => {
    console.log('Opening patient details for:', patient)
    setViewingPatient(patient)
    setShowPatientDetails(true)
  }

  const handlePrintPatient = (patient: Patient) => {
    // Create print window with patient medical record
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (!printWindow) return

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
          <title>Patient Record - ${patient.name}</title>
          <style>
              @media print {
                  body { margin: 0; }
                  .no-print { display: none !important; }
                  #printButtonContainer { display: none !important; }
                  div[id="printButtonContainer"] { display: none !important; }
                  .print-button { display: none !important; }
              }
              
              @keyframes float {
                  0%, 100% { transform: translateY(0px) rotate(0deg); }
                  50% { transform: translateY(-20px) rotate(180deg); }
              }
              
              body { 
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                  margin: 0; 
                  padding: 0; 
                  background: #f8fafc;
                  color: #1e293b;
              }
              
              .container {
                  width: 100%;
                  margin: 0px auto 20px auto;
                  background: white;
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              }
              
              .header {
                  background: #dbeafe;
                  color: #2563eb;
                  padding: 2rem;
                  text-align: center;
                  position: relative;
                  overflow: hidden;
              }
              
              .header::before {
                  content: '';
                  position: absolute;
                  top: -50%;
                  left: -50%;
                  width: 200%;
                  height: 200%;
                  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
                  animation: float 6s ease-in-out infinite;
              }
              
              .header h1 {
                  margin: 0;
                  font-size: 2.5rem;
                  font-weight: 700;
                  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
                  position: relative;
                  z-index: 1;
              }
              
              .header h2 {
                  margin: 0.5rem 0 0 0;
                  font-size: 1.5rem;
                  font-weight: 400;
                  opacity: 0.9;
                  position: relative;
                  z-index: 1;
              }
              
              .clinic-info {
                  background: rgba(255,255,255,0.1);
                  padding: 1rem;
                  border-radius: 12px;
                  margin-top: 1rem;
                  backdrop-filter: blur(10px);
                  position: relative;
                  z-index: 1;
              }
              
              .content {
                  padding: 2rem;
              }
              
              .section {
                  margin-bottom: 2rem;
                  background: #f8fafc;
                  border-radius: 12px;
                  padding: 1.5rem;
              }
              
              .section h3 {
                  margin: 0 0 1rem 0;
                  color: #2563eb;
                  font-size: 1.25rem;
                  font-weight: 600;
                  display: flex;
                  align-items: center;
                  gap: 0.5rem;
              }
              
              .info-grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                  gap: 1rem;
              }
              
              .info-item {
                  background: white;
                  padding: 1rem;
                  border-radius: 8px;
                  border: 1px solid #e2e8f0;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              }
              
              .info-label {
                  font-weight: 600;
                  color: #475569;
                  font-size: 0.875rem;
                  text-transform: uppercase;
                  letter-spacing: 0.05em;
                  margin-bottom: 0.25rem;
              }
              
              .info-value {
                  color: #1e293b;
                  font-size: 1rem;
                  font-weight: 500;
              }
              
              .highlight-box {
              background: white;
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                  border-radius: 8px;
                  padding: 1rem;
                  margin: 1rem 0;
              }
              
              .medical-history {
                  background: #f8fafc;
              }
              
              .footer {
                  background: #f8fafc;
                  padding: 1.5rem;
                  text-align: center;
                  border-top: 1px solid #e2e8f0;
              }
              
              .footer p {
                  margin: 0;
                  color: #64748b;
                  font-size: 0.875rem;
              }
              
              .status-badge {
                  display: inline-block;
                  padding: 0.25rem 0.75rem;
                  border-radius: 20px;
                  font-size: 0.75rem;
                  font-weight: 600;
                  text-transform: uppercase;
                  letter-spacing: 0.05em;
              }
              
              .status-active {
                  background: #dcfce7;
                  color: #15803d;
                  
              }
              
              .status-inactive {
                  background: #fef2f2;
                  color: #dc2626;
                  
              }
          </style>
      </head>
      <body>
      <!-- Print Button (Top Right Corner) -->
  <div id="printButtonContainer" class="no-print" style="
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      background: #059669;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(5, 150, 105, 0.4);
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-weight: 600;
      transition: all 0.3s ease;
      border: none;
      display: flex;
      align-items: center;
      gap: 8px;
  " onclick="window.print()" onmouseover="this.style.background='#047857'; this.style.transform='scale(1.05)'" onmouseout="this.style.background='#059669'; this.style.transform='scale(1)'">
      <i class="fas fa-print"></i>
      Print Patient
      </div>
          <div class="container">
              <div class="header">
                  <h1>🦷 DentalCare Pro</h1>
                  <h2>Patient Medical Record</h2>
                  <div class="clinic-info">
                      <strong>Professional Dental Care Services</strong><br>
                      <small>Excellence in Oral Health</small>
                  </div>
              </div>
              
              <div class="content">
                  <div class="section">
                      <h3>Patient Information</h3>
                      <div class="info-grid">
                          <div class="info-item">
                              <div class="info-label">Patient ID</div>
                              <div class="info-value">${patient.id}</div>
                          </div>
                          <div class="info-item">
                              <div class="info-label">Full Name</div>
                              <div class="info-value">${patient.name}</div>
                          </div>
                          <div class="info-item">
                              <div class="info-label">Phone Number</div>
                              <div class="info-value">${patient.phone || 'N/A'}</div>
                          </div>
                          <div class="info-item">
                              <div class="info-label">Email Address</div>
                              <div class="info-value">${patient.email || 'N/A'}</div>
                          </div>
                          <div class="info-item">
                              <div class="info-label">Date of Birth</div>
                              <div class="info-value">${patient.registrationDate ? new Date(patient.registrationDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit'
                              }) : 'N/A'}</div>
                          </div>
                          <div class="info-item">
                              <div class="info-label">Age</div>
                              <div class="info-value">${patient.age} years</div>
                          </div>
                          <div class="info-item">
                              <div class="info-label">Gender</div>
                              <div class="info-value">${patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : 'N/A'}</div>
                          </div>
                          <div class="info-item">
                              <div class="info-label">Status</div>
                              <div class="info-value">
                                  <span class="status-badge ${(patient.status || 'active').toLowerCase() === 'active' ? 'status-active' : 'status-inactive'}">
                                      ${patient.status || 'Active'}
                                  </span>
                              </div>
                          </div>
                      </div>
                  </div>
                  
                  ${patient.address ? `
                  <div class="section">
                      <h3>Address Information</h3>
                      <div class="highlight-box">
                          <div class="info-label">Residential Address</div>
                          <div class="info-value">${patient.address}</div>
                      </div>
                  </div>
                  ` : ''}
                  
                  <div class="section medical-history">
                      <h3>Medical History</h3>
                      <div class="highlight-box">
                          ${patient.medicalHistory ? patient.medicalHistory : 'No medical history recorded for this patient.'}
                      </div>
                  </div>
                  
                  ${patient.registrationDate ? `
                  <div class="section">
                      <h3>Record Information</h3>
                      <div class="info-grid">
                          <div class="info-item">
                              <div class="info-label">Registration Date</div>
                              <div class="info-value">${new Date(patient.registrationDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}</div>
                          </div>
                      </div>
                  </div>
                  ` : ''}
              </div>
              
              <div class="footer">
                  <p><strong>Generated on:</strong> ${new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })} at ${new Date().toLocaleTimeString()}</p>
                  <p>This is an official medical record from Dental Clinic</p>
              </div>
          </div>
      </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
  }

  const handleToggleStatus = (patient: Patient) => {
    const newStatus = patient.status === 'active' ? 'inactive' : 'active'
    updatePatient(patient.id, { status: newStatus })
  }

  // Appointment handlers
  const handleSaveAppointment = (appointmentData: Omit<Appointment, 'id'>) => {
    if (editingAppointment) {
      updateAppointment(editingAppointment.id, appointmentData)
      setEditingAppointment(null)
    } else {
      addAppointment({
        ...appointmentData
      })
    }
    setShowAppointmentForm(false)
  }

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment)
    setShowAppointmentForm(true)
  }

  const handleDeleteAppointment = (id: string) => {
    const appointment = appointments.find(a => a.id === id)
    if (appointment) {
      setAppointmentToDelete(appointment)
      setShowAppointmentDeleteConfirm(true)
    }
  }

  const confirmDeleteAppointment = () => {
    if (appointmentToDelete) {
      deleteAppointment(appointmentToDelete.id)
      showToast(`Appointment deleted successfully`, 'success')
      setShowAppointmentDeleteConfirm(false)
      setAppointmentToDelete(null)
    }
  }

  const cancelDeleteAppointment = () => {
    setShowAppointmentDeleteConfirm(false)
    setAppointmentToDelete(null)
  }

  const handleUpdateAppointmentStatus = (appointmentId: string, status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled') => {
    // Update appointment status
    const appointment = appointments.find(a => a.id === appointmentId)
    if (appointment) {
      updateAppointment(appointmentId, { ...appointment, status })
      // Show success toast
      showToast(`Appointment status updated to ${status}`, 'success')
    }
  }

  const handleViewAppointment = (appointment: Appointment) => {
    // Handle viewing appointment details
    console.log('Viewing appointment:', appointment)
  }

  const handlePrintAppointment = (appointment: Appointment) => {
    // Create print window with appointment details
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (!printWindow) return

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
          <title>Appointment Record - ${appointment.patientName}</title>
          <style>
              @media print {
                  body { margin: 0; }
                  .no-print { display: none !important; }
                  #printButtonContainer { display: none !important; }
                  div[id="printButtonContainer"] { display: none !important; }
                  .print-button { display: none !important; }
              }
              
              @keyframes float {
                  0%, 100% { transform: translateY(0px) rotate(0deg); }
                  50% { transform: translateY(-20px) rotate(180deg); }
              }
              
              body { 
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                  margin: 0; 
                  padding: 0; 
                  background: #f8fafc;
                  color: #1e293b;
              }
              
              .container {
                  width: 100%;
                  margin: 0px auto 20px auto;
                  background: white;
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              }
              
              .header {
                  background: #dbeafe;
                  color: #2563eb;
                  padding: 2rem;
                  text-align: center;
                  position: relative;
                  overflow: hidden;
              }
              
              .header::before {
                  content: '';
                  position: absolute;
                  top: -50%;
                  left: -50%;
                  width: 200%;
                  height: 200%;
                  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
                  animation: float 6s ease-in-out infinite;
              }
              
              .header h1 {
                  margin: 0;
                  font-size: 2.5rem;
                  font-weight: 700;
                  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
                  position: relative;
                  z-index: 1;
              }
              
              .header h2 {
                  margin: 0.5rem 0 0 0;
                  font-size: 1.5rem;
                  font-weight: 400;
                  opacity: 0.9;
                  position: relative;
                  z-index: 1;
              }
              
              .clinic-info {
                  background: rgba(255,255,255,0.1);
                  padding: 1rem;
                  border-radius: 12px;
                  margin-top: 1rem;
                  backdrop-filter: blur(10px);
                  position: relative;
                  z-index: 1;
              }
              
              .content {
                  padding: 2rem;
              }
              
              .section {
                  margin-bottom: 2rem;
                  background: #f8fafc;
                  border-radius: 12px;
                  padding: 1.5rem;
              }
              
              .section h3 {
                  margin: 0 0 1rem 0;
                  color: #2563eb;
                  font-size: 1.25rem;
                  font-weight: 600;
                  display: flex;
                  align-items: center;
                  gap: 0.5rem;
              }
              
              .info-grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                  gap: 1rem;
              }
              
              .info-item {
                  background: white;
                  padding: 1rem;
                  border-radius: 8px;
                  border: 1px solid #e2e8f0;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              }
              
              .info-label {
                  font-weight: 600;
                  color: #475569;
                  font-size: 0.875rem;
                  text-transform: uppercase;
                  letter-spacing: 0.05em;
                  margin-bottom: 0.25rem;
              }
              
              .info-value {
                  color: #1e293b;
                  font-size: 1rem;
                  font-weight: 500;
              }
              
              .highlight-box {
              background: white;
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                  border-radius: 8px;
                  padding: 1rem;
                  margin: 1rem 0;
              }
              
              .appointment-notes {
                  background: #f8fafc;
              }
              
              .footer {
                  background: #f8fafc;
                  padding: 1.5rem;
                  text-align: center;
                  border-top: 1px solid #e2e8f0;
              }
              
              .footer p {
                  margin: 0;
                  color: #64748b;
                  font-size: 0.875rem;
              }
              
              .status-badge {
                  display: inline-block;
                  padding: 0.25rem 0.75rem;
                  border-radius: 20px;
                  font-size: 0.75rem;
                  font-weight: 600;
                  text-transform: uppercase;
                  letter-spacing: 0.05em;
              }
              
              .status-confirmed {
                  background: #dcfce7;
                  color: #15803d;
              }
              
              .status-scheduled {
                  background: #fef3c7;
                  color: #d97706;
              }
              
              .status-completed {
                  background: #dcfce7;
                  color: #15803d;
              }
              
              .status-cancelled {
                  background: #fef2f2;
                  color: #dc2626;
              }
          </style>
      </head>
      <body>
      <!-- Print Button (Top Right Corner) -->
  <div id="printButtonContainer" class="no-print" style="
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      background: #059669;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(5, 150, 105, 0.4);
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-weight: 600;
      transition: all 0.3s ease;
      border: none;
      display: flex;
      align-items: center;
      gap: 8px;
  " onclick="window.print()" onmouseover="this.style.background='#047857'; this.style.transform='scale(1.05)'" onmouseout="this.style.background='#059669'; this.style.transform='scale(1)'">
      <i class="fas fa-print"></i>
      Print Appointment
      </div>
          <div class="container">
              <div class="header">
                  <h1>🦷 DentalCare Pro</h1>
                  <h2>Appointment Record</h2>
                  <div class="clinic-info">
                      <strong>Professional Dental Care Services</strong><br>
                      <small>Excellence in Oral Health</small>
                  </div>
              </div>
              
              <div class="content">
                  <div class="section">
                      <h3>Appointment Information</h3>
                      <div class="info-grid">
                          <div class="info-item">
                              <div class="info-label">Appointment ID</div>
                              <div class="info-value">a-${appointment.id.slice(-2)}</div>
                          </div>
                          <div class="info-item">
                              <div class="info-label">Patient Name</div>
                              <div class="info-value">${appointment.patientName}</div>
                          </div>
                          <div class="info-item">
                              <div class="info-label">Appointment Date</div>
                              <div class="info-value">${formatDate(appointment.date)}</div>
                          </div>
                          <div class="info-item">
                              <div class="info-label">Appointment Time</div>
                              <div class="info-value">${appointment.time}</div>
                          </div>
                          <div class="info-item">
                              <div class="info-label">Duration</div>
                              <div class="info-value">60 minutes</div>
                          </div>
                          <div class="info-item">
                              <div class="info-label">Treatment Type</div>
                              <div class="info-value">${appointment.type || 'Consultation'}</div>
                          </div>
                          <div class="info-item">
                              <div class="info-label">Priority</div>
                              <div class="info-value">${appointment.priority.charAt(0).toUpperCase() + appointment.priority.slice(1)}</div>
                          </div>
                          <div class="info-item">
                              <div class="info-label">Status</div>
                              <div class="info-value">
                                  <span class="status-badge status-${appointment.status}">
                                      ${appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                  </span>
                              </div>
                          </div>
                      </div>
                  </div>
                  
                  <div class="section appointment-notes">
                      <h3>Appointment Notes</h3>
                      <div class="highlight-box">
                          ${appointment.notes || 'No notes available for this appointment.'}
                      </div>
                  </div>
                  
                  <div class="section">
                      <h3>Record Information</h3>
                      <div class="info-grid">
                          <div class="info-item">
                              <div class="info-label">Created Date</div>
                              <div class="info-value">${formatDate(appointment.createdAt)}</div>
                          </div>
                      </div>
                  </div>
              </div>
              
              <div class="footer">
                  <p><strong>Generated on:</strong> ${new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })} at ${new Date().toLocaleTimeString()}</p>
                  <p>This is an official appointment record from Dental Clinic</p>
              </div>
          </div>
      </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
  }

  const handleViewAppointmentDetails = (appointment: Appointment) => {
    setViewingAppointment(appointment)
    setShowAppointmentDetails(true)
  }

  // Billing handlers
  const handleSaveInvoice = (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber'>) => {
    if (editingInvoice) {
      updateInvoice(editingInvoice.id, invoiceData)
      setEditingInvoice(null)
    } else {
      addInvoice({
        ...invoiceData,
        invoiceNumber: `INV-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        invoiceDate: new Date().toISOString()
      })
    }
    setShowInvoiceForm(false)
  }

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice)
    setShowInvoiceForm(true)
  }

  const handleDeleteInvoice = (invoiceId: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      deleteInvoice(invoiceId)
    }
  }

  // Show toast message function
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    // Create toast element
    const toast = document.createElement('div')
    toast.className = `fixed top-4 right-4 z-[99999] px-6 py-3 rounded-lg text-white font-medium shadow-lg transition-all duration-300 ${
      type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    }`
    toast.textContent = message
    
    // Add to page
    document.body.appendChild(toast)
    
    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.opacity = '0'
      setTimeout(() => {
        document.body.removeChild(toast)
      }, 300)
    }, 3000)
  }

  // Download sample CSV file for import
  const downloadSampleCSV = () => {
    const csvContent = `name,age,gender,phone,email,address,medicalHistory,status,registrationDate
John Doe,25,male,1234567890,john@email.com,123 Main St,None,active,2025-01-01
Jane Smith,30,female,0987654321,jane@email.com,456 Oak Ave,Allergies,active,2025-01-02
Mike Johnson,35,male,1122334455,mike@email.com,789 Pine Rd,Diabetes,inactive,2025-01-03`
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample_patients.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    showToast('Sample CSV downloaded!', 'success')
  }

  // Handle file import for patients
  // Expected CSV format:
  // name,age,gender,phone,email,address,medicalHistory,status,registrationDate
  // John Doe,25,male,1234567890,john@email.com,123 Main St,None,active,2025-01-01
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        let patients: any[] = []

        if (file.name.endsWith('.json')) {
          patients = JSON.parse(content)
        } else if (file.name.endsWith('.csv')) {
          // Simple CSV parsing
          const lines = content.split('\n').filter(line => line.trim() !== '')
          const headers = lines[0].split(',').map(h => h.trim())
          patients = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim())
            const patient: any = {}
            headers.forEach((header, index) => {
              patient[header] = values[index] || ''
            })
            return patient
          })
        } else {
          alert('Please select a CSV or JSON file')
          return
        }

        console.log('Parsed patients:', patients) // Debug log

        // Process imported patients
        if (patients.length > 0) {
          let successCount = 0
          let skippedCount = 0
          
          patients.forEach((patient, index) => {
            // Validate required fields
            if (patient.name && patient.phone && patient.name.trim() !== '' && patient.phone.trim() !== '') {
              try {
                const newPatient = {
                  name: patient.name.trim(),
                  age: parseInt(patient.age) || 0,
                  gender: (patient.gender || 'male').toLowerCase() as 'male' | 'female' | 'other',
                  phone: patient.phone.trim(),
                  email: patient.email || '',
                  address: patient.address || '',
                  medicalHistory: patient.medicalHistory || '',
                  status: (patient.status || 'active').toLowerCase() as 'active' | 'inactive' | 'pending',
                  registrationDate: patient.registrationDate || new Date().toISOString().split('T')[0]
                }
                
                console.log('Adding patient:', newPatient) // Debug log
                addPatient(newPatient)
                successCount++
              } catch (error) {
                console.error('Error adding patient:', patient, error)
                skippedCount++
              }
            } else {
              console.log('Skipping patient due to missing name or phone:', patient) // Debug log
              skippedCount++
            }
          })
          
          if (successCount > 0) {
            showToast(`Successfully imported ${successCount} patients!${skippedCount > 0 ? ` (${skippedCount} skipped)` : ''}`, 'success')
            console.log(`Import completed. ${successCount} patients added, ${skippedCount} skipped.`) // Debug log
            
            // Refresh the patient list and reset to first page
            setCurrentPatientPage(1)
            setSelectedPatients(new Set())
          } else {
            showToast(`No valid patients imported. ${skippedCount} records skipped.`, 'error')
          }
        } else {
          showToast('No valid patients found in file', 'error')
        }
      } catch (error) {
        console.error('Import error:', error)
        showToast('Error importing file. Please check the file format.', 'error')
      }
    }

    reader.readAsText(file)
    // Reset file input
    event.target.value = ''
  }



  const filters = [
    { value: 'all', label: 'All Patients' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ]

  // Loading states for refresh buttons
  const [isRefreshingPatients, setIsRefreshingPatients] = useState(false)
  const [isRefreshingAppointments, setIsRefreshingAppointments] = useState(false)
  const [isRefreshingBilling, setIsRefreshingBilling] = useState(false)

  return (
    <div className="p-6">
      {/* Patient Services Header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Patient Services</h2>
      </div>

      {/* Main Navigation Tabs */}
      <div className="bg-white border border-gray-200 rounded-lg p-2 mb-4 shadow-sm">
        <div className="flex gap-2">
        <button
          onClick={() => setMainTab('patient')}
          className={`flex items-center gap-2 px-4 py-2 border-none rounded-lg font-medium cursor-pointer ${
            mainTab === 'patient'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-transparent text-gray-700 hover:bg-gray-50'
            }`}
          >
          <Users className="w-4 h-4" />
          Patient
        </button>
            <button
            onClick={() => setMainTab('appointment')}
            className={`flex items-center gap-2 px-4 py-2 border-none rounded-lg font-medium cursor-pointer ${
              mainTab === 'appointment'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-transparent text-gray-700 hover:bg-gray-50'
              }`}
            >
            <Calendar className="w-4 h-4" />
            Appointment
            </button>
          <button
            onClick={() => setMainTab('billing')}
            className={`flex items-center gap-2 px-4 py-2 border-none rounded-lg font-medium cursor-pointer ${
              mainTab === 'billing'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-transparent text-gray-700 hover:bg-gray-50'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Billing
          </button>
        </div>
      </div>

      {/* Patient Tab Content */}
      {mainTab === 'patient' && (
        <>


      {/* Patient Filters and Actions */}
      <div className="bg-white border border-gray-200 rounded-2xl p-3 mb-4 shadow-md">
        <div className="flex gap-3 items-center justify-between flex-wrap">
              {/* Patient Filter Dropdown */}
              <div className="flex items-center gap-2">
                <div className="relative" ref={filterDropdownRef}>
                  <button
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className="flex items-center gap-2 px-3 py-2 bg-primary-500 text-white border border-primary-500 rounded-lg text-sm font-medium cursor-pointer min-h-[36px] whitespace-nowrap hover:bg-primary-600"
                  >
                    <Users className="w-4 h-4 text-white" />
                    {filters.find(f => f.value === currentFilter)?.label || 'All Patients'}
                    <ChevronDown className={`w-4 h-4 ml-2 ${showFilterDropdown ? 'rotate-180' : ''} text-white`} />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showFilterDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
            {filters.map((filter) => (
              <button
                key={filter.value}
                          onClick={() => {
                            setCurrentFilter(filter.value)
                            setShowFilterDropdown(false)
                          }}
                          className={`flex items-center gap-2 w-full px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-gray-50 ${
                  currentFilter === filter.value
                              ? 'bg-primary-500 text-white'
                              : 'text-gray-700'
                }`}
              >
                          <Users className="w-4 h-4" />
                {filter.label}
                          {filter.value === 'active' && <CheckCircle className="w-4 h-4 ml-auto text-green-500" />}
                          {filter.value === 'inactive' && <XCircle className="w-4 h-4 ml-auto text-red-500" />}
              </button>
            ))}
                    </div>
                  )}
                </div>
          </div>

              {/* Action Buttons */}
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => setShowPatientForm(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-primary-500 text-white border border-primary-500 rounded-lg text-sm font-medium cursor-pointer min-h-[36px] hover:bg-primary-600 hover:border-primary-600"
                >
                  <Plus className="w-4 h-4" />
                  Add New Patient
                </button>
                <div className="relative import-dropdown-container">
                  <button 
                    onClick={() => setShowImportDropdown(!showImportDropdown)}
                    className="flex items-center justify-center w-10 h-10 bg-primary-500 rounded-lg text-white hover:bg-primary-600"
                    title="Import Patients"
                  >
              <Upload className="w-4 h-4" />
            </button>
                  
                  {/* Import Dropdown */}
                  {showImportDropdown && (
                    <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      <div className="p-2">
                        <div className="text-xs font-medium text-gray-500 mb-2 px-2">Select file type to import:</div>
                        <button
                          onClick={() => {
                            document.getElementById('csvInput')?.click()
                            setShowImportDropdown(false)
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
                        >
                          CSV File
                        </button>
                        <button
                          onClick={() => {
                            document.getElementById('excelInput')?.click()
                            setShowImportDropdown(false)
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
                        >
                          Excel File
                        </button>
                        <button
                          onClick={() => {
                            document.getElementById('jsonInput')?.click()
                            setShowImportDropdown(false)
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
                        >
                          JSON File
                        </button>
                        <div className="border-t border-gray-200 my-2"></div>
                        <button
                          onClick={() => downloadSampleCSV()}
                          className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
              <Download className="w-4 h-4" />
                          Download Sample CSV
            </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={() => {
                    setIsRefreshingPatients(true)
                    // Show toast message
                    showToast('Refreshing patients list...', 'success')
                    // Reset search and filters
                    setSearchTerm('')
                    setCurrentFilter('all')
                    setSelectedPatients(new Set())
                    // Reset to first page
                    setCurrentPatientPage(1)
                    // Trigger data refresh
                    setRefreshTrigger(prev => prev + 1)
                    // Stop loading immediately
                    setIsRefreshingPatients(false)
                  }}
                  disabled={isRefreshingPatients}
                  className="flex items-center justify-center w-10 h-10 bg-white border border-primary-500 rounded-lg text-primary-500 hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Refresh Patients"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshingPatients ? 'animate-spin' : ''}`} />
                </button>
                
                {/* Hidden file inputs for different file types */}
                <input
                  id="csvInput"
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleFileImport(e)}
                  className="hidden"
                />
                <input
                  id="excelInput"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => handleFileImport(e)}
                  className="hidden"
                />
                <input
                  id="jsonInput"
                  type="file"
                  accept=".json"
                  onChange={(e) => handleFileImport(e)}
                  className="hidden"
                />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6 bg-white border border-gray-300 rounded-lg p-2 shadow-sm">
        <input
          type="text"
          placeholder="Search patients by name, phone, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pr-12  rounded-lg text-base bg-white focus:outline-none focus:border-primary-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]"
        />
        <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
      </div>

          {/* Patients Table Header */}
          <div key={`patients-table-${refreshTrigger}`} className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-gray-700 font-medium">Total Patients: {filteredPatients.length}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-600 text-sm">
                  Showing {startIndex + 1}-{Math.min(startIndex + patientsPerPage, filteredPatients.length)} of {filteredPatients.length} patients
                </span>
                {selectedPatients.size > 0 && (
                  <button
                    onClick={() => handleBulkDelete()}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white border border-red-500 rounded-lg text-sm font-medium cursor-pointer hover:bg-red-600 hover:border-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Selected
                  </button>
                )}
              </div>
            </div>
 {/* Patients Table */}
 <div key={`patients-table-${refreshTrigger}`} className="  rounded-lg shadow-sm overflow-hidden">
            {/* Table Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedPatients.size === paginatedPatients.length && paginatedPatients.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 text-primary-500 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700"></span>
                </div>
                <div className="flex-1 text-sm font-medium text-gray-700"></div>
                <div className="text-sm font-medium text-gray-700"></div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200">
        {paginatedPatients.length > 0 ? (
                paginatedPatients.map((patient, index) => (
            <motion.div
              key={patient.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
                    className="px-6 py-4 hover:bg-blue-50"
            >
                <div className="flex items-center gap-4">
                      {/* Checkbox and Number */}
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedPatients.has(patient.id)}
                          onChange={(e) => handleSelectPatient(patient.id, e.target.checked)}
                          className="w-4 h-4 text-primary-500 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                        />
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-sm font-medium text-blue-600">
                          {startIndex + index + 1}
                    </div>
                  </div>

                      {/* Patient Information */}
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-100" style={{ aspectRatio: '1/1' }}>
                          <i className="fas fa-user text-xl text-blue-600"></i>
                        </div>
                        <div className="w-full ml-4">
                          <div className="patient-name-box mb-2">
                            <h3 className="text-m font-medium">
                      {patient.name}
                    </h3>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="px-3 py-1 bg-blue-100 rounded-lg">
                              <span className="text-sm font-medium text-blue-600">
                                {patient.age} years
                              </span>
                            </div>
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                              patient.gender === 'female' ? 'bg-pink-100' : 'bg-primary-100'
                            }`}>
                              <i className={`fas ${
                                patient.gender === 'female' ? 'fa-venus' : 'fa-mars'
                              } text-sm ${
                                patient.gender === 'female' ? 'text-pink-500' : 'text-primary-500'
                              }`}></i>
                            </div>
                          </div>
                  </div>
                </div>

                      {/* Phone, Status, and Actions */}
                      <div className="flex items-center gap-6">
                        {/* Phone and Status */}
                        <div className="flex flex-col gap-2">
                          <div className="px-3 py-1 bg-blue-100 rounded-lg">
                            <div className="flex items-center gap-2 text-blue-600">
                              <Phone className="w-4 h-4" />
                              <span className="text-sm font-medium">{patient.phone}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-center">
                            <div 
                              onClick={() => handleToggleStatus(patient)}
                              className={`toggle-switch mb-1 ${patient.status === 'active' ? 'active' : ''}`}
                            >
                              <div className="toggle-thumb"></div>
                            </div>
                            <span className={`text-sm font-medium capitalize ${
                              patient.status === 'active' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {patient.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                          </div>
                </div>

                        {/* Action Buttons */}
                <div className="flex gap-2">
                          <button
                            onClick={() => handleViewPatient(patient)}
                            className="w-10 h-10 p-5 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 hover:bg-blue-200"
                            title="View Patient"
                          >
                            <i className="fas fa-eye" ></i>
                          </button>
                  <button
                    onClick={() => handleEditPatient(patient)}
                            className="w-10 h-10 p-5 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 hover:bg-blue-200"
                    title="Edit Patient"
                  >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            onClick={() => handlePrintPatient(patient)}
                            className="w-10 h-10 p-5 bg-white border border-yellow-300 rounded-lg flex items-center justify-center text-yellow-600 hover:bg-yellow-50"
                            title="Print Patient"
                          >
                            <i className="fas fa-print"></i>
                  </button>
                  <button
                    onClick={() => handleDeletePatient(patient.id)}
                            className="w-10 h-10 p-5 bg-white border border-red-300 rounded-lg flex items-center justify-center text-red-600 hover:bg-red-50"
                    title="Delete Patient"
                  >
                            <i className="fas fa-trash"></i>
                  </button>
                        </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-medium mb-2">No patients found</h3>
            <p>Get started by adding your first patient</p>
          </div>
        )}
            </div>
      </div>


 {/* Pagination Footer */}
 <div className="bg-white border-t border-gray-200 rounded-sm p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-gray-600 text-sm">Show</span>
                <select
                  value={patientsPerPage}
                  onChange={(e) => {
                    setPatientsPerPage(Number(e.target.value))
                    setCurrentPatientPage(1) // Reset to first page when changing page size
                  }}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-primary-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-gray-600 text-sm">Patient</span>
          </div>
              
              {/* Pagination Navigation */}
              <div className="flex items-center gap-2">
                {/* Previous Button */}
            <button
                  onClick={prevPage}
              disabled={currentPatientPage === 1}
                  className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg ${
                    currentPatientPage === 1
                      ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800 bg-white border border-gray-300'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
              Previous
            </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {getPageNumbers().map((page, index) => (
                    <div key={index}>
                      {page === '...' ? (
                        <span className="px-3 py-2 text-gray-400">...</span>
                      ) : (
              <button
                          onClick={() => goToPage(page as number)}
                          className={`px-3 py-2 text-sm font-medium rounded-lg ${
                  currentPatientPage === page
                              ? 'bg-primary-500 text-white'
                              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800 bg-white border border-gray-300'
                }`}
              >
                {page}
              </button>
                      )}
                    </div>
            ))}
                </div>

                {/* Next Button */}
            <button
                  onClick={nextPage}
              disabled={currentPatientPage === totalPages}
                  className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg ${
                    currentPatientPage === totalPages
                      ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800 bg-white border border-gray-300'
                  }`}
            >
              Next
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
            </button>
              </div>
            </div>
          </div>
          </div>

         

         
        </>
      )}

      {/* Appointment Tab Content */}
      {mainTab === 'appointment' && (
        <div className="space-y-6">
          {/* Appointment Filters and Actions */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-md">
            <div className="flex gap-4 items-center justify-between flex-wrap">
              {/* Appointment Filter Dropdown */}
              <div className="flex items-center gap-2">
                <div className="relative" ref={appointmentFilterDropdownRef}>
                  <button
                    onClick={() => setShowAppointmentFilterDropdown(!showAppointmentFilterDropdown)}
                    className="flex items-center gap-2 px-4 py-3 bg-primary-500 text-white border border-primary-500 rounded-lg text-sm font-medium cursor-pointer min-h-[44px] whitespace-nowrap hover:bg-primary-600 hover:border-primary-600"
                  >
                    <Calendar className="w-4 h-4 text-white" />
                    {appointmentCurrentFilter === 'all' ? 'All Appointments' :
                     appointmentCurrentFilter === 'scheduled' ? 'Scheduled' :
                     appointmentCurrentFilter === 'confirmed' ? 'Confirmed' :
                     appointmentCurrentFilter === 'completed' ? 'Completed' :
                     appointmentCurrentFilter === 'cancelled' ? 'Cancelled' : 'All Appointments'}
                    <ChevronDown className="w-4 h-4 ml-2 text-white" />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showAppointmentFilterDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      {[
                        { value: 'all', label: 'All Appointments' },
                        { value: 'scheduled', label: 'Scheduled' },
                        { value: 'confirmed', label: 'Confirmed' },
                        { value: 'completed', label: 'Completed' },
                        { value: 'cancelled', label: 'Cancelled' }
                      ].map((filter) => (
                        <button
                          key={filter.value}
                          onClick={() => {
                            setAppointmentCurrentFilter(filter.value as 'all' | 'scheduled' | 'confirmed' | 'completed' | 'cancelled')
                            setShowAppointmentFilterDropdown(false)
                          }}
                          className={`flex items-center gap-2 w-full px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-gray-50 ${
                            appointmentCurrentFilter === filter.value
                              ? 'bg-primary-500 text-white'
                              : 'text-gray-700'
                          }`}
                        >
                          <Calendar className="w-4 h-4" />
                          {filter.label}
                          {filter.value === 'confirmed' && <CheckCircle className="w-4 h-4 ml-auto text-green-500" />}
                          {filter.value === 'cancelled' && <XCircle className="w-4 h-4 ml-auto text-red-500" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 items-center">
                <button
                  onClick={() => setShowAppointmentForm(true)}
                  className="flex items-center gap-2 px-4 py-3 bg-primary-500 text-white border border-primary-500 rounded-lg text-sm font-medium cursor-pointer min-h-[44px] hover:bg-primary-600 hover:border-primary-600"
                >
                  <Plus className="w-4 h-4" />
                  Add New Appointment
                </button>
                
                <button 
                  onClick={() => {
                    setIsRefreshingAppointments(true)
                    showToast('Refreshing appointments list...', 'success')
                    // Reset search and filters
                    setAppointmentSearchTerm('')
                    setAppointmentCurrentFilter('all')
                    setSelectedAppointments(new Set())
                    // Reset to first page
                    setCurrentAppointmentPage(1)
                    // Trigger data refresh
                    setAppointmentRefreshTrigger(prev => prev + 1)
                    // Stop loading immediately
                    setIsRefreshingAppointments(false)
                  }}
                  disabled={isRefreshingAppointments}
                  className="flex items-center justify-center w-10 h-10 bg-white border border-primary-500 rounded-lg text-primary-500 hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Refresh Appointments"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshingAppointments ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6 bg-white border border-gray-300 rounded-lg p-2 shadow-sm">
            <input
              type="text"
              placeholder="Search appointments by patient name, type, or date..."
              value={appointmentSearchTerm}
              onChange={(e) => setAppointmentSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pr-12 rounded-lg text-base bg-white focus:outline-none focus:border-primary-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]"
            />
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>




          {/* Appointments Table */}
          <div key={`appointments-table-${appointmentRefreshTrigger}`} className=" rounded-lg p-4 mb-4 bg-white border border-gray-200 ">
          <div key={`appointments-table-${appointmentRefreshTrigger}`} className=" rounded-lg ">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-gray-700 font-medium">Total Appointments: {filteredAppointments.length}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-600 text-sm">
                  Showing {appointmentStartIndex + 1}-{Math.min(appointmentStartIndex + appointmentsPerPage, filteredAppointments.length)} of {filteredAppointments.length} appointments
                </span>
                {selectedAppointments.size > 0 && (
                  <button
                    onClick={() => handleBulkDeleteAppointments()}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white border border-red-500 rounded-lg text-sm font-medium cursor-pointer hover:bg-red-600 hover:border-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Selected
                  </button>
                )}
              </div>
            </div>
          </div>
          <div key={`appointments-table-${appointmentRefreshTrigger}`} className="bg-white  rounded-lg shadow-sm overflow-hidden">
            {/* Table Header */}

            <div key={`appointments-table-${appointmentRefreshTrigger}`} className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedAppointments.size === paginatedAppointments.length && paginatedAppointments.length > 0}
                    onChange={(e) => handleSelectAllAppointments(e.target.checked)}
                    className="w-4 h-4 text-primary-500 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700"></span>
                </div>
                <div className="flex-1 text-sm font-medium text-gray-700"></div>
                <div className="text-sm font-medium text-gray-700"></div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {paginatedAppointments.length > 0 ? (
                paginatedAppointments.map((appointment, index) => (
                  <motion.div
                    key={appointment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-6 hover:bg-blue-50"
                  >
                    
          {/* Appointments Table Header */}
          
         
                    <div className="flex items-center gap-6 py-2 border-b border-gray-200">
                      {/* Entry Number & Icon */}
                      <div className="flex items-center gap-4 min-w-[120px]">
                        <input 
                          type="checkbox" 
                          checked={selectedAppointments.has(appointment.id)}
                          className="w-3.5 h-3.5 cursor-pointer"
                          onChange={(e) => handleSelectAppointment(appointment.id, e.target.checked)}
                        />
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl">
                          <i className="fas fa-calendar-check"></i>
                        </div>
                      </div>
                      
                      {/* Appointment Details (Left Block) */}
                       <div className="flex flex-col gap-2 flex-1">
                         <div className="bg-blue-100 text-blue-600 px-2 py-2 rounded-lg font-medium text-sm">
                           {appointment.patientName}
                         </div>
                        <div className="flex items-center gap-2">
                          <div className="bg-blue-100 text-blue-600 px-3 py-1 rounded-md text-xs font-medium w-fit">
                            {formatDate(appointment.date)}
                          </div>
                          {/* Display Patient Gender Icon Only */}
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                            appointment.patientGender === 'female' ? 'bg-pink-100' : 'bg-blue-100'
                          }`}>
                            <i className={`fas ${
                              appointment.patientGender === 'female' ? 'fa-venus' : 'fa-mars'
                            } text-sm ${
                              appointment.patientGender === 'female' ? 'text-pink-500' : 'text-blue-600'
                            }`}></i>
                          </div>
                        </div>
                      </div>
                      
                      {/* Appointment Details (Middle Block) */}
                      <div className="flex flex-col gap-2 min-w-[200px]">
                        <div className="bg-blue-100 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium">
                          <i className="fas fa-clock mr-2"></i>{appointment.time}
                        </div>
                        <div className="bg-blue-100 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium">
                          <i className="fas fa-hourglass-half mr-2"></i>60 min
                        </div>
                        <div className="bg-blue-100 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium">
                          <i className="fas fa-tooth mr-2"></i>{appointment.type || 'consultation'}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-4 py-2 rounded-lg text-sm font-medium text-center ${
                            appointment.status === 'confirmed' ? 'bg-blue-500 text-white' :
                            appointment.status === 'scheduled' ? 'bg-yellow-500 text-white' :
                            appointment.status === 'completed' ? 'bg-green-500 text-white' :
                            appointment.status === 'cancelled' ? 'bg-red-500 text-white' :
                            'bg-yellow-500 text-white'
                          }`}>
                            {appointment.status || 'scheduled'}
                          </span>
                          <button 
                            onClick={() => handleUpdateAppointmentStatus(appointment.id, 'confirmed')}
                            className="w-9 h-9 p-0 bg-blue-600 text-white rounded-md border-none cursor-pointer transition-all duration-200 hover:scale-110"
                            title="Mark as Confirmed"
                          >
                            <i className="fas fa-check-circle"></i>
                          </button>
                          <button 
                            onClick={() => handleUpdateAppointmentStatus(appointment.id, 'completed')}
                            className="w-9 h-9 p-0 bg-green-600 text-white rounded-md border-none cursor-pointer transition-all duration-200 hover:scale-110"
                            title="Mark as Completed"
                          >
                            <i className="fas fa-check"></i>
                          </button>
                          <button 
                            onClick={() => handleUpdateAppointmentStatus(appointment.id, 'cancelled')}
                            className="w-9 h-9 p-0 bg-red-600 text-white rounded-md border-none cursor-pointer transition-all duration-200 hover:scale-110"
                            title="Cancel Appointment"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      </div>
                      
                      {/* Action Buttons (Right Block) */}
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleViewAppointmentDetails(appointment)}
                          className="w-10 h-10 p-5 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 hover:bg-blue-200 transition-all duration-150"
                          title="View Details"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        <button
                          onClick={() => handleEditAppointment(appointment)}
                          className="w-10 h-10 p-5 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 hover:bg-blue-200 transition-all duration-150"
                          title="Update Appointment"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={() => handlePrintAppointment(appointment)}
                          className="w-10 h-10 p-5 bg-white border border-yellow-300 rounded-lg flex items-center justify-center text-yellow-600 hover:bg-yellow-50 transition-all duration-150"
                          title="Print"
                        >
                          <i className="fas fa-print"></i>
                        </button>
                        <button
                          onClick={() => handleDeleteAppointment(appointment.id)}
                          className="w-10 h-10 p-5 bg-white border border-red-300 rounded-lg flex items-center justify-center text-red-600 hover:bg-red-50 transition-all duration-150"
                          title="Delete"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-medium mb-2">No appointments found</h3>
                <p>Get started by adding your first appointment</p>
              </div>
            )}
            </div>

            {/* Pagination Footer */}
            <div key={`appointments-table-${appointmentRefreshTrigger}`} className="bg-white border-t border-gray-200 rounded-sm p-4">
              <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-gray-600 text-sm">Show</span>
                <select
                  value={appointmentsPerPage}
                  onChange={(e) => {
                    setAppointmentsPerPage(Number(e.target.value))
                    setCurrentAppointmentPage(1)
                  }}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-primary-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-gray-600 text-sm">Appointments</span>
              </div>
              
              {/* Pagination Navigation */}
              <div className="flex items-center gap-2">
                {/* Previous Button */}
                <button
                  onClick={prevAppointmentPage}
                  disabled={currentAppointmentPage === 1}
                  className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
                    currentAppointmentPage === 1
                      ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800 bg-white border border-gray-300'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: appointmentTotalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => goToAppointmentPage(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
                        currentAppointmentPage === page
                          ? 'bg-primary-500 text-white'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800 bg-white border border-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                {/* Next Button */}
                <button
                  onClick={nextAppointmentPage}
                  disabled={currentAppointmentPage === appointmentTotalPages}
                  className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
                    currentAppointmentPage === appointmentTotalPages
                      ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800 bg-white border border-gray-300'
                  }`}
                >
                  Next
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        </div>
        </div>
      )}

      {/* Billing Tab Content */}
      {mainTab === 'billing' && (
        <div className="space-y-6">
          {/* Billing Header */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Billing & Invoices</h3>
                <p className="text-gray-600">Manage patient invoices and payment tracking</p>
              </div>
              <button
                onClick={() => setShowInvoiceForm(true)}
                className="btn btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Invoice
              </button>
            </div>
          </div>

          {/* Billing Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Invoices</p>
                  <p className="text-2xl font-bold text-gray-800">{invoices.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {formatCurrency(invoices.reduce((sum, inv) => sum + inv.total, 0))}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {invoices.filter(inv => inv.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {invoices.filter(inv => inv.status === 'overdue').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Billing Tabs */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-md">
            <div className="flex gap-2 mb-6">
              {[
                { id: 'invoices', label: 'Invoices', icon: Receipt },
                { id: 'payments', label: 'Payments', icon: CreditCard },
                { id: 'reports', label: 'Reports', icon: TrendingUp }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setBillingActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-sm font-medium cursor-pointer transition-all duration-150 min-h-[44px] whitespace-nowrap ${
                    billingActiveTab === tab.id
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Billing Filters and Search */}
            <div className="flex gap-4 items-center justify-between flex-wrap">
              <div className="flex gap-2 mb-4">
                {[
                  { value: 'all', label: 'All Invoices' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'paid', label: 'Paid' },
                  { value: 'overdue', label: 'Overdue' },
                  { value: 'cancelled', label: 'Cancelled' }
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setBillingCurrentFilter(filter.value)}
                    className={`flex items-center gap-2 px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-sm font-medium cursor-pointer transition-all duration-150 min-h-[44px] whitespace-nowrap ${
                      billingCurrentFilter === filter.value
                        ? 'bg-primary-500 text-white border-primary-500'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Filter className="w-4 h-4" />
                    {filter.label}
                  </button>
                ))}
              </div>

              <div className="relative flex gap-2">
                <input
                  type="text"
                  placeholder="Search invoices..."
                  value={billingSearchTerm}
                  onChange={(e) => setBillingSearchTerm(e.target.value)}
                  className="px-4 py-3 pr-12 border border-gray-300 rounded-lg text-base bg-white transition-all duration-150 focus:outline-none focus:border-primary-500"
                />
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                
                <button 
                  onClick={() => {
                    setIsRefreshingBilling(true)
                    showToast('Refreshing billing data...', 'success')
                    // Reset search and filters
                    setBillingSearchTerm('')
                    setBillingCurrentFilter('all')
                    // Trigger data refresh
                    setBillingRefreshTrigger(prev => prev + 1)
                    // Stop loading immediately
                    setIsRefreshingBilling(false)
                  }}
                  disabled={isRefreshingBilling}
                  className="flex items-center justify-center w-10 h-10 bg-white border border-primary-500 rounded-lg text-primary-500 hover:bg-primary-50 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Refresh Billing"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshingBilling ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Invoices List */}
          <div className="space-y-4">
            {invoices.length > 0 ? (
              invoices.map((invoice) => (
                <motion.div
                  key={invoice.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-150"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                        <Receipt className="w-6 h-6 text-primary-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">{invoice.patientName}</h4>
                        <p className="text-gray-600">Invoice #{invoice.invoiceNumber}</p>
                        <p className="text-sm text-gray-500">
                          {formatDate(invoice.invoiceDate)} • {formatCurrency(invoice.total)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                        invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                        invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {invoice.status}
                      </span>
                      <button
                        onClick={() => handleEditInvoice(invoice)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteInvoice(invoice.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-md"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500 bg-white border border-gray-200 rounded-lg">
                <Receipt className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-medium mb-2">No invoices found</h3>
                <p>Get started by adding your first invoice</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Patient Form Modal */}
      {showPatientForm && (
        <PatientForm
          patient={editingPatient}
          onSave={handleSavePatient}
          onClose={() => {
            setShowPatientForm(false)
            setEditingPatient(null)
          }}
        />
      )}

      {/* Appointment Form Modal */}
      {showAppointmentForm && (
        <AppointmentForm
          appointment={editingAppointment}
          patients={patients}
          onSave={handleSaveAppointment}
          onClose={() => {
            setShowAppointmentForm(false)
            setEditingAppointment(null)
          }}
        />
      )}

      {/* Invoice Form Modal */}
      {showInvoiceForm && (
        <InvoiceForm
          invoice={editingInvoice}
          onSave={handleSaveInvoice}
          onClose={() => {
            setShowInvoiceForm(false)
            setEditingInvoice(null)
          }}
        />
      )}

      {/* Patient Details Modal */}
      {showPatientDetails && viewingPatient && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4"
          onClick={() => setShowPatientDetails(false)}
        >
          {/* Full Design Modal */}
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-500" />
    </div>
                <h3 className="text-2xl font-bold text-gray-800">Patient Details</h3>
              </div>
              <button
                onClick={() => setShowPatientDetails(false)}
                className="w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Patient Information Card */}
                  <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                    <div className="flex items-center gap-3 mb-5">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        viewingPatient.gender === 'female' ? 'bg-pink-100' : 'bg-primary-100'
                      }`}>
                        <i className={`fas ${viewingPatient.gender === 'female' ? 'fa-user-tie' : 'fa-user'} text-lg ${
                          viewingPatient.gender === 'female' ? 'text-pink-500' : 'text-primary-500'
                        }`}></i>
                      </div>
                      <h3 className="text-gray-800 text-lg font-semibold m-0">Patient Information</h3>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                        <span className="text-gray-600 font-medium text-sm">Patient Name</span>
                        <span className="text-primary-600 font-semibold text-sm">{viewingPatient.name}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                        <span className="text-gray-600 font-medium text-sm">Phone</span>
                        <span className="text-primary-600 font-semibold text-sm">{viewingPatient.phone}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                        <span className="text-gray-600 font-medium text-sm">Email</span>
                        <span className="text-primary-600 font-semibold text-sm">{viewingPatient.email || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                        <span className="text-gray-600 font-medium text-sm">Status</span>
                        <div className="flex flex-col items-center gap-2">
                          {/* Toggle Switch */}
                          <div className={`relative w-15 h-7 bg-white rounded-full transition-all duration-300 ${
                            viewingPatient.status === 'active' ? 'border-2 border-green-500' : 'border-2 border-red-500'
                          }`}>
                            {/* Sliding Indicator */}
                            <div className={`absolute top-0.5 w-6 h-6 rounded-full transition-all duration-300 ${
                              viewingPatient.status === 'active' ? 'bg-green-500 left-1' : 'bg-red-500 left-1'
                            }`}></div>
                          </div>
                          {/* Status Text */}
                          <span className={`font-semibold text-xs capitalize ${
                            viewingPatient.status === 'active' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {viewingPatient.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Medical History Card */}
                  {viewingPatient.medicalHistory && viewingPatient.medicalHistory.trim() !== '' && (
                    <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <i className="fas fa-notes-medical text-lg text-primary-500"></i>
                        </div>
                        <h3 className="text-gray-800 text-lg font-semibold m-0">Medical History</h3>
                      </div>
                      
                      <div className="p-4 bg-gray-50 rounded-md border-l-4 border-primary-500">
                        <p className="m-0 text-gray-700 text-sm leading-relaxed italic">{viewingPatient.medicalHistory}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Personal Details Card */}
                  <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <i className="fas fa-id-card text-lg text-primary-500"></i>
                      </div>
                      <h3 className="text-gray-800 text-lg font-semibold m-0">Personal Details</h3>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                        <span className="text-gray-600 font-medium text-sm">Patient ID</span>
                        <span className="text-primary-600 font-semibold text-sm">{viewingPatient.id}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                        <span className="text-gray-600 font-medium text-sm">Age</span>
                        <span className="text-primary-600 font-semibold text-sm">{viewingPatient.age} years</span>
                      </div>
                                             <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                         <span className="text-gray-600 font-medium text-sm">Gender</span>
                         <span className={`font-semibold text-sm flex items-center gap-2 ${
                           viewingPatient.gender === 'female' ? 'text-pink-500' : 'text-primary-600'
                         }`}>
                           <i className={`fas ${
                             viewingPatient.gender === 'female' ? 'fa-venus' : 
                             viewingPatient.gender === 'male' ? 'fa-mars' : 'fa-user'
                           } text-sm`}></i>
                         </span>
                       </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                        <span className="text-gray-600 font-medium text-sm">Address</span>
                        <span className="text-primary-600 font-semibold text-sm text-right max-w-[50%]">{viewingPatient.address || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                        <span className="text-gray-600 font-medium text-sm">Added Date</span>
                        <span className="text-primary-600 font-semibold text-sm">
                          {viewingPatient.registrationDate ? 
                            new Date(viewingPatient.registrationDate).toLocaleDateString('en-US', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            }) : 'N/A'
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Treatment Summary Card */}
                  <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <i className="fas fa-chart-bar text-lg text-primary-500"></i>
                      </div>
                      <h3 className="text-gray-800 text-lg font-semibold m-0">Treatment Summary</h3>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                        <span className="text-gray-600 font-medium text-sm">Total Appointments</span>
                        <span className="text-primary-600 font-semibold text-sm">
                          {appointments.filter(a => a.patientId === viewingPatient.id).length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                        <span className="text-gray-600 font-medium text-sm">Completed Treatments</span>
                        <span className="text-primary-600 font-semibold text-sm">0</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                        <span className="text-gray-600 font-medium text-sm">Total Billing</span>
                        <span className="text-primary-600 font-semibold text-sm">$0</span>
                      </div>
                                             <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                         <span className="text-gray-600 font-medium text-sm">Last Visit</span>
                         <span className="text-primary-600 font-semibold text-sm">
                           {(() => {
                             // Get the last appointment date for this patient
                             const patientAppointments = appointments.filter(a => a.patientId === viewingPatient.id);
                             if (patientAppointments.length > 0) {
                               const lastAppointment = patientAppointments[patientAppointments.length - 1];
                               return new Date(lastAppointment.date).toLocaleDateString('en-US', {
                                 day: 'numeric',
                                 month: 'long',
                                 year: 'numeric'
                               });
                             }
                             return 'N/A';
                           })()}
                         </span>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
              )}

              {/* Delete Confirmation Modal */}
        {showDeleteConfirm && patientToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[99999] max-w-none">
            <div className="modal-content bg-white rounded-xl shadow-2xl" style={{maxWidth: '400px', width: '90%'}}>
              <div className="modal-header flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 m-0">Confirm Delete</h3>
                <span 
                  className="close text-2xl text-gray-500 hover:text-gray-700 cursor-pointer font-bold"
                  onClick={cancelDelete}
                >
                  &times;
                </span>
              </div>
              <div style={{padding: '1.5rem'}}>
                <p style={{marginBottom: '1.5rem', color: '#374151', lineHeight: '1.5'}}>
                  Are you sure you want to delete patient <strong>"{patientToDelete.name}"</strong>? 
                  This action cannot be undone.
                </p>
                <div className="form-actions flex gap-3 justify-end">
                  <button 
                    type="button" 
                    className="btn btn-secondary px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    onClick={cancelDelete}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-danger px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    onClick={confirmDelete}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

              {/* Bulk Delete Confirmation Modal */}
        {showBulkDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[99999] max-w-none">
            <div className="modal-content bg-white rounded-xl shadow-2xl" style={{maxWidth: '400px', width: '90%'}}>
              <div className="modal-header flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 m-0">Confirm Bulk Delete</h3>
                <span 
                  className="close text-2xl text-gray-500 hover:text-gray-700 cursor-pointer font-bold"
                  onClick={cancelBulkDelete}
                >
                  &times;
                </span>
              </div>
              <div style={{padding: '1.5rem'}}>
                <p style={{marginBottom: '1.5rem', color: '#374151', lineHeight: '1.5'}}>
                  Are you sure you want to delete <strong>{selectedPatients.size} selected patient(s)</strong>? 
                  <br /><br />
                  <strong>Patients:</strong> {Array.from(selectedPatients)
                    .map(id => patients.find(p => p.id === id)?.name)
                    .filter(Boolean)
                    .join(', ')}
                  <br /><br />
                  This action cannot be undone.
                </p>
                <div className="form-actions flex gap-3 justify-end">
                  <button 
                    type="button" 
                    className="btn btn-secondary px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    onClick={cancelBulkDelete}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-danger px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    onClick={confirmBulkDelete}
                  >
                    Delete {selectedPatients.size} Patients
                  </button>
                </div>
              </div>
            </div>
                    </div>
        )}

        {/* Appointment Delete Confirmation Modal */}
        {showAppointmentDeleteConfirm && appointmentToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[99999] max-w-none">
            <div className="modal-content bg-white rounded-xl shadow-2xl" style={{maxWidth: '400px', width: '90%'}}>
              <div className="modal-header flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 m-0">Confirm Delete Appointment</h3>
                <span 
                  className="close text-2xl text-gray-500 hover:text-gray-700 cursor-pointer font-bold"
                  onClick={cancelDeleteAppointment}
                >
                  &times;
                </span>
              </div>
              <div style={{padding: '1.5rem'}}>
                <p style={{marginBottom: '1.5rem', color: '#374151', lineHeight: '1.5'}}>
                  Are you sure you want to delete appointment for <strong>"{appointmentToDelete.patientName}"</strong>? 
                  This action cannot be undone.
                </p>
                <div className="form-actions flex gap-3 justify-end">
                  <button 
                    type="button" 
                    className="btn btn-secondary px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    onClick={cancelDeleteAppointment}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-danger px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    onClick={confirmDeleteAppointment}
                  >
                    Delete Appointment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Appointment Details Modal */}
        {showAppointmentDetails && viewingAppointment && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4"
            onClick={() => setShowAppointmentDetails(false)}
          >
            <div 
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">Appointment Details</h3>
                </div>
                <button
                  onClick={() => setShowAppointmentDetails(false)}
                  className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column - Appointment Information */}
                  <div className="space-y-6">
                    <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <h3 className="text-gray-800 text-lg font-semibold m-0">Appointment Information</h3>
                      </div>
                      
                      <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                          <span className="text-gray-600 font-medium text-sm">Patient Name</span>
                          <span className="text-blue-600 font-semibold text-sm">{viewingAppointment.patientName}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                          <span className="text-gray-600 font-medium text-sm">Appointment Date</span>
                          <span className="text-blue-600 font-semibold text-sm">{formatDate(viewingAppointment.date)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                          <span className="text-gray-600 font-medium text-sm">Appointment Time</span>
                          <span className="text-blue-600 font-semibold text-sm">{viewingAppointment.time}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                          <span className="text-gray-600 font-medium text-sm">Duration</span>
                          <span className="text-blue-600 font-semibold text-sm">60 minutes</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                          <span className="text-gray-600 font-medium text-sm">Treatment Type</span>
                          <span className="text-blue-600 font-semibold text-sm">{viewingAppointment.type}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                          <span className="text-gray-600 font-medium text-sm">Status</span>
                          <span className={`px-4 py-2 rounded-lg text-sm font-medium text-center ${
                            viewingAppointment.status === 'confirmed' ? 'bg-blue-500 text-white' :
                            viewingAppointment.status === 'scheduled' ? 'bg-yellow-500 text-white' :
                            viewingAppointment.status === 'completed' ? 'bg-green-500 text-white' :
                            viewingAppointment.status === 'cancelled' ? 'bg-red-500 text-white' :
                            'bg-gray-500 text-white'
                          }`}>
                            {viewingAppointment.status.charAt(0).toUpperCase() + viewingAppointment.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Additional Details */}
                  <div className="space-y-6">
                    <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <h3 className="text-gray-800 text-lg font-semibold m-0">Additional Details</h3>
                      </div>
                      
                      <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                          <span className="text-gray-600 font-medium text-sm">Appointment ID</span>
                          <span className="text-blue-600 font-semibold text-sm">a-{viewingAppointment.id.slice(-2)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                          <span className="text-gray-600 font-medium text-sm">Priority</span>
                          <span className="text-blue-600 font-semibold text-sm">{viewingAppointment.priority.charAt(0).toUpperCase() + viewingAppointment.priority.slice(1)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                          <span className="text-gray-600 font-medium text-sm">Reminder</span>
                          <span className="text-blue-600 font-semibold text-sm">1</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                          <span className="text-gray-600 font-medium text-sm">Created Date</span>
                          <span className="text-blue-600 font-semibold text-sm">{formatDate(viewingAppointment.createdAt)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                          <span className="text-gray-600 font-medium text-sm">Last Updated</span>
                          <span className="text-blue-600 font-semibold text-sm">{formatDate(viewingAppointment.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Section - Appointment Notes */}
                <div className="mt-8">
                  <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <h3 className="text-gray-800 text-lg font-semibold m-0">Appointment Notes</h3>
                    </div>
                    
                    <div className="bg-gray-50 rounded-md p-4 min-h-[100px] border border-gray-200">
                      <span className="text-gray-500 text-sm">
                        {viewingAppointment.notes || 'No notes available for this appointment.'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
      )}
    </div>
    
  )
}