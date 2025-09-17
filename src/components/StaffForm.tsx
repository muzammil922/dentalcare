import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Calendar, MapPin, ChevronLeft, ChevronRight } from 'lucide-react'
import { Staff } from '@/stores/useAppStore'
import { cn, getCurrentKarachiTime } from '@/lib/utils'

const staffSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  role: z.string().min(1, 'Role is required'),
  department: z.string().optional(),
  joinDate: z.string().min(1, 'Join date is required'),
  salary: z.number().min(0, 'Salary must be non-negative').optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  age: z.number().min(1, 'Age must be at least 1').optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  qualifications: z.string().optional(),
  experience: z.string().optional(),
  jobTerm: z.enum(['permanent', 'contract', 'temporary']).optional(),
  status: z.enum(['active', 'inactive', 'on_leave']),
  notes: z.string().optional()
})

type StaffFormData = z.infer<typeof staffSchema>

interface StaffFormProps {
  staff?: Staff | null
  onSave: (data: Omit<Staff, 'id'>) => void
  onClose: () => void
}

export default function StaffForm({ staff, onSave, onClose }: StaffFormProps) {
  // Calendar states
  const [showJoinDateCalendar, setShowJoinDateCalendar] = useState(false)
  const [currentJoinDateMonth, setCurrentJoinDateMonth] = useState(getCurrentKarachiTime())
  const [showJoinDateYearDropdown, setShowJoinDateYearDropdown] = useState(false)
  const [showJoinDateMonthDropdown, setShowJoinDateMonthDropdown] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: staff?.name || '',
      email: staff?.email || '',
      phone: staff?.phone || '',
      role: staff?.role || '',
      department: staff?.department || '',
      joinDate: staff?.joinDate || getCurrentKarachiTime().toISOString().split('T')[0],
      salary: staff?.salary || 0,
      gender: staff?.gender || 'male',
      age: staff?.age || 25,
      address: staff?.address || '',
      emergencyContact: staff?.emergencyContact || '',
      emergencyPhone: staff?.emergencyPhone || '',
      qualifications: staff?.qualifications || '',
      experience: staff?.experience || '',
      jobTerm: staff?.jobTerm || 'permanent',
      status: staff?.status || 'active',
      notes: staff?.notes || ''
    }
  })

  const onSubmit = (data: StaffFormData) => {
    onSave(data)
    reset()
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

  const navigateJoinDateMonth = (direction: 'prev' | 'next') => {
    setCurrentJoinDateMonth(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const selectJoinDateMonth = (monthIndex: number) => {
    setCurrentJoinDateMonth(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(monthIndex)
      return newDate
    })
    setShowJoinDateMonthDropdown(false)
  }

  const selectJoinDateYear = (year: number) => {
    setCurrentJoinDateMonth(prev => {
      const newDate = new Date(prev)
      newDate.setFullYear(year)
      return newDate
    })
    setShowJoinDateYearDropdown(false)
  }

  const selectJoinDate = (day: number) => {
    const year = currentJoinDateMonth.getFullYear()
    const month = currentJoinDateMonth.getMonth()
    const selectedDate = new Date(year, month, day)
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    
    setValue('joinDate', formattedDate)
    setShowJoinDateCalendar(false)
  }

  const isSelectedJoinDate = (day: number) => {
    const selectedDate = watch('joinDate')
    if (!selectedDate) return false
    
    const year = currentJoinDateMonth.getFullYear()
    const month = currentJoinDateMonth.getMonth()
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
        setShowJoinDateCalendar(false)
        setShowJoinDateYearDropdown(false)
        setShowJoinDateMonthDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const positions = [
    'Dentist',
    'Dental Hygienist',
    'Dental Assistant',
    'Receptionist',
    'Office Manager',
    'Lab Technician',
    'Nurse',
    'Administrative Staff'
  ]

  const departments = [
    'General Dentistry',
    'Orthodontics',
    'Periodontics',
    'Endodontics',
    'Oral Surgery',
    'Pediatric Dentistry',
    'Administration',
    'Laboratory'
  ]

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
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto scrollbar-hide"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">
              {staff ? 'Edit Staff Member' : 'Add New Staff Member'}
            </h2>
            <button
              onClick={onClose}
              className="close bg-blue-600 hover:bg-blue-700 text-white hover:text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
            >
              ×
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="name" className="form-label">
                    Full Name *
                  </label>
                  <input
                    {...register('name')}
                    type="text"
                    id="name"
                    className={cn('form-input', errors.name && 'border-red-500')}
                    placeholder="Enter full name"
                  />
                  {errors.name && (
                    <span className="text-red-500 text-sm">{errors.name.message}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    Email Address *
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    id="email"
                    className={cn('form-input', errors.email && 'border-red-500')}
                    placeholder="Enter email address"
                  />
                  {errors.email && (
                    <span className="text-red-500 text-sm">{errors.email.message}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="phone" className="form-label">
                    Phone Number *
                  </label>
                  <input
                    {...register('phone')}
                    type="tel"
                    id="phone"
                    className={cn('form-input', errors.phone && 'border-red-500')}
                    placeholder="Enter phone number"
                  />
                  {errors.phone && (
                    <span className="text-red-500 text-sm">{errors.phone.message}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="gender" className="form-label">
                    Gender
                  </label>
                  <select
                    {...register('gender')}
                    id="gender"
                    className="form-input"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="age" className="form-label">
                    Age
                  </label>
                  <input
                    {...register('age', { valueAsNumber: true })}
                    type="number"
                    id="age"
                    min="1"
                    max="100"
                    className={cn('form-input', errors.age && 'border-red-500')}
                    placeholder="Enter age"
                  />
                  {errors.age && (
                    <span className="text-red-500 text-sm">{errors.age.message}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="role" className="form-label">
                    Role *
                  </label>
                  <select
                    {...register('role')}
                    id="role"
                    className={cn('form-input', errors.role && 'border-red-500')}
                  >
                    <option value="">Select role</option>
                    {positions.map((position) => (
                      <option key={position} value={position}>{position}</option>
                    ))}
                  </select>
                  {errors.role && (
                    <span className="text-red-500 text-sm">{errors.role.message}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="department" className="form-label">
                    Department
                  </label>
                  <select
                    {...register('department')}
                    id="department"
                    className="form-input"
                  >
                    <option value="">Select department</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="experience" className="form-label">
                    Experience
                  </label>
                  <input
                    {...register('experience')}
                    type="text"
                    id="experience"
                    className="form-input"
                    placeholder="e.g., 5 years"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="jobTerm" className="form-label">
                    Job Term
                  </label>
                  <select
                    {...register('jobTerm')}
                    id="jobTerm"
                    className="form-input"
                  >
                    <option value="permanent">Permanent</option>
                    <option value="contract">Contract</option>
                    <option value="temporary">Temporary</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="status" className="form-label">
                    Status
                  </label>
                  <select
                    {...register('status')}
                    id="status"
                    className="form-input"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="on_leave">On Leave</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Employment Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Employment Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="joinDate" className="form-label">
                    Join Date *
                  </label>
                  <div className="relative">
                  <input
                    {...register('joinDate')}
                      type="text"
                    id="joinDate"
                      readOnly
                      onClick={() => setShowJoinDateCalendar(!showJoinDateCalendar)}
                      className={cn('form-input cursor-pointer', errors.joinDate && 'border-red-500')}
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 cursor-pointer" />
                    
                    {/* Custom Calendar */}
                    {showJoinDateCalendar && (
                      <div className="calendar-container absolute top-full left-0 mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 z-50 transform -rotate-1">
                        {/* Calendar Header */}
                        <div className="flex items-center justify-between mb-4">
                          <button
                            type="button"
                            onClick={() => navigateJoinDateMonth('prev')}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                          </button>
                          
                          <div className="flex items-center gap-2">
                            {/* Month Dropdown */}
                            <div className="dropdown-container relative">
                              <button
                                type="button"
                                onClick={() => setShowJoinDateMonthDropdown(!showJoinDateMonthDropdown)}
                                className="px-3 py-1 text-lg font-semibold text-gray-800 hover:bg-gray-100 rounded transition-colors"
                              >
                                {currentJoinDateMonth.toLocaleDateString('en-US', { month: 'long', timeZone: 'Asia/Karachi' })}
                              </button>
                              {showJoinDateMonthDropdown && (
                                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto scrollbar-hide">
                                  {generateMonths().map((month, index) => (
                                    <button
                                      key={index}
                                      type="button"
                                      onClick={() => selectJoinDateMonth(index)}
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
                                onClick={() => setShowJoinDateYearDropdown(!showJoinDateYearDropdown)}
                                className="px-3 py-1 text-lg font-semibold text-gray-800 hover:bg-gray-100 rounded transition-colors"
                              >
                                {currentJoinDateMonth.getFullYear()}
                              </button>
                              {showJoinDateYearDropdown && (
                                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto w-20 scrollbar-hide">
                                  {generateYears().map((year) => (
                                    <button
                                      key={year}
                                      type="button"
                                      onClick={() => selectJoinDateYear(year)}
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
                            onClick={() => navigateJoinDateMonth('next')}
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
                          {Array.from({ length: getFirstDayOfMonth(currentJoinDateMonth) }).map((_, index) => (
                            <div key={`empty-${index}`} className="h-8"></div>
                          ))}
                          
                          {/* Days of the month */}
                          {Array.from({ length: getDaysInMonth(currentJoinDateMonth) }, (_, i) => i + 1).map(day => (
                            <button
                              key={day}
                              type="button"
                              onClick={() => selectJoinDate(day)}
                              className={cn(
                                'h-8 w-8 rounded-full text-sm font-medium transition-colors hover:bg-gray-100',
                                isToday(day, currentJoinDateMonth) && 'bg-blue-500 text-white hover:bg-blue-600',
                                isSelectedJoinDate(day) && !isToday(day, currentJoinDateMonth) && 'bg-blue-500 text-white hover:bg-blue-600',
                                !isToday(day, currentJoinDateMonth) && !isSelectedJoinDate(day) && 'text-gray-800 hover:bg-gray-100'
                              )}
                            >
                              {day}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {errors.joinDate && (
                    <span className="text-red-500 text-sm">{errors.joinDate.message}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="salary" className="form-label">
                    Monthly Salary
                  </label>
                  <input
                    {...register('salary', { valueAsNumber: true })}
                    type="number"
                    id="salary"
                    min="0"
                    step="1000"
                    className={cn('form-input', errors.salary && 'border-red-500')}
                    placeholder="Enter monthly salary"
                  />
                  {errors.salary && (
                    <span className="text-red-500 text-sm">{errors.salary.message}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Additional Information
              </h3>
              
              <div className="form-group">
                <label htmlFor="address" className="form-label">
                  Address
                </label>
                <textarea
                  {...register('address')}
                  id="address"
                  rows={2}
                  className="form-input"
                  placeholder="Enter address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="emergencyContact" className="form-label">
                    Emergency Contact
                  </label>
                  <input
                    {...register('emergencyContact')}
                    type="text"
                    id="emergencyContact"
                    className="form-input"
                    placeholder="Emergency contact name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="emergencyPhone" className="form-label">
                    Emergency Phone
                  </label>
                  <input
                    {...register('emergencyPhone')}
                    type="tel"
                    id="emergencyPhone"
                    className="form-input"
                    placeholder="Emergency contact phone"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="qualifications" className="form-label">
                  Qualifications & Certifications
                </label>
                <textarea
                  {...register('qualifications')}
                  id="qualifications"
                  rows={3}
                  className="form-input"
                  placeholder="Enter qualifications, certifications, and specializations"
                />
              </div>

              <div className="form-group">
                <label htmlFor="notes" className="form-label">
                  Additional Notes
                </label>
                <textarea
                  {...register('notes')}
                  id="notes"
                  rows={3}
                  className="form-input"
                  placeholder="Enter any additional notes or comments"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg transition-colors"
              >
                <span>Cancel</span>
              </button>
              <button
                type="submit"
                className="btn btn-primary flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span>{staff ? 'Update Staff Member' : 'Add Staff Member'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
