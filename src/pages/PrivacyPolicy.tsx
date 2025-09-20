import React from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Shield, Eye, Lock, Database, UserCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function PrivacyPolicy() {
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
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
              <p className="text-xl text-gray-600">Last updated: January 15, 2025</p>
            </div>

            {/* Content */}
            <div className="prose prose-lg max-w-none">
              <div className="space-y-8">
                {/* Introduction */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <Eye className="w-6 h-6 text-blue-600 mr-3" />
                    Introduction
                  </h2>
                  <p className="text-gray-700 leading-relaxed">
                    At myDashy Pro, we are committed to protecting your privacy and ensuring the security of your personal information. 
                    This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our dental 
                    management software and related services.
                  </p>
                </section>

                {/* Information We Collect */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <Database className="w-6 h-6 text-blue-600 mr-3" />
                    Information We Collect
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">Personal Information</h3>
                      <ul className="list-disc list-inside text-gray-700 space-y-2">
                        <li>Name, email address, and contact information</li>
                        <li>Clinic information and practice details</li>
                        <li>Patient records and medical information (encrypted)</li>
                        <li>Billing and payment information</li>
                        <li>Staff and user account information</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">Usage Information</h3>
                      <ul className="list-disc list-inside text-gray-700 space-y-2">
                        <li>Software usage patterns and analytics</li>
                        <li>Device information and browser details</li>
                        <li>IP address and location data</li>
                        <li>Cookies and similar tracking technologies</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* How We Use Information */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <UserCheck className="w-6 h-6 text-blue-600 mr-3" />
                    How We Use Your Information
                  </h2>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>Provide and maintain our dental management services</li>
                    <li>Process appointments and manage patient records</li>
                    <li>Generate invoices and handle billing</li>
                    <li>Send important notifications and updates</li>
                    <li>Improve our software and user experience</li>
                    <li>Comply with legal and regulatory requirements</li>
                    <li>Provide customer support and technical assistance</li>
                  </ul>
                </section>

                {/* Data Security */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <Lock className="w-6 h-6 text-blue-600 mr-3" />
                    Data Security
                  </h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We implement industry-standard security measures to protect your data:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>End-to-end encryption for all sensitive data</li>
                    <li>Secure cloud infrastructure with regular backups</li>
                    <li>Multi-factor authentication for user accounts</li>
                    <li>Regular security audits and updates</li>
                    <li>Access controls and user permission management</li>
                    <li>HIPAA compliance for healthcare data</li>
                  </ul>
                </section>

                {/* Data Sharing */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Sharing</h2>
                  <p className="text-gray-700 leading-relaxed">
                    We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2 mt-4">
                    <li>With your explicit consent</li>
                    <li>To comply with legal obligations</li>
                    <li>With trusted service providers who assist in our operations</li>
                    <li>In case of business transfers or mergers</li>
                    <li>To protect our rights and prevent fraud</li>
                  </ul>
                </section>

                {/* Your Rights */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Rights</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    You have the following rights regarding your personal information:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>Access and review your personal data</li>
                    <li>Request corrections to inaccurate information</li>
                    <li>Request deletion of your data (subject to legal requirements)</li>
                    <li>Object to certain processing activities</li>
                    <li>Data portability and export options</li>
                    <li>Withdraw consent at any time</li>
                  </ul>
                </section>

                {/* Contact Information */}
                <section className="bg-blue-50 rounded-xl p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
                  <p className="text-gray-700 leading-relaxed">
                    If you have any questions about this Privacy Policy or our data practices, please contact us:
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

