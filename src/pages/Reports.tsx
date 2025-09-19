import { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { 
  FileText, 
  Download, 
  Calendar, 
  Users, 
  DollarSign, 
  Package,
  TrendingUp,
  BarChart3,
  PieChart,
  Filter,
  Search,
  FileSpreadsheet,
  FileImage,
  Printer,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts'

// Error Boundary Component
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Reports component error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">There was an error loading the Reports page.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

function ReportsComponent() {
  const storeData = useAppStore()
  const { 
    patients = [], 
    appointments = [], 
    invoices = [], 
    staff = [], 
    inventory = [], 
    feedback = [] 
  } = storeData || {}
  const [selectedReport, setSelectedReport] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [generatedReports, setGeneratedReports] = useState<Array<{
    id: string
    name: string
    type: string
    format?: string
    date: string
    size: string
    data: any
  }>>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [filters, setFilters] = useState({
    patient: 'all', // all, active, inactive
    appointment: 'all', // all, completed, confirmed, cancelled
    financial: 'all', // all, paid, pending
    staff: 'all', // all, active, inactive
    inventory: 'all', // all, low-stock, normal
    feedback: 'all' // all, pending, resolved
  })
  const [reportFormat, setReportFormat] = useState('list')
  const [reportType, setReportType] = useState('list')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [selectedDate, setSelectedDate] = useState('')
  const [showCalendar, setShowCalendar] = useState(false)
  const [showDateRangeCalendar, setShowDateRangeCalendar] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [selectedReportDetails, setSelectedReportDetails] = useState<any>(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [allReports, setAllReports] = useState<Array<{
    id: string
    name: string
    type: string
    format?: string
    date: string
    size: string
    data: any
    timestamp: number
  }>>([])
  const [isLoading, setIsLoading] = useState(true)

  // Set loading to false after component mounts
  useEffect(() => {
    setIsLoading(false)
  }, [])

  // Load saved reports and handle daily refresh
  useEffect(() => {
    // Load all reports from localStorage
    const savedAllReports = localStorage.getItem('allReports')
    if (savedAllReports) {
      setAllReports(JSON.parse(savedAllReports))
    }

    // Check if it's a new day (Karachi time)
    const checkDailyRefresh = () => {
      const now = new Date()
      const karachiTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Karachi"}))
      const today = karachiTime.toDateString()
      const lastRefresh = localStorage.getItem('lastRefresh')
      
      if (lastRefresh !== today) {
        // New day - clear current day reports but keep all historical data
        setGeneratedReports([])
        localStorage.setItem('lastRefresh', today)
      } else {
        // Same day - load today's reports
        const savedAllReports = localStorage.getItem('allReports')
        if (savedAllReports) {
          const allReportsData = JSON.parse(savedAllReports)
          const todayReports = allReportsData.filter((report: any) => {
            const reportDate = new Date(report.timestamp)
            const reportKarachiTime = new Date(reportDate.toLocaleString("en-US", {timeZone: "Asia/Karachi"}))
            return reportKarachiTime.toDateString() === today
          })
          setGeneratedReports(todayReports)
        }
      }
    }

    checkDailyRefresh()

    // Listen for messages from popup windows
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'ADD_TO_RECENT_REPORTS') {
        const reportData = event.data.reportData
        const reportWithTimestamp = {
          ...reportData,
          timestamp: new Date().toISOString()
        }
        
        // Add to all reports (permanent storage)
        const savedAllReports = localStorage.getItem('allReports')
        const existingReports = savedAllReports ? JSON.parse(savedAllReports) : []
        const exists = existingReports.some((r: any) => r.id === reportData.id)
        if (!exists) {
          const newAllReports = [...existingReports, reportWithTimestamp]
          localStorage.setItem('allReports', JSON.stringify(newAllReports))
          setAllReports(newAllReports)
        }
        
        // Add to current day reports
        setGeneratedReports(prev => {
          const exists = prev.some(r => r.id === reportData.id)
          if (!exists) {
            return [...prev, reportWithTimestamp]
          }
          return prev
        })
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, []) // Remove allReports dependency to prevent infinite loop

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      
      if (showCalendar && !target.closest('.calendar-dropdown')) {
        setShowCalendar(false)
      }
      if (showDateRangeCalendar && !target.closest('.date-range-calendar')) {
        setShowDateRangeCalendar(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showCalendar, showDateRangeCalendar])

  // Calendar filter functions
  const filterReportsByDate = (date: string) => {
    console.log('Filtering by date:', date)
    console.log('All reports count:', allReports.length)
    
    if (!date) {
      // Show today's reports
      const now = new Date()
      const karachiTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Karachi"}))
      const today = karachiTime.toDateString()
      console.log('Today (Karachi):', today)
      
      const todayReports = allReports.filter(report => {
        const reportDate = new Date(report.timestamp)
        const reportKarachiTime = new Date(reportDate.toLocaleString("en-US", {timeZone: "Asia/Karachi"}))
        return reportKarachiTime.toDateString() === today
      })
      console.log('Today reports found:', todayReports.length)
      setGeneratedReports(todayReports)
      } else {
        // Show reports for selected date
        const selectedDateObj = new Date(date + 'T00:00:00') // Ensure it's treated as start of day
        const selectedKarachiTime = new Date(selectedDateObj.toLocaleString("en-US", {timeZone: "Asia/Karachi"}))
        const selectedDateString = selectedKarachiTime.toDateString()
        console.log('Selected date (Karachi):', selectedDateString)
        console.log('Selected date input:', date)
        
        const filteredReports = allReports.filter(report => {
          const reportDate = new Date(report.timestamp)
          const reportKarachiTime = new Date(reportDate.toLocaleString("en-US", {timeZone: "Asia/Karachi"}))
          const reportDateString = reportKarachiTime.toDateString()
          console.log('Report timestamp:', report.timestamp)
          console.log('Report date (Karachi):', reportDateString)
          console.log('Matches:', reportDateString === selectedDateString)
          return reportDateString === selectedDateString
        })
        console.log('Filtered reports found:', filteredReports.length)
        // Always set the filtered results, even if empty
        setGeneratedReports(filteredReports)
      }
    setSelectedDate(date)
    setShowCalendar(false) // Close calendar after selection
  }

  const clearDateFilter = () => {
    setSelectedDate('')
    setDateRange({ start: '', end: '' })
    // Show today's reports
    const now = new Date()
    const karachiTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Karachi"}))
    const today = karachiTime.toDateString()
    const todayReports = allReports.filter(report => {
      const reportDate = new Date(report.timestamp)
      const reportKarachiTime = new Date(reportDate.toLocaleString("en-US", {timeZone: "Asia/Karachi"}))
      return reportKarachiTime.toDateString() === today
    })
    setGeneratedReports(todayReports)
    setShowCalendar(false) // Close calendar after clearing
  }

  const handleDateClick = (day: number) => {
    const formattedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    
    if (!dateRange.start) {
      // First click - set start date
      setDateRange({ start: formattedDate, end: '' })
    } else if (!dateRange.end) {
      // Second click - set end date
      if (new Date(formattedDate) >= new Date(dateRange.start)) {
        setDateRange({ start: dateRange.start, end: formattedDate })
      } else {
        // If end date is before start date, swap them
        setDateRange({ start: formattedDate, end: dateRange.start })
      }
    } else {
      // Third click - reset and start new selection
      setDateRange({ start: formattedDate, end: '' })
    }
  }

  const isDateInRange = (day: number) => {
    if (!dateRange.start) return false
    
    const dayDate = new Date(currentYear, currentMonth, day)
    const startDate = new Date(dateRange.start)
    const endDate = dateRange.end ? new Date(dateRange.end) : null
    
    if (!endDate) {
      return dayDate.toDateString() === startDate.toDateString()
    }
    
    return dayDate >= startDate && dayDate <= endDate
  }

  const isDateSelected = (day: number) => {
    const dayDate = new Date(currentYear, currentMonth, day)
    const startDate = new Date(dateRange.start)
    const endDate = dateRange.end ? new Date(dateRange.end) : null
    
    if (!endDate) {
      return dayDate.toDateString() === startDate.toDateString()
    }
    
    return dayDate.toDateString() === startDate.toDateString() || dayDate.toDateString() === endDate.toDateString()
  }

  // Calculate statistics
  const totalPatients = patients.length
  const totalAppointments = appointments.length
  const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.total, 0)
  const totalStaff = staff.length
  const totalInventory = inventory.length
  const totalFeedback = feedback.length

  // Prepare chart data
  const revenueData = [
    { month: 'Jan', revenue: 15000 },
    { month: 'Feb', revenue: 18000 },
    { month: 'Mar', revenue: 22000 },
    { month: 'Apr', revenue: 19000 },
    { month: 'May', revenue: 25000 },
    { month: 'Jun', revenue: 28000 },
    { month: 'Jul', revenue: 32000 },
    { month: 'Aug', revenue: 29000 },
    { month: 'Sep', revenue: 35000 },
    { month: 'Oct', revenue: 31000 },
    { month: 'Nov', revenue: 27000 },
    { month: 'Dec', revenue: totalRevenue }
  ]

  const demographicsData = [
    { name: 'Male', value: patients.filter(p => p.gender === 'male').length, color: '#3B82F6' },
    { name: 'Female', value: patients.filter(p => p.gender === 'female').length, color: '#EF4444' },
    { name: 'Other', value: patients.filter(p => p.gender === 'other').length, color: '#10B981' }
  ]

  const reportTypes = [
    {
      id: 'patient',
      title: 'Patient Reports',
      description: 'Patient demographics, registration trends, and medical history',
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-500',
      stats: totalPatients
    },
    {
      id: 'appointment',
      title: 'Appointment Reports',
      description: 'Appointment scheduling, completion rates, and time analysis',
      icon: Calendar,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-500',
      stats: totalAppointments
    },
    {
      id: 'financial',
      title: 'Financial Reports',
      description: 'Revenue analysis, payment tracking, and financial summaries',
      icon: DollarSign,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-500',
      stats: `Rs.${totalRevenue.toLocaleString()}`
    },
    {
      id: 'staff',
      title: 'Staff Reports',
      description: 'Staff performance, attendance, and payroll reports',
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-500',
      stats: totalStaff
    },
    {
      id: 'inventory',
      title: 'Inventory Reports',
      description: 'Stock levels, usage patterns, and supply management',
      icon: Package,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-500',
      stats: totalInventory
    },
    {
      id: 'feedback',
      title: 'Feedback Reports',
      description: 'Patient satisfaction, service quality, and improvement areas',
      icon: TrendingUp,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-500',
      stats: totalFeedback
    }
  ]

  const generateReportData = (reportType: string) => {
    const now = new Date()
    const reportDate = now.toISOString().split('T')[0]
    
    switch (reportType) {
      case 'patient':
        const filteredPatients = filters.patient === 'all' 
          ? (patients || []) 
          : (patients || []).filter(p => p && p.status === filters.patient)
        
        return {
          id: `patient-${Date.now()}`,
          name: `Patient Demographics Report (${filters.patient === 'all' ? 'All' : filters.patient.charAt(0).toUpperCase() + filters.patient.slice(1)})`,
          type: 'Patient',
          date: reportDate,
          size: `${(JSON.stringify(filteredPatients).length / 1024).toFixed(1)} KB`,
          data: {
            totalPatients: filteredPatients.length,
            filter: filters.patient,
            patients: filteredPatients.map(p => ({
              name: p.name,
              age: p.age,
              gender: p.gender,
              phone: p.phone,
              email: p.email,
              status: p.status,
              registrationDate: p.registrationDate
            }))
          }
        }
      
      case 'appointment':
        // Debug: Log all appointment statuses
        const allStatuses = (appointments || []).map(a => a?.status).filter(Boolean)
        const uniqueStatuses = [...new Set(allStatuses)]
        console.log('All appointment statuses in data:', uniqueStatuses)
        console.log('Total appointments:', (appointments || []).length)
        
        const filteredAppointments = filters.appointment === 'all' 
          ? (appointments || []) 
          : (appointments || []).filter(a => {
              if (!a) return false
              
              // Handle different status mappings
              if (filters.appointment === 'scheduled') {
                const isScheduled = a.status === 'scheduled' || 
                       a.status === 'Scheduled' ||
                       a.status === 'pending' || 
                       a.status === 'Pending' ||
                       a.status === 'upcoming' || 
                       a.status === 'Upcoming' ||
                       a.status === 'new' ||
                       a.status === 'New' ||
                       a.status === 'booked' ||
                       a.status === 'Booked'
                console.log(`Appointment ${a.patientName} with status "${a.status}" is scheduled: ${isScheduled}`)
                return isScheduled
              }
              
              return a.status === filters.appointment
            })
        
        console.log(`Filtered appointments for "${filters.appointment}":`, filteredAppointments.length)
        console.log('Filtered appointment data:', filteredAppointments)
        
        // Debug: If no scheduled appointments found, log the issue
        if (filteredAppointments.length === 0 && filters.appointment === 'scheduled') {
          console.log('No scheduled appointments found in your data.')
          console.log('Available appointment statuses:', uniqueStatuses)
          console.log('Total appointments in system:', (appointments || []).length)
          console.log('To see scheduled appointments, make sure you have appointments with status: scheduled, pending, upcoming, new, or booked')
        }
        
        return {
          id: `appointment-${Date.now()}`,
          name: `Appointment Analysis Report (${filters.appointment === 'all' ? 'All' : filters.appointment.charAt(0).toUpperCase() + filters.appointment.slice(1)})`,
          type: 'Appointment',
          date: reportDate,
          size: `${(JSON.stringify(filteredAppointments).length / 1024).toFixed(1)} KB`,
          data: {
            totalAppointments: filteredAppointments.length,
            filter: filters.appointment,
            scheduled: filteredAppointments.filter(a => 
              a.status === 'scheduled' || 
              a.status === 'Scheduled' ||
              a.status === 'pending' || 
              a.status === 'Pending' ||
              a.status === 'upcoming' || 
              a.status === 'Upcoming' ||
              a.status === 'new' ||
              a.status === 'New' ||
              a.status === 'booked' ||
              a.status === 'Booked'
            ).length,
            confirmed: filteredAppointments.filter(a => a.status === 'confirmed').length,
            completed: filteredAppointments.filter(a => a.status === 'completed').length,
            cancelled: filteredAppointments.filter(a => a.status === 'cancelled').length,
            appointments: filteredAppointments.map(a => ({
              patientName: a.patientName,
              date: a.date,
              time: a.time,
              status: a.status === 'pending' || a.status === 'Pending' || a.status === 'upcoming' || a.status === 'Upcoming' || a.status === 'new' || a.status === 'New' || a.status === 'booked' || a.status === 'Booked' ? 'Scheduled' : a.status,
              treatment: (a as any).service || a.type || 'General Checkup',
              duration: (a as any).duration || '30 min',
              priority: (a as any).priority || 'Normal',
              notes: (a as any).notes || ''
            })),
            // Add detailed appointment and billing information
            detailedAppointments: filteredAppointments,
            relatedInvoices: filteredAppointments.map(apt => 
              (invoices || []).filter(inv => 
                inv.patientName === apt.patientName || inv.patientId === apt.patientId
              )
            ).flat()
          }
        }
      
      case 'financial':
        const filteredInvoices = filters.financial === 'all' 
          ? (invoices || []) 
          : (invoices || []).filter(i => i && i.status === filters.financial)
        
        return {
          id: `financial-${Date.now()}`,
          name: `Financial Summary Report (${filters.financial === 'all' ? 'All' : filters.financial.charAt(0).toUpperCase() + filters.financial.slice(1)})`,
          type: 'Financial',
          date: reportDate,
          size: `${(JSON.stringify(filteredInvoices).length / 1024).toFixed(1)} KB`,
          data: {
            totalRevenue: filteredInvoices.reduce((sum, i) => sum + i.total, 0),
            totalInvoices: filteredInvoices.length,
            filter: filters.financial,
            paidInvoices: filteredInvoices.filter(i => i.status === 'paid').length,
            pendingInvoices: filteredInvoices.filter(i => i.status === 'pending').length,
            invoices: filteredInvoices.map(i => ({
              id: i.id,
              patientName: i.patientName,
              total: i.total,
              status: i.status,
              date: i.createdAt || new Date().toISOString(),
              subtotal: i.subtotal || 0,
              tax: i.tax || 0,
              discount: i.discount || 0,
              dueDate: i.dueDate || '',
              paymentMethod: i.paymentMethod || 'Cash',
              treatments: i.treatments || []
            })),
            // Add detailed appointment and billing information
            detailedInvoices: filteredInvoices,
            relatedAppointments: filteredInvoices.map(inv => 
              (appointments || []).filter(apt => 
                apt.patientName === inv.patientName || apt.patientId === inv.patientId
              )
            ).flat()
          }
        }
      
      case 'staff':
        const filteredStaff = filters.staff === 'all' 
          ? (staff || []) 
          : (staff || []).filter(s => s && s.status === filters.staff)
        
        return {
          id: `staff-${Date.now()}`,
          name: `Staff Performance Report (${filters.staff === 'all' ? 'All' : filters.staff.charAt(0).toUpperCase() + filters.staff.slice(1)})`,
          type: 'Staff',
          date: reportDate,
          size: `${(JSON.stringify(filteredStaff).length / 1024).toFixed(1)} KB`,
          data: {
            totalStaff: filteredStaff.length,
            filter: filters.staff,
            activeStaff: filteredStaff.filter(s => s.status === 'active').length,
            staff: filteredStaff.map(s => ({
              name: s.name,
              position: s.role || 'Staff Member',
              status: s.status,
              salary: s.salary,
              joinDate: s.joinDate,
              email: s.email || '',
              phone: s.phone || '',
              department: s.department || 'General'
            })),
            // Add detailed appointment and billing information
            detailedStaff: filteredStaff,
            staffAppointments: filteredStaff.map(s => 
              (appointments || []).filter(apt => 
                apt.assignedTo === s.name || apt.staffId === s.id
              )
            ).flat(),
            staffInvoices: filteredStaff.map(s => 
              (invoices || []).filter(inv => 
                inv.createdBy === s.name || inv.staffId === s.id
              )
            ).flat()
          }
        }
      
      case 'inventory':
        const filteredInventory = filters.inventory === 'all' 
          ? (inventory || []) 
          : filters.inventory === 'low-stock' 
            ? (inventory || []).filter(i => i && i.quantity < 10)
            : (inventory || []).filter(i => i && i.quantity >= 10)
        
        return {
          id: `inventory-${Date.now()}`,
          name: `Inventory Usage Report (${filters.inventory === 'all' ? 'All' : filters.inventory === 'low-stock' ? 'Low Stock' : 'Normal Stock'})`,
          type: 'Inventory',
          date: reportDate,
          size: `${(JSON.stringify(filteredInventory).length / 1024).toFixed(1)} KB`,
          data: {
            totalItems: filteredInventory.length,
            filter: filters.inventory,
            lowStock: filteredInventory.filter(i => i.quantity < 10).length,
            inventory: filteredInventory.map(i => ({
              name: i.name,
              category: i.category,
              quantity: i.quantity,
              unitPrice: i.price || 0,
              lastUpdated: (i as any).updatedAt || new Date().toISOString(),
              supplier: i.supplier || '',
              expiryDate: i.expiryDate || '',
              description: i.description || ''
            })),
            // Add detailed appointment and billing information
            detailedInventory: filteredInventory,
            inventoryUsage: filteredInventory.map(item => 
              (appointments || []).filter(apt => 
                apt.treatments && apt.treatments.some((t: any) => t.item === item.name)
              )
            ).flat(),
            inventoryBilling: filteredInventory.map(item => 
              (invoices || []).filter(inv => 
                inv.treatments && inv.treatments.some((t: any) => t.item === item.name)
              )
            ).flat()
          }
        }
      
      case 'feedback':
        const filteredFeedback = filters.feedback === 'all' 
          ? (feedback || []) 
          : (feedback || []).filter(f => f && f.status === filters.feedback)
        
        return {
          id: `feedback-${Date.now()}`,
          name: `Patient Feedback Report (${filters.feedback === 'all' ? 'All' : filters.feedback.charAt(0).toUpperCase() + filters.feedback.slice(1)})`,
          type: 'Feedback',
          date: reportDate,
          size: `${(JSON.stringify(filteredFeedback).length / 1024).toFixed(1)} KB`,
          data: {
            totalFeedback: filteredFeedback.length,
            filter: filters.feedback,
            averageRating: filteredFeedback.length > 0 ? (filteredFeedback.reduce((sum, f) => sum + f.rating, 0) / filteredFeedback.length).toFixed(1) : 0,
            feedback: filteredFeedback.map(f => ({
              patientName: f.patientName,
              rating: f.rating,
              comment: f.comment,
              date: f.date,
              status: f.status,
              category: f.category || 'General',
              response: f.response || '',
              followUp: f.followUp || false
            })),
            // Add detailed appointment and billing information
            detailedFeedback: filteredFeedback,
            feedbackAppointments: filteredFeedback.map(f => 
              (appointments || []).filter(apt => 
                apt.patientName === f.patientName || apt.patientId === f.patientId
              )
            ).flat(),
            feedbackInvoices: filteredFeedback.map(f => 
              (invoices || []).filter(inv => 
                inv.patientName === f.patientName || inv.patientId === f.patientId
              )
            ).flat()
          }
        }
      
      default:
        return {
          id: `unknown-${Date.now()}`,
          name: 'Unknown Report',
          type: 'Unknown',
          date: reportDate,
          size: '0 KB',
          data: {
            totalItems: 0,
            filter: 'all',
            items: []
          }
        }
    }
  }

  const handleGenerateReport = async (reportType: string) => {
    setIsGenerating(true)
    setSelectedReport(reportType)
    
    // Simulate report generation delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const reportData = generateReportData(reportType)
    if (reportData && reportData.data) {
      // Add format information to report data
      (reportData as any).format = reportFormat
      setGeneratedReports(prev => [reportData, ...prev])
    }
    
    setIsGenerating(false)
    setSelectedReport('')
  }

  const handleShowReport = async (reportTypeParam: string) => {
    if (reportTypeParam === 'patient' || reportTypeParam === 'appointment') {
      // For patient and appointment reports, check both Type and Format
      const reportData = generateReportData(reportTypeParam)
      if (reportData && reportData.data) {
        // Use reportType for the display type (details/list) and reportFormat for the output format (pdf/csv/excel)
        if (reportType === 'details') {
          if (reportFormat === 'pdf') {
            (reportData as any).format = 'details-pdf'
            handleOpenDetailedReportInNewPage(reportData)
          } else if (reportFormat === 'csv') {
            (reportData as any).format = 'details-csv'
            const reportWithTimestamp = {
              ...reportData,
              timestamp: Date.now()
            }
            // Add to all reports (permanent storage)
            setAllReports(prev => {
              const exists = prev.some(r => r.id === reportData.id)
              if (!exists) {
                const newAllReports = [...prev, reportWithTimestamp]
                localStorage.setItem('allReports', JSON.stringify(newAllReports))
                return newAllReports
              }
              return prev
            })
            // Add to current day reports
            setGeneratedReports(prev => [...prev, reportWithTimestamp])
            // Download CSV directly
            handleDownloadCSVDirectly(reportData)
          } else if (reportFormat === 'excel') {
            (reportData as any).format = 'details-excel'
            const reportWithTimestamp = {
              ...reportData,
              timestamp: Date.now()
            }
            // Add to all reports (permanent storage)
            setAllReports(prev => {
              const exists = prev.some(r => r.id === reportData.id)
              if (!exists) {
                const newAllReports = [...prev, reportWithTimestamp]
                localStorage.setItem('allReports', JSON.stringify(newAllReports))
                return newAllReports
              }
              return prev
            })
            // Add to current day reports
            setGeneratedReports(prev => [...prev, reportWithTimestamp])
            // Download Excel directly
            handleDownloadCSVDirectly(reportData)
          }
        } else if (reportType === 'list') {
          if (reportFormat === 'pdf') {
            (reportData as any).format = 'list-pdf'
            handleOpenListReportWithTable(reportData)
          } else if (reportFormat === 'csv') {
            (reportData as any).format = 'list-csv'
            const reportWithTimestamp = {
              ...reportData,
              timestamp: Date.now()
            }
            // Add to all reports (permanent storage)
            setAllReports(prev => {
              const exists = prev.some(r => r.id === reportData.id)
              if (!exists) {
                const newAllReports = [...prev, reportWithTimestamp]
                localStorage.setItem('allReports', JSON.stringify(newAllReports))
                return newAllReports
              }
              return prev
            })
            // Add to current day reports
            setGeneratedReports(prev => [...prev, reportWithTimestamp])
            // Download CSV directly
            handleDownloadCSVDirectly(reportData)
          } else if (reportFormat === 'excel') {
            (reportData as any).format = 'list-excel'
            const reportWithTimestamp = {
              ...reportData,
              timestamp: Date.now()
            }
            // Add to all reports (permanent storage)
            setAllReports(prev => {
              const exists = prev.some(r => r.id === reportData.id)
              if (!exists) {
                const newAllReports = [...prev, reportWithTimestamp]
                localStorage.setItem('allReports', JSON.stringify(newAllReports))
                return newAllReports
              }
              return prev
            })
            // Add to current day reports
            setGeneratedReports(prev => [...prev, reportWithTimestamp])
            // Download Excel directly
            handleDownloadCSVDirectly(reportData)
          }
        }
      }
    } else {
      // For other report types, use the normal generate function
      handleGenerateReport(reportTypeParam)
    }
  }

  const handleReportClick = (report: any) => {
    setSelectedReportDetails(report)
    setShowReportModal(true)
  }

  const handleCloseReportModal = () => {
    setShowReportModal(false)
    setSelectedReportDetails(null)
  }

  const handleOpenDetailedReportInNewPage = (reportData: any) => {
    const patients = reportData.data.patients || []
    const appointments = reportData.data.appointments || reportData.data.detailedAppointments || []
    const invoices = reportData.data.invoices || reportData.data.detailedInvoices || []
    const staff = reportData.data.staff || reportData.data.detailedStaff || []
    const inventory = reportData.data.inventory || reportData.data.detailedInventory || []
    const feedback = reportData.data.feedback || reportData.data.detailedFeedback || []
    
    // Get original patient data from store for better matching
    const originalPatients = storeData?.patients || []
    const allPatients = [...patients, ...originalPatients].filter((patient, index, self) => 
      index === self.findIndex(p => p.id === patient.id || p.name === patient.name)
    )
    
    // Debug: Log the data being passed
    console.log('Report Data:', reportData)
    console.log('Patients:', patients)
    console.log('Appointments:', appointments)
    console.log('Invoices:', invoices)
    
    // Debug: Check appointment statuses
    if (appointments.length > 0) {
      const statuses = appointments.map(apt => apt.status).filter(Boolean)
      const uniqueStatuses = [...new Set(statuses)]
      console.log('Available appointment statuses:', uniqueStatuses)
      console.log('Sample appointment:', appointments[0])
    }
    
    // Generate HTML content for detailed report
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${reportData.type} Detailed Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .print-container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 20px;
          }
          .header h1 {
            font-size: 24px;
            color: #1f2937;
            margin: 0 0 10px 0;
          }
          .header p {
            color: #6b7280;
            margin: 5px 0;
          }
          .patient-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            background-color: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .table-header {
            background-color: #f0f0f0;
            color: #1f2937;
            padding: 18px;
            font-weight: bold;
            text-align: center;
            font-size: 16px;
            border: none;
          }
          .label-cell {
            background-color: #f8fafc;
            font-weight: bold;
            color: #374151;
            padding: 15px 20px;
            border: 1px solid #e5e7eb;
            width: 25%;
            vertical-align: top;
            font-size: 14px;
          }
          .value-cell {
            background-color: white;
            color: #374151;
            padding: 15px 20px;
            border: 1px solid #e5e7eb;
            width: 75%;
            vertical-align: top;
            font-size: 14px;
          }
          .patient-table tbody tr:hover {
            background-color: #f9fafb;
          }
          .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #16a34a;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            z-index: 9999;
            display: block;
            visibility: visible;
          }
          .print-button:hover {
            background-color: #15803d;
          }
          .patient-section {
            margin-bottom: 40px;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            padding: 20px;
            background-color: #fafafa;
          }
          .patient-title {
            color: #1f2937;
            font-size: 22px;
            font-weight: bold;
            margin: 0 0 25px 0;
            padding: 18px;
            background-color: #f0f0f0;
            color: #1f2937;
            border-radius: 8px;
            text-align: center;
          }
          .section-title {
            color: #1f2937;
            font-size: 18px;
            font-weight: bold;
            margin: 20px 0 15px 0;
            padding: 12px;
            background-color: #10b981;
            color: white;
            border-radius: 6px;
            text-align: center;
          }
          @media print {
            body {
              background: white;
              padding: 0;
            }
            .print-container {
              box-shadow: none;
              border-radius: 0;
              padding: 0;
            }
            .print-button {
              display: none;
            }
            .patient-section {
              border: 1px solid #000;
              margin-bottom: 30px;
              page-break-inside: avoid;
            }
            .patient-table {
              box-shadow: none;
              border: 1px solid #000;
            }
            .table-header {
              background-color: #3b82f6 !important;
              color: white !important;
            }
            .label-cell {
              background-color: #f8fafc !important;
              border: 1px solid #000;
            }
            .value-cell {
              background-color: white !important;
              border: 1px solid #000;
            }
          }
        </style>
      </head>
      <body>
        <button class="print-button" onclick="handlePrintAndTrack()">Print</button>
        
        <div class="print-container">
          <div class="header">
            <h1>${reportData.type.toUpperCase()} DETAILED REPORT</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
            <p>Report ID: ${reportData.id}</p>
          </div>
          
          ${(() => {
            // Generate content based on report type
            switch (reportData.type) {
              case 'Patient':
                return patients.map((patient: any, index: number) => {
                  // Get patient's appointments - try multiple matching methods
                  const patientAppointments = appointments.filter(apt => 
                    apt.patientName === patient.name || 
                    apt.patientId === patient.id
                  )
                  // Get patient's invoices - try multiple matching methods
                  const patientInvoices = invoices.filter(inv => 
                    inv.patientName === patient.name || 
                    inv.patientId === patient.id
                  )
                  
                  // Use real data if available, otherwise show "No data available"
                  const displayAppointments = patientAppointments.length > 0 ? patientAppointments : []
                  const displayInvoices = patientInvoices.length > 0 ? patientInvoices : []
                  
                  // Debug logging
                  console.log('Patient:', patient.name)
                  console.log('Appointments found:', patientAppointments.length)
                  console.log('Invoices found:', patientInvoices.length)
                  
                  return `
                    <div class="patient-section">
                      <h2 class="patient-title">Patient ${index + 1}: ${patient.name || 'N/A'}</h2>
                
                <table class="patient-table">
                  <thead>
                    <tr>
                      <th colspan="2" class="table-header">PATIENT INFORMATION</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="label-cell">Name:</td>
                      <td class="value-cell">${patient.name || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td class="label-cell">Age:</td>
                      <td class="value-cell">${patient.age || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td class="label-cell">Gender:</td>
                      <td class="value-cell">${patient.gender || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td class="label-cell">Phone:</td>
                      <td class="value-cell">${patient.phone || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td class="label-cell">Email:</td>
                      <td class="value-cell">${patient.email || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td class="label-cell">Address:</td>
                      <td class="value-cell">${patient.address || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td class="label-cell">Medical History:</td>
                      <td class="value-cell">${patient.medicalHistory || 'None'}</td>
                    </tr>
                    <tr>
                      <td class="label-cell">Allergies:</td>
                      <td class="value-cell">${patient.allergies || 'None'}</td>
                    </tr>
                    <tr>
                      <td class="label-cell">Registration Date:</td>
                      <td class="value-cell">${patient.registrationDate ? new Date(patient.registrationDate).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                    <tr>
                      <td class="label-cell">Status:</td>
                      <td class="value-cell">${patient.status || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td class="label-cell">Appointments:</td>
                      <td class="value-cell">
                        <div style="margin-bottom: 10px;">
                          ${displayAppointments.length > 0 ? `
                          <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
                            <thead>
                              <tr style="background-color: #f8f9fa;">
                                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-size: 12px;">Date</th>
                                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-size: 12px;">Time</th>
                                  <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-size: 12px;">Treatment Type</th>
                                  <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-size: 12px;">Duration</th>
                                  <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-size: 12px;">Priority</th>
                                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-size: 12px;">Status</th>
                                  <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-size: 12px;">Notes</th>
                              </tr>
                            </thead>
                            <tbody>
                                ${displayAppointments.map(apt => `
                                <tr>
                                  <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 12px;">${new Date(apt.date).toLocaleDateString()}</td>
                                  <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 12px;">${apt.time}</td>
                                    <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 12px;">${apt.type || 'General Checkup'}</td>
                                    <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 12px;">${apt.duration || '30 mins'}</td>
                                    <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 12px;">
                                      <span style="padding: 2px 6px; border-radius: 4px; font-size: 10px; 
                                        background-color: ${apt.priority === 'urgent' ? '#fee2e2' : apt.priority === 'high' ? '#fef3c7' : '#f0f9ff'};
                                        color: ${apt.priority === 'urgent' ? '#dc2626' : apt.priority === 'high' ? '#d97706' : '#2563eb'};">
                                        ${apt.priority || 'normal'}
                                      </span>
                                    </td>
                                    <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 12px;">
                                      <span style="padding: 2px 6px; border-radius: 4px; font-size: 10px;
                                        background-color: ${apt.status === 'completed' ? '#d1fae5' : apt.status === 'confirmed' ? '#dbeafe' : apt.status === 'cancelled' ? '#fee2e2' : '#f3f4f6'};
                                        color: ${apt.status === 'completed' ? '#065f46' : apt.status === 'confirmed' ? '#1e40af' : apt.status === 'cancelled' ? '#dc2626' : '#374151'};">
                                        ${apt.status}
                                      </span>
                                    </td>
                                    <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 12px;">${apt.notes || 'N/A'}</td>
                                </tr>
                              `).join('')}
                            </tbody>
                          </table>
                          ` : `
                            <div style="padding: 10px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; text-align: center; color: #6b7280; font-size: 12px;">
                              No appointments found for this patient
                            </div>
                          `}
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td class="label-cell">Billing:</td>
                      <td class="value-cell">
                        <div style="margin-bottom: 10px;">
                          ${displayInvoices.length > 0 ? `
                          <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                              <tr style="background-color: #f8f9fa;">
                                  <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-size: 12px;">Invoice #</th>
                                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-size: 12px;">Date</th>
                                  <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-size: 12px;">Due Date</th>
                                  <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-size: 12px;">Subtotal</th>
                                  <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-size: 12px;">Tax</th>
                                  <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-size: 12px;">Discount</th>
                                  <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-size: 12px;">Total</th>
                                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-size: 12px;">Status</th>
                                  <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-size: 12px;">Payment</th>
                              </tr>
                            </thead>
                            <tbody>
                                ${displayInvoices.map(inv => `
                                  <tr>
                                    <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 12px;">${inv.invoiceNumber || inv.id}</td>
                                    <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 12px;">${new Date(inv.invoiceDate || inv.createdAt || new Date()).toLocaleDateString()}</td>
                                    <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 12px;">${new Date(inv.dueDate || new Date()).toLocaleDateString()}</td>
                                    <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 12px;">Rs. ${(inv.subtotal || 0).toLocaleString()}</td>
                                    <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 12px;">Rs. ${(inv.tax || 0).toLocaleString()}</td>
                                    <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 12px;">Rs. ${(inv.discount || 0).toLocaleString()}</td>
                                    <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 12px; font-weight: bold;">Rs. ${(inv.total || 0).toLocaleString()}</td>
                                    <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 12px;">
                                      <span style="padding: 2px 6px; border-radius: 4px; font-size: 10px;
                                        background-color: ${inv.status === 'paid' ? '#d1fae5' : inv.status === 'pending' ? '#fef3c7' : inv.status === 'overdue' ? '#fee2e2' : '#f3f4f6'};
                                        color: ${inv.status === 'paid' ? '#065f46' : inv.status === 'pending' ? '#d97706' : inv.status === 'overdue' ? '#dc2626' : '#374151'};">
                                        ${inv.status}
                                      </span>
                                    </td>
                                    <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 12px;">${inv.paymentMethod || 'N/A'}</td>
                                </tr>
                              `).join('')}
                            </tbody>
                          </table>
                            <div style="margin-top: 10px; padding: 8px; background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 4px;">
                              <strong style="color: #0369a1; font-size: 12px;">Total Billing Summary:</strong>
                              <div style="margin-top: 4px; font-size: 11px; color: #0c4a6e;">
                                Total Invoices: ${displayInvoices.length} | 
                                Total Amount: Rs. ${displayInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0).toLocaleString()} | 
                                Paid: Rs. ${displayInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.total || 0), 0).toLocaleString()} | 
                                Pending: Rs. ${displayInvoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + (inv.total || 0), 0).toLocaleString()}
                              </div>
                            </div>
                            ${displayInvoices.some(inv => inv.treatments && inv.treatments.length > 0) ? `
                              <div style="margin-top: 15px;">
                                <h4 style="color: #374151; font-size: 14px; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;">Treatment Details</h4>
                                ${displayInvoices.map(inv => 
                                  inv.treatments && inv.treatments.length > 0 ? `
                                    <div style="margin-bottom: 10px; padding: 8px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px;">
                                      <div style="font-weight: bold; font-size: 12px; color: #374151; margin-bottom: 4px;">Invoice: ${inv.invoiceNumber || inv.id}</div>
                                      <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                                        <thead>
                                          <tr style="background-color: #f3f4f6;">
                                            <th style="padding: 4px; border: 1px solid #d1d5db; text-align: left;">Treatment</th>
                                            <th style="padding: 4px; border: 1px solid #d1d5db; text-align: left;">Description</th>
                                            <th style="padding: 4px; border: 1px solid #d1d5db; text-align: right;">Amount</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          ${inv.treatments.map((treatment: any) => `
                                            <tr>
                                              <td style="padding: 4px; border: 1px solid #d1d5db;">${treatment.type}</td>
                                              <td style="padding: 4px; border: 1px solid #d1d5db;">${treatment.description || 'N/A'}</td>
                                              <td style="padding: 4px; border: 1px solid #d1d5db; text-align: right;">Rs. ${(treatment.amount || 0).toLocaleString()}</td>
                                            </tr>
                                          `).join('')}
                                        </tbody>
                                      </table>
                                    </div>
                                  ` : ''
                                ).join('')}
                              </div>
                            ` : ''}
                          ` : `
                            <div style="padding: 10px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; text-align: center; color: #6b7280; font-size: 12px;">
                              No billing records found for this patient
                            </div>
                          `}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            `
                }).join('')
              case 'Appointment':
                return appointments.map((appointment: any, index: number) => {
                  // Find patient information - try multiple matching methods
                  let patient = allPatients.find(p => p.name === appointment.patientName)
                  
                  // If not found by name, try to find by ID
                  if (!patient && appointment.patientId) {
                    patient = allPatients.find(p => p.id === appointment.patientId)
                  }
                  
                  // If still not found, try case-insensitive name matching
                  if (!patient) {
                    patient = allPatients.find(p => 
                      p.name && appointment.patientName && 
                      p.name.toLowerCase() === appointment.patientName.toLowerCase()
                    )
                  }
                  
                  // Get completed treatments for this patient
                  const completedTreatments = appointments
                    .filter(apt => 
                      (apt.patientName === appointment.patientName || apt.patientId === appointment.patientId) &&
                      apt.status === 'completed'
                    )
                    .map(apt => apt.treatment || apt.type || 'General Checkup')
                    .filter((treatment, idx, arr) => arr.indexOf(treatment) === idx) // Remove duplicates
                  
                  return `
                  <div class="patient-section">
                    <h2 class="patient-title">Appointment ${index + 1}: ${appointment.patientName || 'N/A'}</h2>
                    <table class="patient-table">
                      <thead>
                        <tr>
                          <th colspan="2" class="table-header">APPOINTMENT INFORMATION</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td class="label-cell">Patient:</td>
                          <td class="value-cell">${appointment.patientName || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Email:</td>
                          <td class="value-cell">${patient?.email || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Phone Number:</td>
                          <td class="value-cell">${patient?.phone || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Address:</td>
                          <td class="value-cell">${patient?.address || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Age:</td>
                          <td class="value-cell">${patient?.age || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Gender:</td>
                          <td class="value-cell">${patient?.gender || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Date:</td>
                          <td class="value-cell">${appointment.date ? new Date(appointment.date).toLocaleDateString() : 'N/A'}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Time:</td>
                          <td class="value-cell">${appointment.time || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Treatment:</td>
                          <td class="value-cell">${appointment.treatment || appointment.type || 'General Checkup'}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Duration:</td>
                          <td class="value-cell">${appointment.duration || '30 min'}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Priority:</td>
                          <td class="value-cell">${appointment.priority || 'Normal'}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Status:</td>
                          <td class="value-cell">${appointment.status || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Completed Treatments:</td>
                          <td class="value-cell">${completedTreatments.length > 0 ? completedTreatments.join(', ') : 'None'}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Notes:</td>
                          <td class="value-cell">${appointment.notes || 'No notes'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                `
                }).join('')
              case 'Financial':
                return invoices.map((invoice: any, index: number) => `
                  <div class="patient-section">
                    <h2 class="patient-title">Invoice ${index + 1}: ${invoice.patientName || 'N/A'}</h2>
                    <table class="patient-table">
                      <thead>
                        <tr>
                          <th colspan="2" class="table-header">INVOICE INFORMATION</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td class="label-cell">Patient:</td>
                          <td class="value-cell">${invoice.patientName || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Invoice #:</td>
                          <td class="value-cell">${invoice.id || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Date:</td>
                          <td class="value-cell">${invoice.createdAt || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Due Date:</td>
                          <td class="value-cell">${invoice.dueDate || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Subtotal:</td>
                          <td class="value-cell">$${invoice.subtotal || 0}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Tax:</td>
                          <td class="value-cell">$${invoice.tax || 0}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Discount:</td>
                          <td class="value-cell">$${invoice.discount || 0}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Total:</td>
                          <td class="value-cell">$${invoice.total || 0}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Status:</td>
                          <td class="value-cell">${invoice.status || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Payment Method:</td>
                          <td class="value-cell">${invoice.paymentMethod || 'Cash'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                `).join('')
              case 'Staff':
                return staff.map((staffMember: any, index: number) => `
                  <div class="patient-section">
                    <h2 class="patient-title">Staff ${index + 1}: ${staffMember.name || 'N/A'}</h2>
                    <table class="patient-table">
                      <thead>
                        <tr>
                          <th colspan="2" class="table-header">STAFF INFORMATION</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td class="label-cell">Name:</td>
                          <td class="value-cell">${staffMember.name || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Position:</td>
                          <td class="value-cell">${staffMember.role || 'Staff Member'}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Department:</td>
                          <td class="value-cell">${staffMember.department || 'General'}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Email:</td>
                          <td class="value-cell">${staffMember.email || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Phone:</td>
                          <td class="value-cell">${staffMember.phone || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Salary:</td>
                          <td class="value-cell">$${staffMember.salary || 0}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Join Date:</td>
                          <td class="value-cell">${staffMember.joinDate || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Status:</td>
                          <td class="value-cell">${staffMember.status || 'N/A'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                `).join('')
              case 'Inventory':
                return inventory.map((item: any, index: number) => `
                  <div class="patient-section">
                    <h2 class="patient-title">Item ${index + 1}: ${item.name || 'N/A'}</h2>
                    <table class="patient-table">
                      <thead>
                        <tr>
                          <th colspan="2" class="table-header">INVENTORY INFORMATION</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td class="label-cell">Name:</td>
                          <td class="value-cell">${item.name || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Category:</td>
                          <td class="value-cell">${item.category || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Quantity:</td>
                          <td class="value-cell">${item.quantity || 0}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Unit Price:</td>
                          <td class="value-cell">$${item.price || 0}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Supplier:</td>
                          <td class="value-cell">${item.supplier || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Expiry Date:</td>
                          <td class="value-cell">${item.expiryDate || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Description:</td>
                          <td class="value-cell">${item.description || 'No description'}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Last Updated:</td>
                          <td class="value-cell">${item.updatedAt || 'N/A'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                `).join('')
              case 'Feedback':
                return feedback.map((feedbackItem: any, index: number) => `
                  <div class="patient-section">
                    <h2 class="patient-title">Feedback ${index + 1}: ${feedbackItem.patientName || 'N/A'}</h2>
                    <table class="patient-table">
                      <thead>
                        <tr>
                          <th colspan="2" class="table-header">FEEDBACK INFORMATION</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td class="label-cell">Patient:</td>
                          <td class="value-cell">${feedbackItem.patientName || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Rating:</td>
                          <td class="value-cell">${feedbackItem.rating || 'N/A'}/5</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Category:</td>
                          <td class="value-cell">${feedbackItem.category || 'General'}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Comment:</td>
                          <td class="value-cell">${feedbackItem.comment || 'No comment'}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Response:</td>
                          <td class="value-cell">${feedbackItem.response || 'No response'}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Date:</td>
                          <td class="value-cell">${feedbackItem.date || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Status:</td>
                          <td class="value-cell">${feedbackItem.status || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Follow Up:</td>
                          <td class="value-cell">${feedbackItem.followUp ? 'Yes' : 'No'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                `).join('')
              case 'Appointment':
                return appointments.map((appointment: any, index: number) => {
                  // Get original patient data from store for better matching
                  const originalPatients = storeData?.patients || []
                  const allPatients = [...patients, ...originalPatients].filter((patient, index, self) => 
                    index === self.findIndex(p => p.id === patient.id || p.name === patient.name)
                  )
                  
                  // Find patient for this appointment
                  let patient = allPatients.find(p => p.name === appointment.patientName)
                  
                  // If not found by name, try to find by ID
                  if (!patient && appointment.patientId) {
                    patient = allPatients.find(p => p.id === appointment.patientId)
                  }
                  
                  // If still not found, try case-insensitive name matching
                  if (!patient) {
                    patient = allPatients.find(p => 
                      p.name && appointment.patientName && 
                      p.name.toLowerCase() === appointment.patientName.toLowerCase()
                    )
                  }
                  
                  // Get appointment's related invoices
                  const appointmentInvoices = invoices.filter(inv => 
                    inv.patientName === appointment.patientName || 
                    inv.patientId === appointment.patientId
                  )
                  
                  return `
                    <div class="patient-section">
                      <h2 class="patient-title">Appointment ${index + 1}: ${appointment.patientName || 'N/A'}</h2>
                
                      <table class="patient-table">
                        <thead>
                          <tr>
                            <th colspan="2" class="table-header">APPOINTMENT INFORMATION</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td class="label-cell">Patient Name:</td>
                            <td class="value-cell">${appointment.patientName || 'N/A'}</td>
                          </tr>
                          <tr>
                            <td class="label-cell">Date:</td>
                            <td class="value-cell">${appointment.date ? new Date(appointment.date).toLocaleDateString() : 'N/A'}</td>
                          </tr>
                          <tr>
                            <td class="label-cell">Time:</td>
                            <td class="value-cell">${appointment.time || 'N/A'}</td>
                          </tr>
                          <tr>
                            <td class="label-cell">Treatment Type:</td>
                            <td class="value-cell">${appointment.type || 'General Checkup'}</td>
                          </tr>
                          <tr>
                            <td class="label-cell">Duration:</td>
                            <td class="value-cell">${appointment.duration || '30 min'}</td>
                          </tr>
                          <tr>
                            <td class="label-cell">Priority:</td>
                            <td class="value-cell">${appointment.priority || 'Normal'}</td>
                          </tr>
                          <tr>
                            <td class="label-cell">Status:</td>
                            <td class="value-cell">
                              <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px;
                                background-color: ${appointment.status === 'scheduled' || appointment.status === 'Scheduled' || appointment.status === 'pending' || appointment.status === 'Pending' || appointment.status === 'upcoming' || appointment.status === 'Upcoming' || appointment.status === 'new' || appointment.status === 'New' || appointment.status === 'booked' || appointment.status === 'Booked' ? '#e9d5ff' : 
                                  appointment.status === 'confirmed' || appointment.status === 'Confirmed' ? '#dbeafe' : 
                                  appointment.status === 'completed' || appointment.status === 'Completed' ? '#d1fae5' : 
                                  appointment.status === 'cancelled' || appointment.status === 'Cancelled' ? '#fee2e2' : '#f3f4f6'};
                                color: ${appointment.status === 'scheduled' || appointment.status === 'Scheduled' || appointment.status === 'pending' || appointment.status === 'Pending' || appointment.status === 'upcoming' || appointment.status === 'Upcoming' || appointment.status === 'new' || appointment.status === 'New' || appointment.status === 'booked' || appointment.status === 'Booked' ? '#7c3aed' : 
                                  appointment.status === 'confirmed' || appointment.status === 'Confirmed' ? '#1e40af' : 
                                  appointment.status === 'completed' || appointment.status === 'Completed' ? '#065f46' : 
                                  appointment.status === 'cancelled' || appointment.status === 'Cancelled' ? '#dc2626' : '#374151'};">
                                ${appointment.status === 'pending' || appointment.status === 'Pending' || appointment.status === 'upcoming' || appointment.status === 'Upcoming' || appointment.status === 'new' || appointment.status === 'New' || appointment.status === 'booked' || appointment.status === 'Booked' ? 'Scheduled' : appointment.status || 'N/A'}
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td class="label-cell">Notes:</td>
                            <td class="value-cell">${appointment.notes || 'N/A'}</td>
                          </tr>
                          <tr>
                            <td class="label-cell">Email:</td>
                            <td class="value-cell">${patient?.email || 'N/A'}</td>
                          </tr>
                          <tr>
                            <td class="label-cell">Phone Number:</td>
                            <td class="value-cell">${patient?.phone || 'N/A'}</td>
                          </tr>
                          <tr>
                            <td class="label-cell">Address:</td>
                            <td class="value-cell">${patient?.address || 'N/A'}</td>
                          </tr>
                          <tr>
                            <td class="label-cell">Age:</td>
                            <td class="value-cell">${patient?.age || 'N/A'}</td>
                          </tr>
                          <tr>
                            <td class="label-cell">Gender:</td>
                            <td class="value-cell">${patient?.gender || 'N/A'}</td>
                          </tr>
                          <tr>
                            <td class="label-cell">Completed Treatments:</td>
                            <td class="value-cell">${appointment.completedTreatments || 'N/A'}</td>
                          </tr>
                          <tr>
                            <td class="label-cell">Related Invoices:</td>
                            <td class="value-cell">
                              <div style="margin-bottom: 10px;">
                                ${appointmentInvoices.length > 0 ? `
                                  <table style="width: 100%; border-collapse: collapse;">
                                    <thead>
                                      <tr style="background-color: #f8f9fa;">
                                        <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-size: 12px;">Invoice #</th>
                                        <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-size: 12px;">Date</th>
                                        <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-size: 12px;">Total</th>
                                        <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-size: 12px;">Status</th>
                                        <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-size: 12px;">Payment</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      ${appointmentInvoices.map(inv => `
                                        <tr>
                                          <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 12px;">${inv.invoiceNumber || inv.id}</td>
                                          <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 12px;">${new Date(inv.invoiceDate || inv.createdAt || new Date()).toLocaleDateString()}</td>
                                          <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 12px; font-weight: bold;">Rs. ${(inv.total || 0).toLocaleString()}</td>
                                          <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 12px;">${inv.status || 'N/A'}</td>
                                          <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 12px;">${inv.paymentMethod || 'N/A'}</td>
                                        </tr>
                                      `).join('')}
                                    </tbody>
                                  </table>
                                ` : `
                                  <div style="padding: 10px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; text-align: center; color: #6b7280; font-size: 12px;">
                                    No invoices found for this appointment
                                  </div>
                                `}
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  `
                }).join('')
              default:
                return '<div class="patient-section"><h2>No data available</h2></div>'
            }
          })()}
        </div>
        
        <script>
          function handlePrintAndTrack() {
            console.log('Print button clicked');
            // Add report to parent window's Recent Reports
            if (window.opener) {
              window.opener.postMessage({
                type: 'ADD_TO_RECENT_REPORTS',
                reportData: ${JSON.stringify(reportData)}
              }, '*');
            }
            // Print the page
            console.log('Calling window.print()');
            window.print();
          }
          
          // Make sure the function is available globally
          window.handlePrintAndTrack = handlePrintAndTrack;
        </script>
      </body>
      </html>
    `
    
    // Open HTML in new window
    const newWindow = window.open('', '_blank')
    if (newWindow) {
      newWindow.document.write(htmlContent)
      newWindow.document.close()
    }
  }

  const handleOpenListReportInNewPage = (reportData: any) => {
    const patients = reportData.data.patients || []
    
    // Generate HTML content for list report with proper table design
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Patient List Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .print-container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 20px;
          }
          .header h1 {
            font-size: 24px;
            color: #1f2937;
            margin: 0 0 10px 0;
          }
          .header p {
            color: #6b7280;
            margin: 5px 0;
          }
          .patient-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            background-color: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .table-header {
            background-color: #f0f0f0;
            color: #1f2937;
            padding: 18px;
            font-weight: bold;
            text-align: center;
            font-size: 16px;
            border: none;
          }
          .label-cell {
            background-color: #f8fafc;
            font-weight: bold;
            color: #374151;
            padding: 15px 20px;
            border: 1px solid #e5e7eb;
            width: 25%;
            vertical-align: top;
            font-size: 14px;
          }
          .value-cell {
            background-color: white;
            color: #374151;
            padding: 15px 20px;
            border: 1px solid #e5e7eb;
            width: 75%;
            vertical-align: top;
            font-size: 14px;
          }
          .patient-table tbody tr:hover {
            background-color: #f9fafb;
          }
          .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #16a34a;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            z-index: 9999;
            display: block;
            visibility: visible;
          }
          .print-button:hover {
            background-color: #15803d;
          }
          .patient-section {
            margin-bottom: 40px;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            padding: 20px;
            background-color: #fafafa;
          }
          .patient-title {
            color: #1f2937;
            font-size: 22px;
            font-weight: bold;
            margin: 0 0 25px 0;
            padding: 18px;
            background-color: #f0f0f0;
            color: #1f2937;
            border-radius: 8px;
            text-align: center;
          }
          @media print {
            body {
              background: white;
              padding: 0;
            }
            .print-container {
              box-shadow: none;
              border-radius: 0;
              padding: 0;
            }
            .print-button {
              display: none;
            }
            .patient-section {
              border: 1px solid #000;
              margin-bottom: 30px;
              page-break-inside: avoid;
            }
            .patient-table {
              box-shadow: none;
              border: 1px solid #000;
            }
            .table-header {
              background-color: #3b82f6 !important;
              color: white !important;
            }
            .label-cell {
              background-color: #f8fafc !important;
              border: 1px solid #000;
            }
            .value-cell {
              background-color: white !important;
              border: 1px solid #000;
            }
          }
        </style>
      </head>
      <body>
        <button class="print-button" onclick="handlePrintAndTrack()">Print</button>
        
        <div class="print-container">
          <div class="header">
            <h1>PATIENT LIST REPORT</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
            <p>Report ID: ${reportData.id}</p>
          </div>
          
          ${patients.map((patient: any, index: number) => `
            <div class="patient-section">
              <h2 class="patient-title">Patient ${index + 1}: ${patient.name || 'N/A'}</h2>
              
              <table class="patient-table">
                <thead>
                  <tr>
                    <th colspan="2" class="table-header">PATIENT INFORMATION</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="label-cell">Name:</td>
                    <td class="value-cell">${patient.name || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td class="label-cell">Age:</td>
                    <td class="value-cell">${patient.age || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td class="label-cell">Gender:</td>
                    <td class="value-cell">${patient.gender || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td class="label-cell">Phone:</td>
                    <td class="value-cell">${patient.phone || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
              
              <table class="patient-table">
                <thead>
                  <tr>
                    <th colspan="2" class="table-header">CONTACT INFORMATION</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="label-cell">Email:</td>
                    <td class="value-cell">${patient.email || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td class="label-cell">Address:</td>
                    <td class="value-cell">${patient.address || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
              
              <table class="patient-table">
                <thead>
                  <tr>
                    <th colspan="2" class="table-header">MEDICAL INFORMATION</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="label-cell">Medical History:</td>
                    <td class="value-cell">${patient.medicalHistory || 'None'}</td>
                  </tr>
                  <tr>
                    <td class="label-cell">Allergies:</td>
                    <td class="value-cell">${patient.allergies || 'None'}</td>
                  </tr>
                </tbody>
              </table>
              
              <table class="patient-table">
                <thead>
                  <tr>
                    <th colspan="2" class="table-header">REGISTRATION INFORMATION</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="label-cell">Registration Date:</td>
                    <td class="value-cell">${patient.registrationDate ? new Date(patient.registrationDate).toLocaleDateString() : 'N/A'}</td>
                  </tr>
                  <tr>
                    <td class="label-cell">Status:</td>
                    <td class="value-cell">${patient.status || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          `).join('')}
        </div>
      </body>
      </html>
    `
    
    // Open HTML in new window
    const newWindow = window.open('', '_blank')
    if (newWindow) {
      newWindow.document.write(htmlContent)
      newWindow.document.close()
    }
  }

  const handleOpenPDFInNewPage = (reportData: any) => {
    const patients = reportData.data.patients || []
    const appointments = reportData.data.appointments || reportData.data.detailedAppointments || []
    const invoices = reportData.data.invoices || reportData.data.detailedInvoices || []
    const staff = reportData.data.staff || reportData.data.detailedStaff || []
    const inventory = reportData.data.inventory || reportData.data.detailedInventory || []
    const feedback = reportData.data.feedback || reportData.data.detailedFeedback || []
    
    // Generate HTML content for PDF report
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${reportData.type} PDF Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .print-container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 20px;
          }
          .header h1 {
            font-size: 24px;
            color: #1f2937;
            margin: 0 0 10px 0;
          }
          .header p {
            color: #6b7280;
            margin: 5px 0;
          }
          .patient-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            background-color: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .table-header {
            background-color: #f0f0f0;
            color: #1f2937;
            padding: 18px;
            font-weight: bold;
            text-align: center;
            font-size: 16px;
            border: none;
          }
          .label-cell {
            background-color: #f8fafc;
            font-weight: bold;
            color: #374151;
            padding: 15px 20px;
            border: 1px solid #e5e7eb;
            width: 25%;
            vertical-align: top;
            font-size: 14px;
          }
          .value-cell {
            background-color: white;
            color: #374151;
            padding: 15px 20px;
            border: 1px solid #e5e7eb;
            width: 75%;
            vertical-align: top;
            font-size: 14px;
          }
          .patient-table tbody tr:hover {
            background-color: #f9fafb;
          }
          .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #16a34a;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            z-index: 9999;
            display: block;
            visibility: visible;
          }
          .print-button:hover {
            background-color: #15803d;
          }
          .patient-section {
            margin-bottom: 40px;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            padding: 20px;
            background-color: #fafafa;
          }
          .patient-title {
            color: #1f2937;
            font-size: 22px;
            font-weight: bold;
            margin: 0 0 25px 0;
            padding: 18px;
            background-color: #f0f0f0;
            color: #1f2937;
            border-radius: 8px;
            text-align: center;
          }
          @media print {
            body {
              background: white;
              padding: 0;
            }
            .print-container {
              box-shadow: none;
              border-radius: 0;
              padding: 0;
            }
            .print-button {
              display: none;
            }
            .patient-section {
              border: 1px solid #000;
              margin-bottom: 30px;
              page-break-inside: avoid;
            }
            .patient-table {
              box-shadow: none;
              border: 1px solid #000;
            }
            .table-header {
              background-color: #3b82f6 !important;
              color: white !important;
            }
            .label-cell {
              background-color: #f8fafc !important;
              border: 1px solid #000;
            }
            .value-cell {
              background-color: white !important;
              border: 1px solid #000;
            }
          }
        </style>
      </head>
      <body>
        <button class="print-button" onclick="handlePrintAndTrack()">Print</button>
        
        <script>
          function handlePrintAndTrack() {
            console.log('Print button clicked');
            // Add report to parent window's Recent Reports
            if (window.opener) {
              window.opener.postMessage({
                type: 'ADD_TO_RECENT_REPORTS',
                reportData: ${JSON.stringify(reportData)}
              }, '*');
            }
            // Print the page
            console.log('Calling window.print()');
            window.print();
          }
          
          // Make sure the function is available globally
          window.handlePrintAndTrack = handlePrintAndTrack;
        </script>
        
        <div class="print-container">
          <div class="header">
            <h1>${reportData.type.toUpperCase()} PDF REPORT</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
            <p>Report ID: ${reportData.id}</p>
          </div>
          
          ${(() => {
            // Generate content based on report type
            switch (reportData.type) {
              case 'Patient':
                return patients.map((patient: any, index: number) => {
                  // Get patient's appointments - try multiple matching methods
                  const patientAppointments = appointments.filter(apt => 
                    apt.patientName === patient.name || 
                    apt.patientId === patient.id
                  )
                  // Get patient's invoices - try multiple matching methods
                  const patientInvoices = invoices.filter(inv => 
                    inv.patientName === patient.name || 
                    inv.patientId === patient.id
                  )
                  
                  // Use real data if available, otherwise show "No data available"
                  const displayAppointments = patientAppointments.length > 0 ? patientAppointments : []
                  const displayInvoices = patientInvoices.length > 0 ? patientInvoices : []
                  
                  return `
                  <div class="patient-section">
                    <h2 class="patient-title">Patient ${index + 1}: ${patient.name || 'N/A'}</h2>
              
              <table class="patient-table">
                <thead>
                  <tr>
                    <th colspan="2" class="table-header">PATIENT INFORMATION</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="label-cell">Name:</td>
                    <td class="value-cell">${patient.name || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td class="label-cell">Age:</td>
                    <td class="value-cell">${patient.age || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td class="label-cell">Gender:</td>
                    <td class="value-cell">${patient.gender || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td class="label-cell">Phone:</td>
                    <td class="value-cell">${patient.phone || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td class="label-cell">Email:</td>
                    <td class="value-cell">${patient.email || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td class="label-cell">Address:</td>
                    <td class="value-cell">${patient.address || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td class="label-cell">Medical History:</td>
                    <td class="value-cell">${patient.medicalHistory || 'None'}</td>
                  </tr>
                  <tr>
                    <td class="label-cell">Allergies:</td>
                    <td class="value-cell">${patient.allergies || 'None'}</td>
                  </tr>
                  <tr>
                    <td class="label-cell">Registration Date:</td>
                    <td class="value-cell">${patient.registrationDate ? new Date(patient.registrationDate).toLocaleDateString() : 'N/A'}</td>
                  </tr>
                  <tr>
                    <td class="label-cell">Status:</td>
                    <td class="value-cell">${patient.status || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td class="label-cell">Appointments:</td>
                    <td class="value-cell">
                      <div style="margin-bottom: 10px;">
                        ${displayAppointments.length > 0 ? `
                          <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
                            <thead>
                              <tr style="background-color: #f8f9fa;">
                                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-size: 12px;">Date</th>
                                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-size: 12px;">Time</th>
                                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-size: 12px;">Treatment Type</th>
                                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-size: 12px;">Duration</th>
                                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-size: 12px;">Priority</th>
                                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-size: 12px;">Status</th>
                                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-size: 12px;">Notes</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${displayAppointments.map(apt => `
                                <tr>
                                  <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 12px;">${new Date(apt.date).toLocaleDateString()}</td>
                                  <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 12px;">${apt.time}</td>
                                  <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 12px;">${apt.type || 'General Checkup'}</td>
                                  <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 12px;">${apt.duration || '30 mins'}</td>
                                  <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 12px;">
                                    <span style="padding: 2px 6px; border-radius: 4px; font-size: 10px; 
                                      background-color: ${apt.priority === 'urgent' ? '#fee2e2' : apt.priority === 'high' ? '#fef3c7' : '#f0f9ff'};
                                      color: ${apt.priority === 'urgent' ? '#dc2626' : apt.priority === 'high' ? '#d97706' : '#2563eb'};">
                                      ${apt.priority || 'normal'}
                                    </span>
                                  </td>
                                  <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 12px;">
                                    <span style="padding: 2px 6px; border-radius: 4px; font-size: 10px;
                                      background-color: ${apt.status === 'completed' ? '#d1fae5' : apt.status === 'confirmed' ? '#dbeafe' : apt.status === 'cancelled' ? '#fee2e2' : '#f3f4f6'};
                                      color: ${apt.status === 'completed' ? '#065f46' : apt.status === 'confirmed' ? '#1e40af' : apt.status === 'cancelled' ? '#dc2626' : '#374151'};">
                                      ${apt.status}
                                    </span>
                                  </td>
                                  <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 12px;">${apt.notes || 'N/A'}</td>
                                </tr>
                              `).join('')}
                </tbody>
              </table>
                        ` : `
                          <div style="padding: 10px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; text-align: center; color: #6b7280; font-size: 12px;">
                            No appointments found for this patient
            </div>
                        `}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td class="label-cell">Billing:</td>
                    <td class="value-cell">
                      <div style="margin-bottom: 10px;">
                        ${displayInvoices.length > 0 ? `
                          <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                              <tr style="background-color: #f8f9fa;">
                                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-size: 12px;">Invoice #</th>
                                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-size: 12px;">Date</th>
                                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-size: 12px;">Due Date</th>
                                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-size: 12px;">Subtotal</th>
                                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-size: 12px;">Tax</th>
                                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-size: 12px;">Discount</th>
                                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-size: 12px;">Total</th>
                                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-size: 12px;">Status</th>
                                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-size: 12px;">Payment</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${displayInvoices.map(inv => `
                                <tr>
                                  <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 12px;">${inv.invoiceNumber || inv.id}</td>
                                  <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 12px;">${new Date(inv.invoiceDate || inv.createdAt || new Date()).toLocaleDateString()}</td>
                                  <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 12px;">${new Date(inv.dueDate || new Date()).toLocaleDateString()}</td>
                                  <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 12px;">Rs. ${(inv.subtotal || 0).toLocaleString()}</td>
                                  <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 12px;">Rs. ${(inv.tax || 0).toLocaleString()}</td>
                                  <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 12px;">Rs. ${(inv.discount || 0).toLocaleString()}</td>
                                  <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 12px; font-weight: bold;">Rs. ${(inv.total || 0).toLocaleString()}</td>
                                  <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 12px;">
                                    <span style="padding: 2px 6px; border-radius: 4px; font-size: 10px;
                                      background-color: ${inv.status === 'paid' ? '#d1fae5' : inv.status === 'pending' ? '#fef3c7' : inv.status === 'overdue' ? '#fee2e2' : '#f3f4f6'};
                                      color: ${inv.status === 'paid' ? '#065f46' : inv.status === 'pending' ? '#d97706' : inv.status === 'overdue' ? '#dc2626' : '#374151'};">
                                      ${inv.status}
                                    </span>
                                  </td>
                                  <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 12px;">${inv.paymentMethod || 'N/A'}</td>
                                </tr>
          `).join('')}
                            </tbody>
                          </table>
                          <div style="margin-top: 10px; padding: 8px; background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 4px;">
                            <strong style="color: #0369a1; font-size: 12px;">Total Billing Summary:</strong>
                            <div style="margin-top: 4px; font-size: 11px; color: #0c4a6e;">
                              Total Invoices: ${displayInvoices.length} | 
                              Total Amount: Rs. ${displayInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0).toLocaleString()} | 
                              Paid: Rs. ${displayInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.total || 0), 0).toLocaleString()} | 
                              Pending: Rs. ${displayInvoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + (inv.total || 0), 0).toLocaleString()}
                            </div>
                          </div>
                          ${displayInvoices.some(inv => inv.treatments && inv.treatments.length > 0) ? `
                            <div style="margin-top: 15px;">
                              <h4 style="color: #374151; font-size: 14px; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;">Treatment Details</h4>
                              ${displayInvoices.map(inv => 
                                inv.treatments && inv.treatments.length > 0 ? `
                                  <div style="margin-bottom: 10px; padding: 8px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px;">
                                    <div style="font-weight: bold; font-size: 12px; color: #374151; margin-bottom: 4px;">Invoice: ${inv.invoiceNumber || inv.id}</div>
                                    <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                                      <thead>
                                        <tr style="background-color: #f3f4f6;">
                                          <th style="padding: 4px; border: 1px solid #d1d5db; text-align: left;">Treatment</th>
                                          <th style="padding: 4px; border: 1px solid #d1d5db; text-align: left;">Description</th>
                                          <th style="padding: 4px; border: 1px solid #d1d5db; text-align: right;">Amount</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        ${inv.treatments.map((treatment: any) => `
                                          <tr>
                                            <td style="padding: 4px; border: 1px solid #d1d5db;">${treatment.type}</td>
                                            <td style="padding: 4px; border: 1px solid #d1d5db;">${treatment.description || 'N/A'}</td>
                                            <td style="padding: 4px; border: 1px solid #d1d5db; text-align: right;">Rs. ${(treatment.amount || 0).toLocaleString()}</td>
                                          </tr>
                                        `).join('')}
                                      </tbody>
                                    </table>
                                  </div>
                                ` : ''
                              ).join('')}
                            </div>
                          ` : ''}
                        ` : `
                          <div style="padding: 10px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; text-align: center; color: #6b7280; font-size: 12px;">
                            No billing records found for this patient
                          </div>
                        `}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          `
                }).join('')
              case 'Appointment':
                return appointments.map((appointment: any, index: number) => {
                  // Find patient information - try multiple matching methods
                  let patient = allPatients.find(p => p.name === appointment.patientName)
                  
                  // If not found by name, try to find by ID
                  if (!patient && appointment.patientId) {
                    patient = allPatients.find(p => p.id === appointment.patientId)
                  }
                  
                  // If still not found, try case-insensitive name matching
                  if (!patient) {
                    patient = allPatients.find(p => 
                      p.name && appointment.patientName && 
                      p.name.toLowerCase() === appointment.patientName.toLowerCase()
                    )
                  }
                  
                  // Get completed treatments for this patient
                  const completedTreatments = appointments
                    .filter(apt => 
                      (apt.patientName === appointment.patientName || apt.patientId === appointment.patientId) &&
                      apt.status === 'completed'
                    )
                    .map(apt => apt.treatment || apt.type || 'General Checkup')
                    .filter((treatment, idx, arr) => arr.indexOf(treatment) === idx) // Remove duplicates
                  
                  return `
                  <div class="patient-section">
                    <h2 class="patient-title">Appointment ${index + 1}: ${appointment.patientName || 'N/A'}</h2>
                    <table class="patient-table">
                      <thead>
                        <tr>
                          <th colspan="2" class="table-header">APPOINTMENT INFORMATION</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td class="label-cell">Patient:</td>
                          <td class="value-cell">${appointment.patientName || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Email:</td>
                          <td class="value-cell">${patient?.email || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Phone Number:</td>
                          <td class="value-cell">${patient?.phone || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Address:</td>
                          <td class="value-cell">${patient?.address || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Age:</td>
                          <td class="value-cell">${patient?.age || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Gender:</td>
                          <td class="value-cell">${patient?.gender || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Date:</td>
                          <td class="value-cell">${appointment.date ? new Date(appointment.date).toLocaleDateString() : 'N/A'}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Time:</td>
                          <td class="value-cell">${appointment.time || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Treatment:</td>
                          <td class="value-cell">${appointment.treatment || appointment.type || 'General Checkup'}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Duration:</td>
                          <td class="value-cell">${appointment.duration || '30 min'}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Priority:</td>
                          <td class="value-cell">${appointment.priority || 'Normal'}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Status:</td>
                          <td class="value-cell">${appointment.status || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Completed Treatments:</td>
                          <td class="value-cell">${completedTreatments.length > 0 ? completedTreatments.join(', ') : 'None'}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Notes:</td>
                          <td class="value-cell">${appointment.notes || 'No notes'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                `
                }).join('')
              default:
                return '<div class="patient-section"><h2>No data available</h2></div>'
            }
          })()}
        </div>
      </body>
      </html>
    `
    
    // Open HTML in new window
    const newWindow = window.open('', '_blank')
    if (newWindow) {
      newWindow.document.write(htmlContent)
      newWindow.document.close()
    }
  }

  const handleDownloadCSVDirectly = (reportData: any) => {
    const filename = `${reportData.name.replace(/\s+/g, '_')}_${reportData.date}`
    
    // Create Excel file directly from report data
    const worksheet = XLSX.utils.json_to_sheet(reportData.data.patients || reportData.data.appointments || reportData.data.invoices || reportData.data.staff || reportData.data.inventory || reportData.data.feedback || [])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report')
    XLSX.writeFile(workbook, `${filename}.xlsx`)
    
    // Add to Recent Reports
    const reportToAdd = {
      ...reportData,
      format: 'csv',
      timestamp: new Date().toISOString()
    }
    
    // Add to allReports (persistent)
    const allReports = JSON.parse(localStorage.getItem('allReports') || '[]')
    allReports.unshift(reportToAdd)
    localStorage.setItem('allReports', JSON.stringify(allReports))
    
    // Add to generatedReports (current view)
    setGeneratedReports(prev => [reportToAdd, ...prev])
  }

  const handleOpenListReportWithTable = (reportData: any) => {
    const patients = reportData.data.patients || []
    const appointments = reportData.data.appointments || reportData.data.detailedAppointments || []
    const invoices = reportData.data.invoices || reportData.data.detailedInvoices || []
    const staff = reportData.data.staff || reportData.data.detailedStaff || []
    const inventory = reportData.data.inventory || reportData.data.detailedInventory || []
    const feedback = reportData.data.feedback || reportData.data.detailedFeedback || []
    
    // Get the appropriate data based on report type
    const dataToShow = reportData.type === 'appointment' || reportData.type === 'Appointment' ? appointments :
                      reportData.type === 'financial' || reportData.type === 'Financial' ? invoices :
                      reportData.type === 'staff' || reportData.type === 'Staff' ? staff :
                      reportData.type === 'inventory' || reportData.type === 'Inventory' ? inventory :
                      reportData.type === 'feedback' || reportData.type === 'Feedback' ? feedback :
                      patients
    
    // Debug logging
    console.log('Report Data:', reportData)
    console.log('Report Type:', reportData.type)
    console.log('Appointments Data:', appointments)
    console.log('Data to Show:', dataToShow)
    
    // Debug: Check appointment statuses in list report
    if (appointments.length > 0) {
      const statuses = appointments.map(apt => apt.status).filter(Boolean)
      const uniqueStatuses = [...new Set(statuses)]
      console.log('List Report - Available appointment statuses:', uniqueStatuses)
    }
    
    // Generate HTML content for list report with proper table design
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Patient List Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .print-container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 35px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 25px;
          }
          .header h1 {
            font-size: 24px;
            color: #1f2937;
            margin: 0 0 15px 0;
            font-weight: bold;
          }
          .header p {
            color: #6b7280;
            margin: 8px 0;
            font-size: 14px;
          }
          .total-records {
            font-weight: bold;
            margin-bottom: 25px;
            font-size: 16px;
          }
          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            background-color: white;
          }
          .data-table th {
            background-color: #f8f9fa;
            color: #374151;
            font-weight: bold;
            padding: 15px 12px;
            text-align: center;
            border: 1px solid #e5e7eb;
            font-size: 14px;
          }
          .data-table td {
            padding: 15px 12px;
            border: 1px solid #e5e7eb;
            font-size: 13px;
            background-color: white;
            color: #374151;
          }
          .data-table tr:nth-child(even) {
            background-color: #f9fafb;
          }
          .data-table tr:nth-child(even) td {
            background-color: #f9fafb;
          }
          .center-align {
            text-align: center;
          }
          .left-align {
            text-align: left;
          }
          .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #16a34a;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(21, 128, 61, 0.3);
            z-index: 1000;
          }
          .print-button:hover {
            background-color: #15803d;
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(21, 128, 61, 0.4);
          }
          @media print {
            .print-button { display: none; }
            body { background: white; }
            .print-container { 
              box-shadow: none; 
              border-radius: 0;
              padding: 0;
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        <button class="print-button" onclick="handlePrintAndTrack()">Print</button>
        
        <div class="print-container">
          <div class="header">
            <h1>${reportData.type.toUpperCase()} LIST REPORT</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
            <p>Report ID: ${reportData.id}</p>
          </div>
          
          <div class="total-records">Total Records: ${dataToShow.length}</div>
          
          <table class="data-table">
            <thead>
              <tr>
                ${(reportData.type === 'appointment' || reportData.type === 'Appointment') ? `
                  <th>Patient</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Treatment</th>
                  <th>Status</th>
                  <th>Notes</th>
                ` : (reportData.type === 'financial' || reportData.type === 'Financial') ? `
                  <th>Patient</th>
                  <th>Invoice #</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Payment</th>
                ` : (reportData.type === 'staff' || reportData.type === 'Staff') ? `
                  <th>Name</th>
                  <th>Role</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Hire Date</th>
                ` : (reportData.type === 'inventory' || reportData.type === 'Inventory') ? `
                  <th>Item</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Last Updated</th>
                ` : (reportData.type === 'feedback' || reportData.type === 'Feedback') ? `
                  <th>Patient</th>
                  <th>Rating</th>
                  <th>Comment</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Follow Up</th>
                ` : `
                  <th>Name</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>RegistrationDate</th>
                `}
              </tr>
            </thead>
            <tbody>
              ${dataToShow.map((item: any) => `
                <tr>
                  ${(reportData.type === 'appointment' || reportData.type === 'Appointment') ? `
                    <td class="left-align">${item.patientName || 'N/A'}</td>
                    <td class="center-align">${item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</td>
                    <td class="center-align">${item.time || 'N/A'}</td>
                    <td class="center-align">${item.type || 'General Checkup'}</td>
                    <td class="center-align">${item.status || 'N/A'}</td>
                    <td class="left-align">${item.notes || 'N/A'}</td>
                  ` : (reportData.type === 'financial' || reportData.type === 'Financial') ? `
                    <td class="left-align">${item.patientName || 'N/A'}</td>
                    <td class="center-align">${item.invoiceNumber || item.id || 'N/A'}</td>
                    <td class="center-align">${item.invoiceDate ? new Date(item.invoiceDate).toLocaleDateString() : 'N/A'}</td>
                    <td class="center-align">${item.total ? 'Rs. ' + item.total.toLocaleString() : 'N/A'}</td>
                    <td class="center-align">${item.status || 'N/A'}</td>
                    <td class="center-align">${item.paymentMethod || 'N/A'}</td>
                  ` : (reportData.type === 'staff' || reportData.type === 'Staff') ? `
                    <td class="left-align">${item.name || 'N/A'}</td>
                    <td class="center-align">${item.role || 'N/A'}</td>
                    <td class="left-align">${item.email || 'N/A'}</td>
                    <td class="center-align">${item.phone || 'N/A'}</td>
                    <td class="center-align">${item.status || 'N/A'}</td>
                    <td class="left-align">${item.hireDate ? new Date(item.hireDate).toLocaleDateString() : 'N/A'}</td>
                  ` : (reportData.type === 'inventory' || reportData.type === 'Inventory') ? `
                    <td class="left-align">${item.name || 'N/A'}</td>
                    <td class="center-align">${item.category || 'N/A'}</td>
                    <td class="center-align">${item.quantity || 'N/A'}</td>
                    <td class="center-align">${item.price ? 'Rs. ' + item.price.toLocaleString() : 'N/A'}</td>
                    <td class="center-align">${item.status || 'N/A'}</td>
                    <td class="left-align">${item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString() : 'N/A'}</td>
                  ` : (reportData.type === 'feedback' || reportData.type === 'Feedback') ? `
                    <td class="left-align">${item.patientName || 'N/A'}</td>
                    <td class="center-align">${item.rating || 'N/A'}</td>
                    <td class="left-align">${item.comment || 'N/A'}</td>
                    <td class="center-align">${item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</td>
                    <td class="center-align">${item.status || 'N/A'}</td>
                    <td class="center-align">${item.followUp ? 'Yes' : 'No'}</td>
                  ` : `
                    <td class="left-align">${item.name || 'N/A'}</td>
                    <td class="center-align">${item.age || 'N/A'}</td>
                    <td class="center-align">${item.gender || 'N/A'}</td>
                    <td class="center-align">${item.phone || 'N/A'}</td>
                    <td class="left-align">${item.email || 'N/A'}</td>
                    <td class="center-align">${item.status || 'N/A'}</td>
                    <td class="left-align">${item.registrationDate ? new Date(item.registrationDate).toLocaleDateString() : 'N/A'}</td>
                  `}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <script>
          function handlePrintAndTrack() {
            console.log('Print button clicked');
            // Track the report in Recent Reports
            if (window.opener) {
              window.opener.postMessage({
                type: 'ADD_TO_RECENT_REPORTS',
                reportData: {
                  id: '${reportData.id}',
                  name: '${reportData.name}',
                  type: '${reportData.type}',
                  date: '${reportData.date}',
                  size: '${reportData.size}',
                  format: 'list',
                  data: ${JSON.stringify(reportData.data)}
                }
              }, '*');
            }
            
            // Print the document
            console.log('Calling window.print()');
            window.print();
          }
          
          // Make sure the function is available globally
          window.handlePrintAndTrack = handlePrintAndTrack;
        </script>
      </body>
    </html>
    `
    
    const newWindow = window.open('', '_blank')
    if (newWindow) {
      newWindow.document.write(htmlContent)
      newWindow.document.close()
    }
  }

  const handleDownloadReport = (reportId: string, format: 'excel' | 'pdf') => {
    const report = generatedReports.find(r => r.id === reportId)
    if (!report) return

    const filename = `${report.name.replace(/\s+/g, '_')}_${report.date}`

    switch (format) {
      case 'excel':
        // For Excel, always use normal format regardless of report type
        const worksheet = XLSX.utils.json_to_sheet(report.data.patients || report.data.appointments || report.data.invoices || report.data.staff || report.data.inventory || report.data.feedback || [])
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Report')
        XLSX.writeFile(workbook, `${filename}.xlsx`)
        break

      case 'pdf':
        const pdf = new jsPDF()
        
        // Check if it's patient details format
        if (report.type === 'patient' && report.format === 'details') {
          // Generate patient details PDF with same design as patient details
          const patients = report.data.patients || []
          
          patients.forEach((patient: any, index: number) => {
            if (index > 0) pdf.addPage()
            
            // Header with clinic info
            pdf.setFontSize(16)
            pdf.setFont('helvetica', 'bold')
            pdf.text('PATIENT DETAILS REPORT', 20, 20)
            
            pdf.setFontSize(10)
            pdf.setFont('helvetica', 'normal')
            pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30)
            pdf.text(`Report ID: ${report.id}`, 20, 35)
            
            // Patient Information Card
            pdf.setFillColor(240, 248, 255)
            pdf.rect(20, 45, 170, 25, 'F')
            pdf.setFontSize(12)
            pdf.setFont('helvetica', 'bold')
            pdf.text('PATIENT INFORMATION', 25, 55)
            
            pdf.setFontSize(10)
            pdf.setFont('helvetica', 'normal')
            pdf.text(`Name: ${patient.name}`, 25, 65)
            pdf.text(`Age: ${patient.age}`, 100, 65)
            pdf.text(`Gender: ${patient.gender}`, 25, 70)
            pdf.text(`Phone: ${patient.phone}`, 100, 70)
            
            // Contact Information Card
            pdf.setFillColor(240, 248, 255)
            pdf.rect(20, 80, 170, 20, 'F')
            pdf.setFontSize(12)
            pdf.setFont('helvetica', 'bold')
            pdf.text('CONTACT INFORMATION', 25, 90)
            
            pdf.setFontSize(10)
            pdf.setFont('helvetica', 'normal')
            pdf.text(`Email: ${patient.email}`, 25, 100)
            pdf.text(`Address: ${patient.address}`, 25, 105)
            
            // Medical Information Card
            pdf.setFillColor(240, 248, 255)
            pdf.rect(20, 115, 170, 20, 'F')
            pdf.setFontSize(12)
            pdf.setFont('helvetica', 'bold')
            pdf.text('MEDICAL INFORMATION', 25, 125)
            
            pdf.setFontSize(10)
            pdf.setFont('helvetica', 'normal')
            pdf.text(`Medical History: ${patient.medicalHistory || 'None'}`, 25, 135)
            pdf.text(`Allergies: ${patient.allergies || 'None'}`, 25, 140)
            
            // Registration Information Card
            pdf.setFillColor(240, 248, 255)
            pdf.rect(20, 150, 170, 15, 'F')
            pdf.setFontSize(12)
            pdf.setFont('helvetica', 'bold')
            pdf.text('REGISTRATION INFORMATION', 25, 160)
            
            pdf.setFontSize(10)
            pdf.setFont('helvetica', 'normal')
            pdf.text(`Registration Date: ${new Date(patient.registrationDate).toLocaleDateString()}`, 25, 170)
            pdf.text(`Status: ${patient.status}`, 100, 170)
          })
        } else {
          // Regular report format with proper table design
          pdf.setFontSize(22)
          pdf.setFont('helvetica', 'bold')
          pdf.text('PATIENT LIST REPORT', 105, 25, { align: 'center' })
          
          pdf.setFontSize(12)
          pdf.setFont('helvetica', 'normal')
          pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 35, { align: 'center' })
          pdf.text(`Report ID: ${report.id}`, 105, 42, { align: 'center' })
          
          // Add separator line
          pdf.setDrawColor(200, 200, 200)
          pdf.line(20, 50, 190, 50)
          
          // Add total records count
          const totalRecords = report.data.totalPatients || report.data.totalAppointments || report.data.totalInvoices || report.data.totalStaff || report.data.totalItems || report.data.totalFeedback || 0
          pdf.setFontSize(14)
          pdf.setFont('helvetica', 'bold')
          pdf.text(`Total Records: ${totalRecords}`, 20, 65)

          // Add data table with proper formatting
          const data = report.data.patients || report.data.appointments || report.data.invoices || report.data.staff || report.data.inventory || report.data.feedback || []
          if (data.length > 0) {
            let y = 80
            const headers = Object.keys(data[0])
            const colWidth = 170 / headers.length
            
            // Add table headers with light background
            pdf.setFillColor(248, 249, 250)
            pdf.rect(20, y - 8, 170, 12, 'F')
            
            pdf.setFontSize(12)
            pdf.setFont('helvetica', 'bold')
            pdf.setTextColor(55, 65, 81) // Dark gray text
            headers.forEach((header, index) => {
              const x = 20 + (index * colWidth)
              pdf.text(header.charAt(0).toUpperCase() + header.slice(1), x + 2, y, { align: 'center' })
            })
            y += 15
            
            // Add data rows with alternating background
            data.slice(0, 20).forEach((row: any, rowIndex: number) => {
              // Alternate row background - lighter colors
              if (rowIndex % 2 === 0) {
                pdf.setFillColor(249, 250, 251)
                pdf.rect(20, y - 5, 170, 10, 'F')
              }
              
              // Add row data
              pdf.setFontSize(11)
              pdf.setFont('helvetica', 'normal')
              pdf.setTextColor(55, 65, 81) // Dark gray text for data
              headers.forEach((header, index) => {
                const x = 20 + (index * colWidth)
                const value = row[header] || ''
                let displayValue = String(value)
                
                // Truncate long values
                if (displayValue.length > 18) {
                  displayValue = displayValue.substring(0, 18) + '...'
                }
                
                // Center align certain columns
                const centerAlignColumns = ['age', 'gender', 'status', 'phone']
                const align = centerAlignColumns.includes(header.toLowerCase()) ? 'center' : 'left'
                
                pdf.text(displayValue, x + 2, y, { align })
              })
              y += 10
              
              // Add page break if needed
              if (y > 270) {
                pdf.addPage()
                y = 20
              }
            })
          }
        }
        
        pdf.save(`${filename}.pdf`)
        break
    }
  }

  const handlePrintReport = (reportId: string) => {
    const report = generatedReports.find(r => r.id === reportId)
    if (!report) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${report.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #2563eb; margin-bottom: 10px; }
            .info { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f8fafc; font-weight: bold; }
            .footer { margin-top: 30px; text-align: center; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${report.name}</h1>
            <p>Generated on: ${report.date}</p>
          </div>
          
          <div class="info">
            <p><strong>Total Records:</strong> ${report.data.totalPatients || report.data.totalAppointments || report.data.totalInvoices || report.data.totalStaff || report.data.totalItems || report.data.totalFeedback}</p>
            ${report.data.filter && report.data.filter !== 'all' ? `<p><strong>Filter:</strong> ${report.data.filter}</p>` : ''}
          </div>
          
          <table>
            <thead>
              <tr>
                ${Object.keys(report.data.patients?.[0] || report.data.appointments?.[0] || report.data.invoices?.[0] || report.data.staff?.[0] || report.data.inventory?.[0] || report.data.feedback?.[0] || {}).map(header => 
                  `<th>${header.charAt(0).toUpperCase() + header.slice(1)}</th>`
                ).join('')}
              </tr>
            </thead>
            <tbody>
              ${(report.data.patients || report.data.appointments || report.data.invoices || report.data.staff || report.data.inventory || report.data.feedback || []).map((row: any) => 
                `<tr>${Object.values(row).map((value: any) => `<td>${value || ''}</td>`).join('')}</tr>`
              ).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>This report was generated by Dental Care Pro</p>
          </div>
        </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.print()
  }

  // Show loading state
 

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Reports & Analytics</h1>
        <p className="text-gray-600">Generate comprehensive reports and analyze your clinic's performance</p>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8"
      >
        {reportTypes.map((report) => (
          <motion.div
            key={report.id}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-md border border-gray-200 p-5 hover:shadow-lg transition-shadow duration-200"
          >
            <div className={`p-3 rounded-lg ${report.bgColor} ${report.textColor} w-fit mb-3`}>
              <report.icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-1">
                {report.stats}
              </h3>
              <p className="text-gray-600 font-medium text-sm">
                {report.title}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Report Generation Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Generate Reports</h2>
        
        {/* Report Generation Form */}
        <div className="grid gap-4 mb-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-5">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report</label>
            <select
              value={selectedReport}
              onChange={(e) => {
                setSelectedReport(e.target.value)
                // Reset format and type when report type changes
                setReportFormat('pdf')
                setReportType('list')
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Report Type</option>
              <option value="patient">Patient</option>
              <option value="appointment">Appointment</option>
              <option value="financial">Financial</option>
              <option value="staff">Staff</option>
              <option value="inventory">Inventory</option>
              <option value="feedback">Feedback</option>
            </select>
          </div>

          {/* Report Format - Only show for patient and appointment reports */}
          {(selectedReport === 'patient' || selectedReport === 'appointment') && (
            <>
              {/* Report Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="details">Details</option>
                  <option value="list">List</option>
                </select>
              </div>

              {/* Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                <select
                  value={reportFormat}
                  onChange={(e) => setReportFormat(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="pdf">PDF</option>
                  <option value="csv">CSV</option>
                  <option value="excel">Excel</option>
                </select>
              </div>
            </>
          )}

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters[selectedReport as keyof typeof filters] || 'all'}
              onChange={(e) => setFilters(prev => ({ ...prev, [selectedReport]: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {selectedReport === 'patient' && (
                <>
                  <option value="all">All Patients</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </>
              )}
              {selectedReport === 'appointment' && (
                <>
                  <option value="all">All Appointments</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </>
              )}
              {selectedReport === 'financial' && (
                <>
                  <option value="all">All Invoices</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                </>
              )}
              {selectedReport === 'staff' && (
                <>
                  <option value="all">All Staff</option>
                  <option value="active">Working</option>
                  <option value="inactive">Inactive</option>
                </>
              )}
              {selectedReport === 'inventory' && (
                <>
                  <option value="all">All Items</option>
                  <option value="low-stock">Low Stock</option>
                  <option value="normal">Normal Stock</option>
                </>
              )}
              {selectedReport === 'feedback' && (
                <>
                  <option value="all">All Feedback</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                </>
              )}
              {!selectedReport && (
                <option value="all">Select Status</option>
              )}
            </select>
          </div>

          {/* Date Range */}
          <div>
            <div className="relative date-range-calendar">
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <button
                  onClick={() => setShowDateRangeCalendar(!showDateRangeCalendar)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left flex items-center justify-between"
                >
                  <span className={dateRange.start ? 'text-gray-900' : 'text-gray-500'}>
                    {dateRange.start && dateRange.end 
                      ? `${new Date(dateRange.start).toLocaleDateString()} - ${new Date(dateRange.end).toLocaleDateString()}`
                      : dateRange.start 
                        ? `${new Date(dateRange.start).toLocaleDateString()} - Select end date`
                        : 'Select date range'
                    }
                  </span>
                  <Calendar className="w-4 h-4 text-gray-400" />
                </button>
                
                {showDateRangeCalendar && (
                  <div className="absolute right-0 top-12 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 min-w-[320px]">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="font-medium text-gray-800">Select Date Range</h4>
                      <button
                        onClick={() => setShowDateRangeCalendar(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    </div>
                    
                    {dateRange.start && (
                      <div className="mb-3 p-2 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-700">
                          {dateRange.end 
                            ? `Range: ${new Date(dateRange.start).toLocaleDateString()} - ${new Date(dateRange.end).toLocaleDateString()}`
                            : `Start: ${new Date(dateRange.start).toLocaleDateString()} (click end date)`
                          }
                        </p>
                      </div>
                    )}
                    
                    <div>
                      {/* Month and Year Selection */}
                      <div className="flex items-center justify-center gap-4 mb-4">
                        <select
                          value={currentMonth}
                          onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value={0}>January</option>
                          <option value={1}>February</option>
                          <option value={2}>March</option>
                          <option value={3}>April</option>
                          <option value={4}>May</option>
                          <option value={5}>June</option>
                          <option value={6}>July</option>
                          <option value={7}>August</option>
                          <option value={8}>September</option>
                          <option value={9}>October</option>
                          <option value={10}>November</option>
                          <option value={11}>December</option>
                        </select>
                        
                        <select
                          value={currentYear}
                          onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>

                      {/* Custom Calendar Grid */}
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                            {day}
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-1">
                        {/* Empty cells for days before the first day of the month */}
                        {Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay() }).map((_, index) => (
                          <div key={`empty-${index}`} className="h-8"></div>
                        ))}
                        
                        {/* Days of the month */}
                        {Array.from({ length: new Date(currentYear, currentMonth + 1, 0).getDate() }, (_, i) => i + 1).map(day => {
                          const dayDate = new Date(currentYear, currentMonth, day)
                          const isInRange = isDateInRange(day)
                          const isSelected = isDateSelected(day)
                          const isToday = dayDate.toDateString() === new Date().toDateString()
                          
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => handleDateClick(day)}
                              className={`h-8 w-8 rounded-full text-sm font-medium transition-colors ${
                                isSelected
                                  ? 'bg-blue-600 text-white'
                                  : isInRange
                                    ? 'bg-blue-100 text-blue-600'
                                    : isToday
                                      ? 'bg-gray-200 text-gray-800'
                                      : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {day}
                            </button>
                          )
                        })}
                      </div>
                      
                      {dateRange.start && dateRange.end && (
                        <div className="mt-3 pt-3 border-t">
                          <button
                            onClick={() => {
                              setShowDateRangeCalendar(false)
                              // Apply date range filter here
                            }}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Apply Date Range
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => selectedReport && handleShowReport(selectedReport)}
            disabled={!selectedReport || isGenerating}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              !selectedReport || isGenerating
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isGenerating ? 'Generating...' : 'Show'}
          </button>
        </div>
      </motion.div>

      {/* Analytics Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
      >
        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-500" />
              Revenue Overview
            </h3>
            <div className="flex items-center gap-2 text-green-600">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-medium">+12.5%</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  stroke="#666"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#666"
                  fontSize={12}
                  tickFormatter={(value) => `Rs.${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: number) => [`Rs.${value.toLocaleString()}`, 'Revenue']}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="#3B82F6" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Patient Demographics */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Patient Demographics
            </h3>
            <div className="flex items-center gap-2 text-blue-600">
              <PieChart className="w-5 h-5" />
              <span className="text-sm font-medium">Distribution</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={demographicsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {demographicsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [value, 'Patients']}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Recent Reports */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 mt-8"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            Recent Reports
          </h3>
          <div className="relative calendar-dropdown">
            <button
              onClick={() => setShowCalendar(!showCalendar)}
              className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
              title="Filter by Date"
            >
              <Calendar className="w-5 h-5 text-blue-600" />
            </button>
            
            {showCalendar && (
              <div className="absolute right-0 top-12 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 min-w-[300px]">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-800">Select Date</h4>
                  <button
                    onClick={() => setShowCalendar(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
                
                {selectedDate && (
                  <div className="mb-3 p-2 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      Showing reports for: <span className="font-medium">{new Date(selectedDate).toLocaleDateString()}</span>
                    </p>
                  </div>
                )}
                
                <div className="space-y-2">
                  <button
                    onClick={clearDateFilter}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      !selectedDate 
                        ? 'bg-blue-100 text-blue-700 font-medium' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Today's Reports
                  </button>
                  
                  <div className="border-t pt-2">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => filterReportsByDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  {selectedDate && (
                    <button
                      onClick={clearDateFilter}
                      className="w-full text-center px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm transition-colors"
                    >
                      Clear Filter
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="space-y-3">
          {generatedReports.length > 0 ? (
            generatedReports.filter(report => report && report.data).map((report) => (
              <div 
                key={report.id} 
                onClick={() => handleReportClick(report)}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">{report.name}</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>Generated on {report.date}</span>
                      <span>•</span>
                      <span className="capitalize">{report.type} Report</span>
                      {report.format && (
                        <>
                          <span>•</span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            {report.format === 'details' ? 'Details Format' : 
                             report.format === 'list' ? 'List Format' : report.format}
                          </span>
                        </>
                      )}
                      {report.data && report.data.filter && report.data.filter !== 'all' && (
                        <>
                          <span>•</span>
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            {report.data.filter}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{report.size}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              {selectedDate ? (
                <>
                  <p className="text-gray-500">No reports found for this date</p>
                  <p className="text-sm text-gray-400">
                    No reports were generated on {new Date(selectedDate).toLocaleDateString()}
                  </p>
                  <button
                    onClick={clearDateFilter}
                    className="mt-3 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm transition-colors"
                  >
                    Show Today's Reports
                  </button>
                </>
              ) : (
                <>
                  <p className="text-gray-500">No reports generated yet</p>
                  <p className="text-sm text-gray-400">Generate your first report using the buttons above</p>
                </>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Report Details Modal */}
      {showReportModal && selectedReportDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">
                {selectedReportDetails.name} - Details
              </h2>
              <button
                onClick={handleCloseReportModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {selectedReportDetails.type === 'patient' && selectedReportDetails.data?.patients && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-blue-800 mb-2">Total Patients</h3>
                      <p className="text-2xl font-bold text-blue-600">{selectedReportDetails.data.totalPatients}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-green-800 mb-2">Active Patients</h3>
                      <p className="text-2xl font-bold text-green-600">{selectedReportDetails.data.active}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-800 mb-2">Inactive Patients</h3>
                      <p className="text-2xl font-bold text-gray-600">{selectedReportDetails.data.inactive}</p>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <h3 className="bg-gray-50 px-4 py-3 font-semibold text-gray-800 border-b border-gray-200">
                      Patient Details
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration Date</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedReportDetails.data.patients.map((patient: any, index: number) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {patient.name || 'N/A'}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                {patient.age || 'N/A'}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                {patient.phone || 'N/A'}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  patient.status === 'active' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {patient.status || 'N/A'}
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                {patient.registrationDate ? new Date(patient.registrationDate).toLocaleDateString() : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {selectedReportDetails.type === 'appointment' && selectedReportDetails.data?.appointments && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-blue-800 mb-2">Total Appointments</h3>
                      <p className="text-2xl font-bold text-blue-600">{selectedReportDetails.data.totalAppointments}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-purple-800 mb-2">Scheduled</h3>
                      <p className="text-2xl font-bold text-purple-600">{selectedReportDetails.data.scheduled || 0}</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-yellow-800 mb-2">Confirmed</h3>
                      <p className="text-2xl font-bold text-yellow-600">{selectedReportDetails.data.confirmed}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-green-800 mb-2">Completed</h3>
                      <p className="text-2xl font-bold text-green-600">{selectedReportDetails.data.completed}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-red-800 mb-2">Cancelled</h3>
                      <p className="text-2xl font-bold text-red-600">{selectedReportDetails.data.cancelled}</p>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <h3 className="bg-gray-50 px-4 py-3 font-semibold text-gray-800 border-b border-gray-200">
                      Appointment Details
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Treatment</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedReportDetails.data.appointments.map((appointment: any, index: number) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {appointment.patientName || 'N/A'}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                {appointment.date ? new Date(appointment.date).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                {appointment.time || 'N/A'}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                {appointment.type || 'General Checkup'}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  appointment.status === 'scheduled' || 
                                  appointment.status === 'Scheduled' ||
                                  appointment.status === 'pending' || 
                                  appointment.status === 'Pending' ||
                                  appointment.status === 'upcoming' || 
                                  appointment.status === 'Upcoming' ||
                                  appointment.status === 'new' ||
                                  appointment.status === 'New' ||
                                  appointment.status === 'booked' ||
                                  appointment.status === 'Booked'
                                    ? 'bg-purple-100 text-purple-800'
                                    : appointment.status === 'confirmed' || appointment.status === 'Confirmed'
                                    ? 'bg-blue-100 text-blue-800'
                                    : appointment.status === 'completed' || appointment.status === 'Completed'
                                    ? 'bg-green-100 text-green-800'
                                    : appointment.status === 'cancelled' || appointment.status === 'Cancelled'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {appointment.status === 'pending' || 
                                   appointment.status === 'Pending' ||
                                   appointment.status === 'upcoming' || 
                                   appointment.status === 'Upcoming' ||
                                   appointment.status === 'new' ||
                                   appointment.status === 'New' ||
                                   appointment.status === 'booked' ||
                                   appointment.status === 'Booked' 
                                    ? 'Scheduled' 
                                    : appointment.status || 'N/A'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Add similar sections for other report types (financial, staff, inventory, feedback) */}
              {selectedReportDetails.type !== 'patient' && selectedReportDetails.type !== 'appointment' && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Detailed view for {selectedReportDetails.type} reports coming soon...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


export default function Reports() {
  return (
    <ErrorBoundary>
      <ReportsComponent />
    </ErrorBoundary>
  )
}
