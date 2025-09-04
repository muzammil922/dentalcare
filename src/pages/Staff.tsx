import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  UserPlus, 
  DollarSign, 
  Calendar,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload
} from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { formatDate } from '@/lib/utils'
import StaffForm from '@/components/StaffForm'
import SalaryForm from '@/components/SalaryForm'
import { Staff as StaffType, Salary as SalaryType } from '@/stores/useAppStore'

export default function Staff() {
  const [activeTab, setActiveTab] = useState('staff-management')
  const [showStaffForm, setShowStaffForm] = useState(false)
  const [showSalaryForm, setShowSalaryForm] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffType | null>(null)
  const [editingSalary, setEditingSalary] = useState<SalaryType | null>(null)
  
  const { 
    staff, 
    salaries,
    addStaff, 
    updateStaff, 
    deleteStaff,
    addSalary,
    updateSalary,
    deleteSalary
  } = useAppStore()

  const tabs = [
    { id: 'staff-management', label: 'Staff Management', icon: Users },
    { id: 'salary-management', label: 'Salary Management', icon: DollarSign }
  ]

  const handleSaveStaff = (staffData: Omit<StaffType, 'id'>) => {
    if (editingStaff) {
      updateStaff(editingStaff.id, staffData)
      setEditingStaff(null)
    } else {
      addStaff({
        ...staffData,
        id: Math.random().toString(36).substr(2, 9),
        joinDate: new Date().toISOString()
      })
    }
    setShowStaffForm(false)
  }

  const handleSaveSalary = (salaryData: Omit<SalaryType, 'id'>) => {
    if (editingSalary) {
      updateSalary(editingSalary.id, salaryData)
      setEditingSalary(null)
    } else {
      addSalary({
        ...salaryData,
        id: Math.random().toString(36).substr(2, 9)
      })
    }
    setShowSalaryForm(false)
  }

  const handleEditStaff = (staffMember: StaffType) => {
    setEditingStaff(staffMember)
    setShowStaffForm(true)
  }

  const handleEditSalary = (salary: SalaryType) => {
    setEditingSalary(salary)
    setShowSalaryForm(true)
  }

  const handleDeleteStaff = (staffId: string) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      deleteStaff(staffId)
    }
  }

  const handleDeleteSalary = (salaryId: string) => {
    if (window.confirm('Are you sure you want to delete this salary record?')) {
      deleteSalary(salaryId)
    }
  }

  return (
    <div className="p-6">
      {/* Staff Header */}
      <div className="mb-6 p-6 bg-white border border-gray-200 rounded-2xl shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-0">Staff Management</h2>
      </div>

      {/* Staff Tabs */}
      <div className="flex gap-2 mb-6 px-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg font-medium cursor-pointer transition-all duration-150 ${
              activeTab === tab.id
                ? 'bg-primary-500 text-white border-primary-500'
                : 'text-gray-600 hover:bg-gray-200 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Staff Management Tab */}
      {activeTab === 'staff-management' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Staff Filters and Actions */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-md">
            <div className="flex justify-between items-center gap-4 flex-wrap">
              <div className="flex gap-3 items-center">
                <button
                  onClick={() => setShowStaffForm(true)}
                  className="action-btn"
                >
                  <Plus className="w-4 h-4" />
                  Add Staff
                </button>
              </div>
              <div className="flex gap-2 items-center">
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

          {/* Staff List */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-700">Staff Members</h3>
            </div>
            <div className="p-4">
              {staff.length > 0 ? (
                <div className="space-y-3">
                  {staff.map((staffMember) => (
                    <motion.div
                      key={staffMember.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg transition-all duration-150 hover:shadow-md hover:border-primary-500"
                    >
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Users className="w-6 h-6 text-primary-500" />
                      </div>
                      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                        <div>
                          <p className="font-semibold text-gray-800">{staffMember.name}</p>
                          <p className="text-sm text-gray-600">{staffMember.role}</p>
                        </div>
                        <div className="text-gray-600 text-sm">
                          {staffMember.phone}
                        </div>
                        <div className="text-gray-600 text-sm">
                          {staffMember.email}
                        </div>
                        <div className="text-gray-600 text-sm">
                          Joined: {formatDate(staffMember.joinDate)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditStaff(staffMember)}
                          className="action-btn edit-btn"
                          title="Edit Staff"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteStaff(staffMember.id)}
                          className="action-btn delete-btn"
                          title="Delete Staff"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-medium mb-2">No staff members found</h3>
                  <p>Get started by adding your first staff member</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Salary Management Tab */}
      {activeTab === 'salary-management' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Salary Filters and Actions */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-md">
            <div className="flex justify-between items-center gap-4 flex-wrap">
              <div className="flex gap-3 items-center">
                <button
                  onClick={() => setShowSalaryForm(true)}
                  className="action-btn"
                >
                  <Plus className="w-4 h-4" />
                  Add Salary Record
                </button>
              </div>
              <div className="flex gap-2 items-center">
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

          {/* Salary List */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-700">Salary Records</h3>
            </div>
            <div className="p-4">
              {salaries.length > 0 ? (
                <div className="space-y-3">
                  {salaries.map((salary) => (
                    <motion.div
                      key={salary.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg transition-all duration-150 hover:shadow-md hover:border-primary-500"
                    >
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <DollarSign className="w-6 h-6 text-green-500" />
                      </div>
                      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                        <div>
                          <p className="font-semibold text-gray-800">{salary.staffName}</p>
                          <p className="text-sm text-gray-600">{salary.month} {salary.year}</p>
                        </div>
                        <div className="text-gray-600 text-sm">
                          Basic: ${salary.basicSalary}
                        </div>
                        <div className="text-gray-600 text-sm">
                          Total: ${salary.totalSalary}
                        </div>
                        <div className="text-gray-600 text-sm">
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                            salary.status === 'paid' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {salary.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditSalary(salary)}
                          className="action-btn edit-btn"
                          title="Edit Salary"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSalary(salary.id)}
                          className="action-btn delete-btn"
                          title="Delete Salary"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-medium mb-2">No salary records found</h3>
                  <p>Get started by adding your first salary record</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Staff Form Modal */}
      {showStaffForm && (
        <StaffForm
          staff={editingStaff}
          onSave={handleSaveStaff}
          onClose={() => {
            setShowStaffForm(false)
            setEditingStaff(null)
          }}
        />
      )}

      {/* Salary Form Modal */}
      {showSalaryForm && (
        <SalaryForm
          salary={editingSalary}
          onSave={handleSaveSalary}
          onClose={() => {
            setShowSalaryForm(false)
            setEditingSalary(null)
          }}
        />
      )}
    </div>
  )
}
