import { useState } from 'react'
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
  Filter
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
  LineChart,
  Line
} from 'recharts'

export default function Feedback() {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [editingFeedback, setEditingFeedback] = useState<FeedbackType | null>(null)
  const [currentFilter, setCurrentFilter] = useState('all')
  
  const { 
    feedback, 
    addFeedback, 
    updateFeedback, 
    deleteFeedback
  } = useAppStore()

  // Filter feedback based on current filter
  const filteredFeedback = feedback.filter(f => 
    currentFilter === 'all' || f.status === currentFilter
  )

  const filters = [
    { value: 'all', label: 'All Feedback' },
    { value: 'pending', label: 'Pending' },
    { value: 'reviewed', label: 'Reviewed' },
    { value: 'resolved', label: 'Resolved' }
  ]

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
    { status: 'pending', count: feedback.filter(f => f.status === 'pending').length },
    { status: 'reviewed', count: feedback.filter(f => f.status === 'reviewed').length },
    { status: 'resolved', count: feedback.filter(f => f.status === 'resolved').length }
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

  const handleDeleteFeedback = (feedbackId: string) => {
    if (window.confirm('Are you sure you want to delete this feedback?')) {
      deleteFeedback(feedbackId)
    }
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
                label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
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
          {/* Filters */}
          <div className="flex gap-2 mb-4 pt-5">
            {filters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setCurrentFilter(filter.value)}
                className={`flex items-center gap-2 px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-sm font-medium cursor-pointer transition-all duration-150 min-h-[44px] whitespace-nowrap ${
                  currentFilter === filter.value
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Filter className="w-4 h-4" />
                {filter.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 items-center ml-auto">
            <button className="action-btn export-btn">
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        {filteredFeedback.length > 0 ? (
          filteredFeedback.map((feedbackItem, index) => (
            <motion.div
              key={feedbackItem.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white border border-gray-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Star className="w-6 h-6 text-primary-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-1">
                      {feedbackItem.patientName}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${
                            star <= feedbackItem.rating 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="text-sm text-gray-600 ml-2">
                        {feedbackItem.rating}/5
                      </span>
                    </div>
                    {feedbackItem.comment && (
                      <p className="text-gray-600 mb-2">{feedbackItem.comment}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Date: {formatDate(feedbackItem.date)}</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        feedbackItem.status === 'resolved' 
                          ? 'bg-green-100 text-green-800' 
                          : feedbackItem.status === 'reviewed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {feedbackItem.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditFeedback(feedbackItem)}
                    className="action-btn edit-btn"
                    title="Edit Feedback"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteFeedback(feedbackItem.id)}
                    className="action-btn delete-btn"
                    title="Delete Feedback"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
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
    </div>
  )
}
