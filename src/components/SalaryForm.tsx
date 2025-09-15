import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { X, DollarSign, Calendar, Calculator, Users, Clock, CheckCircle } from 'lucide-react'
import { Salary, Staff } from '@/stores/useAppStore'
import { cn, getCurrentKarachiTime } from '@/lib/utils'
import { useState, useEffect } from 'react'

const salarySchema = z.object({
  staffId: z.string().min(1, 'Staff member is required'),
  month: z.string().min(1, 'Month is required'),
  year: z.number().min(2000, 'Year must be 2000 or later'),
  paymentDate: z.string().min(1, 'Payment date is required'),
  department: z.string().min(1, 'Department is required'),
  baseSalary: z.number().min(0, 'Base salary must be non-negative'),
  allowances: z.number().min(0, 'Allowances must be non-negative').default(0),
  overtime: z.number().min(0, 'Overtime must be non-negative').default(0),
  bonus: z.number().min(0, 'Bonus must be non-negative').default(0),
  // Attendance data
  presentDays: z.number().min(0).default(0),
  absentDays: z.number().min(0).default(0),
  leaveDays: z.number().min(0).default(0),
  lateDays: z.number().min(0).default(0),
  halfDays: z.number().min(0).default(0),
  workingDays: z.number().min(0).default(0),
  notes: z.string().optional()
})

type SalaryFormData = z.infer<typeof salarySchema>

interface SalaryFormProps {
  salary?: Salary | null
  staffMembers: Array<{ id: string; name: string; salary?: number; gender?: string }>
  existingSalaries: Salary[]
  onSave: (data: Omit<Salary, 'id'>) => void
  onClose: () => void
}

