// hooks/use-student-api.ts

import { useState } from 'react'
import axios from 'axios'

interface CFUser {
  _id: string
  name: string
  email?: string
  phone?: string
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
  firstName?: string
  lastName?: string
}

interface PaginatedResponse {
  data: CFUser[]
  page: number
  limit: number
  totalPages: number
  totalCount: number
  query?: string
}

interface CreateStudentData {
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

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export function useStudentApi() {
  const [actionLoading, setActionLoading] = useState(false)

  // Fetch students from database with pagination
  const fetchFromDatabase = async (page: number = 1, limit: number = 10): Promise<PaginatedResponse> => {
    const res = await api.get<PaginatedResponse>(`/students/list?page=${page}&limit=${limit}`)
    return res.data
  }

  // Search students
  const searchStudents = async (query: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse> => {
    const res = await api.get<PaginatedResponse>(`/students/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`)
    return res.data
  }

  // Fetch 100 users from CF API
  const fetchFromAPI = async (): Promise<CFUser[]> => {
    const res = await api.get<CFUser[]>('/students/fetch-100')
    return res.data
  }

  // Fetch and save 100 users to database
  const fetchAndSave = async (): Promise<CFUser[]> => {
    const res = await api.get<CFUser[]>('/students/fetch-100?save=true')
    return res.data
  }

  // Create new student
  const createStudent = async (studentData: CreateStudentData): Promise<void> => {
    setActionLoading(true)
    try {
      await api.post('/students', studentData)
    } finally {
      setActionLoading(false)
    }
  }

  // Update student
  const updateStudent = async (id: string, studentData: Partial<CreateStudentData>): Promise<void> => {
    setActionLoading(true)
    try {
      await api.put(`/students/${id}`, studentData)
    } finally {
      setActionLoading(false)
    }
  }

  // Delete student
  const deleteStudent = async (id: string): Promise<void> => {
    setActionLoading(true)
    try {
      await api.delete(`/students/${id}`)
    } finally {
      setActionLoading(false)
    }
  }

  return {
    actionLoading,
    fetchFromDatabase,
    searchStudents,
    fetchFromAPI,
    fetchAndSave,
    createStudent,
    updateStudent,
    deleteStudent,
  }
}