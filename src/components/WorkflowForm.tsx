import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, Pause, Settings, Zap, Calendar, Clock, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

const workflowSchema = z.object({
  name: z.string().min(1, 'Workflow name is required'),
  description: z.string().optional(),
  type: z.enum(['appointment_reminder', 'follow_up', 'inventory_alert', 'billing_reminder', 'custom']),
  status: z.enum(['active', 'paused', 'draft']),
  trigger: z.enum(['daily', 'weekly', 'monthly', 'on_event', 'manual']),
  triggerTime: z.string().optional(),
  triggerDay: z.string().optional(),
  actions: z.array(z.object({
    type: z.enum(['send_email', 'send_sms', 'create_task', 'update_record', 'webhook']),
    config: z.string().min(1, 'Action configuration is required')
  })).min(1, 'At least one action is required'),
  conditions: z.array(z.object({
    field: z.string().min(1, 'Condition field is required'),
    operator: z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than']),
    value: z.string().min(1, 'Condition value is required')
  })).optional(),
  n8nWebhookUrl: z.string().url('Invalid webhook URL').optional().or(z.literal('')),
  notes: z.string().optional()
})

type WorkflowFormData = z.infer<typeof workflowSchema>

interface WorkflowFormProps {
  workflow?: any | null
  onSave: (data: WorkflowFormData) => void
  onClose: () => void
}

