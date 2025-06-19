// components/UsersTable.tsx
"use client"

import { UserAvatar } from "./user-avatar"
import { RatingBadge } from "./rating-badge"
import { Link } from "react-router-dom"
import {
  Edit2,
  Trash2,
  ExternalLink,
  Eye,
  Mail,
  CheckCircle,
  XCircle,
} from "lucide-react"
import * as Tooltip from "@radix-ui/react-tooltip"

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
  updatedAt?: string | null
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


interface UsersTableProps {
  users: CFUser[]
  onEdit?: (user: CFUser) => void
  onDelete?: (user: CFUser) => void
  onViewProfile?: (user: CFUser) => void
  onSendActivationMail?: (user: CFUser) => void
  onToggleInactivityEmails?: (userId: string, enabled: boolean) => void
  loading?: boolean
}

const formatLastUpdated = (updatedAt?: string) => {
  if (!updatedAt) return { text: "Never", colorClass: "text-red-600 dark:text-red-400" };
  
  const updateDate = new Date(updatedAt);
  const now = new Date();
  const diffHours = Math.floor((now.getTime() - updateDate.getTime()) / 3600000);
  
  // Format the actual date and time
  const formattedDateTime = updateDate.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  
  // Determine color based on how old it is
  let colorClass;
  if (diffHours < 1) {
    colorClass = "text-green-600 dark:text-green-400";
  } else if (diffHours < 24) {
    colorClass = "text-green-600 dark:text-green-400";
  } else if (diffHours < 48) {
    colorClass = "text-yellow-600 dark:text-yellow-400";
  } else {
    const diffDays = Math.floor(diffHours / 24);
    const isOld = diffDays > 7;
    colorClass = isOld ? "text-red-600 dark:text-red-400" : "text-yellow-600 dark:text-yellow-400";
  }
  
  return {
    text: formattedDateTime,
    colorClass: colorClass
  };
};

