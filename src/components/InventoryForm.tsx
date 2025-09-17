import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { InventoryItem } from '@/stores/useAppStore'

const inventorySchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  unit: z.string().optional(),
  quantity: z.number().min(0, 'Quantity must be non-negative'),
  price: z.number().min(0, 'Price must be non-negative'),
  totalValue: z.number().min(0, 'Total value must be non-negative'),
  minStock: z.number().min(0, 'Minimum stock must be non-negative').optional(),
  supplier: z.string().optional(),
  location: z.string().optional(),
  expiryDate: z.string().optional(),
  status: z.enum(['In Stock', 'Low Stock', 'Out of Stock', 'Discontinued']),
  notes: z.string().optional()
})

type InventoryFormData = z.infer<typeof inventorySchema>

interface InventoryFormProps {
  item?: InventoryItem | null
  onSave: (data: Omit<InventoryItem, 'id'>) => void
  onClose: () => void
}

export default function InventoryForm({ item, onSave, onClose }: InventoryFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      name: item?.name || '',
      category: item?.category || '',
      description: item?.notes || '',
      unit: item?.unit || '',
      quantity: item?.quantity || 0,
      price: item?.price || 0,
      totalValue: (item?.quantity || 0) * (item?.price || 0),
      minStock: item?.minQuantity || 0,
      supplier: item?.vendor || '',
      location: '',
      expiryDate: item?.expiryDate || '',
      status: item?.status === 'in-stock' ? 'In Stock' : 
              item?.status === 'low-stock' ? 'Low Stock' : 
              item?.status === 'out-of-stock' ? 'Out of Stock' : 'Discontinued',
      notes: item?.notes || ''
    }
  })

  const watchedQuantity = watch('quantity')
  const watchedPrice = watch('price')

  // Calculate total value when quantity or price changes
  React.useEffect(() => {
    const totalValue = watchedQuantity * watchedPrice
    setValue('totalValue', totalValue)
  }, [watchedQuantity, watchedPrice, setValue])

  const onSubmit = (data: InventoryFormData) => {
    // Map form data to inventory item structure
    const inventoryData = {
      name: data.name,
      category: data.category,
      unit: data.unit || 'Pieces',
      vendor: data.supplier || '',
      quantity: data.quantity,
      price: data.price,
      status: data.status === 'In Stock' ? 'in-stock' as const :
              data.status === 'Low Stock' ? 'low-stock' as const :
              data.status === 'Out of Stock' ? 'out-of-stock' as const : 'discontinued' as const,
      minQuantity: data.minStock || 0,
      maxQuantity: 100, // Default value
      expiryDate: data.expiryDate,
      notes: data.notes
    }
    
    onSave(inventoryData)
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
          className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="modal-header" style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '24px', 
            borderBottom: '1px solid #e5e7eb' 
          }}>
            <h3 id="inventory-modal-title" style={{ 
              fontSize: '24px', 
              fontWeight: '700', 
              color: '#1f2937', 
              margin: 0 
            }}>
              {item ? 'Edit Item' : 'Add New Item'}
            </h3>
            <button
              onClick={onClose}
              className="close bg-blue-600 hover:bg-blue-700 text-white hover:text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
            >
              ×
            </button>
          </div>

          {/* Form */}
          <form id="inventory-form" onSubmit={handleSubmit(onSubmit)} style={{ padding: '24px' }}>
            <div className="form-layout" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '24px' 
            }}>
              {/* First Column */}
              <div className="form-column">
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label htmlFor="item-name" style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#374151', 
                    marginBottom: '8px' 
                  }}>
                    ITEM NAME *
                  </label>
                  <input
                    type="text" 
                    id="item-name" 
                    {...register('name')}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none',
                      transition: 'border-color 0.2s ease-in-out'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                  {errors.name && (
                    <span style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px', display: 'block' }}>
                      {errors.name.message}
                    </span>
                  )}
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label htmlFor="item-category" style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#374151', 
                    marginBottom: '8px' 
                  }}>
                    CATEGORY *
                  </label>
                  <select
                    id="item-category" 
                    {...register('category')}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none',
                      backgroundColor: 'white',
                      transition: 'border-color 0.2s ease-in-out'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  >
                    <option value="">Select Category</option>
                    <option value="Dental Supplies">Dental Supplies</option>
                    <option value="Medications">Medications</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Office Supplies">Office Supplies</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.category && (
                    <span style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px', display: 'block' }}>
                      {errors.category.message}
                    </span>
                  )}
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label htmlFor="item-description" style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#374151', 
                    marginBottom: '8px' 
                  }}>
                    DESCRIPTION
                  </label>
                  <textarea 
                    id="item-description" 
                    {...register('description')}
                    rows={3} 
                    placeholder="Enter item description"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none',
                      resize: 'vertical',
                      transition: 'border-color 0.2s ease-in-out'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label htmlFor="item-unit" style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#374151', 
                    marginBottom: '8px' 
                  }}>
                    UNIT
                  </label>
                  <select
                    id="item-unit" 
                    {...register('unit')}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none',
                      backgroundColor: 'white',
                      transition: 'border-color 0.2s ease-in-out'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  >
                    <option value="">Select Unit</option>
                    <option value="Pieces">Pieces</option>
                    <option value="Boxes">Boxes</option>
                    <option value="Bottles">Bottles</option>
                    <option value="Tubes">Tubes</option>
                    <option value="Packs">Packs</option>
                    <option value="Units">Units</option>
                  </select>
                </div>
              </div>

              {/* Second Column */}
              <div className="form-column">
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label htmlFor="item-quantity" style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#374151', 
                    marginBottom: '8px' 
                  }}>
                    QUANTITY *
                  </label>
                  <input
                    type="number"
                    id="item-quantity" 
                    {...register('quantity', { valueAsNumber: true })}
                    min="0"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
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

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label htmlFor="item-price" style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#374151', 
                    marginBottom: '8px' 
                  }}>
                    PRICE PER UNIT (PKR) *
                  </label>
                  <input
                    type="number"
                    id="item-price" 
                    {...register('price', { valueAsNumber: true })}
                    step="0.01" 
                    min="0"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none',
                      transition: 'border-color 0.2s ease-in-out'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                  {errors.price && (
                    <span style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px', display: 'block' }}>
                      {errors.price.message}
                    </span>
                  )}
              </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label htmlFor="item-total-value" style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#374151', 
                    marginBottom: '8px' 
                  }}>
                    TOTAL VALUE (PKR)
                  </label>
                  <input
                    type="number"
                    id="item-total-value" 
                    {...register('totalValue', { valueAsNumber: true })}
                    step="0.01" 
                    min="0"
                    readOnly
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none',
                      backgroundColor: '#f9fafb',
                      color: '#6b7280'
                    }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label htmlFor="item-min-stock" style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#374151', 
                    marginBottom: '8px' 
                  }}>
                    MINIMUM STOCK LEVEL
                  </label>
                  <input
                    type="number"
                    id="item-min-stock" 
                    {...register('minStock', { valueAsNumber: true })}
                    min="0"
                    placeholder="Alert when stock goes below this level"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none',
                      transition: 'border-color 0.2s ease-in-out'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
              </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label htmlFor="item-supplier" style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#374151', 
                    marginBottom: '8px' 
                  }}>
                    SUPPLIER
                  </label>
                  <input 
                    type="text" 
                    id="item-supplier" 
                    {...register('supplier')}
                    placeholder="Enter supplier name"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none',
                      transition: 'border-color 0.2s ease-in-out'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
              </div>
            </div>

              {/* Third Column */}
              <div className="form-column">
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label htmlFor="item-location" style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#374151', 
                    marginBottom: '8px' 
                  }}>
                    LOCATION
                  </label>
                  <input
                    type="text"
                    id="item-location" 
                    {...register('location')}
                    placeholder="Storage location"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none',
                      transition: 'border-color 0.2s ease-in-out'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label htmlFor="item-expiry-date" style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#374151', 
                    marginBottom: '8px' 
                  }}>
                    EXPIRY DATE
                  </label>
                  <div className="enhanced-date-picker" style={{ position: 'relative' }}>
                    <input 
                      type="date" 
                      id="item-expiry-date" 
                      {...register('expiryDate')}
                      data-calendar-initialized="true"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '16px',
                        outline: 'none',
                        transition: 'border-color 0.2s ease-in-out'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    />
                    <i 
                      className="fas fa-calendar-alt date-icon" 
                      data-click-handler-added="true" 
                      style={{ 
                        position: 'absolute', 
                        right: '12px', 
                        top: '50%', 
                        transform: 'translateY(-50%)', 
                        color: '#6b7280', 
                        pointerEvents: 'auto', 
                        cursor: 'pointer' 
                      }}
                    />
                </div>
              </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label htmlFor="item-status" style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#374151', 
                    marginBottom: '8px' 
                  }}>
                    STATUS
                </label>
                  <select 
                    id="item-status" 
                    {...register('status')}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none',
                      backgroundColor: 'white',
                      transition: 'border-color 0.2s ease-in-out'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  >
                    <option value="In Stock">In Stock</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                    <option value="Discontinued">Discontinued</option>
                  </select>
              </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label htmlFor="item-notes" style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#374151', 
                    marginBottom: '8px' 
                  }}>
                    NOTES
                </label>
                <textarea
                    id="item-notes" 
                  {...register('notes')}
                  rows={3}
                    placeholder="Additional notes"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none',
                      resize: 'vertical',
                      transition: 'border-color 0.2s ease-in-out'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="form-actions professional-actions flex gap-3 justify-end pt-4 border-t border-gray-200">
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
                
                <span>{item ? 'Update Item' : 'Save Item'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
