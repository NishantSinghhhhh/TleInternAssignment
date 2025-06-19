// components/edit-user-modal.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, User, Mail, Globe, MapPin } from "lucide-react"

// Update your CFUser interface in the main page component to match the API response
export interface CFUser {
  _id: string
  name: string
  email?: string
  phone?: string
  handle?: string         // Original handle field (might be empty)
  cfHandle?: string       // This is what your API actually returns
  rating: number          // Changed from currentRating to rating
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
  lastCfSync?: string | null
  activeLast7Days: boolean
  reminderCount?: number  // From your data output
  inactivityEmailsEnabled?: boolean // From your data output
  inactivityTracking?: {
    lastSubmissionDate?: Date
    reminderCount: number
    lastReminderSent?: Date
  }
  emailNotifications?: {
    inactivityReminders: boolean
  }
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
        handle: user.cfHandle || user.handle || "",  // ← Fix this line
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
    } catch (error: any) {
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Edit Student</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Editing: <span className="font-medium text-foreground">{user.handle}</span>
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="p-2 hover:bg-accent rounded-full transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Required Fields */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center">
                <User className="w-5 h-5 mr-2" />
                Required Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className={`w-full px-3 py-2 bg-background border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground ${
                      errors.name ? "border-red-500" : "border-border"
                    }`}
                    placeholder="Enter full name"
                    disabled={loading}
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Codeforces Handle *
                  </label>
                  <input
                    type="text"
                    value={formData.handle}
                    onChange={(e) => handleInputChange("handle", e.target.value)}
                    className={`w-full px-3 py-2 bg-background border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground ${
                      errors.handle ? "border-red-500" : "border-border"
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
              <h3 className="text-lg font-semibold text-foreground flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                Contact Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={`w-full px-3 py-2 bg-background border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground ${
                      errors.email ? "border-red-500" : "border-border"
                    }`}
                    placeholder="Enter email address"
                    disabled={loading}
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                    placeholder="Enter phone number"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Personal Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center">
                <User className="w-5 h-5 mr-2" />
                Personal Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                    placeholder="Enter first name"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                    placeholder="Enter last name"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Location & Organization */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Location & Organization
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => handleInputChange("country", e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                    placeholder="Enter country"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                    placeholder="Enter city"
                    disabled={loading}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Organization
                  </label>
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={(e) => handleInputChange("organization", e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                    placeholder="Enter organization/school/company"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-border">
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
                className="px-6 bg-primary hover:bg-primary/90 text-primary-foreground"
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
          <div className="mt-6 p-4 bg-muted/30 border border-border rounded-lg">
            <div className="flex items-start">
              <Globe className="w-5 h-5 text-muted-foreground mr-2 mt-0.5" />
              <div className="text-sm text-foreground">
                <p className="font-medium mb-2">Current Codeforces Stats</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">Rating:</span>
                    <span className="ml-1 font-medium text-foreground">{user.rating}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Max Rating:</span>
                    <span className="ml-1 font-medium text-foreground">{user.maxRating}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Rank:</span>
                    <span className="ml-1 font-medium text-foreground capitalize">{user.rank}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Contribution:</span>
                    <span className={`ml-1 font-medium ${user.contribution >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {user.contribution}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
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