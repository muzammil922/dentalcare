import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Clock, User } from 'lucide-react'
import { Appointment, Patient } from '@/stores/useAppStore'
import { cn } from '@/lib/utils'

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
  onSave: (data: Omit<Appointment, 'id'>) => void
  onClose: () => void
}

export default function AppointmentForm({ appointment, patients, onSave, onClose }: AppointmentFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patient: appointment?.patientName || '',
      appointmentDate: appointment?.date || '09/02/2025',
      appointmentTime: appointment?.time || '10:00 AM',
      duration: appointment?.duration ? `${appointment.duration} hour` : '1 hour',
      treatmentType: appointment?.type || 'Consultation',
      status: appointment?.status || 'Scheduled',
      priority: appointment?.priority || 'Normal',
      reminder: 'No Reminder',
      notes: appointment?.notes || ''
    }
  })

  const onSubmit = (data: AppointmentFormData) => {
    // Find the selected patient to get their details
    const selectedPatient = patients.find(p => p.name === data.patient)
    
    // Convert form data to appointment format
    const appointmentData = {
      patientId: selectedPatient?.id || '',
      patientName: data.patient.charAt(0).toUpperCase() + data.patient.slice(1).toLowerCase(),
      patientGender: selectedPatient?.gender || 'male',
      type: data.treatmentType.charAt(0).toUpperCase() + data.treatmentType.slice(1).toLowerCase(),
      date: data.appointmentDate,
      time: data.appointmentTime,
      status: data.status.toLowerCase() as 'scheduled' | 'confirmed' | 'completed' | 'cancelled',
      priority: data.priority.toLowerCase() as 'normal' | 'high' | 'urgent',
      notes: data.notes || '',
      createdAt: new Date().toISOString()
    }
    
    onSave(appointmentData)
    reset()
  }

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
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">
              {appointment ? 'Update Appointment' : 'Schedule New Appointment'}
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6">
            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* PATIENT */}
                <div className="form-group">
                  <label htmlFor="patient" className="block text-sm font-semibold text-gray-700 mb-2">
                    PATIENT *
                  </label>
                  <select
                    {...register('patient')}
                    id="patient"
                    className={cn(
                      'w-full px-4 py-3 border-2 border-blue-500 rounded-lg text-gray-900 focus:outline-none focus:border-blue-600 transition-colors',
                      errors.patient && 'border-red-500'
                    )}
                  >
                    <option value="">Select Patient</option>
                    {patients
                      .filter(patient => patient.status === 'active')
                      .map(patient => (
                        <option key={patient.id} value={patient.name}>
                          {patient.name} - {patient.phone}
                        </option>
                      ))
                    }
                  </select>
                  {errors.patient && (
                    <span className="text-red-500 text-sm mt-1">{errors.patient.message}</span>
                  )}
                </div>

                {/* APPOINTMENT DATE */}
                <div className="form-group">
                  <label htmlFor="appointmentDate" className="block text-sm font-semibold text-gray-700 mb-2">
                    APPOINTMENT DATE *
                  </label>
                  <div className="relative">
                    <input
                      {...register('appointmentDate')}
                      type="text"
                      id="appointmentDate"
                      className={cn(
                        'w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 transition-colors',
                        errors.appointmentDate && 'border-red-500'
                      )}
                      placeholder="09/02/2025"
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                  {errors.appointmentDate && (
                    <span className="text-red-500 text-sm mt-1">{errors.appointmentDate.message}</span>
                  )}
                </div>

                {/* APPOINTMENT TIME */}
                <div className="form-group">
                  <label htmlFor="appointmentTime" className="block text-sm font-semibold text-gray-700 mb-2">
                    APPOINTMENT TIME *
                  </label>
                  <div className="relative">
                    <input
                      {...register('appointmentTime')}
                      type="text"
                      id="appointmentTime"
                      className={cn(
                        'w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 transition-colors',
                        errors.appointmentTime && 'border-red-500'
                      )}
                      placeholder="10:00 AM"
                    />
                    <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                  {errors.appointmentTime && (
                    <span className="text-red-500 text-sm mt-1">{errors.appointmentTime.message}</span>
                  )}
                </div>

                {/* DURATION */}
                <div className="form-group">
                  <label htmlFor="duration" className="block text-sm font-semibold text-gray-700 mb-2">
                    DURATION
                  </label>
                  <input
                    {...register('duration')}
                    type="text"
                    id="duration"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="1 hour"
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* TREATMENT TYPE */}
                <div className="form-group">
                  <label htmlFor="treatmentType" className="block text-sm font-semibold text-gray-700 mb-2">
                    TREATMENT TYPE
                  </label>
                  <input
                    {...register('treatmentType')}
                    type="text"
                    id="treatmentType"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Consultation"
                  />
                </div>

                {/* STATUS */}
                <div className="form-group">
                  <label htmlFor="status" className="block text-sm font-semibold text-gray-700 mb-2">
                    STATUS
                  </label>
                  <input
                    {...register('status')}
                    type="text"
                    id="status"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Scheduled"
                  />
                </div>

                {/* PRIORITY */}
                <div className="form-group">
                  <label htmlFor="priority" className="block text-sm font-semibold text-gray-700 mb-2">
                    PRIORITY
                  </label>
                  <input
                    {...register('priority')}
                    type="text"
                    id="priority"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Normal"
                  />
                </div>

                {/* REMINDER */}
                <div className="form-group">
                  <label htmlFor="reminder" className="block text-sm font-semibold text-gray-700 mb-2">
                    REMINDER
                  </label>
                  <input
                    {...register('reminder')}
                    type="text"
                    id="reminder"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="No Reminder"
                  />
                </div>
              </div>
            </div>

            {/* APPOINTMENT NOTES - Large Text Area */}
            <div className="mt-8">
              <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-2">
                APPOINTMENT NOTES
              </label>
              <textarea
                {...register('notes')}
                id="notes"
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                placeholder="Enter any special instructions, patient concerns, or additional notes..."
              />
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 justify-end pt-6 border-t border-gray-200 mt-8">
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
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
