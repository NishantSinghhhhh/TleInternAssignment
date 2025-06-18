// components/delete-confirmation-modal.tsx
"use client"

import { Button } from "@/components/ui/button"
import { AlertTriangle, X } from "lucide-react"

interface CFUser {
  _id: string
  name: string
  cfHandle: string
  currentRating: number
  rank: string
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="ml-3 text-lg font-semibold text-gray-900">
                Delete Student
              </h2>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete this student? This action cannot be undone.
            </p>
            
            {/* User Details */}
            <div className="bg-gray-50 rounded-lg p-4 border">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Name:</span>
                  <span className="text-sm text-gray-900">{user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Handle:</span>
                  <span className="text-sm text-gray-900">{user.cfHandle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Rating:</span>
                  <span className="text-sm text-gray-900">{user.currentRating}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Rank:</span>
                  <span className="text-sm text-gray-900 capitalize">{user.rank}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Warning Message */}
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 mr-2" />
              <div className="text-sm text-red-700">
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