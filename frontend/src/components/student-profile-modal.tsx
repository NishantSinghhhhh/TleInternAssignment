// components/student-profile-modal.tsx
"use client"

import { useState, useEffect } from "react"
import { X, ExternalLink, Calendar, Trophy, Target, TrendingUp, Activity, BarChart3 } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts"
import { GitHubHeatmap } from "@/components/github-heatmap"

interface CFUser {
  _id: string
  name: string
  cfHandle: string
  currentRating: number
  maxRating: number
  rank: string
  maxRank: string
  country?: string
  city?: string
  organization?: string
  avatar: string
  contribution: number
  friendOfCount: number
}

interface ContestHistoryData {
  contestId: number
  contestName: string
  date: string
  rank: number
  oldRating: number
  newRating: number
  ratingChange: number
  timestamp: number
}

interface ProblemSolvingData {
  stats: {
    totalProblems: number
    mostDifficultProblem: {
      name: string
      rating: number
      contestId: number
      index: string
    } | null
    averageRating: number
    averageProblemsPerDay: string
  }
  ratingBuckets: Record<string, number>
  heatMapData: {
    weeks: Array<Array<{
      date: string
      count: number
      dayOfWeek: number
      isInRange: boolean
      month: number
      day: number
    }>>
    monthLabels: Array<{
      month: string
      weekIndex: number
    }>
    totalContributions: number
    maxCount: number
  }
  recentProblems: Array<{
    name: string
    rating?: number
    contestId?: number
    index: string
    date: string
  }>
}

interface StudentProfileModalProps {
  isOpen: boolean
  user: CFUser | null
  onClose: () => void
}