export function UsersTable({
  users,
  onEdit,
  onDelete,
  onViewProfile,
  onSendActivationMail,
  onToggleInactivityEmails,
  loading = false,
}: UsersTableProps) {
  // Helper function to get the handle from either field
  const getHandle = (user: CFUser): string => {
    return user.cfHandle || user.handle || 'No Handle'
  }

  const formatLastSync = (
    lastSync?: string | null
  ): {
    text: string
    colorClass: string
    bgClass: string
    borderClass: string
  } => {
    if (!lastSync) {
      return {
        text: "Never",
        colorClass: "text-red-600 dark:text-red-400",
        bgClass: "bg-red-500/10",
        borderClass: "border-red-500/20",
      }
    }
    const syncDate = new Date(lastSync)
    const now = new Date()
    const diffHours = Math.floor((now.getTime() - syncDate.getTime()) / 3600000)
    if (diffHours < 1) {
      return {
        text: "Just now",
        colorClass: "text-green-600 dark:text-green-400",
        bgClass: "bg-green-500/10",
        borderClass: "border-green-500/20",
      }
    } else if (diffHours < 24) {
      return {
        text: `${diffHours}h ago`,
        colorClass: "text-green-600 dark:text-green-400",
        bgClass: "bg-green-500/10",
        borderClass: "border-green-500/20",
      }
    } else if (diffHours < 48) {
      return {
        text: "Yesterday",
        colorClass: "text-yellow-600 dark:text-yellow-400",
        bgClass: "bg-yellow-500/10",
        borderClass: "border-yellow-500/20",
      }
    } else {
      const diffDays = Math.floor(diffHours / 24)
      const isOld = diffDays > 7
      return {
        text: `${diffDays}d ago`,
        colorClass: isOld
          ? "text-red-600 dark:text-red-400"
          : "text-yellow-600 dark:text-yellow-400",
        bgClass: isOld ? "bg-red-500/10" : "bg-yellow-500/10",
        borderClass: isOld ? "border-red-500/20" : "border-yellow-500/20",
      }
    }
  }

  const hasRecentSubmissions = (user: CFUser) => user.activeLast7Days

  if (users.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border p-12 text-center">
        <div className="text-muted-foreground text-lg">No users found</div>
        <p className="text-muted-foreground mt-2">Try fetching some data first!</p>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden mb-6">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-64">
                User
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-32">
                Handle
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-32">
                Current Rating
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-32">
                Max Rating
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-32">
                Rank
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-32">
                Last Updated
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-32">
                Sync Status
              </th>
              <th className="px-6 py-4 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider w-32">
                7-Day Activity
              </th>
              <th className="px-6 py-4 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider w-32">
                Reminders Sent
              </th>
              <th className="px-6 py-4 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider w-32">
                Auto-Email
              </th>
              {(onEdit ||
                onDelete ||
                onViewProfile ||
                onSendActivationMail) && (
                <th className="px-6 py-4 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider w-48">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => {
              const sync = formatLastSync(user.lastCfSync)
              const userHandle = getHandle(user) // Get handle using helper function
              
              return (
                <tr
                  key={user._id}
                  className="hover:bg-accent transition-colors"
                >
                  {/* User Info */}
                  <td className="px-6 py-4 whitespace-nowrap w-64">
                    <div className="flex items-center">
                      <UserAvatar
                        src={user.avatar}
                        alt={`${userHandle}'s avatar`}
                        handle={userHandle}
                      />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-foreground">
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user.name}
                        </div>
                        {user.email && (
                          <div className="text-xs text-muted-foreground">
                            {user.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Handle Link - FIXED */}
                  <td className="px-6 py-4 whitespace-nowrap w-32">
                    {userHandle !== 'No Handle' ? (
                      <Link
                        to={`https://codeforces.com/profile/${userHandle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center"
                      >
                        {userHandle}
                        <ExternalLink className="w-3 h-3 ml-1 text-foreground" />
                      </Link>
                    ) : (
                      <span className="text-muted-foreground italic">
                        No Handle
                      </span>
                    )}
                  </td>

                  {/* Ratings */}
                  <td className="px-6 py-4 whitespace-nowrap w-32">
                    <RatingBadge rating={user.rating} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap w-32">
                    <RatingBadge rating={user.maxRating} isMax />
                  </td>

                  {/* Rank */}
                  <td className="px-6 py-4 whitespace-nowrap w-32">
                    <span className="text-sm text-foreground capitalize">
                      {user.rank || "Unrated"}
                    </span>
                    {user.maxRank && user.maxRank !== user.rank && (
                      <div className="text-xs text-muted-foreground capitalize">
                        Max: {user.maxRank}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap w-32">
                <span
                  className={`text-sm ${formatLastUpdated(user.updatedAt ?? undefined).colorClass}`}
                  title={user.updatedAt ? `Last updated: ${new Date(user.updatedAt).toLocaleString()}` : "Never updated"}
                >
                  {formatLastUpdated(user.updatedAt ?? undefined).text}
                </span>
              </td>
                  {/* Sync Status */}
                  <td className="px-6 py-4 whitespace-nowrap w-32">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${sync.colorClass} ${sync.bgClass} border ${sync.borderClass}`}
                      title={
                        user.lastCfSync
                          ? `Last synced: ${new Date(
                              user.lastCfSync
                            ).toLocaleString()}`
                          : "Never synced"
                      }
                    >
                      {sync.text}
                    </span>
                  </td>
                    {/* Last Updated */}

                  {/* 7-Day Activity */}
                  <td className="px-6 py-4 whitespace-nowrap text-center w-32">
                    {hasRecentSubmissions(user) ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400">
                        <CheckCircle className="w-3 h-3 mr-1" /> Yes
                      </span>
                    ) : (
                      <Tooltip.Root delayDuration={200}>
                        <Tooltip.Trigger asChild>
                          <span
                            onClick={() => onSendActivationMail?.(user)}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted/30 text-foreground cursor-pointer hover:bg-accent border border-border"
                          >
                            <XCircle className="w-3 h-3 mr-1 text-red-600 dark:text-red-400" />{" "}
                            No
                          </span>
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                          <Tooltip.Content
                            side="top"
                            align="center"
                            sideOffset={5}
                            className="bg-popover text-popover-foreground rounded px-2 py-1 shadow-lg border border-border"
                          >
                            Click to send a "Please get active again" email
                            <Tooltip.Arrow className="fill-popover" />
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    )}
                  </td>

                  {/* Reminders - Updated to use backend field */}
                  <td className="px-6 py-4 whitespace-nowrap text-center w-32 text-foreground">
                    {user.reminderCount}
                  </td>

                  {/* Auto-Email Toggle - Updated to use backend field */}
                  <td className="px-6 py-4 whitespace-nowrap text-center w-32">
                    <div className="flex flex-col items-center space-y-1">
                      {/* Visual Status Indicator */}
                      {user.inactivityEmailsEnabled ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Enabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400">
                          <XCircle className="w-3 h-3 mr-1" />
                          Disabled
                        </span>
                      )}
                      
                      {/* Toggle Checkbox */}
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-primary accent-primary cursor-pointer"
                        checked={user.inactivityEmailsEnabled}
                        disabled={loading}
                        onChange={() =>
                          onToggleInactivityEmails?.(
                            user._id,
                            !user.inactivityEmailsEnabled
                          )
                        }
                        title={`Click to ${user.inactivityEmailsEnabled ? 'disable' : 'enable'} inactivity email reminders`}
                      />
                    </div>
                  </td>

                  {/* Actions */}
                  {(onEdit ||
                    onDelete ||
                    onViewProfile ||
                    onSendActivationMail) && (
                    <td className="px-6 py-4 whitespace-nowrap text-center w-48">
                      <div className="flex items-center justify-center space-x-1">
                        {onViewProfile && (
                          <button
                            onClick={() => onViewProfile(user)}
                            disabled={loading}
                            className="p-2 text-green-600 dark:text-green-400 hover:bg-accent rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="View profile details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(user)}
                            disabled={loading}
                            className="p-2 text-primary hover:bg-accent rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Edit user"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {onSendActivationMail && (
                          <button
                            onClick={() => onSendActivationMail(user)}
                            disabled={loading || !user.email}
                            className="p-2 text-purple-600 dark:text-purple-400 hover:bg-accent rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={
                              user.email
                                ? "Send activation mail"
                                : "No email available"
                            }
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(user)}
                            disabled={loading}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-accent rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}