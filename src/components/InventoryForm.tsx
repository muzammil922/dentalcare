import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { InventoryItem } from '@/stores/useAppStore'
import { cn, getCurrentKarachiTime } from '@/lib/utils'

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
  const [showCalendar, setShowCalendar] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(getCurrentKarachiTime())
  const [showYearDropdown, setShowYearDropdown] = useState(false)
  const [showMonthDropdown, setShowMonthDropdown] = useState(false)
  
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
  const watchedExpiryDate = watch('expiryDate')

  // Calendar utility functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  // Generate years array (from 1950 to current year + 10)
  const generateYears = () => {
    const currentYear = getCurrentKarachiTime().getFullYear()
    const years = []
    for (let year = 1950; year <= currentYear + 10; year++) {
      years.push(year)
    }
    return years.reverse()
  }

  // Generate months array
  const generateMonths = () => {
    return [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
  }

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

  // Handle year selection
  const selectYear = (year: number) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      newDate.setFullYear(year)
      return newDate
    })
    setShowYearDropdown(false)
  }

  // Handle month selection
  const selectMonth = (monthIndex: number) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(monthIndex)
      return newDate
    })
    setShowMonthDropdown(false)
  }

  const selectDate = (day: number) => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setValue('expiryDate', formattedDate)
    setShowCalendar(false)
  }

  const isToday = (day: number) => {
    const today = getCurrentKarachiTime()
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    return date.toDateString() === today.toDateString()
  }

  const isSelectedDate = (day: number) => {
    if (!watchedExpiryDate) return false
    const selectedDate = new Date(watchedExpiryDate)
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    return date.toDateString() === selectedDate.toDateString()
  }

  // Calculate total value when quantity or price changes
  React.useEffect(() => {
    const totalValue = watchedQuantity * watchedPrice
    setValue('totalValue', totalValue)
  }, [watchedQuantity, watchedPrice, setValue])

  // Close calendar when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      
      // Check if clicking outside calendar elements
      const isCalendarElement = target.closest?.('.calendar-container')
      const isDropdownElement = target.closest?.('.dropdown-container')
      
      if (!isCalendarElement && !isDropdownElement) {
        setShowCalendar(false)
        setShowYearDropdown(false)
        setShowMonthDropdown(false)
      }
    }

    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCalendar])

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
                      transition: 'border-color 0.2s ease-in-out',
                      cursor: 'pointer',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236b7280\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6,9 12,15 18,9\'%3e%3c/polyline%3e%3c/svg%3e")',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      backgroundSize: '16px',
                      paddingRight: '40px'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6'
                      e.target.style.backgroundImage = 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%232563eb\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6,9 12,15 18,9\'%3e%3c/polyline%3e%3c/svg%3e")'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db'
                      e.target.style.backgroundImage = 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236b7280\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6,9 12,15 18,9\'%3e%3c/polyline%3e%3c/svg%3e")'
                    }}
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
                      {...register('expiryDate')}
                      type="text"
                      id="item-expiry-date"
                      readOnly
                      onClick={() => setShowCalendar(!showCalendar)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                      placeholder="Select expiry date"
                      value={watchedExpiryDate ? new Date(watchedExpiryDate).toLocaleDateString('en-US', { timeZone: 'Asia/Karachi' }) : ''}
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 cursor-pointer" />
                    
                    {/* Custom Calendar */}
                    {showCalendar && (
                      <div className="calendar-container absolute top-full left-0 mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 z-50 transform -rotate-1">
                        {/* Calendar Header */}
                        <div className="flex items-center justify-between mb-4">
                          <button
                            type="button"
                            onClick={() => navigateMonth('prev')}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                          </button>
                          
                          <div className="flex items-center gap-2">
                            {/* Month Dropdown */}
                            <div className="dropdown-container relative">
                              <button
                                type="button"
                                onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                                className="px-3 py-1 text-lg font-semibold text-gray-800 hover:bg-gray-100 rounded transition-colors"
                              >
                                {currentMonth.toLocaleDateString('en-US', { month: 'long', timeZone: 'Asia/Karachi' })}
                              </button>
                              {showMonthDropdown && (
                                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto scrollbar-hide">
                                  {generateMonths().map((month, index) => (
                                    <button
                                      key={index}
                                      type="button"
                                      onClick={() => selectMonth(index)}
                                      className="w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors"
                                    >
                                      {month}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Year Dropdown */}
                            <div className="dropdown-container relative">
                              <button
                                type="button"
                                onClick={() => setShowYearDropdown(!showYearDropdown)}
                                className="px-3 py-1 text-lg font-semibold text-gray-800 hover:bg-gray-100 rounded transition-colors"
                              >
                                {currentMonth.getFullYear()}
                              </button>
                              {showYearDropdown && (
                                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto w-20 scrollbar-hide">
                                  {generateYears().map((year) => (
                                    <button
                                      key={year}
                                      type="button"
                                      onClick={() => selectYear(year)}
                                      className="w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors"
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
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            <ChevronRight className="w-5 h-5 text-gray-600" />
                          </button>
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                              {day}
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                          {/* Empty cells for days before the first day of the month */}
                          {Array.from({ length: getFirstDayOfMonth(currentMonth) }).map((_, index) => (
                            <div key={`empty-${index}`} className="h-8"></div>
                          ))}
                          
                          {/* Days of the month */}
                          {Array.from({ length: getDaysInMonth(currentMonth) }, (_, i) => i + 1).map(day => (
                            <button
                              key={day}
                              type="button"
                              onClick={() => selectDate(day)}
                              className={cn(
                                'h-8 w-8 rounded-full text-sm font-medium transition-colors hover:bg-gray-100',
                                isToday(day) && 'bg-blue-500 text-white hover:bg-blue-600',
                                isSelectedDate(day) && !isToday(day) && 'bg-blue-500 text-white hover:bg-blue-600',
                                !isToday(day) && !isSelectedDate(day) && 'text-gray-800 hover:bg-gray-100'
                              )}
                            >
                              {day}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
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
