// components/table-controls.tsx
"use client"

import { Button } from "@/components/ui/button"
import { Download, Database, Save, UserPlus } from "lucide-react"

interface TableControlsProps {
  onLoadFromDatabase: () => void
  onAddUser: () => void
  onFetchFromAndSave: () => void
  onDownloadCSV: () => void
  currentPage: number
  totalUsers: number
  loading: boolean
}

export function TableControls({
  onLoadFromDatabase,
  onAddUser,
  onFetchFromAndSave,
  onDownloadCSV,
  currentPage,
  totalUsers,
  loading,
}: TableControlsProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Codeforces Users Management</h2>
       
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={onLoadFromDatabase}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Database className="w-4 h-4 mr-2" />
          Load from Database
        </Button>
         
        <Button
          onClick={onAddUser}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add User
        </Button>

        <Button
          onClick={onFetchFromAndSave}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          Fetch & Save from CF
        </Button>
         
        <Button
          onClick={onDownloadCSV}
          disabled={totalUsers === 0 || loading}
          variant="outline"
          className="border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          <Download className="w-4 h-4 mr-2" />
          Download CSV (Page {currentPage})
        </Button>
      </div>
    </div>
  )
}