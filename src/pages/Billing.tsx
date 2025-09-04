import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  DollarSign, 
  CreditCard, 
  Receipt, 
  TrendingUp, 
  Plus,
  Edit,
  Trash2,
  Download,
  Filter,
  Search,
  Eye,
  Printer
} from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { formatDate, formatCurrency } from '@/lib/utils'
import InvoiceForm from '@/components/InvoiceForm'
import { Invoice, Treatment } from '@/stores/useAppStore'

export default function Billing() {
  const [activeTab, setActiveTab] = useState('invoices')
  const [showInvoiceForm, setShowInvoiceForm] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [currentFilter, setCurrentFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  const { 
    invoices, 
    treatments,
    addInvoice, 
    updateInvoice, 
    deleteInvoice 
  } = useAppStore()

  const tabs = [
    { id: 'invoices', label: 'Invoices', icon: Receipt },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'reports', label: 'Reports', icon: TrendingUp }
  ]

  const filters = [
    { value: 'all', label: 'All Invoices' },
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'cancelled', label: 'Cancelled' }
  ]

  // Filter invoices based on current filter and search
  const filteredInvoices = invoices.filter(invoice => {
    const matchesFilter = currentFilter === 'all' || invoice.status === currentFilter
    const matchesSearch = searchTerm === '' || 
      invoice.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  // Calculate statistics
  const totalInvoices = invoices.length
  const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0)
  const paidAmount = invoices
    .filter(invoice => invoice.status === 'paid')
    .reduce((sum, invoice) => sum + invoice.totalAmount, 0)
  const pendingAmount = invoices
    .filter(invoice => invoice.status === 'pending')
    .reduce((sum, invoice) => sum + invoice.totalAmount, 0)
  const overdueAmount = invoices
    .filter(invoice => invoice.status === 'overdue')
    .reduce((sum, invoice) => sum + invoice.totalAmount, 0)

  const handleSaveInvoice = (invoiceData: Omit<Invoice, 'id'>) => {
    if (editingInvoice) {
      updateInvoice(editingInvoice.id, invoiceData)
      setEditingInvoice(null)
    } else {
      addInvoice({
        ...invoiceData,
        id: Math.random().toString(36).substr(2, 9),
        invoiceNumber: generateInvoiceNumber()
      })
    }
    setShowInvoiceForm(false)
  }

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice)
    setShowInvoiceForm(true)
  }

  const handleDeleteInvoice = (invoiceId: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      deleteInvoice(invoiceId)
    }
  }

  const generateInvoiceNumber = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `INV-${year}${month}${day}-${random}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return '💵'
      case 'credit_card': return '💳'
      case 'bank_transfer': return '🏦'
      case 'insurance': return '🛡️'
      default: return '💰'
    }
  }

  const calculateDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate)
    const today = new Date()
    const diffTime = today.getTime() - due.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  return (
    <div className="p-6">
      {/* Billing Header */}
      <div className="mb-6 p-6 bg-white border border-gray-200 rounded-2xl shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Billing & Invoices</h2>
            <p className="text-gray-600">Manage patient invoices and payment tracking</p>
          </div>
          <button
            onClick={() => setShowInvoiceForm(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Invoice
          </button>
        </div>
      </div>

      {/* Billing Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="stat-card"
        >
          <div className="stat-icon bg-blue-100 text-blue-500">
            <Receipt className="w-8 h-8" />
          </div>
          <div className="stat-info">
            <h3 className="text-3xl font-bold text-gray-800 mb-1">
              {totalInvoices}
            </h3>
            <p className="text-gray-600 font-medium text-sm">Total Invoices</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="stat-card"
        >
          <div className="stat-icon bg-green-100 text-green-500">
            <DollarSign className="w-8 h-8" />
          </div>
          <div className="stat-info">
            <h3 className="text-3xl font-bold text-gray-800 mb-1">
              {formatCurrency(totalAmount)}
            </h3>
            <p className="text-gray-600 font-medium text-sm">Total Amount</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="stat-card"
        >
          <div className="stat-icon bg-yellow-100 text-yellow-500">
            <CreditCard className="w-8 h-8" />
          </div>
          <div className="stat-info">
            <h3 className="text-3xl font-bold text-gray-800 mb-1">
              {formatCurrency(pendingAmount)}
            </h3>
            <p className="text-gray-600 font-medium text-sm">Pending Amount</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="stat-card"
        >
          <div className="stat-icon bg-red-100 text-red-500">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div className="stat-info">
            <h3 className="text-3xl font-bold text-gray-800 mb-1">
              {formatCurrency(overdueAmount)}
            </h3>
            <p className="text-gray-600 font-medium text-sm">Overdue Amount</p>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-md">
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-sm font-medium cursor-pointer transition-all duration-150 min-h-[44px] whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="flex gap-4 items-center justify-between flex-wrap">
          <div className="flex gap-2 mb-4">
            {filters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setCurrentFilter(filter.value)}
                className={`px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm font-medium cursor-pointer transition-all duration-150 ${
                  currentFilter === filter.value
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="flex gap-3 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button className="action-btn export-btn">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          {filteredInvoices.length > 0 ? (
            filteredInvoices.map((invoice, index) => (
              <motion.div
                key={invoice.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Receipt className="w-6 h-6 text-primary-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-1">
                        {invoice.patientName}
                      </h3>
                      <p className="text-gray-600 mb-2">Invoice #{invoice.invoiceNumber}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Date: {formatDate(invoice.date)}</span>
                        <span>Due: {formatDate(invoice.dueDate)}</span>
                        {invoice.status === 'overdue' && (
                          <span className="text-red-600 font-medium">
                            {calculateDaysOverdue(invoice.dueDate)} days overdue
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-800">
                        {formatCurrency(invoice.totalAmount)}
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditInvoice(invoice)}
                        className="action-btn edit-btn"
                        title="Edit Invoice"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteInvoice(invoice.id)}
                        className="action-btn delete-btn"
                        title="Delete Invoice"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Invoice Items */}
                <div className="mt-4 space-y-2">
                  {invoice.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <div>
                        <span className="font-medium text-gray-800">{item.description}</span>
                        <span className="text-sm text-gray-500 ml-2">x{item.quantity}</span>
                      </div>
                      <span className="font-medium text-gray-800">
                        {formatCurrency(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Payment Information */}
                {invoice.paymentMethod && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>Payment Method: {getPaymentMethodIcon(invoice.paymentMethod)} {invoice.paymentMethod}</span>
                      {invoice.paymentDate && (
                        <span>• Paid on {formatDate(invoice.paymentDate)}</span>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Receipt className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-medium mb-2">No invoices found</h3>
              <p>Create your first invoice to get started</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Payment Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(paidAmount)}</div>
              <div className="text-sm text-green-600">Total Paid</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{formatCurrency(pendingAmount)}</div>
              <div className="text-sm text-yellow-600">Pending Payment</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{formatCurrency(overdueAmount)}</div>
              <div className="text-sm text-red-600">Overdue</div>
            </div>
          </div>
          
          <div className="mt-6">
            <h4 className="text-lg font-medium text-gray-800 mb-3">Recent Payments</h4>
            <div className="space-y-2">
              {invoices
                .filter(invoice => invoice.status === 'paid' && invoice.paymentDate)
                .sort((a, b) => new Date(b.paymentDate!).getTime() - new Date(a.paymentDate!).getTime())
                .slice(0, 5)
                .map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">{invoice.patientName}</div>
                        <div className="text-sm text-gray-500">Invoice #{invoice.invoiceNumber}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-800">{formatCurrency(invoice.totalAmount)}</div>
                      <div className="text-sm text-gray-500">{formatDate(invoice.paymentDate!)}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Financial Reports</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-3">Monthly Revenue</h4>
              <div className="space-y-2">
                {Array.from({ length: 6 }, (_, i) => {
                  const date = new Date()
                  date.setMonth(date.getMonth() - i)
                  const monthName = date.toLocaleDateString('en-US', { month: 'short' })
                  const monthInvoices = invoices.filter(invoice => {
                    const invoiceDate = new Date(invoice.date)
                    return invoiceDate.getMonth() === date.getMonth() && 
                           invoiceDate.getFullYear() === date.getFullYear()
                  })
                  const monthRevenue = monthInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0)
                  
                  return (
                    <div key={monthName} className="flex justify-between items-center">
                      <span className="text-gray-600">{monthName}</span>
                      <span className="font-medium">{formatCurrency(monthRevenue)}</span>
                    </div>
                  )
                }).reverse()}
              </div>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-3">Payment Methods</h4>
              <div className="space-y-2">
                {['cash', 'credit_card', 'bank_transfer', 'insurance'].map((method) => {
                  const methodInvoices = invoices.filter(invoice => invoice.paymentMethod === method)
                  const methodAmount = methodInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0)
                  const methodPercentage = totalAmount > 0 ? (methodAmount / totalAmount) * 100 : 0
                  
                  return (
                    <div key={method} className="flex justify-between items-center">
                      <span className="text-gray-600 capitalize">{method.replace('_', ' ')}</span>
                      <span className="font-medium">{formatCurrency(methodAmount)} ({methodPercentage.toFixed(1)}%)</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Form Modal */}
      {showInvoiceForm && (
        <InvoiceForm
          invoice={editingInvoice}
          onSave={handleSaveInvoice}
          onClose={() => {
            setShowInvoiceForm(false)
            setEditingInvoice(null)
          }}
        />
      )}
    </div>
  )
}
