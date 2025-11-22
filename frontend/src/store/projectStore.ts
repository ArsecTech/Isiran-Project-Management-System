import { create } from 'zustand'
import { Project } from '../types'

interface ProjectState {
  projects: Project[]
  selectedProject: Project | null
  isLoading: boolean
  setProjects: (projects: Project[]) => void
  addProject: (project: Project) => void
  updateProject: (id: string, project: Partial<Project>) => void
  removeProject: (id: string) => void
  setSelectedProject: (project: Project | null) => void
  setLoading: (loading: boolean) => void
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  selectedProject: null,
  isLoading: false,
  setProjects: (projects) => set({ projects }),
  addProject: (project) =>
    set((state) => ({ projects: [...state.projects, project] })),
  updateProject: (id, projectData) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...projectData } : p
      ),
      selectedProject:
        state.selectedProject?.id === id
          ? { ...state.selectedProject, ...projectData }
          : state.selectedProject,
    })),
  removeProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      selectedProject:
        state.selectedProject?.id === id ? null : state.selectedProject,
    })),
  setSelectedProject: (project) => set({ selectedProject: project }),
  setLoading: (loading) => set({ isLoading: loading }),
}))

