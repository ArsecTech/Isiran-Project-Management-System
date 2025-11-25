export enum ProjectStatus {
  Planning = 0,
  InProgress = 1,
  OnHold = 2,
  Completed = 3,
  Cancelled = 4
}

export enum ProjectPriority {
  Low = 0,
  Medium = 1,
  High = 2,
  Critical = 3
}

export enum TaskStatus {
  NotStarted = 0,
  InProgress = 1,
  Completed = 2,
  OnHold = 3,
  Cancelled = 4
}

export enum TaskPriority {
  Low = 0,
  Medium = 1,
  High = 2,
  Critical = 3
}

export enum DependencyType {
  FinishToStart = 0,
  StartToStart = 1,
  FinishToFinish = 2,
  StartToFinish = 3
}

export interface Project {
  id: string
  name: string
  code: string
  description?: string
  status: ProjectStatus
  priority: ProjectPriority
  startDate?: string
  endDate?: string
  actualStartDate?: string
  actualEndDate?: string
  budget: number
  actualCost: number
  projectManagerId?: string
  ownerId?: string
  settings?: any // ProjectSettings JSON
  createdAt: string
  updatedAt?: string
  taskCount: number
  completedTaskCount: number
  progressPercentage: number
}

export enum TaskType {
  Task = 0,
  Milestone = 1,
  Summary = 2
}

export enum TaskConstraint {
  AsSoonAsPossible = 0,
  AsLateAsPossible = 1,
  MustStartOn = 2,
  MustFinishOn = 3,
  StartNoEarlierThan = 4,
  StartNoLaterThan = 5,
  FinishNoEarlierThan = 6,
  FinishNoLaterThan = 7
}

export interface Task {
  id: string
  projectId: string
  name: string
  description?: string
  type: TaskType
  status: TaskStatus
  priority: TaskPriority
  startDate?: string
  endDate?: string
  actualStartDate?: string
  actualEndDate?: string
  duration: number // in days
  actualDuration: number // in days
  estimatedEffort?: number // in hours
  actualEffort?: number // in hours
  estimatedCost?: number
  actualCost?: number
  percentComplete?: number
  parentTaskId?: string
  assignedToId?: string
  assignedToName?: string
  displayOrder: number
  constraint: TaskConstraint
  jiraIssueKey?: string
  jiraIssueId?: string
  constraintDate?: string
  wbsCode: string
  dependencies: TaskDependency[]
}

export interface TaskDependency {
  id: string
  predecessorTaskId: string
  successorTaskId: string
  type: DependencyType
  lag: number
}

export enum ResourceType {
  Work = 0,
  Material = 1,
  Cost = 2
}

export enum ResourceStatus {
  Active = 0,
  Inactive = 1,
  OnLeave = 2,
  Terminated = 3
}

export interface Resource {
  id: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  phoneNumber?: string
  type: ResourceType
  status: ResourceStatus
  maxUnits: number // percentage (0-100)
  standardRate: number
  overtimeRate: number
  department?: string
  jobTitle?: string
  managerId?: string
  calendar?: any // ResourceCalendar JSON
}

export interface GanttTask {
  id: string
  name: string
  start: Date
  end: Date
  progress: number
  dependencies?: string[]
  type: 'task' | 'milestone' | 'summary'
  color?: string
}

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