export default function WorkflowForm({ workflow, onSave, onClose }: WorkflowFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset
  } = useForm<WorkflowFormData>({
    resolver: zodResolver(workflowSchema),
    defaultValues: {
      name: workflow?.name || '',
      description: workflow?.description || '',
      type: workflow?.type || 'appointment_reminder',
      status: workflow?.status || 'draft',
      trigger: workflow?.trigger || 'daily',
      triggerTime: workflow?.triggerTime || '09:00',
      triggerDay: workflow?.triggerDay || 'monday',
      actions: workflow?.actions || [{ type: 'send_email', config: '' }],
      conditions: workflow?.conditions || [],
      n8nWebhookUrl: workflow?.n8nWebhookUrl || '',
      notes: workflow?.notes || ''
    }
  })

  const watchedTrigger = watch('trigger')
  const watchedType = watch('type')

  const onSubmit = (data: WorkflowFormData) => {
    onSave(data)
    reset()
  }

  const workflowTypes = [
    { value: 'appointment_reminder', label: 'Appointment Reminder', icon: Calendar },
    { value: 'follow_up', label: 'Patient Follow-up', icon: Clock },
    { value: 'inventory_alert', label: 'Inventory Alert', icon: Settings },
    { value: 'billing_reminder', label: 'Billing Reminder', icon: Zap },
    { value: 'custom', label: 'Custom Workflow', icon: Settings }
  ]

  const triggerOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'on_event', label: 'On Event' },
    { value: 'manual', label: 'Manual' }
  ]

  const actionTypes = [
    { value: 'send_email', label: 'Send Email' },
    { value: 'send_sms', label: 'Send SMS' },
    { value: 'create_task', label: 'Create Task' },
    { value: 'update_record', label: 'Update Record' },
    { value: 'webhook', label: 'Webhook Call' }
  ]

  const conditionOperators = [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' }
  ]

  const daysOfWeek = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ]

  const getActionPlaceholder = (type: string) => {
    switch (type) {
      case 'send_email':
        return 'Enter email template or recipient configuration'
      case 'send_sms':
        return 'Enter SMS template or phone number configuration'
      case 'create_task':
        return 'Enter task details and assignment'
      case 'update_record':
        return 'Enter field updates and conditions'
      case 'webhook':
        return 'Enter webhook endpoint and payload'
      default:
        return 'Enter action configuration'
    }
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
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">
              {workflow ? 'Edit Workflow' : 'Create New Workflow'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="name" className="form-label">
                    Workflow Name *
                  </label>
                  <input
                    {...register('name')}
                    type="text"
                    id="name"
                    className={cn('form-input', errors.name && 'border-red-500')}
                    placeholder="Enter workflow name"
                  />
                  {errors.name && (
                    <span className="text-red-500 text-sm">{errors.name.message}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="type" className="form-label">
                    Workflow Type *
                  </label>
                  <select
                    {...register('type')}
                    id="type"
                    className={cn('form-input', errors.type && 'border-red-500')}
                  >
                    {workflowTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                  {errors.type && (
                    <span className="text-red-500 text-sm">{errors.type.message}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description" className="form-label">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  id="description"
                  rows={3}
                  className="form-input"
                  placeholder="Enter workflow description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="status" className="form-label">
                    Status
                  </label>
                  <select
                    {...register('status')}
                    id="status"
                    className="form-input"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="trigger" className="form-label">
                    Trigger Type *
                  </label>
                  <select
                    {...register('trigger')}
                    id="trigger"
                    className={cn('form-input', errors.trigger && 'border-red-500')}
                  >
                    {triggerOptions.map((trigger) => (
                      <option key={trigger.value} value={trigger.value}>{trigger.label}</option>
                    ))}
                  </select>
                  {errors.trigger && (
                    <span className="text-red-500 text-sm">{errors.trigger.message}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Trigger Configuration */}
            {watchedTrigger !== 'manual' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Trigger Configuration
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {watchedTrigger === 'daily' && (
                    <div className="form-group">
                      <label htmlFor="triggerTime" className="form-label">
                        Time of Day
                      </label>
                      <input
                        {...register('triggerTime')}
                        type="time"
                        id="triggerTime"
                        className="form-input"
                      />
                    </div>
                  )}

                  {watchedTrigger === 'weekly' && (
                    <>
                      <div className="form-group">
                        <label htmlFor="triggerDay" className="form-label">
                          Day of Week
                        </label>
                        <select
                          {...register('triggerDay')}
                          id="triggerDay"
                          className="form-input"
                        >
                          {daysOfWeek.map((day) => (
                            <option key={day} value={day}>
                              {day.charAt(0).toUpperCase() + day.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label htmlFor="triggerTime" className="form-label">
                          Time of Day
                        </label>
                        <input
                          {...register('triggerTime')}
                          type="time"
                          id="triggerTime"
                          className="form-input"
                        />
                      </div>
                    </>
                  )}

                  {watchedTrigger === 'monthly' && (
                    <>
                      <div className="form-group">
                        <label htmlFor="triggerDay" className="form-label">
                          Day of Month
                        </label>
                        <input
                          {...register('triggerDay')}
                          type="number"
                          id="triggerDay"
                          min="1"
                          max="31"
                          className="form-input"
                          placeholder="1-31"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="triggerTime" className="form-label">
                          Time of Day
                        </label>
                        <input
                          {...register('triggerTime')}
                          type="time"
                          id="triggerTime"
                          className="form-input"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Actions
              </h3>
              
              <div className="space-y-4">
                {watch('actions')?.map((action, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-group">
                        <label className="form-label">Action Type</label>
                        <select
                          {...register(`actions.${index}.type`)}
                          className="form-input"
                        >
                          {actionTypes.map((type) => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">Configuration</label>
                        <textarea
                          {...register(`actions.${index}.config`)}
                          rows={2}
                          className="form-input"
                          placeholder={getActionPlaceholder(watch(`actions.${index}.type`))}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <button
                type="button"
                onClick={() => setValue('actions', [...watch('actions'), { type: 'send_email', config: '' }])}
                className="btn btn-secondary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Action
              </button>
            </div>

            {/* Conditions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Conditions (Optional)</h3>
              
              <div className="space-y-4">
                {watch('conditions')?.map((condition, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="form-group">
                        <label className="form-label">Field</label>
                        <input
                          {...register(`conditions.${index}.field`)}
                          type="text"
                          className="form-input"
                          placeholder="e.g., patient.status"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">Operator</label>
                        <select
                          {...register(`conditions.${index}.operator`)}
                          className="form-input"
                        >
                          {conditionOperators.map((op) => (
                            <option key={op.value} value={op.value}>{op.label}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">Value</label>
                        <input
                          {...register(`conditions.${index}.value`)}
                          type="text"
                          className="form-input"
                          placeholder="e.g., active"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <button
                type="button"
                onClick={() => setValue('conditions', [...(watch('conditions') || []), { field: '', operator: 'equals', value: '' }])}
                className="btn btn-secondary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Condition
              </button>
            </div>

            {/* n8n Integration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">n8n Integration</h3>
              
              <div className="form-group">
                <label htmlFor="n8nWebhookUrl" className="form-label">
                  n8n Webhook URL
                </label>
                <input
                  {...register('n8nWebhookUrl')}
                  type="url"
                  id="n8nWebhookUrl"
                  className="form-input"
                  placeholder="https://your-n8n-instance.com/webhook/..."
                />
                <p className="text-sm text-gray-500 mt-1">
                  Optional: Connect this workflow to n8n for advanced automation capabilities
                </p>
              </div>
            </div>

            {/* Notes */}
            <div className="form-group">
              <label htmlFor="notes" className="form-label">
                Notes
              </label>
              <textarea
                {...register('notes')}
                id="notes"
                rows={3}
                className="form-input"
                placeholder="Enter any additional notes or instructions..."
              />
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
                {workflow ? 'Update Workflow' : 'Create Workflow'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
