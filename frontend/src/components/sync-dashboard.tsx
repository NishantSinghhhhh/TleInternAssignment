// components/sync-dashboard.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { 
  RefreshCw, 
  Clock, 
  Settings, 
  Play, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Users, 
  Activity,
  Calendar,
  Zap,
  TrendingUp,
  BarChart3,
  ChevronDown,
  ChevronUp
} from "lucide-react"

interface SyncSettings {
  cronTime: string
  frequency: string
  timezone: string
  enabled: boolean
  batchSize: number
  delayBetweenBatches: number
}

interface SyncStatus {
  isRunning: boolean
  lastSyncStart?: string
  lastSyncEnd?: string
  lastSyncStatus: 'success' | 'failed' | 'partial' | 'running'
  lastSyncError?: string
  nextRunTime?: string
  usersSynced: number
  usersSkipped: number
  usersFailed: number
}

interface SyncStatistics {
  totalUsers: number
  usersWithSync: number
  recentSyncs: number
  totalSyncs: number
  avgSyncDuration: number
}

interface SyncData {
  settings: SyncSettings
  status: SyncStatus
  statistics: SyncStatistics
}

interface SyncLog {
  _id: string
  lastSyncStart: string
  lastSyncEnd: string
  lastSyncStatus: string
  usersSynced: number
  usersSkipped: number
  usersFailed: number
  lastSyncError?: string
  totalSyncs: number
}

interface UserSyncStatus {
  _id: string
  name: string
  handle: string
  rating: number
  rank: string
  lastCfSync?: string
  syncAge?: number
  needsSync: boolean
}

