# راهنمای Migration و Seed Data

## 📋 مراحل راه‌اندازی Database

### روش 1: استفاده از EF Core Migrations (توصیه می‌شود)

```powershell
# 1. نصب EF Core Tools (اگر نصب نشده)
dotnet tool install --global dotnet-ef

# 2. ایجاد Migration
cd src/Isiran.Infrastructure
dotnet ef migrations add InitialCreate --startup-project ../Isiran.Api

# 3. اعمال Migration به Database
dotnet ef database update --startup-project ../Isiran.Api
```

### روش 2: استفاده از SQL Scripts

1. **اجرای Schema:**
   - فایل `database/Schema.sql` را در SQL Server Management Studio باز کنید
   - یا از sqlcmd استفاده کنید:
   ```bash
   sqlcmd -S 193.151.145.179 -U ArsecTech -P @12345yDj -d master -i database/Schema.sql
   ```

2. **اجرای Seed Data:**
   - فایل `database/SeedData.sql` را اجرا کنید
   - یا از sqlcmd:
   ```bash
   sqlcmd -S 193.151.145.179 -U ArsecTech -P @12345yDj -d IsiranDB -i database/SeedData.sql
   ```

## ✅ بررسی اتصال

پس از اجرای Migration یا Scripts، می‌توانید با این query بررسی کنید:

```sql
USE IsiranDB
GO

-- بررسی Users
SELECT * FROM Users

-- بررسی Roles
SELECT * FROM Roles

-- بررسی Projects
SELECT * FROM Projects

-- بررسی Tasks
SELECT * FROM Tasks
```

## 🔄 Migration های جدید

برای ایجاد Migration جدید:

```powershell
cd src/Isiran.Infrastructure
dotnet ef migrations add MigrationName --startup-project ../Isiran.Api
dotnet ef database update --startup-project ../Isiran.Api
```

## 📝 نکات مهم

- Connection String در `appsettings.json` تنظیم شده است
- Database باید `IsiranDB` نام داشته باشد
- Seed Data شامل کاربران تست است (admin, pm1, user1)
- همه با رمز `Admin@123` هستند

