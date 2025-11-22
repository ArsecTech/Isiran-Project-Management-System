# Isiran (ایزایران) - Project Management System

## 🎯 Project Overview

Isiran is a comprehensive, enterprise-grade project management system built as a modern clone of Microsoft Project. It features a complete Gantt chart engine, resource management, task dependencies, and real-time collaboration capabilities.

## ✅ Completed Features

### Backend (.NET 9 + C# 13)
- ✅ Clean Architecture with DDD bounded contexts
- ✅ CQRS pattern with MediatR
- ✅ Entity Framework Core 9 with SQL Server
- ✅ Complete domain models (Projects, Tasks, Resources, Users)
- ✅ Repository pattern with Unit of Work
- ✅ RESTful API with Swagger documentation
- ✅ Gantt calculation engine (schedule, critical path, resource allocation)
- ✅ Database schema with full SQL scripts
- ✅ Seed data for initial setup

### Frontend (React 19 + TypeScript)
- ✅ Modern React 19 with TypeScript
- ✅ Vite build tool
- ✅ Tailwind CSS for styling
- ✅ Zustand for state management
- ✅ Axios with interceptors
- ✅ Dashboard with statistics
- ✅ Projects list and detail pages
- ✅ Gantt Chart component with zoom levels
- ✅ Responsive layout with sidebar navigation

### DevOps
- ✅ Docker containerization
- ✅ Docker Compose for local development
- ✅ Multi-stage Docker builds
- ✅ Nginx configuration for frontend

### Documentation
- ✅ Architecture documentation
- ✅ API documentation
- ✅ Setup guide
- ✅ Development roadmap
- ✅ Database schema documentation

## 📁 Project Structure

```
Isiran/
├── src/
│   ├── Isiran.Api/              # Web API layer
│   ├── Isiran.Application/      # CQRS commands/queries
│   ├── Isiran.Domain/           # Domain entities
│   ├── Isiran.Infrastructure/   # Data access, EF Core
│   ├── Isiran.Core/             # Shared utilities
│   └── Isiran.GanttEngine/      # Gantt calculation engine
├── frontend/                    # React 19 frontend
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── pages/               # Page components
│   │   ├── services/            # API services
│   │   └── types/               # TypeScript types
├── database/                    # SQL scripts
│   ├── Schema.sql               # Database schema
│   └── SeedData.sql            # Seed data
├── docs/                        # Documentation
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── SETUP.md
│   └── ROADMAP.md
└── docker-compose.yml           # Docker setup
```

## 🚀 Quick Start

### Prerequisites
- .NET 9 SDK
- SQL Server 2019+
- Node.js 20+
- Docker Desktop (optional)

### Backend Setup
```bash
# Restore dependencies
cd src/Isiran.Api
dotnet restore

# Run database scripts (or use EF Core migrations)
# Execute database/Schema.sql and database/SeedData.sql

# Run API
dotnet run
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Docker Setup
```bash
docker-compose up -d
```

## 🔑 Key Features

### 1. Project Management
- Create, update, delete projects
- Project status tracking
- Budget and cost management
- Progress tracking

### 2. Task Management
- Hierarchical task structure
- Task dependencies (FS, SS, FF, SF)
- Task assignment to resources
- Progress tracking
- WBS (Work Breakdown Structure) codes

### 3. Gantt Chart Engine
- Automatic schedule calculation
- Critical path analysis
- Resource allocation visualization
- Multiple zoom levels (day/week/month)
- Drag-and-drop support (frontend ready)

### 4. Resource Management
- Resource creation and management
- Resource allocation to projects/tasks
- Resource calendars
- Workload analysis

### 5. Architecture
- Clean Architecture principles
- Domain-Driven Design (DDD)
- CQRS pattern
- Repository pattern
- Event-driven architecture ready

## 📊 Database Schema

The database includes:
- **Projects** - Project master data
- **Tasks** - Task hierarchy and details
- **TaskDependencies** - Task relationships
- **Resources** - Resource management
- **ProjectResources** - Project-resource mapping
- **TaskResources** - Task-resource allocation
- **TaskTimeEntries** - Time tracking
- **Users, Roles, Permissions** - Authorization
- **Notifications** - User notifications

## 🔐 Security (Ready for Implementation)

- JWT authentication structure
- Role-based access control (RBAC)
- Permission system
- Row-level security via soft deletes
- Optimistic concurrency control

## 📈 Next Steps

1. **Authentication & Authorization**
   - Implement JWT token generation
   - Add refresh token mechanism
   - Implement role-based authorization

2. **Real-time Features**
   - SignalR integration
   - Real-time notifications
   - Live updates

3. **Advanced Features**
   - Resource leveling algorithm
   - Advanced critical path calculation
   - Time tracking UI
   - Budget reporting
   - Export functionality

4. **Testing**
   - Unit tests
   - Integration tests
   - E2E tests

5. **DevOps**
   - Kubernetes manifests
   - CI/CD pipeline
   - Monitoring setup

## 🛠️ Technology Stack

### Backend
- .NET 9
- C# 13
- Entity Framework Core 9
- SQL Server
- MediatR (CQRS)
- AutoMapper

### Frontend
- React 19
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- Axios
- React Router

### DevOps
- Docker
- Docker Compose
- Nginx

## 📝 License

Proprietary - All rights reserved

## 👥 Team

This project was architected and implemented following enterprise best practices and is ready for team collaboration and further development.

---

**Status**: ✅ Core implementation complete. Ready for authentication, testing, and advanced features.

