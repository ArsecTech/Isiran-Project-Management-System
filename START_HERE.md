# 🎯 شروع کار با Isiran

## ✅ کارهای انجام شده

1. ✅ **Migration ها آماده** - می‌توانید با EF Core یا SQL Scripts اجرا کنید
2. ✅ **Seed Data کامل** - شامل کاربران تست و داده‌های نمونه
3. ✅ **Landing Page بهبود یافته** - طراحی مدرن و زیبا
4. ✅ **Backend آماده** - API کامل با تمام endpoints
5. ✅ **Frontend آماده** - UI کامل با React 19

## 🚀 راه‌اندازی (3 مرحله)

### مرحله 1: Database

**روش ساده (SQL Scripts):**
1. SQL Server Management Studio را باز کنید
2. به سرور `193.151.145.179` متصل شوید
3. فایل `database/Schema.sql` را اجرا کنید
4. فایل `database/SeedData.sql` را اجرا کنید

**یا با EF Core:**
```powershell
# در PowerShell در مسیر پروژه:
cd "E:\GodZTech\Isiran – Project Management System\src\Isiran.Infrastructure"
dotnet ef migrations add InitialCreate --startup-project ..\Isiran.Api
dotnet ef database update --startup-project ..\Isiran.Api
```

### مرحله 2: Backend

```powershell
cd "E:\GodZTech\Isiran – Project Management System\src\Isiran.Api"
dotnet restore
dotnet run
```

✅ API در `https://localhost:5001` اجرا می‌شود

### مرحله 3: Frontend

```powershell
cd "E:\GodZTech\Isiran – Project Management System\frontend"
npm install
npm run dev
```

✅ Frontend در `http://localhost:5173` اجرا می‌شود

## 🔐 کاربران تست

همه با رمز عبور: **`Admin@123`**

| Username | Role | Email |
|----------|------|-------|
| **admin** | Administrator | admin@isiran.com |
| **pm1** | ProjectManager | pm1@isiran.com |
| **user1** | TeamMember | user1@isiran.com |

## 🎨 ویژگی‌های Landing Page

- ✅ طراحی مدرن و زیبا
- ✅ Gradient backgrounds
- ✅ Animations و Hover effects
- ✅ Responsive design
- ✅ بخش Features با 9 ویژگی
- ✅ بخش Stats
- ✅ بخش How It Works
- ✅ CTA Section جذاب

## 📊 داده‌های نمونه

پس از Seed Data:
- ✅ 3 نقش (Administrator, ProjectManager, TeamMember)
- ✅ 3 کاربر تست
- ✅ 3 منبع (Resources)
- ✅ 2 پروژه نمونه
- ✅ 4 تسک با وابستگی‌ها
- ✅ Time Entries نمونه

## 🎯 شروع استفاده

1. به `http://localhost:5173` بروید
2. صفحه Landing زیبا را ببینید
3. روی "شروع کنید" کلیک کنید
4. با `admin` / `Admin@123` وارد شوید
5. از تمام ویژگی‌ها استفاده کنید!

## 📝 نکات مهم

- Connection String در `appsettings.json` تنظیم شده
- Database: `IsiranDB`
- Server: `193.151.145.179`
- تمام API endpoints با JWT محافظت شده‌اند

## 🔗 لینک‌های مفید

- Swagger: `https://localhost:5001/swagger`
- Frontend: `http://localhost:5173`
- Landing: `http://localhost:5173/`

---

**همه چیز آماده است! فقط Database را Setup کنید و شروع کنید! 🚀**

