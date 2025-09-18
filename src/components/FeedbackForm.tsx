import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, X } from 'lucide-react'
import { Feedback } from '@/stores/useAppStore'
import { cn } from '@/lib/utils'

const feedbackSchema = z.object({
  patientName: z.string().min(1, 'Patient name is required'),
  rating: z.number().min(1, 'Rating is required').max(5, 'Rating must be 5 or less'),
  comment: z.string().optional(),
  status: z.enum(['pending', 'reviewed', 'resolved']),
  category: z.enum(['service', 'treatment', 'staff', 'facility', 'other']),
  priority: z.enum(['low', 'medium', 'high']),
  assignedTo: z.string().optional(),
  followUpDate: z.string().optional(),
  tags: z.array(z.string()).optional()
})

type FeedbackFormData = z.infer<typeof feedbackSchema>

interface FeedbackFormProps {
  feedback?: Feedback | null
  onSave: (data: Omit<Feedback, 'id'>) => void
  onClose: () => void
}

export default function FeedbackForm({ feedback, onSave, onClose }: FeedbackFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      patientName: feedback?.patientName || '',
      rating: feedback?.rating || 5,
      comment: feedback?.comment || '',
      status: feedback?.status || 'pending',
      category: feedback?.category || 'service',
      priority: feedback?.priority || 'medium',
      assignedTo: feedback?.assignedTo || '',
      followUpDate: feedback?.followUpDate || '',
      tags: feedback?.tags || []
    }
  })

  const watchedRating = watch('rating')

  const onSubmit = (data: FeedbackFormData) => {
    onSave(data)
    reset()
  }

  const handleRatingChange = (rating: number) => {
    setValue('rating', rating)
  }

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      e.preventDefault()
      const newTag = e.currentTarget.value.trim()
      const currentTags = watch('tags') || []
      if (!currentTags.includes(newTag)) {
        setValue('tags', [...currentTags, newTag])
      }
      e.currentTarget.value = ''
    }
  }

  const removeTag = (tagToRemove: string) => {
    const currentTags = watch('tags') || []
    setValue('tags', currentTags.filter(tag => tag !== tagToRemove))
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-hide"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200  rounded-t-2xl">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {feedback ? 'Edit Feedback' : 'Add New Feedback'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {feedback ? 'Update patient feedback information' : 'Record new patient feedback'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="close bg-blue-600 hover:bg-blue-700 text-white hover:text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
            >
              X
            </button>
          </div>

          {/* Form */}
          <form id="feedback-form" onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Patient Name */}
            <div className="form-group">
              <label htmlFor="patientName" className="block text-sm font-semibold text-gray-700 mb-2">
                Patient Name *
              </label>
              <input
                {...register('patientName')}
                type="text"
                id="patientName"
                className={cn(
                  'w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 transition-colors',
                  errors.patientName && 'border-red-500 focus:border-red-500'
                )}
                placeholder="Enter patient name"
              />
              {errors.patientName && (
                <span className="text-red-500 text-sm mt-1 block">{errors.patientName.message}</span>
              )}
            </div>

            {/* Rating */}
            <div className="form-group">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Rating *</label>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingChange(star)}
                    className="focus:outline-none transform hover:scale-110 transition-transform"
                  >
                    <Star
                      className={cn(
                        'w-10 h-10 transition-colors',
                        star <= watchedRating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300 hover:text-yellow-200'
                      )}
                    />
                  </button>
                ))}
                <span className="ml-4 text-xl font-bold text-gray-700 bg-white px-3 py-1 rounded-lg">
                  {watchedRating}/5
                </span>
              </div>
              {errors.rating && (
                <span className="text-red-500 text-sm mt-1 block">{errors.rating.message}</span>
              )}
            </div>

            {/* Category and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-2">
                  Category
                </label>
                <select
                  {...register('category')}
                  id="category"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="service">Service Quality</option>
                  <option value="treatment">Treatment</option>
                  <option value="staff">Staff</option>
                  <option value="facility">Facility</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="priority" className="block text-sm font-semibold text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  {...register('priority')}
                  id="priority"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            {/* Comment */}
            <div className="form-group">
              <label htmlFor="comment" className="block text-sm font-semibold text-gray-700 mb-2">
                Comment
              </label>
              <textarea
                {...register('comment')}
                id="comment"
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                placeholder="Enter patient feedback comment..."
              />
            </div>

            {/* Status and Assigned To */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label htmlFor="status" className="block text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <select
                  {...register('status')}
                  id="status"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="assignedTo" className="block text-sm font-semibold text-gray-700 mb-2">
                  Assigned To
                </label>
                <input
                  {...register('assignedTo')}
                  type="text"
                  id="assignedTo"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Staff member name"
                />
              </div>
            </div>

            {/* Follow-up Date */}
            <div className="form-group">
              <label htmlFor="followUpDate" className="block text-sm font-semibold text-gray-700 mb-2">
                Follow-up Date
              </label>
              <input
                {...register('followUpDate')}
                type="date"
                id="followUpDate"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Tags */}
            <div className="form-group">
              <label htmlFor="tags" className="block text-sm font-semibold text-gray-700 mb-2">
                Tags
              </label>
              <input
                type="text"
                id="tags"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Press Enter to add tags"
                onKeyDown={handleTagInput}
              />
              <div className="flex flex-wrap gap-2 mt-3">
                {(watch('tags') || []).map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary mr-0"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
              >
                {feedback ? 'Update Feedback' : 'Save Feedback'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
