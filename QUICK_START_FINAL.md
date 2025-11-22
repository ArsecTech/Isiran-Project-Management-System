# 🚀 راه‌اندازی سریع Isiran

## ⚡ 3 مرحله ساده

### 1️⃣ Database (در SQL Server Management Studio)

```sql
-- فایل database/Schema_Fixed.sql را اجرا کنید
-- سپس فایل database/SeedData.sql را اجرا کنید
```

یا از PowerShell:
```powershell
.\run-database.ps1
```

### 2️⃣ Backend

```powershell
.\start-backend.ps1
```

یا دستی:
```powershell
cd src\Isiran.Api
dotnet restore
dotnet run
```

✅ API: `https://localhost:5001`
✅ Swagger: `https://localhost:5001/swagger`

### 3️⃣ Frontend

```powershell
.\start-frontend.ps1
```

یا دستی:
```powershell
cd frontend
npm install
npm run dev
```

✅ Frontend: `http://localhost:5173`

## 🔐 ورود به سیستم

| Username | Password | Role |
|----------|----------|------|
| **admin** | Admin@123 | Administrator |
| **pm1** | Admin@123 | ProjectManager |
| **user1** | Admin@123 | TeamMember |

## 🎯 شروع تست

1. به `http://localhost:5173` بروید
2. Landing Page را ببینید
3. با `admin` / `Admin@123` وارد شوید
4. از تمام ویژگی‌ها استفاده کنید!

## 📝 اسکریپت‌های آماده

- `setup.ps1` - راه‌اندازی کامل (Backend + Frontend)
- `run-database.ps1` - اجرای Database Scripts
- `start-backend.ps1` - اجرای Backend
- `start-frontend.ps1` - اجرای Frontend

## ✅ وضعیت

- ✅ Database Schema آماده
- ✅ Seed Data آماده
- ✅ Backend آماده
- ✅ Frontend آماده
- ✅ Landing Page زیبا
- ✅ کاربران تست آماده

**همه چیز آماده است! فقط Database را Setup کنید و شروع کنید! 🚀**