export default function SalaryForm({ salary, staffMembers, existingSalaries, onSave, onClose }: SalaryFormProps) {
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [attendanceData, setAttendanceData] = useState({
    presentDays: 0,
    absentDays: 0,
    leaveDays: 0,
    lateDays: 0,
    halfDays: 0,
    workingDays: 0
  })

  // Function to check if salary already exists for this staff member and month/year
  const checkDuplicateSalary = (staffId: string, month: string, year: number) => {
    return existingSalaries.some(existingSalary => 
      existingSalary.staffId === staffId && 
      existingSalary.month === month && 
      existingSalary.year === year &&
      existingSalary.id !== salary?.id // Allow editing existing salary
    )
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue
  } = useForm<SalaryFormData>({
    resolver: zodResolver(salarySchema),
    defaultValues: {
      staffId: salary?.staffId || '',
      month: salary?.month || getCurrentKarachiTime().toLocaleDateString('en-US', { month: 'long', timeZone: 'Asia/Karachi' }),
      year: salary?.year || getCurrentKarachiTime().getFullYear(),
            paymentDate: salary?.paymentDate || getCurrentKarachiTime().toISOString().split('T')[0],
            department: salary?.department || 'Staff',
      baseSalary: salary?.baseSalary || 0,
      allowances: salary?.allowances || 0,
      overtime: salary?.overtime || 0,
      bonus: salary?.bonus || 0,
            presentDays: salary?.presentDays || 0,
            absentDays: salary?.absentDays || 0,
            leaveDays: salary?.leaveDays || 0,
            lateDays: salary?.lateDays || 0,
            halfDays: salary?.halfDays || 0,
            workingDays: salary?.workingDays || 0,
      notes: salary?.notes || ''
    }
  })

  const watchedStaffId = watch('staffId')
  const watchedBaseSalary = watch('baseSalary')
  const watchedAllowances = watch('allowances')
  const watchedOvertime = watch('overtime')
  const watchedBonus = watch('bonus')
  const watchedPresentDays = watch('presentDays')
  const watchedAbsentDays = watch('absentDays')
  const watchedLeaveDays = watch('leaveDays')
  const watchedLateDays = watch('lateDays')
  const watchedHalfDays = watch('halfDays')
  const watchedWorkingDays = watch('workingDays')

  // Auto-pick attendance and salary when staff is selected
  useEffect(() => {
    if (watchedStaffId) {
      const staffMember = staffMembers.find(s => s.id === watchedStaffId)
      
      if (staffMember) {
        // Auto-pick staff salary
        if (staffMember.salary) {
          setValue('baseSalary', staffMember.salary)
        }
        
        // Simulate auto-picking attendance data
        const mockAttendance = {
          presentDays: Math.floor(Math.random() * 20) + 15, // 15-35 days
          absentDays: Math.floor(Math.random() * 5), // 0-5 days
          leaveDays: Math.floor(Math.random() * 3), // 0-3 days
          lateDays: Math.floor(Math.random() * 8), // 0-8 days
          halfDays: Math.floor(Math.random() * 4), // 0-4 days
          workingDays: 30 // Assuming 30 working days in a month
        }
        
        setAttendanceData(mockAttendance)
        setValue('presentDays', mockAttendance.presentDays)
        setValue('absentDays', mockAttendance.absentDays)
        setValue('leaveDays', mockAttendance.leaveDays)
        setValue('lateDays', mockAttendance.lateDays)
        setValue('halfDays', mockAttendance.halfDays)
        setValue('workingDays', mockAttendance.workingDays)
      }
    }
  }, [watchedStaffId, setValue, staffMembers])

  // Calculate deductions based on attendance
  const calculateDeductions = () => {
    const baseSalary = watchedBaseSalary || 0
    const dailySalary = baseSalary / watchedWorkingDays
    
    // Deduction rates (can be configured in settings)
    const absentDeduction = dailySalary * watchedAbsentDays
    const lateDeduction = (dailySalary * 0.1) * watchedLateDays // 10% of daily salary for each late day
    const halfDayDeduction = (dailySalary * 0.5) * watchedHalfDays // 50% of daily salary for each half day
    
    return absentDeduction + lateDeduction + halfDayDeduction
  }

  // Calculate overtime based on attendance
  const calculateOvertime = () => {
    const baseSalary = watchedBaseSalary || 0
    const dailySalary = baseSalary / watchedWorkingDays
    
    // Overtime calculation: if present days > working days, pay extra
    const extraDays = Math.max(0, watchedPresentDays - watchedWorkingDays)
    const overtimeAmount = dailySalary * extraDays * 1.5 // 1.5x rate for overtime
    
    return overtimeAmount
  }

  // Calculate totals
  const attendanceDeductions = calculateDeductions()
  const autoOvertime = calculateOvertime()
  const grossSalary = watchedBaseSalary + watchedAllowances + autoOvertime + watchedBonus
  const netSalary = grossSalary - attendanceDeductions

  const onSubmit = (data: SalaryFormData) => {
    // Check for duplicate salary
    if (checkDuplicateSalary(data.staffId, data.month, data.year)) {
      setError('month', {
        type: 'manual',
        message: 'Salary record already exists for this staff member in this month/year'
      })
      return
    }

    onSave({
      ...data,
      grossSalary,
      netSalary,
      totalSalary: netSalary,
      // Include all attendance data
      presentDays: data.presentDays,
      absentDays: data.absentDays,
      leaveDays: data.leaveDays,
      lateDays: data.lateDays,
      halfDays: data.halfDays,
      workingDays: data.workingDays,
      notes: data.notes
    })
    reset()
    onClose()
  }

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const currentYear = getCurrentKarachiTime().getFullYear()
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i)

  return (
    <AnimatePresence>
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-md flex items-center justify-center z-[9999] p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto hide-scrollbar"
              style={{
                scrollbarWidth: 'none', /* Firefox */
                msOverflowStyle: 'none', /* Internet Explorer 10+ */
              }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">
              {salary ? 'Edit Salary Record' : 'Add Salary Record'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Basic Information - Top Row */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Basic Information
              </h3>
              
              <div className="grid grid-cols-4 gap-4">
                <div className="form-group">
                  <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-2">
                    Salary Month
                  </label>
                  <select
                    {...register('month')}
                    id="month"
                    className={cn('w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500', errors.month && 'border-red-500')}
                  >
                    {months.map((month) => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                  {errors.month && (
                    <span className="text-red-500 text-sm">{errors.month.message}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                    Year
                  </label>
                  <select
                    {...register('year', { valueAsNumber: true })}
                    id="year"
                    className={cn('w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500', errors.year && 'border-red-500')}
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  {errors.year && (
                    <span className="text-red-500 text-sm">{errors.year.message}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Date
                  </label>
                  <div className="relative">
                    <input
                      {...register('paymentDate')}
                      type="date"
                      id="paymentDate"
                      className={cn('w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500', errors.paymentDate && 'border-red-500')}
                    />
                    <Calendar className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
                  </div>
                  {errors.paymentDate && (
                    <span className="text-red-500 text-sm">{errors.paymentDate.message}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <select
                    {...register('department')}
                    id="department"
                    className={cn('w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500', errors.department && 'border-red-500')}
                  >
                    <option value="Staff">Staff</option>
                    <option value="Medical">Medical</option>
                    <option value="Administration">Administration</option>
                    <option value="Support">Support</option>
                  </select>
                  {errors.department && (
                    <span className="text-red-500 text-sm">{errors.department.message}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Staff Member - Middle Row */}
            <div className="form-group">
              <label htmlFor="staffId" className="block text-sm font-medium text-gray-700 mb-2">
                Staff Member
              </label>
              <select
                {...register('staffId')}
                id="staffId"
                className={cn('w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500', errors.staffId && 'border-red-500')}
              >
                <option value="">Select a staff member</option>
                {staffMembers.map((staff) => (
                  <option key={staff.id} value={staff.id}>{staff.name}</option>
                ))}
              </select>
              {errors.staffId && (
                <span className="text-red-500 text-sm">{errors.staffId.message}</span>
              )}
            </div>

            {/* Gender - Bottom Row */}
            <div className="form-group">
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <input
                type="text"
                id="gender"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                placeholder="Auto-detected from staff data"
                readOnly
              />
            </div>

            {/* Attendance Section */}
            {watchedStaffId && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Attendance Summary (Auto-picked)
                </h3>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Present Days</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">{watchedPresentDays}</div>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2 mb-2">
                      <X className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium text-red-800">Absent Days</span>
                    </div>
                    <div className="text-2xl font-bold text-red-600">{watchedAbsentDays}</div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Leave Days</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">{watchedLeaveDays}</div>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">Late Days</span>
                    </div>
                    <div className="text-2xl font-bold text-yellow-600">{watchedLateDays}</div>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-800">Half Days</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-600">{watchedHalfDays}</div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-800">Working Days</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-600">{watchedWorkingDays}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Allowances Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Allowances & Bonuses
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="allowances" className="block text-sm font-medium text-gray-700 mb-2">
                    Total Allowances
                  </label>
                  <input
                    {...register('allowances', { valueAsNumber: true })}
                    type="number"
                    id="allowances"
                    min="0"
                    step="100"
                    className={cn('w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500', errors.allowances && 'border-red-500')}
                    placeholder="Enter allowances"
                  />
                  {errors.allowances && (
                    <span className="text-red-500 text-sm">{errors.allowances.message}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="bonus" className="block text-sm font-medium text-gray-700 mb-2">
                    Bonus
                  </label>
                  <input
                    {...register('bonus', { valueAsNumber: true })}
                    type="number"
                    id="bonus"
                    min="0"
                    step="100"
                    className={cn('w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500', errors.bonus && 'border-red-500')}
                    placeholder="Enter bonus amount"
                  />
                  {errors.bonus && (
                    <span className="text-red-500 text-sm">{errors.bonus.message}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                  <label htmlFor="overtime" className="block text-sm font-medium text-gray-700 mb-2">
                    Overtime Pay
                </label>
                <input
                    {...register('overtime', { valueAsNumber: true })}
                  type="number"
                    id="overtime"
                  min="0"
                  step="100"
                    className={cn('w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500', errors.overtime && 'border-red-500')}
                    placeholder="Enter overtime pay"
                />
                  {errors.overtime && (
                    <span className="text-red-500 text-sm">{errors.overtime.message}</span>
                )}
                </div>

              </div>
            </div>

            {/* Base Salary */}
              <div className="form-group">
              <label htmlFor="baseSalary" className="block text-sm font-medium text-gray-700 mb-2">
                Base Salary
                </label>
                <input
                {...register('baseSalary', { valueAsNumber: true })}
                  type="number"
                id="baseSalary"
                  min="0"
                  step="100"
                className={cn('w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500', errors.baseSalary && 'border-red-500')}
                placeholder="Enter base salary"
                />
              {errors.baseSalary && (
                <span className="text-red-500 text-sm">{errors.baseSalary.message}</span>
                )}
              </div>

            {/* Calculate Salary Button */}
            <div className="flex justify-center">
              <button
                type="button"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                onClick={() => {
                  // Auto-calculate overtime
                  setValue('overtime', autoOvertime)
                }}
              >
                <Calculator className="w-4 h-4" />
                Calculate Salary
              </button>
            </div>

            {/* Salary Summary */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Salary Calculation
              </h3>
              
              <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex justify-between items-center p-3 bg-white rounded-md">
                  <span className="text-gray-600">Base Salary:</span>
                    <span className="font-medium">Rs. {Math.round(watchedBaseSalary).toLocaleString()}</span>
                </div>
                
                  <div className="flex justify-between items-center p-3 bg-white rounded-md">
                  <span className="text-gray-600">Allowances:</span>
                    <span className="font-medium text-green-600">Rs. {Math.round(watchedAllowances).toLocaleString()}</span>
                </div>
                
                  <div className="flex justify-between items-center p-3 bg-white rounded-md">
                    <span className="text-gray-600">Overtime (Auto):</span>
                    <span className="font-medium text-green-600">Rs. {Math.round(autoOvertime).toLocaleString()}</span>
                </div>
                
                  <div className="flex justify-between items-center p-3 bg-white rounded-md">
                  <span className="text-gray-600">Bonus:</span>
                    <span className="font-medium text-green-600">Rs. {Math.round(watchedBonus).toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-md">
                    <span className="text-gray-800 font-medium">Gross Salary:</span>
                    <span className="font-bold text-gray-800">Rs. {Math.round(grossSalary).toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-white rounded-md">
                  <span className="text-gray-600">Attendance Deductions:</span>
                  <span className="font-medium text-red-600">Rs. {Math.round(attendanceDeductions).toLocaleString()}</span>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-md border-2 border-green-200">
                    <span className="text-green-800 font-bold text-lg">Net Salary:</span>
                    <span className="font-bold text-lg text-green-600">Rs. {Math.round(netSalary).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="form-group">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                {...register('notes')}
                id="notes"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter any additional notes or comments about this salary record..."
              />
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {salary ? 'Update Salary Record' : 'Add Salary Record'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
