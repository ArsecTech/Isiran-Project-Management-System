# راهنمای استقرار Isiran

## تنظیمات Database

Connection String در `appsettings.json` تنظیم شده است:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=193.151.145.179;Database=IsiranDB;User Id=ArsecTech;Password=@12345yDj;TrustServerCertificate=true;MultipleActiveResultSets=true"
  }
}
```

## مراحل استقرار

### 1. ایجاد Database

```sql
-- اجرای اسکریپت Schema
USE [master]
GO
CREATE DATABASE [IsiranDB]
GO
```

سپس فایل `database/Schema.sql` را اجرا کنید.

### 2. Seed Data

فایل `database/SeedData.sql` را اجرا کنید تا داده‌های اولیه ایجاد شود.

### 3. Build و Run Backend

```bash
cd src/Isiran.Api
dotnet restore
dotnet build
dotnet run
```

### 4. Build و Run Frontend

```bash
cd frontend
npm install
npm run build
npm run preview
```

### 5. استقرار با Docker

```bash
docker-compose up -d --build
```

## بررسی اتصال Database

برای اطمینان از اتصال به Database:

```bash
# تست اتصال
dotnet ef database update --project src/Isiran.Infrastructure --startup-project src/Isiran.Api
```

## پورت‌ها

- **API**: `http://localhost:5000` یا `https://localhost:5001`
- **Frontend**: `http://localhost:5173`
- **SQL Server**: `193.151.145.179:1433`

## نکات امنیتی

1. SecretKey در `appsettings.json` را در Production تغییر دهید
2. از Environment Variables برای Connection String استفاده کنید
3. HTTPS را در Production فعال کنید

