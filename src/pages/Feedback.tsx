import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  Star, 
  BarChart3, 
  TrendingUp, 
  Users,
  Plus,
  Edit,
  Trash2,
  Download,
  Filter,
  ChevronDown,
  Eye
} from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { formatDate } from '@/lib/utils'
import FeedbackForm from '@/components/FeedbackForm'
import { Feedback as FeedbackType } from '@/stores/useAppStore'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from 'recharts'

export default function Feedback() {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [editingFeedback, setEditingFeedback] = useState<FeedbackType | null>(null)
  const [viewingFeedback, setViewingFeedback] = useState<FeedbackType | null>(null)
  const [showFeedbackDetails, setShowFeedbackDetails] = useState(false)
  const [currentFilter, setCurrentFilter] = useState('all')
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [feedbackPerPage, setFeedbackPerPage] = useState(10)
  const [currentFeedbackPage, setCurrentFeedbackPage] = useState(1)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [feedbackToDelete, setFeedbackToDelete] = useState<FeedbackType | null>(null)
  const filterDropdownRef = useRef<HTMLDivElement>(null)
  
  const { 
    feedback, 
    clinicInfo,
    addFeedback, 
    updateFeedback, 
    deleteFeedback
  } = useAppStore()

  // Filter feedback based on current filter
  const filteredFeedback = feedback.filter(f => 
    currentFilter === 'all' || f.status === currentFilter
  )

  // Pagination calculations
  const totalFeedbackPages = Math.ceil(filteredFeedback.length / feedbackPerPage)
  const startIndex = (currentFeedbackPage - 1) * feedbackPerPage
  const endIndex = startIndex + feedbackPerPage
  const paginatedFeedback = filteredFeedback.slice(startIndex, endIndex)

  // Reset to first page when filter changes
  React.useEffect(() => {
    setCurrentFeedbackPage(1)
  }, [currentFilter, feedbackPerPage])

  const filters = [
    { value: 'all', label: 'All Feedback' },
    { value: 'pending', label: 'Pending' },
    { value: 'reviewed', label: 'Reviewed' },
    { value: 'resolved', label: 'Resolved' }
  ]

  // Handle click outside to close dropdown
  const handleClickOutside = (event: MouseEvent) => {
    if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
      setShowFilterDropdown(false)
    }
  }

  // Add event listener for click outside
  React.useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Calculate statistics
  const totalFeedback = feedback.length
  const averageRating = feedback.length > 0 
    ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length 
    : 0
  
  const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
    rating,
    count: feedback.filter(f => f.rating === rating).length,
    percentage: feedback.length > 0 
      ? (feedback.filter(f => f.rating === rating).length / feedback.length) * 100 
      : 0
  }))

  const statusDistribution = [
    { status: 'pending', name: 'Pending', count: feedback.filter(f => f.status === 'pending').length },
    { status: 'reviewed', name: 'Reviewed', count: feedback.filter(f => f.status === 'reviewed').length },
    { status: 'resolved', name: 'Resolved', count: feedback.filter(f => f.status === 'resolved').length }
  ]

  // Monthly trend data
  const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const monthName = date.toLocaleDateString('en-US', { month: 'short' })
    const monthFeedback = feedback.filter(f => {
      const feedbackDate = new Date(f.date)
      return feedbackDate.getMonth() === date.getMonth() && 
             feedbackDate.getFullYear() === date.getFullYear()
    })
    return {
      month: monthName,
      count: monthFeedback.length,
      averageRating: monthFeedback.length > 0 
        ? monthFeedback.reduce((sum, f) => sum + f.rating, 0) / monthFeedback.length 
        : 0
    }
  }).reverse()

  const handleSaveFeedback = (feedbackData: Omit<FeedbackType, 'id'>) => {
    if (editingFeedback) {
      updateFeedback(editingFeedback.id, feedbackData)
      setEditingFeedback(null)
    } else {
      addFeedback({
        ...feedbackData,
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString()
      })
    }
    setShowFeedbackForm(false)
  }

  const handleEditFeedback = (feedbackItem: FeedbackType) => {
    setEditingFeedback(feedbackItem)
    setShowFeedbackForm(true)
  }

  const handleViewFeedback = (feedbackItem: FeedbackType) => {
    setViewingFeedback(feedbackItem)
    setShowFeedbackDetails(true)
  }

  const handleDeleteFeedback = (feedbackId: string) => {
    const feedbackItem = feedback.find(f => f.id === feedbackId)
    if (feedbackItem) {
      setFeedbackToDelete(feedbackItem)
      setShowDeleteConfirm(true)
    }
  }

  const confirmDelete = () => {
    if (feedbackToDelete) {
      deleteFeedback(feedbackToDelete.id)
      setShowDeleteConfirm(false)
      setFeedbackToDelete(null)
    }
  }

  const cancelDelete = () => {
    setShowDeleteConfirm(false)
    setFeedbackToDelete(null)
  }

  const handleExportFeedback = () => {
    // Generate PDF content
    const generateFeedbackPDF = () => {
      const currentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
      
      const averageRating = filteredFeedback.length > 0 
        ? (filteredFeedback.reduce((sum, f) => sum + f.rating, 0) / filteredFeedback.length).toFixed(1)
        : '0.0'

      const statusCounts = {
        pending: filteredFeedback.filter(f => f.status === 'pending').length,
        reviewed: filteredFeedback.filter(f => f.status === 'reviewed').length,
        resolved: filteredFeedback.filter(f => f.status === 'resolved').length
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Feedback Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #3b82f6;
              padding-bottom: 20px;
            }
            .clinic-header { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-bottom: 1rem; }
            .clinic-logo { width: 60px; height: 60px; object-fit: contain; }
            .clinic-icon { font-size: 3rem; }
            .header h1 {
              color: #3b82f6;
              margin: 0;
              font-size: 28px;
            }
            .header h2 {
              color: #3b82f6;
              margin: 0;
              font-size: 20px;
              font-weight: 600;
            }
            .header p {
              margin: 5px 0 0 0;
              color: #666;
            }
            .stats {
              display: flex;
              justify-content: space-around;
              margin-bottom: 30px;
              background: #f8fafc;
              padding: 20px;
              border-radius: 8px;
            }
            .stat-item {
              text-align: center;
            }
            .stat-value {
              font-size: 24px;
              font-weight: bold;
              color: #3b82f6;
            }
            .stat-label {
              color: #666;
              font-size: 14px;
            }
            .feedback-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            .feedback-table th,
            .feedback-table td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
            }
            .feedback-table th {
              background-color: #3b82f6;
              color: white;
              font-weight: bold;
            }
            .feedback-table tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .rating {
              color: #fbbf24;
              font-weight: bold;
            }
            .status {
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: bold;
            }
            .status.pending {
              background-color: #fef3c7;
              color: #92400e;
            }
            .status.reviewed {
              background-color: #dbeafe;
              color: #1e40af;
            }
            .status.resolved {
              background-color: #d1fae5;
              color: #065f46;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
            .footer-content { max-width: 100%; margin: 0 auto; }
            .footer-content h3 { margin: 0 0 1rem 0; color: #2563eb; font-size: 1.25rem; font-weight: bold; }
            .footer-details { margin-bottom: 1rem; line-height: 1.6; }
            .footer-details p { margin: 0.25rem 0; color: #374151; font-size: 0.875rem; }
            .footer-bottom { border-top: 1px solid #d1d5db; padding-top: 1rem; margin-top: 1rem; }
            .footer-bottom p { margin: 0.25rem 0; color: #64748b; font-size: 0.8rem; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="clinic-header">
                ${clinicInfo.logo ? `<img src="${clinicInfo.logo}" alt="Clinic Logo" class="clinic-logo" />` : ''}
                ${clinicInfo.name ? `<h1>${clinicInfo.name}</h1>` : ''}
            </div>
            <h2>Patient Feedback Report</h2>
          </div>

          <div class="stats">
            <div class="stat-item">
              <div class="stat-value">${filteredFeedback.length}</div>
              <div class="stat-label">Total Feedback</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${averageRating}/5</div>
              <div class="stat-label">Average Rating</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${statusCounts.resolved}</div>
              <div class="stat-label">Resolved</div>
            </div>
          </div>

          <table class="feedback-table">
            <thead>
              <tr>
                <th>Patient Name</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${filteredFeedback.map(feedback => `
                <tr>
                  <td>${feedback.patientName}</td>
                  <td class="rating">${feedback.rating}/5</td>
                  <td>${feedback.comment || 'No comment'}</td>
                  <td><span class="status ${feedback.status}">${feedback.status}</span></td>
                  <td>${formatDate(feedback.date)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <div class="footer-content">
              <h3>${clinicInfo.name}</h3>
              <div class="footer-details">
                <p><strong>Address:</strong> ${clinicInfo.address}</p>
                <p><strong>Phone:</strong> ${clinicInfo.phone} | <strong>Email:</strong> ${clinicInfo.email}</p>
                <p><strong>Website:</strong> ${clinicInfo.website} | <strong>Hours:</strong> ${clinicInfo.hours}</p>
              </div>
              <div class="footer-bottom">
                <p>This report was generated from the ${clinicInfo.name} system</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `

      return htmlContent
    }

    // Create and download PDF
    const htmlContent = generateFeedbackPDF()
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `feedback-report-${new Date().toISOString().split('T')[0]}.html`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return '#10b981' // Green
    if (rating >= 3) return '#fbbf24' // Yellow
    return '#ef4444' // Red
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  return (
    <div className="p-6">
      {/* Feedback Header */}
      <div className="mb-6 p-6 bg-white border border-gray-200 rounded-2xl shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Patient Feedback</h2>
            <p className="text-gray-600">Track patient satisfaction and improve your services</p>
          </div>
          <button
            onClick={() => setShowFeedbackForm(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Feedback
          </button>
        </div>
      </div>

      {/* Feedback Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="stat-card"
        >
          <div className="stat-icon bg-blue-100 text-blue-500">
            <Star className="w-8 h-8" />
          </div>
          <div className="stat-info">
            <h3 className="text-3xl font-bold text-gray-800 mb-1">
              {averageRating.toFixed(1)}
            </h3>
            <p className="text-gray-600 font-medium text-sm">Average Rating</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="stat-card"
        >
          <div className="stat-icon bg-green-100 text-green-500">
            <Users className="w-8 h-8" />
          </div>
          <div className="stat-info">
            <h3 className="text-3xl font-bold text-gray-800 mb-1">
              {totalFeedback}
            </h3>
            <p className="text-gray-600 font-medium text-sm">Total Feedback</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="stat-card"
        >
          <div className="stat-icon bg-purple-100 text-purple-500">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div className="stat-info">
            <h3 className="text-3xl font-bold text-gray-800 mb-1">
              {feedback.filter(f => f.status === 'resolved').length}
            </h3>
            <p className="text-gray-600 font-medium text-sm">Resolved Issues</p>
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Rating Distribution Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 border border-gray-200 rounded-xl shadow-md"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Rating Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ratingDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="rating" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Status Distribution Pie Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-6 border border-gray-200 rounded-xl shadow-md"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={false}
                outerRadius={80}
                innerRadius={20}
                fill="#8884d8"
                dataKey="count"
                nameKey="name"
              >
                {statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [`${value} feedback`, name]}
                labelFormatter={(label) => `Status: ${label}`}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Monthly Trend Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white p-6 border border-gray-200 rounded-xl shadow-md mb-8"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Feedback Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Line yAxisId="left" type="monotone" dataKey="count" stroke="#3b82f6" name="Feedback Count" />
            <Line yAxisId="right" type="monotone" dataKey="averageRating" stroke="#10b981" name="Average Rating" />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Filters and Search */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-md">
        <div className="flex gap-4 items-center justify-between flex-wrap">
          {/* Feedback Filter Dropdown */}
          <div className="flex items-center gap-2">
            <div className="relative" ref={filterDropdownRef}>
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white border border-blue-600 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Filter className="w-4 h-4" />
                {filters.find(f => f.value === currentFilter)?.label || 'All Feedback'}
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {/* Dropdown Menu */}
              {showFilterDropdown && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  {filters.map((filter) => (
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

          {/* Actions */}
          <div className="flex gap-3 items-center ml-auto">
            <button 
              onClick={handleExportFeedback}
              className="flex items-center justify-center w-10 h-10 bg-primary-500 rounded-lg text-white hover:bg-primary-600 transition-colors"
              title="Export Feedback Report"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Table */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        {paginatedFeedback.length > 0 ? (
          <>
            {/* Table Header with Counts */}
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="text-gray-700 font-semibold text-base">
                  Total Items: <span className="text-blue-600 text-medium font-semibold">{filteredFeedback.length}</span>
                </div>
                <div className="text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredFeedback.length)} of {filteredFeedback.length} feedback entries
                </div>
              </div>
            </div>
            <div className="px-6 py-2">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-blue-600 uppercase tracking-wider">
                      Patient Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-blue-600 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-blue-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-blue-600 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-blue-600 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-blue-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-blue-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedFeedback.map((feedbackItem, index) => (
                    <motion.tr
              key={feedbackItem.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors duration-200"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0 mr-3">
                            <Star className="w-5 h-5 text-primary-500" />
                  </div>
                          <div className="text-sm font-medium text-gray-900">
                      {feedbackItem.patientName}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex items-center gap-1 mr-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                                className={`w-4 h-4 ${
                            star <= feedbackItem.rating 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                          </div>
                          <span className="text-sm text-gray-600">
                        {feedbackItem.rating}/5
                      </span>
                    </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        feedbackItem.status === 'resolved' 
                          ? 'bg-green-100 text-green-800' 
                          : feedbackItem.status === 'reviewed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {feedbackItem.status}
                      </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                        {feedbackItem.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          feedbackItem.priority === 'high' 
                            ? 'bg-red-100 text-red-800' 
                            : feedbackItem.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {feedbackItem.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(feedbackItem.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewFeedback(feedbackItem)}
                            className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 hover:bg-blue-200 transition-colors"
                            title="View Feedback Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                  <button
                    onClick={() => handleEditFeedback(feedbackItem)}
                            className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 hover:bg-blue-200 transition-colors"
                    title="Edit Feedback"
                  >
                    <i className="fas fa-edit text-sm"></i>
                  </button>
                  <button
                    onClick={() => handleDeleteFeedback(feedbackItem.id)}
                            className="w-8 h-8 border border-red-200 rounded-lg flex items-center justify-center text-red-600 hover:bg-red-200 transition-colors"
                    title="Delete Feedback"
                  >
                    <i className="fas fa-trash text-sm"></i>
                  </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            </div>

            {/* Pagination Navigation */}
            <div className="bg-white px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Show</span>
                  <select
                    value={feedbackPerPage}
                    onChange={(e) => setFeedbackPerPage(Number(e.target.value))}
                    className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <span className="text-sm text-gray-700">per page</span>
                </div>
                
                <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentFeedbackPage(Math.max(1, currentFeedbackPage - 1))}
                      disabled={currentFeedbackPage === 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalFeedbackPages) }, (_, i) => {
                        const pageNum = i + 1
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentFeedbackPage(pageNum)}
                            className={`px-3 py-1 text-sm border rounded-md ${
                              currentFeedbackPage === pageNum
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
                      onClick={() => setCurrentFeedbackPage(Math.min(totalFeedbackPages, currentFeedbackPage + 1))}
                      disabled={currentFeedbackPage === totalFeedbackPages}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Star className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-medium mb-2">No feedback found</h3>
            <p>Get started by collecting patient feedback</p>
          </div>
        )}
      </div>

      {/* Feedback Form Modal */}
      {showFeedbackForm && (
        <FeedbackForm
          feedback={editingFeedback}
          onSave={handleSaveFeedback}
          onClose={() => {
            setShowFeedbackForm(false)
            setEditingFeedback(null)
          }}
        />
      )}

      {/* Feedback Details Modal */}
      {showFeedbackDetails && viewingFeedback && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          style={{ zIndex: 999999 }}
          onClick={() => setShowFeedbackDetails(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <Star className="w-5 h-5 text-primary-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Feedback Details - {viewingFeedback?.patientName}</h3>
              </div>
              <button
                onClick={() => setShowFeedbackDetails(false)}
                className="close bg-blue-600 hover:bg-blue-700 text-white hover:text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Feedback Information Card */}
                <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <Star className="w-6 h-6 text-primary-500" />
                    </div>
                    <h3 className="text-gray-800 text-lg font-semibold m-0">Feedback Information</h3>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <span className="text-gray-600 font-medium text-sm">Patient Name</span>
                      <span className="text-primary-600 font-semibold text-sm">{viewingFeedback?.patientName}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <span className="text-gray-600 font-medium text-sm">Rating</span>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= (viewingFeedback?.rating || 0)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="text-primary-600 font-semibold text-sm ml-2">
                          {viewingFeedback?.rating}/5
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <span className="text-gray-600 font-medium text-sm">Category</span>
                      <span className="text-primary-600 font-semibold text-sm capitalize">
                        {viewingFeedback?.category}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <span className="text-gray-600 font-medium text-sm">Priority</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        viewingFeedback?.priority === 'high' 
                          ? 'bg-red-100 text-red-800' 
                          : viewingFeedback?.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {viewingFeedback?.priority}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <span className="text-gray-600 font-medium text-sm">Status</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        viewingFeedback?.status === 'resolved' 
                          ? 'bg-green-100 text-green-800' 
                          : viewingFeedback?.status === 'reviewed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {viewingFeedback?.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <span className="text-gray-600 font-medium text-sm">Date</span>
                      <span className="text-primary-600 font-semibold text-sm">
                        {formatDate(viewingFeedback?.date || '')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Additional Details Card */}
                <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-info-circle text-lg text-blue-500"></i>
                    </div>
                    <h3 className="text-gray-800 text-lg font-semibold m-0">Additional Details</h3>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <span className="text-gray-600 font-medium text-sm">Assigned To</span>
                      <span className="text-primary-600 font-semibold text-sm">
                        {viewingFeedback?.assignedTo || 'Not assigned'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <span className="text-gray-600 font-medium text-sm">Follow-up Date</span>
                      <span className="text-primary-600 font-semibold text-sm">
                        {viewingFeedback?.followUpDate ? formatDate(viewingFeedback.followUpDate) : 'Not set'}
                      </span>
                    </div>
                    {viewingFeedback?.tags && viewingFeedback.tags.length > 0 && (
                      <div className="p-3 bg-gray-50 rounded-md">
                        <span className="text-gray-600 font-medium text-sm block mb-2">Tags</span>
                        <div className="flex flex-wrap gap-2">
                          {viewingFeedback.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Comment Section */}
              {viewingFeedback?.comment && (
                <div className="mt-6 bg-white rounded-xl p-6 shadow-md border border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-comment text-lg text-blue-500"></i>
                    </div>
                    <h3 className="text-gray-800 text-lg font-semibold m-0">Patient Comment</h3>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-md border-l-4 border-blue-500">
                    <p className="m-0 text-gray-700 text-sm leading-relaxed">
                      "{viewingFeedback.comment}"
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && feedbackToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[99999] max-w-none">
          <div className="modal-content bg-white rounded-xl shadow-2xl" style={{maxWidth: '400px', width: '90%'}}>
            <div className="modal-header flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 m-0">Confirm Delete</h3>
              <button
                className="close bg-blue-600 hover:bg-blue-700 text-white hover:text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                onClick={cancelDelete}
              >
                ×
              </button>
            </div>
            <div style={{padding: '1.5rem'}}>
              <p style={{marginBottom: '1.5rem', color: '#374151', lineHeight: '1.5'}}>
                Are you sure you want to delete feedback from <strong>"{feedbackToDelete?.patientName}"</strong>? 
                This action cannot be undone.
              </p>
              <div className="form-actions flex gap-3 justify-end">
                <button
                  type="button" 
                  className="btn btn-secondary px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={cancelDelete}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  onClick={confirmDelete}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
