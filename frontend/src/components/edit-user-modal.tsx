// components/edit-user-modal.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, User, Mail, Phone, Globe, MapPin, Building2 } from "lucide-react"

interface CFUser {
  _id: string
  name: string
  email?: string
  phone?: string
  cfHandle: string
  currentRating: number
  maxRating: number
  rank: string
  maxRank: string
  country?: string
  city?: string
  organization?: string
  avatar: string
  contribution: number
  friendOfCount: number
  firstName?: string
  lastName?: string
}

interface EditUserModalProps {
  isOpen: boolean
  user: CFUser | null
  onClose: () => void
  onSubmit: (userId: string, userData: UserUpdateData) => Promise<void>
  loading: boolean
}

interface UserUpdateData {
  name: string
  email?: string
  phone?: string
  handle: string
  firstName?: string
  lastName?: string
  country?: string
  city?: string
  organization?: string
}

export function EditUserModal({ isOpen, user, onClose, onSubmit, loading }: EditUserModalProps) {
  const [formData, setFormData] = useState<UserUpdateData>({
    name: "",
    email: "",
    phone: "",
    handle: "",
    firstName: "",
    lastName: "",
    country: "",
    city: "",
    organization: "",
  })

  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  // Populate form when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        handle: user.cfHandle || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        country: user.country || "",
        city: user.city || "",
        organization: user.organization || "",
      })
      setErrors({})
    }
  }, [user])

  const handleInputChange = (field: keyof UserUpdateData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    }

    if (!formData.handle.trim()) {
      newErrors.handle = "Codeforces handle is required"
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(formData.handle)) {
      newErrors.handle = "Handle can only contain letters, numbers, dots, hyphens, and underscores"
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !validateForm()) {
      return
    }

    try {
      await onSubmit(user._id, formData)
      onClose()
    } catch (error) {
      console.error("Error submitting form:", error)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setErrors({})
      onClose()
    }
  }

  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Edit Student</h2>
              <p className="text-sm text-gray-600 mt-1">
                Editing: <span className="font-medium">{user.cfHandle}</span>
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Required Fields */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Required Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.name ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter full name"
                    disabled={loading}
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Codeforces Handle *
                  </label>
                  <input
                    type="text"
                    value={formData.handle}
                    onChange={(e) => handleInputChange("handle", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.handle ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter CF handle"
                    disabled={loading}
                  />
                  {errors.handle && <p className="text-red-500 text-sm mt-1">{errors.handle}</p>}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                Contact Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.email ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter email address"
                    disabled={loading}
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter phone number"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Personal Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Personal Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter first name"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter last name"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Location & Organization */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Location & Organization
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => handleInputChange("country", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter country"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter city"
                    disabled={loading}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization
                  </label>
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={(e) => handleInputChange("organization", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter organization/school/company"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="px-6"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="px-6 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  "Update Student"
                )}
              </Button>
            </div>
          </form>

          {/* Current CF Stats Display */}
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-start">
              <Globe className="w-5 h-5 text-gray-600 mr-2 mt-0.5" />
              <div className="text-sm text-gray-700">
                <p className="font-medium mb-2">Current Codeforces Stats</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-gray-500">Rating:</span>
                    <span className="ml-1 font-medium">{user.currentRating}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Max Rating:</span>
                    <span className="ml-1 font-medium">{user.maxRating}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Rank:</span>
                    <span className="ml-1 font-medium capitalize">{user.rank}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Contribution:</span>
                    <span className={`ml-1 font-medium ${user.contribution >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {user.contribution}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Note: CF stats (rating, rank, contribution) are automatically updated from Codeforces and cannot be edited manually.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}