export function SyncDashboard() {
  const [syncData, setSyncData] = useState<SyncData | null>(null)
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([])
  const [usersSyncStatus, setUsersSyncStatus] = useState<UserSyncStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'users' | 'settings'>('overview')
  const [expandedSettings, setExpandedSettings] = useState(false)

  const api = {
    get: async (url: string) => {
      const response = await fetch(`http://localhost:8000${url}`)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      return await response.json()
    },
    post: async (url: string, data?: any) => {
      const response = await fetch(`http://localhost:8000${url}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: data ? JSON.stringify(data) : undefined
      })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      return await response.json()
    },
    put: async (url: string, data: any) => {
      const response = await fetch(`http://localhost:8000${url}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      return await response.json()
    }
  }

  const fetchSyncStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.get('/sync/status')
      setSyncData(data)
    } catch (err: any) {
      console.error('Error fetching sync status:', err)
      setError('Failed to load sync status')
    } finally {
      setLoading(false)
    }
  }

  const fetchSyncLogs = async () => {
    try {
      const data = await api.get('/sync/logs?limit=10')
      setSyncLogs(data.logs)
    } catch (err: any) {
      console.error('Error fetching sync logs:', err)
    }
  }

  const fetchUsersSyncStatus = async () => {
    try {
      const data = await api.get('/sync/users-status?limit=20')
      setUsersSyncStatus(data.users)
    } catch (err: any) {
      console.error('Error fetching users sync status:', err)
    }
  }

  const runManualSync = async () => {
    try {
      setSyncing(true)
      setError(null)
      await api.post('/sync/run')
      
      // Poll for status updates
      const pollInterval = setInterval(() => {
        fetchSyncStatus()
      }, 2000)

      // Stop polling after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval)
        setSyncing(false)
      }, 300000)

    } catch (err: any) {
      console.error('Error running manual sync:', err)
      setError(err.message || 'Failed to start manual sync')
      setSyncing(false)
    }
  }

  const syncSingleUser = async (handle: string) => {
    try {
      await api.post(`/sync/user/${handle}`)
      await fetchUsersSyncStatus() // Refresh users list
      alert(`User ${handle} synced successfully!`)
    } catch (err: any) {
      console.error('Error syncing user:', err)
      alert(`Failed to sync user ${handle}: ${err.message}`)
    }
  }

  useEffect(() => {
    fetchSyncStatus()
    fetchSyncLogs()
    fetchUsersSyncStatus()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchSyncStatus()
      if (activeTab === 'logs') fetchSyncLogs()
      if (activeTab === 'users') fetchUsersSyncStatus()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [activeTab])

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error || !syncData) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Sync Dashboard</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchSyncStatus} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  const { settings, status, statistics } = syncData

  const getStatusIcon = () => {
    if (status.isRunning || syncing) {
      return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
    }
    
    switch (status.lastSyncStatus) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'partial':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusText = () => {
    if (status.isRunning || syncing) {
      return 'Sync in progress...'
    }
    
    switch (status.lastSyncStatus) {
      case 'success':
        return 'Last sync completed successfully'
      case 'failed':
        return 'Last sync failed'
      case 'partial':
        return 'Last sync completed with warnings'
      default:
        return 'No sync data available'
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleString()
  }

  const formatNextRun = (dateString?: string) => {
    if (!dateString) return 'Not scheduled'
    const date = new Date(dateString)
    const now = new Date()
    const diffHours = Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60))
    
    if (diffHours < 24) {
      return `In ${diffHours} hours`
    } else {
      return `In ${Math.round(diffHours / 24)} days`
    }
  }

  const formatSyncAge = (hours?: number) => {
    if (hours === null || hours === undefined) return 'Never'
    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sync Dashboard</h1>
              <p className="text-sm text-gray-600">{getStatusText()}</p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button
              onClick={fetchSyncStatus}
              variant="outline"
              size="sm"
              disabled={status.isRunning || syncing}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            
            <Button
              onClick={runManualSync}
              disabled={status.isRunning || syncing || !settings.enabled}
              size="sm"
            >
              <Play className="w-4 h-4 mr-2" />
              {syncing ? 'Syncing...' : 'Run Sync'}
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-blue-700">{statistics.totalUsers}</div>
              <div className="text-sm text-blue-600">Total Users</div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-green-700">{status.usersSynced}</div>
              <div className="text-sm text-green-600">Last Synced</div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <div className="flex items-center">
            <AlertCircle className="w-8 h-8 text-yellow-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-yellow-700">{status.usersFailed}</div>
              <div className="text-sm text-yellow-600">Failed</div>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-purple-700">{statistics.totalSyncs}</div>
              <div className="text-sm text-purple-600">Total Syncs</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'logs', label: 'Sync Logs', icon: BarChart3 },
              { id: 'users', label: 'User Status', icon: Users },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Sync Schedule */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Sync Schedule
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`font-medium ${settings.enabled ? 'text-green-600' : 'text-red-600'}`}>
                        {settings.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Schedule:</span>
                      <span className="font-medium">{settings.cronTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Frequency:</span>
                      <span className="font-medium capitalize">{settings.frequency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Next Run:</span>
                      <span className="font-medium">{formatNextRun(status.nextRunTime)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Last Sync
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Started:</span>
                      <span className="font-medium">{formatDate(status.lastSyncStart)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Completed:</span>
                      <span className="font-medium">{formatDate(status.lastSyncEnd)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">{statistics.avgSyncDuration}s avg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Success Rate:</span>
                      <span className="font-medium">
                        {status.usersSynced > 0 
                          ? Math.round((status.usersSynced / (status.usersSynced + status.usersFailed)) * 100)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Display */}
              {status.lastSyncError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start">
                    <XCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-800">Last Sync Error</h4>
                      <p className="text-red-700 text-sm mt-1">{status.lastSyncError}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sync Logs Tab */}
          {activeTab === 'logs' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Sync History</h3>
                <Button onClick={fetchSyncLogs} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
              
              {syncLogs.length > 0 ? (
                <div className="space-y-3">
                  {syncLogs.map((log) => (
                    <div key={log._id} className="bg-gray-50 rounded-lg p-4 border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {log.lastSyncStatus === 'success' && <CheckCircle className="w-4 h-4 text-green-600" />}
                          {log.lastSyncStatus === 'failed' && <XCircle className="w-4 h-4 text-red-600" />}
                          {log.lastSyncStatus === 'partial' && <AlertCircle className="w-4 h-4 text-yellow-600" />}
                          <span className="font-medium capitalize">{log.lastSyncStatus}</span>
                        </div>
                        <span className="text-sm text-gray-600">{formatDate(log.lastSyncStart)}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Synced:</span>
                          <span className="font-medium text-green-700 ml-1">{log.usersSynced}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Skipped:</span>
                          <span className="font-medium text-yellow-700 ml-1">{log.usersSkipped}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Failed:</span>
                          <span className="font-medium text-red-700 ml-1">{log.usersFailed}</span>
                        </div>
                      </div>
                      {log.lastSyncError && (
                        <div className="mt-2 text-sm text-red-600">
                          Error: {log.lastSyncError}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No sync logs available
                </div>
              )}
            </div>
          )}

          {/* Users Status Tab */}
          {activeTab === 'users' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">User Sync Status</h3>
                <Button onClick={fetchUsersSyncStatus} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
              
              {usersSyncStatus.length > 0 ? (
                <div className="space-y-2">
                  {usersSyncStatus.map((user) => (
                    <div key={user._id} className="bg-gray-50 rounded-lg p-4 border">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div>
                              <div className="font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-600">@{user.handle}</div>
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-600">Rating:</span>
                              <span className="font-medium ml-1">{user.rating}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <div className={`text-sm font-medium ${
                              user.needsSync ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {formatSyncAge(user.syncAge)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {user.needsSync ? 'Needs sync' : 'Up to date'}
                            </div>
                          </div>
                          <Button
                            onClick={() => syncSingleUser(user.handle)}
                            size="sm"
                            variant="outline"
                            disabled={syncing}
                          >
                            <Zap className="w-4 h-4 mr-1" />
                            Sync
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No users found
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Sync Configuration</h3>
                <Button 
                  onClick={() => setExpandedSettings(!expandedSettings)}
                  variant="outline" 
                  size="sm"
                >
                  {expandedSettings ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
                  {expandedSettings ? 'Collapse' : 'Expand'}
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">Batch Size</div>
                  <div className="text-xl font-bold text-gray-900">{settings.batchSize}</div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">Delay Between Batches</div>
                  <div className="text-xl font-bold text-gray-900">{settings.delayBetweenBatches}ms</div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">Timezone</div>
                  <div className="text-xl font-bold text-gray-900">{settings.timezone}</div>
                </div>
              </div>

              {expandedSettings && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Settings className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800">Settings Configuration</h4>
                      <p className="text-yellow-700 text-sm mt-1">
                        Advanced sync settings can be configured through the API or admin panel. 
                        Contact your administrator to modify cron schedule, batch settings, or timezone.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}