import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { Invoice, Patient, Appointment } from '@/stores/useAppStore'
import { cn, formatCurrency, getCurrentKarachiTime } from '@/lib/utils'

const treatmentSchema = z.object({
  type: z.string().min(1, 'Treatment type is required'),
  description: z.string().optional(),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price must be non-negative'),
  discount: z.number().min(0).max(100).default(0),
  total: z.number().min(0, 'Total must be non-negative')
})

const invoiceSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  patientName: z.string().min(1, 'Patient name is required'),
  invoiceDate: z.string().min(1, 'Invoice date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  treatments: z.array(treatmentSchema).min(1, 'At least one treatment is required'),
  status: z.enum(['pending', 'paid', 'overdue', 'cancelled']),
  paymentMethod: z.string().optional(),
  receiptNumber: z.string().optional(),
  notes: z.string().optional()
}).refine((data) => {
  // If payment method is online and status is paid, receipt number is required
  if (data.paymentMethod === 'online' && data.status === 'paid') {
    return data.receiptNumber && data.receiptNumber.trim().length > 0
  }
  return true
}, {
  message: "Receipt number is required for online payments",
  path: ["receiptNumber"]
})

type InvoiceFormData = z.infer<typeof invoiceSchema>

interface InvoiceFormProps {
  invoice?: Invoice | null
  patients: Patient[]
  appointments: Appointment[]
  onSave: (data: Omit<Invoice, 'id' | 'invoiceNumber'>) => void
  onClose: () => void
  isReceiptEntry?: boolean // New prop to indicate if form is opened for receipt entry
}

