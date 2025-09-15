import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Package, DollarSign, AlertTriangle, Calendar } from 'lucide-react'
import { InventoryItem } from '@/stores/useAppStore'
import { cn, getCurrentKarachiTime } from '@/lib/utils'

const inventorySchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  sku: z.string().min(1, 'SKU is required'),
  unitPrice: z.number().min(0, 'Unit price must be non-negative'),
  currentStock: z.number().min(0, 'Current stock must be non-negative'),
  minStockLevel: z.number().min(0, 'Minimum stock level must be non-negative'),
  maxStockLevel: z.number().min(0, 'Maximum stock level must be non-negative'),
  supplier: z.string().optional(),
  location: z.string().optional(),
  expiryDate: z.string().optional(),
  status: z.enum(['active', 'inactive', 'discontinued']),
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
    reset
  } = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      name: item?.name || '',
      category: item?.category || '',
      description: item?.description || '',
      sku: item?.sku || '',
      unitPrice: item?.unitPrice || 0,
      currentStock: item?.currentStock || 0,
      minStockLevel: item?.minStockLevel || 10,
      maxStockLevel: item?.maxStockLevel || 100,
      supplier: item?.supplier || '',
      location: item?.location || '',
      expiryDate: item?.expiryDate || '',
      status: item?.status || 'active',
      notes: item?.notes || ''
    }
  })

  const watchedCurrentStock = watch('currentStock')
  const watchedMinStockLevel = watch('minStockLevel')
  const watchedMaxStockLevel = watch('maxStockLevel')

  // Calculate stock status
  const isLowStock = watchedCurrentStock <= watchedMinStockLevel
  const isOverstocked = watchedCurrentStock >= watchedMaxStockLevel
  const stockPercentage = watchedMaxStockLevel > 0 ? (watchedCurrentStock / watchedMaxStockLevel) * 100 : 0

  const onSubmit = (data: InventoryFormData) => {
    onSave({
      ...data,
      lastUpdated: getCurrentKarachiTime().toISOString()
    })
    reset()
  }

  const categories = [
    'Dental Supplies',
    'Medications',
    'Equipment',
    'Consumables',
    'Personal Protective Equipment',
    'Laboratory Supplies',
    'Office Supplies',
    'Other'
  ]

  const locations = [
    'Main Storage',
    'Treatment Room A',
    'Treatment Room B',
    'Laboratory',
    'Office',
    'Emergency Kit',
    'Mobile Unit'
  ]

  const getStockStatusColor = () => {
    if (isLowStock) return 'text-red-600'
    if (isOverstocked) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getStockStatusText = () => {
    if (isLowStock) return 'Low Stock'
    if (isOverstocked) return 'Overstocked'
    return 'Normal'
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
          className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">
              {item ? 'Edit Inventory Item' : 'Add New Inventory Item'}
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
                <Package className="w-5 h-5" />
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="name" className="form-label">
                    Item Name *
                  </label>
                  <input
                    {...register('name')}
                    type="text"
                    id="name"
                    className={cn('form-input', errors.name && 'border-red-500')}
                    placeholder="Enter item name"
                  />
                  {errors.name && (
                    <span className="text-red-500 text-sm">{errors.name.message}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="sku" className="form-label">
                    SKU *
                  </label>
                  <input
                    {...register('sku')}
                    type="text"
                    id="sku"
                    className={cn('form-input', errors.sku && 'border-red-500')}
                    placeholder="Enter SKU code"
                  />
                  {errors.sku && (
                    <span className="text-red-500 text-sm">{errors.sku.message}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="category" className="form-label">
                    Category *
                  </label>
                  <select
                    {...register('category')}
                    id="category"
                    className={cn('form-input', errors.category && 'border-red-500')}
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  {errors.category && (
                    <span className="text-red-500 text-sm">{errors.category.message}</span>
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
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="discontinued">Discontinued</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description" className="form-label">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  id="description"
                  rows={3}
                  className="form-input"
                  placeholder="Enter item description"
                />
              </div>
            </div>

            {/* Pricing and Stock */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Pricing & Stock
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="unitPrice" className="form-label">
                    Unit Price *
                  </label>
                  <input
                    {...register('unitPrice', { valueAsNumber: true })}
                    type="number"
                    id="unitPrice"
                    min="0"
                    step="0.01"
                    className={cn('form-input', errors.unitPrice && 'border-red-500')}
                    placeholder="Enter unit price"
                  />
                  {errors.unitPrice && (
                    <span className="text-red-500 text-sm">{errors.unitPrice.message}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="currentStock" className="form-label">
                    Current Stock *
                  </label>
                  <input
                    {...register('currentStock', { valueAsNumber: true })}
                    type="number"
                    id="currentStock"
                    min="0"
                    className={cn('form-input', errors.currentStock && 'border-red-500')}
                    placeholder="Enter current stock"
                  />
                  {errors.currentStock && (
                    <span className="text-red-500 text-sm">{errors.currentStock.message}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="minStockLevel" className="form-label">
                    Minimum Stock Level *
                  </label>
                  <input
                    {...register('minStockLevel', { valueAsNumber: true })}
                    type="number"
                    id="minStockLevel"
                    min="0"
                    className={cn('form-input', errors.minStockLevel && 'border-red-500')}
                    placeholder="Enter minimum stock level"
                  />
                  {errors.minStockLevel && (
                    <span className="text-red-500 text-sm">{errors.minStockLevel.message}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="maxStockLevel" className="form-label">
                    Maximum Stock Level *
                  </label>
                  <input
                    {...register('maxStockLevel', { valueAsNumber: true })}
                    type="number"
                    id="maxStockLevel"
                    min="0"
                    className={cn('form-input', errors.maxStockLevel && 'border-red-500')}
                    placeholder="Enter maximum stock level"
                  />
                  {errors.maxStockLevel && (
                    <span className="text-red-500 text-sm">{errors.maxStockLevel.message}</span>
                  )}
                </div>
              </div>

              {/* Stock Status Indicator */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Stock Status</span>
                  <span className={`text-sm font-semibold ${getStockStatusColor()}`}>
                    {getStockStatusText()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isLowStock ? 'bg-red-500' : isOverstocked ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{watchedCurrentStock} units</span>
                  <span>{watchedMaxStockLevel} units</span>
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Additional Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="supplier" className="form-label">
                    Supplier
                  </label>
                  <input
                    {...register('supplier')}
                    type="text"
                    id="supplier"
                    className="form-input"
                    placeholder="Enter supplier name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="location" className="form-label">
                    Storage Location
                  </label>
                  <select
                    {...register('location')}
                    id="location"
                    className="form-input"
                  >
                    <option value="">Select location</option>
                    {locations.map((location) => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="expiryDate" className="form-label">
                  Expiry Date
                </label>
                <input
                  {...register('expiryDate')}
                  type="date"
                  id="expiryDate"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="notes" className="form-label">
                  Notes
                </label>
                <textarea
                  {...register('notes')}
                  id="notes"
                  rows={3}
                  className="form-input"
                  placeholder="Enter any additional notes or special instructions..."
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
                {item ? 'Update Item' : 'Add Item'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
