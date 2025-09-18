import { motion, AnimatePresence } from 'framer-motion'
import { Invoice, Patient } from '@/stores/useAppStore'
import { formatDate, formatCurrency } from '@/lib/utils'

interface InvoiceDetailsModalProps {
  invoice: Invoice | null
  patient: Patient | null
  isOpen: boolean
  onClose: () => void
}

export default function InvoiceDetailsModal({ invoice, patient, isOpen, onClose }: InvoiceDetailsModalProps) {
  if (!invoice) return null

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500'
      case 'pending':
        return 'bg-yellow-500'
      case 'overdue':
        return 'bg-red-500'
      case 'cancelled':
        return 'bg-gray-500'
      default:
        return 'bg-yellow-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Paid'
      case 'pending':
        return 'Pending'
      case 'overdue':
        return 'Overdue'
      case 'cancelled':
        return 'Cancelled'
      default:
        return 'Pending'
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[999999] p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-direction-column relative"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Body */}
           
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50 scrollbar-hide">
               {/* Floating Close Button */}
            {/* Invoice Details Heading */}
            
             <div className="flex items-center justify-between p-6 border-b border-gray-200">
               <div className="flex items-center">
                 <i className="fas fa-file-invoice-dollar w-8 h-8 mr-2 bg-blue-100 rounded-full flex items-center justify-center text-blue-600"></i>
                 <h2 className="text-2xl font-bold text-gray-800 m-0">Invoice Details</h2>
               </div>
               <button
                 onClick={onClose}
                 className="close bg-blue-600 hover:bg-blue-700 text-white hover:text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
               >
                 ×
               </button>
             </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
                
                {/* Invoice Information Card */}
                <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-file-invoice text-blue-600 text-lg"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 m-0">Invoice Information</h3>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <span className="text-gray-600 font-medium text-sm">Invoice ID</span>
                      <span className="text-blue-600 font-semibold text-sm">{invoice.id}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <span className="text-gray-600 font-medium text-sm">Invoice Number</span>
                      <span className="text-blue-600 font-semibold text-sm">{invoice.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <span className="text-gray-600 font-medium text-sm">Date</span>
                      <span className="text-blue-600 font-semibold text-sm">{formatDate(invoice.invoiceDate)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <span className="text-gray-600 font-medium text-sm">Due Date</span>
                      <span className="text-blue-600 font-semibold text-sm">{formatDate(invoice.dueDate)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <span className="text-gray-600 font-medium text-sm">Status</span>
                      <span className={`text-white px-3 py-1 rounded-md text-sm font-semibold ${getStatusColor(getActualStatus(invoice))}`}>
                        {getStatusText(getActualStatus(invoice))}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <span className="text-gray-600 font-medium text-sm">Payment Method</span>
                      <span className="text-blue-600 font-semibold text-sm capitalize">{invoice.paymentMethod || 'Not specified'}</span>
                    </div>
                    {invoice.receiptNumber && (
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                        <span className="text-gray-600 font-medium text-sm">Receipt Number</span>
                        <span className="text-blue-600 font-semibold text-sm">{invoice.receiptNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Patient Information Card */}
                <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-user text-blue-600 text-lg"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 m-0">Patient Information</h3>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <span className="text-gray-600 font-medium text-sm">Name</span>
                      <span className="text-blue-600 font-semibold text-sm">{invoice.patientName}</span>
                    </div>
                    {patient && (
                      <>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                          <span className="text-gray-600 font-medium text-sm">Phone</span>
                          <span className="text-blue-600 font-semibold text-sm">{patient.phone}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                          <span className="text-gray-600 font-medium text-sm">Email</span>
                          <span className="text-blue-600 font-semibold text-sm">{patient.email || 'Not provided'}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                          <span className="text-gray-600 font-medium text-sm">Age</span>
                          <span className="text-blue-600 font-semibold text-sm">{patient.age} years</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                          <span className="text-gray-600 font-medium text-sm">Gender</span>
                          <span className="text-blue-600 font-semibold text-sm capitalize">{patient.gender}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Treatments Card */}
              <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200 mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <i className="fas fa-stethoscope text-blue-600 text-lg"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 m-0">Treatments</h3>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  {invoice.treatments.map((treatment, index) => (
                    <div key={treatment.id || index} className="flex justify-between items-center py-3 border-b border-gray-200 bg-white rounded-md mb-2 last:mb-0 last:border-b-0">
                      <div>
                        <div className="font-semibold text-gray-800 mb-1 capitalize">{treatment.type}</div>
                        {treatment.description && (
                          <div className="text-sm text-gray-600">{treatment.description}</div>
                        )}
                        <div className="text-sm text-gray-500">
                          Qty: {treatment.quantity} × {formatCurrency(treatment.unitPrice)}
                        </div>
                      </div>
                      <div className="font-semibold text-blue-600 text-lg">
                        {formatCurrency(treatment.total)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Card */}
              <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200 mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <i className="fas fa-receipt text-blue-600 text-lg"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 m-0">Invoice Summary</h3>
                </div>
                
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <span className="text-gray-600 font-medium text-sm">Subtotal</span>
                    <span className="text-blue-600 font-semibold text-sm">{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <span className="text-gray-600 font-medium text-sm">Total Discount</span>
                    <span className="text-blue-600 font-semibold text-sm">{formatCurrency(invoice.discount)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <span className="text-gray-600 font-medium text-sm">Total Amount</span>
                    <span className="text-blue-600 font-bold text-lg">{formatCurrency(invoice.total)}</span>
                  </div>
                </div>
              </div>

              {/* Notes Card */}
              {invoice.notes && (
                <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200 mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-sticky-note text-blue-600 text-lg"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 m-0">Notes</h3>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg text-gray-700 leading-relaxed">
                    {invoice.notes}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
