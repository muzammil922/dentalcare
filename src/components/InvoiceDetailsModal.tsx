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
           
            <div className="p-4 overflow-y-auto flex-1 bg-gray-50 scrollbar-hide">
               {/* Floating Close Button */}
            {/* Invoice Details Heading */}
            
             <div className="flex items-center justify-between p-4 border-b border-gray-200">
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
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
                
                {/* Invoice Information Card */}
                <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-file-invoice text-blue-600 text-lg"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 m-0">Invoice Information</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">Invoice ID:</span>
                      <span className="text-blue-600 font-medium">{invoice.id}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">Invoice Number:</span>
                      <span className="text-blue-600 font-medium">{invoice.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">Date:</span>
                      <span className="text-blue-600 font-medium">{formatDate(invoice.invoiceDate)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">Due Date:</span>
                      <span className="text-blue-600 font-medium">{formatDate(invoice.dueDate)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">Status:</span>
                      <span className={`text-white px-3 py-1 rounded-md text-sm font-semibold ${getStatusColor(getActualStatus(invoice))}`}>
                        {getStatusText(getActualStatus(invoice))}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">Payment Method:</span>
                      <span className="text-blue-600 font-medium capitalize">{invoice.paymentMethod || 'Not specified'}</span>
                    </div>
                    {invoice.receiptNumber && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">Receipt Number:</span>
                        <span className="text-blue-600 font-medium">{invoice.receiptNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Patient Information Card */}
                <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-user text-blue-600 text-lg"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 m-0">Patient Information</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">Name:</span>
                      <span className="text-blue-600 font-medium">{invoice.patientName}</span>
                    </div>
                    {patient && (
                      <>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600 font-medium">Phone:</span>
                          <span className="text-blue-600 font-medium">{patient.phone}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600 font-medium">Email:</span>
                          <span className="text-blue-600 font-medium">{patient.email || 'Not provided'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600 font-medium">Age:</span>
                          <span className="text-blue-600 font-medium">{patient.age} years</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600 font-medium">Gender:</span>
                          <span className="text-blue-600 font-medium capitalize">{patient.gender}</span>
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
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600 font-medium">Subtotal:</span>
                    <span className="text-blue-600 font-medium">{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600 font-medium">Total Discount:</span>
                    <span className="text-blue-600 font-medium">{formatCurrency(invoice.discount)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 mt-2">
                    <span className="text-blue-600 font-medium text-lg">Total Amount:</span>
                    <span className="text-blue-600 font-bold text-xl">{formatCurrency(invoice.total)}</span>
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
