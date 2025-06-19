// components/delete-confirmation-modal.tsx
"use client"

import { Button } from "@/components/ui/button"
import { AlertTriangle, X } from "lucide-react"

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

interface DeleteConfirmationModalProps {
  isOpen: boolean
  user: CFUser | null
  onClose: () => void
  onConfirm: (userId: string) => Promise<void>
  loading: boolean
}

export function DeleteConfirmationModal({ 
  isOpen, 
  user, 
  onClose, 
  onConfirm, 
  loading 
}: DeleteConfirmationModalProps) {
  
  const handleConfirm = async () => {
    if (user) {
      await onConfirm(user._id)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg shadow-xl max-w-md w-full border border-border">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="ml-3 text-lg font-semibold text-foreground">
                Delete Student
              </h2>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="p-1 hover:bg-accent rounded-full transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to delete this student? This action cannot be undone.
            </p>
            
            {/* User Details */}
            <div className="bg-muted/30 rounded-lg p-4 border border-border">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Name:</span>
                  <span className="text-sm text-foreground">{user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Handle:</span>
                  <span className="text-sm text-foreground">{user.handle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Rating:</span>
                  <span className="text-sm text-foreground">{user.rating}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Rank:</span>
                  <span className="text-sm text-foreground capitalize">{user.rank}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Warning Message */}
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 mr-2" />
              <div className="text-sm text-red-700 dark:text-red-300">
                <p className="font-medium">Warning</p>
                <p>This will permanently remove the student from your database. All associated data will be lost.</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="px-4"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={loading}
              className="px-4 bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                "Delete Student"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}