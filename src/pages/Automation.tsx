import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings, 
  Zap, 
  Mail, 
  MessageSquare, 
  Calendar,
  Bell,
  Play,
  Pause,
  Edit,
  Trash2,
  Plus,
  ExternalLink
} from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import toast from 'react-hot-toast'

interface AutomationWorkflow {
  id: string
  name: string
  description: string
  type: 'email' | 'sms' | 'notification' | 'webhook'
  status: 'active' | 'inactive' | 'draft'
  trigger: string
  actions: string[]
  lastRun?: string
  nextRun?: string
  n8nWebhookUrl?: string
}

export default function Automation() {
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([
    {
      id: '1',
      name: 'Appointment Confirmation',
      description: 'Automatically send confirmation emails after appointment booking',
      type: 'email',
      status: 'active',
      trigger: 'Appointment Created',
      actions: ['Send Email', 'Update Calendar', 'Log Activity'],
      lastRun: '2024-01-15T10:30:00Z',
      nextRun: '2024-01-15T14:00:00Z',
      n8nWebhookUrl: 'https://n8n.yourdomain.com/webhook/appointment-confirmation'
    },
    {
      id: '2',
      name: 'SMS Reminders',
      description: 'Send SMS reminders 24 hours before appointments',
      type: 'sms',
      status: 'active',
      trigger: '24h Before Appointment',
      actions: ['Send SMS', 'Check Confirmation', 'Update Status'],
      lastRun: '2024-01-15T09:00:00Z',
      nextRun: '2024-01-16T09:00:00Z',
      n8nWebhookUrl: 'https://n8n.yourdomain.com/webhook/sms-reminders'
    },
    {
      id: '3',
      name: 'Feedback Request',
      description: 'Automatically request feedback after completed appointments',
      type: 'notification',
      status: 'draft',
      trigger: 'Appointment Completed',
      actions: ['Send Email', 'Create Survey', 'Schedule Follow-up'],
      lastRun: undefined,
      nextRun: undefined,
      n8nWebhookUrl: 'https://n8n.yourdomain.com/webhook/feedback-request'
    }
  ])

  const [showWorkflowForm, setShowWorkflowForm] = useState(false)
  const [editingWorkflow, setEditingWorkflow] = useState<AutomationWorkflow | null>(null)

  const toggleWorkflowStatus = (workflowId: string) => {
    setWorkflows(prev => prev.map(w => 
      w.id === workflowId 
        ? { ...w, status: w.status === 'active' ? 'inactive' : 'active' }
        : w
    ))
    
    toast.success('Workflow status updated successfully!')
  }

  const deleteWorkflow = (workflowId: string) => {
    if (window.confirm('Are you sure you want to delete this workflow?')) {
      setWorkflows(prev => prev.filter(w => w.id !== workflowId))
      toast.success('Workflow deleted successfully!')
    }
  }

  const testWorkflow = (workflow: AutomationWorkflow) => {
    // Simulate testing the workflow
    toast.promise(
      new Promise((resolve) => {
        setTimeout(() => {
          resolve('Workflow test completed successfully!')
        }, 2000)
      }),
      {
        loading: 'Testing workflow...',
        success: 'Workflow test completed successfully!',
        error: 'Workflow test failed'
      }
    )
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="w-5 h-5" />
      case 'sms':
        return <MessageSquare className="w-5 h-5" />
      case 'notification':
        return <Bell className="w-5 h-5" />
      case 'webhook':
        return <Zap className="w-5 h-5" />
      default:
        return <Settings className="w-5 h-5" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-6">
      {/* Automation Header */}
      <div className="mb-6 p-6 bg-white border border-gray-200 rounded-2xl shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Automation Hub</h2>
            <p className="text-gray-600">Streamline your clinic operations with intelligent automation</p>
          </div>
          <button
            onClick={() => setShowWorkflowForm(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Workflow
          </button>
        </div>
      </div>

      {/* Automation Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="stat-card"
        >
          <div className="stat-icon bg-blue-100 text-blue-500">
            <Zap className="w-8 h-8" />
          </div>
          <div className="stat-info">
            <h3 className="text-3xl font-bold text-gray-800 mb-1">
              {workflows.filter(w => w.status === 'active').length}
            </h3>
            <p className="text-gray-600 font-medium text-sm">Active Workflows</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="stat-card"
        >
          <div className="stat-icon bg-green-100 text-green-500">
            <Calendar className="w-8 h-8" />
          </div>
          <div className="stat-info">
            <h3 className="text-3xl font-bold text-gray-800 mb-1">
              {workflows.filter(w => w.lastRun).length}
            </h3>
            <p className="text-gray-600 font-medium text-sm">Executed Today</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="stat-card"
        >
          <div className="stat-icon bg-purple-100 text-purple-500">
            <Settings className="w-8 h-8" />
          </div>
          <div className="stat-info">
            <h3 className="text-3xl font-bold text-gray-800 mb-1">
              {workflows.length}
            </h3>
            <p className="text-gray-600 font-medium text-sm">Total Workflows</p>
          </div>
        </motion.div>
      </div>

      {/* Workflows List */}
      <div className="space-y-6">
        {workflows.map((workflow, index) => (
          <motion.div
            key={workflow.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white border border-gray-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  {getTypeIcon(workflow.type)}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-1">
                    {workflow.name}
                  </h3>
                  <p className="text-gray-600 mb-2">{workflow.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Zap className="w-4 h-4" />
                      Trigger: {workflow.trigger}
                    </span>
                    <span className="flex items-center gap-1">
                      <Settings className="w-4 h-4" />
                      Actions: {workflow.actions.length}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(workflow.status)}`}>
                  {workflow.status}
                </span>
              </div>
            </div>

            {/* Workflow Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Actions</h4>
                <div className="space-y-1">
                  {workflow.actions.map((action, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                      {action}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Execution Info</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  {workflow.lastRun && (
                    <div>Last Run: {new Date(workflow.lastRun).toLocaleString()}</div>
                  )}
                  {workflow.nextRun && (
                    <div>Next Run: {new Date(workflow.nextRun).toLocaleString()}</div>
                  )}
                  {workflow.n8nWebhookUrl && (
                    <div className="flex items-center gap-2">
                      <span>n8n Webhook:</span>
                      <a
                        href={workflow.n8nWebhookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 flex items-center gap-1"
                      >
                        View
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Workflow Actions */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => toggleWorkflowStatus(workflow.id)}
                  className={`btn btn-sm ${
                    workflow.status === 'active' ? 'btn-secondary' : 'btn-primary'
                  }`}
                >
                  {workflow.status === 'active' ? (
                    <>
                      <Pause className="w-4 h-4" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Activate
                    </>
                  )}
                </button>
                <button
                  onClick={() => testWorkflow(workflow)}
                  className="btn btn-sm btn-secondary"
                >
                  <Zap className="w-4 h-4" />
                  Test
                </button>
                <button
                  onClick={() => setEditingWorkflow(workflow)}
                  className="btn btn-sm btn-secondary"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              </div>
              <button
                onClick={() => deleteWorkflow(workflow.id)}
                className="btn btn-sm btn-danger"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* n8n Integration Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Zap className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-800 mb-2">n8n Workflow Integration</h3>
            <p className="text-blue-700 mb-4">
              This system integrates with n8n to provide powerful workflow automation capabilities. 
              Each workflow above can be configured to trigger n8n workflows via webhooks.
            </p>
            <div className="space-y-2 text-sm text-blue-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <strong>Appointment Confirmation:</strong> Triggers email sending workflow
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <strong>SMS Reminders:</strong> Integrates with SMS service providers
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <strong>Feedback Collection:</strong> Automates patient satisfaction surveys
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Workflow Form Modal would go here */}
      {showWorkflowForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Create New Workflow</h3>
            <p className="text-gray-600 mb-4">
              Workflow creation form would be implemented here with React Hook Form and Zod validation.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowWorkflowForm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowWorkflowForm(false)}
                className="btn btn-primary"
              >
                Create Workflow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
