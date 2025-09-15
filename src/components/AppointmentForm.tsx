import React, { useRef, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { Appointment, Patient } from '@/stores/useAppStore'
import { cn, getCurrentKarachiTime } from '@/lib/utils'
import toast from 'react-hot-toast'

const appointmentSchema = z.object({
  patient: z.string().min(1, 'Patient is required'),
  appointmentDate: z.string().min(1, 'Appointment date is required'),
  appointmentTime: z.string().min(1, 'Appointment time is required'),
  duration: z.string().min(1, 'Duration is required'),
  treatmentType: z.string().min(1, 'Treatment type is required'),
  status: z.string().min(1, 'Status is required'),
  priority: z.string().min(1, 'Priority is required'),
  reminder: z.string().min(1, 'Reminder is required'),
  notes: z.string().optional()
})

type AppointmentFormData = z.infer<typeof appointmentSchema>

interface AppointmentFormProps {
  appointment?: Appointment | null
  patients: Patient[]
  appointments: Appointment[]
  onSave: (data: Omit<Appointment, 'id'>) => void
  onClose: () => void
}

export default function AppointmentForm({ appointment, patients, appointments, onSave, onClose }: AppointmentFormProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const [showCalendar, setShowCalendar] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(getCurrentKarachiTime())
  const [showYearDropdown, setShowYearDropdown] = useState(false)
  const [showMonthDropdown, setShowMonthDropdown] = useState(false)
  const [showTimeDropdown, setShowTimeDropdown] = useState(false)
  const [availableTimeSlots, setAvailableTimeSlots] = useState<Array<{value: string, label: string}>>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patient: appointment?.patientName || '',
      appointmentDate: appointment?.date || getCurrentKarachiTime().toISOString().split('T')[0],
      appointmentTime: appointment?.time || '8:00 AM',
      duration: appointment?.duration || '60 minutes',
      treatmentType: appointment?.type || 'Consultation',
      status: appointment?.status || 'Scheduled',
      priority: appointment?.priority || 'Normal',
      reminder: 'No Reminder',
      notes: appointment?.notes || ''
    }
  })

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

  const generateTimeSlots = () => {
    const times = []
    for (let hour = 8; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        const displayTime = new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZone: 'Asia/Karachi'
        })
        times.push({ value: displayTime, label: displayTime })
      }
    }
    return times
  }

  // Helper function to convert 12-hour format to 24-hour format
  const convertTo24Hour = (time12h: string) => {
    const [time, modifier] = time12h.split(' ')
    let [hours, minutes] = time.split(':')
    
    if (hours === '12') {
      hours = '00'
    }
    
    if (modifier === 'PM') {
      hours = (parseInt(hours, 10) + 12).toString()
    }
    
    return `${hours.padStart(2, '0')}:${minutes}:00`
  }

  const getNextAvailableTimeSlot = (selectedDate: string) => {
    if (!selectedDate) return '8:00 AM'

    const existingAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.date).toISOString().split('T')[0]
      const selectedDateFormatted = new Date(selectedDate).toISOString().split('T')[0]
      // Exclude current appointment when editing
      const isCurrentAppointment = appointment && apt.id === appointment.id
      return (aptDate === selectedDateFormatted || apt.date === selectedDate) && !isCurrentAppointment
    })

    if (existingAppointments.length === 0) {
      return '8:00 AM'
    }

    existingAppointments.sort((a, b) => {
      const timeA24 = convertTo24Hour(a.time)
      const timeB24 = convertTo24Hour(b.time)
      const timeA = new Date(`2000-01-01T${timeA24}`).getTime()
      const timeB = new Date(`2000-01-01T${timeB24}`).getTime()
      return timeA - timeB
    })

    const lastAppointment = existingAppointments[existingAppointments.length - 1]
    
    // Parse the appointment time safely
    let appointmentTime
    try {
      const time24 = convertTo24Hour(lastAppointment.time)
      appointmentTime = new Date(`2000-01-01T${time24}`).getTime()
      if (isNaN(appointmentTime)) {
        return '8:00 AM'
      }
    } catch (error) {
      return '8:00 AM'
    }
    
    let duration = 60
    if (lastAppointment.duration) {
      const durationMatch = lastAppointment.duration.match(/(\d+)/)
      if (durationMatch) {
        duration = parseInt(durationMatch[1])
      }
    }
    
    const appointmentEndTime = appointmentTime + (duration * 60000)
    const nextAvailableTime = new Date(appointmentEndTime)
    
    // Validate the calculated time
    if (isNaN(nextAvailableTime.getTime())) {
      return '8:00 AM'
    }
    
    // Check if the next available time is within business hours (8 AM - 6 PM)
    const hours = nextAvailableTime.getHours()
    if (hours < 8 || hours >= 18) {
      return '8:00 AM' // Default to next day start time
    }
    
    return nextAvailableTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Karachi'
    })
  }

  // Handle click outside to close modal and calendar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      
      if (modalRef.current && !modalRef.current.contains(target)) {
        onClose()
        return
      }
      
      const isCalendarElement = (target as Element).closest?.('.calendar-container')
      const isDropdownElement = (target as Element).closest?.('.dropdown-container')
      
      if (!isCalendarElement && !isDropdownElement) {
        setShowCalendar(false)
        setShowYearDropdown(false)
        setShowMonthDropdown(false)
        setShowTimeDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  // Update available time slots when date changes
  useEffect(() => {
    const selectedDate = watch('appointmentDate')
    if (selectedDate) {
      const available = generateTimeSlots()
      setAvailableTimeSlots(available)
      
      try {
        const nextTime = getNextAvailableTimeSlot(selectedDate)
        if (nextTime && nextTime !== 'Invalid Date') {
          setValue('appointmentTime', nextTime)
        } else {
          setValue('appointmentTime', '8:00 AM')
        }
      } catch (error) {
        setValue('appointmentTime', '8:00 AM')
      }
    } else {
      setAvailableTimeSlots(generateTimeSlots())
    }
  }, [watch('appointmentDate'), appointments, setValue])

  // Initialize with current date and auto-select time on component mount
  useEffect(() => {
    const currentDate = watch('appointmentDate')
    
    if (currentDate) {
      const available = generateTimeSlots()
      setAvailableTimeSlots(available)
      
      try {
        const nextTime = getNextAvailableTimeSlot(currentDate)
        if (nextTime && nextTime !== 'Invalid Date') {
          setValue('appointmentTime', nextTime)
        } else {
          setValue('appointmentTime', '8:00 AM')
        }
      } catch (error) {
        setValue('appointmentTime', '8:00 AM')
      }
    }
  }, [appointments, setValue, watch])

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

  const selectDate = (day: number) => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const selectedDate = new Date(year, month, day)
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    
    setValue('appointmentDate', formattedDate)
    setShowCalendar(false)
  }

  const isSelectedDate = (day: number) => {
    const selectedDate = watch('appointmentDate')
    if (!selectedDate) return false
    
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return selectedDate === formattedDate
  }

  const onSubmit = (data: AppointmentFormData) => {
    // Check for duplicate appointment times
    const existingAppointment = appointments.find(apt => {
      const aptDate = new Date(apt.date).toISOString().split('T')[0]
      const selectedDate = new Date(data.appointmentDate).toISOString().split('T')[0]
      
      // If editing an appointment, exclude the current appointment from the check
      const isCurrentAppointment = appointment && apt.id === appointment.id
      
      return !isCurrentAppointment && 
             aptDate === selectedDate && 
             apt.time === data.appointmentTime
    })
    
    if (existingAppointment) {
      toast.error('Same time appointment not allowed.')
      return
    }
    
    const selectedPatient = patients.find(p => p.name === data.patient)
    
    const appointmentData = {
      patientId: selectedPatient?.id || '',
      patientName: data.patient.charAt(0).toUpperCase() + data.patient.slice(1).toLowerCase(),
      patientGender: selectedPatient?.gender || 'male',
      date: data.appointmentDate,
      time: data.appointmentTime,
      duration: data.duration,
      type: data.treatmentType,
      status: data.status as 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show',
      priority: data.priority as 'normal' | 'high' | 'urgent',
      reminder: data.reminder,
      notes: data.notes,
      createdAt: getCurrentKarachiTime().toISOString()
    }
    
    toast.success('Appointment saved successfully!')
    onSave(appointmentData)
    reset()
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4" 
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide"
        onClick={(e) => e.stopPropagation()}
      >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">
              {appointment ? 'Update Appointment' : 'Schedule New Appointment'}
            </h2>
            <button
              onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
            <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Patient Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                    PATIENT *
                  </label>
                  <select
                    {...register('patient')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Patient</option>
                {patients.map((patient) => (
                        <option key={patient.id} value={patient.name}>
                    {patient.name}
                        </option>
                ))}
                  </select>
                  {errors.patient && (
                <p className="text-red-500 text-sm">{errors.patient.message}</p>
                  )}
                </div>

            {/* Appointment Date */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                    APPOINTMENT DATE *
                  </label>
                  <div className="relative">
                    <input
                  type="text"
                      {...register('appointmentDate')}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                  onClick={() => setShowCalendar(!showCalendar)}
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  </div>
                  {errors.appointmentDate && (
                <p className="text-red-500 text-sm">{errors.appointmentDate.message}</p>
                  )}
                </div>

            {/* Appointment Time */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                    APPOINTMENT TIME *
                  </label>
                  <div className="relative">
                    <input
                  type="text"
                      {...register('appointmentTime')}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                  onClick={() => setShowTimeDropdown(!showTimeDropdown)}
                />
                <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  </div>
                  {errors.appointmentTime && (
                <p className="text-red-500 text-sm">{errors.appointmentTime.message}</p>
                  )}
                </div>

            {/* Duration */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                DURATION *
                  </label>
              <select
                    {...register('duration')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="30 minutes">30 minutes</option>
                <option value="40 minutes">40 minutes</option>
                <option value="60 minutes">60 minutes</option>
                <option value="90 minutes">90 minutes</option>
                <option value="120 minutes">120 minutes</option>
                <option value="custom">Custom (enter manually)</option>
              </select>
              {errors.duration && (
                <p className="text-red-500 text-sm">{errors.duration.message}</p>
              )}
                </div>

            {/* Treatment Type */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                TREATMENT TYPE *
              </label>
              <select
                {...register('treatmentType')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Consultation">Consultation</option>
                <option value="Cleaning">Cleaning</option>
                <option value="Filling">Filling</option>
                <option value="Root Canal">Root Canal</option>
                <option value="Extraction">Extraction</option>
                <option value="Crown">Crown</option>
                <option value="Bridge">Bridge</option>
                <option value="Dentures">Dentures</option>
                <option value="Orthodontics">Orthodontics</option>
                <option value="Cosmetic">Cosmetic</option>
                <option value="Emergency">Emergency</option>
              </select>
              {errors.treatmentType && (
                <p className="text-red-500 text-sm">{errors.treatmentType.message}</p>
              )}
              </div>

            {/* Priority */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                PRIORITY *
                  </label>
              <select
                {...register('priority')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Normal">Normal</option>
                <option value="Urgent">Urgent</option>
                <option value="Emergency">Emergency</option>
              </select>
              {errors.priority && (
                <p className="text-red-500 text-sm">{errors.priority.message}</p>
              )}
                </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                STATUS *
                  </label>
              <select
                    {...register('status')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Scheduled">Scheduled</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="No Show">No Show</option>
              </select>
              {errors.status && (
                <p className="text-red-500 text-sm">{errors.status.message}</p>
              )}
            </div>

            {/* Reminder */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                REMINDER *
              </label>
              <select
                {...register('reminder')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="No Reminder">No Reminder</option>
                <option value="15 minutes before">15 minutes before</option>
                <option value="30 minutes before">30 minutes before</option>
                <option value="1 hour before">1 hour before</option>
                <option value="1 day before">1 day before</option>
                <option value="2 days before">2 days before</option>
              </select>
              {errors.reminder && (
                <p className="text-red-500 text-sm">{errors.reminder.message}</p>
              )}
            </div>
                </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              NOTES
                  </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional notes or comments..."
                  />
                </div>

          {/* Calendar */}
          {showCalendar && (
            <div className="calendar-container absolute top-20 left-6 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-20">
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                  <div className="relative dropdown-container">
                    <button
                      type="button"
                      onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                      className="px-3 py-1 hover:bg-gray-100 rounded"
                    >
                      {generateMonths()[currentMonth.getMonth()]}
                    </button>
                    {showMonthDropdown && (
                      <div className="absolute top-full left-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto scrollbar-hide z-20">
                        {generateMonths().map((month, index) => (
                          <button
                            key={month}
                            type="button"
                            onClick={() => {
                              setCurrentMonth(new Date(currentMonth.getFullYear(), index))
                              setShowMonthDropdown(false)
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-gray-100"
                          >
                            {month}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="relative dropdown-container">
                    <button
                      type="button"
                      onClick={() => setShowYearDropdown(!showYearDropdown)}
                      className="px-3 py-1 hover:bg-gray-100 rounded"
                    >
                      {currentMonth.getFullYear()}
                    </button>
                    {showYearDropdown && (
                      <div className="absolute top-full left-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto scrollbar-hide z-20">
                        {generateYears().map((year) => (
                          <button
                            key={year}
                            type="button"
                            onClick={() => {
                              setCurrentMonth(new Date(year, currentMonth.getMonth()))
                              setShowYearDropdown(false)
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-gray-100"
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
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
                {Array.from({ length: getFirstDayOfMonth(currentMonth) }, (_, i) => (
                  <div key={`empty-${i}`} className="p-2"></div>
                ))}
                {Array.from({ length: getDaysInMonth(currentMonth) }, (_, i) => {
                  const day = i + 1
                  const isSelected = isSelectedDate(day)
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => selectDate(day)}
                      className={cn(
                        "p-2 text-center text-sm rounded-full hover:bg-gray-100",
                        isSelected && "bg-blue-500 text-white hover:bg-blue-600"
                      )}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Time Dropdown */}
          {showTimeDropdown && (
            <div className="absolute top-32 left-6 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-20 max-h-60 overflow-y-auto scrollbar-hide">
              <div className="grid grid-cols-2 gap-2">
                {availableTimeSlots.map((timeSlot) => (
                  <button
                    key={timeSlot.value}
                    type="button"
                    onClick={() => {
                      setValue('appointmentTime', timeSlot.value)
                      setShowTimeDropdown(false)
                    }}
                    className="px-3 py-2 text-sm border border-gray-200 rounded hover:bg-gray-100"
                  >
                    {timeSlot.label}
                  </button>
                ))}
              </div>
            </div>
          )}

            {/* Form Actions */}
          <div className="flex gap-3 pt-6 border-t border-gray-200 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                {appointment ? 'Update Appointment' : 'Schedule Appointment'}
              </button>
            </div>
          </form>
      </div>
    </div>
  )
}