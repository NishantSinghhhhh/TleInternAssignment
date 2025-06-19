// components/student-profile-modal.tsx
"use client"

import { useState, useEffect } from "react"
import { X, ExternalLink, Calendar, Trophy, Target, TrendingUp, BarChart3, AlertTriangle, BookOpen } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts"
import { GitHubHeatmap } from "@/components/github-heatmap"

// Update your CFUser interface in the main page component to match the API response
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

interface ContestHistoryData {
  contestId: number
  contestName: string
  date: string
  rank: number
  oldRating: number
  newRating: number
  ratingChange: number
  timestamp: number
  totalProblems: number
  unsolvedProblems: number
  solvedProblems: number
  problems: Array<{
    index: string
    name: string
    rating?: number
    tags: string[]
    solved: boolean
    url: string
  }>
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

interface WorkUponData {
  unsolvedProblems: Array<{
    name: string
    rating?: number
    contestId: number
    index: string
    tags: string[]
    url: string
    attempts: number
    lastAttempt?: string
    difficulty: 'Easy' | 'Medium' | 'Hard'
  }>
  weakTopics: Array<{
    topic: string
    totalProblems: number
    solvedProblems: number
    successRate: number
    averageRating: number
    recommendedProblems: Array<{
      name: string
      rating: number
      contestId: number
      index: string
      url: string
    }>
  }>
  recommendations: {
    nextRatingTarget: number
    suggestedDifficulty: string
    focusAreas: string[]
    practiceSchedule: string
  }
}

interface StudentProfileModalProps {
  isOpen: boolean
  user: CFUser | null
  onClose: () => void
}

export function StudentProfileModal({ isOpen, user, onClose }: StudentProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'contest' | 'problems' | 'work'>('contest')
  const [contestFilter, setContestFilter] = useState('365')
  const [problemsFilter, setProblemsFilter] = useState('30')
  const [workFilter, setWorkFilter] = useState('30')
  const [contestData, setContestData] = useState<ContestHistoryData[]>([])
  const [problemsData, setProblemsData] = useState<ProblemSolvingData | null>(null)
  const [workData, setWorkData] = useState<WorkUponData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedContests, setExpandedContests] = useState<Set<number>>(new Set())
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set())

  const toggleContestExpansion = (contestId: number) => {
    const newExpanded = new Set(expandedContests)
    if (newExpanded.has(contestId)) {
      newExpanded.delete(contestId)
    } else {
      newExpanded.add(contestId)
    }
    setExpandedContests(newExpanded)
  }

  const toggleTopicExpansion = (topic: string) => {
    const newExpanded = new Set(expandedTopics)
    if (newExpanded.has(topic)) {
      newExpanded.delete(topic)
    } else {
      newExpanded.add(topic)
    }
    setExpandedTopics(newExpanded)
  }

  const API_BASE_URL = import.meta.env.VITE_API_URL ?? ''

  const api = {
    get: async (url: string) => {
      const response = await fetch(`${API_BASE_URL}${url}`)
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

  const fetchWorkData = async () => {
    if (!user) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await api.get(`/students/${user._id}/work-upon?days=${workFilter}`)
      setWorkData(response)
    } catch (err: any) {
      console.error('Error fetching work data:', err)
      setError('Failed to load work recommendations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && user) {
      if (activeTab === 'contest') {
        fetchContestHistory()
      } else if (activeTab === 'problems') {
        fetchProblemSolving()
      } else if (activeTab === 'work') {
        fetchWorkData()
      }
    }
  }, [isOpen, user, activeTab, contestFilter, problemsFilter, workFilter])

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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/20'
      case 'Medium': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
      case 'Hard': return 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20'
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-500/10 border-gray-500/20'
    }
  }

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600 dark:text-green-400'
    if (rate >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-border">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
            <div className="flex items-center space-x-4">
              <img 
                src={user.avatar || 'https://userpic.codeforces.org/no-avatar.jpg'} 
                alt={`${user.cfHandle || user.handle}'s avatar`}
                className="w-16 h-16 rounded-full"
                onError={(e) => {
                  e.currentTarget.src = 'https://userpic.codeforces.org/no-avatar.jpg'
                }}
              />
              <div>
                <h2 className="text-2xl font-bold text-foreground">{user.name}</h2>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span className="flex items-center">
                    <ExternalLink className="w-4 h-4 mr-1" />
                    <a 
                      href={`https://codeforces.com/profile/${user.cfHandle || user.handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {user.cfHandle || user.handle}
                    </a>
                  </span>
                  <span style={{ color: getRatingColor(user.rating) }} className="font-semibold">
                    {user.rating} ({user.rank})
                  </span>
                  <span className="text-muted-foreground">
                    Max: {user.maxRating} ({user.maxRank})
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-accent rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-foreground" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border mb-6">
            <button
              onClick={() => setActiveTab('contest')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'contest'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              Contest History
            </button>
            <button
              onClick={() => setActiveTab('problems')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'problems'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Target className="w-4 h-4 inline mr-2" />
              Problem Solving
            </button>
            <button
              onClick={() => setActiveTab('work')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'work'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <BookOpen className="w-4 h-4 inline mr-2" />
              To Work Upon
            </button>
          </div>

          {/* Contest History Tab */}
          {activeTab === 'contest' && (
            <div className="space-y-6">
              {/* Filter Controls */}
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-foreground">Time Period:</span>
                {['7', '30', '90', '365'].map((days) => (
                  <button
                    key={days}
                    onClick={() => setContestFilter(days)}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      contestFilter === days
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {days} days
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : error ? (
                <div className="text-red-600 dark:text-red-400 text-center py-8">{error}</div>
              ) : (
                <>
                  {/* Rating Graph */}
                  <div className="bg-muted/30 rounded-lg p-4 border border-border">
                    <h3 className="text-lg font-semibold mb-4 flex items-center text-foreground">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Rating Progress
                    </h3>
                    {contestData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={contestData.slice().reverse()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          />
                          <YAxis 
                            domain={['dataMin - 50', 'dataMax + 50']}
                            tickFormatter={(value) => Math.round(value).toString()}
                          />
                          <Tooltip 
                            labelFormatter={(value) => `Date: ${new Date(value).toLocaleDateString()}`}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length > 0) {
                                const contest = payload[0].payload;
                                return (
                                  <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                                    <div className="space-y-1">
                                      <div className="font-semibold text-foreground">{contest.contestName || 'Contest'}</div>
                                      <div className="text-muted-foreground">Rating: {payload[0].value}</div>
                                      <div className={`font-medium ${
                                        (contest.ratingChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                                      }`}>
                                        Change: {(contest.ratingChange || 0) >= 0 ? '+' : ''}{contest.ratingChange || 0}
                                      </div>
                                      <div className="text-muted-foreground">Rank: #{contest.rank || 'N/A'}</div>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="newRating" 
                            stroke="#2563eb" 
                            strokeWidth={3}
                            dot={(props: any) => {
                              const { cx, cy, payload, index } = props;
                              const isPositive = (payload?.ratingChange || 0) >= 0;
                              return (
                                <g key={`dot-${index}`}>
                                  <circle
                                    cx={cx}
                                    cy={cy}
                                    r={6}
                                    fill={isPositive ? '#10b981' : '#ef4444'}
                                    stroke="#fff"
                                    strokeWidth={2}
                                  />
                                  <text
                                    x={cx}
                                    y={cy - 15}
                                    textAnchor="middle"
                                    className="text-xs font-semibold"
                                    fill={isPositive ? '#10b981' : '#ef4444'}
                                  >
                                    {(payload?.ratingChange || 0) >= 0 ? '+' : ''}{payload?.ratingChange || 0}
                                  </text>
                                </g>
                              );
                            }}
                            activeDot={{ r: 8, stroke: '#2563eb', strokeWidth: 2, fill: '#fff' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-muted-foreground text-center py-8">
                        No contest data available for selected period
                      </div>
                    )}
                  </div>

                  {/* Contest List */}
                  <div className="bg-muted/30 rounded-lg p-4 border border-border">
                    <h3 className="text-lg font-semibold mb-4 flex items-center text-foreground">
                      <Trophy className="w-5 h-5 mr-2" />
                      Contest Results ({contestData.length} contests)
                    </h3>
                    {contestData.length > 0 ? (
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {contestData.map((contest, index) => (
                          <div key={index} className="bg-background rounded-lg border border-border shadow-sm">
                            {/* Contest Header */}
                            <div className="p-4 border-b border-border">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                  <div className="font-medium text-foreground mb-1">
                                    {contest.contestName}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {formatDate(contest.timestamp)} • Rank: #{contest.rank}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-medium text-foreground">
                                    {contest.oldRating} → {contest.newRating}
                                  </div>
                                  <div className={`text-sm font-semibold ${
                                    contest.ratingChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                  }`}>
                                    {formatRatingChange(contest.ratingChange)}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Problem Solving Stats */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4 text-sm">
                                  <div className="flex items-center">
                                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    <span className="text-muted-foreground">Solved:</span>
                                    <span className="font-medium text-green-700 dark:text-green-400 ml-1">
                                      {contest.solvedProblems || 0}
                                    </span>
                                  </div>
                                  <div className="flex items-center">
                                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                                    <span className="text-muted-foreground">Unsolved:</span>
                                    <span className="font-medium text-red-700 dark:text-red-400 ml-1">
                                      {contest.unsolvedProblems || 0}
                                    </span>
                                  </div>
                                  <div className="flex items-center">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                                    <span className="text-muted-foreground">Total:</span>
                                    <span className="font-medium text-foreground ml-1">
                                      {contest.totalProblems || 0}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                  {(contest.totalProblems || 0) > 0 && (
                                    <div className="text-xs text-muted-foreground">
                                      {Math.round(((contest.solvedProblems || 0) / (contest.totalProblems || 1)) * 100)}% solved
                                    </div>
                                  )}
                                  <button
                                    onClick={() => toggleContestExpansion(contest.contestId)}
                                    className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
                                  >
                                    {expandedContests.has(contest.contestId) ? 'Hide Problems' : 'Show Problems'}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Expanded Problem List */}
                            {expandedContests.has(contest.contestId) && contest.problems && contest.problems.length > 0 && (
                              <div className="p-4">
                                <h4 className="font-medium text-foreground mb-3">Problems:</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {contest.problems.map((problem, problemIndex) => (
                                    <div
                                      key={problemIndex}
                                      className={`p-3 rounded-lg border transition-colors ${
                                        problem.solved 
                                          ? 'bg-green-500/10 border-green-500/20' 
                                          : 'bg-red-500/10 border-red-500/20'
                                      }`}
                                    >
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <div className="flex items-center mb-2">
                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-2 ${
                                              problem.solved 
                                                ? 'bg-green-500 text-white' 
                                                : 'bg-red-500 text-white'
                                            }`}>
                                              {problem.index}
                                            </span>
                                            <a
                                              href={problem.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className={`font-medium hover:underline transition-colors ${
                                                problem.solved 
                                                  ? 'text-green-800 dark:text-green-300 hover:text-green-900 dark:hover:text-green-200' 
                                                  : 'text-red-800 dark:text-red-300 hover:text-red-900 dark:hover:text-red-200'
                                              }`}
                                            >
                                              {problem.name}
                                            </a>
                                          </div>
                                          
                                          {problem.rating && (
                                            <div className="text-xs text-muted-foreground mb-1">
                                              Rating: <span 
                                                className="font-medium" 
                                                style={{ color: getRatingColor(problem.rating) }}
                                              >
                                                {problem.rating}
                                              </span>
                                            </div>
                                          )}
                                          
                                          {problem.tags && problem.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                              {problem.tags.slice(0, 3).map((tag, tagIndex) => (
                                                <span
                                                  key={tagIndex}
                                                  className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs"
                                                >
                                                  {tag}
                                                </span>
                                              ))}
                                              {problem.tags.length > 3 && (
                                                <span className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs">
                                                  +{problem.tags.length - 3} more
                                                </span>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                        
                                        <div className={`text-xs font-medium px-2 py-1 rounded ${
                                          problem.solved 
                                            ? 'bg-green-500/20 text-green-800 dark:text-green-300' 
                                            : 'bg-red-500/20 text-red-800 dark:text-red-300'
                                        }`}>
                                          {problem.solved ? 'Solved' : 'Unsolved'}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-muted-foreground text-center py-4">
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
                <span className="text-sm font-medium text-foreground">Time Period:</span>
                {['7', '30', '90', '365'].map((days) => (
                  <button
                    key={days}
                    onClick={() => setProblemsFilter(days)}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      problemsFilter === days
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {days} days
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : error ? (
                <div className="text-red-600 dark:text-red-400 text-center py-8">{error}</div>
              ) : problemsData ? (
                <>
                  {/* Statistics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                        {problemsData.stats.totalProblems}
                      </div>
                      <div className="text-sm text-blue-600 dark:text-blue-400">Total Problems</div>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                        {problemsData.stats.averageRating || 'N/A'}
                      </div>
                      <div className="text-sm text-green-600 dark:text-green-400">Average Rating</div>
                    </div>
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                      <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                        {problemsData.stats.averageProblemsPerDay}
                      </div>
                      <div className="text-sm text-purple-600 dark:text-purple-400">Problems/Day</div>
                    </div>
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                      <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                        {problemsData.stats.mostDifficultProblem?.rating || 'N/A'}
                      </div>
                      <div className="text-sm text-orange-600 dark:text-orange-400">Hardest Problem</div>
                    </div>
                  </div>

                  {/* Rating Distribution Bar Chart */}
                  <div className="bg-muted/30 rounded-lg p-4 border border-border">
                    <h3 className="text-lg font-semibold mb-4 flex items-center text-foreground">
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
                            <Cell 
                              key={`cell-${range}-${index}`} 
                              fill={ratingColors[range as keyof typeof ratingColors] || '#808080'} 
                            />
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
                  <div className="bg-muted/30 rounded-lg p-4 border border-border">
                    <h3 className="text-lg font-semibold mb-4 text-foreground">Recent Problems Solved</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {problemsData.recentProblems.slice(0, 10).map((problem, index) => (
                        <div key={index} className="bg-background rounded-lg p-3 border border-border">
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <div className="font-medium text-foreground">{problem.name}</div>
                              <div className="text-sm text-muted-foreground">
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
                              <div className="text-xs text-muted-foreground">{problem.date}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground text-center py-8">
                  No problem solving data available
                </div>
              )}
            </div>
          )}

          {/* To Work Upon Tab */}
          {activeTab === 'work' && (
            <div className="space-y-6">
              {/* Filter Controls */}
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-foreground">Time Period:</span>
                {['7', '30', '90', '365'].map((days) => (
                  <button
                    key={days}
                    onClick={() => setWorkFilter(days)}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      workFilter === days
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {days} days
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : error ? (
                <div className="text-red-600 dark:text-red-400 text-center py-8">{error}</div>
              ) : workData ? (
                <>
                  {/* Recommendations Overview */}
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4 flex items-center text-foreground">
                      <AlertTriangle className="w-5 h-5 mr-2" />
                      Personal Recommendations
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Next Rating Target:</div>
                        <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
                          {workData.recommendations.nextRatingTarget}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Suggested Difficulty:</div>
                        <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
                          {workData.recommendations.suggestedDifficulty}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Focus Areas:</div>
                        <div className="flex flex-wrap gap-1">
                          {workData.recommendations.focusAreas.map((area, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-500/20 text-blue-800 dark:text-blue-300 rounded text-xs"
                            >
                              {area}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Practice Schedule:</div>
                        <div className="text-sm font-medium text-foreground">
                          {workData.recommendations.practiceSchedule}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Unsolved Problems */}
                  <div className="bg-muted/30 rounded-lg p-4 border border-border">
                    <h3 className="text-lg font-semibold mb-4 flex items-center text-foreground">
                      <Target className="w-5 h-5 mr-2" />
                      Unsolved Problems to Retry ({workData.unsolvedProblems.length})
                    </h3>
                    {workData.unsolvedProblems.length > 0 ? (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {workData.unsolvedProblems.map((problem, index) => (
                          <div key={index} className="bg-background rounded-lg p-3 border border-border">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center mb-2">
                                  <span className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2">
                                    {problem.index}
                                  </span>
                                  <a
                                    href={problem.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-foreground hover:underline transition-colors"
                                  >
                                    {problem.name}
                                  </a>
                                </div>
                                
                                <div className="flex items-center space-x-4 text-sm mb-2">
                                  {problem.rating && (
                                    <div className="text-muted-foreground">
                                      Rating: <span 
                                        className="font-medium" 
                                        style={{ color: getRatingColor(problem.rating) }}
                                      >
                                        {problem.rating}
                                      </span>
                                    </div>
                                  )}
                                  <div className="text-muted-foreground">
                                    Attempts: <span className="font-medium text-foreground">{problem.attempts}</span>
                                  </div>
                                  {problem.lastAttempt && (
                                    <div className="text-muted-foreground">
                                      Last: <span className="font-medium text-foreground">{problem.lastAttempt}</span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center space-x-2">
                                  <span className={`px-2 py-1 rounded text-xs font-medium border ${getDifficultyColor(problem.difficulty)}`}>
                                    {problem.difficulty}
                                  </span>
                                  {problem.tags.slice(0, 3).map((tag, tagIndex) => (
                                    <span
                                      key={tagIndex}
                                      className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                  {problem.tags.length > 3 && (
                                    <span className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs">
                                      +{problem.tags.length - 3} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-muted-foreground text-center py-4">
                        No unsolved problems found for this period
                      </div>
                    )}
                  </div>

                  {/* Weak Topics */}
                  <div className="bg-muted/30 rounded-lg p-4 border border-border">
                    <h3 className="text-lg font-semibold mb-4 flex items-center text-foreground">
                      <BookOpen className="w-5 h-5 mr-2" />
                      Topics to Improve ({workData.weakTopics.length})
                    </h3>
                    {workData.weakTopics.length > 0 ? (
                      <div className="space-y-4">
                        {workData.weakTopics.map((topic, index) => (
                          <div key={index} className="bg-background rounded-lg border border-border">
                            <div className="p-4 border-b border-border">
                              <div className="flex justify-between items-center">
                                <div className="flex-1">
                                  <div className="font-medium text-foreground mb-2">{topic.topic}</div>
                                  <div className="flex items-center space-x-4 text-sm">
                                    <div className="text-muted-foreground">
                                      Progress: <span className="font-medium text-foreground">
                                        {topic.solvedProblems}/{topic.totalProblems}
                                      </span>
                                    </div>
                                    <div className="text-muted-foreground">
                                      Success Rate: <span className={`font-medium ${getSuccessRateColor(topic.successRate)}`}>
                                        {topic.successRate.toFixed(1)}%
                                      </span>
                                    </div>
                                    <div className="text-muted-foreground">
                                      Avg Rating: <span 
                                        className="font-medium" 
                                        style={{ color: getRatingColor(topic.averageRating) }}
                                      >
                                        {topic.averageRating}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => toggleTopicExpansion(topic.topic)}
                                  className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
                                >
                                  {expandedTopics.has(topic.topic) ? 'Hide Problems' : 'Show Recommended Problems'}
                                </button>
                              </div>
                            </div>

                            {/* Expanded Recommended Problems */}
                            {expandedTopics.has(topic.topic) && topic.recommendedProblems.length > 0 && (
                              <div className="p-4">
                                <h4 className="font-medium text-foreground mb-3">Recommended Problems:</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {topic.recommendedProblems.map((problem, problemIndex) => (
                                    <div
                                      key={problemIndex}
                                      className="p-3 rounded-lg border bg-green-500/10 border-green-500/20"
                                    >
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <div className="flex items-center mb-2">
                                            <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2">
                                              {problem.index}
                                            </span>
                                            <a
                                              href={problem.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="font-medium text-green-800 dark:text-green-300 hover:underline transition-colors"
                                            >
                                              {problem.name}
                                            </a>
                                          </div>
                                          
                                          <div className="text-xs text-muted-foreground">
                                            Rating: <span 
                                              className="font-medium" 
                                              style={{ color: getRatingColor(problem.rating) }}
                                            >
                                              {problem.rating}
                                            </span>
                                          </div>
                                        </div>
                                        
                                        <div className="text-xs font-medium px-2 py-1 rounded bg-green-500/20 text-green-800 dark:text-green-300">
                                          Recommended
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-muted-foreground text-center py-4">
                        No weak topics identified - great job!
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground text-center py-8">
                  No work recommendations available
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}