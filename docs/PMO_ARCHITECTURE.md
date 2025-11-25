# PMO Integration Tool - Architecture Design

## 1. System Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer (React)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │Dashboard │  │  Gantt   │  │  Reports │  │   Admin  │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend API Layer (.NET 8)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Projects │  │  Tasks   │  │   Users  │  │  Reports  │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Integration  │   │ Integration  │   │ Integration  │
│   Service    │   │   Service    │   │   Service    │
│    (Jira)    │   │ (Confluence) │   │  (Power BI)  │
└──────────────┘   └──────────────┘   └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Data Access Layer (EF Core)                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              SQL Server Database                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Projects │  │ Activities│  │   Users  │  │ SyncLogs │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

**Backend:**
- .NET 8 (ASP.NET Core Web API)
- Entity Framework Core 8
- MediatR (CQRS pattern)
- AutoMapper
- Serilog (Logging)
- FluentValidation
- JWT Authentication

**Frontend:**
- React 18+
- Redux Toolkit (State Management)
- React Router v6
- Material-UI (MUI) v5
- Chart.js / Recharts (Charts)
- React Big Calendar / DHTMLX Gantt (Gantt Chart)
- Axios (HTTP Client)

**Database:**
- SQL Server 2022
- EF Core Migrations

**Integrations:**
- Atlassian REST API (Jira/Confluence)
- Microsoft Power BI REST API
- OAuth 2.0

**DevOps:**
- Docker & Docker Compose
- GitHub Actions (CI/CD)
- xUnit (Backend Testing)
- Jest & React Testing Library (Frontend Testing)

## 2. Database Schema Design

### 2.1 Core Tables

#### Projects
- Id (Guid, PK)
- Code (string, unique)
- Name (string)
- Description (string, nullable)
- StartDate (DateTime)
- EndDate (DateTime, nullable)
- Status (enum: NotStarted, InProgress, OnHold, Completed, Cancelled)
- Budget (decimal, nullable)
- CreatedAt (DateTime)
- UpdatedAt (DateTime)
- CreatedBy (Guid, FK → Users)
- ManagerId (Guid, FK → Users, nullable)

#### Activities (Tasks)
- Id (Guid, PK)
- ProjectId (Guid, FK → Projects)
- Name (string)
- Description (string, nullable)
- StartDate (DateTime, nullable)
- EndDate (DateTime, nullable)
- Duration (int, days)
- Status (enum: NotStarted, InProgress, Completed, Blocked)
- Priority (enum: Low, Medium, High, Critical)
- PercentComplete (int, 0-100)
- ParentActivityId (Guid, FK → Activities, nullable) - for hierarchical tasks
- AssignedToId (Guid, FK → Users, nullable)
- JiraIssueKey (string, nullable) - for Jira sync
- CreatedAt (DateTime)
- UpdatedAt (DateTime)

#### ActivityDependencies
- Id (Guid, PK)
- PredecessorActivityId (Guid, FK → Activities)
- SuccessorActivityId (Guid, FK → Activities)
- DependencyType (enum: FinishToStart, StartToStart, FinishToFinish, StartToFinish)
- Lag (int, days, default 0)

#### Resources
- Id (Guid, PK)
- UserId (Guid, FK → Users)
- ProjectId (Guid, FK → Projects)
- Role (string) - e.g., "Developer", "Tester", "Designer"
- AllocationPercentage (int, 0-100)
- StartDate (DateTime)
- EndDate (DateTime, nullable)

#### Users
- Id (Guid, PK)
- Username (string, unique)
- Email (string, unique)
- FullName (string)
- PasswordHash (string)
- IsActive (bool)
- CreatedAt (DateTime)

#### Roles
- Id (Guid, PK)
- Name (string, unique) - e.g., "Viewer", "ProjectManager", "PMOManager", "Admin"
- Description (string, nullable)

#### UserRoles
- UserId (Guid, FK → Users)
- RoleId (Guid, FK → Roles)
- Primary Key: (UserId, RoleId)

#### RolePermissions
- RoleId (Guid, FK → Roles)
- Permission (string) - e.g., "Projects.View", "Projects.Edit", "Reports.Generate"
- Primary Key: (RoleId, Permission)

#### IntegrationConfigs
- Id (Guid, PK)
- IntegrationType (enum: Jira, Confluence, PowerBI)
- Name (string)
- BaseUrl (string)
- ClientId (string, nullable)
- ClientSecret (string, encrypted)
- AccessToken (string, encrypted, nullable)
- RefreshToken (string, encrypted, nullable)
- TokenExpiresAt (DateTime, nullable)
- IsActive (bool)
- CreatedAt (DateTime)
- UpdatedAt (DateTime)

#### SyncLogs
- Id (Guid, PK)
- IntegrationType (enum: Jira, Confluence, PowerBI)
- ProjectId (Guid, FK → Projects, nullable)
- Status (enum: Success, Failed, InProgress)
- StartTime (DateTime)
- EndTime (DateTime, nullable)
- RecordsSynced (int, nullable)
- ErrorMessage (string, nullable)
- CreatedBy (Guid, FK → Users, nullable)

