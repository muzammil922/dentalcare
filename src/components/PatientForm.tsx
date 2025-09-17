import React, { useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { Patient } from '@/stores/useAppStore'
import { cn, getCurrentKarachiTime } from '@/lib/utils'

// Zod schema for patient validation
const patientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  medicalHistory: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  addDate: z.string(),
  address: z.string().optional(),
  dateOfBirth: z.string(),
  gender: z.enum(['male', 'female', 'other']),
  status: z.enum(['active', 'inactive', 'pending']),
  age: z.number().min(0).max(150, 'Age must be between 0 and 150')
})

type PatientFormData = z.infer<typeof patientSchema>

interface PatientFormProps {
  patient?: Patient | null
  onSave: (data: Omit<Patient, 'id'>) => void
  onClose: () => void
}

export default function PatientForm({ patient, onClose, onSave }: PatientFormProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const [showCalendar, setShowCalendar] = React.useState(false)
  const [showAddDateCalendar, setShowAddDateCalendar] = React.useState(false)
  const [currentMonth, setCurrentMonth] = React.useState(getCurrentKarachiTime())
  const [currentAddDateMonth, setCurrentAddDateMonth] = React.useState(getCurrentKarachiTime())
  const [showYearDropdown, setShowYearDropdown] = React.useState(false)
  const [showMonthDropdown, setShowMonthDropdown] = React.useState(false)
  const [showAddDateYearDropdown, setShowAddDateYearDropdown] = React.useState(false)
  const [showAddDateMonthDropdown, setShowAddDateMonthDropdown] = React.useState(false)

  // Handle click outside to close modal and calendar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      
      // Check if clicking outside the modal
      if (modalRef.current && !modalRef.current.contains(target)) {
        onClose()
        return
      }
      
      // Check if clicking outside calendar elements
      const isCalendarElement = (target as Element).closest?.('.calendar-container')
      const isDropdownElement = (target as Element).closest?.('.dropdown-container')
      
      if (!isCalendarElement && !isDropdownElement) {
        setShowCalendar(false)
        setShowAddDateCalendar(false)
        setShowYearDropdown(false)
        setShowMonthDropdown(false)
        setShowAddDateYearDropdown(false)
        setShowAddDateMonthDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: patient ? {
      name: patient.name,
      phone: patient.phone,
      medicalHistory: patient.medicalHistory,
      email: patient.email,
      addDate: getCurrentKarachiTime().toISOString().split('T')[0], // Today's date
      address: patient.address,
      dateOfBirth: '',
      gender: patient.gender,
      status: patient.status,
      age: patient.age
    } : {
      name: '',
      phone: '',
      medicalHistory: '',
      email: '',
      addDate: getCurrentKarachiTime().toISOString().split('T')[0], // Today's date
      address: '',
      dateOfBirth: '',
      gender: 'male',
      status: 'active',
      age: 0
    }
  })

  // Watch dateOfBirth to calculate age automatically
  const dateOfBirth = watch('dateOfBirth')

  // Function to calculate age from date of birth
  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 0
    
    const today = getCurrentKarachiTime()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  // Update age whenever dateOfBirth changes
  React.useEffect(() => {
    if (dateOfBirth) {
      const calculatedAge = calculateAge(dateOfBirth)
      setValue('age', calculatedAge)
    }
  }, [dateOfBirth, setValue])

  // Calendar utility functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }


  // Generate years array (from 1950 to current year + 10)
  const generateYears = () => {
    const currentYear = getCurrentKarachiTime().getFullYear()
    const years = []
    for (let year = 1950; year <= currentYear + 10; year++) {
      years.push(year)
    }
    return years.reverse()
  }

  // Generate months array
  const generateMonths = () => {
    return [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const navigateAddDateMonth = (direction: 'prev' | 'next') => {
    setCurrentAddDateMonth(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  // Handle year selection for date of birth calendar
  const selectYear = (year: number) => {
    console.log('Selecting year:', year)
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      newDate.setFullYear(year)
      return newDate
    })
    setShowYearDropdown(false)
  }

  // Handle month selection for date of birth calendar
  const selectMonth = (monthIndex: number) => {
    console.log('Selecting month:', monthIndex)
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(monthIndex)
      return newDate
    })
    setShowMonthDropdown(false)
  }

  // Handle year selection for add date calendar
  const selectAddDateYear = (year: number) => {
    setCurrentAddDateMonth(prev => {
      const newDate = new Date(prev)
      newDate.setFullYear(year)
      return newDate
    })
    setShowAddDateYearDropdown(false)
  }

  // Handle month selection for add date calendar
  const selectAddDateMonth = (monthIndex: number) => {
    setCurrentAddDateMonth(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(monthIndex)
      return newDate
    })
    setShowAddDateMonthDropdown(false)
  }

  const selectDate = (day: number) => {
    console.log('Selecting date:', day)
    // Create date in local timezone to avoid offset issues
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    console.log('Formatted date:', formattedDate)
    setValue('dateOfBirth', formattedDate)
    setShowCalendar(false)
  }

  const isToday = (day: number) => {
    const today = getCurrentKarachiTime()
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    return date.toDateString() === today.toDateString()
  }

  const isSelectedDate = (day: number) => {
    if (!dateOfBirth) return false
    const selectedDate = new Date(dateOfBirth)
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    return date.toDateString() === selectedDate.toDateString()
  }

  const onSubmit = (data: PatientFormData) => {
    // Map form data to Patient interface
    const patientData = {
      name: data.name.charAt(0).toUpperCase() + data.name.slice(1).toLowerCase(),
      age: data.age,
      gender: data.gender,
      phone: data.phone,
      email: data.email || '',
      address: data.address || '',
      medicalHistory: data.medicalHistory || '',
      status: data.status,
      registrationDate: data.addDate
    }
    onSave(patientData)
    reset()
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4"
        style={{ zIndex: 999999 }}
        onClick={onClose}
      >
        <motion.div
          ref={modalRef}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">
              {patient ? 'Update Patient' : 'Add New Patient'}
            </h2>
            <button
              onClick={onClose}
              className="close bg-blue-600 hover:bg-blue-700 text-white hover:text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
            >
              ×
            </button>
          </div>

          {/* Modal Body */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6">
            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* FULL NAME */}
                <div className="form-group">
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                    FULL NAME *
                  </label>
                  <input
                    {...register('name')}
                    type="text"
                    id="name"
                    className={cn(
                      'w-full px-4 py-3 border-2 border-blue-500 rounded-lg text-gray-900 focus:outline-none focus:border-blue-600 transition-colors',
                      errors.name && 'border-red-500'
                    )}
                    placeholder="Enter patient's full name"
                  />
                  {errors.name && (
                    <span className="text-red-500 text-sm mt-1">{errors.name.message}</span>
                  )}
                </div>

                {/* PHONE NUMBER */}
                <div className="form-group">
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                    PHONE NUMBER *
                  </label>
                  <input
                    {...register('phone')}
                    type="tel"
                    id="phone"
                    className={cn(
                      'w-full px-4 py-3 border-2 border-blue-500 rounded-lg text-gray-900 focus:outline-none focus:border-blue-600 transition-colors',
                      errors.phone && 'border-red-500'
                    )}
                    placeholder="Enter phone number"
                  />
                  {errors.phone && (
                    <span className="text-red-500 text-sm mt-1">{errors.phone.message}</span>
                  )}
                </div>

                {/* EMAIL */}
                <div className="form-group">
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    EMAIL
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    id="email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Enter email address"
                  />
                </div>

                {/* DATE OF BIRTH */}
                <div className="form-group">
                  <label htmlFor="dateOfBirth" className="block text-sm font-semibold text-gray-700 mb-2">
                    DATE OF BIRTH *
                  </label>
                  <div className="relative">
                  <input
                      {...register('dateOfBirth')}
                      type="text"
                      id="dateOfBirth"
                      readOnly
                      onClick={() => setShowCalendar(!showCalendar)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                      placeholder="Select date of birth"
                      value={dateOfBirth ? new Date(dateOfBirth).toLocaleDateString('en-US', { timeZone: 'Asia/Karachi' }) : ''}
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 cursor-pointer" />
                    
                    {/* Custom Calendar */}
                    {showCalendar && (
                      <div className="calendar-container absolute top-full left-0 mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 z-50 transform -rotate-1">
                        {/* Calendar Header */}
                        <div className="flex items-center justify-between mb-4">
                          <button
                            type="button"
                            onClick={() => navigateMonth('prev')}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                          </button>
                          
                          <div className="flex items-center gap-2">
                            {/* Month Dropdown */}
                            <div className="dropdown-container relative">
                              <button
                                type="button"
                                onClick={() => {
                                  console.log('Toggling month dropdown')
                                  setShowMonthDropdown(!showMonthDropdown)
                                }}
                                className="px-3 py-1 text-lg font-semibold text-gray-800 hover:bg-gray-100 rounded transition-colors"
                              >
                                {currentMonth.toLocaleDateString('en-US', { month: 'long', timeZone: 'Asia/Karachi' })}
                              </button>
                              {showMonthDropdown && (
                                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto scrollbar-hide">
                                  {generateMonths().map((month, index) => (
                                    <button
                                      key={index}
                                      type="button"
                                      onClick={() => selectMonth(index)}
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
                                onClick={() => {
                                  console.log('Toggling year dropdown')
                                  setShowYearDropdown(!showYearDropdown)
                                }}
                                className="px-3 py-1 text-lg font-semibold text-gray-800 hover:bg-gray-100 rounded transition-colors"
                              >
                                {currentMonth.getFullYear()}
                              </button>
                              {showYearDropdown && (
                                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto w-20 scrollbar-hide">
                                  {generateYears().map((year) => (
                                    <button
                                      key={year}
                                      type="button"
                                      onClick={() => selectYear(year)}
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
                            onClick={() => navigateMonth('next')}
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
                          {Array.from({ length: getFirstDayOfMonth(currentMonth) }).map((_, index) => (
                            <div key={`empty-${index}`} className="h-8"></div>
                          ))}
                          
                          {/* Days of the month */}
                          {Array.from({ length: getDaysInMonth(currentMonth) }, (_, i) => i + 1).map(day => (
                            <button
                              key={day}
                              type="button"
                              onClick={() => selectDate(day)}
                              className={cn(
                                'h-8 w-8 rounded-full text-sm font-medium transition-colors hover:bg-gray-100',
                                isToday(day) && 'bg-blue-500 text-white hover:bg-blue-600',
                                isSelectedDate(day) && !isToday(day) && 'bg-blue-500 text-white hover:bg-blue-600',
                                !isToday(day) && !isSelectedDate(day) && 'text-gray-800 hover:bg-gray-100'
                              )}
                            >
                              {day}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* GENDER */}
                <div className="form-group">
                  <label htmlFor="gender" className="block text-sm font-semibold text-gray-700 mb-2">
                    GENDER *
                  </label>
                  <select
                    {...register('gender')}
                    id="gender"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* AGE */}
                <div className="form-group">
                  <label htmlFor="age" className="block text-sm font-semibold text-gray-700 mb-2">
                    AGE 
                  </label>
                  <input
                    {...register('age', { valueAsNumber: true })}
                    type="number"
                    id="age"
                    readOnly
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-gray-50 cursor-not-allowed"
                  />
                  <p className="text-gray-500 text-xs mt-1">Auto-calculated from date of birth</p>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* ADD DATE */}
                <div className="form-group">
                  <label htmlFor="addDate" className="block text-sm font-semibold text-gray-700 mb-2">
                    ADD DATE *
                  </label>
                  <div className="relative">
                  <input
                      {...register('addDate')}
                      type="text"
                      id="addDate"
                      readOnly
                      onClick={() => setShowAddDateCalendar(!showAddDateCalendar)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                      placeholder="Select add date"
                      value={watch('addDate') ? new Date(watch('addDate')).toLocaleDateString('en-US', { timeZone: 'Asia/Karachi' }) : ''}
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 cursor-pointer" />
                    
                    {/* Custom Calendar for Add Date */}
                    {showAddDateCalendar && (
                      <div className="calendar-container absolute top-full left-0 mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 z-50 transform -rotate-1">
                        {/* Calendar Header */}
                        <div className="flex items-center justify-between mb-4">
                          <button
                            type="button"
                            onClick={() => navigateAddDateMonth('prev')}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                          </button>
                          
                          <div className="flex items-center gap-2">
                            {/* Month Dropdown */}
                            <div className="dropdown-container relative">
                              <button
                                type="button"
                                onClick={() => setShowAddDateMonthDropdown(!showAddDateMonthDropdown)}
                                className="px-3 py-1 text-lg font-semibold text-gray-800 hover:bg-gray-100 rounded transition-colors"
                              >
                                {currentAddDateMonth.toLocaleDateString('en-US', { month: 'long', timeZone: 'Asia/Karachi' })}
                              </button>
                              {showAddDateMonthDropdown && (
                                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto scrollbar-hide">
                                  {generateMonths().map((month, index) => (
                                    <button
                                      key={index}
                                      type="button"
                                      onClick={() => selectAddDateMonth(index)}
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
                                onClick={() => setShowAddDateYearDropdown(!showAddDateYearDropdown)}
                                className="px-3 py-1 text-lg font-semibold text-gray-800 hover:bg-gray-100 rounded transition-colors"
                              >
                                {currentAddDateMonth.getFullYear()}
                              </button>
                              {showAddDateYearDropdown && (
                                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto w-20 scrollbar-hide">
                                  {generateYears().map((year) => (
                                    <button
                                      key={year}
                                      type="button"
                                      onClick={() => selectAddDateYear(year)}
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
                            onClick={() => navigateAddDateMonth('next')}
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
                          {Array.from({ length: getFirstDayOfMonth(currentAddDateMonth) }).map((_, index) => (
                            <div key={`empty-${index}`} className="h-8"></div>
                          ))}
                          
                          {/* Days of the month */}
                          {Array.from({ length: getDaysInMonth(currentAddDateMonth) }, (_, i) => i + 1).map(day => (
                            <button
                              key={day}
                              type="button"
                              onClick={() => {
                                const year = currentAddDateMonth.getFullYear()
                                const month = currentAddDateMonth.getMonth()
                                const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                                setValue('addDate', formattedDate)
                                setShowAddDateCalendar(false)
                              }}
                              className={cn(
                                'h-8 w-8 rounded-full text-sm font-medium transition-colors hover:bg-gray-100',
                                new Date(currentAddDateMonth.getFullYear(), currentAddDateMonth.getMonth(), day).toDateString() === getCurrentKarachiTime().toDateString() && 'bg-blue-500 text-white hover:bg-blue-600',
                                watch('addDate') && new Date(watch('addDate')).toDateString() === new Date(currentAddDateMonth.getFullYear(), currentAddDateMonth.getMonth(), day).toDateString() && 'bg-blue-500 text-white hover:bg-blue-600',
                                !(new Date(currentAddDateMonth.getFullYear(), currentAddDateMonth.getMonth(), day).toDateString() === getCurrentKarachiTime().toDateString()) && (!watch('addDate') || new Date(watch('addDate')).toDateString() !== new Date(currentAddDateMonth.getFullYear(), currentAddDateMonth.getMonth(), day).toDateString()) && 'text-gray-800 hover:bg-gray-100'
                              )}
                            >
                              {day}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ADDRESS */}
                <div className="form-group">
                  <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
                    ADDRESS
                  </label>
                  <input
                    {...register('address')}
                    type="text"
                    id="address"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Enter address"
                  />
                </div>

                {/* STATUS */}
                <div className="form-group">
                  <label htmlFor="status" className="block text-sm font-semibold text-gray-700 mb-2">
                    STATUS
                  </label>
                  <select
                    {...register('status')}
                    id="status"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
              </div>

                {/* MEDICAL HISTORY */}
                <div className="form-group">
                  <label htmlFor="medicalHistory" className="block text-sm font-semibold text-gray-700 mb-2">
                    MEDICAL HISTORY
                  </label>
                  <textarea
                    {...register('medicalHistory')}
                    id="medicalHistory"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                    placeholder="Enter medical history"
                    rows={6}
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 justify-end pt-6 border-t border-gray-200 mt-8">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg transition-colors"
              >
                <span>Cancel</span>
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span>{isSubmitting ? 'Saving...' : patient ? 'Update Patient' : 'Save Patient'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
