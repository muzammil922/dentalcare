import React from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, FileText, Scale, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function TermsOfService() {
  const navigate = useNavigate()

  const handleBack = () => {
    navigate(-1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Custom Navbar Styles */}
      <style jsx>{`
        nav[class*="fixed"] {
          z-index: 9999 !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          height: 8vh !important;
          width: 100% !important;
          background: rgba(255, 255, 255, 0.95) !important;
          backdrop-filter: blur(8px) !important;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1) !important;
          transition: all 0.3s ease-in-out !important;
        }
        
        .navbar-content {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          height: 100% !important;
          width: 100% !important;
        }
        
        .navbar-text {
          font-weight: 600 !important;
          color: #1f2937 !important;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
        }
      `}</style>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 border-b border-gray-200 z-[9999] transition-all duration-300" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="navbar-content">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
                <img
                  src="/src/assest/lgo.png"
                  alt="myDashy Pro Logo"
                  className="w-6 h-6 rounded"
                />
              </div>
              <div>
                <h1 className="navbar-text text-lg font-bold">myDashy Pro</h1>
                <p className="text-xs text-gray-600 font-medium">Dental Management</p>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-6">
              <a href="/" className="navbar-text text-gray-700 hover:text-blue-600 transition-colors text-sm font-medium">Home</a>
              <a href="/#features" className="navbar-text text-gray-700 hover:text-blue-600 transition-colors text-sm font-medium">Features</a>
              <a href="/#pricing" className="navbar-text text-gray-700 hover:text-blue-600 transition-colors text-sm font-medium">Pricing</a>
              <a href="/login" className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl text-sm">
                Sign In
              </a>
            </div>

            {/* Back Button */}
            <button
              onClick={handleBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl shadow-xl p-8 md:p-12"
          >
            {/* Header */}
            <div className="text-center mb-12">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Scale className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
              <p className="text-xl text-gray-600">Last updated: January 15, 2025</p>
            </div>

            {/* Content */}
            <div className="prose prose-lg max-w-none">
              <div className="space-y-8">
                {/* Introduction */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <FileText className="w-6 h-6 text-blue-600 mr-3" />
                    Agreement to Terms
                  </h2>
                  <p className="text-gray-700 leading-relaxed">
                    By accessing and using myDashy Pro dental management software, you agree to be bound by these Terms of Service. 
                    If you do not agree to these terms, please do not use our service.
                  </p>
                </section>

                {/* Service Description */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Service Description</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    myDashy Pro is a comprehensive dental practice management software that provides:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>Patient management and record keeping</li>
                    <li>Appointment scheduling and management</li>
                    <li>Billing and invoicing systems</li>
                    <li>Staff management and access controls</li>
                    <li>Inventory tracking and management</li>
                    <li>Reporting and analytics</li>
                    <li>Automation and notification systems</li>
                  </ul>
                </section>

                {/* User Responsibilities */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                    User Responsibilities
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">Account Security</h3>
                      <ul className="list-disc list-inside text-gray-700 space-y-2">
                        <li>Maintain the confidentiality of your login credentials</li>
                        <li>Use strong passwords and enable two-factor authentication</li>
                        <li>Notify us immediately of any unauthorized access</li>
                        <li>Regularly update your account information</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">Data Accuracy</h3>
                      <ul className="list-disc list-inside text-gray-700 space-y-2">
                        <li>Provide accurate and complete information</li>
                        <li>Keep patient records up to date</li>
                        <li>Ensure compliance with healthcare regulations</li>
                        <li>Maintain proper backup procedures</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Prohibited Uses */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <XCircle className="w-6 h-6 text-red-600 mr-3" />
                    Prohibited Uses
                  </h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    You may not use our service for:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>Any unlawful or fraudulent activities</li>
                    <li>Violating patient privacy or HIPAA regulations</li>
                    <li>Attempting to gain unauthorized access to our systems</li>
                    <li>Distributing malware or harmful software</li>
                    <li>Reverse engineering or copying our software</li>
                    <li>Reselling or redistributing our service without permission</li>
                    <li>Interfering with other users' access to the service</li>
                  </ul>
                </section>

                {/* Payment Terms */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Terms</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">Subscription Fees</h3>
                      <ul className="list-disc list-inside text-gray-700 space-y-2">
                        <li>Monthly or annual subscription fees as per your chosen plan</li>
                        <li>Fees are billed in advance and are non-refundable</li>
                        <li>Price changes will be communicated 30 days in advance</li>
                        <li>Additional fees may apply for premium features</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">Payment Methods</h3>
                      <ul className="list-disc list-inside text-gray-700 space-y-2">
                        <li>Credit cards, debit cards, and bank transfers accepted</li>
                        <li>Automatic billing for subscription renewals</li>
                        <li>Failed payments may result in service suspension</li>
                        <li>All fees are exclusive of applicable taxes</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Service Availability */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Service Availability</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">Uptime Commitment</h3>
                      <p className="text-gray-700 leading-relaxed">
                        We strive to maintain 99.9% uptime for our service. However, we cannot guarantee uninterrupted access 
                        due to maintenance, updates, or unforeseen circumstances.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">Maintenance Windows</h3>
                      <p className="text-gray-700 leading-relaxed">
                        Scheduled maintenance will be performed during off-peak hours with advance notice. 
                        Emergency maintenance may be required without prior notice.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Limitation of Liability */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <AlertTriangle className="w-6 h-6 text-yellow-600 mr-3" />
                    Limitation of Liability
                  </h2>
                  <p className="text-gray-700 leading-relaxed">
                    To the maximum extent permitted by law, myDashy Pro shall not be liable for any indirect, incidental, 
                    special, consequential, or punitive damages, including but not limited to loss of profits, data, or 
                    business opportunities, arising from your use of our service.
                  </p>
                </section>

                {/* Termination */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Termination</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">User Termination</h3>
                      <p className="text-gray-700 leading-relaxed">
                        You may terminate your account at any time by contacting our support team. 
                        Data export options will be provided upon request.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">Service Termination</h3>
                      <p className="text-gray-700 leading-relaxed">
                        We reserve the right to suspend or terminate your account for violations of these terms, 
                        non-payment, or other reasons at our discretion with appropriate notice.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Contact Information */}
                <section className="bg-blue-50 rounded-xl p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
                  <p className="text-gray-700 leading-relaxed">
                    For questions about these Terms of Service, please contact us:
                  </p>
                  <div className="mt-4 space-y-2">
                    <p className="text-gray-700"><strong>Email:</strong> aidev.muzammil@gmail.com</p>
                    <p className="text-gray-700"><strong>Phone:</strong> +92 317 4718549</p>
                    <p className="text-gray-700"><strong>Address:</strong> 74900 Karachi, Pakistan</p>
                  </div>
                </section>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

