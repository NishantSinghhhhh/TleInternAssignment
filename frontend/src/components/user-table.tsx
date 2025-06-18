// components/user-table.tsx
import React from "react";
import { UserAvatar } from "./user-avatar";
import { RatingBadge } from "./rating-badge";
import { Link } from "react-router-dom";
import { Edit2, Trash2, ExternalLink, Eye } from "lucide-react";

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
}

interface UsersTableProps {
  users: CFUser[];
  onEdit?: (user: CFUser) => void;
  onDelete?: (user: CFUser) => void;
  onViewProfile?: (user: CFUser) => void;
  loading?: boolean;
}

export function UsersTable({ users, onEdit, onDelete, onViewProfile, loading = false }: UsersTableProps) {
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
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Handle
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Rating
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Max Rating
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Organization
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contribution
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Friends
              </th>
              {(onEdit || onDelete || onViewProfile) && (
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
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
                <td className="px-6 py-4 whitespace-nowrap">
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
                <td className="px-6 py-4 whitespace-nowrap">
                  <RatingBadge rating={user.currentRating} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <RatingBadge rating={user.maxRating} isMax />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900 capitalize">
                    {user.rank || 'Unrated'}
                  </span>
                  {user.maxRank && user.maxRank !== user.rank && (
                    <div className="text-xs text-gray-500 capitalize">
                      Max: {user.maxRank}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {user.country && user.city
                      ? `${user.city}, ${user.country}`
                      : user.country || user.city || 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {user.organization || 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.contribution >= 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {user.contribution > 0 ? '+' : ''}{user.contribution}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {user.friendOfCount || 0}
                  </span>
                </td>
                {(onEdit || onDelete || onViewProfile) && (
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center space-x-2">
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}