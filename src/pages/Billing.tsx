import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Receipt, 
  RefreshCw
} from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { formatDate, formatCurrency } from '@/lib/utils'
import InvoiceForm from '@/components/InvoiceForm'
import InvoiceDetailsModal from '@/components/InvoiceDetailsModal'
import { Invoice } from '@/stores/useAppStore'

export default function Billing() {
  const [showInvoiceForm, setShowInvoiceForm] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [isReceiptEntry, setIsReceiptEntry] = useState(false)
  const [showInvoiceDetails, setShowInvoiceDetails] = useState(false)
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null)
  const [showImportDropdown, setShowImportDropdown] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [isRefreshingInvoices, setIsRefreshingInvoices] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null)
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)

  // Data refresh effect for invoices
  useEffect(() => {
    if (refreshTrigger > 0) {
      // Force re-render of invoice data by updating a state that affects the data
      console.log('Refreshing invoice data...')
      // This will trigger a re-render of the filtered and paginated data
    }
  }, [refreshTrigger])


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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showImportDropdown && !(event.target as Element).closest('.import-dropdown-container')) {
        setShowImportDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showImportDropdown])
  const [currentFilter, setCurrentFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  const { 
    invoices, 
    patients,
    appointments,
    addInvoice, 
    updateInvoice, 
    deleteInvoice 
  } = useAppStore()


  const statusFilters = [
    { value: 'all', label: 'All Invoices', icon: 'fas fa-file-invoice-dollar' },
    { value: 'paid', label: 'Paid', icon: 'fas fa-check-circle' },
    { value: 'pending', label: 'Pending', icon: 'fas fa-clock' },
    { value: 'overdue', label: 'Overdue', icon: 'fas fa-exclamation-triangle' }
  ]



  // Function to check if invoice is overdue
  const isInvoiceOverdue = (invoice: Invoice) => {
    const today = new Date()
    const dueDate = new Date(invoice.dueDate)
    return dueDate < today && invoice.status !== 'paid' && invoice.status !== 'cancelled'
  }

  // Function to get actual status (including overdue)
  const getActualStatus = (invoice: Invoice) => {
    if (isInvoiceOverdue(invoice)) {
      return 'overdue'
    }
    return invoice.status
  }

  // Filter invoices based on current filter and search
  const filteredInvoices = invoices.filter(invoice => {
    const actualStatus = getActualStatus(invoice)
    
    // Status filter
    let matchesStatusFilter = false
    if (currentFilter === 'all') {
      matchesStatusFilter = true
    } else if (currentFilter === 'unpaid') {
      matchesStatusFilter = actualStatus === 'pending' || actualStatus === 'overdue'
    } else {
      matchesStatusFilter = actualStatus === currentFilter
    }
    
    // Search filter
    const matchesSearch = searchTerm === '' || 
      invoice.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesStatusFilter && matchesSearch
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex)

  // Handle select all
  const handleSelectAll = () => {
    if (selectedInvoices.length === paginatedInvoices.length) {
      setSelectedInvoices([])
    } else {
      setSelectedInvoices(paginatedInvoices.map(invoice => invoice.id))
    }
  }

  // Handle individual selection
  const handleSelectInvoice = (invoiceId: string) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceId) 
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    )
  }


  const handleSaveInvoice = (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber'>) => {
    if (editingInvoice) {
      if (isReceiptEntry) {
        // If this is receipt entry, mark as paid and close form
        updateInvoice(editingInvoice.id, { 
          ...invoiceData, 
          status: 'paid',
          receiptNumber: (invoiceData as any).receiptNumber 
        })
        showToast('Invoice marked as paid with receipt number', 'success')
        setIsReceiptEntry(false)
      } else {
        // Regular edit
      updateInvoice(editingInvoice.id, invoiceData)
        showToast('Invoice updated successfully', 'success')
      }
      setEditingInvoice(null)
    } else {
      addInvoice({
        ...invoiceData,
        invoiceNumber: generateInvoiceNumber()
      })
      showToast('Invoice created successfully', 'success')
    }
    setShowInvoiceForm(false)
  }

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice)
    setIsReceiptEntry(false)
    setShowInvoiceForm(true)
  }

  const handleMarkAsPaid = (invoice: Invoice) => {
    const actualStatus = getActualStatus(invoice)
    
    if (actualStatus === 'paid') {
      // If already paid, mark as unpaid
      updateInvoice(invoice.id, { status: 'pending' })
      showToast('Invoice marked as unpaid', 'info')
    } else {
      // If not paid (pending or overdue), mark as paid
      if (invoice.paymentMethod === 'online') {
        // For online payments, open form for receipt entry
        setEditingInvoice(invoice)
        setIsReceiptEntry(true)
        setShowInvoiceForm(true)
      } else {
        // For cash payments, mark as paid directly
        updateInvoice(invoice.id, { status: 'paid' })
        showToast('Invoice marked as paid', 'success')
      }
    }
  }

  const handleViewInvoice = (invoice: Invoice) => {
    setViewingInvoice(invoice)
    setShowInvoiceDetails(true)
  }

  const generateInvoicePrintHTML = (invoice: Invoice, patient: any) => {
    const getStatusColor = (status: Invoice['status']) => {
      switch (status) {
        case 'paid': 
          return { bg: '#dcfce7', color: '#16a34a', text: '✅ Paid' }
        case 'pending': 
          return { bg: '#fef3c7', color: '#d97706', text: '⏳ Pending' }
        case 'overdue': 
          return { bg: '#fecaca', color: '#dc2626', text: '⚠️ Overdue' }
        case 'cancelled': 
          return { bg: '#f3f4f6', color: '#6b7280', text: '❌ Cancelled' }
        default: 
          return { bg: '#f3f4f6', color: '#6b7280', text: 'Unknown' }
      }
    }

    const statusInfo = getStatusColor(getActualStatus(invoice))

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoiceNumber}</title>
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
          .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; }
          .card { background: white; padding: 1rem; border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .card-label { font-weight: 600; color: #475569; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem; }
          .card-value { color: #1e293b; font-size: 1rem; font-weight: 500; }
          .status-badge { padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; display: inline-block; }
          table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          th { background: #2563eb; color: white; padding: 1rem; text-align: left; font-weight: 600; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; }
          td { padding: 1rem; border-bottom: 1px solid #f1f5f9; }
          .total-card { border: 2px solid #2563eb; }
          .total-amount { color: #2563eb; font-size: 1.3rem; font-weight: bold; }
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
          function printInvoice() {
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
            <button onclick="printInvoice()" style="padding: 12px 24px; background: #059669; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); transition: all 0.2s ease; display: flex; align-items: center; gap: 8px;" onmouseover="this.style.background='#047857'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 8px rgba(0, 0, 0, 0.15)'" onmouseout="this.style.background='#059669'; this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 6px rgba(0, 0, 0, 0.1)'">
              Print Invoice
            </button>
  
          </div>
          
          <div class="header">
            <h1>🦷 DentalCare Pro</h1>
            <h2>Professional Invoice</h2>
            <div class="tagline"><strong>Excellence in Dental Care</strong></div>
          </div>
          
          <div class="content">
            <div class="section">
              <h3>Invoice Details</h3>
              <div class="grid">
                <div class="card">
                  <div class="card-label">Invoice ID</div>
                  <div class="card-value">${invoice.id}</div>
                </div>
                <div class="card">
                  <div class="card-label">Invoice #</div>
                  <div class="card-value">${invoice.invoiceNumber}</div>
                </div>
                <div class="card">
                  <div class="card-label">Date</div>
                  <div class="card-value">${formatDate(invoice.invoiceDate)}</div>
                </div>
                <div class="card">
                  <div class="card-label">Due Date</div>
                  <div class="card-value">${formatDate(invoice.dueDate)}</div>
                </div>
                <div class="card">
                  <div class="card-label">Status</div>
                  <div class="card-value">
                    <span class="status-badge" style="background: ${statusInfo.bg}; color: ${statusInfo.color};">${statusInfo.text}</span>
                  </div>
                </div>
                <div class="card">
                  <div class="card-label">Payment Method</div>
                  <div class="card-value">${invoice.paymentMethod || 'Not specified'}</div>
                </div>
                ${invoice.receiptNumber ? `
                <div class="card">
                  <div class="card-label">Receipt Number</div>
                  <div class="card-value">${invoice.receiptNumber}</div>
                </div>
                ` : ''}
              </div>
            </div>
            
            <div class="section">
              <h3>Patient Information</h3>
              <div class="grid">
                <div class="card">
                  <div class="card-label">Patient Name</div>
                  <div class="card-value">${invoice.patientName}</div>
                </div>
                ${patient ? `
                <div class="card">
                  <div class="card-label">Phone Number</div>
                  <div class="card-value">${patient.phone}</div>
                </div>
                <div class="card">
                  <div class="card-label">Email Address</div>
                  <div class="card-value">${patient.email || 'Not provided'}</div>
                </div>
                <div class="card">
                  <div class="card-label">Age</div>
                  <div class="card-value">${patient.age} years</div>
                </div>
                <div class="card">
                  <div class="card-label">Gender</div>
                  <div class="card-value">${patient.gender}</div>
                </div>
                ` : ''}
              </div>
            </div>
            
            <div class="section">
              <h3>Treatments & Services</h3>
              <table>
                <thead>
                  <tr>
                    <th>Treatment</th>
                    <th style="text-align: center;">Qty</th>
                    <th style="text-align: right;">Unit Price</th>
                    <th style="text-align: right;">Discount</th>
                    <th style="text-align: right;">Amount (PKR)</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoice.treatments.map(treatment => `
                    <tr>
                      <td>
                        <div style="font-weight: 600; margin-bottom: 0.25rem;">${treatment.type}</div>
                        ${treatment.description ? `<div style="font-size: 0.875rem; color: #6b7280;">${treatment.description}</div>` : ''}
                      </td>
                      <td style="text-align: center;">${treatment.quantity}</td>
                      <td style="text-align: right;">${formatCurrency(treatment.unitPrice)}</td>
                      <td style="text-align: right; color: #059669;">-</td>
                      <td style="text-align: right; color: #0284c7; font-weight: 600;">${formatCurrency(treatment.total)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            
            <div class="section">
              <h3>Financial Summary</h3>
              <div class="grid">
                <div class="card">
                  <div class="card-label">Subtotal</div>
                  <div class="card-value">${formatCurrency(invoice.subtotal)}</div>
                </div>
                <div class="card">
                  <div class="card-label">Total Discount</div>
                  <div class="card-value" style="color: #059669;">- ${formatCurrency(invoice.discount)}</div>
                </div>
                <div class="card total-card">
                  <div class="card-label">Total Amount</div>
                  <div class="card-value total-amount">${formatCurrency(invoice.total)}</div>
                </div>
              </div>
            </div>
            
            ${invoice.notes ? `
            <div class="section">
              <h3>Additional Notes</h3>
              <div class="card">
                <div class="card-label">Invoice Notes</div>
                <div class="card-value" style="line-height: 1.6;">${invoice.notes}</div>
              </div>
            </div>
            ` : ''}
          </div>
          
          <div class="footer">
            <p style="margin: 0 0 0.5rem 0; color: #64748b; font-size: 1rem; font-weight: 500;">Thank you for choosing our dental services!</p>
            <p style="margin: 0; color: #94a3b8; font-size: 0.875rem;">Generated on: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  const handlePrintInvoice = (invoice: Invoice) => {
    console.log('Print button clicked for invoice:', invoice.id)
    
    // Find the patient for this invoice
    const patient = patients.find(p => p.id === invoice.patientId)
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    
    if (printWindow) {
      // Generate the print content
      const printContent = generateInvoicePrintHTML(invoice, patient)
      
      printWindow.document.write(printContent)
      printWindow.document.close()
      
      // Focus the window but don't auto-print
      printWindow.focus()
    } else {
      showToast('Please allow popups to print invoices', 'error')
    }
  }

  // Download sample CSV file for invoice import
  const downloadSampleInvoiceCSV = () => {
    const csvContent = `patientName,invoiceDate,dueDate,type,description,quantity,unitPrice,discount,status,paymentMethod,notes
John Doe,2025-01-15,2025-01-22,consultation,Initial consultation,1,1000,0,pending,cash,Regular checkup
Jane Smith,2025-01-15,2025-01-22,cleaning,Dental cleaning,1,1500,10,paid,online,Deep cleaning
Mike Johnson,2025-01-15,2025-01-22,filling,Cavity filling,2,800,0,pending,cash,Emergency treatment`

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'sample_invoices.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  // Download sample PDF file for invoice import
  const downloadSampleInvoicePDF = () => {
    // This would typically use a PDF library like jsPDF
    // For now, we'll just show a message
    alert('PDF sample download functionality would be implemented here')
  }

  const handleDeleteInvoice = (invoiceId: string) => {
    const invoice = invoices.find(inv => inv.id === invoiceId)
    if (invoice) {
      setInvoiceToDelete(invoice)
      setShowDeleteConfirm(true)
    }
  }

  const confirmDeleteInvoice = () => {
    if (invoiceToDelete) {
      deleteInvoice(invoiceToDelete.id)
      setShowDeleteConfirm(false)
      setInvoiceToDelete(null)
      showToast('Invoice deleted successfully', 'success')
    }
  }

  const cancelDeleteInvoice = () => {
    setShowDeleteConfirm(false)
    setInvoiceToDelete(null)
  }

  const handleBulkDeleteInvoices = () => {
    if (selectedInvoices.length > 0) {
      setShowBulkDeleteConfirm(true)
    }
  }

  const confirmBulkDeleteInvoices = () => {
    selectedInvoices.forEach(invoiceId => {
      deleteInvoice(invoiceId)
    })
    setSelectedInvoices([])
    setShowBulkDeleteConfirm(false)
    showToast(`${selectedInvoices.length} invoices deleted successfully`, 'success')
    }

  const cancelBulkDeleteInvoices = () => {
    setShowBulkDeleteConfirm(false)
  }

  const generateInvoiceNumber = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `INV-${year}${month}${day}-${random}`
  }



  return (
    <div>

      {/* Invoice Filters and Actions */}
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 mb-6">
        <div className="patient-filters-container" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div className="flex items-center gap-2">
          <div className="relative">
          <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white border border-blue-600 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <i className="fas fa-file-invoice-dollar"></i>
                {statusFilters.find(f => f.value === currentFilter)?.label || 'All Invoices'}
              <i className={`fas fa-chevron-${showFilterDropdown ? 'up' : 'down'}`}></i>
          </button>
              
              {/* Dropdown Menu */}
            {showFilterDropdown && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  {statusFilters.map((filter) => (
                    <button
                      key={filter.value}
                  onClick={() => {
                        setCurrentFilter(filter.value)
                    setShowFilterDropdown(false)
                  }}
                      className={`w-full px-3 py-2 text-left text-sm rounded transition-colors ${
                        currentFilter === filter.value
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:bg-blue-50'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
        </div>
              )}
          </div>
          </div>
          <div className="patient-actions" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <button 
              className="btn btn-primary"
              onClick={() => setShowInvoiceForm(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus w-4 h-4"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
               Create Invoice
            </button>

            {/* Import Button with Dropdown */}
            <div className="relative import-dropdown-container">
              <button 
                onClick={() => setShowImportDropdown(!showImportDropdown)}
                className="flex items-center justify-center w-10 h-10 bg-primary-500 rounded-lg text-white hover:bg-primary-600"
                title="Import Invoices"
              >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-upload w-4 h-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" x2="12" y1="3" y2="15"></line></svg>
              </button>
              
              {/* Import Dropdown */}
              {showImportDropdown && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <div className="p-2">
                    <div className="text-xs font-medium text-gray-500 mb-2 px-2">Select file type to import:</div>
                    <button
                  onClick={() => {
                        document.getElementById('import-invoice-csv-input')?.click()
                        setShowImportDropdown(false)
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
                    >
                      CSV File
                    </button>
                    <button
                  onClick={() => {
                        document.getElementById('import-invoice-pdf-input')?.click()
                        setShowImportDropdown(false)
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
                    >
                      PDF File
                    </button>
                    <div className="border-t border-gray-200 my-2"></div>
            <button 
                      onClick={() => downloadSampleInvoiceCSV()}
                      className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
                      <i className="fas fa-download w-4 h-4"></i>
                      Download Sample CSV
            </button>
            <button 
                      onClick={() => downloadSampleInvoicePDF()}
                      className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
                      <i className="fas fa-download w-4 h-4"></i>
                      Download Sample PDF
            </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Refresh Button */}
            <button 
              onClick={() => {
                setIsRefreshingInvoices(true)
                showToast('Refreshing invoices list...', 'success')
                // Reset search and filters
                setSearchTerm('')
                setCurrentFilter('all')
                setShowFilterDropdown(false)
                setSelectedInvoices([])
                // Reset to first page
                setCurrentPage(1)
                // Close any open dropdowns
                setShowImportDropdown(false)
                // Trigger data refresh
                setRefreshTrigger(prev => prev + 1)
                // Stop loading immediately
                setIsRefreshingInvoices(false)
              }}
              disabled={isRefreshingInvoices}
              className="flex items-center justify-center w-10 h-10 bg-white border border-primary-500 rounded-lg text-primary-500 hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh Invoices"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshingInvoices ? 'animate-spin' : ''}`} />
            </button>
          </div>
          </div>
      </div>
        
        {/* Hidden file inputs for invoice import */}
        <input 
          type="file" 
          id="import-invoice-csv-input" 
          accept=".csv" 
          style={{display: 'none'}}
        />
        <input 
          type="file" 
          id="import-invoice-pdf-input" 
          accept=".pdf" 
          style={{display: 'none'}}
        />

        {/* Active Filters Display */}
        <div className="mt-4 flex flex-wrap gap-2 p-4 ">
          {currentFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full border border-blue-200">
              <i className="fas fa-filter text-blue-600"></i>
              Status: {statusFilters.find(f => f.value === currentFilter)?.label}
              <button
                onClick={() => setCurrentFilter('all')}
                className="ml-1 text-blue-600 hover:text-blue-800 transition-colors duration-200"
                title="Remove filter"
              >
                <i className="fas fa-times text-xs"></i>
              </button>
            </span>
          )}
          {searchTerm && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full border border-yellow-200">
              <i className="fas fa-search text-yellow-600"></i>
              Search: "{searchTerm}"
              <button
                onClick={() => setSearchTerm('')}
                className="ml-1 text-yellow-600 hover:text-yellow-800 transition-colors duration-200"
                title="Clear search"
              >
                <i className="fas fa-times text-xs"></i>
              </button>
            </span>
          )}
          {(currentFilter !== 'all' || searchTerm) && (
            <button
              onClick={() => {
                setCurrentFilter('all')
                setSearchTerm('')
              }}
              className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full hover:bg-red-200 transition-colors duration-200 border border-red-200 hover:border-red-300"
              title="Clear all filters"
            >
              <i className="fas fa-times text-red-600"></i>
              Clear All
            </button>
          )}
        </div>

      {/* Search Bar */}
      <div className="relative mb-6 bg-white border border-gray-300 rounded-lg p-2 shadow-sm">
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 pr-12 rounded-lg text-base bg-white focus:outline-none focus:border-primary-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]"
              />
        <i className="fas fa-search absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"></i>
            </div>

      {/* Invoice List */}
      <div key={`invoices-container-${refreshTrigger}`} className="invoice-container">
        <div key={`invoices-list-${refreshTrigger}`} className="invoice-list" data-current-page={currentPage}>
          <div 
            className="invoice-grid-container" 
            style={{
              background: 'var(--white)', 
              borderRadius: 'var(--radius-lg)', 
              boxShadow: 'var(--shadow-md)', 
              padding: '1.5rem', 
              marginBottom: '1rem'
            }}
          >
            {/* Count Display at the top of the grid */}
            <div style={{
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '0 0 1rem 0', 
              borderBottom: '1px solid var(--gray-200)', 
              marginBottom: '1.5rem'
            }}>
              <div style={{
                color: 'var(--gray-700)', 
                fontWeight: '600', 
                fontSize: '1rem'
              }}>
                Total Invoices: <span style={{color: 'var(--primary-color)'}}>{filteredInvoices.length}</span>
              </div>
              <div style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem'
              }}>
                <div style={{
                  color: 'var(--gray-600)', 
                  fontSize: '0.875rem'
                }}>
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredInvoices.length)} of {filteredInvoices.length} invoices
            </div>
                <button 
                  onClick={handleBulkDeleteInvoices}
                  style={{
                    padding: '0.5rem 1rem', 
                    background: 'var(--error-color)', 
                    color: 'var(--white)', 
                    border: 'none', 
                    borderRadius: 'var(--radius-md)', 
                    cursor: 'pointer', 
                    fontWeight: '500', 
                    transition: 'all 0.2s ease', 
                    display: selectedInvoices.length > 0 ? 'block' : 'none'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
                  onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                >
                  <i className="fas fa-trash-alt" style={{marginRight: '0.5rem'}}></i>
                  Delete Selected
            </button>
          </div>
            </div>

            {/* Select All Header (Invoice) */}
            <div key={`invoices-header-${refreshTrigger}`} style={{
              display: 'flex', 
              alignItems: 'center', 
              gap: '1.5rem', 
              padding: '1rem', 
              background: 'var(--gray-50)', 
              borderBottom: '1px solid var(--gray-200)', 
              fontWeight: '600', 
              color: 'var(--gray-700)'
            }}>
              <div style={{
                minWidth: '120px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem'
              }}>
                <input 
                  type="checkbox" 
                  checked={selectedInvoices.length === paginatedInvoices.length && paginatedInvoices.length > 0}
                  onChange={handleSelectAll}
                  style={{
                    width: '14px', 
                    height: '14px', 
                    cursor: 'pointer'
                  }}
                />
                <span style={{
                  fontSize: '0.875rem', 
                  color: 'var(--primary-color)'
                }}>
                  Select All
                </span>
              </div>
              <div style={{
                flex: 1, 
                textAlign: 'center', 
                fontSize: '0.875rem', 
                color: 'var(--primary-color)'
              }}>
                Invoice Information
              </div>
              <div style={{
                minWidth: '200px', 
                textAlign: 'center', 
                fontSize: '0.875rem', 
                color: 'var(--primary-color)'
              }}>
                Actions
        </div>
      </div>

            {/* Invoice Rows */}
            {paginatedInvoices.length > 0 ? (
              paginatedInvoices.map((invoice, index) => (
              <motion.div
                key={`invoice-${invoice.id}-${refreshTrigger}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                  className="invoice-row"
                  style={{
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '1.5rem', 
                    padding: '1rem', 
                    borderBottom: 'none', 
                    transition: 'background-color 0.2s', 
                    cursor: 'pointer', 
                    backgroundColor: 'transparent'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--gray-100)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {/* Entry Number & Icon */}
                  <div style={{
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '1rem', 
                    minWidth: '120px'
                  }}>
                    <input 
                      type="checkbox" 
                      checked={selectedInvoices.includes(invoice.id)}
                      onChange={() => handleSelectInvoice(invoice.id)}
                      style={{
                        width: '14px', 
                        height: '14px', 
                        cursor: 'pointer'
                      }}
                    />
                    <div style={{
                      width: '40px', 
                      height: '40px', 
                      background: 'var(--primary-light)', 
                      color: 'var(--primary-color)', 
                      borderRadius: 'var(--radius-lg)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontWeight: '600', 
                      fontSize: 'var(--font-size-sm)'
                    }}>
                      {index + 1}
                    </div>
                    <div style={{
                      width: '50px', 
                      height: '50px', 
                      background: 'var(--primary-light)', 
                      borderRadius: '50%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      color: 'var(--primary-color)', 
                      fontSize: '1.5rem'
                    }}>
                      <i className="fas fa-file-invoice-dollar"></i>
                    </div>
                  </div>
                  
                  {/* Invoice Details (Left Block) */}
                  <div style={{
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '0.5rem', 
                    flex: 1
                  }}>
                    <div style={{
                      background: 'var(--primary-light)', 
                      color: 'var(--primary-color)', 
                      padding: '0.5rem 1rem', 
                      borderRadius: 'var(--radius-lg)', 
                      fontWeight: '600', 
                      fontSize: 'var(--font-size-sm)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem'
                    }}>
                      <i className="fas fa-user" style={{fontSize: '0.875rem'}}></i>
                        {invoice.patientName}
                      </div>
                    <div style={{
                      background: 'var(--primary-light)', 
                      color: 'var(--primary-color)', 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: 'var(--radius-md)', 
                      fontSize: 'var(--font-size-xs)', 
                      fontWeight: '500', 
                      width: 'fit-content'
                    }}>
                      {formatDate(invoice.invoiceDate)}
                    </div>
                  </div>
                  
                  {/* Invoice Details (Middle Block) */}
                  <div style={{
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '0.5rem', 
                    minWidth: '200px'
                  }}>
                    <div style={{
                      background: 'var(--primary-light)', 
                      color: 'var(--primary-color)', 
                      padding: '0.5rem 1rem', 
                      borderRadius: 'var(--radius-lg)', 
                      fontSize: 'var(--font-size-sm)', 
                      fontWeight: '500'
                    }}>
                      <i className="fas fa-hashtag" style={{marginRight: '0.5rem'}}></i>
                      {invoice.invoiceNumber}
                    </div>
                    <div style={{
                      background: 'var(--primary-light)', 
                      color: 'var(--primary-color)', 
                      padding: '0.5rem 1rem', 
                      borderRadius: 'var(--radius-lg)', 
                      fontSize: 'var(--font-size-sm)', 
                      fontWeight: '500'
                    }}>
                      <i className="fas fa-money-bill-wave" style={{marginRight: '0.5rem'}}></i>
                        {formatCurrency(invoice.total)}
                      </div>
                    <div style={{
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem'
                    }}>
                      <span style={{
                        background: getActualStatus(invoice) === 'paid' ? 'var(--success-color)' : 
                                   getActualStatus(invoice) === 'pending' ? 'var(--warning-color)' : 
                                   getActualStatus(invoice) === 'overdue' ? 'var(--error-color)' :
                                   'var(--error-color)', 
                        color: 'var(--white)', 
                        padding: '0.5rem 1rem', 
                        borderRadius: 'var(--radius-lg)', 
                        fontSize: 'var(--font-size-sm)', 
                        fontWeight: '500', 
                        textAlign: 'center'
                      }}>
                        {getActualStatus(invoice)}
                      </span>
                      <button
                        onClick={() => handleMarkAsPaid(invoice)}
                        style={{
                          width: '36px', 
                          height: '36px', 
                          padding: '0', 
                          background: getActualStatus(invoice) === 'paid' ? 'var(--warning-color)' : 'var(--success-color)', 
                          color: 'var(--white)', 
                          borderRadius: 'var(--radius-md)', 
                          border: 'none', 
                          cursor: 'pointer', 
                          transition: 'all 0.2s ease-in-out'
                        }}
                        title={getActualStatus(invoice) === 'paid' ? 'Mark as Unpaid' : 'Mark as Paid'}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <i className={getActualStatus(invoice) === 'paid' ? 'fas fa-undo' : 'fas fa-check-circle'}></i>
                      </button>
                      <button
                        style={{
                          width: '36px', 
                          height: '36px', 
                          padding: '0px', 
                          background: 'var(--warning-color)', 
                          color: 'var(--white)', 
                          borderRadius: 'var(--radius-md)', 
                          border: 'none', 
                          cursor: 'pointer', 
                          transition: '0.2s ease-in-out', 
                          transform: 'scale(1)'
                        }}
                        title="Mark as Unpaid"
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <i className="fas fa-clock"></i>
                      </button>
                    </div>
                </div>
                
                  {/* Action Buttons (Right Block) */}
                  <div style={{
                    display: 'flex', 
                    gap: '0.5rem', 
                    flexShrink: 0
                  }}>
                    <button 
                      onClick={() => handleViewInvoice(invoice)}
                      style={{
                        width: '40px', 
                        height: '40px', 
                        padding: '0', 
                        background: 'var(--primary-light)', 
                        color: 'var(--primary-color)', 
                        borderRadius: 'var(--radius-md)', 
                        border: 'none', 
                        cursor: 'pointer', 
                        transition: 'all 0.2s ease-in-out'
                      }}
                      title="View Details"
                      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                      <button
                        onClick={() => handleEditInvoice(invoice)}
                      style={{
                        width: '40px', 
                        height: '40px', 
                        padding: '0', 
                        background: 'var(--primary-light)', 
                        color: 'var(--primary-color)', 
                        borderRadius: 'var(--radius-md)', 
                        border: 'none', 
                        cursor: 'pointer', 
                        transition: 'all 0.2s ease-in-out'
                      }}
                      title="Update Invoice"
                      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button 
                      onClick={() => handlePrintInvoice(invoice)}
                      style={{
                        width: '40px', 
                        height: '40px', 
                        padding: '0', 
                        background: 'var(--white)', 
                        color: 'var(--warning-color)', 
                        border: '1px solid var(--warning-color)', 
                        borderRadius: 'var(--radius-md)', 
                        cursor: 'pointer', 
                        transition: 'all 0.2s ease-in-out'
                      }}
                      title="Print"
                      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <i className="fas fa-print"></i>
                      </button>
                      <button
                        onClick={() => handleDeleteInvoice(invoice.id)}
                      style={{
                        width: '40px', 
                        height: '40px', 
                        padding: '0', 
                        background: 'var(--white)', 
                        color: 'var(--error-color)', 
                        border: '1px solid var(--error-color)', 
                        borderRadius: 'var(--radius-md)', 
                        cursor: 'pointer', 
                        transition: 'all 0.2s ease-in-out'
                      }}
                      title="Delete"
                      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <i className="fas fa-trash"></i>
                      </button>
                    </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Receipt className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-medium mb-2">No invoices found</h3>
              <p>Create your first invoice to get started</p>
        </div>
      )}

            {/* Pagination Controls */}
            <div key={`invoices-pagination-${refreshTrigger}`} style={{
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              gap: '0.5rem', 
              marginTop: '2rem', 
              padding: '1rem', 
              borderTop: '1px solid var(--gray-200)', 
              flexWrap: 'wrap'
            }}>
              <div style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                color: 'var(--gray-600)', 
                fontSize: '0.875rem'
              }}>
                <span>Show</span>
                <select 
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  style={{
                    padding: '0.25rem 0.5rem', 
                    border: '1px solid var(--gray-300)', 
                    borderRadius: 'var(--radius-md)', 
                    background: 'var(--white)', 
                    color: 'var(--gray-700)', 
                    fontSize: '0.875rem', 
                    cursor: 'pointer'
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                  <option value={filteredInvoices.length}>All</option>
                </select>
                <span>Invoices</span>
            </div>
              <div style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem'
              }}>
                <div style={{
                  color: 'var(--gray-600)', 
                  fontSize: '0.875rem', 
                  marginLeft: '1rem'
                }}>
                  Page {currentPage} of {totalPages}
            </div>
            </div>
          </div>
                      </div>
                      </div>
                    </div>


      {/* Invoice Form Modal */}
      {showInvoiceForm && (
        <InvoiceForm
          invoice={editingInvoice}
          patients={patients}
          appointments={appointments}
          onSave={handleSaveInvoice}
          onClose={() => {
            setShowInvoiceForm(false)
            setEditingInvoice(null)
            setIsReceiptEntry(false)
          }}
          isReceiptEntry={isReceiptEntry}
        />
      )}

      {/* Invoice Details Modal */}
      {showInvoiceDetails && viewingInvoice && (
        <InvoiceDetailsModal
          invoice={viewingInvoice}
          patient={patients.find(p => p.id === viewingInvoice.patientId) || null}
          isOpen={showInvoiceDetails}
          onClose={() => {
            setShowInvoiceDetails(false)
            setViewingInvoice(null)
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && invoiceToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[99999] max-w-none">
          <div className="modal-content bg-white rounded-xl shadow-2xl" style={{maxWidth: '400px', width: '90%'}}>
            <div className="modal-header flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 m-0">Confirm Delete</h3>
              <button
                className="close bg-blue-600 hover:bg-blue-700 text-white hover:text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                onClick={cancelDeleteInvoice}
              >
                ×
              </button>
            </div>
            <div style={{padding: '1.5rem'}}>
              <p style={{marginBottom: '1.5rem', color: '#374151', lineHeight: '1.5'}}>
                Are you sure you want to delete invoice <strong>"{invoiceToDelete?.invoiceNumber}"</strong> for <strong>"{invoiceToDelete?.patientName}"</strong>? 
                This action cannot be undone.
              </p>
              <div className="form-actions flex gap-3 justify-end">
                <button
                  type="button" 
                  className="btn btn-secondary px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={cancelDeleteInvoice}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary px-4 py-2 bg-red-600 text-white border border-red-600 rounded-lg hover:bg-red-700 transition-colors"
                  onClick={confirmDeleteInvoice}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[99999] max-w-none">
          <div className="modal-content bg-white rounded-xl shadow-2xl" style={{maxWidth: '400px', width: '90%'}}>
            <div className="modal-header flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 m-0">Confirm Bulk Delete</h3>
              <button
                className="close bg-blue-600 hover:bg-blue-700 text-white hover:text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                onClick={cancelBulkDeleteInvoices}
              >
                ×
              </button>
            </div>
            <div style={{padding: '1.5rem'}}>
              <p style={{marginBottom: '1.5rem', color: '#374151', lineHeight: '1.5'}}>
                Are you sure you want to delete <strong>{selectedInvoices.length} selected invoice{selectedInvoices.length !== 1 ? 's' : ''}</strong>? 
                <br /><br />
                <strong>Invoices:</strong> {selectedInvoices
                  .map(id => invoices.find(inv => inv.id === id)?.invoiceNumber)
                  .filter(Boolean)
                  .join(', ')}
                <br /><br />
                This action cannot be undone.
              </p>
              <div className="form-actions flex gap-3 justify-end">
                <button
                  type="button" 
                  className="btn btn-secondary px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={cancelBulkDeleteInvoices}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary px-4 py-2 bg-red-600 text-white border border-red-600 rounded-lg hover:bg-red-700 transition-colors"
                  onClick={confirmBulkDeleteInvoices}
                >
                  Delete All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
