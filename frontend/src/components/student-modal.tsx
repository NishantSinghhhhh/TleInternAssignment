// components/StudentModal.tsx
"use client"

import { useState } from "react"

interface CreateStudentData {
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

interface StudentModalProps {
  isOpen: boolean
  isEditMode: boolean
  initialData?: CreateStudentData
  actionLoading: boolean
  onClose: () => void
  onSubmit: (data: CreateStudentData) => void
}

export function StudentModal({
  isOpen,
  isEditMode,
  initialData,
  actionLoading,
  onClose,
  onSubmit,
}: StudentModalProps) {
  const [formData, setFormData] = useState<CreateStudentData>(
    initialData || {
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
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleClose = () => {
    setFormData({
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
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 z-50">
      <div className="relative mt-20 mx-auto w-full max-w-sm bg-background border border-border rounded-lg shadow-xl p-6">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-foreground">
            {isEditMode ? "Edit Student" : "Add New Student"}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-foreground">
              Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="mt-1 block w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
            />
          </div>

          {/* Handle */}
          <div>
            <label className="block text-sm font-medium text-foreground">
              Codeforces Handle *
            </label>
            <input
              type="text"
              required
              value={formData.handle}
              onChange={(e) =>
                setFormData({ ...formData, handle: e.target.value })
              }
              className="mt-1 block w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-foreground">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="mt-1 block w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-foreground">
              Phone
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="mt-1 block w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
            />
          </div>

          {/* First/Last */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground">
                First Name
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className="mt-1 block w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">
                Last Name
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                className="mt-1 block w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
              />
            </div>
          </div>

          {/* Country, City, Organization */}
          <div>
            <label className="block text-sm font-medium text-foreground">
              Country
            </label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) =>
                setFormData({ ...formData, country: e.target.value })
              }
              className="mt-1 block w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">
              City
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
              className="mt-1 block w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">
              Organization
            </label>
            <input
              type="text"
              value={formData.organization}
              onChange={(e) =>
                setFormData({ ...formData, organization: e.target.value })
              }
              className="mt-1 block w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-foreground bg-muted/30 rounded-lg hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {actionLoading
                ? isEditMode
                  ? "Updating..."
                  : "Creating..."
                : isEditMode
                ? "Update Student"
                : "Create Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
