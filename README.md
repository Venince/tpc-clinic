# 🏥 TPC Clinic — Full Stack Application

**Laravel 12 + Inertia.js + React + Tailwind CSS**

## Quick Start

### Prerequisites

- PHP 8.2+
- MySQL 8.0+
- Node.js 18+
- Composer 2.x

### Installation

```bash
# 1. Install PHP dependencies
composer install

# 2. Install JS dependencies
npm install

# 3. Environment setup
cp .env.example .env
php artisan key:generate

# 4. Configure database in .env
#    DB_DATABASE=tpc_clinic
#    DB_USERNAME=root
#    DB_PASSWORD=your_password

# 5. Run migrations and seed
php artisan migrate --seed

# 6. Start both servers (two terminals)
php artisan serve      # Terminal 1 → http://localhost:8000
npm run dev            # Terminal 2 → Vite dev server with HMR

# OR for production build
npm run build
php artisan serve
```

## Default Accounts

| Role        | Email                 | Password       |
| ----------- | --------------------- | -------------- |
| Super Admin | superadmin@tpc.edu.ph | SuperAdmin@123 |
| Admin       | admin@tpc.edu.ph      | Admin@123      |
| Student     | student@tpc.edu.ph    | Student@123    |
| Faculty     | faculty@tpc.edu.ph    | Faculty@123    |

> ⚠️ Change all passwords in production!

## Tech Stack

| Layer    | Technology                      |
| -------- | ------------------------------- |
| Backend  | Laravel 12                      |
| Frontend | React 18 + Inertia.js v2        |
| Styling  | Tailwind CSS 3 + custom classes |
| Charts   | Recharts                        |
| Icons    | Heroicons v2                    |
| Auth     | Laravel session (web guard)     |
| Database | MySQL 8 / SQLite (testing)      |
| Queue    | Database (dev) / Redis (prod)   |
| PDF      | barryvdh/laravel-dompdf         |

## Features

- 🔐 Role-based auth (Student, Faculty, Admin, SuperAdmin)
- 📊 Admin dashboard with charts and statistics
- 👥 User management with bulk import via TXT file
- 🎓 Academic program management
- 📅 Appointment booking system with calendar view
- 💊 Medicine inventory + request workflow
- 📋 Dynamic health survey builder (6 question types)
- 📁 Medical requirements upload + admin review
- 📢 Announcements management
- 💬 Private messaging system
- 📈 Report generation (PDF)
- 🔔 Database + email notifications
- 📝 Audit logging
- 🤰 Pregnancy monitoring + statistics

## Running Tests

```bash
php artisan test
php artisan test --testsuite=Feature
php artisan test --filter AuthTest
```
