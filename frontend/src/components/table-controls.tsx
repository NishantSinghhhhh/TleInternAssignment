// components/TableControls.tsx
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
    <div className="bg-background rounded-lg border border-border p-6 mb-6">
      <h2 className="text-2xl font-bold text-foreground mb-6">
        Codeforces Users Management
      </h2>

      <div className="flex flex-wrap gap-3">
        <Button
          onClick={onLoadFromDatabase}
          disabled={loading}
          className="bg-green-600 dark:bg-green-500 hover:bg-green-500 dark:hover:bg-green-400 text-white"
        >
          <Database className="w-4 h-4 mr-2" />
          Load from Database
        </Button>

        <Button
          onClick={onAddUser}
          disabled={loading}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add User
        </Button>


        <Button
          onClick={onDownloadCSV}
          disabled={totalUsers === 0 || loading}
          variant="outline"
          className="border-border text-foreground hover:bg-accent"
        >
          <Download className="w-4 h-4 mr-2" />
          Download CSV (Page {currentPage})
        </Button>
      </div>
    </div>
  )
}