import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Building2, MapPin, Phone, Mail, Clock, Save, Upload, User, X } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'

export default function Settings() {
  const { clinicInfo, updateClinicInfo, userInfo, updateUserInfo } = useAppStore()
  const [isEditing, setIsEditing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (field: string, value: string) => {
    updateClinicInfo({ [field]: value })
  }

  const handleUserInputChange = (field: string, value: string) => {
    updateUserInfo({ [field]: value })
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        updateClinicInfo({ profileImage: result })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        updateClinicInfo({ logo: result })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleLogoClick = () => {
    const logoInput = document.getElementById('logo-upload') as HTMLInputElement
    logoInput?.click()
  }

  const handleDeleteProfileImage = () => {
    updateClinicInfo({ profileImage: undefined })
  }

  const handleDeleteLogo = () => {
    updateClinicInfo({ logo: undefined })
  }

  const handleSave = () => {
    setIsEditing(false)
    // You could add a toast notification here
  }

  const handleBack = () => {
    window.history.back()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header with Back Button */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </motion.div>

      {/* Settings Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl text-blue-600 font-bold text-gray-800">Clinic Settings</h1>
          <p className="text-gray-600 mt-2">Manage your clinic information and preferences</p>
        </div>
        {/* Profile Image Upload */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div
              onClick={handleImageClick}
              className="w-24 h-24 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
            >
              {clinicInfo.profileImage ? (
                <img
                  src={clinicInfo.profileImage}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors">
              <Upload className="w-3 h-3 text-white" />
            </div>
            {clinicInfo.profileImage && (
              <button
                onClick={handleDeleteProfileImage}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-red-600 transition-colors opacity-0 hover:opacity-100"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Clinic Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Clinic Name *</label>
              <input
                type="text"
                value={clinicInfo.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                placeholder="Enter clinic name"
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Phone Number *</label>
              <input
                type="tel"
                value={clinicInfo.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                placeholder="Enter phone number"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email Address *</label>
              <input
                type="email"
                value={clinicInfo.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                placeholder="Enter email address"
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Address *</label>
              <textarea
                value={clinicInfo.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={3}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white resize-none"
                placeholder="Enter clinic address"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* User Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">User Name *</label>
              <input
                type="text"
                value={userInfo.name}
                onChange={(e) => handleUserInputChange('name', e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                placeholder="Enter your name"
              />
            </div>

            {/* Clinic Logo */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Clinic Logo</label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div
                    onClick={handleLogoClick}
                    className="w-16 h-16 border-2 border-gray-300 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    {clinicInfo.logo ? (
                      <img
                        src={clinicInfo.logo}
                        alt="Clinic Logo"
                        className="w-full h-full object-contain rounded-lg"
                      />
                    ) : (
                      <Upload className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  {clinicInfo.logo && (
                    <button
                      onClick={handleDeleteLogo}
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-red-600 transition-colors opacity-0 hover:opacity-100"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Click to upload logo</p>
                  <p className="text-xs text-gray-500">PNG, JPG up to 2MB</p>
                </div>
              </div>
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>

            {/* Website */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Website (optional)</label>
              <input
                type="url"
                value={clinicInfo.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                placeholder="Enter website URL"
              />
            </div>

            {/* Operating Hours */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Operating Hours *</label>
              <textarea
                value={clinicInfo.hours}
                onChange={(e) => handleInputChange('hours', e.target.value)}
                rows={3}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white resize-none"
                placeholder="Enter operating hours"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-end gap-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Save
          </button>
        </div>
      </motion.div>
    </div>
  )
}
