# Isiran Architecture Documentation

## System Architecture

Isiran follows **Clean Architecture** principles with a **Modular Monolith** structure, ready for future microservices migration.

### Architecture Layers

```
┌─────────────────────────────────────┐
│         Presentation Layer         │
│      (React 19 + TypeScript)       │
└─────────────────────────────────────┘
                  │
┌─────────────────────────────────────┐
│            API Layer                 │
│      (ASP.NET Core 9 Web API)      │
└─────────────────────────────────────┘
                  │
┌─────────────────────────────────────┐
│        Application Layer            │
│   (CQRS - Commands & Queries)       │
└─────────────────────────────────────┘
                  │
┌─────────────────────────────────────┐
│         Domain Layer                │
│   (DDD - Entities & Aggregates)    │
└─────────────────────────────────────┘
                  │
┌─────────────────────────────────────┐
│      Infrastructure Layer           │
│  (EF Core, Repositories, Services)  │
└─────────────────────────────────────┘
```

## Bounded Contexts

1. **Projects** - Project management and lifecycle
2. **Tasks** - Task management, dependencies, WBS
3. **Resources** - Resource management and allocation
4. **Gantt Engine** - Schedule calculation and critical path
5. **Time Tracking** - Time entries and effort tracking
6. **Budget & Cost** - Financial management
7. **Permissions & Roles** - Authorization system
8. **Notification Center** - Real-time notifications

## Technology Stack

### Backend
- **.NET 9** with C# 13
- **Entity Framework Core 9** for data access
- **SQL Server** as primary database
- **MediatR** for CQRS pattern
- **AutoMapper** for object mapping
- **SignalR** for real-time updates
- **MassTransit** for event bus
- **Redis** for caching

### Frontend
- **React 19** with TypeScript
- **Vite** as build tool
- **Zustand** for state management
- **Axios** for API calls
- **Tailwind CSS** for styling
- **Lucide React** for icons

## Database Design

### Key Tables
- `Projects` - Project master data
- `Tasks` - Task hierarchy and details
- `TaskDependencies` - Task relationships
- `Resources` - Resource management
- `ProjectResources` - Project-resource mapping
- `TaskResources` - Task-resource allocation
- `TaskTimeEntries` - Time tracking
- `Users`, `Roles`, `Permissions` - Authorization
- `Notifications` - User notifications

### Indexing Strategy
- Primary keys on all tables
- Foreign key indexes
- Composite indexes on frequently queried columns
- Full-text indexes on searchable text fields

## API Design

### RESTful Endpoints

**Projects**
- `GET /api/projects` - List projects (paginated)
- `GET /api/projects/{id}` - Get project details
- `POST /api/projects` - Create project
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project

**Tasks**
- `GET /api/tasks/{id}` - Get task details
- `POST /api/tasks` - Create task
- `PUT /api/tasks/{id}` - Update task
- `POST /api/tasks/{id}/move` - Move task
- `POST /api/tasks/{id}/dependencies` - Update dependencies

**Gantt**
- `GET /api/gantt/project/{id}/schedule` - Get schedule
- `GET /api/gantt/project/{id}/critical-path` - Get critical path
- `GET /api/gantt/project/{id}/resource-allocation` - Get resource allocation

## Gantt Engine

The Gantt Engine calculates:
- **Schedule** - Start/end dates based on dependencies
- **Critical Path** - Longest path through project
- **Resource Allocation** - Resource workload analysis
- **Slack Calculation** - Float time for tasks

## Security

- **JWT Authentication** with refresh tokens
- **Role-Based Access Control (RBAC)**
- **Permission-based authorization**
- **Row-level security** via soft deletes
- **Optimistic concurrency** via RowVersion

## Deployment

### Docker
- Multi-stage builds for optimization
- Docker Compose for local development
- Separate containers for API, Frontend, SQL Server, Redis

### Kubernetes
- Deployment manifests for production
- Service definitions
- Ingress configuration
- ConfigMaps and Secrets

## Scalability

- **Horizontal scaling** ready
- **Caching layer** with Redis
- **Event-driven architecture** with MassTransit
- **Database partitioning** for large tables
- **CDN ready** for static assets

## Monitoring & Logging

- **Serilog** for structured logging
- **ELK Stack** integration ready
- **Prometheus** metrics
- **Grafana** dashboards
- **Health checks** endpoints

