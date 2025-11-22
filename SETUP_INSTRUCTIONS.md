# 📋 دستورالعمل راه‌اندازی Isiran

## ⚠️ مهم: مشکل Foreign Key

اگر خطای cascade cycle دریافت کردید، **از فایل `database/Schema_Fixed.sql` استفاده کنید**!

## 🚀 راه‌اندازی (3 مرحله)

### 1️⃣ Database Setup

**گزینه A: Schema_Fixed.sql (توصیه می‌شود)**
```sql
-- در SQL Server Management Studio:
-- 1. فایل database/Schema_Fixed.sql را اجرا کنید
-- 2. فایل database/SeedData.sql را اجرا کنید
```

**گزینه B: Schema.sql + Fix**
```sql
-- 1. فایل database/Schema.sql را اجرا کنید
-- 2. اگر خطا داشتید، database/FixSchema.sql را اجرا کنید
-- 3. فایل database/SeedData.sql را اجرا کنید
```

### 2️⃣ Backend

```powershell
cd "E:\GodZTech\Isiran – Project Management System\src\Isiran.Api"
dotnet restore
dotnet run
```

✅ API: `https://localhost:5001`
✅ Swagger: `https://localhost:5001/swagger`

### 3️⃣ Frontend

```powershell
cd "E:\GodZTech\Isiran – Project Management System\frontend"
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

## 📊 داده‌های نمونه

پس از Seed Data:
- ✅ 3 نقش و 3 کاربر
- ✅ 3 Resource
- ✅ 2 پروژه نمونه
- ✅ 4 تسک با وابستگی‌ها
- ✅ Time Entries نمونه

## 🎯 شروع کار

1. به `http://localhost:5173` بروید
2. Landing Page را ببینید
3. با `admin` / `Admin@123` وارد شوید
4. از Dashboard استفاده کنید!

## 🔧 Troubleshooting

**خطای Cascade:**
- از `Schema_Fixed.sql` استفاده کنید
- یا `FixSchema.sql` را اجرا کنید

**مشکل اتصال Database:**
- Connection String را در `appsettings.json` بررسی کنید
- SQL Server را بررسی کنید

---

**همه چیز آماده است! 🚀**

