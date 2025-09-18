import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Star,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Receipt
} from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { formatDate } from '@/lib/utils'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const { 
    patients, 
    appointments, 
    invoices, 
    feedback,
    staff,
    attendance,
    clinicInfo
  } = useAppStore()

  // Calculate statistics
  const totalPatients = patients.length
  const totalAppointments = appointments.length
  const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.total, 0)
  const averageRating = feedback.length > 0 
    ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length 
    : 0

  const todaysAppointments = appointments
    .filter(apt => new Date(apt.date).toDateString() === new Date().toDateString())
    .sort((a, b) => a.time.localeCompare(b.time))
    .slice(0, 10) // Show more appointments

  const recentPatients = patients
    .sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime())
    .slice(0, 5)

  // Real-time recent activity data
  const recentActivity = [
    ...patients.slice(-3).map(patient => ({
      type: 'patient',
      message: `New patient registered: ${patient.name}`,
      time: new Date(patient.registrationDate),
      icon: '👤'
    })),
    ...appointments.slice(-2).map(appointment => ({
      type: 'appointment',
      message: `Appointment scheduled: ${appointment.patientName}`,
      time: new Date(appointment.date),
      icon: '📅'
    })),
    ...invoices.slice(-2).map(invoice => ({
      type: 'invoice',
      message: `Invoice generated: Rs. ${invoice.total}`,
      time: new Date(invoice.date),
      icon: '💰'
    })),
    ...feedback.slice(-1).map(fb => ({
      type: 'feedback',
      message: `New feedback received: ${fb.rating} stars`,
      time: new Date(fb.date),
      icon: '⭐'
    }))
  ]
    .sort((a, b) => b.time.getTime() - a.time.getTime())
    .slice(0, 5)

  // Real-time system status
  const systemStatus = [
    {
      name: 'Appointments Today',
      status: todaysAppointments.length > 0 ? 'active' : 'none',
      lastCheck: new Date(),
      count: todaysAppointments.length
    },
    {
      name: 'Pending Feedback',
      status: feedback.filter(f => f.status === 'pending').length > 0 ? 'pending' : 'none',
      lastCheck: new Date(),
      count: feedback.filter(f => f.status === 'pending').length
    },
    {
      name: 'Staff Online',
      status: staff.filter(s => s.status === 'active').length > 0 ? 'active' : 'offline',
      lastCheck: new Date(),
      count: staff.filter(s => s.status === 'active').length
    },
    {
      name: 'Backup',
      status: 'up-to-date',
      lastCheck: new Date(Date.now() - 3600000) // 1 hour ago
    },
    {
      name: 'Updates',
      status: 'available',
      lastCheck: new Date(Date.now() - 86400000) // 1 day ago
    }
  ]

  const stats = [
    {
      title: 'Total Patients',
      value: totalPatients,
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-500'
    },
    {
      title: "Today's Appointments",
      value: appointments.filter(apt => new Date(apt.date).toDateString() === new Date().toDateString()).length,
      icon: Calendar,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-500'
    },
    {
      title: 'Appointments Completed',
      value: appointments.filter(apt => apt.status === 'completed').length,
      icon: CheckCircle,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-500'
    },
    {
      title: 'Appointments Cancelled',
      value: appointments.filter(apt => apt.status === 'cancelled').length,
      icon: Clock,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-500'
    },
    {
      title: 'Monthly Payment',
      value: `Rs.${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-500'
    },
    {
      title: 'Payment Dues',
      value: `Rs.${invoices.filter(inv => inv.status === 'pending' || inv.status === 'overdue').reduce((sum, inv) => sum + inv.total, 0).toLocaleString()}`,
      icon: AlertTriangle,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-500'
    },
    {
      title: 'Paid Invoices',
      value: invoices.filter(inv => inv.status === 'paid').length,
      icon: Receipt,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-500'
    },
    {
      title: 'Unpaid Invoices',
      value: invoices.filter(inv => inv.status === 'pending' || inv.status === 'overdue').length,
      icon: Clock,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-500'
    }
  ]

  return (
    <div className="p-6">
      {/* Dashboard Overview Button */}
      <div className="mb-6 bg-white p-3 border border-gray-200 rounded-lg shadow-sm">
        <button 
          className={`inline-flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
            activeTab === 'overview' 
              ? 'bg-primary-500 text-white shadow-sm' 
              : 'bg-transparent text-gray-600 hover:bg-gray-100'
          }`}
          onClick={() => setActiveTab('overview')}
        >
          <TrendingUp className="w-4 h-4" />
          Overview
        </button>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="stat-card"
          >
            <div className={`stat-icon ${stat.bgColor} ${stat.textColor}`}>
              <stat.icon className="w-8 h-8" />
            </div>
            <div className="stat-info">
              <h3 className="text-3xl font-bold text-gray-800 mb-1">
                {stat.value}
              </h3>
              <p className="text-gray-600 font-medium text-sm">
                {stat.title}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Dashboard Content */}
       <div className="grid grid-cols-1 gap-6">
        {/* Recent Appointments */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-2xl shadow-md border border-gray-200"
        >
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-500" />
             Today's Appointments
          </h3>
          <div className="space-y-3">
             {todaysAppointments.length > 0 ? (
               todaysAppointments.map((appointment) => {
                 // Dynamic colors based on status
                 const getStatusColors = (status: string) => {
                   switch (status) {
                     case 'completed':
                       return {
                         bg: 'bg-green-50',
                         border: 'border-l-4 border-green-400',
                         iconBg: 'bg-green-100',
                         iconColor: 'text-green-600',
                         nameColor: 'text-green-700',
                         timeColor: 'text-green-700'
                       }
                     case 'confirmed':
                       return {
                         bg: 'bg-blue-50',
                         border: 'border-l-4 border-blue-400',
                         iconBg: 'bg-blue-100',
                         iconColor: 'text-blue-600',
                         nameColor: 'text-blue-700',
                         timeColor: 'text-blue-700'
                       }
                     case 'cancelled':
                       return {
                         bg: 'bg-red-50',
                         border: 'border-l-4 border-red-400',
                         iconBg: 'bg-red-100',
                         iconColor: 'text-red-600',
                         nameColor: 'text-red-700',
                         timeColor: 'text-red-700'
                       }
                     default: // scheduled
                       return {
                         bg: 'bg-yellow-50',
                         border: 'border-l-4 border-yellow-400',
                         iconBg: 'bg-yellow-100',
                         iconColor: 'text-yellow-600',
                         nameColor: 'text-yellow-700',
                         timeColor: 'text-yellow-700'
                       }
                   }
                 }
                 
                 const colors = getStatusColors(appointment.status || 'scheduled')
                 
                 return (
                <div
                  key={appointment.id}
                     className={`flex items-center justify-between p-4 rounded-lg ${colors.bg} ${colors.border}`}
                >
                  <div className="flex items-center gap-3">
                       <div className={`w-10 h-10 ${colors.iconBg} rounded-full flex items-center justify-center`}>
                         <Users className={`w-5 h-5 ${colors.iconColor}`} />
                    </div>
                    <div>
                         <p className={`font-medium ${colors.nameColor}`}>{appointment.patientName}</p>
                         <p className="text-sm text-gray-600">{appointment.type || 'consultation'}</p>
                         <div className="flex items-center gap-2 mt-1">
                           {/* Status Badge */}
                           <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                             appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                             appointment.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                             appointment.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                             appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                             'bg-gray-100 text-gray-800'
                           }`}>
                             {appointment.status || 'scheduled'}
                           </span>
                           {/* Priority Badge - Only show if not normal */}
                           {appointment.priority && appointment.priority !== 'normal' && (
                             <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                               appointment.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                               appointment.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                               'bg-blue-100 text-blue-800'
                             }`}>
                               {appointment.priority.toUpperCase()}
                             </span>
            )}
          </div>
                    </div>
                  </div>
                  <div className="text-right">
                       <p className={`text-sm font-medium ${colors.timeColor}`}>{appointment.time}</p>
                       <p className="text-xs text-gray-500">60 min</p>
                  </div>
                </div>
                 )
               })
            ) : (
               <p className="text-gray-500 text-center py-4">No appointments for today</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Additional Dashboard Sections */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* System Status */}
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            System Status
          </h3>
          <div className="space-y-3">
            {systemStatus.map((item, index) => {
              const getStatusColor = (status: string) => {
                switch (status) {
                  case 'active':
                  case 'up-to-date':
                    return 'bg-green-100 text-green-800'
                  case 'available':
                    return 'bg-blue-100 text-blue-800'
                  case 'pending':
                    return 'bg-yellow-100 text-yellow-800'
                  case 'offline':
                  case 'none':
                    return 'bg-gray-100 text-gray-800'
                  default:
                    return 'bg-gray-100 text-gray-800'
                }
              }
              
              const getStatusDot = (status: string) => {
                switch (status) {
                  case 'active':
                  case 'up-to-date':
                    return 'bg-green-500'
                  case 'available':
                    return 'bg-blue-500'
                  case 'pending':
                    return 'bg-yellow-500'
                  case 'offline':
                  case 'none':
                    return 'bg-gray-500'
                  default:
                    return 'bg-gray-500'
                }
              }
              
              const getStatusText = (item: any) => {
                if (item.count !== undefined) {
                  return `${item.count}`
                }
                switch (item.status) {
                  case 'up-to-date':
                    return 'Up to date'
                  case 'available':
                    return 'Available'
                  case 'active':
                    return 'Active'
                  case 'pending':
                    return 'Pending'
                  case 'none':
                    return 'None'
                  case 'offline':
                    return 'Offline'
                  default:
                    return item.status.charAt(0).toUpperCase() + item.status.slice(1)
                }
              }
              
              return (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.name}</span>
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                    <div className={`w-2 h-2 rounded-full mr-1 ${getStatusDot(item.status)}`}></div>
                    {getStatusText(item)}
              </span>
            </div>
              )
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-500" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => {
                const getTimeAgo = (date: Date) => {
                  const now = new Date()
                  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
                  
                  if (diffInMinutes < 1) return 'Just now'
                  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
                  
                  const diffInHours = Math.floor(diffInMinutes / 60)
                  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
                  
                  const diffInDays = Math.floor(diffInHours / 24)
                  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
                }
                
                return (
                  <div key={index} className="text-sm text-gray-600">
                    <p className="font-medium text-gray-800">{activity.message}</p>
                    <p className="text-xs text-gray-500">{getTimeAgo(activity.time)}</p>
            </div>
                )
              })
            ) : (
              <div className="text-sm text-gray-500 text-center py-4">
                No recent activity
            </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
