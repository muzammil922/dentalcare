import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Phone, Mail, Calendar, MapPin } from 'lucide-react'
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
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
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
              className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors duration-200"
            >
              <X className="w-6 h-6" />
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
                  <input
                    {...register('joinDate')}
                    type="date"
                    id="joinDate"
                    className={cn('form-input', errors.joinDate && 'border-red-500')}
                  />
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
                className="btn btn-secondary mr-0"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
              >
                {staff ? 'Update Staff Member' : 'Add Staff Member'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
