import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  DollarSign, 
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  Search,
  ChevronDown,
  RefreshCw,
  Clock,
  Settings,
  CheckCircle
} from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { formatDate, formatCurrency, getCurrentKarachiTime, formatCurrentKarachiDate, formatCurrentKarachiTime } from '@/lib/utils'
import StaffForm from '@/components/StaffForm'
import SalaryForm from '@/components/SalaryForm'
import { Staff as StaffType, Salary as SalaryType } from '@/stores/useAppStore'

export default function Staff() {
  const [mainTab, setMainTab] = useState<'staff' | 'attendance' | 'salary'>('staff' as const)
  const [currentFilter, setCurrentFilter] = useState('all')
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [showStaffForm, setShowStaffForm] = useState(false)
  const [showSalaryForm, setShowSalaryForm] = useState(false)
  const [showSalaryModal, setShowSalaryModal] = useState(false)
  const [selectedSalary, setSelectedSalary] = useState<SalaryType | null>(null)
  const [editingStaff, setEditingStaff] = useState<StaffType | null>(null)
  const [editingSalary, setEditingSalary] = useState<SalaryType | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStaff, setSelectedStaff] = useState<Set<string>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [staffToDelete, setStaffToDelete] = useState<StaffType | null>(null)
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)
  const [showStaffDetails, setShowStaffDetails] = useState(false)
  const [selectedStaffDetails, setSelectedStaffDetails] = useState<StaffType | null>(null)
  
  // Import and refresh states
  const [showImportDropdown, setShowImportDropdown] = useState(false)
  const [isRefreshingStaff, setIsRefreshingStaff] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  // Pagination state
  const [staffPerPage, setStaffPerPage] = useState(10)
  const [currentStaffPage, setCurrentStaffPage] = useState(1)
  
  // Attendance state
  const [attendanceSearchTerm, setAttendanceSearchTerm] = useState('')
  const [attendancePerPage, setAttendancePerPage] = useState(10)
  const [currentAttendancePage, setCurrentAttendancePage] = useState(1)
  const [showMarkAttendanceModal, setShowMarkAttendanceModal] = useState(false)
  const [selectedStaffForAttendance, setSelectedStaffForAttendance] = useState<StaffType | null>(null)
  const [showAttendanceCalendar, setShowAttendanceCalendar] = useState(false)
  const [selectedStaffForCalendar, setSelectedStaffForCalendar] = useState<StaffType | null>(null)
  const [showTodaysAttendanceCalendar, setShowTodaysAttendanceCalendar] = useState(false)
  const [attendanceRecords, setAttendanceRecords] = useState<{[key: string]: {status: string, time: string, date: string, isCheckedOut?: boolean, checkoutTime?: string}}>({})
  const [showSettingsSidebar, setShowSettingsSidebar] = useState(false)
  const [salarySettings, setSalarySettings] = useState({
    lateArrivalThreshold: 3,
    lateArrivalDeduction: 1,
    absentDeduction: 1,
    absentDeductionAmount: 1000, // Amount in PKR
    leaveDeduction: 0.5,
    leaveDeductionAmount: 500, // Amount in PKR
    overtimeRate: 500,
    minOvertimeHours: 1,
    checkInTime: '09:00',
    checkOutTime: '17:00'
  })

  const [workingSchedule, setWorkingSchedule] = useState({
    workingDays: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: false // Default: Sunday is off
    },
    checkInTime: '09:00',
    checkOutTime: '18:00'
  })
  
  // Ref for dropdown
  const filterDropdownRef = useRef<HTMLDivElement>(null)
  const importDropdownRef = useRef<HTMLDivElement>(null)

  // Load saved settings and attendance records on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('salarySettings')
    if (savedSettings) {
      setSalarySettings(JSON.parse(savedSettings))
    }
    
    const savedWorkingSchedule = localStorage.getItem('workingSchedule')
    if (savedWorkingSchedule) {
      setWorkingSchedule(JSON.parse(savedWorkingSchedule))
    }
    
    const savedAttendanceRecords = localStorage.getItem('attendanceRecords')
    console.log('Loading attendance records from localStorage:', savedAttendanceRecords)
    if (savedAttendanceRecords) {
      const parsedRecords = JSON.parse(savedAttendanceRecords)
      console.log('Parsed attendance records:', parsedRecords)
      setAttendanceRecords(parsedRecords)
    } else {
      console.log('No attendance records found in localStorage')
    }
  }, [])
  
  // Note: localStorage saving is now handled directly in state update functions
  // to avoid conflicts and ensure immediate persistence
  
  // Check if a date is a holiday based on working schedule
  const isHoliday = (date: Date) => {
    const dayOfWeek = date.getDay()
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayName = dayNames[dayOfWeek]
    
    // If the day is not in working days, it's a holiday
    return !workingSchedule.workingDays[dayName as keyof typeof workingSchedule.workingDays]
  }

  // Check if today is a holiday
  const isTodayHoliday = () => {
    return isHoliday(getCurrentKarachiTime())
  }

  // Get holiday status for a specific date
  const getHolidayStatus = (dateString: string) => {
    const date = new Date(dateString)
    return isHoliday(date)
  }

  // Calculate salary deductions excluding holidays
  const calculateSalaryDeductions = (staffMember: StaffType, startDate: Date, endDate: Date) => {
    let totalDeductions = 0
    let absentDays = 0
    let lateDays = 0
    let leaveDays = 0

    // Iterate through each day in the date range
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dateString = date.toISOString().split('T')[0]
      
      // Skip holidays (Sundays)
      if (isHoliday(date)) {
        continue
      }

      const recordKey = `${staffMember.id}-${dateString}`
      const record = attendanceRecords[recordKey]

      if (record) {
        switch (record.status) {
          case 'absent':
            absentDays++
            break
          case 'late':
            lateDays++
            break
          case 'leave':
            leaveDays++
            break
        }
      } else {
        // No attendance record means absent (unless it's a holiday)
        absentDays++
      }
    }

    // Calculate deductions based on settings
    const lateDeductionDays = Math.floor(lateDays / salarySettings.lateArrivalThreshold) * salarySettings.lateArrivalDeduction
    const absentDeductionAmount = absentDays * salarySettings.absentDeductionAmount
    const leaveDeductionAmount = leaveDays * salarySettings.leaveDeductionAmount

    totalDeductions = (lateDeductionDays * (staffMember.salary || 0) / 30) + absentDeductionAmount + leaveDeductionAmount

    return {
      totalDeductions,
      absentDays,
      lateDays,
      leaveDays,
      lateDeductionDays
    }
  }

  // Attendance functions
  const getAttendanceStats = () => {
    const activeStaff = staff.filter(staffMember => staffMember.status === 'active')
    
    // Mock attendance data - in real app, this would come from attendance records
    const presentToday = activeStaff.filter(() => Math.random() > 0.3).length
    const absentToday = activeStaff.filter(() => Math.random() > 0.7).length
    const lateToday = activeStaff.filter(() => Math.random() > 0.8).length
    const onLeave = staff.filter(staffMember => staffMember.status === 'on_leave').length
    
    return { presentToday, absentToday, lateToday, onLeave }
  }

  const getAttendanceStatus = (staffMember: StaffType) => {
    // Mock attendance status - in real app, this would check actual attendance records
    if (staffMember.status === 'on_leave') {
      return { status: 'LEAVE', time: '12:00 AM', color: 'yellow' }
    }
    
    const random = Math.random()
    if (random > 0.7) {
      return { status: 'PRESENT', time: '9:00 AM', color: 'green' }
    } else if (random > 0.5) {
      return { status: 'LATE', time: '10:30 AM', color: 'orange' }
    } else {
      return { status: 'ABSENT', time: '--', color: 'red' }
    }
  }
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false)
      }
      // Close import dropdown when clicking outside
      if (!event.target || !(event.target as Element).closest('.import-dropdown-container')) {
        setShowImportDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Data refresh effect for staff
  useEffect(() => {
    if (refreshTrigger > 0) {
      // Force re-render of staff data by updating a state that affects the data
      console.log('Refreshing staff data...')
      // Force recalculation of filtered staff
      setSearchTerm(prev => prev)
      setCurrentFilter(prev => prev)
      // This will trigger a re-render of the filtered and paginated data
    }
  }, [refreshTrigger])
  
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

  // Filter options
  const filters = [
    { value: 'all', label: 'Active Staff' },
    { value: 'inactive', label: 'Inactive Staff' },
    { value: 'on_leave', label: 'Leave' }
  ]

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

  // Filtered staff based on current filter and search term
  const filteredStaff = useMemo(() => {
    let filtered = staff

    // Apply status filter
    if (currentFilter === 'all') {
        // "All Staff" only shows active staff
        filtered = filtered.filter(s => s.status === 'active')
    } else {
        // Other filters show specific status
        filtered = filtered.filter(s => s.status === currentFilter)
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.role?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return filtered
  }, [staff, currentFilter, searchTerm])

  // Memoized staff pagination calculations
  const staffPaginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredStaff.length / staffPerPage)
    const startIndex = (currentStaffPage - 1) * staffPerPage
    const paginatedStaff = filteredStaff.slice(startIndex, startIndex + staffPerPage)
    return { totalPages, startIndex, paginatedStaff }
  }, [filteredStaff, currentStaffPage, staffPerPage])

  // Extract values from memoized pagination data
  const { totalPages, startIndex, paginatedStaff } = staffPaginationData

  // Attendance data filtering and pagination
  const filteredAttendanceStaff = useMemo(() => {
    let filtered = staff.filter(s => s.status === 'active' || s.status === 'on_leave')
    
    if (attendanceSearchTerm) {
      filtered = filtered.filter(s => 
        s.name?.toLowerCase().includes(attendanceSearchTerm.toLowerCase()) ||
        s.role?.toLowerCase().includes(attendanceSearchTerm.toLowerCase())
      )
    }
    
    return filtered
  }, [staff, attendanceSearchTerm])
  
  const attendancePaginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredAttendanceStaff.length / attendancePerPage)
    const startIndex = (currentAttendancePage - 1) * attendancePerPage
    const paginatedStaff = filteredAttendanceStaff.slice(startIndex, startIndex + attendancePerPage)
    return { totalPages, startIndex, paginatedStaff }
  }, [filteredAttendanceStaff, currentAttendancePage, attendancePerPage])
  

  // Memoized page numbers generation for performance
  const getPageNumbers = useMemo(() => {
    const pages = []
    const current = currentStaffPage
    const total = totalPages
    
    if (total <= 7) {
      // If total pages <= 7, show all pages
      for (let i = 1; i <= total; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)
      
      if (current > 3) {
        pages.push('...')
      }
      
      // Show current page and surrounding pages
      for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        if (i > 1 && i < total) {
          pages.push(i)
        }
      }
      
      if (current < total - 2) {
        pages.push('...')
      }
      
      // Always show last page
      if (total > 1) {
        pages.push(total)
      }
    }
    
    return pages
  }, [currentStaffPage, totalPages])

  // Memoized pagination navigation functions
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentStaffPage(page)
    }
  }, [totalPages])

  const nextPage = useCallback(() => {
    if (currentStaffPage < totalPages) {
      setCurrentStaffPage(currentStaffPage + 1)
    }
  }, [currentStaffPage, totalPages])

  const prevPage = useCallback(() => {
    if (currentStaffPage > 1) {
      setCurrentStaffPage(currentStaffPage - 1)
    }
  }, [currentStaffPage])

  const handleSaveStaff = (staffData: Omit<StaffType, 'id'>) => {
    if (editingStaff) {
      updateStaff(editingStaff.id, staffData)
      setEditingStaff(null)
      showToast('Staff member updated successfully', 'success')
    } else {
      addStaff({
        ...staffData,
        joinDate: getCurrentKarachiTime().toISOString()
      })
      showToast('Staff member added successfully', 'success')
    }
    setShowStaffForm(false)
  }

  const handleSaveSalary = (salaryData: Omit<SalaryType, 'id'>) => {
    if (editingSalary) {
      updateSalary(editingSalary.id, salaryData)
      setEditingSalary(null)
      showToast('Salary record updated successfully', 'success')
    } else {
      addSalary({
        ...salaryData,
        id: Math.random().toString(36).substr(2, 9)
      })
      showToast('Salary record added successfully', 'success')
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
    const staffMember = staff.find(s => s.id === staffId)
    if (staffMember) {
      setStaffToDelete(staffMember)
      setShowDeleteConfirm(true)
    }
  }

  const handleViewStaff = (staffMember: StaffType) => {
    setSelectedStaffDetails(staffMember)
    setShowStaffDetails(true)
  }

  const handleSetOnLeave = (staffMember: StaffType) => {
    updateStaff(staffMember.id, { ...staffMember, status: 'on_leave' })
    showToast(`${staffMember.name} has been set on leave`, 'success')
  }

  const handleReActivate = (staffMember: StaffType) => {
    updateStaff(staffMember.id, { ...staffMember, status: 'active' })
    showToast(`${staffMember.name} has been re-activated`, 'success')
  }

  const handleSetInactive = (staffMember: StaffType) => {
    updateStaff(staffMember.id, { ...staffMember, status: 'inactive' })
    showToast(`${staffMember.name} has been set as inactive`, 'success')
  }

  const handleMarkAttendance = (staffMember: StaffType) => {
    setSelectedStaffForAttendance(staffMember)
    setShowMarkAttendanceModal(true)
  }

  const getAutoDetectedStatus = () => {
    // Get current time in Pakistan timezone (Karachi)
    const pakistanTime = getCurrentKarachiTime()
    const currentHour = pakistanTime.getHours()
    const currentMinute = pakistanTime.getMinutes()
    const currentTimeInMinutes = currentHour * 60 + currentMinute

    // Parse check-in and check-out times from working schedule
    const [checkInHour, checkInMinute] = workingSchedule.checkInTime.split(':').map(Number)
    const [checkOutHour, checkOutMinute] = workingSchedule.checkOutTime.split(':').map(Number)
    
    const checkInTimeInMinutes = checkInHour * 60 + checkInMinute
    const checkOutTimeInMinutes = checkOutHour * 60 + checkOutMinute
    const checkOutMinus30Min = checkOutTimeInMinutes - 30

    // Format time in Pakistan timezone
    const formattedTime = formatCurrentKarachiTime()

    // Auto-detect status based on current time
    if (currentTimeInMinutes < checkInTimeInMinutes) {
      return { status: 'present', time: formattedTime }
    } else if (currentTimeInMinutes >= checkInTimeInMinutes && currentTimeInMinutes < checkOutMinus30Min) {
      return { status: 'late', time: formattedTime }
    } else if (currentTimeInMinutes >= checkOutMinus30Min && currentTimeInMinutes < checkOutTimeInMinutes) {
      return { status: 'half-day', time: formattedTime }
    } else {
      return { status: 'present', time: formattedTime }
    }
  }

  const handleCloseMarkAttendanceModal = () => {
    setShowMarkAttendanceModal(false)
    setSelectedStaffForAttendance(null)
  }

  const handleViewAttendanceCalendar = (staffMember: StaffType) => {
    setSelectedStaffForCalendar(staffMember)
    setShowAttendanceCalendar(true)
  }

  const handleCloseAttendanceCalendar = () => {
    setShowAttendanceCalendar(false)
    setSelectedStaffForCalendar(null)
  }

  const handleToggleTodaysAttendanceCalendar = () => {
    setShowTodaysAttendanceCalendar(!showTodaysAttendanceCalendar)
  }



  const handleCheckout = (staffMember: StaffType) => {
    const today = getCurrentKarachiTime().toISOString().split('T')[0]
    // Get current time in Pakistan timezone (Karachi)
    const currentTime = formatCurrentKarachiTime()
    
    // Update attendance record with checkout time
    const recordKey = `${staffMember.id}-${today}`
    console.log('Checkout - Record key:', recordKey, 'Current time:', currentTime)
    
    setAttendanceRecords(prev => {
      const existingRecord = prev[recordKey] || { status: 'present', time: '09:00', date: today, notes: '', isCheckedOut: false }
      const updated = {
        ...prev,
        [recordKey]: {
          ...existingRecord,
          checkoutTime: currentTime,
          isCheckedOut: true
        }
      }
      console.log('Checkout - Updated records:', updated)
      // Save to localStorage immediately
      localStorage.setItem('attendanceRecords', JSON.stringify(updated))
      return updated
    })
    
    showToast(`${staffMember.name} has been checked out at ${currentTime}`, 'success')
  }

  const isStaffCheckedOut = (staffMember: StaffType) => {
    const today = getCurrentKarachiTime().toISOString().split('T')[0]
    const recordKey = `${staffMember.id}-${today}`
    const record = attendanceRecords[recordKey]
    console.log(`Checking checkout for ${staffMember.name}:`, { today, recordKey, record, isCheckedOut: record?.isCheckedOut })
    return record?.isCheckedOut || false
  }

  const getCheckoutTime = (staffMember: StaffType) => {
    const today = getCurrentKarachiTime().toISOString().split('T')[0]
    const record = attendanceRecords[`${staffMember.id}-${today}`]
    return record?.checkoutTime || ''
  }

  const handleToggleSettings = () => {
    setShowSettingsSidebar(!showSettingsSidebar)
  }

  // Function to count attendance for a specific date
  const getAttendanceCountForDate = (date: string) => {
    let count = 0
    staff.forEach(staffMember => {
      const recordKey = `${staffMember.id}-${date}`
      if (attendanceRecords[recordKey]) {
        count++
      }
    })
    return count
  }


  const handleSaveSettings = () => {
    // Save settings to localStorage for persistence
    localStorage.setItem('salarySettings', JSON.stringify(salarySettings))
    localStorage.setItem('workingSchedule', JSON.stringify(workingSchedule))
    
    // Settings are saved to localStorage and will be applied during attendance calculations
    
    showToast('Settings saved successfully! All staff records updated.', 'success')
    setShowSettingsSidebar(false)
  }


  const handlePrintStaff = (staffMember: StaffType) => {
    // Create print window with staff record
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (!printWindow) return

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
          <title>Staff Record - ${staffMember.name}</title>
          <style>
              @media print {
                  body { margin: 0; }
                  .no-print { display: none !important; }
                  #printButtonContainer { display: none !important; }
                  div[id="printButtonContainer"] { display: none !important; }
                  .print-button { display: none !important; }
              }
              
              @keyframes float {
                  0%, 100% { transform: translateY(0px) rotate(0deg); }
                  50% { transform: translateY(-20px) rotate(180deg); }
              }
              
              body { 
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                  margin: 0; 
                  padding: 0; 
                  background: #f8fafc;
                  color: #1e293b;
              }
              
              .container {
                  width: 100%;
                  margin: 0px auto 20px auto;
                  background: white;
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              }
              
              .header {
                  background: #dbeafe;
                  color: #2563eb;
                  padding: 2rem;
                  text-align: center;
                  position: relative;
                  overflow: hidden;
              }
              
              .header::before {
                  content: '';
                  position: absolute;
                  top: -50%;
                  left: -50%;
                  width: 200%;
                  height: 200%;
                  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
                  animation: float 6s ease-in-out infinite;
              }
              
              .header h1 {
                  margin: 0;
                  font-size: 2.5rem;
                  font-weight: 700;
                  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
                  position: relative;
                  z-index: 1;
              }
              
              .header h2 {
                  margin: 0.5rem 0 0 0;
                  font-size: 1.5rem;
                  font-weight: 400;
                  opacity: 0.9;
                  position: relative;
                  z-index: 1;
              }
              
              .clinic-info {
                  background: rgba(255,255,255,0.1);
                  padding: 1rem;
                  border-radius: 12px;
                  margin-top: 1rem;
                  backdrop-filter: blur(10px);
                  position: relative;
                  z-index: 1;
              }
              
              .content {
                  padding: 2rem;
              }
              
              .section {
                  margin-bottom: 2rem;
                  background: #f8fafc;
                  border-radius: 12px;
                  padding: 1.5rem;
              }
              
              .section h3 {
                  margin: 0 0 1rem 0;
                  color: #2563eb;
                  font-size: 1.25rem;
                  font-weight: 600;
                  display: flex;
                  align-items: center;
                  gap: 0.5rem;
              }
              
              .info-grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                  gap: 1rem;
              }
              
              .info-item {
                  background: white;
                  padding: 1rem;
                  border-radius: 8px;
                  border: 1px solid #e2e8f0;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              }
              
              .info-label {
                  font-weight: 600;
                  color: #475569;
                  font-size: 0.875rem;
                  text-transform: uppercase;
                  letter-spacing: 0.05em;
                  margin-bottom: 0.25rem;
              }
              
              .info-value {
                  color: #1e293b;
                  font-size: 1rem;
                  font-weight: 500;
              }
              
              .highlight-box {
              background: white;
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                  border-radius: 8px;
                  padding: 1rem;
                  margin: 1rem 0;
              }
              
              .medical-history {
                  background: #f8fafc;
              }
              
              .footer {
                  background: #f8fafc;
                  padding: 1.5rem;
                  text-align: center;
                  border-top: 1px solid #e2e8f0;
              }
              
              .footer p {
                  margin: 0;
                  color: #64748b;
                  font-size: 0.875rem;
              }
              
              .status-badge {
                  display: inline-block;
                  padding: 0.25rem 0.75rem;
                  border-radius: 20px;
                  font-size: 0.75rem;
                  font-weight: 600;
                  text-transform: uppercase;
                  letter-spacing: 0.05em;
              }
              
              .status-active {
                  background: #dcfce7;
                  color: #15803d;
                  
              }
              
              .status-inactive {
                  background: #fef2f2;
                  color: #dc2626;
                  
              }
              
              .status-on_leave {
                  background: #fef3c7;
                  color: #d97706;
                  
              }
          </style>
      </head>
      <body>
      <!-- Print Button (Top Right Corner) -->
  <div id="printButtonContainer" class="no-print" style="
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      background: #059669;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(5, 150, 105, 0.4);
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-weight: 600;
      transition: all 0.3s ease;
      border: none;
      display: flex;
      align-items: center;
      gap: 8px;
  " onclick="window.print()" onmouseover="this.style.background='#047857'; this.style.transform='scale(1.05)'" onmouseout="this.style.background='#059669'; this.style.transform='scale(1)'">
      <i class="fas fa-print"></i>
      Print Staff Record
      </div>
          <div class="container">
              <div class="header">
                  <h1>🦷 DentalCare Pro</h1>
                  <h2>Staff Record</h2>
                  <div class="clinic-info">
                      <strong>Professional Staff Management</strong><br>
                      <small>Excellence in Team Management</small>
                  </div>
              </div>
              
              <div class="content">
                  <div class="section">
                      <h3>Staff Information</h3>
                      <div class="info-grid">
                          <div class="info-item">
                              <div class="info-label">Staff ID</div>
                              <div class="info-value">${staffMember.id}</div>
                          </div>
                          <div class="info-item">
                              <div class="info-label">Full Name</div>
                              <div class="info-value">${staffMember.name}</div>
                          </div>
                          <div class="info-item">
                              <div class="info-label">Role/Position</div>
                              <div class="info-value">${staffMember.role}</div>
                          </div>
                          <div class="info-item">
                              <div class="info-label">Phone Number</div>
                              <div class="info-value">${staffMember.phone}</div>
                          </div>
                          <div class="info-item">
                              <div class="info-label">Email Address</div>
                              <div class="info-value">${staffMember.email}</div>
                          </div>
                          <div class="info-item">
                              <div class="info-label">Age</div>
                              <div class="info-value">${staffMember.age ? staffMember.age + ' years' : 'Not specified'}</div>
                          </div>
                          <div class="info-item">
                              <div class="info-label">Gender</div>
                              <div class="info-value">${staffMember.gender ? staffMember.gender.charAt(0).toUpperCase() + staffMember.gender.slice(1) : 'Not specified'}</div>
                          </div>
                          <div class="info-item">
                              <div class="info-label">Join Date</div>
                              <div class="info-value">${formatDate(staffMember.joinDate)}</div>
                          </div>
                          <div class="info-item">
                              <div class="info-label">Status</div>
                              <div class="info-value">
                                  <span class="status-badge status-${staffMember.status.toLowerCase()}">${staffMember.status}</span>
                              </div>
                          </div>
                      </div>
                  </div>
                  
                  ${staffMember.department || staffMember.qualifications || staffMember.experience || staffMember.jobTerm || staffMember.salary ? `
                  <div class="section">
                      <h3>Professional Details</h3>
                      <div class="info-grid">
                          ${staffMember.department ? `
                          <div class="info-item">
                              <div class="info-label">Department</div>
                              <div class="info-value">${staffMember.department}</div>
                          </div>
                          ` : ''}
                          ${staffMember.qualifications ? `
                          <div class="info-item">
                              <div class="info-label">Qualifications</div>
                              <div class="info-value">${staffMember.qualifications}</div>
                          </div>
                          ` : ''}
                          ${staffMember.experience ? `
                          <div class="info-item">
                              <div class="info-label">Experience</div>
                              <div class="info-value">${staffMember.experience}</div>
                          </div>
                          ` : ''}
                          ${staffMember.jobTerm ? `
                          <div class="info-item">
                              <div class="info-label">Job Term</div>
                              <div class="info-value">${staffMember.jobTerm.charAt(0).toUpperCase() + staffMember.jobTerm.slice(1)}</div>
                          </div>
                          ` : ''}
                          ${staffMember.salary ? `
                          <div class="info-item">
                              <div class="info-label">Monthly Salary</div>
                              <div class="info-value">Rs ${Math.round(staffMember.salary).toLocaleString()}</div>
                          </div>
                          ` : ''}
                      </div>
                  </div>
                  ` : ''}
                  
                  ${staffMember.address ? `
                  <div class="section">
                      <h3>Address Information</h3>
                      <div class="info-grid">
                          <div class="info-item">
                              <div class="info-label">Address</div>
                              <div class="info-value">${staffMember.address}</div>
                          </div>
                      </div>
                  </div>
                  ` : ''}
                  
                  ${staffMember.emergencyContact || staffMember.emergencyPhone ? `
                  <div class="section">
                      <h3>Emergency Contact</h3>
                      <div class="info-grid">
                          ${staffMember.emergencyContact ? `
                          <div class="info-item">
                              <div class="info-label">Emergency Contact</div>
                              <div class="info-value">${staffMember.emergencyContact}</div>
                          </div>
                          ` : ''}
                          ${staffMember.emergencyPhone ? `
                          <div class="info-item">
                              <div class="info-label">Emergency Phone</div>
                              <div class="info-value">${staffMember.emergencyPhone}</div>
                          </div>
                          ` : ''}
                      </div>
                  </div>
                  ` : ''}
                  
                  ${staffMember.notes ? `
                  <div class="section">
                      <h3>📝 Additional Notes</h3>
                      <div class="info-item">
                          <div class="info-label">Staff Notes</div>
                          <div class="info-value">${staffMember.notes}</div>
                      </div>
                  </div>
                  ` : ''}
              </div>
              
              <div class="footer">
                  <p><strong>Generated on:</strong> ${formatCurrentKarachiDate()} at ${formatCurrentKarachiTime()}</p>
                  <p>This is an official staff record from DentalCare Pro</p>
              </div>
          </div>
      </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
  }


  const handlePrintAttendanceReport = () => {
    console.log('Printing attendance report...')
    // Create print window with attendance calendar
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (!printWindow) return

    const currentDate = getCurrentKarachiTime()
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()
    const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', timeZone: 'Asia/Karachi' })
    
    // Calculate attendance statistics
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    // Get attendance data for the month
    const monthlyAttendance: {[key: string]: {[key: string]: {status: string, time: string}}} = {}
    const staffStats: {[key: string]: {present: number, absent: number, leave: number, halfDay: number, late: number}} = {}
    
    // Initialize staff stats
    filteredStaff.forEach(staff => {
      staffStats[staff.id] = { present: 0, absent: 0, leave: 0, halfDay: 0, late: 0 }
    })
    
    // Process attendance records for the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(currentYear, currentMonth, day)
      const dayKey = dayDate.toISOString().split('T')[0]
      
      filteredStaff.forEach(staff => {
        const recordKey = `${staff.id}-${dayKey}`
        const record = attendanceRecords[recordKey]
        
        if (record) {
          if (!monthlyAttendance[dayKey]) monthlyAttendance[dayKey] = {}
          monthlyAttendance[dayKey][staff.id] = record
          
          // Update stats
          switch (record.status) {
            case 'present':
              staffStats[staff.id].present++
              break
            case 'absent':
              staffStats[staff.id].absent++
              break
            case 'leave':
              staffStats[staff.id].leave++
              break
            case 'half-day':
              staffStats[staff.id].halfDay++
              break
            case 'late':
              staffStats[staff.id].late++
              break
          }
        }
      })
    }
    
    // Generate calendar HTML to match exact template
    const generateCalendarHTML = () => {
      const calendarDays = []
      
      // Add empty cells for days before the first day of the month
      for (let i = 0; i < startingDayOfWeek; i++) {
        calendarDays.push(`<td style="background: #f5f5f5;"></td>`)
      }
      
      // Add days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const dayDate = new Date(currentYear, currentMonth, day)
        const dayKey = dayDate.toISOString().split('T')[0]
        const dayAttendance = monthlyAttendance[dayKey] || {}
        
        // Get the first staff member's attendance for this day (for display)
        const firstStaffId = Object.keys(dayAttendance)[0]
        const firstRecord = firstStaffId ? dayAttendance[firstStaffId] : null
        
        let cellStyle = 'background: #f5f5f5;'
        let statusBadge = ''
        
        if (firstRecord) {
          switch (firstRecord.status) {
            case 'present':
              cellStyle = 'background: #d4edda;'
              statusBadge = '<div class="status-badge" style="background: #d4edda; color: #155724;">P</div>'
              break
            case 'absent':
              cellStyle = 'background: #f8d7da;'
              statusBadge = '<div class="status-badge" style="background: #f8d7da; color: #721c24;">A</div>'
              break
            case 'leave':
              cellStyle = 'background: #d1ecf1;'
              statusBadge = '<div class="status-badge" style="background: #d1ecf1; color: #0c5460;">L</div>'
              break
            case 'half-day':
              cellStyle = 'background: #e2d9f3;'
              statusBadge = '<div class="status-badge" style="background: #e2d9f3; color: #6f42c1;">HD</div>'
              break
            case 'late':
              cellStyle = 'background: #fff3cd;'
              statusBadge = '<div class="status-badge" style="background: #fff3cd; color: #856404;">LT</div>'
              break
          }
        }
        
        calendarDays.push(`
          <td style="${cellStyle}">
            <div class="day-number">${day}</div>
            ${statusBadge}
          </td>
        `)
      }
      
      // Add empty cells for remaining days in the last week
      const remainingCells = 42 - calendarDays.length // 6 weeks * 7 days
      for (let i = 0; i < remainingCells; i++) {
        calendarDays.push(`<td style="background: #f5f5f5;"></td>`)
      }
      
      // Group into weeks and format exactly like your template
      const weeks = []
      for (let i = 0; i < calendarDays.length; i += 7) {
        const weekDays = calendarDays.slice(i, i + 7)
        weeks.push(`<tr>${weekDays.join('')}</tr>`)
      }
      
      return weeks.join('')
    }
    
    // Calculate total stats
    const totalStats = Object.values(staffStats).reduce((acc, stats) => ({
      present: acc.present + stats.present,
      absent: acc.absent + stats.absent,
      leave: acc.leave + stats.leave,
      halfDay: acc.halfDay + stats.halfDay,
      late: acc.late + stats.late
    }), { present: 0, absent: 0, leave: 0, halfDay: 0, late: 0 })
    
    const totalDays = daysInMonth
    const attendanceRate = totalDays > 0 ? ((totalStats.present + totalStats.late + totalStats.halfDay) / (totalDays * filteredStaff.length) * 100).toFixed(1) : '0.0'

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
          <title>Staff Attendance Report - ${monthName} ${currentYear}</title>
          <style>
              @media print {
                  body { margin: 0; }
                  .no-print { display: none !important; }
              }
              
              body { 
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                  margin: 0; 
                  padding: 20px; 
                  background: #f8fafc;
                  color: #1f2937;
              }
              
              .print-container {
                  max-width: 100%;
                  margin: 0 auto;
              }
              
              .header {
                  text-align: center;
                  margin-bottom: 30px;
                  padding: 20px;
                  background: white;
                  border-radius: 8px;
                  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
                  position: relative;
              }
              
              .header h1 {
                  margin: 0 0 10px 0;
                  font-size: 28px;
                  color: #3b82f6;
                  font-weight: bold;
              }
              
              .subtitle {
                  font-size: 18px;
                  color: #6b7280;
                  font-weight: 500;
              }
              
              .print-button {
                  position: absolute;
                  top: 20px;
                  right: 20px;
                  background: #22c55e;
                  color: white;
                  border: none;
                  padding: 10px 20px;
                  border-radius: 6px;
                  font-weight: 500;
                  cursor: pointer;
                  font-size: 14px;
              }
              
              .content {
                  margin-bottom: 30px;
              }
              
              .info-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 30px;
                  margin-bottom: 30px;
              }
              
              .info-section {
                  background: white;
                  padding: 24px;
                  border-radius: 12px;
                  border: 1px solid #e5e7eb;
                  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
                  border-left: 4px solid #3b82f6;
              }
              
              .info-section h3 {
                  margin: 0 0 20px 0;
                  font-size: 20px;
                  color: #1f2937;
                  font-weight: bold;
                  display: flex;
                  align-items: center;
                  gap: 8px;
              }
              
              .info-section h3::before {
                  content: '';
                  width: 4px;
                  height: 20px;
                  background: #3b82f6;
                  border-radius: 2px;
                  margin-right: 8px;
              }
              
              .info-item {
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 12px;
                  padding: 8px 0;
                  border-bottom: 1px solid #f3f4f6;
              }
              
              .info-item:last-child {
                  border-bottom: none;
              }
              
              .info-label {
                  font-weight: 600;
                  color: #6b7280;
                  font-size: 14px;
              }
              
              .info-value {
                  font-weight: 500;
                  color: #1f2937;
                  font-size: 14px;
              }
              
              .calendar-section {
                  margin-bottom: 30px;
                  background: white;
                  padding: 24px;
                  border-radius: 12px;
                  border: 1px solid #e5e7eb;
                  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
              }
              
              .calendar-section h3 {
                  margin: 0 0 20px 0;
                  font-size: 20px;
                  color: #1f2937;
                  font-weight: bold;
                  display: flex;
                  align-items: center;
                  gap: 8px;
              }
              
              .calendar-section h3::before {
                  content: '';
                  width: 4px;
                  height: 20px;
                  background: #3b82f6;
                  border-radius: 2px;
                  margin-right: 8px;
              }
              
              .legend {
                  display: flex;
                  gap: 20px;
                  margin-bottom: 20px;
                  flex-wrap: wrap;
                  padding: 16px;
                  background: #f8fafc;
                  border-radius: 8px;
                  border: 1px solid #e5e7eb;
              }
              
              .legend-item {
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  font-size: 14px;
                  color: #374151;
              }
              
              .legend-badge {
                  width: 28px;
                  height: 28px;
                  border-radius: 6px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: bold;
                  font-size: 12px;
                  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
              }
              
              .calendar {
                  width: 100%;
                  border-collapse: collapse;
                  border: 1px solid #e5e7eb;
                  margin-bottom: 20px;
                  border-radius: 8px;
                  overflow: hidden;
                  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
              }
              
              .calendar th {
                  background: #3b82f6;
                  color: white;
                  padding: 16px 8px;
                  text-align: center;
                  font-weight: bold;
                  font-size: 14px;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
              }
              
              .calendar td {
                  border: 1px solid #e5e7eb;
                  padding: 12px 8px;
                  text-align: center;
                  vertical-align: top;
                  height: 60px;
                  width: 14.28%;
                  position: relative;
                  background: white;
              }
              
              .day-number {
                  font-weight: bold;
                  font-size: 14px;
                  margin-bottom: 4px;
                  color: #374151;
              }
              
              .status-badge {
                  position: absolute;
                  top: 6px;
                  right: 6px;
                  width: 22px;
                  height: 22px;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 10px;
                  font-weight: bold;
                  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.1);
              }
              
              .stats-grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
                  gap: 20px;
                  margin-bottom: 30px;
              }
              
              .stat-card {
                  background: white;
                  padding: 24px;
                  border-radius: 12px;
                  text-align: center;
                  border: 1px solid #e5e7eb;
                  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
                  border-left: 4px solid #3b82f6;
                  transition: transform 0.2s ease;
              }
              
              .stat-number {
                  font-size: 28px;
                  font-weight: bold;
                  color: #1f2937;
                  margin-bottom: 8px;
              }
              
              .stat-label {
                  font-size: 14px;
                  color: #6b7280;
                  font-weight: 500;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
              }
              
              .footer {
                  text-align: center;
                  padding: 24px;
                  background: white;
                  border-radius: 12px;
                  border: 1px solid #e5e7eb;
                  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
                  font-size: 14px;
                  color: #6b7280;
              }
              
              .footer strong {
                  color: #1f2937;
              }
          </style>
      </head>
      <body>
          <div class="print-container">
              <div class="header">
                  <button class="print-button" onclick="window.print()">Print Attendance Report</button>
                  <div class="header-content">
                      <h1>Staff Attendance Report</h1>
                      <div class="subtitle">${monthName} ${currentYear}</div>
                  </div>
              </div>
              
              <div class="content">
                  <div class="info-grid">
                      <div class="info-section">
                          <h3>Staff Information</h3>
                          <div class="info-item">
                              <span class="info-label">Staff ID:</span>
                              <span class="info-value">s-01</span>
                          </div>
                          <div class="info-item">
                              <span class="info-label">Name:</span>
                              <span class="info-value">Muzammil Afzal</span>
                          </div>
                          <div class="info-item">
                              <span class="info-label">Role:</span>
                              <span class="info-value">Dentist</span>
                          </div>
                          <div class="info-item">
                              <span class="info-label">Department:</span>
                              <span class="info-value">General</span>
                          </div>
                      </div>
                      
                      <div class="info-section">
                          <h3>Attendance Summary</h3>
                          <div class="info-item">
                              <span class="info-label">Total Days:</span>
                              <span class="info-value">${totalDays}</span>
                          </div>
                          <div class="info-item">
                              <span class="info-label">Present:</span>
                              <span class="info-value">${totalStats.present}</span>
                          </div>
                          <div class="info-item">
                              <span class="info-label">Absent:</span>
                              <span class="info-value">${totalStats.absent}</span>
                          </div>
                          <div class="info-item">
                              <span class="info-label">Attendance Rate:</span>
                              <span class="info-value">${attendanceRate}%</span>
                          </div>
                      </div>
                  </div>
                  
                  <div class="calendar-section">
                      <h3>Monthly Attendance Calendar</h3>
                      
                      <div class="legend">
                          <div class="legend-item">
                              <span class="legend-badge" style="background: #d4edda; color: #155724;">P</span>
                              <span>Present</span>
                          </div>
                          <div class="legend-item">
                              <span class="legend-badge" style="background: #f8d7da; color: #721c24;">A</span>
                              <span>Absent</span>
                          </div>
                          <div class="legend-item">
                              <span class="legend-badge" style="background: #d1ecf1; color: #0c5460;">L</span>
                              <span>Leave</span>
                          </div>
                          <div class="legend-item">
                              <span class="legend-badge" style="background: #e2d9f3; color: #6f42c1;">HD</span>
                              <span>Half Day</span>
                          </div>
                          <div class="legend-item">
                              <span class="legend-badge" style="background: #fff3cd; color: #856404;">LT</span>
                              <span>Late</span>
                          </div>
                      </div>
                      
                      <table class="calendar">
                          <thead>
                              <tr>
                                  <th>Sunday</th>
                                  <th>Monday</th>
                                  <th>Tuesday</th>
                                  <th>Wednesday</th>
                                  <th>Thursday</th>
                                  <th>Friday</th>
                                  <th>Saturday</th>
                              </tr>
                          </thead>
                          <tbody>
                              ${generateCalendarHTML()}
                          </tbody>
                      </table>
                  </div>
                  
                  <div class="stats-grid">
                      <div class="stat-card">
                          <div class="stat-number">${totalStats.present}</div>
                          <div class="stat-label">Present Days</div>
                      </div>
                      <div class="stat-card">
                          <div class="stat-number">${totalStats.absent}</div>
                          <div class="stat-label">Absent Days</div>
                      </div>
                      <div class="stat-card">
                          <div class="stat-number">${totalStats.leave}</div>
                          <div class="stat-label">Leave Days</div>
                      </div>
                      <div class="stat-card">
                          <div class="stat-number">${totalStats.halfDay}</div>
                          <div class="stat-label">Half Days</div>
                      </div>
                      <div class="stat-card">
                          <div class="stat-number">${attendanceRate}%</div>
                          <div class="stat-label">Attendance Rate</div>
                      </div>
                  </div>
              </div>
              
              <div class="footer">
                  <div class="footer-content">
                      <strong>Dental Clinic Pro</strong> - Staff Attendance Management System<br>
                      Generated on: <strong>${formatCurrentKarachiDate()}</strong> | Report Period: <strong>${monthName} ${currentYear}</strong>
                  </div>
              </div>
          </div>
      </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
  }

  const handlePrintStaffAttendance = (staffMember: StaffType) => {
    console.log('Printing staff attendance for:', staffMember.name)
    // Create print window with staff attendance report
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (!printWindow) return

    const currentDate = getCurrentKarachiTime()
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()
    const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', timeZone: 'Asia/Karachi' })
    
    // Calculate attendance statistics for this specific staff member
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    // Get attendance data for this staff member for the month
    const monthlyAttendance: {[key: string]: {status: string, time: string}} = {}
    let staffStats = { present: 0, absent: 0, leave: 0, halfDay: 0, late: 0 }
    
    // Process attendance records for this staff member for the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(currentYear, currentMonth, day)
      const dayKey = dayDate.toISOString().split('T')[0]
      const recordKey = `${staffMember.id}-${dayKey}`
      const record = attendanceRecords[recordKey]
      
      if (record) {
        monthlyAttendance[dayKey] = record
        
        // Update stats
        switch (record.status) {
          case 'present':
            staffStats.present++
            break
          case 'absent':
            staffStats.absent++
            break
          case 'leave':
            staffStats.leave++
            break
          case 'half-day':
            staffStats.halfDay++
            break
          case 'late':
            staffStats.late++
            break
        }
      }
    }
    
    // Generate calendar HTML for this staff member
    const generateStaffCalendarHTML = () => {
      const calendarDays = []
      
      // Add empty cells for days before the first day of the month
      for (let i = 0; i < startingDayOfWeek; i++) {
        calendarDays.push(`<td style="background: #f5f5f5;"></td>`)
      }
      
      // Add days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const dayDate = new Date(currentYear, currentMonth, day)
        const dayKey = dayDate.toISOString().split('T')[0]
        const record = monthlyAttendance[dayKey]
        
        let cellStyle = 'background: #f5f5f5;'
        let statusBadge = ''
        
        if (record) {
          switch (record.status) {
            case 'present':
              cellStyle = 'background: #d4edda;'
              statusBadge = '<div class="status-badge" style="background: #d4edda; color: #155724;">P</div>'
              break
            case 'absent':
              cellStyle = 'background: #f8d7da;'
              statusBadge = '<div class="status-badge" style="background: #f8d7da; color: #721c24;">A</div>'
              break
            case 'leave':
              cellStyle = 'background: #d1ecf1;'
              statusBadge = '<div class="status-badge" style="background: #d1ecf1; color: #0c5460;">L</div>'
              break
            case 'half-day':
              cellStyle = 'background: #e2d9f3;'
              statusBadge = '<div class="status-badge" style="background: #e2d9f3; color: #6f42c1;">HD</div>'
              break
            case 'late':
              cellStyle = 'background: #fff3cd;'
              statusBadge = '<div class="status-badge" style="background: #fff3cd; color: #856404;">LT</div>'
              break
          }
        }
        
        calendarDays.push(`
          <td style="${cellStyle}">
            <div class="day-number">${day}</div>
            ${statusBadge}
          </td>
        `)
      }
      
      // Add empty cells for remaining days in the last week
      const remainingCells = 42 - calendarDays.length // 6 weeks * 7 days
      for (let i = 0; i < remainingCells; i++) {
        calendarDays.push(`<td style="background: #f5f5f5;"></td>`)
      }
      
      // Group into weeks
      const weeks = []
      for (let i = 0; i < calendarDays.length; i += 7) {
        const weekDays = calendarDays.slice(i, i + 7)
        weeks.push(`<tr>${weekDays.join('')}</tr>`)
      }
      
      return weeks.join('')
    }
    
    const totalDays = daysInMonth
    const attendanceRate = totalDays > 0 ? ((staffStats.present + staffStats.late + staffStats.halfDay) / totalDays * 100).toFixed(1) : '0.0'

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const presentDays = staffStats.present
    const absentDays = staffStats.absent
    const leaveDays = staffStats.leave
    const halfDays = staffStats.halfDay

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
          <title>Staff Attendance Report - ${staffMember.name}</title>
          <style>
              * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
              }
              
              body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  line-height: 1.6;
                  color: #1e293b;
                  background: #f8fafc;
              }
              
              .print-container {
                  width: 100%;
                  margin: 0 auto;
                  background: #fff;
                  box-shadow: 0 0 20px rgba(0,0,0,0.1);
                  overflow: hidden;
              }
              
              .header {
                  background: #dbeafe;
                  color: #2563eb;
                  padding: 30px;
                  text-align: center;
                  position: relative;
              }
              
              .header::before {
                  content: '';
                  position: absolute;
                  top: 0;
                  left: 0;
                  right: 0;
                  bottom: 0;
                  background: none;
                  opacity: 0;
              }
              
              .header-content {
                  position: relative;
                  z-index: 1;
              }
              
              .header h1 {
                  font-size: 2.5rem;
                  font-weight: 700;
                  margin-bottom: 10px;
                  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
              }
              
              .header .subtitle {
                  font-size: 1.2rem;
                  opacity: 0.9;
                  font-weight: 300;
              }
              
              .content {
                  padding: 40px;
              }
              
              .info-grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                  gap: 30px;
                  margin-bottom: 40px;
              }
              
              .info-section {
                  background: #f8f9fa;
                  border-radius: 12px;
                  padding: 25px;
                  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
              }
              
              .info-section h3 {
                  color: #2563eb;
                  font-size: 1.3rem;
                  margin-bottom: 20px;
                  font-weight: 600;
                  display: flex;
                  align-items: center;
                  gap: 10px;
              }
              
              .info-item {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  padding: 12px 0;
                  border-bottom: 1px solid #e9ecef;
              }
              
              .info-item:last-child {
                  border-bottom: none;
              }
              
              .info-label {
                  font-weight: 600;
                  color: #495057;
                  font-size: 0.95rem;
              }
              
              .info-value {
                  color: #212529;
                  font-weight: 500;
                  text-align: right;
              }
              
              .calendar-section {
                  margin-bottom: 40px;
              }
              
              .calendar-section h3 {
                  color: #2563eb;
                  font-size: 1.5rem;
                  margin-bottom: 20px;
                  font-weight: 600;
                  text-align: center;
              }
              
              .legend {
                  display: flex;
                  justify-content: center;
                  flex-wrap: wrap;
                  gap: 20px;
                  margin-bottom: 30px;
                  padding: 20px;
                  background: #f8f9fa;
                  border-radius: 12px;
              }
              
              .legend-item {
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  font-size: 0.9rem;
                  font-weight: 500;
              }
              
              .legend-badge {
                  padding: 4px 8px;
                  border-radius: 6px;
                  font-weight: 700;
                  font-size: 0.8rem;
                  min-width: 30px;
                  text-align: center;
              }
              
              .calendar {
                  width: 100%;
                  border-collapse: collapse;
                  border-radius: 12px;
                  overflow: hidden;
                  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                  margin-bottom: 30px;
              }
              
              .calendar th {
                  background: #2563eb;
                  color: white;
                  padding: 15px 8px;
                  text-align: center;
                  font-weight: 600;
                  font-size: 0.9rem;
                  text-transform: uppercase;
                  letter-spacing: 1px;
              }
              
              .calendar td {
                  padding: 0;
                  text-align: center;
                  border: 1px solid #e9ecef;
                  height: 60px;
                  vertical-align: middle;
                  position: relative;
              }
              
              .calendar td .day-number {
                  font-weight: 600;
                  color: #333;
                  font-size: 1rem;
              }
              
              .calendar td .status-badge {
                  font-size: 0.7rem;
                  font-weight: 700;
                  margin-top: 4px;
                  padding: 2px 6px;
                  border-radius: 4px;
                  display: inline-block;
              }
              
              .stats-grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                  gap: 20px;
                  margin-bottom: 30px;
              }
              
              .stat-card {
                  background: #f8f9fa;
                  border-radius: 12px;
                  padding: 20px;
                  text-align: center;
              }
              
              .stat-number {
                  font-size: 2rem;
                  font-weight: 700;
                  color: #667eea;
                  margin-bottom: 5px;
              }
              
              .stat-label {
                  font-size: 0.9rem;
                  color: #6c757d;
                  font-weight: 500;
              }
              
              .footer {
                  background: #f8f9fa;
                  padding: 25px;
                  text-align: center;
                  border-top: 3px solid #667eea;
                  margin-top: 30px;
              }
              
              .footer-content {
                  color: #6c757d;
                  font-size: 0.9rem;
                  line-height: 1.8;
              }
              
              .footer-content strong {
                  color: #495057;
              }
              
              @media print {
                  body {
                      padding: 0;
                      background: white;
                  }
                  
                  .print-container {
                      box-shadow: none;
                      border-radius: 0;
                      max-width: none;
                  }
                  
                  .no-print {
                      display: none !important;
                  }
                  
                  .header {
                      background: #0891b2 !important;
                      -webkit-print-color-adjust: exact;
                      color-adjust: exact;
                  }
                  
                  .calendar th {
                      background: #0891b2 !important;
                      -webkit-print-color-adjust: exact;
                      color-adjust: exact;
                  }
              }
          </style>
      </head>
      <body>
          <div id="printButtonContainer" class="no-print" style="position: fixed; top: 20px; right: 20px; z-index: 1000; background: #059669; color: #fff; padding: 12px 24px; border-radius: 8px; cursor: pointer; box-shadow: 0 4px 12px rgba(5,150,105,.4); font-weight: 600; transition: all .3s ease; border: none; display: flex; align-items: center; gap: 8px;" onclick="window.print()" onmouseover="this.style.background='#047857'; this.style.transform='scale(1.05)'" onmouseout="this.style.background='#059669'; this.style.transform='scale(1)'"><span>Print Attendance Report</span></div>
          <div class="print-container">
              <div class="header">
                  <div class="header-content">
                      <h1>Staff Attendance Report</h1>
                      <div class="subtitle">${monthNames[currentMonth]} ${currentYear}</div>
                  </div>
              </div>
              
              <div class="content">
                  <div class="info-grid">
                      <div class="info-section">
                          <h3>Staff Information</h3>
                          <div class="info-item">
                              <span class="info-label">Staff ID:</span>
                              <span class="info-value">${staffMember.id}</span>
                          </div>
                          <div class="info-item">
                              <span class="info-label">Name:</span>
                              <span class="info-value">${staffMember.name}</span>
                          </div>
                          <div class="info-item">
                              <span class="info-label">Role:</span>
                              <span class="info-value">${staffMember.role}</span>
                          </div>
                          <div class="info-item">
                              <span class="info-label">Department:</span>
                              <span class="info-value">${staffMember.department || 'General'}</span>
                          </div>
                      </div>
                      
                      <div class="info-section">
                          <h3>Attendance Summary</h3>
                          <div class="info-item">
                              <span class="info-label">Total Days:</span>
                              <span class="info-value">${totalDays}</span>
                          </div>
                          <div class="info-item">
                              <span class="info-label">Present:</span>
                              <span class="info-value">${presentDays}</span>
                          </div>
                          <div class="info-item">
                              <span class="info-label">Absent:</span>
                              <span class="info-value">${absentDays}</span>
                          </div>
                          <div class="info-item">
                              <span class="info-label">Attendance Rate:</span>
                              <span class="info-value">${attendanceRate}%</span>
                          </div>
                      </div>
                  </div>
                  
                  <div class="calendar-section">
                      <h3>Monthly Attendance Calendar</h3>
                      
                      <div class="legend">
                          <div class="legend-item">
                              <span class="legend-badge" style="background: #d4edda; color: #155724;">P</span>
                              <span>Present</span>
                          </div>
                          <div class="legend-item">
                              <span class="legend-badge" style="background: #f8d7da; color: #721c24;">A</span>
                              <span>Absent</span>
                          </div>
                          <div class="legend-item">
                              <span class="legend-badge" style="background: #d1ecf1; color: #0c5460;">L</span>
                              <span>Leave</span>
                          </div>
                          <div class="legend-item">
                              <span class="legend-badge" style="background: #e2d9f3; color: #6f42c1;">HD</span>
                              <span>Half Day</span>
                          </div>
                          <div class="legend-item">
                              <span class="legend-badge" style="background: #fff3cd; color: #856404;">LT</span>
                              <span>Late</span>
                          </div>
                      </div>
                      
                      <table class="calendar">
                          <thead>
                              <tr>
                                  <th>Sunday</th>
                                  <th>Monday</th>
                                  <th>Tuesday</th>
                                  <th>Wednesday</th>
                                  <th>Thursday</th>
                                  <th>Friday</th>
                                  <th>Saturday</th>
                              </tr>
                          </thead>
                          <tbody>
                              ${generateStaffCalendarHTML()}
                          </tbody>
                      </table>
                  </div>
                  
                  <div class="stats-grid">
                      <div class="stat-card">
                          <div class="stat-number">${presentDays}</div>
                          <div class="stat-label">Present Days</div>
                      </div>
                      <div class="stat-card">
                          <div class="stat-number">${absentDays}</div>
                          <div class="stat-label">Absent Days</div>
                      </div>
                      <div class="stat-card">
                          <div class="stat-number">${leaveDays}</div>
                          <div class="stat-label">Leave Days</div>
                      </div>
                      <div class="stat-card">
                          <div class="stat-number">${halfDays}</div>
                          <div class="stat-label">Half Days</div>
                      </div>
                      <div class="stat-card">
                          <div class="stat-number">${attendanceRate}%</div>
                          <div class="stat-label">Attendance Rate</div>
                      </div>
                  </div>
              </div>
              
              <div class="footer">
                  <div class="footer-content">
                      <strong>Dental Clinic Pro</strong> - Staff Attendance Management System<br>
                      Generated on: <strong>${formatCurrentKarachiDate()}</strong> | Report Period: <strong>${monthNames[currentMonth]} ${currentYear}</strong>
                  </div>
              </div>
          </div>
      </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
  }

  const confirmDelete = () => {
    if (staffToDelete) {
      deleteStaff(staffToDelete.id)
      showToast('Staff member deleted successfully', 'success')
      setStaffToDelete(null)
      setShowDeleteConfirm(false)
    }
  }

  // Download sample CSV file for import
  const downloadSampleCSV = () => {
    const csvContent = `name,role,phone,email,joinDate,status,salary,gender,age,address,qualifications,experience,jobTerm
John Doe,Doctor,1234567890,john@email.com,2025-01-01,active,50000,male,30,123 Main St,MBBS,5 years,permanent
Jane Smith,Nurse,0987654321,jane@email.com,2025-01-02,active,30000,female,25,456 Oak Ave,BSN,3 years,permanent
Mike Johnson,Receptionist,1122334455,mike@email.com,2025-01-03,active,25000,male,28,789 Pine Rd,High School,2 years,contract`
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample_staff.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    showToast('Sample CSV downloaded!', 'success')
  }

  // Handle file import
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        let staffMembers: any[] = []

        if (file.name.endsWith('.csv')) {
          const content = e.target?.result as string
          // Simple CSV parsing
          const lines = content.split('\n').filter(line => line.trim() !== '')
          const headers = lines[0].split(',').map(h => h.trim())
          staffMembers = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim())
            const staff: any = {}
            headers.forEach((header, index) => {
              staff[header] = values[index] || ''
            })
            return staff
          })
        } else {
          showToast('Please select a CSV file', 'error')
          return
        }

        console.log('Parsed staff:', staffMembers) // Debug log

        // Process imported staff
        if (staffMembers.length > 0) {
          let successCount = 0
          let skippedCount = 0
          
          staffMembers.forEach((staffMember, index) => {
            // Validate required fields
            if (staffMember.name && staffMember.role && staffMember.name.trim() !== '' && staffMember.role.trim() !== '') {
              try {
                const newStaff = {
                  name: staffMember.name.trim(),
                  role: staffMember.role.trim(),
                  phone: staffMember.phone || '',
                  email: staffMember.email || '',
                  joinDate: staffMember.joinDate || new Date().toISOString().split('T')[0],
                  status: (staffMember.status || 'active').toLowerCase() as 'active' | 'inactive' | 'on_leave',
                  salary: parseFloat(staffMember.salary) || 0,
                  // Additional optional fields
                  gender: (staffMember.gender || 'male').toLowerCase() as 'male' | 'female' | 'other',
                  age: parseInt(staffMember.age) || 0,
                  address: staffMember.address || '',
                  qualifications: staffMember.qualifications || '',
                  experience: staffMember.experience || '',
                  jobTerm: (staffMember.jobTerm || 'permanent').toLowerCase() as 'permanent' | 'contract' | 'temporary'
                }
                
                console.log('Adding staff:', newStaff) // Debug log
                addStaff(newStaff)
                successCount++
              } catch (error) {
                console.error('Error adding staff:', staffMember, error)
                skippedCount++
              }
            } else {
              console.log('Skipping invalid staff member:', staffMember)
              skippedCount++
            }
          })
          
          showToast(`Import completed: ${successCount} staff members added, ${skippedCount} skipped`, 'success')
        } else {
          showToast('No valid staff data found in the file', 'error')
        }
      } catch (error) {
        console.error('Import error:', error)
        showToast('Error importing file. Please check the file format.', 'error')
      }
    }

    reader.readAsText(file)
    // Reset the input
    event.target.value = ''
  }

  const handleDeleteSalary = (salaryId: string) => {
    if (window.confirm('Are you sure you want to delete this salary record?')) {
      deleteSalary(salaryId)
      showToast('Salary record deleted successfully', 'success')
    }
  }

  const handlePrintSalary = (salary: SalaryType) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Salary Record - ${salary.staffName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
            .info-label { font-weight: bold; color: #374151; }
            .info-value { color: #6b7280; }
            .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
            .status-paid { background: #dcfce7; color: #166534; }
            .status-pending { background: #fef3c7; color: #92400e; }
            .footer { margin-top: 30px; text-align: center; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🦷 DentalCare Pro</h1>
            <h2>Salary Record</h2>
            <p>Professional Dental Management System</p>
          </div>
          
          <div class="info-grid">
            <div>
              <div class="info-label">Staff Name:</div>
              <div class="info-value">${salary.staffName || 'N/A'}</div>
            </div>
            <div>
              <div class="info-label">Period:</div>
              <div class="info-value">${salary.month} ${salary.year}</div>
            </div>
            <div>
              <div class="info-label">Basic Salary:</div>
              <div class="info-value">Rs ${salary.basicSalary?.toLocaleString() || '0'}</div>
            </div>
            <div>
              <div class="info-label">Total Salary:</div>
              <div class="info-value">Rs ${salary.totalSalary?.toLocaleString() || '0'}</div>
            </div>
            <div>
              <div class="info-label">Status:</div>
              <div class="info-value">
                <span class="status-badge status-${salary.status || 'pending'}">
                  ${(salary.status || 'pending').toUpperCase()}
                </span>
              </div>
            </div>
          </div>
          
          <div class="footer">
            <p>Generated on: ${new Date().toLocaleString()}</p>
            <p>This is a computer-generated document.</p>
          </div>
        </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  const handleViewSalaryDetails = (salary: SalaryType) => {
    setSelectedSalary(salary)
    setShowSalaryModal(true)
  }


  const confirmBulkDelete = () => {
    selectedStaff.forEach(staffId => {
      deleteStaff(staffId)
    })
    setSelectedStaff(new Set())
    setShowBulkDeleteConfirm(false)
    showToast(`${selectedStaff.size} staff members deleted successfully`, 'success')
  }

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked
    if (checked) {
      const newSelected = new Set(selectedStaff)
      paginatedStaff.forEach(staff => newSelected.add(staff.id))
      setSelectedStaff(newSelected)
    } else {
      const newSelected = new Set(selectedStaff)
      paginatedStaff.forEach(staff => newSelected.delete(staff.id))
      setSelectedStaff(newSelected)
    }
  }

  const handleSelectStaff = (staffId: string) => {
    const newSelected = new Set(selectedStaff)
    if (newSelected.has(staffId)) {
      newSelected.delete(staffId)
    } else {
      newSelected.add(staffId)
    }
    setSelectedStaff(newSelected)
  }

  return (
    <div className="p-6">
      {/* Staff Services Header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Staff List</h2>
        <button 
          onClick={handleToggleSettings}
          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Main Navigation Tabs */}
      <div className="bg-white border border-gray-200 rounded-lg p-2 mb-4 shadow-sm">
        <div className="flex gap-2">
          <button
            onClick={() => setMainTab('staff')}
            className={`flex items-center gap-2 px-4 py-2 border-none rounded-lg font-medium cursor-pointer ${
              mainTab === 'staff'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-transparent text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Users className="w-4 h-4" />
            Staff List
          </button>
          <button
            onClick={() => setMainTab('attendance')}
            className={`flex items-center gap-2 px-4 py-2 border-none rounded-lg font-medium cursor-pointer ${
              mainTab === 'attendance'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-transparent text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Clock className="w-4 h-4" />
            Attendance
          </button>
          <button
            onClick={() => setMainTab('salary')}
            className={`flex items-center gap-2 px-4 py-2 border-none rounded-lg font-medium cursor-pointer ${
              mainTab === 'salary'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-transparent text-gray-700 hover:bg-gray-50'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Salary
          </button>
        </div>
      </div>

      {/* Staff Tab Content */}
      {mainTab === 'staff' && (
        <>
          {/* Staff Filters and Actions */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-md">
            <div className="flex gap-4 items-center justify-between flex-wrap">
              {/* Staff Filter Dropdown */}
              <div className="flex items-center gap-2">
                <div className="relative" ref={filterDropdownRef}>
                  <button
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white border border-blue-600 rounded-lg text-sm font-medium cursor-pointer min-h-[44px] whitespace-nowrap hover:bg-blue-700 hover:border-blue-700"
                  >
                    <Users className="w-4 h-4 text-white" />
                    {currentFilter === 'all' ? 'Active Staff' :
                     currentFilter === 'inactive' ? 'Inactive Staff' :
                     currentFilter === 'on_leave' ? 'Leave' : 'Active Staff'}
                    <ChevronDown className={`w-4 h-4 ml-2 ${showFilterDropdown ? 'rotate-180' : ''} text-white`} />
                  </button>
                  
                  {showFilterDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      {filters.map((filter) => (
                        <button
                          key={filter.value}
                          onClick={() => {
                            setCurrentFilter(filter.value)
                            setShowFilterDropdown(false)
                          }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-blue-100 transition-colors ${
                            currentFilter === filter.value ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                          }`}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => setShowStaffForm(true)}
                  className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white border border-blue-600 rounded-lg text-sm font-medium cursor-pointer min-h-[44px] whitespace-nowrap hover:bg-blue-700 hover:border-blue-700"
                >
                  <Plus className="w-4 h-4 text-white" />
                  Add New Staff
                </button>
                
                {/* Import Button with Dropdown */}
                <div className="relative import-dropdown-container">
                  <button 
                    onClick={() => setShowImportDropdown(!showImportDropdown)}
                    className="flex items-center justify-center w-10 h-10 bg-primary-500 rounded-lg text-white hover:bg-primary-600"
                    title="Import Staff"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                  
                  {/* Import Dropdown */}
                  {showImportDropdown && (
                    <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      <div className="p-2">
                        <div className="text-xs font-medium text-gray-500 mb-2 px-2">Select file type to import:</div>
                        <button
                          onClick={() => {
                            document.getElementById('csvInput')?.click()
                            setShowImportDropdown(false)
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Import CSV
                        </button>
                        <div className="border-t border-gray-200 my-2"></div>
                        <button
                          onClick={() => downloadSampleCSV()}
                          className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Download Sample CSV
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={() => {
                    setIsRefreshingStaff(true)
                    // Show toast message
                    showToast('Refreshing staff list...', 'success')
                    
                    // Simulate data loading delay
                    setTimeout(() => {
                      // Reset search and filters
                      setSearchTerm('')
                      setCurrentFilter('all')
                      // Reset to first page
                      setCurrentStaffPage(1)
                      // Trigger data refresh
                      setRefreshTrigger(prev => prev + 1)
                      
                      // Stop loading after a short delay to show the refresh effect
                      setTimeout(() => {
                        setIsRefreshingStaff(false)
                      }, 500)
                    }, 200)
                  }}
                  disabled={isRefreshingStaff}
                  className="flex items-center justify-center w-10 h-10 bg-white border border-primary-500 rounded-lg text-primary-500 hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Refresh Staff"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshingStaff ? 'animate-spin' : ''}`} />
                </button>
                
                {/* Hidden file input for CSV import */}
                <input
                  id="csvInput"
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleFileImport(e)}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6 bg-white border border-gray-300 rounded-lg p-2 shadow-sm">
        <input
          type="text"
          placeholder="Search Staff..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pr-12  rounded-lg text-base bg-white focus:outline-none focus:border-primary-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]"
        />
        <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
      </div>

          {/* Staff List Header */}
          <div key={`staff-header-${refreshTrigger}`} className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-gray-700 font-medium">Total Staff: {filteredStaff.length}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-600 text-sm">
                  Showing {startIndex + 1}-{Math.min(startIndex + staffPerPage, filteredStaff.length)} of {filteredStaff.length} staff
                </span>
                {selectedStaff.size > 0 && (
                  <button
                    onClick={() => setShowBulkDeleteConfirm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white border border-red-500 rounded-lg text-sm font-medium cursor-pointer hover:bg-red-600 hover:border-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Selected
                  </button>
                )}
              </div>
            </div>
          

          {/* Staff List */}
          <div key={`staff-table-container-${refreshTrigger}`} className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Table Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedStaff.size === paginatedStaff.length && paginatedStaff.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                </div>
              </div>
            </div>
            </div>
            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {paginatedStaff.length > 0 ? (
                paginatedStaff.map((staffMember, index) => (
                    <motion.div
                      key={staffMember.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="staff-row flex items-center gap-6 p-4 border-b border-gray-200 transition-colors hover:bg-blue-50"
                      data-staff-id={staffMember.id}
                      data-staff-name={staffMember.name}
                    >
                      {/* Staff Selection Checkbox */}
                      <div className="flex items-center gap-4 min-w-[120px]">
                        <input
                          type="checkbox"
                          className="staff-checkbox w-4 h-4 cursor-pointer"
                          data-staff-id={staffMember.id}
                          checked={selectedStaff.has(staffMember.id)}
                          onChange={() => handleSelectStaff(staffMember.id)}
                        />
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-semibold text-sm">
                          {startIndex + index + 1}
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                          <i className="fas fa-user text-xl"></i>
                        </div>
                      </div>
                            
                      {/* Staff Details (Left Block) */}
                      <div className="flex flex-col gap-2 flex-1">
                        <div className="patient-name-box">
                          {staffMember.name}
                              </div>
                        <div className="flex gap-2 items-center">
                          <div className="px-3 py-1 bg-blue-100 rounded-lg">
                            <span className="text-sm font-medium text-blue-600">25 years</span>
                              </div>
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                            staffMember.gender === 'male' ? 'bg-blue-100' : 
                            staffMember.gender === 'female' ? 'bg-pink-100' : 'bg-gray-100'
                          }`}>
                            <i className={`fas ${
                              staffMember.gender === 'male' ? 'fa-mars text-blue-500' : 
                              staffMember.gender === 'female' ? 'fa-venus text-pink-500' : 'fa-user text-gray-500'
                            } text-sm`}></i>
                            </div>
                          </div>
                        </div>

                      {/* Staff Details (Middle Block) */}
                      <div className="flex flex-col gap-2 min-w-[200px]">
                        <div 
                          className="text-sm font-medium"
                          style={{
                            background: 'var(--primary-light)',
                            color: 'var(--primary-color)',
                            padding: '0.5rem 1rem',
                            borderRadius: 'var(--radius-lg)',
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: '500'
                          }}
                        >
                          <i className="fas fa-briefcase" style={{ marginRight: '0.5rem' }}></i>
                          {staffMember.role || 'Position'}
                              </div>
                        
                        <div 
                          className="text-sm font-medium"
                          style={{
                            background: 'var(--primary-light)',
                            color: 'var(--primary-color)',
                            padding: '0.5rem 1rem',
                            borderRadius: 'var(--radius-lg)',
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: '500'
                          }}
                        >
                          <i className="fas fa-phone" style={{ marginRight: '0.5rem' }}></i>
                          {staffMember.phone}
                            </div>
                            
                        <div 
                          className="text-sm font-medium"
                          style={{
                            background: 'var(--primary-light)',
                            color: 'var(--primary-color)',
                            padding: '0.5rem 1rem',
                            borderRadius: 'var(--radius-lg)',
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: '500'
                          }}
                        >
                          <i className="fas fa-calendar-alt" style={{ marginRight: '0.5rem' }}></i>
                          {formatDate(staffMember.joinDate)}
                            </div>
                            
                            
                        <div className="flex items-center gap-2">
                          <span 
                            className="flex items-center gap-2"
                            style={{
                              background: staffMember.status === 'active' ? 'var(--success-color)' : 
                                         staffMember.status === 'inactive' ? 'var(--error-color)' : 
                                         staffMember.status === 'on_leave' ? 'var(--warning-color)' : 'var(--success-color)',
                              color: 'var(--white)',
                              padding: '0.5rem 1rem',
                              borderRadius: 'var(--radius-lg)',
                              fontSize: 'var(--font-size-sm)',
                              fontWeight: '500',
                              textAlign: 'center',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                          >
                            <i className={`fas ${
                              staffMember.status === 'active' ? 'fa-user-check' : 
                              staffMember.status === 'inactive' ? 'fa-user-times' : 
                              staffMember.status === 'on_leave' ? 'fa-user-clock' : 'fa-user-check'
                            }`}></i>
                            {staffMember.status === 'active' ? 'Active' : 
                             staffMember.status === 'inactive' ? 'Inactive' : 
                             staffMember.status === 'on_leave' ? 'Leave' : 'Active'}
                          </span>
                          {staffMember.status !== 'active' && (
                            <button
                              onClick={() => handleReActivate(staffMember)}
                              className="border-none cursor-pointer transition-all duration-200 hover:scale-110"
                              style={{
                                width: '36px',
                                height: '36px',
                                padding: '0px',
                                background: 'var(--success-color)',
                                color: 'var(--white)',
                                borderRadius: 'var(--radius-md)',
                                border: 'none',
                                cursor: 'pointer',
                                transition: '0.2s ease-in-out',
                                transform: 'scale(1)'
                              }}
                              title="Re-activate"
                              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                              <i className="fas fa-user-check"></i>
                            </button>
                          )}
                          {staffMember.status === 'active' && (
                            <button
                              onClick={() => handleSetOnLeave(staffMember)}
                              className="border-none cursor-pointer transition-all duration-200 hover:scale-110"
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
                              title="Set on Leave"
                              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                              <i className="fas fa-user-clock"></i>
                            </button>
                          )}
                          {staffMember.status !== 'inactive' && (
                            <button
                              onClick={() => handleSetInactive(staffMember)}
                              className="border-none cursor-pointer transition-all duration-200 hover:scale-110"
                              style={{
                                width: '36px',
                                height: '36px',
                                padding: '0px',
                                background: 'var(--error-color)',
                                color: 'var(--white)',
                                borderRadius: 'var(--radius-md)',
                                border: 'none',
                                cursor: 'pointer',
                                transition: '0.2s ease-in-out',
                                transform: 'scale(1)'
                              }}
                              title="Mark as Inactive"
                              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                              <i className="fas fa-user-times"></i>
                            </button>
                          )}
                            </div>
                          </div>

                      {/* Action Buttons (Right Block) */}
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleViewStaff(staffMember)}
                          className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 hover:bg-blue-200"
                          title="View Details"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        <button
                          onClick={() => handleEditStaff(staffMember)}
                          className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 hover:bg-blue-200"
                          title="Update Staff"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={() => handlePrintStaff(staffMember)}
                          className="w-10 h-10 bg-white border border-yellow-300 rounded-lg flex items-center justify-center text-yellow-600 hover:bg-yellow-50"
                          title="Print Staff Record"
                        >
                          <i className="fas fa-print"></i>
                        </button>
                        <button
                          onClick={() => handleDeleteStaff(staffMember.id)}
                          className="w-10 h-10 bg-white border border-red-300 rounded-lg flex items-center justify-center text-red-600 hover:bg-red-50"
                          title="Delete"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </motion.div>
                  ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-medium mb-2">No staff members found</h3>
                  <p>Get started by adding your first staff member</p>
                </div>
              )}
            </div>
          

          {/* Pagination Footer */}
          {filteredStaff.length > 0 && (
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 text-sm">Show</span>
                  <select
                    value={staffPerPage}
                    onChange={(e) => {
                      setStaffPerPage(Number(e.target.value))
                      setCurrentStaffPage(1) // Reset to first page when changing page size
                    }}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                  <span className="text-gray-600 text-sm">Staff</span>
                </div>
                
                {/* Pagination Navigation */}
                <div className="flex items-center gap-2">
                  {/* Previous Button */}
                              <button
                    onClick={prevPage}
                    disabled={currentStaffPage === 1}
                    className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg ${
                      currentStaffPage === 1
                        ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800 bg-white border border-gray-300'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                              </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {getPageNumbers.map((page, index) => (
                      <div key={index}>
                        {page === '...' ? (
                          <span className="px-3 py-2 text-gray-400">...</span>
                        ) : (
                              <button
                            onClick={() => goToPage(page as number)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg ${
                              currentStaffPage === page
                                ? 'bg-blue-500 text-white'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800 bg-white border border-gray-300'
                            }`}
                          >
                            {page}
                              </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Next Button */}
                              <button
                    onClick={nextPage}
                    disabled={currentStaffPage === totalPages}
                    className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg ${
                      currentStaffPage === totalPages
                        ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800 bg-white border border-gray-300'
                    }`}
                  >
                    Next
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                              </button>
                            </div>
                          </div>
                        
              </div>
              
            )}
        </div>
        </>
      )} 
      
    

      {/* Salary Tab Content */}
      {mainTab === 'salary' && (
        <>
          {/* Salary Filters and Actions */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-md">
            <div className="flex gap-4 items-center justify-between flex-wrap">
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white border border-blue-600 rounded-lg text-sm font-medium">
                  <DollarSign className="w-4 h-4" />
                  All Salaries
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => setShowSalaryForm(true)}
                  className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white border border-blue-600 rounded-lg text-sm font-medium cursor-pointer min-h-[44px] whitespace-nowrap hover:bg-blue-700 hover:border-blue-700"
                >
                  <Plus className="w-4 h-4 text-white" />
                  Create Salary
                </button>
                <button className="flex items-center justify-center w-11 h-11 bg-white text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors">
                  <Download className="w-4 h-4" />
                </button>
                <button className="flex items-center justify-center w-11 h-11 bg-white text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6 bg-white border border-gray-300 rounded-lg p-2 shadow-sm">
            <input
              type="text"
              placeholder="Search salary records..."
              className="w-full px-4 py-3 pr-12 rounded-lg text-base bg-white focus:outline-none focus:border-primary-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]"
            />
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>

          {/* Salary Grid Container */}
          <div key={`salary-grid-container-${refreshTrigger}`} className="bg-white rounded-lg shadow-md p-6 mb-4">
            {/* Count Display at the top of the grid */}
            <div className="flex justify-between items-center pb-4 border-b border-gray-200 mb-6">
              <div className="text-gray-700 font-semibold text-base">
                Total Salary Records: <span className="text-blue-600">{salaries.length}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-gray-600 text-sm">
                  Showing <span>1</span> - <span>{salaries.length}</span> of <span>{salaries.length}</span> salary records
                </div>
                <button 
                  className="px-4 py-2 bg-red-500 text-white rounded-md cursor-pointer font-medium transition-all duration-200 hover:opacity-80 hidden"
                  title="Delete Selected"
                >
                  <i className="fas fa-trash-alt mr-2"></i>
                  Delete Selected
                </button>
              </div>
            </div>

            {/* Table Header with Select All and Actions Column */}
            <div className="flex items-center gap-6 p-4 bg-gray-50 border-b border-gray-200 font-semibold text-gray-700 mb-4 rounded-md">
              <div className="min-w-[120px] flex items-center gap-4">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="text-sm text-blue-600">Select All</span>
              </div>
              <div className="flex-1 text-center text-sm text-blue-600">Salary Information</div>
              <div className="min-w-[100px] text-center text-sm text-blue-600">Actions</div>
            </div>
            
            {/* Salary Rows */}
            {salaries.length > 0 ? (
              <div className="space-y-0">
                {salaries.map((salary, index) => (
                  <motion.div
                    key={salary.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-6 p-4 border-b border-gray-200 transition-colors duration-200 cursor-pointer hover:bg-gray-100"
                    style={{ borderBottom: index === salaries.length - 1 ? 'none' : '1px solid #e5e7eb' }}
                  >
                    {/* Salary Selection Checkbox */}
                    <div className="flex items-center gap-4 min-w-[120px]">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 cursor-pointer"
                      />
                      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl">
                        <i className="fas fa-money-bill-wave"></i>
                      </div>
                    </div>
                    
                    {/* Salary Details (Left Block) */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex flex-col gap-2 w-full">
                        <div className="bg-blue-100 text-blue-600 p-3 rounded-lg font-semibold text-base w-full flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <i className="fas fa-user mr-2"></i>
                            {salary.staffName || 'Unknown Staff'}
                          </div>
                        </div>
                        <div className="inline-flex items-center gap-2 w-fit">
                          <span className="bg-blue-100 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 w-fit">
                            <i className="fas fa-briefcase"></i>
                            {salary.staffName || 'N/a'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Salary Details (Middle Block) */}
                    <div className="flex flex-col gap-2 min-w-[200px]">
                      <div className="bg-blue-100 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium">
                        <i className="fas fa-calendar-alt mr-2"></i>
                        {salary.month} {salary.year}
                      </div>
                      <div className="bg-blue-100 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium">
                        <i className="fas fa-money-bill-wave mr-2"></i>
                        Rs&nbsp;{salary.totalSalary?.toLocaleString() || '0'}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-4 py-2 rounded-lg text-sm font-medium text-center flex items-center gap-2 ${
                          salary.status === 'paid' 
                            ? 'bg-green-500 text-white' 
                            : 'bg-yellow-500 text-white'
                        }`}>
                          <i className={`fas ${salary.status === 'paid' ? 'fa-check-circle' : 'fa-clock'}`}></i>
                          {salary.status === 'paid' ? 'Paid' : 'Pending'}
                        </span>
                        <button 
                          className="w-9 h-9 p-0 bg-green-500 text-white rounded-md border-none cursor-pointer transition-all duration-200 hover:scale-110"
                          title="Mark as Paid"
                        >
                          <i className="fas fa-check-circle"></i>
                        </button>
                        <button 
                          className="w-9 h-9 p-0 bg-yellow-500 text-white rounded-md border-none cursor-pointer transition-all duration-200 hover:scale-110"
                          title="Mark as Pending"
                        >
                          <i className="fas fa-clock"></i>
                        </button>
                      </div>
                    </div>
                    
                    {/* Action Buttons Column */}
                    <div className="flex gap-2 flex-shrink-0 min-w-[100px] justify-center">
                      <button 
                        onClick={() => handleViewSalaryDetails(salary)}
                        className="w-10 h-10 p-0 bg-blue-100 text-blue-600 rounded-md border-none cursor-pointer transition-all duration-200 hover:scale-110"
                        title="View Details"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button 
                        onClick={() => handleEditSalary(salary)}
                        className="w-10 h-10 p-0 bg-blue-100 text-blue-600 rounded-md border-none cursor-pointer transition-all duration-200 hover:scale-110"
                        title="Edit Salary"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        onClick={() => handlePrintSalary(salary)}
                        className="w-10 h-10 p-0 bg-white text-yellow-500 border border-yellow-500 rounded-md cursor-pointer transition-all duration-200 hover:scale-110"
                        title="Print"
                      >
                        <i className="fas fa-print"></i>
                      </button>
                      <button 
                        onClick={() => handleDeleteSalary(salary.id)}
                        className="w-10 h-10 p-0 bg-white text-red-500 border border-red-500 rounded-md cursor-pointer transition-all duration-200 hover:scale-110"
                        title="Delete"
                      >
                        <i className="fas fa-trash"></i>
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
            
            {/* Pagination Controls and Entries Dropdown at Bottom */}
            <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-200 flex-wrap gap-4">
              {/* Show Entries Dropdown (Bottom-Right) */}
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <span>Show</span>
                <select className="px-2 py-1 border border-gray-300 rounded-md bg-white text-gray-700 text-sm cursor-pointer">
                  <option value="10" selected>10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
                <span>entries</span>
              </div>

              <div className="flex justify-center items-center gap-2 flex-wrap">
                <div className="text-gray-600 text-sm mr-4">
                  Page 1 of 1
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Attendance Tab Content */}
      {mainTab === 'attendance' && (
        <>
          {/* Raw Data List View */}
          {(
            /* Raw Data List View */
            <>
              {/* Holiday Indicator */}
              {isTodayHoliday() && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
                      <i className="fas fa-calendar-times text-white"></i>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-yellow-800">
                        Today is a Holiday ({getCurrentKarachiTime().toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Asia/Karachi' })})
                      </h3>
                      <p className="text-yellow-600">No attendance marking required. Salary will not be deducted.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Attendance Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Present Today Card */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-md">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <i className="fas fa-user-check text-white text-lg"></i>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {(() => {
                          const today = getCurrentKarachiTime().toISOString().split('T')[0]
                          const isHolidayToday = isTodayHoliday()
                          if (isHolidayToday) return 0 // No present count on holidays
                          return filteredStaff.filter(staff => {
                            const record = attendanceRecords[`${staff.id}-${today}`]
                            return record && (record.status === 'present' || record.status === 'late')
                          }).length
                        })()}
                      </div>
                      <div className="text-sm text-gray-600">Present Today</div>
                    </div>
                  </div>
                </div>

                {/* Absent Today Card */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-md">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                      <i className="fas fa-user-times text-white text-lg"></i>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {(() => {
                          const today = getCurrentKarachiTime().toISOString().split('T')[0]
                          const isHolidayToday = isTodayHoliday()
                          if (isHolidayToday) return 0 // No absent count on holidays
                          return filteredStaff.filter(staff => {
                            const record = attendanceRecords[`${staff.id}-${today}`]
                            return record && record.status === 'absent'
                          }).length
                        })()}
                      </div>
                      <div className="text-sm text-gray-600">Absent Today</div>
                    </div>
                  </div>
                </div>

                {/* Late Today Card */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-md">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                      <i className="fas fa-clock text-white text-lg"></i>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {(() => {
                          const today = getCurrentKarachiTime().toISOString().split('T')[0]
                          const isHolidayToday = isTodayHoliday()
                          if (isHolidayToday) return 0 // No late count on holidays
                          return filteredStaff.filter(staff => {
                            const record = attendanceRecords[`${staff.id}-${today}`]
                            return record && record.status === 'late'
                          }).length
                        })()}
                      </div>
                      <div className="text-sm text-gray-600">Late Today</div>
                    </div>
                  </div>
                </div>

                {/* Leave Card */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-md">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <i className="fas fa-calendar-times text-white text-lg"></i>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {(() => {
                          const today = getCurrentKarachiTime().toISOString().split('T')[0]
                          const isHolidayToday = isTodayHoliday()
                          if (isHolidayToday) return 0 // No leave count on holidays
                          return filteredStaff.filter(staff => {
                            const record = attendanceRecords[`${staff.id}-${today}`]
                            return record && record.status === 'leave'
                          }).length
                        })()}
                      </div>
                      <div className="text-sm text-gray-600">Leave</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative mb-6 bg-white border border-gray-300 rounded-lg p-2 shadow-sm">
        <input
          type="text"
          placeholder="Search Attendance Records..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pr-12  rounded-lg text-base bg-white focus:outline-none focus:border-primary-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]"
        />
        <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
      </div>

              {/* Active Staff List */}
              <div key={`attendance-staff-container-${refreshTrigger}`} className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-semibold text-gray-900">Active Staff: {filteredAttendanceStaff.length}</h3>
                </div>
                <div className="text-sm text-gray-600">
                  Showing {((currentAttendancePage - 1) * attendancePerPage) + 1}-{Math.min(((currentAttendancePage - 1) * attendancePerPage) + attendancePerPage, filteredAttendanceStaff.length)} of {filteredAttendanceStaff.length} active staff members
                </div>
              </div>
            </div>

            {/* Staff List */}
            <div className="divide-y divide-gray-200">
              {filteredAttendanceStaff.length > 0 ? (
                filteredAttendanceStaff.slice((currentAttendancePage - 1) * attendancePerPage, currentAttendancePage * attendancePerPage).map((staffMember, index) => {
                  const attendanceStatus = getAttendanceStatus(staffMember)
                  return (
                    <motion.div
                      key={staffMember.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="attendance-row"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.5rem',
                        padding: '1rem',
                        borderBottom: '1px solid var(--gray-200)',
                        transition: 'background-color 0.2s',
                        cursor: 'pointer',
                        backgroundColor: 'transparent'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--gray-100)'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* Staff Avatar */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        minWidth: '120px'
                      }}>
                        <div 
                          className="attendance-avatar"
                          style={{
                            width: '40px',
                            height: '40px',
                            background: 'var(--primary-light)',
                            borderRadius: 'var(--radius-lg)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '600',
                            color: 'var(--primary-color)',
                            fontSize: 'var(--font-size-sm)',
                            flexShrink: '0'
                          }}
                        >
                          {((currentAttendancePage - 1) * attendancePerPage) + index + 1}
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
                          <i className="fas fa-user" style={{ fontSize: '1rem' }}></i>
                        </div>
                      </div>
                      
                      {/* Staff Info */}
                      <div 
                        className="attendance-info"
                        style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem'
                        }}
                      >
                        <div 
                          className="attendance-staff-name"
                          style={{
                            background: 'var(--primary-light)',
                            color: 'var(--primary-color)',
                            padding: '0.5rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: '600',
                            fontSize: 'var(--font-size-sm)',
                            display: 'inline-block',
                            width: '100%'
                          }}
                        >
                          {staffMember.name}
                        </div>
                        <div 
                          className="attendance-staff-role"
                          style={{
                            background: 'var(--primary-light)',
                            color: 'var(--primary-color)',
                            padding: '0.25rem 0.75rem',
                            borderRadius: 'var(--radius-md)',
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: '500',
                            display: 'inline-block',
                            width: 'fit-content'
                          }}
                        >
                          {staffMember.role}
                        </div>
                      </div>
                      
                      {/* Attendance Status Section */}
                      <div 
                        className="attendance-status-section"
                        style={{
                          textAlign: 'center',
                          marginLeft: 'auto',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <div 
                          className="attendance-date-display"
                          style={{
                            background: 'var(--primary-light)',
                            color: 'var(--primary-color)',
                            padding: '0.25rem 0.75rem',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            display: 'inline-block'
                          }}
                        >
                          {formatCurrentKarachiDate()}
                        </div>
                        
                        {(() => {
                          const today = getCurrentKarachiTime().toISOString().split('T')[0]
                          const recordKey = `${staffMember.id}-${today}`
                          const record = attendanceRecords[recordKey]
                          const isCheckedOut = isStaffCheckedOut(staffMember)
                          const checkoutTime = getCheckoutTime(staffMember)
                          const isHolidayToday = isTodayHoliday()
                          console.log(`Displaying attendance for ${staffMember.name}:`, { today, recordKey, record, isCheckedOut, checkoutTime, isHolidayToday })
                          console.log('All attendance records:', attendanceRecords)
                          
                          // If today is a holiday, show holiday status
                          if (isHolidayToday) {
                            return (
                              <>
                                <div 
                                  className="attendance-status"
                                  style={{
                                    background: 'var(--warning-light)',
                                    color: 'var(--warning-color)',
                                    padding: '0.5rem 1rem',
                                    borderRadius: 'var(--radius-md)',
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    display: 'inline-block'
                                  }}
                                >
                                  <i className="fas fa-calendar-times" style={{ marginRight: '0.5rem' }}></i>
                                  HOLIDAY ({getCurrentKarachiTime().toLocaleDateString('en-US', { weekday: 'short', timeZone: 'Asia/Karachi' })} - {formatCurrentKarachiTime()})
                                </div>
                              </>
                            )
                          }
                          
                          if (record) {
                            return (
                              <>
                                <div 
                                  className={`attendance-status ${record.status}`}
                                  style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: 'var(--radius-full)',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    textTransform: 'uppercase',
                                    background: record.status === 'present' ? 'var(--success-light)' :
                                               record.status === 'absent' ? 'var(--error-light)' :
                                               record.status === 'late' ? 'var(--warning-light)' :
                                               record.status === 'leave' ? 'var(--warning-light)' :
                                               'var(--info-light)',
                                    color: record.status === 'present' ? 'var(--success-color)' :
                                           record.status === 'absent' ? 'var(--error-color)' :
                                           record.status === 'late' ? 'var(--warning-color)' :
                                           record.status === 'leave' ? 'var(--warning-color)' :
                                           'var(--info-color)'
                                  }}
                                >
                                  {record.status.toUpperCase()} ({record.time})
                                </div>
                                {isCheckedOut && (
                                  <div 
                                    style={{
                                      padding: '0.25rem 0.75rem',
                                      borderRadius: 'var(--radius-full)',
                                      fontSize: '0.75rem',
                                      fontWeight: '600',
                                      background: 'var(--warning-light)',
                                      color: 'var(--warning-color)',
                                      display: 'inline-block'
                                    }}
                                  >
                                    Checked out: {checkoutTime}
                                  </div>
                                )}
                              </>
                            )
                          } else {
                            // Show "NOT MARKED" when no attendance record exists
                            return (
                              <div 
                                className="attendance-status not-marked"
                                style={{
                                  padding: '0.5rem 1rem',
                                  borderRadius: 'var(--radius-md)',
                                  fontSize: '0.875rem',
                                  fontWeight: '600',
                                  display: 'inline-block',
                                  background: 'var(--gray-light)',
                                  color: 'var(--gray-color)',
                                  border: '1px solid var(--gray-300)'
                                }}
                              >
                                NOT MARKED
                              </div>
                            )
                          }
                        })()}
                      </div>
                      
                      {/* Action Buttons */}
                      <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        flexShrink: '0'
                      }}>
                        {(() => {
                          const today = getCurrentKarachiTime().toISOString().split('T')[0]
                          const recordKey = `${staffMember.id}-${today}`
                          const record = attendanceRecords[recordKey]
                          const isCheckedOut = isStaffCheckedOut(staffMember)
                          const isHolidayToday = isTodayHoliday()
                          console.log(`Button logic for ${staffMember.name}:`, { today, recordKey, record, isCheckedOut, isHolidayToday })
                          console.log('All attendance records in button logic:', attendanceRecords)
                          
                          // Don't show any buttons on holidays
                          if (isHolidayToday) {
                            return null
                          }
                          
                          if (record && !isCheckedOut) {
                            // Show checkout button if attendance is marked but not checked out
                            return (
                              <button
                                onClick={() => handleCheckout(staffMember)}
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  padding: '0px',
                                  background: 'var(--warning-light)',
                                  color: 'var(--warning-color)',
                                  borderRadius: 'var(--radius-md)',
                                  border: 'none',
                                  cursor: 'pointer',
                                  transition: '0.2s ease-in-out',
                                  transform: 'scale(1)'
                                }}
                                title="Checkout"
                                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                              >
                                <i className="fas fa-sign-out-alt"></i>
                              </button>
                            )
                          } else if (record && isCheckedOut) {
                            // Show mark attendance button if already checked out
                            return (
                              <button
                                onClick={() => handleMarkAttendance(staffMember)}
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  padding: '0px',
                                  background: 'var(--primary-light)',
                                  color: 'var(--primary-color)',
                                  borderRadius: 'var(--radius-md)',
                                  border: 'none',
                                  cursor: 'pointer',
                                  transition: '0.2s ease-in-out',
                                  transform: 'scale(1)'
                                }}
                                title="Mark Attendance"
                                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                              >
                                <i className="fas fa-plus"></i>
                              </button>
                            )
                          } else {
                            // Show mark attendance button if no attendance recorded
                            return (
                              <button
                                onClick={() => handleMarkAttendance(staffMember)}
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  padding: '0px',
                                  background: 'var(--primary-light)',
                                  color: 'var(--primary-color)',
                                  borderRadius: 'var(--radius-md)',
                                  border: 'none',
                                  cursor: 'pointer',
                                  transition: '0.2s ease-in-out',
                                  transform: 'scale(1)'
                                }}
                                title="Mark Attendance"
                                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                              >
                                <i className="fas fa-plus"></i>
                              </button>
                            )
                          }
                        })()}
                        
                        <button
                          onClick={() => handleViewAttendanceCalendar(staffMember)}
                          style={{
                            width: '40px',
                            height: '40px',
                            padding: '0px',
                            background: 'var(--primary-light)',
                            color: 'var(--primary-color)',
                            borderRadius: 'var(--radius-md)',
                            border: 'none',
                            cursor: 'pointer',
                            transition: '0.2s ease-in-out',
                            transform: 'scale(1)'
                          }}
                          title="View Details"
                          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        
                        <button
                          onClick={() => handlePrintStaffAttendance(staffMember)}
                          style={{
                            width: '40px',
                            height: '40px',
                            padding: '0px',
                            background: 'var(--white)',
                            color: 'var(--warning-color)',
                            border: '1px solid var(--warning-color)',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            transition: '0.2s ease-in-out',
                            transform: 'scale(1)'
                          }}
                          title="Print Attendance Report"
                          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          <i className="fas fa-print"></i>
                        </button>
                      </div>
                    </motion.div>
                  )
                })
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No staff found</h3>
                  <p className="text-gray-500">No staff members match your search criteria.</p>
                </div>
              )}
            </div>

            {/* Pagination Footer */}
            {filteredAttendanceStaff.length > 0 && (
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 text-sm">Show</span>
                    <select
                      value={attendancePerPage}
                      onChange={(e) => {
                        setAttendancePerPage(Number(e.target.value))
                        setCurrentAttendancePage(1)
                      }}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                    <span className="text-gray-600 text-sm">staff per page</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentAttendancePage(prev => Math.max(prev - 1, 1))}
                      disabled={currentAttendancePage === 1}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, Math.ceil(filteredAttendanceStaff.length / attendancePerPage)) }, (_, i) => {
                        const pageNum = i + 1
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentAttendancePage(pageNum)}
                            className={`px-3 py-1 border rounded-md text-sm ${
                              currentAttendancePage === pageNum
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}
                    </div>
                    
                    <button
                      onClick={() => setCurrentAttendancePage(prev => Math.min(prev + 1, Math.ceil(filteredAttendanceStaff.length / attendancePerPage)))}
                      disabled={currentAttendancePage === Math.ceil(filteredAttendanceStaff.length / attendancePerPage)}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
            </>
          )}
        </>
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
          staffMembers={staff.map(s => ({ id: s.id, name: s.name }))}
          onSave={handleSaveSalary}
          onClose={() => {
            setShowSalaryForm(false)
            setEditingSalary(null)
          }}
        />
      )}

      {/* Salary Details Modal */}
      {showSalaryModal && selectedSalary && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] relative border border-gray-200 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <i className="fas fa-money-bill-wave text-2xl text-blue-600"></i>
                <h2 className="m-0 text-2xl font-semibold">Salary Details</h2>
              </div>
              <button 
                onClick={() => setShowSalaryModal(false)}
                className="bg-blue-600 text-white border-none rounded-full w-9 h-9 cursor-pointer flex items-center justify-center text-lg transition-all duration-300 hover:bg-blue-700"
              >
                ×
              </button>
            </div>
            
            {/* Body */}
            <div className="p-8 overflow-y-auto flex-1 bg-gray-50">
              <div className="grid grid-cols-2 gap-6">
                
                {/* Staff Information Card */}
                <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                      <i className="fas fa-user text-base"></i>
                    </div>
                    <h3 className="m-0 text-blue-600 text-xl font-semibold">Staff Information</h3>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <span className="text-gray-600 font-medium text-sm">Name</span>
                      <span className="text-blue-600 font-semibold text-sm">{selectedSalary.staffName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <span className="text-gray-600 font-medium text-sm">Role</span>
                      <span className="text-blue-600 font-semibold text-sm">{selectedSalary.staffName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <span className="text-gray-600 font-medium text-sm">Phone</span>
                      <span className="text-blue-600 font-semibold text-sm">Not specified</span>
                    </div>
                  </div>
                </div>
                
                {/* Salary Information Card */}
                <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                      <i className="fas fa-calendar-alt text-base"></i>
                    </div>
                    <h3 className="m-0 text-blue-600 text-xl font-semibold">Salary Information</h3>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <span className="text-gray-600 font-medium text-sm">Month</span>
                      <span className="text-blue-600 font-semibold text-sm">{selectedSalary.month} {selectedSalary.year}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <span className="text-gray-600 font-medium text-sm">Status</span>
                      <span className={`px-3 py-1 rounded-md text-xs font-medium ${
                        selectedSalary.status === 'paid' 
                          ? 'bg-green-500 text-white' 
                          : 'bg-yellow-500 text-white'
                      }`}>
                        {selectedSalary.status || 'pending'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <span className="text-gray-600 font-medium text-sm">Payment Date</span>
                      <span className="text-blue-600 font-semibold text-sm">Not specified</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Financial Details Card */}
              <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200 mt-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                    <i className="fas fa-calculator text-base"></i>
                  </div>
                  <h3 className="m-0 text-blue-600 text-xl font-semibold">Financial Details</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <span className="text-gray-600 font-medium text-sm">Base Amount</span>
                    <span className="text-blue-600 font-semibold text-sm">Rs. {selectedSalary.basicSalary?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <span className="text-gray-600 font-medium text-sm">Total Allowance</span>
                    <span className="text-green-600 font-semibold text-sm">Rs. 0</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <span className="text-gray-600 font-medium text-sm">Total Deduction</span>
                    <span className="text-red-600 font-semibold text-sm">Rs. 0</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-100 rounded-md border-2 border-green-500">
                    <span className="text-green-600 font-semibold text-base">Net Salary</span>
                    <span className="text-green-600 font-bold text-lg">Rs. {selectedSalary.totalSalary?.toLocaleString() || '0'}</span>
                  </div>
                </div>
              </div>
              
              {/* Attendance Summary Card */}
              <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200 mt-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600">
                    <i className="fas fa-calendar-check text-base"></i>
                  </div>
                  <h3 className="m-0 text-blue-600 text-xl font-semibold">Attendance Summary</h3>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <span className="text-gray-600 font-medium text-sm">Working Days</span>
                    <span className="text-blue-600 font-semibold text-sm">0</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-100 rounded-md">
                    <span className="text-green-600 font-medium text-sm">Present Days</span>
                    <span className="text-green-600 font-semibold text-sm">0</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-100 rounded-md">
                    <span className="text-red-600 font-medium text-sm">Absent Days</span>
                    <span className="text-red-600 font-semibold text-sm">0</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-100 rounded-md">
                    <span className="text-yellow-600 font-medium text-sm">Leave Days</span>
                    <span className="text-yellow-600 font-semibold text-sm">0</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-100 rounded-md">
                    <span className="text-blue-600 font-medium text-sm">Late Days</span>
                    <span className="text-blue-600 font-semibold text-sm">0</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-100 rounded-md">
                    <span className="text-purple-600 font-medium text-sm">Half Days</span>
                    <span className="text-purple-600 font-semibold text-sm">0</span>
                  </div>
                </div>
              </div>
              
              {/* Notes Card */}
              <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200 mt-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                    <i className="fas fa-sticky-note text-base"></i>
                  </div>
                  <h3 className="m-0 text-blue-600 text-xl font-semibold">Notes</h3>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md border-l-4 border-blue-600">
                  <p className="text-gray-700 italic m-0 leading-relaxed">No notes available</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && staffToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[999999] max-w-none">
          <div className="modal-content bg-white rounded-xl shadow-2xl" style={{maxWidth: '400px', width: '90%'}}>
            <div className="modal-header flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 m-0">Confirm Delete</h3>
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
              >
                &times;
              </button>
            </div>
            <div style={{padding: '1.5rem'}}>
              <p style={{marginBottom: '1.5rem', color: '#374151', lineHeight: '1.5'}}>
                Are you sure you want to delete staff <strong>"{staffToDelete?.name}"</strong>? 
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
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[999999] max-w-none">
          <div className="modal-content bg-white rounded-xl shadow-2xl" style={{maxWidth: '400px', width: '90%'}}>
            <div className="modal-header flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 m-0">Confirm Bulk Delete</h3>
              <button 
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
              >
                &times;
              </button>
            </div>
            <div style={{padding: '1.5rem'}}>
              <p style={{marginBottom: '1.5rem', color: '#374151', lineHeight: '1.5'}}>
                Are you sure you want to delete <strong>{selectedStaff.size} selected staff member(s)</strong>? 
                <br /><br />
                <strong>Staff Members:</strong> {Array.from(selectedStaff)
                  .map(id => staff.find(s => s.id === id)?.name)
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

      {/* Staff Details Modal */}
      {showStaffDetails && selectedStaffDetails && (
        <div 
          key={`staff-details-modal-${selectedStaffDetails.id}-${Date.now()}`}
          className="modal active"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
          onClick={() => setShowStaffDetails(false)}
        >
          <div 
            className="modal-content"
            style={{
              background: 'var(--white)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-xl)',
              width: '100%',
              maxWidth: '900px',
              maxHeight: '85vh',
              position: 'relative',
              border: '1px solid var(--gray-200)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div 
              className="modal-header"
              style={{
                padding: '1.5rem 2rem',
                borderBottom: '1px solid var(--gray-200)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <i className="fas fa-user-tie" style={{ fontSize: '1.5rem', color: 'var(--primary-color)' }}></i>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Staff Details</h2>
              </div>
              <button 
                onClick={() => setShowStaffDetails(false)}
                style={{
                  background: 'var(--primary-color)',
                  color: 'var(--white)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.125rem',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'var(--primary-hover)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'var(--primary-color)'}
              >
                x
              </button>
            </div>
            
            {/* Body */}
            <div 
              className="modal-body scrollbar-hide"
              style={{
                padding: '2rem',
                overflowY: 'auto',
                flex: 1,
                background: 'var(--gray-50)',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitScrollbar: { display: 'none' }
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                
                {/* Staff Information Card */}
                <div style={{
                  background: 'var(--white)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                  boxShadow: 'var(--shadow-md)',
                  border: '1px solid var(--gray-200)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      background: 'var(--primary-light)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary-color)'
                    }}>
                      <i className="fas fa-user-tie" style={{ fontSize: '1rem' }}></i>
                    </div>
                    <h3 style={{ margin: 0, color: 'var(--gray-800)', fontSize: '1.125rem', fontWeight: 600 }}>Staff Information</h3>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                      <span style={{ color: 'var(--gray-600)', fontWeight: 500, fontSize: '0.875rem' }}>Staff Name</span>
                      <span style={{ color: 'var(--primary-color)', fontWeight: 600, fontSize: '0.875rem' }}>{selectedStaffDetails.name}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                      <span style={{ color: 'var(--gray-600)', fontWeight: 500, fontSize: '0.875rem' }}>Phone</span>
                      <span style={{ color: 'var(--primary-color)', fontWeight: 600, fontSize: '0.875rem' }}>{selectedStaffDetails.phone}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                      <span style={{ color: 'var(--gray-600)', fontWeight: 500, fontSize: '0.875rem' }}>Email</span>
                      <span style={{ color: 'var(--primary-color)', fontWeight: 600, fontSize: '0.875rem' }}>{selectedStaffDetails.email}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                      <span style={{ color: 'var(--gray-600)', fontWeight: 500, fontSize: '0.875rem' }}>Status</span>
                      <span                        style={{
                         color: 'var(--white)',
                         fontWeight: 600,
                         fontSize: '0.75rem',
                         background: selectedStaffDetails.status === 'active' ? 'var(--success-color)' : 
                                    selectedStaffDetails.status === 'inactive' ? 'var(--error-color)' : 
                                    selectedStaffDetails.status === 'on_leave' ? 'var(--warning-color)' : 'var(--success-color)',
                         padding: '0.375rem 0.75rem',
                         borderRadius: 'var(--radius-md)',
                         textTransform: 'uppercase',
                         letterSpacing: '0.025em'
                       }}>
                         {selectedStaffDetails.status === 'active' ? 'Active' : 
                          selectedStaffDetails.status === 'inactive' ? 'Inactive' : 
                          selectedStaffDetails.status === 'on_leave' ? 'Leave' : 'Active'}
                       </span>
                    </div>
                    {selectedStaffDetails.salary && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--success-light)', borderRadius: 'var(--radius-md)' }}>
                        <span style={{ color: 'var(--gray-600)', fontWeight: 500, fontSize: '0.875rem' }}>Monthly Salary</span>
                        <span style={{ color: 'var(--success-color)', fontWeight: 600, fontSize: '0.875rem' }}>
                          <i className="fas fa-money-bill-wave" style={{ marginRight: '0.5rem' }}></i>
                          Rs {Math.round(selectedStaffDetails.salary).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Personal Details Card */}
                <div style={{
                  background: 'var(--white)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                  boxShadow: 'var(--shadow-md)',
                  border: '1px solid var(--gray-200)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      background: 'var(--primary-light)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary-color)'
                    }}>
                      <i className="fas fa-id-card" style={{ fontSize: '1rem' }}></i>
                    </div>
                    <h3 style={{ margin: 0, color: 'var(--gray-800)', fontSize: '1.125rem', fontWeight: 600 }}>Personal Details</h3>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                      <span style={{ color: 'var(--gray-600)', fontWeight: 500, fontSize: '0.875rem' }}>Staff ID</span>
                      <span style={{ color: 'var(--primary-color)', fontWeight: 600, fontSize: '0.875rem' }}>{selectedStaffDetails.id}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                      <span style={{ color: 'var(--gray-600)', fontWeight: 500, fontSize: '0.875rem' }}>Gender</span>
                      <span style={{ color: 'var(--primary-color)', fontWeight: 600, fontSize: '0.875rem' }}>
                        {selectedStaffDetails.gender ? selectedStaffDetails.gender.charAt(0).toUpperCase() + selectedStaffDetails.gender.slice(1) : 'Not specified'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                      <span style={{ color: 'var(--gray-600)', fontWeight: 500, fontSize: '0.875rem' }}>Age</span>
                      <span style={{ color: 'var(--primary-color)', fontWeight: 600, fontSize: '0.875rem' }}>
                        {selectedStaffDetails.age ? `${selectedStaffDetails.age} years` : 'Not specified'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                      <span style={{ color: 'var(--gray-600)', fontWeight: 500, fontSize: '0.875rem' }}>Address</span>
                      <span style={{ color: 'var(--primary-color)', fontWeight: 600, fontSize: '0.875rem', textAlign: 'right', maxWidth: '50%' }}>
                        {selectedStaffDetails.address || 'Not specified'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Professional Details Card */}
                <div style={{
                  background: 'var(--white)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                  boxShadow: 'var(--shadow-md)',
                  border: '1px solid var(--gray-200)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      background: 'var(--primary-light)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary-color)'
                    }}>
                      <i className="fas fa-briefcase" style={{ fontSize: '1rem' }}></i>
                    </div>
                    <h3 style={{ margin: 0, color: 'var(--gray-800)', fontSize: '1.125rem', fontWeight: 600 }}>Professional Details</h3>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                      <span style={{ color: 'var(--gray-600)', fontWeight: 500, fontSize: '0.875rem' }}>Role</span>
                      <span style={{ color: 'var(--primary-color)', fontWeight: 600, fontSize: '0.875rem' }}>{selectedStaffDetails.role}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                      <span style={{ color: 'var(--gray-600)', fontWeight: 500, fontSize: '0.875rem' }}>Department</span>
                      <span style={{ color: 'var(--primary-color)', fontWeight: 600, fontSize: '0.875rem' }}>
                        {selectedStaffDetails.department || 'Not specified'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                      <span style={{ color: 'var(--gray-600)', fontWeight: 500, fontSize: '0.875rem' }}>Qualification</span>
                      <span style={{ color: 'var(--primary-color)', fontWeight: 600, fontSize: '0.875rem' }}>
                        {selectedStaffDetails.qualifications || 'Not specified'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                      <span style={{ color: 'var(--gray-600)', fontWeight: 500, fontSize: '0.875rem' }}>Experience</span>
                      <span style={{ color: 'var(--primary-color)', fontWeight: 600, fontSize: '0.875rem' }}>
                        {selectedStaffDetails.experience || 'Not specified'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                      <span style={{ color: 'var(--gray-600)', fontWeight: 500, fontSize: '0.875rem' }}>Job Term</span>
                      <span style={{ color: 'var(--primary-color)', fontWeight: 600, fontSize: '0.875rem' }}>
                        {selectedStaffDetails.jobTerm ? selectedStaffDetails.jobTerm.charAt(0).toUpperCase() + selectedStaffDetails.jobTerm.slice(1) : 'Not specified'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                      <span style={{ color: 'var(--gray-600)', fontWeight: 500, fontSize: '0.875rem' }}>Join Date</span>
                      <span style={{ color: 'var(--primary-color)', fontWeight: 600, fontSize: '0.875rem' }}>{formatDate(selectedStaffDetails.joinDate)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Notes Card */}
                <div style={{
                  background: 'var(--white)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                  boxShadow: 'var(--shadow-md)',
                  border: '1px solid var(--gray-200)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      background: 'var(--primary-light)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary-color)'
                    }}>
                      <i className="fas fa-sticky-note" style={{ fontSize: '1rem' }}></i>
                    </div>
                    <h3 style={{ margin: 0, color: 'var(--gray-800)', fontSize: '1.125rem', fontWeight: 600 }}>Notes</h3>
                  </div>
                  
                  <div style={{
                    background: 'var(--gray-50)',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--gray-700)',
                    fontSize: '0.875rem',
                    lineHeight: 1.5
                  }}>
                    {selectedStaffDetails.notes || 'No notes available.'}
                  </div>
                </div>
                
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mark Attendance Modal */}
      {showMarkAttendanceModal && (
        <div 
          className="modal active"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '1rem'
          }}
          onClick={handleCloseMarkAttendanceModal}
        >
          <div 
            className="modal-content"
            style={{
              background: 'var(--white)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-2xl)',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '85vh',
              overflow: 'hidden',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="modal-header"
              style={{
                padding: '1rem 1.5rem',
                borderBottom: '1px solid var(--gray-200)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0
              }}
            >
              <h3 
                id="attendance-modal-title"
                style={{
                  margin: 0,
                  color: 'var(--gray-800)',
                  fontSize: '1.25rem',
                  fontWeight: 600
                }}
              >
                Mark Attendance
              </h3>
              <span 
                className="close"
                id="attendance-modal-close"
                onClick={handleCloseMarkAttendanceModal}
                style={{
                  fontSize: '1.5rem',
                  color: 'var(--gray-400)',
                  cursor: 'pointer',
                  lineHeight: 1,
                  padding: '0.25rem'
                }}
              >
                ×
              </span>
            </div>

            <div 
              style={{
                flex: 1,
                overflow: 'auto',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
              className="scrollbar-hide"
            >
              <form 
                id="attendance-form"
                style={{ padding: '1rem 1.5rem' }}
                onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const date = formData.get('date') as string
                const staffId = formData.get('staffId') as string
                const status = formData.get('status') as string
                const time = formData.get('time') as string
                const notes = formData.get('notes') as string
                
                // Debug: Log form data
                console.log('Attendance Form Data:', { date, staffId, status, time, notes })
                console.log('Current attendance records before save:', attendanceRecords)
                
                // Validate required fields
                if (!date || !staffId || !status || !time) {
                  showToast('Please fill in all required fields', 'error')
                  return
                }
                
                // Create the new record
                const newRecord = {
                  status,
                  time,
                  date,
                  notes: notes || '',
                  isCheckedOut: false
                }
                
                const recordKey = `${staffId}-${date}`
                console.log('Saving record with key:', recordKey, 'Data:', newRecord)
                
                // Save attendance record and localStorage in one operation
                setAttendanceRecords(prev => {
                  const updated = {
                    ...prev,
                    [recordKey]: newRecord
                  }
                  console.log('Updated attendance records:', updated)
                  
                  // Save to localStorage immediately with the updated records
                  localStorage.setItem('attendanceRecords', JSON.stringify(updated))
                  console.log('Saved to localStorage:', updated)
                  
                  // Verify the save was successful
                  const savedData = localStorage.getItem('attendanceRecords')
                  const parsedSavedData = savedData ? JSON.parse(savedData) : null
                  console.log('Verification - Data in localStorage:', parsedSavedData)
                  console.log('Verification - Record exists:', parsedSavedData && parsedSavedData[recordKey])
                  
                  return updated
                })
                
                showToast('Attendance marked successfully!', 'success')
                handleCloseMarkAttendanceModal()
              }}
            >
              {/* Header Section */}
              <div style={{
                background: 'var(--primary-light)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem'
              }}>
                <h4 style={{
                  color: 'var(--primary-color)',
                  margin: '0 0 0.5rem 0',
                  fontSize: '1rem',
                  fontWeight: 600
                }}>
                  <i className="fas fa-clock" style={{ marginRight: '0.5rem' }}></i>Mark Attendance
                </h4>
                <p style={{
                  margin: 0,
                  color: 'var(--gray-600)',
                  fontSize: '0.875rem'
                }}>
                  Record attendance for the selected staff member
                </p>
              </div>

              {/* Staff Information Card */}
              <div style={{
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem'
              }}>
                <h5 style={{
                  margin: '0 0 0.5rem 0',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  <i className="fas fa-user" style={{ marginRight: '0.5rem', color: 'var(--primary-color)' }}></i>Staff Information
                </h5>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem'
                }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label htmlFor="attendance-date" style={{
                      color: 'var(--gray-700)',
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      marginBottom: '0.5rem',
                      display: 'block'
                    }}>
                      <i className="fas fa-calendar" style={{ marginRight: '0.5rem', color: 'var(--primary-color)' }}></i>Date
                    </label>
                    <div className="enhanced-date-picker">
                      <input 
                        type="date" 
                        id="attendance-date" 
                        name="date" 
                        required 
                        defaultValue={getCurrentKarachiTime().toISOString().split('T')[0]}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid var(--gray-300)',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--white)',
                          color: 'var(--gray-700)',
                          fontSize: '0.875rem',
                          transition: 'all 0.3s ease'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = 'var(--success-color)'
                          e.target.style.boxShadow = '0 0 0 3px var(--success-light)'
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'var(--gray-300)'
                          e.target.style.boxShadow = 'none'
                        }}
                      />
                    </div>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label htmlFor="attendance-staff" style={{
                      color: 'var(--gray-700)',
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      marginBottom: '0.5rem',
                      display: 'block'
                    }}>
                      <i className="fas fa-user-tie" style={{ marginRight: '0.5rem', color: 'var(--primary-color)' }}></i>Staff Member
                    </label>
                    <select 
                      id="attendance-staff" 
                      name="staffId" 
                      required 
                      defaultValue={selectedStaffForAttendance?.id || ''}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--gray-300)',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--white)',
                        color: 'var(--gray-700)',
                        fontSize: '0.875rem',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--success-color)'
                        e.target.style.boxShadow = '0 0 0 3px var(--success-light)'
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'var(--gray-300)'
                        e.target.style.boxShadow = 'none'
                      }}
                    >
                      <option value="">Select Staff Member</option>
                      {staff.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.role})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Attendance Details Card */}
              <div style={{
                background: 'var(--info-light)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem',
                borderLeft: '4px solid var(--info-color)'
              }}>
                <h5 style={{
                  color: 'var(--info-color)',
                  margin: '0 0 0.5rem 0',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  <i className="fas fa-clipboard-check" style={{ marginRight: '0.5rem', color: 'var(--primary-color)' }}></i>Attendance Details
                </h5>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem'
                }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label htmlFor="attendance-status" style={{
                      color: 'var(--gray-700)',
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      marginBottom: '0.5rem',
                      display: 'block'
                    }}>
                      <i className="fas fa-toggle-on" style={{ marginRight: '0.5rem', color: 'var(--primary-color)' }}></i>Status
                    </label>
                    <select 
                      id="attendance-status" 
                      name="status" 
                      required 
                      defaultValue={getAutoDetectedStatus().status}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--gray-300)',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--white)',
                        color: 'var(--gray-700)',
                        fontSize: '0.875rem',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--info-color)'
                        e.target.style.boxShadow = '0 0 0 3px var(--info-light)'
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'var(--gray-300)'
                        e.target.style.boxShadow = 'none'
                      }}
                    >
                      <option value="">Select Status</option>
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="late">Late</option>
                      <option value="leave">Leave</option>
                      <option value="half-day">Half Day</option>
                    </select>
                    
                    {/* Quick Status Icons */}
                    <div style={{ marginTop: '0.75rem' }}>
                      <label style={{
                        color: 'var(--gray-600)',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        marginBottom: '0.5rem',
                        display: 'block'
                      }}>
                        <i className="fas fa-bolt" style={{ marginRight: '0.25rem' }}></i>Quick Select:
                      </label>
                      <div className="quick-status-icons" style={{
                        display: 'flex',
                        gap: '0.5rem',
                        flexWrap: 'wrap'
                      }}>
                        <button 
                          type="button" 
                          className="quick-status-btn absent"
                          onClick={() => {
                            const statusSelect = document.getElementById('attendance-status') as HTMLSelectElement
                            if (statusSelect) statusSelect.value = 'absent'
                          }}
                          title="Absent"
                          style={{
                            width: '36px',
                            height: '36px',
                            border: '2px solid var(--danger-color)',
                            borderRadius: '50%',
                            background: 'var(--white)',
                            color: 'var(--danger-color)',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.875rem'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          <i className="fas fa-times-circle"></i>
                        </button>
                        <button 
                          type="button" 
                          className="quick-status-btn leave"
                          onClick={() => {
                            const statusSelect = document.getElementById('attendance-status') as HTMLSelectElement
                            if (statusSelect) statusSelect.value = 'leave'
                          }}
                          title="Leave"
                          style={{
                            width: '36px',
                            height: '36px',
                            border: '2px solid var(--warning-color)',
                            borderRadius: '50%',
                            background: 'var(--white)',
                            color: 'var(--warning-color)',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.875rem'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          <i className="fas fa-calendar-times"></i>
                        </button>
                        <button 
                          type="button" 
                          className="quick-status-btn half-day"
                          onClick={() => {
                            const statusSelect = document.getElementById('attendance-status') as HTMLSelectElement
                            if (statusSelect) statusSelect.value = 'half-day'
                          }}
                          title="Half Day"
                          style={{
                            width: '36px',
                            height: '36px',
                            border: '2px solid var(--purple-color)',
                            borderRadius: '50%',
                            background: 'var(--white)',
                            color: 'var(--purple-color)',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.875rem'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          <i className="fas fa-hourglass-half"></i>
                        </button>
                      </div>
                      <div id="auto-detection-info" style={{
                        marginTop: '0.5rem',
                        padding: '0.5rem',
                        background: 'var(--gray-50)',
                        borderRadius: 'var(--radius-sm)',
                        borderLeft: '3px solid var(--primary-color)'
                      }}>
                        <p style={{
                          margin: 0,
                          fontSize: '0.75rem',
                          color: 'var(--gray-600)'
                        }}>
                          <i className="fas fa-info-circle" style={{ marginRight: '0.25rem', color: 'var(--primary-color)' }}></i>
                          <strong>Auto-Detection:</strong> <span id="auto-detection-status">
                            Time: {getAutoDetectedStatus().time} (PKT) | 
                            Check-in: {new Date(`2000-01-01T${workingSchedule.checkInTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })} | 
                            Check-out: {new Date(`2000-01-01T${workingSchedule.checkOutTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })} | 
                            Status: {getAutoDetectedStatus().status.toUpperCase()}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label htmlFor="attendance-time" style={{
                      color: 'var(--gray-700)',
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      marginBottom: '0.5rem',
                      display: 'block'
                    }}>
                      <i className="fas fa-clock" style={{ marginRight: '0.5rem', color: 'var(--primary-color)' }}></i>Time
                    </label>
                    <input 
                      type="time" 
                      id="attendance-time" 
                      name="time" 
                      defaultValue={(() => {
                        const pakistanTime = getCurrentKarachiTime()
                        return pakistanTime.toTimeString().slice(0, 5)
                      })()}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--gray-300)',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--white)',
                        color: 'var(--gray-700)',
                        fontSize: '0.875rem',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--info-color)'
                        e.target.style.boxShadow = '0 0 0 3px var(--info-light)'
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'var(--gray-300)'
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              <div style={{
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem'
              }}>
                <h5 style={{
                  color: 'var(--gray-600)',
                  margin: '0 0 0.5rem 0',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  <i className="fas fa-sticky-note" style={{ marginRight: '0.5rem', color: 'var(--primary-color)' }}></i>Additional Notes
                </h5>
                <div className="form-group" style={{ margin: 0 }}>
                  <textarea 
                    id="attendance-notes" 
                    name="notes" 
                    rows={2} 
                    placeholder="Add any additional notes or comments about the attendance..."
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--gray-300)',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--white)',
                      color: 'var(--gray-700)',
                      fontSize: '0.875rem',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--gray-400)'
                      e.target.style.boxShadow = '0 0 0 3px var(--gray-100)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--gray-300)'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="form-actions" style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--gray-200)',
                flexShrink: 0
              }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  id="attendance-cancel-btn"
                  onClick={handleCloseMarkAttendanceModal}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'var(--gray-100)',
                    color: 'var(--gray-700)',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    fontWeight: 500,
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'var(--gray-200)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'var(--gray-100)'}
                >
                  <i className="fas fa-times" style={{ marginRight: '0.5rem' }}></i>Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'var(--primary-color)',
                    color: 'var(--white)',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    fontWeight: 500,
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'var(--primary-dark)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'var(--primary-color)'}
                >
                  <i className="fas fa-check" style={{ marginRight: '0.5rem' }}></i>Mark Attendance
                </button>
              </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Settings Sidebar */}
      {showSettingsSidebar && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex justify-end"
          onClick={handleToggleSettings}
        >
          <div 
            className="bg-white w-96 h-full shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sidebar Header */}
            <div className="p-6 border-b border-gray-200 bg-blue-600 text-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Staff Settings</h3>
                <button 
                  onClick={handleToggleSettings}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
              {/* User Info */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <i className="fas fa-user text-white text-sm"></i>
                </div>
                <div>
                  <p className="text-white font-medium text-sm">Admin User</p>
                  <p className="text-blue-100 text-xs">Administrator</p>
                </div>
              </div>
            </div>

            {/* Settings Content */}
            <div className="p-6 space-y-6">
              {/* Working Days & Hours */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <i className="fas fa-calendar-alt text-blue-600 mr-2"></i>
                  Working Schedule
                </h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Working Days
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                        const dayKey = day.toLowerCase() as keyof typeof workingSchedule.workingDays
                        return (
                          <label key={day} className="flex items-center">
                            <input 
                              type="checkbox" 
                              checked={workingSchedule.workingDays[dayKey]}
                              onChange={(e) => setWorkingSchedule(prev => ({
                                ...prev,
                                workingDays: {
                                  ...prev.workingDays,
                                  [dayKey]: e.target.checked
                                }
                              }))}
                              className="mr-2" 
                            />
                            <span className="text-sm">{day}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Check-in Time
                      </label>
                      <div className="relative">
                        <input 
                          type="time" 
                          value={workingSchedule.checkInTime}
                          onChange={(e) => setWorkingSchedule(prev => ({...prev, checkInTime: e.target.value}))}
                          className="w-full p-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <i className="fas fa-clock absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                      </div>
                      <span className="text-xs text-gray-500 mt-1 block">
                        {new Date(`2000-01-01T${workingSchedule.checkInTime}`).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit', 
                          hour12: true,
                          timeZone: 'Asia/Karachi'
                        })}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Check-out Time
                      </label>
                      <div className="relative">
                        <input 
                          type="time" 
                          value={workingSchedule.checkOutTime}
                          onChange={(e) => setWorkingSchedule(prev => ({...prev, checkOutTime: e.target.value}))}
                          className="w-full p-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <i className="fas fa-clock absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                      </div>
                      <span className="text-xs text-gray-500 mt-1 block">
                        {new Date(`2000-01-01T${workingSchedule.checkOutTime}`).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit', 
                          hour12: true,
                          timeZone: 'Asia/Karachi'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Salary Deductions */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <i className="fas fa-money-bill-wave text-green-600 mr-2"></i>
                  Salary Deductions
                </h4>
                
                <div className="space-y-6">
                  <div>
                    <h5 className="text-sm font-semibold text-gray-800 mb-3">Late Arrival Deduction</h5>
                    <div className="flex items-center space-x-2 flex-wrap">
                      <input 
                        type="number" 
                        value={salarySettings.lateArrivalThreshold}
                        onChange={(e) => setSalarySettings(prev => ({...prev, lateArrivalThreshold: parseInt(e.target.value) || 0}))}
                        className="w-16 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                      />
                      <span className="text-sm text-gray-600">late(s) =</span>
                      <input 
                        type="number" 
                        value={salarySettings.lateArrivalDeduction}
                        onChange={(e) => setSalarySettings(prev => ({...prev, lateArrivalDeduction: parseInt(e.target.value) || 0}))}
                        className="w-16 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                      />
                      <span className="text-sm text-gray-600">day salary deduction</span>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-sm font-semibold text-gray-800 mb-3">Absent Deduction</h5>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="text-sm text-gray-600">1 absent =</span>
                        <input 
                          type="number" 
                          value={salarySettings.absentDeduction}
                          onChange={(e) => setSalarySettings(prev => ({...prev, absentDeduction: parseInt(e.target.value) || 0}))}
                          className="w-16 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                        />
                        <span className="text-sm text-gray-600">day salary deduction</span>
                      </div>
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="text-sm text-gray-600">Or fixed amount:</span>
                        <span className="text-sm text-gray-600">PKR</span>
                        <input 
                          type="number" 
                          value={salarySettings.absentDeductionAmount}
                          onChange={(e) => setSalarySettings(prev => ({...prev, absentDeductionAmount: parseInt(e.target.value) || 0}))}
                          className="w-20 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                        />
                        <span className="text-sm text-gray-600">per absent</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-sm font-semibold text-gray-800 mb-3">Leave Deduction</h5>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="text-sm text-gray-600">1 leave =</span>
                        <input 
                          type="number" 
                          step="0.1"
                          value={salarySettings.leaveDeduction}
                          onChange={(e) => setSalarySettings(prev => ({...prev, leaveDeduction: parseFloat(e.target.value) || 0}))}
                          className="w-16 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                        />
                        <span className="text-sm text-gray-600">day salary deduction</span>
                      </div>
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="text-sm text-gray-600">Or fixed amount:</span>
                        <span className="text-sm text-gray-600">PKR</span>
                        <input 
                          type="number" 
                          value={salarySettings.leaveDeductionAmount}
                          onChange={(e) => setSalarySettings(prev => ({...prev, leaveDeductionAmount: parseInt(e.target.value) || 0}))}
                          className="w-20 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                        />
                        <span className="text-sm text-gray-600">per leave</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Overtime Settings */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <i className="fas fa-clock text-orange-600 mr-2"></i>
                  Overtime Settings
                </h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Overtime Rate (per hour)
                    </label>
                    <div className="flex items-center space-x-2 flex-wrap">
                      <span className="text-sm text-gray-600">PKR</span>
                      <input 
                        type="number" 
                        value={salarySettings.overtimeRate}
                        onChange={(e) => setSalarySettings(prev => ({...prev, overtimeRate: parseInt(e.target.value) || 0}))}
                        className="w-24 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                      />
                      <span className="text-sm text-gray-600">per hour</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Overtime Hours
                    </label>
                    <div className="flex items-center space-x-2 flex-wrap">
                      <input 
                        type="number" 
                        value={salarySettings.minOvertimeHours}
                        onChange={(e) => setSalarySettings(prev => ({...prev, minOvertimeHours: parseInt(e.target.value) || 0}))}
                        className="w-16 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                      />
                      <span className="text-sm text-gray-600">hour(s)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <button 
                  onClick={handleToggleSettings}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveSettings}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Calendar Modal */}
      {showAttendanceCalendar && selectedStaffForCalendar && (
        <div 
          className="modal active"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
          onClick={handleCloseAttendanceCalendar}
        >
          <div 
            className="modal-content"
            style={{
              maxWidth: '800px',
              width: '95%',
              maxHeight: '90vh',
              backgroundColor: 'var(--white)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="modal-header"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.5rem',
                borderBottom: '1px solid var(--gray-200)',
                backgroundColor: 'var(--white)'
              }}
            >
              <h3 style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: '600',
                color: 'var(--gray-900)'
              }}>
                {selectedStaffForCalendar.name} - Attendance Calendar
              </h3>
              <span 
                className="close"
                onClick={handleCloseAttendanceCalendar}
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: 'var(--gray-500)',
                  cursor: 'pointer',
                  lineHeight: '1',
                  padding: '0.25rem'
                }}
              >
                ×
              </span>
            </div>
            
            <div style={{ 
              padding: '1.5rem',
              overflowY: 'auto',
              flex: 1
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 2fr',
                gap: '1.5rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  background: 'var(--primary-light)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <h4 style={{
                    color: 'var(--primary-color)',
                    margin: '0 0 0.5rem 0',
                    fontSize: '0.875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Staff Information
                  </h4>
                  <p style={{ margin: '0.25rem 0', color: 'var(--gray-700)' }}>
                    <strong>Name:</strong> {selectedStaffForCalendar.name}
                  </p>
                  <p style={{ margin: '0.25rem 0', color: 'var(--gray-700)' }}>
                    <strong>Role:</strong> {selectedStaffForCalendar.role || 'Not specified'}
                  </p>
                  <p style={{ margin: '0.25rem 0', color: 'var(--gray-700)' }}>
                    <strong>Month:</strong> {(() => {
                      const currentDate = new Date()
                      const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', timeZone: 'Asia/Karachi' })
                      const year = currentDate.getFullYear()
                      return `${monthName} ${year}`
                    })()}
                  </p>
                </div>
                
                <div style={{
                  background: 'var(--success-light)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <h4 style={{
                    color: 'var(--success-color)',
                    margin: '0 0 0.5rem 0',
                    fontSize: '0.875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Attendance Legend
                  </h4>
                  <div style={{
                    display: 'flex',
                    gap: '1rem',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        background: 'var(--success-light)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        color: 'var(--success-color)'
                      }}>
                        P
                      </div>
                      <span style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>Present</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        background: 'var(--danger-light)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        color: 'var(--danger-color)'
                      }}>
                        A
                      </div>
                      <span style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>Absent</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        background: 'var(--info-light)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        color: 'var(--info-color)'
                      }}>
                        L
                      </div>
                      <span style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>Leave</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        background: 'var(--purple-light)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        color: 'var(--purple-color)'
                      }}>
                        HD
                      </div>
                      <span style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>Half Day</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div style={{
                background: 'var(--white)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--gray-200)',
                overflow: 'hidden'
              }}>
                <div style={{
                  background: 'var(--primary-color)',
                  color: 'var(--white)',
                  padding: '1rem',
                  textAlign: 'center',
                  fontWeight: '600',
                  fontSize: '1.125rem'
                }}>
                  {(() => {
                    const currentDate = new Date()
                    const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', timeZone: 'Asia/Karachi' })
                    const year = currentDate.getFullYear()
                    return `${monthName} ${year}`
                  })()}
                </div>
                
                <div style={{
                  overflow: 'hidden'
                }}>
                  <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse'
                  }}>
                  <thead>
                    <tr style={{ background: 'var(--gray-50)' }}>
                      <th style={{
                        padding: '0.75rem',
                        textAlign: 'center',
                        border: '1px solid var(--gray-200)',
                        fontWeight: '600',
                        color: 'var(--gray-700)'
                      }}>Sun</th>
                      <th style={{
                        padding: '0.75rem',
                        textAlign: 'center',
                        border: '1px solid var(--gray-200)',
                        fontWeight: '600',
                        color: 'var(--gray-700)'
                      }}>Mon</th>
                      <th style={{
                        padding: '0.75rem',
                        textAlign: 'center',
                        border: '1px solid var(--gray-200)',
                        fontWeight: '600',
                        color: 'var(--gray-700)'
                      }}>Tue</th>
                      <th style={{
                        padding: '0.75rem',
                        textAlign: 'center',
                        border: '1px solid var(--gray-200)',
                        fontWeight: '600',
                        color: 'var(--gray-700)'
                      }}>Wed</th>
                      <th style={{
                        padding: '0.75rem',
                        textAlign: 'center',
                        border: '1px solid var(--gray-200)',
                        fontWeight: '600',
                        color: 'var(--gray-700)'
                      }}>Thu</th>
                      <th style={{
                        padding: '0.75rem',
                        textAlign: 'center',
                        border: '1px solid var(--gray-200)',
                        fontWeight: '600',
                        color: 'var(--gray-700)'
                      }}>Fri</th>
                      <th style={{
                        padding: '0.75rem',
                        textAlign: 'center',
                        border: '1px solid var(--gray-200)',
                        fontWeight: '600',
                        color: 'var(--gray-700)'
                      }}>Sat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const currentDate = new Date()
                      const currentMonth = currentDate.getMonth()
                      const currentYear = currentDate.getFullYear()
                      const firstDay = new Date(currentYear, currentMonth, 1)
                      const lastDay = new Date(currentYear, currentMonth + 1, 0)
                      const daysInMonth = lastDay.getDate()
                      const startingDayOfWeek = firstDay.getDay()
                      
                      const calendarRows = []
                      let currentRow = []
                      
                      // Add empty cells for days before the first day of the month
                      for (let i = 0; i < startingDayOfWeek; i++) {
                        currentRow.push(
                          <td key={`empty-${i}`} style={{
                            padding: '0.5rem',
                            textAlign: 'center',
                            border: '1px solid var(--gray-200)',
                            background: 'var(--gray-50)',
                            minHeight: '80px',
                            maxHeight: '120px'
                          }}></td>
                        )
                      }
                      
                      // Add days of the month
                      for (let day = 1; day <= daysInMonth; day++) {
                        const dayDate = new Date(currentYear, currentMonth, day)
                        const dayKey = `${selectedStaffForCalendar.id}-${dayDate.toISOString().split('T')[0]}`
                        const attendanceRecord = attendanceRecords[dayKey]
                        console.log(`Calendar - Day: ${day}, Key: ${dayKey}, Record:`, attendanceRecord)
                        
                        let cellStyle = {
                          padding: '0.5rem',
                          textAlign: 'center' as const,
                          border: '1px solid var(--gray-200)',
                          background: 'var(--gray-100)',
                          position: 'relative' as const,
                          minHeight: '80px',
                          maxHeight: '120px',
                          verticalAlign: 'top' as const,
                          overflowY: 'auto' as const,
                          overflowX: 'hidden' as const,
                          scrollbarWidth: 'thin' as const,
                          scrollbarColor: 'var(--gray-400) var(--gray-200)' as const
                        }
                        
                        let attendanceContent = null
                        
                        // Check if this day is a holiday (Sunday)
                        const dayDateForHoliday = new Date(currentYear, currentMonth, day)
                        const isDayHoliday = isHoliday(dayDateForHoliday)
                        
                        if (isDayHoliday) {
                          cellStyle.background = 'var(--warning-light)'
                          attendanceContent = (
                            <>
                              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--warning-color)', marginTop: '0.25rem' }}>H</div>
                              <div style={{ fontSize: '0.6rem', color: 'var(--warning-color)', marginTop: '0.125rem' }}>HOLIDAY</div>
                            </>
                          )
                        } else if (attendanceRecord) {
                          if (attendanceRecord.status === 'leave') {
                            cellStyle.background = 'var(--info-light)'
                            attendanceContent = (
                              <>
                                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--info-color)', marginTop: '0.25rem' }}>L</div>
                                <div style={{ fontSize: '0.6rem', color: 'var(--info-color)', marginTop: '0.125rem' }}>In: 12:00 AM</div>
                              </>
                            )
                          } else if (attendanceRecord.status === 'present') {
                            cellStyle.background = 'var(--success-light)'
                            const isCheckedOut = attendanceRecord.isCheckedOut || false
                            const checkoutTime = attendanceRecord.checkoutTime || ''
                            
                            attendanceContent = (
                              <>
                                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--success-color)', marginTop: '0.25rem' }}>P</div>
                                <div style={{ fontSize: '0.6rem', color: 'var(--gray-500)', marginTop: '0.125rem' }}>In: {attendanceRecord.time}</div>
                                {isCheckedOut && checkoutTime ? (
                                  <div style={{ fontSize: '0.6rem', color: 'var(--gray-500)' }}>Out: {checkoutTime}</div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      const today = getCurrentKarachiTime().toISOString().split('T')[0]
                                      const recordKey = `${selectedStaffForCalendar.id}-${today}`
                                      const currentTime = formatCurrentKarachiTime()
                                      
                                      setAttendanceRecords(prev => {
                                        const existingRecord = prev[recordKey] || { status: 'present', time: '09:00', date: today, notes: '', isCheckedOut: false }
                                        const updated = {
                                          ...prev,
                                          [recordKey]: {
                                            ...existingRecord,
                                            checkoutTime: currentTime,
                                            isCheckedOut: true
                                          }
                                        }
                                        localStorage.setItem('attendanceRecords', JSON.stringify(updated))
                                        return updated
                                      })
                                      
                                      showToast(`${selectedStaffForCalendar.name} has been checked out at ${currentTime}`, 'success')
                                    }}
                                    style={{
                                      fontSize: '0.5rem',
                                      padding: '2px 4px',
                                      marginTop: '0.125rem',
                                      background: 'var(--primary-color)',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '2px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Checkout
                                  </button>
                                )}
                              </>
                            )
                          } else if (attendanceRecord.status === 'late') {
                            cellStyle.background = 'var(--warning-light)'
                            const isCheckedOut = attendanceRecord.isCheckedOut || false
                            const checkoutTime = attendanceRecord.checkoutTime || ''
                            
                            attendanceContent = (
                              <>
                                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--warning-color)', marginTop: '0.25rem' }}>L</div>
                                <div style={{ fontSize: '0.6rem', color: 'var(--gray-500)', marginTop: '0.125rem' }}>In: {attendanceRecord.time}</div>
                                {isCheckedOut && checkoutTime ? (
                                  <div style={{ fontSize: '0.6rem', color: 'var(--gray-500)' }}>Out: {checkoutTime}</div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      const today = getCurrentKarachiTime().toISOString().split('T')[0]
                                      const recordKey = `${selectedStaffForCalendar.id}-${today}`
                                      const currentTime = formatCurrentKarachiTime()
                                      
                                      setAttendanceRecords(prev => {
                                        const existingRecord = prev[recordKey] || { status: 'late', time: '09:00', date: today, notes: '', isCheckedOut: false }
                                        const updated = {
                                          ...prev,
                                          [recordKey]: {
                                            ...existingRecord,
                                            checkoutTime: currentTime,
                                            isCheckedOut: true
                                          }
                                        }
                                        localStorage.setItem('attendanceRecords', JSON.stringify(updated))
                                        return updated
                                      })
                                      
                                      showToast(`${selectedStaffForCalendar.name} has been checked out at ${currentTime}`, 'success')
                                    }}
                                    style={{
                                      fontSize: '0.5rem',
                                      padding: '2px 4px',
                                      marginTop: '0.125rem',
                                      background: 'var(--primary-color)',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '2px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Checkout
                                  </button>
                                )}
                              </>
                            )
                          } else if (attendanceRecord.status === 'half-day') {
                            cellStyle.background = 'var(--purple-light)'
                            const isCheckedOut = attendanceRecord.isCheckedOut || false
                            const checkoutTime = attendanceRecord.checkoutTime || ''
                            
                            attendanceContent = (
                              <>
                                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--purple-color)', marginTop: '0.25rem' }}>HD</div>
                                <div style={{ fontSize: '0.6rem', color: 'var(--gray-500)', marginTop: '0.125rem' }}>In: {attendanceRecord.time}</div>
                                {isCheckedOut && checkoutTime ? (
                                  <div style={{ fontSize: '0.6rem', color: 'var(--gray-500)' }}>Out: {checkoutTime}</div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      const today = getCurrentKarachiTime().toISOString().split('T')[0]
                                      const recordKey = `${selectedStaffForCalendar.id}-${today}`
                                      const currentTime = formatCurrentKarachiTime()
                                      
                                      setAttendanceRecords(prev => {
                                        const existingRecord = prev[recordKey] || { status: 'half-day', time: '09:00', date: today, notes: '', isCheckedOut: false }
                                        const updated = {
                                          ...prev,
                                          [recordKey]: {
                                            ...existingRecord,
                                            checkoutTime: currentTime,
                                            isCheckedOut: true
                                          }
                                        }
                                        localStorage.setItem('attendanceRecords', JSON.stringify(updated))
                                        return updated
                                      })
                                      
                                      showToast(`${selectedStaffForCalendar.name} has been checked out at ${currentTime}`, 'success')
                                    }}
                                    style={{
                                      fontSize: '0.5rem',
                                      padding: '2px 4px',
                                      marginTop: '0.125rem',
                                      background: 'var(--primary-color)',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '2px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Checkout
                                  </button>
                                )}
                              </>
                            )
                          } else if (attendanceRecord.status === 'absent') {
                            cellStyle.background = 'var(--danger-light)'
                            attendanceContent = (
                              <>
                                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--danger-color)', marginTop: '0.25rem' }}>A</div>
                                <div style={{ fontSize: '0.6rem', color: 'var(--danger-color)', marginTop: '0.125rem' }}>ABSENT</div>
                              </>
                            )
                          }
                        } else if (!isDayHoliday) {
                          // Show empty for working days without attendance records
                          attendanceContent = null
                        }
                        
                        // Get attendance count for this date (for future use)
                        // const dateString = dayDate.toISOString().split('T')[0]
                        // const attendanceCount = getAttendanceCountForDate(dateString)
                        
                        currentRow.push(
                          <td key={day} style={cellStyle}>
                            <div style={{ 
                              fontWeight: '600',
                              color: 'var(--gray-700)',
                              position: 'sticky',
                              top: '0',
                              background: 'var(--gray-100)',
                              zIndex: 1,
                              paddingBottom: '0.25rem'
                            }}>
                              {day}
                            </div>
                            <div style={{ 
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.125rem',
                              alignItems: 'center'
                            }}>
                              {attendanceContent}
                            </div>
                          </td>
                        )
                        
                        // If we've filled a week (7 days), start a new row
                        if (currentRow.length === 7) {
                          calendarRows.push(<tr key={`week-${calendarRows.length}`}>{currentRow}</tr>)
                          currentRow = []
                        }
                      }
                      
                      // Add remaining empty cells for the last week
                      while (currentRow.length < 7) {
                        currentRow.push(
                          <td key={`empty-end-${currentRow.length}`} style={{
                            padding: '0.5rem',
                            textAlign: 'center',
                            border: '1px solid var(--gray-200)',
                            background: 'var(--gray-50)',
                            minHeight: '80px',
                            maxHeight: '120px'
                          }}></td>
                        )
                      }
                      
                      if (currentRow.length > 0) {
                        calendarRows.push(<tr key={`week-${calendarRows.length}`}>{currentRow}</tr>)
                      }
                      
                      return calendarRows
                    })()}
                  </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
