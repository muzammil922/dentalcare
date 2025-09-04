import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { X, DollarSign, Calendar, Calculator } from 'lucide-react'
import { Salary } from '@/stores/useAppStore'
import { cn } from '@/lib/utils'

const salarySchema = z.object({
  staffId: z.string().min(1, 'Staff member is required'),
  month: z.string().min(1, 'Month is required'),
  year: z.number().min(2000, 'Year must be 2000 or later'),
  baseSalary: z.number().min(0, 'Base salary must be non-negative'),
  allowances: z.number().min(0, 'Allowances must be non-negative').default(0),
  deductions: z.number().min(0, 'Deductions must be non-negative').default(0),
  overtime: z.number().min(0, 'Overtime must be non-negative').default(0),
  bonus: z.number().min(0, 'Bonus must be non-negative').default(0),
  notes: z.string().optional()
})

type SalaryFormData = z.infer<typeof salarySchema>

interface SalaryFormProps {
  salary?: Salary | null
  staffMembers: Array<{ id: string; name: string }>
  onSave: (data: Omit<Salary, 'id'>) => void
  onClose: () => void
}

export default function SalaryForm({ salary, staffMembers, onSave, onClose }: SalaryFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm<SalaryFormData>({
    resolver: zodResolver(salarySchema),
    defaultValues: {
      staffId: salary?.staffId || '',
      month: salary?.month || new Date().toLocaleDateString('en-US', { month: 'long' }),
      year: salary?.year || new Date().getFullYear(),
      baseSalary: salary?.baseSalary || 0,
      allowances: salary?.allowances || 0,
      deductions: salary?.deductions || 0,
      overtime: salary?.overtime || 0,
      bonus: salary?.bonus || 0,
      notes: salary?.notes || ''
    }
  })

  const watchedBaseSalary = watch('baseSalary')
  const watchedAllowances = watch('allowances')
  const watchedDeductions = watch('deductions')
  const watchedOvertime = watch('overtime')
  const watchedBonus = watch('bonus')

  // Calculate totals
  const grossSalary = watchedBaseSalary + watchedAllowances + watchedOvertime + watchedBonus
  const netSalary = grossSalary - watchedDeductions

  const onSubmit = (data: SalaryFormData) => {
    onSave({
      ...data,
      grossSalary,
      netSalary
    })
    reset()
  }

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i)

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
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
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
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="form-group">
                  <label htmlFor="staffId" className="form-label">
                    Staff Member *
                  </label>
                  <select
                    {...register('staffId')}
                    id="staffId"
                    className={cn('form-input', errors.staffId && 'border-red-500')}
                  >
                    <option value="">Select staff member</option>
                    {staffMembers.map((staff) => (
                      <option key={staff.id} value={staff.id}>{staff.name}</option>
                    ))}
                  </select>
                  {errors.staffId && (
                    <span className="text-red-500 text-sm">{errors.staffId.message}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="month" className="form-label">
                    Month *
                  </label>
                  <select
                    {...register('month')}
                    id="month"
                    className={cn('form-input', errors.month && 'border-red-500')}
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
                  <label htmlFor="year" className="form-label">
                    Year *
                  </label>
                  <select
                    {...register('year', { valueAsNumber: true })}
                    id="year"
                    className={cn('form-input', errors.year && 'border-red-500')}
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  {errors.year && (
                    <span className="text-red-500 text-sm">{errors.year.message}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Salary Components */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Salary Components
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="baseSalary" className="form-label">
                    Base Salary *
                  </label>
                  <input
                    {...register('baseSalary', { valueAsNumber: true })}
                    type="number"
                    id="baseSalary"
                    min="0"
                    step="100"
                    className={cn('form-input', errors.baseSalary && 'border-red-500')}
                    placeholder="Enter base salary"
                  />
                  {errors.baseSalary && (
                    <span className="text-red-500 text-sm">{errors.baseSalary.message}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="allowances" className="form-label">
                    Allowances
                  </label>
                  <input
                    {...register('allowances', { valueAsNumber: true })}
                    type="number"
                    id="allowances"
                    min="0"
                    step="100"
                    className={cn('form-input', errors.allowances && 'border-red-500')}
                    placeholder="Enter allowances"
                  />
                  {errors.allowances && (
                    <span className="text-red-500 text-sm">{errors.allowances.message}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="overtime" className="form-label">
                    Overtime Pay
                  </label>
                  <input
                    {...register('overtime', { valueAsNumber: true })}
                    type="number"
                    id="overtime"
                    min="0"
                    step="100"
                    className={cn('form-input', errors.overtime && 'border-red-500')}
                    placeholder="Enter overtime pay"
                  />
                  {errors.overtime && (
                    <span className="text-red-500 text-sm">{errors.overtime.message}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="bonus" className="form-label">
                    Bonus
                  </label>
                  <input
                    {...register('bonus', { valueAsNumber: true })}
                    type="number"
                    id="bonus"
                    min="0"
                    step="100"
                    className={cn('form-input', errors.bonus && 'border-red-500')}
                    placeholder="Enter bonus amount"
                  />
                  {errors.bonus && (
                    <span className="text-red-500 text-sm">{errors.bonus.message}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="deductions" className="form-label">
                  Deductions
                </label>
                <input
                  {...register('deductions', { valueAsNumber: true })}
                  type="number"
                  id="deductions"
                  min="0"
                  step="100"
                  className={cn('form-input', errors.deductions && 'border-red-500')}
                  placeholder="Enter deductions (tax, insurance, etc.)"
                />
                {errors.deductions && (
                  <span className="text-red-500 text-sm">{errors.deductions.message}</span>
                )}
              </div>
            </div>

            {/* Salary Summary */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Salary Summary
              </h3>
              
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Base Salary:</span>
                  <span className="font-medium">{watchedBaseSalary.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Allowances:</span>
                  <span className="font-medium text-green-600">+{watchedAllowances.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Overtime:</span>
                  <span className="font-medium text-green-600">+{watchedOvertime.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Bonus:</span>
                  <span className="font-medium text-green-600">+{watchedBonus.toLocaleString()}</span>
                </div>
                
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-800 font-medium">Gross Salary:</span>
                    <span className="font-bold text-gray-800">{grossSalary.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Deductions:</span>
                  <span className="font-medium text-red-600">-{watchedDeductions.toLocaleString()}</span>
                </div>
                
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-800 font-bold text-lg">Net Salary:</span>
                    <span className="font-bold text-lg text-primary-600">{netSalary.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="form-group">
              <label htmlFor="notes" className="form-label">
                Notes
              </label>
              <textarea
                {...register('notes')}
                id="notes"
                rows={3}
                className="form-input"
                placeholder="Enter any additional notes or comments about this salary record..."
              />
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
                {salary ? 'Update Salary Record' : 'Add Salary Record'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
