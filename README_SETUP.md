# 🚀 راه‌اندازی سریع Isiran

## ⚡ Quick Start (3 مرحله)

### 1️⃣ Database Setup

**گزینه A: با SQL Scripts (سریع‌تر)**
```sql
-- در SQL Server Management Studio:
-- 1. فایل database/Schema.sql را اجرا کنید
-- 2. فایل database/SeedData.sql را اجرا کنید
```

**گزینه B: با EF Core Migrations**
```powershell
cd src/Isiran.Infrastructure
dotnet ef migrations add InitialCreate --startup-project ../Isiran.Api
dotnet ef database update --startup-project ../Isiran.Api
```

### 2️⃣ Backend

```powershell
cd src/Isiran.Api
dotnet restore
dotnet run
```

✅ API در `https://localhost:5001` اجرا می‌شود
✅ Swagger در `https://localhost:5001/swagger`

### 3️⃣ Frontend

```powershell
cd frontend
npm install
npm run dev
```

✅ Frontend در `http://localhost:5173` اجرا می‌شود

## 🔐 ورود به سیستم

### کاربران تست (همه با رمز `Admin@123`):

| Username | Role | دسترسی |
|----------|------|--------|
| `admin` | Administrator | دسترسی کامل |
| `pm1` | ProjectManager | مدیریت پروژه‌ها |
| `user1` | TeamMember | مشاهده تسک‌ها |

## 📊 داده‌های نمونه

پس از Seed Data:
- ✅ 3 نقش و 3 کاربر
- ✅ 3 منبع (Resources)
- ✅ 2 پروژه نمونه
- ✅ 4 تسک با وابستگی‌ها
- ✅ Time Entries نمونه

## 🎯 شروع کار

1. به `http://localhost:5173` بروید
2. روی "شروع کنید" کلیک کنید
3. با `admin` / `Admin@123` وارد شوید
4. از Dashboard استفاده کنید!

## 📚 مستندات بیشتر

- `QUICK_START.md` - راهنمای کامل
- `TEST_USERS.md` - اطلاعات کاربران تست
- `MIGRATION_GUIDE.md` - راهنمای Migration
- `docs/API.md` - مستندات API

## ⚠️ Troubleshooting

**مشکل اتصال Database:**
- Connection String را در `appsettings.json` بررسی کنید
- SQL Server را بررسی کنید

**مشکل Frontend:**
- `npm install` را دوباره اجرا کنید
- پورت 5173 را بررسی کنید

**مشکل Backend:**
- `dotnet restore` را اجرا کنید
- Logs را چک کنید