#### KPIMetrics
- Id (Guid, PK)
- ProjectId (Guid, FK → Projects)
- MetricDate (DateTime)
- CPI (decimal, nullable) - Cost Performance Index
- SPI (decimal, nullable) - Schedule Performance Index
- EV (decimal, nullable) - Earned Value
- PV (decimal, nullable) - Planned Value
- AC (decimal, nullable) - Actual Cost
- CreatedAt (DateTime)

#### ConfluencePages
- Id (Guid, PK)
- ProjectId (Guid, FK → Projects)
- PageId (string) - Confluence page ID
- Title (string)
- Content (string, nullable) - cached content
- Url (string)
- LastSyncedAt (DateTime)
- CreatedAt (DateTime)

#### PowerBIReports
- Id (Guid, PK)
- ProjectId (Guid, FK → Projects, nullable)
- ReportId (string) - Power BI report ID
- Name (string)
- EmbedUrl (string, nullable)
- LastSyncedAt (DateTime)
- CreatedAt (DateTime)

## 3. Backend Architecture (Clean Architecture)

### 3.1 Project Structure

```
src/
├── PMO.Domain/              # Domain entities and interfaces
│   ├── Projects/
│   ├── Activities/
│   ├── Users/
│   ├── Integrations/
│   └── Common/
├── PMO.Application/         # Business logic (CQRS)
│   ├── Projects/
│   │   ├── Commands/
│   │   └── Queries/
│   ├── Activities/
│   ├── Reports/
│   └── Integrations/
├── PMO.Infrastructure/      # Data access and external services
│   ├── Persistence/
│   ├── Integrations/
│   │   ├── Jira/
│   │   ├── Confluence/
│   │   └── PowerBI/
│   └── Authentication/
└── PMO.Api/                 # Web API layer
    ├── Controllers/
    ├── Middleware/
    └── Configuration/
```

## 4. Integration Services Design

### 4.1 Jira Integration

**Endpoints:**
- GET /api/integrations/jira/projects
- GET /api/integrations/jira/issues?projectKey={key}
- POST /api/integrations/jira/sync/{projectId}
- PUT /api/integrations/jira/issues/{issueKey}

**OAuth Flow:**
1. User initiates OAuth connection
2. Redirect to Atlassian OAuth page
3. Receive authorization code
4. Exchange code for access token
5. Store tokens securely
6. Use access token for API calls

### 4.2 Confluence Integration

**Endpoints:**
- GET /api/integrations/confluence/pages?projectId={id}
- POST /api/integrations/confluence/sync/{projectId}
- GET /api/integrations/confluence/content/{pageId}

### 4.3 Power BI Integration

**Endpoints:**
- GET /api/integrations/powerbi/reports
- GET /api/integrations/powerbi/embed-url/{reportId}
- POST /api/integrations/powerbi/sync

## 5. KPI Calculation Engine

### 5.1 Key Performance Indicators

**CPI (Cost Performance Index):**
```
CPI = EV / AC
Where:
- EV (Earned Value) = Budget × PercentComplete
- AC (Actual Cost) = Sum of actual costs
```

**SPI (Schedule Performance Index):**
```
SPI = EV / PV
Where:
- PV (Planned Value) = Budget × (DaysElapsed / TotalDays)
```

**Implementation:**
- Scheduled job runs daily
- Calculates KPIs for all active projects
- Stores in KPIMetrics table
- Available via API for dashboards

## 6. Security & Authentication

### 6.1 Authentication Flow
- JWT-based authentication
- Refresh token mechanism
- OAuth 2.0 for external integrations

### 6.2 Authorization (RBAC)
- Role-based access control
- Permission-based fine-grained access
- Middleware for authorization checks

## 7. Frontend Architecture

### 7.1 Component Structure

```
src/
├── components/
│   ├── common/          # Reusable components
│   ├── dashboard/       # Dashboard components
│   ├── gantt/           # Gantt chart components
│   ├── reports/         # Report components
│   └── integrations/    # Integration components
├── pages/               # Page components
├── store/               # Redux store
│   ├── slices/
│   └── api/
├── services/            # API services
└── utils/              # Utility functions
```

### 7.2 State Management (Redux Toolkit)

**Slices:**
- authSlice (authentication state)
- projectsSlice (projects data)
- activitiesSlice (tasks/activities)
- dashboardSlice (dashboard data)
- reportsSlice (reports data)
- integrationsSlice (integration configs)

## 8. Deployment Architecture

### 8.1 Docker Configuration

```yaml
services:
  api:
    build: ./src/PMO.Api
    ports:
      - "5000:80"
    environment:
      - ConnectionStrings__DefaultConnection=...
  
  frontend:
    build: ./frontend
    ports:
      - "3000:80"
  
  database:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      - ACCEPT_EULA=Y
      - SA_PASSWORD=...
```

## 9. Performance Considerations

- Caching: Redis for frequently accessed data
- Async processing: Background jobs for sync operations
- Database indexing: On foreign keys and frequently queried columns
- API rate limiting: To prevent abuse
- Pagination: For large datasets

## 10. Testing Strategy

**Backend:**
- Unit tests: xUnit for business logic
- Integration tests: For API endpoints
- Mock external services

**Frontend:**
- Unit tests: Jest for components
- Integration tests: React Testing Library
- E2E tests: Playwright or Cypress

