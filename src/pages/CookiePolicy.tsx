import React from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Cookie, Settings, Eye, Shield, Database } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function CookiePolicy() {
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
                  src="/lgo.png"
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
                <Cookie className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Cookie Policy</h1>
              <p className="text-xl text-gray-600">Last updated: January 15, 2025</p>
            </div>

            {/* Content */}
            <div className="prose prose-lg max-w-none">
              <div className="space-y-8">
                {/* Introduction */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <Eye className="w-6 h-6 text-blue-600 mr-3" />
                    What Are Cookies?
                  </h2>
                  <p className="text-gray-700 leading-relaxed">
                    Cookies are small text files that are stored on your device when you visit our website or use our dental management software. 
                    They help us provide you with a better experience by remembering your preferences and improving our services.
                  </p>
                </section>

                {/* Types of Cookies */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <Database className="w-6 h-6 text-blue-600 mr-3" />
                    Types of Cookies We Use
                  </h2>
                  <div className="space-y-6">
                    {/* Essential Cookies */}
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                      <h3 className="text-xl font-semibold text-green-800 mb-3 flex items-center">
                        <Shield className="w-5 h-5 mr-2" />
                        Essential Cookies
                      </h3>
                      <p className="text-green-700 mb-3">
                        These cookies are necessary for the website to function properly and cannot be disabled.
                      </p>
                      <ul className="list-disc list-inside text-green-700 space-y-1">
                        <li>Authentication and login sessions</li>
                        <li>Security and fraud prevention</li>
                        <li>Load balancing and performance</li>
                        <li>User interface preferences</li>
                      </ul>
                    </div>

                    {/* Functional Cookies */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                      <h3 className="text-xl font-semibold text-blue-800 mb-3 flex items-center">
                        <Settings className="w-5 h-5 mr-2" />
                        Functional Cookies
                      </h3>
                      <p className="text-blue-700 mb-3">
                        These cookies enhance your experience by remembering your preferences and settings.
                      </p>
                      <ul className="list-disc list-inside text-blue-700 space-y-1">
                        <li>Language and region preferences</li>
                        <li>Theme and display settings</li>
                        <li>Dashboard layout preferences</li>
                        <li>Notification preferences</li>
                      </ul>
                    </div>

                    {/* Analytics Cookies */}
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                      <h3 className="text-xl font-semibold text-purple-800 mb-3 flex items-center">
                        <Eye className="w-5 h-5 mr-2" />
                        Analytics Cookies
                      </h3>
                      <p className="text-purple-700 mb-3">
                        These cookies help us understand how you use our service to improve performance and features.
                      </p>
                      <ul className="list-disc list-inside text-purple-700 space-y-1">
                        <li>Usage statistics and performance metrics</li>
                        <li>Feature usage and popular functions</li>
                        <li>Error tracking and debugging</li>
                        <li>User journey analysis</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Cookie Details */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Cookie Details</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 rounded-lg">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Cookie Name</th>
                          <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Purpose</th>
                          <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Duration</th>
                          <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 px-4 py-3 font-mono text-sm">auth_token</td>
                          <td className="border border-gray-300 px-4 py-3">User authentication</td>
                          <td className="border border-gray-300 px-4 py-3">Session</td>
                          <td className="border border-gray-300 px-4 py-3">Essential</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-4 py-3 font-mono text-sm">user_preferences</td>
                          <td className="border border-gray-300 px-4 py-3">Dashboard settings</td>
                          <td className="border border-gray-300 px-4 py-3">1 year</td>
                          <td className="border border-gray-300 px-4 py-3">Functional</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-4 py-3 font-mono text-sm">analytics_id</td>
                          <td className="border border-gray-300 px-4 py-3">Usage tracking</td>
                          <td className="border border-gray-300 px-4 py-3">2 years</td>
                          <td className="border border-gray-300 px-4 py-3">Analytics</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-4 py-3 font-mono text-sm">clinic_settings</td>
                          <td className="border border-gray-300 px-4 py-3">Clinic configuration</td>
                          <td className="border border-gray-300 px-4 py-3">6 months</td>
                          <td className="border border-gray-300 px-4 py-3">Functional</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Managing Cookies */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Managing Your Cookie Preferences</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">Browser Settings</h3>
                      <p className="text-gray-700 leading-relaxed mb-3">
                        You can control cookies through your browser settings. Most browsers allow you to:
                      </p>
                      <ul className="list-disc list-inside text-gray-700 space-y-2">
                        <li>View and delete existing cookies</li>
                        <li>Block cookies from specific websites</li>
                        <li>Set preferences for different types of cookies</li>
                        <li>Receive notifications when cookies are set</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">Our Cookie Settings</h3>
                      <p className="text-gray-700 leading-relaxed">
                        You can manage your cookie preferences directly in our application through the Settings menu. 
                        Note that disabling certain cookies may affect the functionality of our service.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Third-Party Cookies */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Third-Party Cookies</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We may use third-party services that set their own cookies. These include:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li><strong>Google Analytics:</strong> For website usage analytics and performance monitoring</li>
                    <li><strong>Payment Processors:</strong> For secure payment processing and fraud prevention</li>
                    <li><strong>Cloud Services:</strong> For data storage, backup, and synchronization</li>
                    <li><strong>Support Tools:</strong> For customer support and communication</li>
                  </ul>
                </section>

                {/* Updates to Policy */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Updates to This Policy</h2>
                  <p className="text-gray-700 leading-relaxed">
                    We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, 
                    legal, or regulatory reasons. We will notify you of any material changes by posting the updated policy on our website 
                    and updating the "Last updated" date.
                  </p>
                </section>

                {/* Contact Information */}
                <section className="bg-blue-50 rounded-xl p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
                  <p className="text-gray-700 leading-relaxed">
                    If you have any questions about our use of cookies, please contact us:
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

