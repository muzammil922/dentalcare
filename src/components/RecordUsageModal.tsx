import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { InventoryItem } from '@/stores/useAppStore'

const recordUsageSchema = z.object({
  itemId: z.string().min(1, 'Please select an item'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  reason: z.string().optional(),
  notes: z.string().optional()
})

type RecordUsageFormData = z.infer<typeof recordUsageSchema>

interface RecordUsageModalProps {
  isOpen: boolean
  onClose: () => void
  onRecordUsage: (data: RecordUsageFormData) => void
  inventory: InventoryItem[]
  usageRecords: any[]
}

export default function RecordUsageModal({ isOpen, onClose, onRecordUsage, inventory, usageRecords }: RecordUsageModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<RecordUsageFormData>({
    resolver: zodResolver(recordUsageSchema),
    defaultValues: {
      itemId: '',
      quantity: 1,
      reason: '',
      notes: ''
    }
  })

  // Calculate remaining quantity for each item based on usage records
  const getRemainingQuantity = (itemId: string, totalQuantity: number) => {
    const totalUsed = usageRecords
      .filter(record => record.itemId === itemId)
      .reduce((sum, record) => sum + record.quantity, 0)
    return Math.max(0, totalQuantity - totalUsed)
  }

  const onSubmit = (data: RecordUsageFormData) => {
    onRecordUsage(data)
    reset()
    onClose()
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[10000] p-5"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl"
          style={{ maxWidth: '500px', width: '95%' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="modal-header flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 m-0">Record Usage</h3>
            <button
              onClick={handleClose}
              className="close bg-blue-600 hover:bg-blue-700 text-white hover:text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
            >
              ×
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <div style={{ padding: '1.5rem' }}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label htmlFor="usage-item-select" style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#374151', 
                  marginBottom: '8px' 
                }}>
                  Select Item *
                </label>
                <select
                  id="usage-item-select"
                  {...register('itemId')}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    background: 'white',
                    color: '#374151',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'border-color 0.2s ease-in-out'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                >
                  <option value="">Choose an item</option>
                  {inventory.map((item) => {
                    const remaining = getRemainingQuantity(item.id, item.quantity)
                    return (
                      <option key={item.id} value={item.id}>
                        {item.name} ({remaining} {item.unit} remaining)
                      </option>
                    )
                  })}
                </select>
                {errors.itemId && (
                  <span style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px', display: 'block' }}>
                    {errors.itemId.message}
                  </span>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label htmlFor="usage-quantity-input" style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#374151', 
                  marginBottom: '8px' 
                }}>
                  Quantity Used *
                </label>
                <input
                  type="number"
                  id="usage-quantity-input"
                  {...register('quantity', { valueAsNumber: true })}
                  min="1"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    background: 'white',
                    color: '#374151',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'border-color 0.2s ease-in-out'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
                {errors.quantity && (
                  <span style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px', display: 'block' }}>
                    {errors.quantity.message}
                  </span>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label htmlFor="usage-reason-select" style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#374151', 
                  marginBottom: '8px' 
                }}>
                  Reason
                </label>
                <select
                  id="usage-reason-select"
                  {...register('reason')}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    background: 'white',
                    color: '#374151',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'border-color 0.2s ease-in-out'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                >
                  <option value="">Select reason</option>
                  <option value="patient-treatment">Patient Treatment</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="expired">Expired</option>
                  <option value="damaged">Damaged</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label htmlFor="usage-notes-input" style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#374151', 
                  marginBottom: '8px' 
                }}>
                  Notes
                </label>
                <textarea
                  id="usage-notes-input"
                  {...register('notes')}
                  rows={3}
                  placeholder="Additional notes..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    background: 'white',
                    color: '#374151',
                    fontSize: '0.875rem',
                    resize: 'vertical',
                    outline: 'none',
                    transition: 'border-color 0.2s ease-in-out'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="form-actions" style={{ 
              padding: '1rem 1.5rem', 
              borderTop: '1px solid #e5e7eb', 
              display: 'flex', 
              gap: '1rem', 
              justifyContent: 'flex-end' 
            }}>
              <button
                type="button"
                onClick={handleClose}
                className="btn btn-secondary px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Record Usage
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
