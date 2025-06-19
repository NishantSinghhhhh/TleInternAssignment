// components/user-table.tsx

import { UserAvatar } from "./user-avatar";
import { RatingBadge } from "./rating-badge";
import { Link } from "react-router-dom";
import { Edit2, Trash2, ExternalLink, Eye, Mail, CheckCircle, XCircle } from "lucide-react";
import * as Tooltip from '@radix-ui/react-tooltip'

interface CFUser {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  cfHandle: string;
  currentRating: number;
  maxRating: number;
  rank: string;
  maxRank: string;
  country?: string;
  city?: string;
  organization?: string;
  avatar: string;
  contribution: number;
  friendOfCount: number;
  firstName?: string;
  lastName?: string;
  lastCfSync?: string | null;
  // New flag for 7-day activity
  activeLast7Days: boolean;
}

interface UsersTableProps {
  users: CFUser[];
  onEdit?: (user: CFUser) => void;
  onDelete?: (user: CFUser) => void;
  onViewProfile?: (user: CFUser) => void;
  onSendActivationMail?: (user: CFUser) => void;
  loading?: boolean;
}

export function UsersTable({ 
  users, 
  onEdit, 
  onDelete, 
  onViewProfile, 
  onSendActivationMail,
  loading = false 
}: UsersTableProps) {
  
  const formatLastSync = (lastSync?: string | null) => {
    if (!lastSync || lastSync === null) {
      return { text: 'Never', color: 'text-red-600', bg: 'bg-red-50', synced: false }
    }
    
    const syncDate = new Date(lastSync)
    const now = new Date()
    const diffHours = Math.floor((now.getTime() - syncDate.getTime()) / (1000 * 60 * 60))
    
    if (diffHours < 1) {
      return { text: 'Just now', color: 'text-green-600', bg: 'bg-green-50', synced: true }
    } else if (diffHours < 24) {
      return { text: `${diffHours}h ago`, color: 'text-green-600', bg: 'bg-green-50', synced: true }
    } else if (diffHours < 48) {
      return { text: 'Yesterday', color: 'text-yellow-600', bg: 'bg-yellow-50', synced: true }
    } else {
      const diffDays = Math.floor(diffHours / 24)
      return { 
        text: `${diffDays}d ago`, 
        color: diffDays > 7 ? 'text-red-600' : 'text-yellow-600',
        bg: diffDays > 7 ? 'bg-red-50' : 'bg-yellow-50',
        synced: diffDays <= 7
      }
    }
  }

  // Use the new activeLast7Days property directly
  const hasRecentSubmissions = (user: CFUser): boolean => user.activeLast7Days;

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <div className="text-gray-500 text-lg">No users found</div>
        <p className="text-gray-400 mt-2">Try fetching some data first!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">
                User
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                Handle
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                Current Rating
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                Max Rating
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                Rank
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                Sync Status
              </th>
              <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                7-Day Activity
              </th>
              {(onEdit || onDelete || onViewProfile || onSendActivationMail) && (
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => {
              const syncStatus = formatLastSync(user.lastCfSync);
              
              return (
                <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap w-64">
                    <div className="flex items-center">
                      <UserAvatar 
                        src={user.avatar} 
                        alt={`${user.cfHandle}'s avatar`} 
                        handle={user.cfHandle} 
                      />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user.name}
                        </div>
                        {user.email && (
                          <div className="text-xs text-gray-500">{user.email}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap w-32">
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`https://codeforces.com/profile/${user.cfHandle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 font-medium hover:underline flex items-center"
                      >
                        {user.cfHandle}
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </Link>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap w-32">
                    <RatingBadge rating={user.currentRating} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap w-32">
                    <RatingBadge rating={user.maxRating} isMax />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap w-32">
                    <span className="text-sm text-gray-900 capitalize">
                      {user.rank || 'Unrated'}
                    </span>
                    {user.maxRank && user.maxRank !== user.rank && (
                      <div className="text-xs text-gray-500 capitalize">
                        Max: {user.maxRank}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap w-32">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${syncStatus.color} ${syncStatus.bg}`}
                      title={user.lastCfSync ? `Last synced: ${new Date(user.lastCfSync).toLocaleString()}` : 'Never synced'}
                    >
                      {syncStatus.text}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center w-32">
                {hasRecentSubmissions(user) ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" /> Yes
                  </span>
                ) : (
                  <Tooltip.Root delayDuration={200}>
                    <Tooltip.Trigger asChild>
                      <span
                        onClick={() => onSendActivationMail?.(user)}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 cursor-pointer hover:bg-gray-200"
                      >
                        <XCircle className="w-3 h-3 mr-1" /> No
                      </span>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content side="top" align="center" sideOffset={5} className="bg-gray-700 text-white text-xs rounded px-2 py-1 shadow-lg">
                        Click to send a “Please get active again” email
                        <Tooltip.Arrow className="fill-gray-700" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                )}
              </td>

                  {(onEdit || onDelete || onViewProfile || onSendActivationMail) && (
                    <td className="px-6 py-4 whitespace-nowrap text-center w-48">
                      <div className="flex items-center justify-center space-x-1">
                        {onViewProfile && (
                          <button
                            onClick={() => onViewProfile(user)}
                            disabled={loading}
                            className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="View profile details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(user)}
                            disabled={loading}
                            className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Edit user"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {onSendActivationMail && (
                          <button
                            onClick={() => onSendActivationMail(user)}
                            disabled={loading || !user.email}
                            className="p-2 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={user.email ? "Send activation mail" : "No email available"}
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(user)}
                            disabled={loading}
                            className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
  );
}
