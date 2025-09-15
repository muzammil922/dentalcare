import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Trash2, DollarSign } from 'lucide-react'
import { Invoice } from '@/stores/useAppStore'
import { cn, formatCurrency, getCurrentKarachiTime } from '@/lib/utils'

const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price must be non-negative')
})

const invoiceSchema = z.object({
  patientName: z.string().min(1, 'Patient name is required'),
  patientPhone: z.string().min(1, 'Patient phone is required'),
  patientEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  date: z.string().min(1, 'Date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  status: z.enum(['pending', 'paid', 'overdue', 'cancelled']),
  paymentMethod: z.enum(['cash', 'credit_card', 'bank_transfer', 'insurance']).optional(),
  paymentDate: z.string().optional(),
  notes: z.string().optional(),
  taxRate: z.number().min(0).max(100).default(0),
  discount: z.number().min(0).default(0)
})

type InvoiceFormData = z.infer<typeof invoiceSchema>

interface InvoiceFormProps {
  invoice?: Invoice | null
  onSave: (data: Omit<Invoice, 'id' | 'invoiceNumber'>) => void
  onClose: () => void
}

export default function InvoiceForm({ invoice, onSave, onClose }: InvoiceFormProps) {
  const [showPaymentFields, setShowPaymentFields] = useState(false)
  
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
      patientName: invoice?.patientName || '',
      patientPhone: invoice?.patientPhone || '',
      patientEmail: invoice?.patientEmail || '',
      date: invoice?.date || getCurrentKarachiTime().toISOString().split('T')[0],
      dueDate: invoice?.dueDate || new Date(getCurrentKarachiTime().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: invoice?.items || [{ description: '', quantity: 1, unitPrice: 0 }],
      status: invoice?.status || 'pending',
      paymentMethod: invoice?.paymentMethod || undefined,
      paymentDate: invoice?.paymentDate || undefined,
      notes: invoice?.notes || '',
      taxRate: invoice?.taxRate || 0,
      discount: invoice?.discount || 0
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  })

  const watchedItems = watch('items')
  const watchedTaxRate = watch('taxRate')
  const watchedDiscount = watch('discount')

  // Calculate totals
  const subtotal = watchedItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  const taxAmount = (subtotal * watchedTaxRate) / 100
  const discountAmount = (subtotal * watchedDiscount) / 100
  const total = subtotal + taxAmount - discountAmount

  const onSubmit = (data: InvoiceFormData) => {
    // Capitalize patient name and item descriptions
    const processedData = {
      ...data,
      patientName: data.patientName.charAt(0).toUpperCase() + data.patientName.slice(1).toLowerCase(),
      items: data.items.map(item => ({
        ...item,
        description: item.description.charAt(0).toUpperCase() + item.description.slice(1).toLowerCase()
      }))
    }
    
    onSave({
      ...processedData,
      totalAmount: total
    })
    reset()
  }

  const addItem = () => {
    append({ description: '', quantity: 1, unitPrice: 0 })
  }

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index)
    }
  }

  const updateItemTotal = (index: number) => {
    const item = watchedItems[index]
    if (item && item.quantity && item.unitPrice) {
      const total = item.quantity * item.unitPrice
      // You can add additional logic here if needed
    }
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
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">
              {invoice ? 'Edit Invoice' : 'New Invoice'}
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
            {/* Patient Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Patient Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="form-group">
                  <label htmlFor="patientName" className="form-label">
                    Patient Name *
                  </label>
                  <input
                    {...register('patientName')}
                    type="text"
                    id="patientName"
                    className={cn('form-input', errors.patientName && 'border-red-500')}
                    placeholder="Enter patient name"
                  />
                  {errors.patientName && (
                    <span className="text-red-500 text-sm">{errors.patientName.message}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="patientPhone" className="form-label">
                    Phone Number *
                  </label>
                  <input
                    {...register('patientPhone')}
                    type="tel"
                    id="patientPhone"
                    className={cn('form-input', errors.patientPhone && 'border-red-500')}
                    placeholder="Enter phone number"
                  />
                  {errors.patientName && (
                    <span className="text-red-500 text-sm">{errors.patientPhone?.message}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="patientEmail" className="form-label">
                    Email Address
                  </label>
                  <input
                    {...register('patientEmail')}
                    type="email"
                    id="patientEmail"
                    className={cn('form-input', errors.patientEmail && 'border-red-500')}
                    placeholder="Enter email address"
                  />
                  {errors.patientEmail && (
                    <span className="text-red-500 text-sm">{errors.patientEmail.message}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Invoice Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="form-group">
                  <label htmlFor="date" className="form-label">
                    Invoice Date *
                  </label>
                  <input
                    {...register('date')}
                    type="date"
                    id="date"
                    className={cn('form-input', errors.date && 'border-red-500')}
                  />
                  {errors.date && (
                    <span className="text-red-500 text-sm">{errors.date.message}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="dueDate" className="form-label">
                    Due Date *
                  </label>
                  <input
                    {...register('dueDate')}
                    type="date"
                    id="dueDate"
                    className={cn('form-input', errors.dueDate && 'border-red-500')}
                  />
                  {errors.dueDate && (
                    <span className="text-red-500 text-sm">{errors.dueDate.message}</span>
                  )}
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
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Invoice Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Invoice Items</h3>
                <button
                  type="button"
                  onClick={addItem}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Item
                </button>
              </div>
              
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                    <div className="col-span-6">Description</div>
                    <div className="col-span-2">Quantity</div>
                    <div className="col-span-2">Unit Price</div>
                    <div className="col-span-1">Total</div>
                    <div className="col-span-1">Action</div>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {fields.map((field, index) => (
                    <div key={field.id} className="px-4 py-3">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-6">
                          <input
                            {...register(`items.${index}.description`)}
                            type="text"
                            className={cn('form-input', errors.items?.[index]?.description && 'border-red-500')}
                            placeholder="Item description"
                          />
                          {errors.items?.[index]?.description && (
                            <span className="text-red-500 text-xs">{errors.items[index]?.description?.message}</span>
                          )}
                        </div>
                        
                        <div className="col-span-2">
                          <input
                            {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                            type="number"
                            min="1"
                            className={cn('form-input', errors.items?.[index]?.quantity && 'border-red-500')}
                            onChange={() => updateItemTotal(index)}
                          />
                          {errors.items?.[index]?.quantity && (
                            <span className="text-red-500 text-xs">{errors.items[index]?.quantity?.message}</span>
                          )}
                        </div>
                        
                        <div className="col-span-2">
                          <input
                            {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                            type="number"
                            min="0"
                            step="0.01"
                            className={cn('form-input', errors.items?.[index]?.unitPrice && 'border-red-500')}
                            onChange={() => updateItemTotal(index)}
                          />
                          {errors.items?.[index]?.unitPrice && (
                            <span className="text-red-500 text-xs">{errors.items[index]?.unitPrice?.message}</span>
                          )}
                        </div>
                        
                        <div className="col-span-1 text-sm font-medium text-gray-800">
                          {formatCurrency((watchedItems[index]?.quantity || 0) * (watchedItems[index]?.unitPrice || 0))}
                        </div>
                        
                        <div className="col-span-1">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            disabled={fields.length === 1}
                            className="text-red-500 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {errors.items && (
                <span className="text-red-500 text-sm">{errors.items.message}</span>
              )}
            </div>

            {/* Totals */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Invoice Totals</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <label htmlFor="taxRate" className="text-gray-600 text-sm">Tax Rate (%):</label>
                    <input
                      {...register('taxRate', { valueAsNumber: true })}
                      type="number"
                      id="taxRate"
                      min="0"
                      max="100"
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax Amount:</span>
                    <span className="font-medium">{formatCurrency(taxAmount)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <label htmlFor="discount" className="text-gray-600 text-sm">Discount (%):</label>
                    <input
                      {...register('discount', { valueAsNumber: true })}
                      type="number"
                      id="discount"
                      min="0"
                      max="100"
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount Amount:</span>
                    <span className="font-medium">{formatCurrency(discountAmount)}</span>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between text-lg font-bold text-gray-800">
                      <span>Total:</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="form-group">
                    <label htmlFor="notes" className="form-label">
                      Notes
                    </label>
                    <textarea
                      {...register('notes')}
                      id="notes"
                      rows={4}
                      className="form-input"
                      placeholder="Enter any additional notes..."
                    />
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="showPaymentFields"
                      checked={showPaymentFields}
                      onChange={(e) => setShowPaymentFields(e.target.checked)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <label htmlFor="showPaymentFields" className="text-sm font-medium text-gray-700">
                      Mark as paid
                    </label>
                  </div>
                  
                  {showPaymentFields && (
                    <div className="space-y-3">
                      <div className="form-group">
                        <label htmlFor="paymentMethod" className="form-label">
                          Payment Method
                        </label>
                        <select
                          {...register('paymentMethod')}
                          id="paymentMethod"
                          className="form-input"
                        >
                          <option value="">Select payment method</option>
                          <option value="cash">Cash</option>
                          <option value="credit_card">Credit Card</option>
                          <option value="bank_transfer">Bank Transfer</option>
                          <option value="insurance">Insurance</option>
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="paymentDate" className="form-label">
                          Payment Date
                        </label>
                        <input
                          {...register('paymentDate')}
                          type="date"
                          id="paymentDate"
                          className="form-input"
                        />
                      </div>
                    </div>
                  )}
                </div>
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
                {invoice ? 'Update Invoice' : 'Create Invoice'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
