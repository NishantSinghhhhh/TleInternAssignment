"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { LoadingSpinner } from "@/components/loading-spinner"
import { ErrorMessage } from "@/components/error-message"
import { TableControls } from "@/components/table-controls"
import { PaginationInfo } from "@/components/pagination-info"
import { PaginationControls } from "@/components/pagination-controls"
import { UsersTable } from "@/components/user-table"
import { StatisticsCards } from "@/components/statistics-cards"
import { SearchBar } from "@/components/search-bar"
import { AddUserModal } from "@/components/add-user-modal"
import { EditUserModal } from "@/components/edit-user-modal"
import { DeleteConfirmationModal } from "@/components/delete-confirmation-modal"
import { StudentProfileModal } from "@/components/student-profile-modal"

// src/types/user.ts// Update your CFUser interface in the main page component to match the API response
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

interface EmailResponse {
  success: boolean;
  message: string;
  user?: { handle: string; email: string; name: string };
  timestamp?: string;
  error?: string;
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

interface PaginatedResponse {
  data: CFUser[]
  page: number
  limit: number
  totalPages: number
  totalCount: number
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,          // 15 s
  headers: { 'Content-Type': 'application/json' },
});

export default function CPSheetPage() {
  const [users, setUsers] = useState<CFUser[]>([])
  const [allUsers, setAllUsers] = useState<CFUser[]>([]) // Store all users for search
  const [filteredUsers, setFilteredUsers] = useState<CFUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  
  // Search states
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchMode, setIsSearchMode] = useState(false)
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isAddingUser, setIsAddingUser] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isEditingUser, setIsEditingUser] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeletingUser, setIsDeletingUser] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<CFUser | null>(null)

  const fetchFromDatabase = async (page: number = currentPage, limit: number = pageSize) => {
    setLoading(true)
    setError(null)

    try {
      const res = await api.get<PaginatedResponse>(`/students/list?page=${page}&limit=${limit}`)
      setUsers(res.data.data)
      setCurrentPage(res.data.page)
      setPageSize(res.data.limit)
      setTotalPages(res.data.totalPages)
      setTotalCount(res.data.totalCount)
      
      // If not in search mode, also update allUsers for search functionality
      if (!isSearchMode) {
        setAllUsers(res.data.data)
      }
      
      console.log('Fetched from database:', res.data)
    } catch (err: any) {
      console.error('Database fetch error:', err)
      setError(err.response?.data?.message || err.message || 'Failed to load users from database')
    } finally {
      setLoading(false)
    }
  }

  const fetchAllUsersForSearch = async () => {
    try {
      // Fetch a larger dataset for search - you might want to create a specific endpoint for this
      const res = await api.get<PaginatedResponse>(`/students/list?page=1&limit=1000`)
      setAllUsers(res.data.data)
      return res.data.data
    } catch (err: any) {
      console.error('Error fetching all users for search:', err)
      return allUsers // Return current allUsers if fetch fails
    }
  }

  const handleSendActivationMail = async (user: CFUser) => {
    try {
      const payload = {
        userId: user._id,
        emailType: 'inactivity_reminder',
        subject: 'Time to get back to competitive programming!',
        message: `Hi ${user.name}, we noticed you haven't been active on Codeforces lately. Come back and continue your coding journey!`
      };
  
      console.log('Sending email payload:', payload); // Debug log
  
      const { data } = await api.post<EmailResponse>('/email/send-to-user', payload);
  
      if (data.success) {
        alert(`🔔 Reminder email sent to ${user.cfHandle || user.handle}!`);
      } else {
        alert(`⚠️ ${data.error ?? data.message}`);
      }
    } catch (err: any) {
      console.error('Error sending activation email:', err);
      console.error('Response data:', err.response?.data); // More detailed error logging
      
      if (err.response?.data?.error) {
        alert(`❌ ${err.response.data.error}`);
      } else {
        alert('❌ Failed to send reminder email');
      }
    }
  };

  const fetchAndSave = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await api.get<CFUser[]>('/students/fetch-100?save=true')
      console.log('Fetched and saved:', res.data)
      alert('Successfully fetched and saved 100 users to database!')
      await fetchFromDatabase(1, pageSize)
    } catch (err: any) {
      console.error('Fetch and save error:', err)
      setError(err.response?.data?.message || err.message || 'Failed to fetch and save users')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    
    if (!query.trim()) {
      setIsSearchMode(false)
      setFilteredUsers([])
      // Return to original pagination
      await fetchFromDatabase(1, pageSize)
      return
    }

    setIsSearchMode(true)
    
    // If we don't have enough users loaded, fetch more for search
    if (allUsers.length < totalCount) {
      await fetchAllUsersForSearch()
    }

    // Perform client-side search
    const searchTerm = query.toLowerCase().trim()
    const filtered = allUsers.filter(user => 
      user.name?.toLowerCase().includes(searchTerm) ||
      user.handle?.toLowerCase().includes(searchTerm) ||
      user.country?.toLowerCase().includes(searchTerm) ||
      user.city?.toLowerCase().includes(searchTerm) ||
      user.organization?.toLowerCase().includes(searchTerm) ||
      user.firstName?.toLowerCase().includes(searchTerm) ||
      user.lastName?.toLowerCase().includes(searchTerm)
    )
    
    setFilteredUsers(filtered)
    setUsers(filtered)
    setCurrentPage(1)
    setTotalPages(1) // Show all results on one page for search
    setTotalCount(filtered.length)
  }

  const handleClearSearch = async () => {
    setSearchQuery("")
    setIsSearchMode(false)
    setFilteredUsers([])
    setCurrentPage(1)
    // Fetch fresh data from database
    await fetchFromDatabase(1, pageSize)
  }

  const handleAddStudent = () => {
    setIsAddModalOpen(true)
  }

  const handleAddUser = async (userData: UserFormData) => {
    setIsAddingUser(true)
    
    try {
      const response = await api.post('/students/create-student', userData)
      
      if (response.status === 201) {
        console.log('Student created successfully:', response.data)
        
        // Show success message
        alert(`Student "${userData.name}" has been created successfully!`)
        
        // Refresh the data to include the new user
        if (isSearchMode) {
          await handleClearSearch()
        } else {
          await fetchFromDatabase(currentPage, pageSize)
        }
        
        setIsAddModalOpen(false)
      }
    } catch (err: any) {
      console.error('Error creating student:', err)
      
      let errorMessage = 'Failed to create student'
      
      if (err.response?.status === 409) {
        errorMessage = 'A user with this handle already exists'
      } else if (err.response?.status === 400) {
        errorMessage = err.response.data?.error || 'Invalid data provided'
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error
      } else if (err.message) {
        errorMessage = err.message
      }
      
      alert(`Error: ${errorMessage}`)
    } finally {
      setIsAddingUser(false)
    }
  }

  const handleEdit = (user: CFUser) => {
    setSelectedUser(user)
    setIsEditModalOpen(true)
  }

  const handleDelete = (user: CFUser) => {
    setSelectedUser(user)
    setIsDeleteModalOpen(true)
  }

  const handleViewProfile = (user: CFUser) => {
    setSelectedUser(user)
    setIsProfileModalOpen(true)
  }

  const toggleAutoEmail = async (userId: string, enabled: boolean) => {
    try {
      // Call the general student update endpoint with emailNotifications
      const { data } = await api.put<{
        message: string;
        student: any; // Your formatted student type
        changesDetected: boolean;
        updatedFields?: string[];
        changesSummary?: Array<{
          field: string;
          oldValue: any;
          newValue: any;
        }>;
      }>(`/students/${userId}`, {
        emailNotifications: {
          inactivityReminders: enabled
        }
      });
  
      // Check if the update was successful
      if (data.changesDetected || data.message.includes('No changes detected')) {
        console.log(`✅ Auto-email setting updated for user ${userId}: ${enabled}`);
        
        // Reload the list to reflect the new value in UI
        if (isSearchMode) {
          await handleClearSearch();
        } else {
          await fetchFromDatabase(currentPage, pageSize);
        }
        
        // Optional: Show success message
        // You could use a toast notification instead of alert
        console.log(`📧 Inactivity email reminders ${enabled ? 'enabled' : 'disabled'}`);
        
      } else {
        console.warn('Update request completed but no changes were made');
      }
  
    } catch (err: any) {
      console.error('Error toggling auto email:', err);
      
      // Handle specific error cases
      if (err.response?.status === 404) {
        alert('❌ Student not found');
      } else if (err.response?.status === 400) {
        alert('❌ Invalid request format');
      } else {
        alert('❌ Failed to update auto-email setting');
      }
    }
  };
  
  const handleEditUser = async (userId: string, userData: UserUpdateData) => {
    setIsEditingUser(true)
    
    try {
      const response = await api.put(`/students/${userId}`, userData)
      
      if (response.status === 200) {
        console.log('Student updated successfully:', response.data)
        
        // Show success message
        alert(`Student "${userData.name}" has been updated successfully!`)
        
        // Refresh the data to reflect the changes
        if (isSearchMode) {
          await handleClearSearch()
        } else {
          await fetchFromDatabase(currentPage, pageSize)
        }
        
        setIsEditModalOpen(false)
        setSelectedUser(null)
      }
    } catch (err: any) {
      console.error('Error updating student:', err)
      
      let errorMessage = 'Failed to update student'
      
      if (err.response?.status === 409) {
        errorMessage = 'Another user with this handle already exists'
      } else if (err.response?.status === 400) {
        errorMessage = err.response.data?.error || 'Invalid data provided'
      } else if (err.response?.status === 404) {
        errorMessage = 'Student not found'
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error
      } else if (err.message) {
        errorMessage = err.message
      }
      
      alert(`Error: ${errorMessage}`)
    } finally {
      setIsEditingUser(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    setIsDeletingUser(true)
    
    try {
      const response = await api.delete(`/students/${userId}`)
      
      if (response.status === 200) {
        console.log('Student deleted successfully:', response.data)
        
        // Show success message
        alert('Student has been deleted successfully!')
        
        // Refresh the data to reflect the changes
        if (isSearchMode) {
          await handleClearSearch()
        } else {
          await fetchFromDatabase(currentPage, pageSize)
        }
        
        setIsDeleteModalOpen(false)
        setSelectedUser(null)
      }
    } catch (err: any) {
      console.error('Error deleting student:', err)
      
      let errorMessage = 'Failed to delete student'
      
      if (err.response?.status === 404) {
        errorMessage = 'Student not found'
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error
      } else if (err.message) {
        errorMessage = err.message
      }
      
      alert(`Error: ${errorMessage}`)
    } finally {
      setIsDeletingUser(false)
    }
  }

  const downloadCSV = () => {
    const dataToDownload = isSearchMode ? filteredUsers : users
    
    const header = [
      "Handle",
      "Name",
      "Current Rating",
      "Max Rating",
      "Rank",
      "Max Rank",
      "Country",
      "City",
      "Organization",
      "Contribution",
      "Friend Count",
    ]

    const rows = dataToDownload.map((user) => [
      user.handle,
      user.name,
      user.rating?.toString() || "",
      user.maxRating?.toString() || "",
      user.rank || "",
      user.maxRank || "",
      user.country || "",
      user.city || "",
      user.organization || "",
      user.contribution?.toString() || "0",
      user.friendOfCount?.toString() || "0",
    ])

    const csv = [header, ...rows]
      .map((row) => row.map((field) => `"${(field ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    const fileName = isSearchMode 
      ? `cf_users_search_${searchQuery.replace(/\s+/g, '_')}_${new Date().toISOString().split("T")[0]}.csv`
      : `cf_users_page_${currentPage}_${new Date().toISOString().split("T")[0]}.csv`
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && !isSearchMode) {
      setCurrentPage(newPage)
      fetchFromDatabase(newPage, pageSize)
    }
  }

  const handlePageSizeChange = (newPageSize: number) => {
    if (!isSearchMode) {
      setPageSize(newPageSize)
      setCurrentPage(1)
      fetchFromDatabase(1, newPageSize)
    }
  }

  useEffect(() => {
    fetchFromDatabase()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Users Data</h1>
          <p className="text-muted-foreground">Comprehensive Codeforces user database with ratings, rankings, and statistics</p>
        </div>

        <SearchBar
          searchQuery={searchQuery}
          isSearchMode={isSearchMode}
          totalCount={isSearchMode ? filteredUsers.length : totalCount}
          onSearch={handleSearch}
          onClearSearch={handleClearSearch}
          onAddStudent={handleAddStudent}
        />

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage message={error} onRetry={() => fetchFromDatabase()} />
        ) : (
          <>
            <TableControls
              onLoadFromDatabase={() => fetchFromDatabase(1, pageSize)}
              onAddUser={() => setIsAddModalOpen(true)}
              onFetchFromAndSave={fetchAndSave}
              onDownloadCSV={downloadCSV}
              currentPage={currentPage}
              totalUsers={users.length}
              loading={loading}
            />

            <PaginationInfo
              currentPage={currentPage}
              pageSize={pageSize}
              totalCount={totalCount}
              onPageSizeChange={handlePageSizeChange}
            />

            <UsersTable 
              users={users} 
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewProfile={handleViewProfile}
              onSendActivationMail={handleSendActivationMail}
              onToggleInactivityEmails={toggleAutoEmail} // Add this line
              loading={loading || isEditingUser || isDeletingUser}
            />

            <PaginationControls 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={handlePageChange} 
            />

            <StatisticsCards 
              users={users} 
              totalCount={isSearchMode ? filteredUsers.length : totalCount} 
            />
          </>
        )}

        {/* Student Profile Modal */}
        <StudentProfileModal
          isOpen={isProfileModalOpen}
          user={selectedUser}
          onClose={() => {
            setIsProfileModalOpen(false)
            setSelectedUser(null)
          }}
        />

        {/* Add User Modal */}
        <AddUserModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddUser}
          loading={isAddingUser}
        />

        {/* Edit User Modal */}
        <EditUserModal
          isOpen={isEditModalOpen}
          user={selectedUser}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedUser(null)
          }}
          onSubmit={handleEditUser}
          loading={isEditingUser}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          user={selectedUser}
          onClose={() => {
            setIsDeleteModalOpen(false)
            setSelectedUser(null)
          }}
          onConfirm={handleDeleteUser}
          loading={isDeletingUser}
        />
      </main>
    </div>
  )
}