export default function InvoiceForm({ invoice, patients, appointments, onSave, onClose, isReceiptEntry = false }: InvoiceFormProps) {
  const [showReceiptField, setShowReceiptField] = useState(isReceiptEntry)
  
  // Calendar states
  const [showInvoiceDateCalendar, setShowInvoiceDateCalendar] = useState(false)
  const [showDueDateCalendar, setShowDueDateCalendar] = useState(false)
  const [currentInvoiceDateMonth, setCurrentInvoiceDateMonth] = useState(getCurrentKarachiTime())
  const [currentDueDateMonth, setCurrentDueDateMonth] = useState(getCurrentKarachiTime())
  const [showInvoiceDateYearDropdown, setShowInvoiceDateYearDropdown] = useState(false)
  const [showInvoiceDateMonthDropdown, setShowInvoiceDateMonthDropdown] = useState(false)
  const [showDueDateYearDropdown, setShowDueDateYearDropdown] = useState(false)
  const [showDueDateMonthDropdown, setShowDueDateMonthDropdown] = useState(false)
  
  // Filter patients who have appointments
  const patientsWithAppointments = patients.filter(patient => 
    appointments.some(appointment => appointment.patientId === patient.id)
  )
  
  // Debug logging
  console.log('All patients:', patients.length)
  console.log('All appointments:', appointments.length)
  console.log('Patients with appointments:', patientsWithAppointments.length)
  
  // Auto dates
  const currentDate = getCurrentKarachiTime().toISOString().split('T')[0]
  const oneWeekFromNow = new Date(getCurrentKarachiTime().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
    setValue,
    reset
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      patientId: invoice?.patientId || '',
      patientName: invoice?.patientName || '',
      invoiceDate: invoice?.invoiceDate || currentDate,
      dueDate: invoice?.dueDate || oneWeekFromNow,
      treatments: invoice?.treatments || [{ type: '', description: '', quantity: 1, unitPrice: 0, discount: 0, total: 0 }],
      status: invoice?.status || 'pending',
      paymentMethod: invoice?.paymentMethod || undefined,
      receiptNumber: '',
      notes: invoice?.notes || ''
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'treatments'
  })

  const watchedItems = watch('treatments')

  // Calculate totals
  const subtotal = watchedItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  const totalDiscount = watchedItems.reduce((sum, item) => {
    const itemTotal = item.quantity * item.unitPrice
    return sum + (itemTotal * (item.discount || 0) / 100)
  }, 0)
  const total = subtotal - totalDiscount

  const onSubmit = (data: InvoiceFormData) => {
    // Capitalize patient name and treatment descriptions
    const processedData = {
      ...data,
      patientName: data.patientName.charAt(0).toUpperCase() + data.patientName.slice(1).toLowerCase(),
      treatments: data.treatments.map(treatment => ({
        ...treatment,
        id: `t-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: treatment.type || 'general',
        description: treatment.description || treatment.type,
        total: treatment.quantity * treatment.unitPrice * (1 - (treatment.discount || 0) / 100)
      })),
      subtotal: subtotal,
      tax: 0,
      discount: totalDiscount,
      total: total,
      createdAt: getCurrentKarachiTime().toISOString()
    }
    
    onSave(processedData)
    reset()
  }

  const addItem = () => {
    append({ type: '', description: '', quantity: 1, unitPrice: 0, discount: 0, total: 0 })
  }

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index)
    }
  }

  const handlePatientSelection = (patientId: string) => {
    try {
      const patient = patientsWithAppointments.find(p => p.id === patientId)
      if (patient) {
        setValue('patientId', patient.id)
        setValue('patientName', patient.name)
        
        // Get patient's appointments and auto-add treatments
        const patientAppointments = appointments.filter(apt => apt.patientId === patientId)
        console.log('Selected patient:', patient.name)
        console.log('Patient appointments:', patientAppointments)
        
        // Use setTimeout to prevent blocking the UI
        setTimeout(() => {
          if (patientAppointments.length > 0) {
            // Create treatments array from appointments
            const treatmentsFromAppointments = patientAppointments.map((appointment, index) => {
              // Map appointment types to service types
              const mapAppointmentTypeToService = (appointmentType: string) => {
                const type = appointmentType.toLowerCase()
                if (type.includes('consultation')) return 'consultation'
                if (type.includes('cleaning')) return 'cleaning'
                if (type.includes('filling')) return 'filling'
                if (type.includes('extraction')) return 'extraction'
                if (type.includes('root') || type.includes('canal')) return 'root-canal'
                if (type.includes('crown')) return 'crown'
                if (type.includes('whitening')) return 'whitening'
                if (type.includes('braces') || type.includes('orthodontic')) return 'braces'
                return 'consultation' // Default fallback
              }
              
              const serviceType = mapAppointmentTypeToService(appointment.type)
              
              return {
                id: `t-${Date.now()}-${index}`,
                type: serviceType,
                description: appointment.notes || appointment.type || serviceType,
                quantity: 1,
                unitPrice: 0,
                discount: 0,
                total: 0
              }
            })
            
            console.log('Treatments to add:', treatmentsFromAppointments)
            
            // Simply set the treatments array - this should update the form
            setValue('treatments', treatmentsFromAppointments)
          } else {
            console.log('No appointments found for patient')
            // If no appointments, ensure at least one empty treatment field
            const emptyTreatment = { type: '', description: '', quantity: 1, unitPrice: 0, discount: 0, total: 0 }
            setValue('treatments', [emptyTreatment])
          }
        }, 50) // Reduced timeout
      }
    } catch (error) {
      console.error('Error in handlePatientSelection:', error)
    }
  }

  const handlePaymentMethodChange = (value: string) => {
    setValue('paymentMethod', value as 'cash' | 'online')
    // Don't show receipt field when selecting online payment initially
    // It will only show when marking as paid from outside the form
  }

  const handleStatusChange = (value: string) => {
    const paymentMethod = watch('paymentMethod')
    if (value === 'paid' && paymentMethod === 'online' && !watch('receiptNumber')) {
      // If trying to mark as paid with online payment but no receipt number, show receipt field
      setShowReceiptField(true)
      setValue('status', 'pending') // Keep as pending until receipt is provided
    } else {
      setValue('status', value as 'pending' | 'paid' | 'overdue' | 'cancelled')
    }
  }

  // Calendar utility functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const generateYears = () => {
    const currentYear = getCurrentKarachiTime().getFullYear()
    return Array.from({ length: 6 }, (_, i) => currentYear + i)
  }

  const generateMonths = () => {
    return [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
  }

  const navigateInvoiceDateMonth = (direction: 'prev' | 'next') => {
    setCurrentInvoiceDateMonth(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const navigateDueDateMonth = (direction: 'prev' | 'next') => {
    setCurrentDueDateMonth(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const selectInvoiceDateMonth = (monthIndex: number) => {
    setCurrentInvoiceDateMonth(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(monthIndex)
      return newDate
    })
    setShowInvoiceDateMonthDropdown(false)
  }

  const selectDueDateMonth = (monthIndex: number) => {
    setCurrentDueDateMonth(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(monthIndex)
      return newDate
    })
    setShowDueDateMonthDropdown(false)
  }

  const selectInvoiceDateYear = (year: number) => {
    setCurrentInvoiceDateMonth(prev => {
      const newDate = new Date(prev)
      newDate.setFullYear(year)
      return newDate
    })
    setShowInvoiceDateYearDropdown(false)
  }

  const selectDueDateYear = (year: number) => {
    setCurrentDueDateMonth(prev => {
      const newDate = new Date(prev)
      newDate.setFullYear(year)
      return newDate
    })
    setShowDueDateYearDropdown(false)
  }

  const selectInvoiceDate = (day: number) => {
    const year = currentInvoiceDateMonth.getFullYear()
    const month = currentInvoiceDateMonth.getMonth()
    const selectedDate = new Date(year, month, day)
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    
    setValue('invoiceDate', formattedDate)
    setShowInvoiceDateCalendar(false)
  }

  const selectDueDate = (day: number) => {
    const year = currentDueDateMonth.getFullYear()
    const month = currentDueDateMonth.getMonth()
    const selectedDate = new Date(year, month, day)
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    
    setValue('dueDate', formattedDate)
    setShowDueDateCalendar(false)
  }

  const isSelectedInvoiceDate = (day: number) => {
    const selectedDate = watch('invoiceDate')
    if (!selectedDate) return false
    
    const year = currentInvoiceDateMonth.getFullYear()
    const month = currentInvoiceDateMonth.getMonth()
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return selectedDate === formattedDate
  }

  const isSelectedDueDate = (day: number) => {
    const selectedDate = watch('dueDate')
    if (!selectedDate) return false
    
    const year = currentDueDateMonth.getFullYear()
    const month = currentDueDateMonth.getMonth()
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return selectedDate === formattedDate
  }

  const isToday = (day: number, month: Date) => {
    const today = getCurrentKarachiTime()
    return day === today.getDate() && 
           month.getMonth() === today.getMonth() && 
           month.getFullYear() === today.getFullYear()
  }

  // Handle click outside to close calendar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      
      // Check if clicking outside calendar elements
      const isCalendarElement = (target as Element).closest?.('.calendar-container')
      const isDropdownElement = (target as Element).closest?.('.dropdown-container')
      
      if (!isCalendarElement && !isDropdownElement) {
        setShowInvoiceDateCalendar(false)
        setShowDueDateCalendar(false)
        setShowInvoiceDateYearDropdown(false)
        setShowInvoiceDateMonthDropdown(false)
        setShowDueDateYearDropdown(false)
        setShowDueDateMonthDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="modal-content professional-invoice-modal bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto scrollbar-hide"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="modal-header border-b border-gray-200">
            <div className="header-content flex items-center justify-center">
              <h3 className="text-2xl font-bold text-gray-800 justify-center">
                {isReceiptEntry ? 'Add Receipt Number' : (invoice ? 'Edit Invoice' : 'Create New Invoice')}
              </h3>
            </div>
            <button
              onClick={onClose}
                className="close bg-blue-600 hover:bg-blue-700 text-white hover:text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
            >
                ×
            </button>

          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="invoice-form">
            <div className="scrollable-content p-6">
              {/* Invoice Header Section */}
              <div className="invoice-header-section mb-6">
                <div className="invoice-info-grid grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Patient Information Card */}
                  <div className="invoice-info-card bg-white border border-gray-200 rounded-lg p-4">
                    <div className="info-label flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                      <i className="fas fa-user-circle text-blue-600"></i>
                      <span className="font-semibold text-gray-800">Patient Information</span>
                    </div>
                <div className="form-group">
                      <label htmlFor="patientSelect" className="block text-sm font-medium text-gray-700 mb-1">
                        Select Patient *
                  </label>
                      <select
                        {...register('patientId')}
                        id="patientSelect"
                        onChange={(e) => handlePatientSelection(e.target.value)}
                        className={cn(
                          'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                          errors.patientId && 'border-red-500'
                        )}
                      >
                        <option value="">Select Patient</option>
                        {patientsWithAppointments.map(patient => (
                          <option key={patient.id} value={patient.id}>
                            {patient.name} - {patient.phone}
                          </option>
                        ))}
                      </select>
                      {errors.patientId && (
                        <span className="text-red-500 text-sm">{errors.patientId.message}</span>
                      )}
                      {/* Hidden field for patientName to ensure it's registered */}
                      <input type="hidden" {...register('patientName')} />
                </div>
                </div>

                  {/* Invoice Details Card */}
                  <div className="invoice-info-card bg-white border border-gray-200 rounded-lg p-4">
                    <div className="info-label flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                      <i className="fas fa-calendar-alt text-blue-600"></i>
                      <span className="font-semibold text-gray-800">Invoice Details</span>
                </div>
                    <div className="form-row space-y-3">
                <div className="form-group">
                        <label htmlFor="invoiceDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice Date *
                  </label>
                        <div className="enhanced-date-picker relative">
                  <input
                            {...register('invoiceDate')}
                    type="text"
                            id="invoiceDate"
                            readOnly
                            onClick={() => setShowInvoiceDateCalendar(!showInvoiceDateCalendar)}
                            className={cn(
                              'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer',
                              errors.invoiceDate && 'border-red-500'
                            )}
                          />
                          <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 cursor-pointer" />
                          
                          {/* Custom Calendar */}
                          {showInvoiceDateCalendar && (
                            <div className="calendar-container absolute top-full left-0 mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 z-50 transform -rotate-1">
                              {/* Calendar Header */}
                              <div className="flex items-center justify-between mb-4">
                                <button
                                  type="button"
                                  onClick={() => navigateInvoiceDateMonth('prev')}
                                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                                </button>
                                
                                <div className="flex items-center gap-2">
                                  {/* Month Dropdown */}
                                  <div className="dropdown-container relative">
                                    <button
                                      type="button"
                                      onClick={() => setShowInvoiceDateMonthDropdown(!showInvoiceDateMonthDropdown)}
                                      className="px-3 py-1 text-lg font-semibold text-gray-800 hover:bg-gray-100 rounded transition-colors"
                                    >
                                      {currentInvoiceDateMonth.toLocaleDateString('en-US', { month: 'long', timeZone: 'Asia/Karachi' })}
                                    </button>
                                    {showInvoiceDateMonthDropdown && (
                                      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto scrollbar-hide">
                                        {generateMonths().map((month, index) => (
                                          <button
                                            key={index}
                                            type="button"
                                            onClick={() => selectInvoiceDateMonth(index)}
                                            className="w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors"
                                          >
                                            {month}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* Year Dropdown */}
                                  <div className="dropdown-container relative">
                                    <button
                                      type="button"
                                      onClick={() => setShowInvoiceDateYearDropdown(!showInvoiceDateYearDropdown)}
                                      className="px-3 py-1 text-lg font-semibold text-gray-800 hover:bg-gray-100 rounded transition-colors"
                                    >
                                      {currentInvoiceDateMonth.getFullYear()}
                                    </button>
                                    {showInvoiceDateYearDropdown && (
                                      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto w-20 scrollbar-hide">
                                        {generateYears().map((year) => (
                                          <button
                                            key={year}
                                            type="button"
                                            onClick={() => selectInvoiceDateYear(year)}
                                            className="w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors"
                                          >
                                            {year}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => navigateInvoiceDateMonth('next')}
                                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                  <ChevronRight className="w-5 h-5 text-gray-600" />
                                </button>
                              </div>

                              {/* Calendar Grid */}
                              <div className="grid grid-cols-7 gap-1 mb-2">
                                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                                  <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                                    {day}
                                  </div>
                                ))}
                              </div>

                              <div className="grid grid-cols-7 gap-1">
                                {/* Empty cells for days before the first day of the month */}
                                {Array.from({ length: getFirstDayOfMonth(currentInvoiceDateMonth) }).map((_, index) => (
                                  <div key={`empty-${index}`} className="h-8"></div>
                                ))}
                                
                                {/* Days of the month */}
                                {Array.from({ length: getDaysInMonth(currentInvoiceDateMonth) }, (_, i) => i + 1).map(day => (
                                  <button
                                    key={day}
                                    type="button"
                                    onClick={() => selectInvoiceDate(day)}
                                    className={cn(
                                      'h-8 w-8 rounded-full text-sm font-medium transition-colors hover:bg-gray-100',
                                      isToday(day, currentInvoiceDateMonth) && 'bg-blue-500 text-white hover:bg-blue-600',
                                      isSelectedInvoiceDate(day) && !isToday(day, currentInvoiceDateMonth) && 'bg-blue-500 text-white hover:bg-blue-600',
                                      !isToday(day, currentInvoiceDateMonth) && !isSelectedInvoiceDate(day) && 'text-gray-800 hover:bg-gray-100'
                                    )}
                                  >
                                    {day}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        {errors.invoiceDate && (
                          <span className="text-red-500 text-sm">{errors.invoiceDate.message}</span>
                  )}
                </div>
                <div className="form-group">
                        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                          Due Date
                  </label>
                        <div className="enhanced-date-picker relative">
                  <input
                    {...register('dueDate')}
                    type="text"
                    id="dueDate"
                    readOnly
                    onClick={() => setShowDueDateCalendar(!showDueDateCalendar)}
                            className={cn(
                              'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer',
                              errors.dueDate && 'border-red-500'
                            )}
                  />
                          <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 cursor-pointer" />
                          
                          {/* Custom Calendar */}
                          {showDueDateCalendar && (
                            <div className="calendar-container absolute top-full left-0 mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 z-50 transform -rotate-1">
                              {/* Calendar Header */}
                              <div className="flex items-center justify-between mb-4">
                                <button
                                  type="button"
                                  onClick={() => navigateDueDateMonth('prev')}
                                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                                </button>
                                
                                <div className="flex items-center gap-2">
                                  {/* Month Dropdown */}
                                  <div className="dropdown-container relative">
                                    <button
                                      type="button"
                                      onClick={() => setShowDueDateMonthDropdown(!showDueDateMonthDropdown)}
                                      className="px-3 py-1 text-lg font-semibold text-gray-800 hover:bg-gray-100 rounded transition-colors"
                                    >
                                      {currentDueDateMonth.toLocaleDateString('en-US', { month: 'long', timeZone: 'Asia/Karachi' })}
                                    </button>
                                    {showDueDateMonthDropdown && (
                                      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto scrollbar-hide">
                                        {generateMonths().map((month, index) => (
                                          <button
                                            key={index}
                                            type="button"
                                            onClick={() => selectDueDateMonth(index)}
                                            className="w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors"
                                          >
                                            {month}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* Year Dropdown */}
                                  <div className="dropdown-container relative">
                                    <button
                                      type="button"
                                      onClick={() => setShowDueDateYearDropdown(!showDueDateYearDropdown)}
                                      className="px-3 py-1 text-lg font-semibold text-gray-800 hover:bg-gray-100 rounded transition-colors"
                                    >
                                      {currentDueDateMonth.getFullYear()}
                                    </button>
                                    {showDueDateYearDropdown && (
                                      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto w-20 scrollbar-hide">
                                        {generateYears().map((year) => (
                                          <button
                                            key={year}
                                            type="button"
                                            onClick={() => selectDueDateYear(year)}
                                            className="w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors"
                                          >
                                            {year}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => navigateDueDateMonth('next')}
                                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                  <ChevronRight className="w-5 h-5 text-gray-600" />
                                </button>
                              </div>

                              {/* Calendar Grid */}
                              <div className="grid grid-cols-7 gap-1 mb-2">
                                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                                  <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                                    {day}
                                  </div>
                                ))}
                              </div>

                              <div className="grid grid-cols-7 gap-1">
                                {/* Empty cells for days before the first day of the month */}
                                {Array.from({ length: getFirstDayOfMonth(currentDueDateMonth) }).map((_, index) => (
                                  <div key={`empty-${index}`} className="h-8"></div>
                                ))}
                                
                                {/* Days of the month */}
                                {Array.from({ length: getDaysInMonth(currentDueDateMonth) }, (_, i) => i + 1).map(day => (
                                  <button
                                    key={day}
                                    type="button"
                                    onClick={() => selectDueDate(day)}
                                    className={cn(
                                      'h-8 w-8 rounded-full text-sm font-medium transition-colors hover:bg-gray-100',
                                      isToday(day, currentDueDateMonth) && 'bg-blue-500 text-white hover:bg-blue-600',
                                      isSelectedDueDate(day) && !isToday(day, currentDueDateMonth) && 'bg-blue-500 text-white hover:bg-blue-600',
                                      !isToday(day, currentDueDateMonth) && !isSelectedDueDate(day) && 'text-gray-800 hover:bg-gray-100'
                                    )}
                                  >
                                    {day}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                  {errors.dueDate && (
                    <span className="text-red-500 text-sm">{errors.dueDate.message}</span>
                  )}
                      </div>
                    </div>
                </div>

                  {/* Payment Settings Card */}
                  <div className="invoice-info-card bg-white border border-gray-200 rounded-lg p-4">
                    <div className="info-label flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                      <i className="fas fa-credit-card text-blue-600"></i>
                      <span className="font-semibold text-gray-800">Payment Settings</span>
                    </div>
                    <div className="form-row space-y-3">
                <div className="form-group">
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                          Invoice Status
                  </label>
                  <select
                    {...register('status')}
                    id="status"
                          onChange={(e) => handleStatusChange(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
                      <div className="form-group">
                        <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
                          Payment Method
                        </label>
                        <select
                          {...register('paymentMethod')}
                          id="paymentMethod"
                          onChange={(e) => handlePaymentMethodChange(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select payment</option>
                          <option value="cash">Cash</option>
                          <option value="online">Online Payment</option>
                        </select>
              </div>
                      {showReceiptField && (
                        <div className="form-group" id="receipt-number-group">
                          <label htmlFor="receiptNumber" className="block text-sm font-medium text-gray-700 mb-1">
                            Receipt Number *
                          </label>
                          <input
                            {...register('receiptNumber')}
                            type="text"
                            id="receiptNumber"
                            className={cn(
                              'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                              errors.receiptNumber && 'border-red-500'
                            )}
                            placeholder="Enter online payment receipt number"
                            required={showReceiptField}
                          />
                          {errors.receiptNumber && (
                            <span className="text-red-500 text-sm">{errors.receiptNumber.message}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                        </div>
                        
              {/* Services Section */}
              <div className="services-section bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <div className="section-header flex items-center gap-3 mb-5 pb-3 border-b border-gray-200">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <i className="fas fa-stethoscope text-blue-600 text-lg"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 m-0">Dental Services</h3>
                </div>
                <div className="services-container">
                  <div id="treatments-list" className="space-y-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="treatment-item professional-treatment bg-gray-50 border border-gray-200 rounded-lg p-4 relative">
                        <div className="treatment-header flex items-center gap-2 mb-3">
                          <span className="treatment-number bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">#{index + 1}</span>
                          <span className="treatment-label font-medium text-gray-700">Service Details</span>
                        </div>
                        <div className="treatment-content grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="form-group">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                            <select
                              {...register(`treatments.${index}.type`)}
                              className={cn(
                                'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                                errors.treatments?.[index]?.type && 'border-red-500'
                              )}
                            >
                              <option value="">Select a service</option>
                              <option value="consultation">Initial Consultation</option>
                              <option value="cleaning">Dental Cleaning</option>
                              <option value="filling">Cavity Filling</option>
                              <option value="extraction">Tooth Extraction</option>
                              <option value="root-canal">Root Canal Treatment</option>
                              <option value="crown">Dental Crown</option>
                              <option value="whitening">Teeth Whitening</option>
                              <option value="braces">Orthodontic Consultation</option>
                              <option value="custom">Custom Service</option>
                            </select>
                            {errors.treatments?.[index]?.type && (
                              <span className="text-red-500 text-xs">{errors.treatments[index]?.type?.message}</span>
                            )}
                          </div>
                          <div className="form-group">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (PKR)</label>
                            <div className="amount-input-group relative">
                          <input
                                {...register(`treatments.${index}.unitPrice`, { valueAsNumber: true })}
                            type="number"
                                step="0.01"
                            min="0"
                                placeholder="0"
                                className={cn(
                                  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                                  errors.treatments?.[index]?.unitPrice && 'border-red-500'
                                )}
                              />
                            </div>
                            {errors.treatments?.[index]?.unitPrice && (
                              <span className="text-red-500 text-xs">{errors.treatments[index]?.unitPrice?.message}</span>
                          )}
                        </div>
                          <div className="form-group">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                            <input
                              {...register(`treatments.${index}.discount`, { valueAsNumber: true })}
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              placeholder="0"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            disabled={fields.length === 1}
                          className="btn-remove-treatment absolute top-3 right-3 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                          title="Remove Service"
                          >
                          <i className="fas fa-times text-xs"></i>
                          </button>
                      </div>
                    ))}
                    </div>
                  <button
                    type="button"
                    onClick={addItem}
                    className="btn-add-service w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
                  >
                    <i className="fas fa-plus"></i>
                    <span>Add Another Service</span>
                  </button>
                </div>
              </div>
              
              {/* Notes Section */}
              <div className="notes-section bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <div className="section-header flex items-center gap-2 mb-4">
                  <i className="fas fa-edit text-blue-600"></i>
                  <span className="font-semibold text-gray-800">Additional Information</span>
                </div>
                  <div className="form-group">
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice Notes & Terms
                    </label>
                    <textarea
                      {...register('notes')}
                      id="notes"
                      rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter payment terms, special instructions, or any additional notes for this invoice..."
                  />
                </div>
              </div>

              {/* Invoice Summary */}
              <div className="invoice-summary-section bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <div className="summary-header flex items-center gap-3 mb-5 pb-3 border-b border-gray-200">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <i className="fas fa-receipt text-blue-600 text-lg"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 m-0">Invoice Summary</h3>
                </div>
                <div className="summary-content space-y-3">
                  <div className="summary-row flex justify-between items-center">
                    <span className="summary-label text-gray-600">Subtotal:</span>
                    <span className="summary-value font-medium text-gray-800">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="summary-row flex justify-between items-center">
                    <span className="summary-label text-gray-600">Total Discount:</span>
                    <span className="summary-value discount text-red-600 font-medium">{formatCurrency(totalDiscount)}</span>
                      </div>
                  <div className="summary-row total-row flex justify-between items-center pt-3 border-t border-gray-200">
                    <span className="summary-label text-lg font-semibold text-gray-800">Total Amount:</span>
                    <span className="summary-value total-amount text-lg font-bold text-blue-600">{formatCurrency(total)}</span>
                    </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="form-actions professional-actions flex gap-3 justify-end p-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg  transition-colors"
              >
                <span>Cancel</span>
              </button>
              <button
                type="submit"
                className="btn btn-primary flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <i className="fas fa-save"></i>
                <span>{isReceiptEntry ? 'Mark as Paid' : (invoice ? 'Update Invoice' : 'Generate Invoice')}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}