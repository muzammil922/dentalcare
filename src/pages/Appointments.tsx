import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Plus,
  Edit,
  Trash2,
  Download,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { formatDate, formatTime } from '@/lib/utils'
import AppointmentForm from '@/components/AppointmentForm'
import { Appointment } from '@/stores/useAppStore'

export default function Appointments() {
  const [activeTab, setActiveTab] = useState('calendar')
  const [showAppointmentForm, setShowAppointmentForm] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [currentFilter, setCurrentFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentDate, setCurrentDate] = useState(new Date())
  
  const { 
    appointments, 
    patients,
    addAppointment, 
    updateAppointment, 
    deleteAppointment 
  } = useAppStore()

  const tabs = [
    { id: 'calendar', label: 'Calendar View', icon: Calendar },
    { id: 'list', label: 'List View', icon: Clock },
    { id: 'upcoming', label: 'Upcoming', icon: User }
  ]

  const filters = [
    { value: 'all', label: 'All Appointments' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ]

  // Filter appointments based on current filter and search
  const filteredAppointments = appointments.filter(appointment => {
    const matchesFilter = currentFilter === 'all' || appointment.status === currentFilter
    const matchesSearch = searchTerm === '' || 
      appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.treatment.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  // Get appointments for current month
  const getAppointmentsForMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date)
      return appointmentDate.getFullYear() === year && appointmentDate.getMonth() === month
    })
  }

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    const currentDateObj = new Date(startDate)
    
    while (currentDateObj <= lastDay || days.length < 42) {
      days.push(new Date(currentDateObj))
      currentDateObj.setDate(currentDateObj.getDate() + 1)
    }
    
    return days
  }

  const calendarDays = generateCalendarDays()
  const monthAppointments = getAppointmentsForMonth()

  const handleSaveAppointment = (appointmentData: Omit<Appointment, 'id'>) => {
    if (editingAppointment) {
      updateAppointment(editingAppointment.id, appointmentData)
      setEditingAppointment(null)
    } else {
      addAppointment({
        ...appointmentData,
        id: Math.random().toString(36).substr(2, 9)
      })
    }
    setShowAppointmentForm(false)
  }

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment)
    setShowAppointmentForm(true)
  }

  const handleDeleteAppointment = (appointmentId: string) => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      deleteAppointment(appointmentId)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const getAppointmentsForDay = (date: Date) => {
    return monthAppointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date)
      return appointmentDate.toDateString() === date.toDateString()
    })
  }

  return (
    <div className="p-6">
      {/* Appointments Header */}
      <div className="mb-6 p-6 bg-white border border-gray-200 rounded-2xl shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Appointments</h2>
            <p className="text-gray-600">Manage patient appointments and scheduling</p>
          </div>
          <button
            onClick={() => setShowAppointmentForm(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Appointment
          </button>
        </div>
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
                placeholder="Search appointments..."
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
      {activeTab === 'calendar' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-md">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-800">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-600 bg-gray-50 rounded">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {calendarDays.map((date, index) => {
              const dayAppointments = getAppointmentsForDay(date)
              const isCurrentMonth = date.getMonth() === currentDate.getMonth()
              const isToday = date.toDateString() === new Date().toDateString()

              return (
                <div
                  key={index}
                  className={`min-h-[120px] p-2 border border-gray-200 ${
                    isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                  } ${isToday ? 'ring-2 ring-primary-500' : ''}`}
                >
                  <div className={`text-sm font-medium mb-2 ${
                    isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  } ${isToday ? 'text-primary-600' : ''}`}>
                    {date.getDate()}
                  </div>
                  
                  {/* Appointments for this day */}
                  <div className="space-y-1">
                    {dayAppointments.slice(0, 3).map((appointment) => (
                      <div
                        key={appointment.id}
                        className="text-xs p-1 bg-primary-100 text-primary-800 rounded cursor-pointer hover:bg-primary-200 transition-colors"
                        onClick={() => handleEditAppointment(appointment)}
                        title={`${appointment.patientName} - ${appointment.treatment}`}
                      >
                        <div className="font-medium truncate">{appointment.patientName}</div>
                        <div className="text-primary-600 truncate">{appointment.treatment}</div>
                      </div>
                    ))}
                    {dayAppointments.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayAppointments.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {activeTab === 'list' && (
        <div className="space-y-4">
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map((appointment, index) => (
              <motion.div
                key={appointment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-6 h-6 text-primary-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-1">
                        {appointment.patientName}
                      </h3>
                      <p className="text-gray-600 mb-2">{appointment.treatment}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(appointment.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTime(appointment.time)}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {appointment.doctor}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(appointment.priority)}`}>
                        {appointment.priority}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditAppointment(appointment)}
                        className="action-btn edit-btn"
                        title="Edit Appointment"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAppointment(appointment.id)}
                        className="action-btn delete-btn"
                        title="Delete Appointment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {appointment.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">{appointment.notes}</p>
                  </div>
                )}
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-medium mb-2">No appointments found</h3>
              <p>Create your first appointment to get started</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'upcoming' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Upcoming Appointments</h3>
          <div className="space-y-3">
            {filteredAppointments
              .filter(appointment => new Date(appointment.date) > new Date())
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .slice(0, 10)
              .map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => handleEditAppointment(appointment)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-primary-500" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">{appointment.patientName}</div>
                      <div className="text-sm text-gray-600">{appointment.treatment}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-800">
                      {formatDate(appointment.date)}
                    </div>
                    <div className="text-xs text-gray-500">{formatTime(appointment.time)}</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Appointment Form Modal */}
      {showAppointmentForm && (
        <AppointmentForm
          appointment={editingAppointment}
          onSave={handleSaveAppointment}
          onClose={() => {
            setShowAppointmentForm(false)
            setEditingAppointment(null)
          }}
        />
      )}
    </div>
  )
}
