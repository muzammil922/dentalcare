import React, { useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, User, Phone, Mail, MapPin, FileText, Calendar } from 'lucide-react'
import { Patient } from '@/stores/useAppStore'
import { cn } from '@/lib/utils'

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

  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
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
      addDate: new Date().toISOString().split('T')[0], // Today's date
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
      addDate: new Date().toISOString().split('T')[0], // Today's date
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
    
    const today = new Date()
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
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4"
      >
        <motion.div
          ref={modalRef}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <h3 className="text-2xl font-bold text-gray-800">{patient ? 'Update Patient' : 'Add New Patient'}</h3>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Left Column */}
              <div className="space-y-3">
                <div className="form-group">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    FULL NAME <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('name')}
                    type="text"
                    id="name"
                    className={cn(
                      'w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200',
                      errors.name && 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                    )}
                    placeholder="Enter patient's full name"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    EMAIL
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    id="email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
                    placeholder="Enter email address"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
                    DATE OF BIRTH <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                  <input
                      {...register('dateOfBirth')}
                      type="date"
                      id="dateOfBirth"
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
                      placeholder="mm/dd/yyyy"
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                    GENDER <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('gender')}
                    id="gender"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
                    AGE 
                  </label>
                  <input
                    {...register('age', { valueAsNumber: true })}
                    type="number"
                    id="age"
                    readOnly
                    className={cn(
                      'w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 bg-gray-50 cursor-not-allowed',
                      errors.age && 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                    )}
                   
                  />
                  <p className="text-gray-500 text-xs mt-1"></p>
                  {errors.age && (
                    <p className="text-red-500 text-sm mt-1">{errors.age.message}</p>
                  )}
                </div>
              </div>

              {/* Middle Column */}
              <div className="space-y-3">
                <div className="form-group">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    PHONE NUMBER <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('phone')}
                    type="tel"
                    id="phone"
                    className={cn(
                      'w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200',
                      errors.phone && 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                    )}
                    placeholder="Enter phone number"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                  )}
              </div>

                <div className="form-group">
                  <label htmlFor="addDate" className="block text-sm font-medium text-gray-700 mb-2">
                    ADD DATE <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                  <input
                      {...register('addDate')}
                      type="date"
                      id="addDate"
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
                      defaultValue={new Date().toISOString().split('T')[0]}
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    ADDRESS
                  </label>
                  <input
                    {...register('address')}
                    type="text"
                    id="address"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
                    placeholder="Enter address"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                    STATUS
                  </label>
                  <input
                    {...register('status')}
                    type="text"
                    id="status"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
                    placeholder="Active"
                    defaultValue="Active"
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className="form-group">
                  <label htmlFor="medicalHistory" className="block text-sm font-medium text-gray-700 mb-2">
                    MEDICAL HISTORY
                  </label>
                  <textarea
                    {...register('medicalHistory')}
                    id="medicalHistory"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 resize-none"
                    placeholder="Enter medical history"
                    rows={8}
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-4 mt-6 pt-5 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200 mr-0"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-primary-500 text-white border border-primary-500 rounded-lg font-medium hover:bg-primary-600 transition-all duration-200 flex items-center gap-2"
              >
                {isSubmitting ? 'Saving...' : patient ? 'Update Patient' : 'Save Patient'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
