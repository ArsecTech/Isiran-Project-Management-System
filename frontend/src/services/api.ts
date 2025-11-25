import axios from 'axios'
import type { Project, Task, PagedResult } from '../types'

const api = axios.create({
  baseURL: 'https://ipmsbk.coretexia.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for handling errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
          refreshToken,
        }, {
          baseURL: api.defaults.baseURL
        })

        const { accessToken } = response.data
        localStorage.setItem('accessToken', accessToken)

        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export const projectApi = {
  getAll: (params?: {
    pageNumber?: number
    pageSize?: number
    searchTerm?: string
    status?: number
    priority?: number
  }) => api.get<PagedResult<Project>>('/projects', { params }),

  getById: (id: string) => api.get<Project>(`/projects/${id}`),

  create: (data: Partial<Project>) => api.post<string>('/projects', data),

  update: (id: string, data: Partial<Project>) =>
    api.put(`/projects/${id}`, data),

  delete: (id: string) => api.delete(`/projects/${id}`),
}

export const taskApi = {
  getAll: (params?: {
    pageNumber?: number
    pageSize?: number
    projectId?: string
    status?: number
    priority?: number
  }) => api.get<PagedResult<Task>>('/tasks', { params }),

  getById: (id: string) => api.get<Task>(`/tasks/${id}`),

  create: (data: Partial<Task>) => api.post<string>('/tasks', data),

  update: (id: string, data: Partial<Task>) => api.put(`/tasks/${id}`, data),

  delete: (id: string) => api.delete(`/tasks/${id}`),

  move: (id: string, data: { newParentTaskId?: string; newDisplayOrder: number }) =>
    api.post(`/tasks/${id}/move`, data),

  updateDependencies: (id: string, dependencies: any[]) =>
    api.post(`/tasks/${id}/dependencies`, { dependencies }),

  updateProgress: (
    id: string,
    data: { selfReportedProgress?: number; approvedProgress?: number }
  ) => api.post(`/tasks/${id}/progress`, data),
}

export const ganttApi = {
  getSchedule: (projectId: string) =>
    api.get(`/gantt/project/${projectId}/schedule`),

  getCriticalPath: (projectId: string) =>
    api.get(`/gantt/project/${projectId}/critical-path`),

  getResourceAllocation: (projectId: string) =>
    api.get(`/gantt/project/${projectId}/resource-allocation`),
}

export const reportsApi = {
  exportPdf: (projectId: string) =>
    api.get(`/reports/project/${projectId}/export/pdf`, { responseType: 'blob' }),
  exportExcel: (projectId: string) =>
    api.get(`/reports/project/${projectId}/export/excel`, { responseType: 'blob' }),
  exportMsp: (projectId: string) =>
    api.get(`/reports/project/${projectId}/export/msp`, { responseType: 'blob' }),
  importExcel: (projectId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post(`/reports/project/${projectId}/import/excel`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  importMsp: (projectId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post(`/reports/project/${projectId}/import/msp`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

export default api

