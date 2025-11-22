# Isiran (ایزایران) – Enterprise Project & Resource Management System

<div dir="rtl">

یک سیستم مدیریت پروژه پیشرفته و حرفه‌ای با معماری Clean Architecture و تکنولوژی‌های مدرن.

[![.NET](https://img.shields.io/badge/.NET-9.0-512BD4?logo=dotnet)](https://dotnet.microsoft.com/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![SQL Server](https://img.shields.io/badge/SQL%20Server-2022-CC2927?logo=microsoft-sql-server)](https://www.microsoft.com/sql-server)
[![License](https://img.shields.io/badge/License-Proprietary-red)](LICENSE)

</div>

## 📋 فهرست مطالب

- [معماری](#-معماری)
- [تکنولوژی‌ها](#️-تکنولوژیها)
- [ساختار پروژه](#-ساختار-پروژه)
- [راه‌اندازی سریع](#-راهاندازی-سریع)
- [نصب و راه‌اندازی](#-نصب-و-راهاندازی)
- [احراز هویت](#-احراز-هویت)
- [مستندات](#-مستندات)
- [ویژگی‌ها](#-ویژگیها)
- [مشارکت](#-مشارکت)
- [لایسنس](#-لایسنس)

## 🏗️ معماری

این پروژه از **Clean Architecture** با اصول **Domain-Driven Design (DDD)** استفاده می‌کند:

- **Clean Architecture** با ساختار Modular Monolith
- **Domain-Driven Design (DDD)** با bounded contexts
- **CQRS** برای جداسازی دستورات و کوئری‌ها
- **Event Sourcing** برای audit trails
- آماده برای **Microservices** در صورت نیاز

### لایه‌های معماری

```
┌─────────────────────────────────────┐
│         Presentation Layer          │
│      (React Frontend + API)         │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│       Application Layer              │
│    (CQRS, Commands, Queries)        │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│         Domain Layer                 │
│  (Entities, Value Objects, Events)   │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│      Infrastructure Layer            │
│  (EF Core, Repositories, Services)   │
└─────────────────────────────────────┘
```

## 🛠️ تکنولوژی‌ها

### Backend

- **.NET 9** - آخرین نسخه فریمورک
- **C# 13** - زبان برنامه‌نویسی
- **Entity Framework Core 9** - ORM
- **SQL Server** - پایگاه داده
- **SignalR** - Real-time communication
- **MassTransit** - Event Bus (آماده)
- **Redis** - Caching (آماده)
- **JWT Authentication** - احراز هویت با Refresh Tokens
- **MediatR** - CQRS pattern implementation

### Frontend

- **React 19** - کتابخانه UI
- **TypeScript** - زبان برنامه‌نویسی
- **Vite** - Build tool
- **Zustand** - State Management
- **Axios** - HTTP Client
- **React Router** - Routing
- **Tailwind CSS** - Styling
- **Recharts** - Charts & Graphs
- **Custom Gantt Chart Engine** - موتور محاسبه Gantt

### DevOps

- **Docker** & **Docker Compose** - Containerization
- **Kubernetes** - Orchestration (آماده)
- **GitHub Actions** - CI/CD (آماده)
- **ELK Stack** - Logging (آماده)
- **Prometheus + Grafana** - Monitoring (آماده)

## 📁 ساختار پروژه

```
Isiran-Project-Management-System/
├── src/
│   ├── Isiran.Api/              # Web API layer (Controllers, Middleware)
│   ├── Isiran.Application/       # Application services, CQRS handlers
│   ├── Isiran.Domain/           # Domain entities, value objects, events
│   ├── Isiran.Infrastructure/   # Data access, external services
│   ├── Isiran.Core/             # Shared interfaces and utilities
│   └── Isiran.GanttEngine/      # Gantt chart calculation engine
├── frontend/                     # React frontend application
├── database/                     # Database scripts and migrations
├── docs/                         # Documentation
├── docker-compose.yml           # Docker Compose configuration
└── README.md                    # این فایل
```

## 🚀 راه‌اندازی سریع

### پیش‌نیازها

- [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- [SQL Server 2019+](https://www.microsoft.com/sql-server) یا [SQL Server Express](https://www.microsoft.com/sql-server/sql-server-downloads)
- [Node.js 20+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (اختیاری)

### راه‌اندازی با Docker (پیشنهادی)

```bash
# کلون کردن پروژه
git clone https://github.com/ArsecTech/Isiran-Project-Management-System.git
cd Isiran-Project-Management-System

# راه‌اندازی با Docker Compose
docker-compose up -d
```

پس از راه‌اندازی:
- **API**: http://localhost:5000
- **Frontend**: http://localhost:3000
- **SQL Server**: localhost:1433
- **Redis**: localhost:6379

### راه‌اندازی دستی

#### 1. راه‌اندازی Backend

```bash
# کپی کردن فایل تنظیمات
cp src/Isiran.Api/appsettings.json.example src/Isiran.Api/appsettings.json

# ویرایش appsettings.json و تنظیم Connection String

# نصب وابستگی‌ها
cd src/Isiran.Api
dotnet restore

# اجرای Migration
dotnet ef database update

# اجرای پروژه
dotnet run
```

API در آدرس `https://localhost:41969` یا `http://localhost:41970` اجرا می‌شود.

#### 2. راه‌اندازی Frontend

```bash
cd frontend

# نصب وابستگی‌ها
npm install

# اجرای پروژه
npm run dev
```

Frontend در آدرس `http://localhost:5173` اجرا می‌شود.

## 📖 نصب و راه‌اندازی

برای راه‌اندازی کامل پروژه، به مستندات زیر مراجعه کنید:

- [راهنمای نصب کامل](docs/SETUP.md)
- [مستندات معماری](docs/ARCHITECTURE.md)
- [مستندات API](docs/API.md)

### تنظیمات اولیه

1. **تنظیم Database Connection String**

   فایل `src/Isiran.Api/appsettings.json.example` را کپی کرده و به `appsettings.json` تغییر نام دهید، سپس اطلاعات اتصال به دیتابیس را وارد کنید.

2. **تنظیم JWT Secret Key**

   یک کلید امنیتی حداقل 32 کاراکتری برای JWT در `appsettings.json` تنظیم کنید.

3. **اجرای Migration**

   ```bash
   cd src/Isiran.Api
   dotnet ef database update
   ```

4. **Seed Data (اختیاری)**

   برای افزودن داده‌های اولیه، اسکریپت‌های موجود در پوشه `database/` را اجرا کنید.

## 🔐 احراز هویت

سیستم احراز هویت با JWT پیاده‌سازی شده است:

### Endpoints

- **Login**: `POST /api/auth/login`
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

- **Register**: `POST /api/auth/register`
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }
  ```

- **Refresh Token**: `POST /api/auth/refresh`
  ```json
  {
    "refreshToken": "your-refresh-token"
  }
  ```

### استفاده در Frontend

```typescript
import { authStore } from './store/authStore';

// Login
await authStore.login(email, password);

// Logout
authStore.logout();

// Check authentication
if (authStore.isAuthenticated) {
  // User is logged in
}
```

## 📚 مستندات

مستندات کامل در پوشه `/docs`:

- **[SETUP.md](docs/SETUP.md)** - راهنمای نصب و راه‌اندازی
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - مستندات معماری
- **[API.md](docs/API.md)** - مستندات API
- **[ROADMAP.md](docs/ROADMAP.md)** - نقشه راه توسعه

## ✅ ویژگی‌های پیاده‌سازی شده

### مدیریت پروژه
- ✅ ایجاد، ویرایش و حذف پروژه‌ها
- ✅ مدیریت Milestone‌ها
- ✅ مدیریت منابع پروژه
- ✅ تنظیمات پیشرفته پروژه

### مدیریت تسک‌ها
- ✅ CRUD کامل تسک‌ها
- ✅ وابستگی‌های تسک (Dependencies)
- ✅ مدیریت وضعیت تسک‌ها
- ✅ تخصیص منابع به تسک‌ها
- ✅ اولویت‌بندی تسک‌ها

### Gantt Chart
- ✅ موتور محاسبه Gantt Chart
- ✅ نمایش Timeline
- ✅ محاسبه Critical Path
- ✅ نمایش وابستگی‌ها

### مدیریت منابع
- ✅ مدیریت منابع انسانی
- ✅ تخصیص منابع به پروژه‌ها و تسک‌ها
- ✅ نمایش بار کاری منابع

### احراز هویت و امنیت
- ✅ JWT Authentication
- ✅ Refresh Tokens
- ✅ Role-based Access Control (RBAC)
- ✅ User Management

### رابط کاربری
- ✅ Landing Page مدرن
- ✅ Dashboard
- ✅ صفحات مدیریت پروژه‌ها
- ✅ صفحات مدیریت تسک‌ها
- ✅ صفحات مدیریت منابع

## 🚧 در حال توسعه

- [ ] Time Tracking
- [ ] Budget & Cost Management
- [ ] Reporting & Analytics
- [ ] Export (PDF, Excel)
- [ ] Real-time Updates (SignalR)
- [ ] Notifications System
- [ ] File Attachments
- [ ] Comments & Activity Feed

برای جزئیات بیشتر، [ROADMAP.md](docs/ROADMAP.md) را مطالعه کنید.

## 🤝 مشارکت

برای مشارکت در پروژه:

1. Fork کنید
2. یک Branch ایجاد کنید (`git checkout -b feature/AmazingFeature`)
3. تغییرات را Commit کنید (`git commit -m 'Add some AmazingFeature'`)
4. Branch را Push کنید (`git push origin feature/AmazingFeature`)
5. یک Pull Request ایجاد کنید

### استانداردهای کدنویسی

- از **Clean Code** principles پیروی کنید
- کدها را **Document** کنید
- **Unit Tests** بنویسید
- از **Conventional Commits** استفاده کنید

## 📄 لایسنس

این پروژه دارای لایسنس **Proprietary** است. تمامی حقوق محفوظ است.

© 2024 ArsecTech. All rights reserved.

## 📞 تماس

- **Repository**: [GitHub](https://github.com/ArsecTech/Isiran-Project-Management-System)
- **Issues**: [GitHub Issues](https://github.com/ArsecTech/Isiran-Project-Management-System/issues)

## 🙏 تشکر

از تمامی توسعه‌دهندگان و مشارکت‌کنندگان در این پروژه تشکر می‌کنیم.

---

<div dir="rtl">

**نکته**: برای اطلاعات بیشتر و به‌روزرسانی‌ها، به [ROADMAP.md](docs/ROADMAP.md) مراجعه کنید.

</div>
