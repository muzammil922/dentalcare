import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Download,
  Upload,
  Search,
  Filter
} from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import InventoryForm from '@/components/InventoryForm'
import { InventoryItem } from '@/stores/useAppStore'

export default function Inventory() {
  const [activeTab, setActiveTab] = useState('inventory-management')
  const [showInventoryForm, setShowInventoryForm] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentFilter, setCurrentFilter] = useState('all')
  
  const { 
    inventory, 
    addInventoryItem, 
    updateInventoryItem, 
    deleteInventoryItem
  } = useAppStore()

  // Filter inventory based on current filter and search
  const filteredInventory = inventory.filter(item => {
    const matchesFilter = currentFilter === 'all' || item.status === currentFilter
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.vendor.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const tabs = [
    { id: 'inventory-management', label: 'Inventory Management', icon: Package },
    { id: 'stock-alerts', label: 'Stock Alerts', icon: Package },
    { id: 'supplier-management', label: 'Supplier Management', icon: Package }
  ]

  const filters = [
    { value: 'all', label: 'All Items' },
    { value: 'in-stock', label: 'In Stock' },
    { value: 'low-stock', label: 'Low Stock' },
    { value: 'out-of-stock', label: 'Out of Stock' },
    { value: 'discontinued', label: 'Discontinued' }
  ]

  const handleSaveItem = (itemData: Omit<InventoryItem, 'id'>) => {
    if (editingItem) {
      updateInventoryItem(editingItem.id, itemData)
      setEditingItem(null)
    } else {
      addInventoryItem({
        ...itemData,
        id: Math.random().toString(36).substr(2, 9)
      })
    }
    setShowInventoryForm(false)
  }

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item)
    setShowInventoryForm(true)
  }

  const handleDeleteItem = (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      deleteInventoryItem(itemId)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-stock':
        return 'bg-green-100 text-green-800'
      case 'low-stock':
        return 'bg-yellow-100 text-yellow-800'
      case 'out-of-stock':
        return 'bg-red-100 text-red-800'
      case 'discontinued':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-6">
      {/* Inventory Overview */}
      <div className="mb-6 bg-white p-3 border border-gray-200 rounded-lg shadow-sm">
        <div className="flex justify-end items-center mb-6">
          <button
            onClick={() => setShowInventoryForm(true)}
            className="inventory-overview-btn bg-primary-500 text-white border-none p-3 rounded-md cursor-pointer text-lg transition-all duration-300 flex items-center justify-center w-10 h-10 hover:bg-primary-600 hover:-translate-y-1 hover:shadow-md"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Inventory Tabs */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 mb-6 shadow-sm">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-none rounded-md font-medium cursor-pointer transition-all duration-150 whitespace-nowrap flex-shrink-0 ${
                activeTab === tab.id
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Summary */}
      <div className="flex justify-between items-center p-4 bg-white border border-gray-200 rounded-lg mb-4 shadow-sm min-h-[60px] overflow-hidden gap-4">
        <div className="flex items-center gap-2 flex-shrink-0 min-w-0">
          <span className="summary-label text-gray-700 font-medium text-sm whitespace-nowrap flex-shrink-0">
            Total Items:
          </span>
          <span className="summary-count text-primary-500 font-bold text-lg whitespace-nowrap flex-shrink-0">
            {inventory.length}
          </span>
        </div>
        <div className="text-gray-600 text-sm font-medium whitespace-nowrap text-right flex-shrink-0 min-w-0 overflow-hidden text-ellipsis">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-md">
        <div className="flex gap-4 items-center justify-between flex-wrap">
          {/* Filters */}
          <div className="flex gap-2 mb-4 pt-5">
            {filters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setCurrentFilter(filter.value)}
                className={`flex items-center gap-2 px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-sm font-medium cursor-pointer transition-all duration-150 min-h-[44px] whitespace-nowrap ${
                  currentFilter === filter.value
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Filter className="w-4 h-4" />
                {filter.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 items-center ml-auto">
            <button className="action-btn import-btn">
              <Upload className="w-4 h-4" />
              Import
            </button>
            <button className="action-btn export-btn">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6 bg-white border border-gray-300 rounded-lg p-2 shadow-sm">
        <input
          type="text"
          placeholder="Search inventory by name, category, or vendor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg text-base bg-white transition-all duration-150 focus:outline-none focus:border-primary-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]"
        />
        <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-6 px-4">
        {filteredInventory.length > 0 ? (
          filteredInventory.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inventory-item bg-white border border-gray-200 rounded-2xl p-5 shadow-sm transition-all duration-150 flex flex-col justify-between gap-4 relative overflow-hidden hover:-translate-y-1 hover:shadow-lg hover:border-primary-500"
            >
              {/* Status indicator line */}
              <div className="absolute top-0 left-0 w-1 h-full bg-primary-500 opacity-0 transition-opacity duration-150"></div>
              <div className="inventory-item-info flex-1 flex flex-col gap-3 pl-1">
                <h3 className="inventory-item-name text-xl font-bold text-gray-900 leading-tight m-0">
                  {item.name}
                </h3>
                <p className="inventory-item-category text-sm text-primary-500 font-semibold uppercase tracking-wide m-0">
                  {item.category}
                </p>
                <div className="inventory-item-details flex gap-4 text-sm text-gray-600 m-0">
                  <span className="inventory-item-quantity font-semibold text-gray-900">
                    Qty: {item.quantity}
                  </span>
                  <span className="inventory-item-price text-success-500 font-semibold">
                    ${item.price}
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <span className={`inventory-item-status px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide shadow-sm border border-transparent transition-all duration-150 ${getStatusColor(item.status)}`}>
                {item.status.replace('-', ' ')}
              </span>

              {/* Actions */}
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => handleEditItem(item)}
                  className="inventory-action-btn edit w-6 h-6 border border-gray-300 rounded-md bg-transparent text-primary-500 cursor-pointer transition-all duration-200 flex items-center justify-center text-base leading-none box-border hover:bg-primary-50 hover:border-primary-500"
                  title="Edit Item"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="inventory-action-btn delete w-6 h-6 border border-gray-300 rounded-md bg-transparent text-error-500 cursor-pointer transition-all duration-200 flex items-center justify-center text-base leading-none box-border hover:bg-error-50 hover:border-error-500"
                  title="Delete Item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-gray-500">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-medium mb-2">No inventory items found</h3>
            <p>Get started by adding your first inventory item</p>
          </div>
        )}
      </div>

      {/* Inventory Form Modal */}
      {showInventoryForm && (
        <InventoryForm
          item={editingItem}
          onSave={handleSaveItem}
          onClose={() => {
            setShowInventoryForm(false)
            setEditingItem(null)
          }}
        />
      )}
    </div>
  )
}
