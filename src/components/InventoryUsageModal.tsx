import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { InventoryItem } from '@/stores/useAppStore'

interface InventoryUsageModalProps {
  item: InventoryItem | null
  isOpen: boolean
  onClose: () => void
  usageRecords: any[]
}

export default function InventoryUsageModal({ item, isOpen, onClose, usageRecords }: InventoryUsageModalProps) {
  if (!isOpen || !item) return null

  // Get usage records for this specific item
  const itemUsageRecords = usageRecords.filter(record => record.itemId === item.id)
  const totalStock = item.quantity
  const totalUsed = itemUsageRecords.reduce((sum, record) => sum + record.quantity, 0)
  const remaining = totalStock - totalUsed
  const usageRecordsCount = itemUsageRecords.length

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[10000] p-5"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl"
          style={{ maxWidth: '800px', width: '95%' }}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                background: '#dbeafe', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: '#3b82f6' 
              }}>
                <i className="fas fa-chart-line"></i>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
                  Usage Records
                </h3>
                <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                  {item.name}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="close bg-blue-600 hover:bg-blue-700 text-white hover:text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
            >
              ×
            </button>
          </div>

          {/* Modal Content */}
          <div style={{ padding: '1.25rem' }}>
            {/* Summary Cards */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '1rem', 
              marginBottom: '2rem' 
            }}>
              <div style={{ 
                background: 'white', 
                border: '1px solid #e5e7eb', 
                borderRadius: '12px', 
                padding: '1rem' 
              }}>
                <div style={{ 
                  fontWeight: '600', 
                  color: '#6b7280', 
                  fontSize: '0.8rem', 
                  textTransform: 'uppercase', 
                  letterSpacing: '.05em', 
                  marginBottom: '.25rem' 
                }}>
                  Total Stock
                </div>
                <div style={{ 
                  color: '#3b82f6', 
                  fontWeight: '700', 
                  fontSize: '1.2rem' 
                }}>
                  {totalStock} {item.unit}
                </div>
              </div>

              <div style={{ 
                background: 'white', 
                border: '1px solid #e5e7eb', 
                borderRadius: '12px', 
                padding: '1rem' 
              }}>
                <div style={{ 
                  fontWeight: '600', 
                  color: '#6b7280', 
                  fontSize: '0.8rem', 
                  textTransform: 'uppercase', 
                  letterSpacing: '.05em', 
                  marginBottom: '.25rem' 
                }}>
                  Total Used
                </div>
                <div style={{ 
                  color: '#eab308', 
                  fontWeight: '700', 
                  fontSize: '1.2rem' 
                }}>
                  {totalUsed} {item.unit}
                </div>
              </div>

              <div style={{ 
                background: 'white', 
                border: '1px solid #e5e7eb', 
                borderRadius: '12px', 
                padding: '1rem' 
              }}>
                <div style={{ 
                  fontWeight: '600', 
                  color: '#6b7280', 
                  fontSize: '0.8rem', 
                  textTransform: 'uppercase', 
                  letterSpacing: '.05em', 
                  marginBottom: '.25rem' 
                }}>
                  Remaining
                </div>
                <div style={{ 
                  color: '#22c55e', 
                  fontWeight: '700', 
                  fontSize: '1.2rem' 
                }}>
                  {remaining} {item.unit}
                </div>
              </div>

              <div style={{ 
                background: 'white', 
                border: '1px solid #e5e7eb', 
                borderRadius: '12px', 
                padding: '1rem' 
              }}>
                <div style={{ 
                  fontWeight: '600', 
                  color: '#6b7280', 
                  fontSize: '0.8rem', 
                  textTransform: 'uppercase', 
                  letterSpacing: '.05em', 
                  marginBottom: '.25rem' 
                }}>
                  Usage Records
                </div>
                <div style={{ 
                  color: '#3b82f6', 
                  fontWeight: '700', 
                  fontSize: '1.2rem' 
                }}>
                  {usageRecordsCount}
                </div>
              </div>
            </div>

            {/* Usage Records Table */}
            <div style={{ 
              background: 'white', 
              borderRadius: '12px', 
              overflow: 'hidden', 
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', 
              border: '1px solid #e5e7eb' 
            }}>
              <div style={{ 
                background: '#f9fafb', 
                padding: '1rem', 
                borderBottom: '1px solid #e5e7eb', 
                fontWeight: '600', 
                color: '#374151' 
              }}>
                Usage History
              </div>
              
              {itemUsageRecords.length === 0 ? (
                <div style={{ 
                  padding: '2rem', 
                  textAlign: 'center', 
                  color: '#6b7280' 
                }}>
                  <i 
                    className="fas fa-chart-line" 
                    style={{ 
                      fontSize: '2rem', 
                      marginBottom: '1rem', 
                      opacity: '0.5' 
                    }}
                  />
                  <p style={{ margin: 0, fontSize: '16px' }}>
                    No usage records found for this item.
                  </p>
                </div>
              ) : (
                <div style={{ padding: '1rem' }}>
                  {itemUsageRecords.map((record, index) => (
                    <div key={record.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      borderBottom: index < itemUsageRecords.length - 1 ? '1px solid #e5e7eb' : 'none',
                      backgroundColor: index % 2 === 0 ? '#f9fafb' : 'white'
                    }}>
                      <div>
                        <div style={{ fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>
                          {record.quantity} {item.unit} used
                        </div>
                        <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                          Reason: {record.reason}
                        </div>
                        <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                          By: {record.staffName}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                          {new Date(record.date).toLocaleDateString()}
                        </div>
                        <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                          {new Date(record.date).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
