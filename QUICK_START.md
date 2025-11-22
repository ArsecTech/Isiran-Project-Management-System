# راهنمای سریع راه‌اندازی Isiran

## 🚀 راه‌اندازی سریع

### 1. Database Setup

```bash
# اجرای Schema
sqlcmd -S 193.151.145.179 -U ArsecTech -P @12345yDj -d IsiranDB -i database/Schema.sql

# اجرای Seed Data
sqlcmd -S 193.151.145.179 -U ArsecTech -P @12345yDj -d IsiranDB -i database/SeedData.sql
```

یا از SQL Server Management Studio:
1. فایل `database/Schema.sql` را اجرا کنید
2. فایل `database/SeedData.sql` را اجرا کنید

### 2. Backend (API)

```bash
cd src/Isiran.Api
dotnet restore
dotnet run
```

API در آدرس زیر اجرا می‌شود:
- HTTP: `http://localhost:5000`
- HTTPS: `https://localhost:5001`
- Swagger: `https://localhost:5001/swagger`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend در آدرس زیر اجرا می‌شود:
- `http://localhost:5173`

## 🔐 ورود به سیستم

### کاربران تست:

1. **Administrator**
   - Username: `admin`
   - Password: `Admin@123`

2. **Project Manager**
   - Username: `pm1`
   - Password: `Admin@123`

3. **Team Member**
   - Username: `user1`
   - Password: `Admin@123`

## 📊 داده‌های نمونه

پس از اجرای Seed Data، داده‌های زیر ایجاد می‌شوند:

- ✅ 3 نقش (Administrator, ProjectManager, TeamMember)
- ✅ 3 کاربر تست
- ✅ 3 منبع (Resources)
- ✅ 2 پروژه نمونه
- ✅ 4 تسک با وابستگی‌ها
- ✅ Time Entries نمونه

## 🎯 شروع کار

1. به صفحه Landing بروید: `http://localhost:5173`
2. روی "شروع کنید" کلیک کنید
3. با یکی از کاربران تست وارد شوید
4. از Dashboard استفاده کنید

## 🔧 Troubleshooting

### مشکل اتصال به Database
- بررسی کنید Connection String در `appsettings.json` درست باشد
- مطمئن شوید SQL Server در دسترس است
- فایروال را بررسی کنید

### مشکل در Frontend
- `npm install` را دوباره اجرا کنید
- پورت 5173 را بررسی کنید
- Console را برای خطاها چک کنید

### مشکل در Backend
- `dotnet restore` را اجرا کنید
- Migration ها را بررسی کنید
- Logs را چک کنید

