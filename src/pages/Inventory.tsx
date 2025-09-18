import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, Search } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import InventoryForm from '@/components/InventoryForm'
import InventoryUsageModal from '@/components/InventoryUsageModal'
import RecordUsageModal from '@/components/RecordUsageModal'
import { InventoryItem } from '@/stores/useAppStore'

export default function Inventory() {
  const [showInventoryForm, setShowInventoryForm] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [showUsageModal, setShowUsageModal] = useState(false)
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null)
  const [showRecordUsageModal, setShowRecordUsageModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null)
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [itemsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  
  // Refresh states
  const [isRefreshingInventory, setIsRefreshingInventory] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  const { 
    inventory, 
    clinicInfo,
    addInventoryItem, 
    updateInventoryItem, 
    deleteInventoryItem,
    usageRecords,
    addUsageRecord
  } = useAppStore()

  // Show toast message function
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    // Create toast element
    const toast = document.createElement('div')
    toast.className = `fixed top-4 right-4 z-[99999] px-6 py-3 rounded-lg text-white font-medium shadow-lg ${
      type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    }`
    toast.textContent = message
    
    // Add to page
    document.body.appendChild(toast)
    
    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.opacity = '0'
      setTimeout(() => {
        document.body.removeChild(toast)
      }, 300)
    }, 3000)
  }

  // Data refresh effect for inventory
  useEffect(() => {
    if (refreshTrigger > 0) {
      // Force re-render of inventory data by updating a state that affects the data
      console.log('Refreshing inventory data...')
      // Force recalculation of filtered inventory
      setSearchTerm(prev => prev)
      // This will trigger a re-render of the filtered and paginated data
    }
  }, [refreshTrigger])

  // Calculate remaining quantity for each item based on usage records
  const getRemainingQuantity = (itemId: string, totalQuantity: number) => {
    const totalUsed = usageRecords
      .filter(record => record.itemId === itemId)
      .reduce((sum, record) => sum + record.quantity, 0)
    return Math.max(0, totalQuantity - totalUsed)
  }

  // Get status based on remaining quantity and manual status
  const getItemStatus = (itemId: string, totalQuantity: number) => {
    const item = inventory.find(i => i.id === itemId)
    
    // If manually set to discontinued, keep it discontinued
    if (item?.status === 'discontinued') return 'discontinued'
    
    const remaining = getRemainingQuantity(itemId, totalQuantity)
    const minQuantity = item?.minQuantity || 5
    
    if (remaining === 0) return 'out-of-stock'
    if (remaining <= minQuantity) return 'low-stock'
    return 'in-stock'
  }

  // Filter inventory based on search
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.vendor.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  // Pagination
  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedInventory = filteredInventory.slice(startIndex, endIndex)

  const handleSaveItem = (itemData: Omit<InventoryItem, 'id'>) => {
    if (editingItem) {
      updateInventoryItem(editingItem.id, itemData)
      setEditingItem(null)
    } else {
      // Generate sequential ID like item-01, item-02, etc.
      const existingIds = inventory.map(item => item.id)
      let nextId = 1
      let newId = `item-${nextId.toString().padStart(2, '0')}`
      
      // Find the next available sequential ID
      while (existingIds.includes(newId)) {
        nextId++
        newId = `item-${nextId.toString().padStart(2, '0')}`
      }
      
      addInventoryItem({
        ...itemData,
        id: newId
      })
    }
    setShowInventoryForm(false)
  }


  const handleSelectAll = () => {
    if (selectedItems.length === paginatedInventory.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(paginatedInventory.map(item => item.id))
    }
  }

  const handleSelectItem = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId))
    } else {
      setSelectedItems([...selectedItems, itemId])
    }
  }

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item)
    setShowInventoryForm(true)
  }

  const handleDeleteItem = (itemId: string) => {
    const item = inventory.find(i => i.id === itemId)
    if (item) {
      setItemToDelete(item)
      setShowDeleteConfirm(true)
    }
  }

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteInventoryItem(itemToDelete.id)
      setItemToDelete(null)
      setShowDeleteConfirm(false)
    }
  }

  const handleBulkDelete = () => {
    if (selectedItems.length > 0) {
      setShowBulkDeleteConfirm(true)
    }
  }

  const confirmBulkDelete = () => {
    selectedItems.forEach(itemId => {
      deleteInventoryItem(itemId)
    })
    setSelectedItems([])
    setShowBulkDeleteConfirm(false)
  }

  const handleViewUsage = (item: InventoryItem) => {
    setViewingItem(item)
    setShowUsageModal(true)
  }

  const handleRecordUsage = (data: { itemId: string; quantity: number; reason?: string; notes?: string }) => {
    const item = inventory.find(i => i.id === data.itemId)
    if (item) {
      // Generate sequential usage record ID like usage-01, usage-02, etc.
      const existingUsageIds = usageRecords.map(record => record.id)
      let nextUsageId = 1
      let newUsageId = `usage-${nextUsageId.toString().padStart(2, '0')}`
      
      // Find the next available sequential usage ID
      while (existingUsageIds.includes(newUsageId)) {
        nextUsageId++
        newUsageId = `usage-${nextUsageId.toString().padStart(2, '0')}`
      }
      
      // Add usage record to the store
      const usageRecord = {
        id: newUsageId,
        itemId: data.itemId,
        itemName: item.name,
        quantity: data.quantity,
        reason: data.reason || 'Other',
        date: new Date().toISOString(),
        staffId: 'current-staff', // In real app, get from auth context
        staffName: 'Current User' // In real app, get from auth context
      }
      
      addUsageRecord(usageRecord)
      
      // Update item status based on new remaining quantity (but preserve manually set discontinued status)
      const newStatus = getItemStatus(data.itemId, item.quantity)
      
      // Only update status if it's not manually set to discontinued
      if (item.status !== 'discontinued') {
        updateInventoryItem(item.id, {
          ...item,
          status: newStatus as 'in-stock' | 'low-stock' | 'out-of-stock' | 'discontinued'
        })
      }
      
      console.log('Usage recorded:', usageRecord)
    }
  }

  // Generate inventory print HTML
  const generateInventoryPrintHTML = () => {
    const currentDate = new Date().toLocaleDateString()
    const currentTime = new Date().toLocaleTimeString()
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const totalItems = inventory.length
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const inStockItems = inventory.filter(item => getItemStatus(item.id, item.quantity) === 'in-stock').length
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const lowStockItems = inventory.filter(item => getItemStatus(item.id, item.quantity) === 'low-stock').length
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const outOfStockItems = inventory.filter(item => getItemStatus(item.id, item.quantity) === 'out-of-stock').length
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const discontinuedItems = inventory.filter(item => item.status === 'discontinued').length

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Inventory Report - ${currentDate}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
          .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
          .clinic-header { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-bottom: 1rem; }
          .clinic-logo { width: 60px; height: 60px; object-fit: contain; }
          .clinic-icon { font-size: 3rem; }
          .header h1 { color: #2563eb; margin: 0; font-size: 24px; }
          .header p { color: #666; margin: 5px 0; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .info-card { border: 1px solid #ddd; border-radius: 8px; padding: 15px; background: #f9fafb; }
          .info-label { font-weight: bold; color: #666; font-size: 12px; text-transform: uppercase; margin-bottom: 5px; }
          .info-value { font-size: 16px; font-weight: bold; color: #333; }
          .status-badge { display: inline-block; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
          .status-instock { background: #dcfce7; color: #166534; }
          .status-lowstock { background: #fef3c7; color: #92400e; }
          .status-outstock { background: #fee2e2; color: #991b1b; }
          .status-discontinued { background: #f3f4f6; color: #6b7280; }
          .description { border: 1px solid #ddd; border-radius: 8px; padding: 15px; background: #f9fafb; margin-top: 20px; }
          .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px; }
          .footer-content { max-width: 100%; margin: 0 auto; }
          .footer-content h3 { margin: 0 0 1rem 0; color: #2563eb; font-size: 1.25rem; font-weight: bold; }
          .footer-details { margin-bottom: 1rem; line-height: 1.6; }
          .footer-details p { margin: 0.25rem 0; color: #374151; font-size: 0.875rem; }
          .footer-bottom { border-top: 1px solid #d1d5db; padding-top: 1rem; margin-top: 1rem; }
          .footer-bottom p { margin: 0.25rem 0; color: #64748b; font-size: 0.8rem; }
          .item-section { margin-bottom: 40px; border-bottom: 1px solid #e5e7eb; padding-bottom: 30px; }
          .item-section:last-child { border-bottom: none; }
          .item-title { color: #2563eb; margin: 0 0 10px 0; font-size: 20px; }
          .item-id { color: #666; margin: 0 0 20px 0; font-size: 14px; }
          .print-controls { 
            position: fixed; 
            top: 20px; 
            right: 20px; 
            z-index: 1000; 
            display: flex; 
            gap: 12px; 
            align-items: center;
          }
          @media print { 
            body { margin: 0; } 
            .header { border-bottom-color: #000; } 
            .print-controls { display: none !important; } 
          }
        </style>
        <script>
          function printInventory() {
            window.print();
          }
          
          function closeWindow() {
            window.close();
          }
        </script>
      </head>
      <body>
        <!-- Print Controls -->
        <div class="print-controls">
          <button onclick="printInventory()" style="padding: 12px 24px; background: #059669; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); transition: all 0.2s ease; display: flex; align-items: center; gap: 8px;" onmouseover="this.style.background='#047857'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 8px rgba(0, 0, 0, 0.15)'" onmouseout="this.style.background='#059669'; this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 6px rgba(0, 0, 0, 0.1)'">
            Print Report
          </button>
      
        </div>
        
        <div class="header">
          <div class="clinic-header">
              ${clinicInfo.logo ? `<img src="${clinicInfo.logo}" alt="Clinic Logo" class="clinic-logo" />` : ''}
              ${clinicInfo.name ? `<h1>${clinicInfo.name}</h1>` : ''}
          </div>
          <p>Inventory Report</p>
        </div>
        
       
          </div>
        </div>
        
        <!-- Individual Items -->
        ${inventory.map((item) => {
          const remaining = getRemainingQuantity(item.id, item.quantity)
          const used = item.quantity - remaining
          const status = getItemStatus(item.id, item.quantity)
          const totalValue = item.quantity * item.price
          
          const statusClass = status === 'in-stock' ? 'status-instock' : 
                             status === 'low-stock' ? 'status-lowstock' : 
                             status === 'out-of-stock' ? 'status-outstock' : 'status-discontinued'
          
          const statusText = status === 'in-stock' ? 'In Stock' : 
                            status === 'low-stock' ? 'Low Stock' : 
                            status === 'out-of-stock' ? 'Out of Stock' : 'Discontinued'
          
          return `
            <div class="item-section">
              <h2 class="item-title">${item.name}</h2>
              <p class="item-id">Item ID: ${item.id}</p>
              
              <div class="info-grid">
                <div class="info-card">
                  <div class="info-label">Category</div>
                  <div class="info-value">${item.category || 'N/A'}</div>
                </div>
                <div class="info-card">
                  <div class="info-label">Supplier</div>
                  <div class="info-value">${item.vendor || 'N/A'}</div>
                </div>
                <div class="info-card">
                  <div class="info-label">Total Quantity</div>
                  <div class="info-value">${item.quantity} ${item.unit || 'units'}</div>
                </div>
                <div class="info-card">
                  <div class="info-label">Used Quantity</div>
                  <div class="info-value">${used} ${item.unit || 'units'}</div>
                </div>
                <div class="info-card">
                  <div class="info-label">Remaining Quantity</div>
                  <div class="info-value">${remaining} ${item.unit || 'units'}</div>
                </div>
                <div class="info-card">
                  <div class="info-label">Price per Unit</div>
                  <div class="info-value">Rs. ${Math.round(item.price || 0).toLocaleString()}</div>
                </div>
                <div class="info-card">
                  <div class="info-label">Total Value</div>
                  <div class="info-value">Rs. ${totalValue.toLocaleString()}</div>
                </div>
                <div class="info-card">
                  <div class="info-label">Status</div>
                  <div class="info-value">
                    <span class="status-badge ${statusClass}">${statusText}</span>
                  </div>
                </div>
              </div>
              
              ${item.notes ? `
              <div class="description">
                <div class="info-label">Description</div>
                <div style="color: #333; line-height: 1.5; margin-top: 5px;">${item.notes}</div>
              </div>` : ''}
            </div>
          `
        }).join('')}
        
        <div class="footer">
          <div class="footer-content">
            <h3>${clinicInfo.name}</h3>
            <div class="footer-details">
              <p><strong>Address:</strong> ${clinicInfo.address}</p>
              <p><strong>Phone:</strong> ${clinicInfo.phone} | <strong>Email:</strong> ${clinicInfo.email}</p>
              <p><strong>Website:</strong> ${clinicInfo.website} | <strong>Hours:</strong> ${clinicInfo.hours}</p>
            </div>
            <div class="footer-bottom">
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  }

  // Handle print inventory
  const handlePrintInventory = () => {
    console.log('Print button clicked for inventory')
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=1000,height=700')
    
    if (printWindow) {
      // Generate the print content
      const printContent = generateInventoryPrintHTML()
      
      printWindow.document.write(printContent)
      printWindow.document.close()
      
      // Focus the window but don't auto-print
      printWindow.focus()
    } else {
      showToast('Please allow popups to print inventory', 'error')
    }
  }


  return (
    <section id="inventory" className="content-section p-6">
      <div className="section-header" style={{ textAlign: 'left', margin: '0px 0px 20px 0px' }}>
        <h2 style={{ 
          fontSize: '32px', 
          fontWeight: '700', 
          color: '#1f2937', 
          margin: 0,
          letterSpacing: '-0.025em'
        }}>
          Inventory Management
        </h2>
      </div>

      {/* Inventory Overview */}
      <div className="inventory-overview" style={{ 
        backgroundColor: 'white', 
        borderRadius: '12px', 
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', 
        padding: '10px',
        marginBottom: '16px'
      }}>
            <button
          className="overview-btn active" 
          data-tab="overview"
          style={{
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <i className="fas fa-boxes"></i>
          Inventory
            </button>
      </div>

      <div className="inventory-overview-btn-container" style={{ 
        backgroundColor: 'white', 
        borderRadius: '12px', 
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', 
        padding: '16px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px'
      }}>
              <button
          className="btn btn-primary" 
          id="add-new-item-btn" 
          style={{ 
            padding: '12px 20px', 
            fontSize: '14px', 
            fontWeight: 600,
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onClick={() => setShowInventoryForm(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus w-4 h-4 text-white"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
           Add Item
              </button>
        <button 
          className="btn btn-primary" 
          id="record-usage-btn" 
          onClick={() => setShowRecordUsageModal(true)}
          style={{ 
            padding: '12px 20px', 
            fontSize: '14px', 
            fontWeight: 600,
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus w-4 h-4 text-white"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
           Record Usage
            </button>
        <button 
          onClick={() => {
            setIsRefreshingInventory(true)
            
            // Show toast message
            showToast('Refreshing inventory list...', 'success')
            
            // Simulate data loading delay
            setTimeout(() => {
              // Reset search and filters
              setSearchTerm('')
              setSelectedItems([])
              // Reset to first page
              setCurrentPage(1)
              // Trigger data refresh
              setRefreshTrigger(prev => prev + 1)
              
              // Stop loading after a short delay to show the refresh effect
              setTimeout(() => {
                setIsRefreshingInventory(false)
              }, 500)
            }, 200)
          }}
          disabled={isRefreshingInventory}
          className="flex items-center justify-center w-12 h-12 bg-white border border-primary-500 rounded-lg text-primary-500 hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh Inventory"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshingInventory ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6 bg-white border border-gray-300 rounded-lg p-2 shadow-sm">
        <input
          type="text"
          placeholder="Search inventory records..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 pr-12 rounded-lg text-base bg-white focus:outline-none focus:border-primary-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]"
        />
        <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
      </div>

      {/* Inventory Table */}
      <div key={`inventory-container-${refreshTrigger}`} className="inventory-container" style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
        {/* Inventory Summary */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '16px 24px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#374151', fontSize: '14px', fontWeight: '500' }}>Total Items:</span>
            <span style={{ color: '#3b82f6', fontSize: '18px', fontWeight: '700' }}>{inventory.length}</span>
            
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ 
              color: '#6b7280', 
              fontSize: '14px', 
              fontWeight: '500'
            }}>
              Showing {startIndex + 1}-{Math.min(endIndex, filteredInventory.length)} of {filteredInventory.length} inventory
            </div>
            {selectedItems.length > 0 && (
              <button 
                className="btn btn-danger" 
                onClick={handleBulkDelete}
                style={{ 
                  padding: '8px 16px', 
                  fontSize: '12px', 
                  fontWeight: 600,
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#dc2626'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#ef4444'
                }}
              >
                <i className="fas fa-trash" style={{ fontSize: '12px' }}></i>
                Delete Selected ({selectedItems.length})
              </button>
            )}
          </div>
        </div>
        
        <div className="inventory-table">
          {/* Table Header */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '55px 2fr 1.9fr 1.5fr 100px 100px 120px 80px 120px 140px', 
            gap: '1rem', 
            padding: '1rem', 
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
            fontWeight: '600',
            color: '#3b82f6',
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
              <input 
                type="checkbox" 
                checked={selectedItems.length === paginatedInventory.length && paginatedInventory.length > 0}
                onChange={handleSelectAll}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
            </div>
            <div style={{ textAlign: 'left', paddingLeft: '0' }}>ITEM NAME</div>
            <div style={{ textAlign: 'left', paddingLeft: '0' }}>CATEGORY</div>
            <div style={{ textAlign: 'left', paddingLeft: '0' }}>VENDOR</div>
            <div style={{ textAlign: 'center' }}>TOTAL</div>
            <div style={{ textAlign: 'center' }}>REMAINING</div>
            <div style={{ textAlign: 'center' }}>STATUS</div>
            <div style={{ textAlign: 'center' }}>UNIT</div>
            <div style={{ textAlign: 'center' }}>PRICE</div>
            <div style={{ textAlign: 'center' }}>ACTIONS</div>
      </div>

          {/* Table Rows */}
          {paginatedInventory.length > 0 ? (
            paginatedInventory.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
                className="inventory-table-row"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '50px 2fr 1fr 1fr 100px 100px 120px 80px 120px 140px',
                  gap: '1rem',
                  padding: '1rem',
                  borderBottom: '1px solid #f3f4f6',
                  transition: 'background-color 0.2s',
                  alignItems: 'center',
                  backgroundColor: 'white'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'white'
                }}
              >
                <div className="table-cell" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                  <input 
                    type="checkbox" 
                    className="inventory-checkbox" 
                    checked={selectedItems.includes(item.id)}
                    onChange={() => handleSelectItem(item.id)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <span 
                    className="serial-number" 
                    style={{
                      fontWeight: '500',
                      color: '#3b82f6',
                      fontSize: '0.875rem',
                      background: '#dbeafe',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.5rem',
                      minWidth: '26px',
                    
                      textAlign: 'center'
                    }}
                  >
                    {index + 1}
                  </span>
                </div>
                <div className="table-cell" style={{ textAlign: 'left', paddingLeft: '0' }}>
                  <span 
                    className="item-name" 
                    style={{
                      fontWeight: '500',
                      color: '#2563eb',
                      fontSize: '0.875rem',
                      display: 'inline-block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      lineHeight: '1.4',
                      backgroundColor: '#dbeafe',
                      padding: '4px 8px',
                      borderRadius: '6px'
                    }}
                  >
                  {item.name}
                  </span>
                </div>
                <div className="table-cell" style={{ textAlign: 'left', paddingLeft: '0' }}>
                  <span 
                    className="item-category" 
                    style={{
                      color: '#2563eb',
                      fontSize: '0.875rem',
                      display: 'inline-block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontWeight: '500',
                      backgroundColor: '#dbeafe',
                      padding: '4px 8px',
                      borderRadius: '6px'
                    }}
                  >
                  {item.category}
                  </span>
                </div>
                <div className="table-cell" style={{ textAlign: 'left', paddingLeft: '0' }}>
                  <span 
                    className="item-vendor" 
                    style={{
                      color: '#2563eb',
                      fontSize: '0.875rem',
                      display: 'inline-block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontWeight: '500',
                      backgroundColor: '#dbeafe',
                      padding: '4px 8px',
                      borderRadius: '6px'
                    }}
                  >
                    {item.vendor}
                  </span>
                </div>
                <div className="table-cell" style={{ textAlign: 'center' }}>
                  <span 
                    className="item-total-quantity" 
                    style={{
                      fontWeight: '600',
                      color: '#2563eb',
                      fontSize: '0.875rem',
                      backgroundColor: '#dbeafe',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      display: 'inline-block'
                    }}
                  >
                    {item.quantity}
                  </span>
                </div>
                <div className="table-cell" style={{ textAlign: 'center' }}>
                  <span 
                    className="item-remaining-quantity" 
                    style={{
                      fontWeight: '600',
                      color: '#166534',
                      fontSize: '0.875rem',
                      background: '#dcfce7',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '6px'
                    }}
                  >
                    {getRemainingQuantity(item.id, item.quantity)}
                  </span>
                </div>
                <div className="table-cell" style={{ textAlign: 'center' }}>
                  {(() => {
                    const currentStatus = getItemStatus(item.id, item.quantity)
                    return (
                      <span 
                        className="item-status" 
                        style={{
                          padding: '0.375rem 0.875rem',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          color: 'white',
                          background: currentStatus === 'in-stock' ? '#22c55e' : 
                                     currentStatus === 'low-stock' ? '#eab308' : 
                                     currentStatus === 'out-of-stock' ? '#ef4444' : '#6b7280',
                          display: 'inline-block',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                      >
                        {currentStatus === 'in-stock' ? 'Available' : 
                         currentStatus === 'low-stock' ? 'Low Stock' : 
                         currentStatus === 'out-of-stock' ? 'Out of Stock' : 'Discontinued'}
                      </span>
                    )
                  })()}
                </div>
                <div className="table-cell" style={{ textAlign: 'center' }}>
                  <span 
                    className="item-unit" 
                    style={{
                      color: '#2563eb',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      backgroundColor: '#dbeafe',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      display: 'inline-block'
                    }}
                  >
                    {item.unit}
                  </span>
              </div>
                <div className="table-cell" style={{ textAlign: 'center' }}>
                  <span 
                    className="item-price" 
                    style={{
                      fontWeight: '600',
                      color: '#2563eb',
                      fontSize: '0.875rem',
                      backgroundColor: '#dbeafe',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      display: 'inline-block'
                    }}
                  >
                    Rs. {item.price}
              </span>
                </div>
                <div className="table-cell" style={{ textAlign: 'center' }}>
                  <div className="table-actions" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
                    <button 
                      className="action-btn view" 
                      onClick={() => handleViewUsage(item)}
                      title="View Usage" 
                      style={{
                        width: '32px',
                        height: '32px',
                        padding: '0',
                        color: '#3b82f6',
                        borderRadius: '6px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#dbeafe'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'none'
                      }}
                    >
                      <i className="fas fa-eye" style={{ fontSize: '0.85rem' }}></i>
                    </button>
                <button
                      className="action-btn edit" 
                  onClick={() => handleEditItem(item)}
                      title="Edit" 
                      style={{
                        width: '32px',
                        height: '32px',
                        padding: '0',
                        color: '#3b82f6',
                        borderRadius: '6px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#dbeafe'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'none'
                      }}
                    >
                      <i className="fas fa-pen-to-square" style={{ fontSize: '0.85rem' }}></i>
                    </button>
                    <button 
                      className="action-btn print" 
                      onClick={() => handlePrintInventory()}
                      title="Print" 
                      style={{
                        width: '32px',
                        height: '32px',
                        padding: '0px',
                        color: '#eab308',
                        borderRadius: '6px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        transition: '0.2s ease-in-out',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#fef3c7'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'none'
                      }}
                    >
                      <i className="fas fa-print" style={{ fontSize: '0.85rem' }}></i>
                </button>
                <button
                      className="action-btn delete" 
                  onClick={() => handleDeleteItem(item.id)}
                      title="Delete" 
                      style={{
                        width: '32px',
                        height: '32px',
                        padding: '0',
                        color: '#ef4444',
                        borderRadius: '6px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#fee2e2'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'none'
                      }}
                    >
                      <i className="fas fa-trash" style={{ fontSize: '0.85rem' }}></i>
                    </button>
                  </div>
              </div>
            </motion.div>
          ))
        ) : (
            <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <i className="fas fa-boxes" style={{ fontSize: '64px', color: '#d1d5db' }}></i>
                <h3 style={{ fontSize: '20px', fontWeight: '500', color: '#374151' }}>No Inventory Items</h3>
                <p style={{ fontSize: '16px', color: '#6b7280' }}>Start by adding your first inventory item.</p>
              </div>
          </div>
        )}
        </div>

        {/* Pagination */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '16px 24px', 
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#374151', fontSize: '14px' }}>Show</span>
            <select 
              value={itemsPerPage} 
              style={{
                padding: '4px 8px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                backgroundColor: 'white',
                fontSize: '14px',
                cursor: 'pointer',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236b7280\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6,9 12,15 18,9\'%3e%3c/polyline%3e%3c/svg%3e")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 8px center',
                backgroundSize: '12px',
                paddingRight: '28px'
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span style={{ color: '#374151', fontSize: '14px' }}>records per page</span>
          </div>
          <div style={{ color: '#6b7280', fontSize: '14px' }}>
            Page {currentPage} of {totalPages}
          </div>
        </div>
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

      {/* Inventory Usage Modal */}
      <InventoryUsageModal
        item={viewingItem}
        isOpen={showUsageModal}
        onClose={() => {
          setShowUsageModal(false)
          setViewingItem(null)
        }}
        usageRecords={usageRecords}
      />

      {/* Record Usage Modal */}
      <RecordUsageModal
        isOpen={showRecordUsageModal}
        onClose={() => setShowRecordUsageModal(false)}
        onRecordUsage={handleRecordUsage}
        inventory={inventory}
        usageRecords={usageRecords}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && itemToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[9999999] max-w-none">
          <div className="modal-content bg-white rounded-xl shadow-2xl" style={{maxWidth: '400px', width: '90%'}}>
            <div className="modal-header flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 m-0">Confirm Delete</h3>
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="close bg-blue-600 hover:bg-blue-700 text-white hover:text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
              >
                ×
              </button>
            </div>
            <div style={{padding: '1.5rem'}}>
              <p style={{marginBottom: '1.5rem', color: '#374151', lineHeight: '1.5'}}>
                Are you sure you want to delete inventory item <strong>"{itemToDelete?.name}"</strong>? 
                This action cannot be undone.
              </p>
              <div className="form-actions flex gap-3 justify-end">
                <button 
                  type="button" 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[9999999] max-w-none">
          <div className="modal-content bg-white rounded-xl shadow-2xl" style={{maxWidth: '400px', width: '90%'}}>
            <div className="modal-header flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 m-0">Confirm Bulk Delete</h3>
              <button 
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="bg-blue-600 text-white border-none rounded-full w-9 h-9 cursor-pointer flex items-center justify-center text-lg transition-all duration-300 hover:bg-blue-700"
              >
                ×
              </button>
            </div>
            <div style={{padding: '1.5rem'}}>
              <p style={{marginBottom: '1.5rem', color: '#374151', lineHeight: '1.5'}}>
                Are you sure you want to delete <strong>{selectedItems.length} selected inventory item(s)</strong>? 
                <br /><br />
                <strong>Items:</strong> {selectedItems
                  .map(id => inventory.find(i => i.id === id)?.name)
                  .filter(Boolean)
                  .join(', ')}
                <br /><br />
                This action cannot be undone.
              </p>
              <div className="form-actions flex gap-3 justify-end">
                <button 
                  type="button" 
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={confirmBulkDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Delete All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
