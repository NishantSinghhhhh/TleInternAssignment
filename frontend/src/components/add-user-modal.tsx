// components/add-user-modal.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, User, Mail, Globe, MapPin, Save, RotateCcw } from "lucide-react"

interface AddUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (userData: UserFormData) => Promise<void>
  loading: boolean
}

interface UserFormData {
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

const STORAGE_KEY = 'cp31_add_user_form_data'

// Default form data
const defaultFormData: UserFormData = {
  name: "",
  email: "",
  phone: "",
  handle: "",
  firstName: "",
  lastName: "",
  country: "",
  city: "",
  organization: "",
}

export function AddUserModal({ isOpen, onClose, onSubmit, loading }: AddUserModalProps) {
  const [formData, setFormData] = useState<UserFormData>(defaultFormData)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [hasStoredData, setHasStoredData] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  // Load saved form data when component mounts or modal opens
  useEffect(() => {
    if (isOpen) {
      loadSavedFormData()
    }
  }, [isOpen])

  // Save form data to localStorage whenever formData changes
  useEffect(() => {
    if (isOpen && hasStoredData) {
      saveFormData()
    }
  }, [formData, isOpen, hasStoredData])

  const loadSavedFormData = () => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY)
      if (savedData) {
        const parsedData = JSON.parse(savedData)
        // Validate that the saved data has the correct structure
        if (parsedData && typeof parsedData === 'object') {
          setFormData({ ...defaultFormData, ...parsedData })
          setHasStoredData(true)
          console.log('📂 Loaded saved form data:', parsedData)
        }
      }
    } catch (error: any) {
      console.error('Error loading saved form data:', error)
      // If there's an error, clear the corrupted data
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  const saveFormData = () => {
    try {
      // Only save if at least one field has meaningful data
      const hasData = Object.values(formData).some(value => value && value.trim() !== '')
      if (hasData) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formData))
        console.log('💾 Saved form data to localStorage')
      }
    } catch (error: any) {
      console.error('Error saving form data:', error)
    }
  }

  const clearSavedData = () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      setFormData(defaultFormData)
      setHasStoredData(false)
      setShowClearConfirm(false)
      console.log('🗑️ Cleared saved form data')
    } catch (error: any) {
      console.error('Error clearing saved data:', error)
    }
  }

  const handleInputChange = (field: keyof UserFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setHasStoredData(true) // Mark that we now have data to save
    
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
    
    if (!validateForm()) {
      return
    }

    try {
      await onSubmit(formData)
      
      // After successful submission, you can choose to:
      // Option 1: Keep the data for next time (current behavior)
      // Option 2: Clear the data after successful submission
      // Uncomment the next line if you want to clear data after submission:
      // clearSavedData()
      
      setErrors({})
      onClose()
    } catch (error: any) {
      console.error("Error submitting form:", error)
    }
  }

  const handleClose = () => {
    if (!loading) {
      // Don't clear form data when closing - keep it for next time
      setErrors({})
      setShowClearConfirm(false)
      onClose()
    }
  }

  const resetForm = () => {
    setFormData(defaultFormData)
    setErrors({})
    setHasStoredData(false)
    setShowClearConfirm(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Add New Student</h2>
              {hasStoredData && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  📂 Form data restored from previous session
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {hasStoredData && (
                <div className="flex space-x-1">
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    disabled={loading}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full transition-colors disabled:opacity-50"
                    title="Clear saved data"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              )}
              <button
                onClick={handleClose}
                disabled={loading}
                className="p-2 hover:bg-accent rounded-full transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
            </div>
          </div>

          {/* Clear confirmation dialog */}
          {showClearConfirm && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">Clear saved form data?</p>
                  <p className="text-xs text-red-600 dark:text-red-300 mt-1">This will reset all fields and remove saved data.</p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowClearConfirm(false)}
                    className="text-muted-foreground"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={clearSavedData}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          )}

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
            <div className="flex justify-between pt-6 border-t border-border">
              <div className="flex space-x-2">
                {hasStoredData && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    disabled={loading}
                    className="px-4 text-muted-foreground"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset Form
                  </Button>
                )}
              </div>
              
              <div className="flex space-x-3">
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
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Create Student
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>

          {/* Info Notes */}
          <div className="mt-6 space-y-3">
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <div className="flex items-start">
                <Globe className="w-5 h-5 text-primary mr-2 mt-0.5" />
                <div className="text-sm text-foreground">
                  <p className="font-medium mb-1">Automatic Data Fetching</p>
                  <p className="text-muted-foreground">
                    When you provide a valid Codeforces handle, we'll automatically fetch additional information 
                    like rating, rank, and other profile details from Codeforces. Any missing information will 
                    be filled in automatically if available.
                  </p>
                </div>
              </div>
            </div>

            {hasStoredData && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-start">
                  <Save className="w-5 h-5 text-green-600 dark:text-green-400 mr-2 mt-0.5" />
                  <div className="text-sm text-foreground">
                    <p className="font-medium mb-1">Form Data Saved</p>
                    <p className="text-muted-foreground">
                      Your form data is automatically saved locally and will be restored when you reopen this modal. 
                      Use the reset button to clear saved data if needed.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}