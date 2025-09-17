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
      addInventoryItem({
        ...itemData,
        id: Math.random().toString(36).substr(2, 9)
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
      // Add usage record to the store
      const usageRecord = {
        id: `usage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
    const totalItems = inventory.length
    const inStockItems = inventory.filter(item => getItemStatus(item.id, item.quantity) === 'in-stock').length
    const lowStockItems = inventory.filter(item => getItemStatus(item.id, item.quantity) === 'low-stock').length
    const outOfStockItems = inventory.filter(item => getItemStatus(item.id, item.quantity) === 'out-of-stock').length
    const discontinuedItems = inventory.filter(item => item.status === 'discontinued').length

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Inventory Report - ${currentDate}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
          .container { width: 100%; margin: 0 auto; background: white; }
          .header { background: #dbeafe; color: #2563eb; padding: 2rem; text-align: center; position: relative; overflow: hidden; }
          .header h1 { margin: 0; font-size: 2.5rem; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.3); }
          .header h2 { margin: 0.5rem 0 0 0; font-size: 1.5rem; font-weight: 400; opacity: 0.9; }
          .header .tagline { background: rgba(255,255,255,0.1); padding: 1rem; border-radius: 12px; margin-top: 1rem; backdrop-filter: blur(10px); }
          .content { padding: 2rem; }
          .section { margin-bottom: 2rem; background: #f8fafc; border-radius: 12px; padding: 1.5rem; }
          .section h3 { margin: 0 0 1rem 0; color: #2563eb; font-size: 1.25rem; font-weight: 600; }
          .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
          .card { background: white; padding: 1rem; border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .card-label { font-weight: 600; color: #475569; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem; }
          .card-value { color: #1e293b; font-size: 1rem; font-weight: 500; }
          .status-badge { padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; display: inline-block; }
          table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          th { background: #2563eb; color: white; padding: 1rem; text-align: left; font-weight: 600; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; }
          td { padding: 1rem; border-bottom: 1px solid #f1f5f9; }
          .footer { background: #f8fafc; padding: 2rem; text-align: center; border-top: 1px solid #e2e8f0; }
          .print-controls { 
            position: fixed; 
            top: 20px; 
            right: 20px; 
            z-index: 1000; 
            display: flex; 
            gap: 12px; 
            align-items: center;
          }
          @media print { body { margin: 0; } .container { box-shadow: none; } .print-controls { display: none !important; } }
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
        <div class="container">
          <!-- Print Controls -->
          <div class="print-controls">
            <button onclick="printInventory()" style="padding: 12px 24px; background: #059669; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); transition: all 0.2s ease; display: flex; align-items: center; gap: 8px;" onmouseover="this.style.background='#047857'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 8px rgba(0, 0, 0, 0.15)'" onmouseout="this.style.background='#059669'; this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 6px rgba(0, 0, 0, 0.1)'">
              Print Inventory
            </button>
            <button onclick="closeWindow()" style="padding: 12px 24px; background: #dc2626; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); transition: all 0.2s ease; display: flex; align-items: center; gap: 8px;" onmouseover="this.style.background='#b91c1c'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 8px rgba(0, 0, 0, 0.15)'" onmouseout="this.style.background='#dc2626'; this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 6px rgba(0, 0, 0, 0.1)'">
              Close
            </button>
          </div>
          
          <div class="header">
            <h1>📦 DentalCare Pro</h1>
            <h2>Inventory Report</h2>
            <div class="tagline"><strong>Generated on ${currentDate}</strong></div>
          </div>
          
          <div class="content">
            <div class="section">
              <h3>Inventory Summary</h3>
              <div class="grid">
                <div class="card">
                  <div class="card-label">Total Items</div>
                  <div class="card-value">${totalItems}</div>
                </div>
                <div class="card">
                  <div class="card-label">In Stock</div>
                  <div class="card-value" style="color: #16a34a;">${inStockItems}</div>
                </div>
                <div class="card">
                  <div class="card-label">Low Stock</div>
                  <div class="card-value" style="color: #d97706;">${lowStockItems}</div>
                </div>
                <div class="card">
                  <div class="card-label">Out of Stock</div>
                  <div class="card-value" style="color: #dc2626;">${outOfStockItems}</div>
                </div>
                <div class="card">
                  <div class="card-label">Discontinued</div>
                  <div class="card-value" style="color: #6b7280;">${discontinuedItems}</div>
                </div>
              </div>
            </div>
            
            <div class="section">
              <h3>Inventory Items</h3>
              <table>
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Category</th>
                    <th>Vendor</th>
                    <th style="text-align: center;">Total</th>
                    <th style="text-align: center;">Remaining</th>
                    <th style="text-align: center;">Status</th>
                    <th style="text-align: center;">Unit</th>
                    <th style="text-align: right;">Price (PKR)</th>
                  </tr>
                </thead>
                <tbody>
                  ${inventory.map(item => {
                    const remaining = getRemainingQuantity(item.id, item.quantity)
                    const status = getItemStatus(item.id, item.quantity)
                    const statusInfo = status === 'in-stock' ? { bg: '#dcfce7', color: '#16a34a', text: 'Available' } :
                                      status === 'low-stock' ? { bg: '#fef3c7', color: '#d97706', text: 'Low Stock' } :
                                      status === 'out-of-stock' ? { bg: '#fecaca', color: '#dc2626', text: 'Out of Stock' } :
                                      { bg: '#f3f4f6', color: '#6b7280', text: 'Discontinued' }
                    
                    return `
                      <tr>
                        <td>
                          <div style="font-weight: 600; margin-bottom: 0.25rem;">${item.name}</div>
                          ${item.notes ? `<div style="font-size: 0.875rem; color: #6b7280;">${item.notes}</div>` : ''}
                        </td>
                        <td>${item.category}</td>
                        <td>${item.vendor}</td>
                        <td style="text-align: center;">${item.quantity}</td>
                        <td style="text-align: center;">${remaining}</td>
                        <td style="text-align: center;">
                          <span class="status-badge" style="background: ${statusInfo.bg}; color: ${statusInfo.color};">${statusInfo.text}</span>
                        </td>
                        <td style="text-align: center;">${item.unit}</td>
                        <td style="text-align: right; font-weight: 600;">Rs. ${item.price}</td>
                      </tr>
                    `
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
          
          <div class="footer">
            <p style="color: #6b7280; font-size: 0.875rem;">
              This report was generated on ${currentDate} by DentalCare Pro Inventory Management System
            </p>
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
        <button 
          onClick={handlePrintInventory}
          className="flex items-center justify-center w-12 h-12 bg-white border border-primary-500 rounded-lg text-primary-500 hover:bg-primary-50 transition-colors"
          title="Print Inventory"
        >
          <i className="fas fa-print w-4 h-4"></i>
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
                        e.currentTarget.style.transform = 'scale(1.1)'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'scale(1)'
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
                        e.currentTarget.style.transform = 'scale(1.1)'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'scale(1)'
                      }}
                    >
                      <i className="fas fa-pen-to-square" style={{ fontSize: '0.85rem' }}></i>
                    </button>
                    <button 
                      className="action-btn print" 
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
                        justifyContent: 'center',
                        transform: 'scale(1)'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'scale(1)'
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
                        e.currentTarget.style.transform = 'scale(1.1)'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'scale(1)'
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
                fontSize: '14px'
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
