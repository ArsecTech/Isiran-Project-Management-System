# راهنمای Database Setup

## ⚠️ مشکل Foreign Key Cascade

اگر خطای cascade cycle دریافت کردید، از فایل **`Schema_Fixed.sql`** استفاده کنید.

## 📋 مراحل Setup

### روش 1: استفاده از Schema_Fixed.sql (توصیه می‌شود)

1. فایل `database/Schema_Fixed.sql` را در SQL Server Management Studio باز کنید
2. کل فایل را اجرا کنید
3. سپس فایل `database/SeedData.sql` را اجرا کنید

### روش 2: استفاده از Schema.sql + FixSchema.sql

1. فایل `database/Schema.sql` را اجرا کنید
2. اگر خطا دریافت کردید، فایل `database/FixSchema.sql` را اجرا کنید
3. سپس فایل `database/SeedData.sql` را اجرا کنید

## 🔧 مشکل Cascade Cycle

مشکل از Foreign Key های self-referencing و multiple cascade paths است. در `Schema_Fixed.sql`:
- Foreign Key های مشکل‌دار با `ON DELETE NO ACTION` تعریف شده‌اند
- Constraints بعد از CREATE TABLE اضافه می‌شوند

## ✅ پس از Setup

برای بررسی:
```sql
USE IsiranDB
GO

SELECT COUNT(*) as UserCount FROM Users
SELECT COUNT(*) as ProjectCount FROM Projects
SELECT COUNT(*) as TaskCount FROM Tasks
```

## 🔐 کاربران تست

پس از Seed Data:
- `admin` / `Admin@123` (Administrator)
- `pm1` / `Admin@123` (ProjectManager)
- `user1` / `Admin@123` (TeamMember)