export function StudentProfileModal({ isOpen, user, onClose }: StudentProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'contest' | 'problems'>('contest')
  const [contestFilter, setContestFilter] = useState('365')
  const [problemsFilter, setProblemsFilter] = useState('30')
  const [contestData, setContestData] = useState<ContestHistoryData[]>([])
  const [problemsData, setProblemsData] = useState<ProblemSolvingData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const api = {
    get: async (url: string) => {
      const response = await fetch(`http://localhost:8000${url}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    }
  }

  const fetchContestHistory = async () => {
    if (!user) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await api.get(`/students/${user._id}/contest-history?days=${contestFilter}`)
      setContestData(response.contestHistory || [])
    } catch (err: any) {
      console.error('Error fetching contest history:', err)
      setError('Failed to load contest history')
    } finally {
      setLoading(false)
    }
  }

  const fetchProblemSolving = async () => {
    if (!user) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await api.get(`/students/${user._id}/problem-solving?days=${problemsFilter}`)
      setProblemsData(response)
    } catch (err: any) {
      console.error('Error fetching problem solving data:', err)
      setError('Failed to load problem solving data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && user) {
      if (activeTab === 'contest') {
        fetchContestHistory()
      } else {
        fetchProblemSolving()
      }
    }
  }, [isOpen, user, activeTab, contestFilter, problemsFilter])

  if (!isOpen || !user) return null

  const ratingColors = {
    '800-999': '#8B5A2B',
    '1000-1199': '#008000',
    '1200-1399': '#03A89E',
    '1400-1599': '#0000FF',
    '1600-1799': '#AA00AA',
    '1800-1999': '#FF8C00',
    '2000-2199': '#FF8C00',
    '2200-2399': '#FF0000',
    '2400+': '#FF0000',
    'Unrated': '#808080'
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  const formatRatingChange = (change: number) => {
    return change > 0 ? `+${change}` : `${change}`
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 2400) return '#FF0000'
    if (rating >= 2100) return '#FF8C00'
    if (rating >= 1900) return '#AA00AA'
    if (rating >= 1600) return '#0000FF'
    if (rating >= 1400) return '#03A89E'
    if (rating >= 1200) return '#008000'
    if (rating >= 800) return '#8B5A2B'
    return '#808080'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 border-b pb-4">
            <div className="flex items-center space-x-4">
              <img 
                src={user.avatar} 
                alt={`${user.cfHandle}'s avatar`}
                className="w-16 h-16 rounded-full"
              />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <ExternalLink className="w-4 h-4 mr-1" />
                    <a 
                      href={`https://codeforces.com/profile/${user.cfHandle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {user.cfHandle}
                    </a>
                  </span>
                  <span style={{ color: getRatingColor(user.currentRating) }} className="font-semibold">
                    {user.currentRating} ({user.rank})
                  </span>
                  <span className="text-gray-500">
                    Max: {user.maxRating} ({user.maxRank})
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b mb-6">
            <button
              onClick={() => setActiveTab('contest')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'contest'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              Contest History
            </button>
            <button
              onClick={() => setActiveTab('problems')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'problems'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Target className="w-4 h-4 inline mr-2" />
              Problem Solving
            </button>
          </div>

          {/* Contest History Tab */}
          {activeTab === 'contest' && (
            <div className="space-y-6">
              {/* Filter Controls */}
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">Time Period:</span>
                {['30', '90', '365'].map((days) => (
                  <button
                    key={days}
                    onClick={() => setContestFilter(days)}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      contestFilter === days
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {days} days
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : error ? (
                <div className="text-red-600 text-center py-8">{error}</div>
              ) : (
                <>
                  {/* Rating Graph */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Rating Progress
                    </h3>
                    {contestData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={contestData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(value) => new Date(value).toLocaleDateString()}
                          />
                          <YAxis />
                          <Tooltip 
                            labelFormatter={(value) => new Date(value).toLocaleDateString()}
                            formatter={(value, name) => [value, 'Rating']}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="newRating" 
                            stroke="#2563eb" 
                            strokeWidth={2}
                            dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-gray-500 text-center py-8">
                        No contest data available for selected period
                      </div>
                    )}
                  </div>

                  {/* Contest List */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Trophy className="w-5 h-5 mr-2" />
                      Contest Results ({contestData.length} contests)
                    </h3>
                    {contestData.length > 0 ? (
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {contestData.map((contest, index) => (
                          <div key={index} className="bg-white rounded-lg p-3 border">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">
                                  {contest.contestName}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {formatDate(contest.timestamp)} • Rank: {contest.rank}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium">
                                  {contest.oldRating} → {contest.newRating}
                                </div>
                                <div className={`text-sm font-semibold ${
                                  contest.ratingChange >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {formatRatingChange(contest.ratingChange)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-center py-4">
                        No contests found for selected period
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Problem Solving Tab */}
          {activeTab === 'problems' && (
            <div className="space-y-6">
              {/* Filter Controls */}
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">Time Period:</span>
                {['7', '30', '365'].map((days) => (
                  <button
                    key={days}
                    onClick={() => setProblemsFilter(days)}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      problemsFilter === days
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {days} days
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : error ? (
                <div className="text-red-600 text-center py-8">{error}</div>
              ) : problemsData ? (
                <>
                  {/* Statistics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-700">
                        {problemsData.stats.totalProblems}
                      </div>
                      <div className="text-sm text-blue-600">Total Problems</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-700">
                        {problemsData.stats.averageRating || 'N/A'}
                      </div>
                      <div className="text-sm text-green-600">Average Rating</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-purple-700">
                        {problemsData.stats.averageProblemsPerDay}
                      </div>
                      <div className="text-sm text-purple-600">Problems/Day</div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-orange-700">
                        {problemsData.stats.mostDifficultProblem?.rating || 'N/A'}
                      </div>
                      <div className="text-sm text-orange-600">Hardest Problem</div>
                    </div>
                  </div>

                  {/* Rating Distribution Bar Chart */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2" />
                      Problems by Rating Range
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={Object.entries(problemsData.ratingBuckets).map(([range, count]) => ({
                        range,
                        count
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {Object.entries(problemsData.ratingBuckets).map(([range], index) => (
                            <Cell key={`cell-${index}`} fill={ratingColors[range as keyof typeof ratingColors]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Submission Heat Map - GitHub Style */}
                  <GitHubHeatmap 
                    data={problemsData.heatMapData} 
                    filterDays={parseInt(problemsFilter)} 
                  />

                  {/* Recent Problems */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4">Recent Problems Solved</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {problemsData.recentProblems.slice(0, 10).map((problem, index) => (
                        <div key={index} className="bg-white rounded-lg p-3 border">
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{problem.name}</div>
                              <div className="text-sm text-gray-600">
                                {problem.contestId && `${problem.contestId}${problem.index}`}
                              </div>
                            </div>
                            <div className="text-right">
                              {problem.rating && (
                                <div 
                                  className="text-sm font-semibold"
                                  style={{ color: getRatingColor(problem.rating) }}
                                >
                                  {problem.rating}
                                </div>
                              )}
                              <div className="text-xs text-gray-500">{problem.date}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-gray-500 text-center py-8">
                  No problem solving data available
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}