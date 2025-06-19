// components/sync-dashboard.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { 
  RefreshCw, 
  Clock, 
  Play, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Users, 
  Activity,
  Calendar,
  Zap,
  TrendingUp,
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
  const [syncLogs,setSyncLogs] = useState<SyncLog[]>([])
  const [usersSyncStatus, setUsersSyncStatus] = useState<UserSyncStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'users' | 'settings'>('overview')
  
  const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

const api = {
  get: async (url: string) => {
    const res = await fetch(`${API_BASE_URL}${url}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return res.json();
  },
  post: async (url: string, data?: any) => {
    const res = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return res.json();
  },
  put: async (url: string, data: any) => {
    const res = await fetch(`${API_BASE_URL}${url}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return res.json();
  },
};

  if(syncLogs){
    
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
      <div className="bg-background rounded-lg border border-border p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error || !syncData) {
    return (
      <div className="bg-background rounded-lg border border-border p-6">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Sync Dashboard</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
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
      return <RefreshCw className="w-5 h-5 text-primary animate-spin" />
    }
    
    switch (status.lastSyncStatus) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
      case 'partial':
        return <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />
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
      <div className="bg-background rounded-lg border border-border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div>
              <h1 className="text-2xl font-bold text-foreground">Sync Dashboard</h1>
              <p className="text-sm text-muted-foreground">{getStatusText()}</p>
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
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600 dark:text-blue-400 mr-3" />
            <div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{statistics.totalUsers}</div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Total Users</div>
            </div>
          </div>
        </div>

        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 mr-3" />
            <div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">{status.usersSynced}</div>
              <div className="text-sm text-green-600 dark:text-green-400">Last Synced</div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400 mr-3" />
            <div>
              <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{status.usersFailed}</div>
              <div className="text-sm text-yellow-600 dark:text-yellow-400">Failed</div>
            </div>
          </div>
        </div>

        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400 mr-3" />
            <div>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{statistics.totalSyncs}</div>
              <div className="text-sm text-purple-600 dark:text-purple-400">Total Syncs</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-background rounded-lg border border-border">
        <div className="border-b border-border">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'users', label: 'User Status', icon: Users },
    
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
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
                  <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Sync Schedule
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className={`font-medium ${settings.enabled ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {settings.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Schedule:</span>
                      <span className="font-medium text-foreground">{settings.cronTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Frequency:</span>
                      <span className="font-medium text-foreground capitalize">{settings.frequency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Next Run:</span>
                      <span className="font-medium text-foreground">{formatNextRun(status.nextRunTime)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Last Sync
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Started:</span>
                      <span className="font-medium text-foreground">{formatDate(status.lastSyncStart)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Completed:</span>
                      <span className="font-medium text-foreground">{formatDate(status.lastSyncEnd)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium text-foreground">{statistics.avgSyncDuration}s avg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Success Rate:</span>
                      <span className="font-medium text-foreground">
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
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-start">
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-800 dark:text-red-300">Last Sync Error</h4>
                      <p className="text-red-700 dark:text-red-300 text-sm mt-1">{status.lastSyncError}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Users Status Tab */}
          {activeTab === 'users' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">User Sync Status</h3>
                <Button onClick={fetchUsersSyncStatus} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
              
              {usersSyncStatus.length > 0 ? (
                <div className="space-y-2">
                  {usersSyncStatus.map((user) => (
                    <div key={user._id} className="bg-muted/30 rounded-lg p-4 border border-border">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div>
                              <div className="font-medium text-foreground">{user.name}</div>
                              <div className="text-sm text-muted-foreground">@{user.handle}</div>
                            </div>
                            <div className="text-sm">
                              <span className="text-muted-foreground">Rating:</span>
                              <span className="font-medium text-foreground ml-1">{user.rating}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <div className={`text-sm font-medium ${
                              user.needsSync ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                            }`}>
                              {formatSyncAge(user.syncAge)}
                            </div>
                            <div className="text-xs text-muted-foreground">
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
                <div className="text-center py-8 text-muted-foreground">
                  No users found
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}