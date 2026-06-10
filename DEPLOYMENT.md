# TPC Clinic — Deployment Guide

**Talibon Polytechnic College Clinic Management System**  
Laravel 12 · MySQL · Redis · Laravel Sanctum

---

## Table of Contents

1. [Server Requirements](#1-server-requirements)
2. [Local Development Setup](#2-local-development-setup)
3. [Production Deployment](#3-production-deployment)
4. [Environment Variables Reference](#4-environment-variables-reference)
5. [Database Setup & Seeding](#5-database-setup--seeding)
6. [Queue Workers](#6-queue-workers)
7. [Scheduler Setup](#7-scheduler-setup)
8. [File Storage Configuration](#8-file-storage-configuration)
9. [Real-time Broadcasting (Pusher)](#9-real-time-broadcasting-pusher)
10. [API Documentation (Swagger)](#10-api-documentation-swagger)
11. [Running Tests](#11-running-tests)
12. [Default Credentials](#12-default-credentials)
13. [Role & Permission Matrix](#13-role--permission-matrix)
14. [API Endpoint Summary](#14-api-endpoint-summary)
15. [Troubleshooting](#15-troubleshooting)

---

## 1. Server Requirements

| Requirement       | Minimum Version |
|-------------------|----------------|
| PHP               | 8.2+           |
| MySQL             | 8.0+           |
| Redis             | 6.0+           |
| Node.js           | 18+ (optional) |
| Composer          | 2.x            |
| Nginx / Apache    | Latest stable  |
| SSL Certificate   | Required (HTTPS)|

**Required PHP Extensions:**
`bcmath, ctype, curl, dom, fileinfo, json, mbstring, openssl, pcre, pdo, pdo_mysql, tokenizer, xml, zip, gd`

---

## 2. Local Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/tpc/clinic.git
cd clinic

# 2. Install dependencies
composer install

# 3. Set up environment
cp .env.example .env
php artisan key:generate

# 4. Configure database in .env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=tpc_clinic
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password

# 5. Run migrations and seed
php artisan migrate --seed

# 6. Create storage symlink
php artisan storage:link

# 7. Start the development server
php artisan serve

# 8. Start queue worker (separate terminal)
php artisan queue:work --queue=default,emails,notifications

# 9. Generate API documentation
php artisan l5-swagger:generate
```

---

## 3. Production Deployment

### A. Server Setup (Ubuntu 22.04 LTS)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install PHP 8.2 and extensions
sudo apt install -y php8.2 php8.2-fpm php8.2-mysql php8.2-mbstring \
    php8.2-xml php8.2-curl php8.2-zip php8.2-gd php8.2-redis \
    php8.2-bcmath php8.2-intl php8.2-fileinfo

# Install MySQL
sudo apt install -y mysql-server

# Install Redis
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Install Nginx
sudo apt install -y nginx
sudo systemctl enable nginx

# Install Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
```

### B. Nginx Configuration

```nginx
# /etc/nginx/sites-available/tpc-clinic
server {
    listen 80;
    listen [::]:80;
    server_name clinic.tpc.edu.ph;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;

    server_name clinic.tpc.edu.ph;
    root /var/www/tpc-clinic/public;
    index index.php;

    ssl_certificate     /etc/letsencrypt/live/clinic.tpc.edu.ph/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/clinic.tpc.edu.ph/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000" always;

    charset utf-8;

    # API routes
    location /api {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # All other routes
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # PHP-FPM
    location ~ \.php$ {
        fastcgi_pass   unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_index  index.php;
        fastcgi_param  SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include        fastcgi_params;
        fastcgi_read_timeout 300;
    }

    # Block access to hidden files
    location ~ /\. {
        deny all;
    }

    # Upload limit
    client_max_body_size 15M;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/tpc-clinic /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### C. Deploy the Application

```bash
# Set up directory
sudo mkdir -p /var/www/tpc-clinic
sudo chown -R www-data:www-data /var/www/tpc-clinic

# Clone project
git clone https://github.com/tpc/clinic.git /var/www/tpc-clinic

# Install dependencies (production only)
cd /var/www/tpc-clinic
composer install --optimize-autoloader --no-dev

# Set environment
cp .env.example .env
nano .env              # Fill in production values
php artisan key:generate

# Permissions
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache

# Run migrations
php artisan migrate --seed --force

# Link storage
php artisan storage:link

# Optimize for production
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

---

## 4. Environment Variables Reference

```env
# Application
APP_NAME="TPC Clinic"
APP_ENV=production
APP_KEY=                     # Auto-generated via artisan key:generate
APP_DEBUG=false              # NEVER true in production
APP_URL=https://clinic.tpc.edu.ph
APP_TIMEZONE=Asia/Manila

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=tpc_clinic
DB_USERNAME=tpc_clinic_user
DB_PASSWORD=strong_password_here

# Cache & Session (use Redis in production)
CACHE_DRIVER=redis
SESSION_DRIVER=redis
SESSION_LIFETIME=120
SESSION_DOMAIN=.tpc.edu.ph
QUEUE_CONNECTION=redis

# Redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

# Mail (Gmail SMTP example)
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=clinic@tpc.edu.ph
MAIL_PASSWORD=app_specific_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=clinic@tpc.edu.ph
MAIL_FROM_NAME="TPC Clinic"

# Pusher (for real-time messaging)
BROADCAST_DRIVER=pusher
PUSHER_APP_ID=your_app_id
PUSHER_APP_KEY=your_app_key
PUSHER_APP_SECRET=your_app_secret
PUSHER_APP_CLUSTER=mt1

# Sanctum
SANCTUM_STATEFUL_DOMAINS=clinic.tpc.edu.ph

# File Upload Limits
MAX_FILE_SIZE=10240    # 10MB in KB
```

---

## 5. Database Setup & Seeding

```bash
# Fresh migration with seed (development only)
php artisan migrate:fresh --seed

# Production — run migrations only
php artisan migrate --force

# Run specific seeder
php artisan db:seed --class=RoleSeeder
php artisan db:seed --class=ProgramSeeder
php artisan db:seed --class=MedicineSeeder
```

**Seeder order matters:**
1. RoleSeeder — Creates 4 roles + permissions
2. UserSeeder — Creates default admin accounts
3. ProgramSeeder — Creates 8 academic programs
4. RequirementTypeSeeder — Creates 3 default requirement types
5. SurveyQuestionSeeder — Creates 10 sample health survey questions
6. MedicineSeeder — Creates sample medicines including low-stock examples

---

## 6. Queue Workers

### Supervisor (recommended for production)

```bash
# Install supervisor
sudo apt install -y supervisor

# Create config
sudo nano /etc/supervisor/conf.d/tpc-clinic-worker.conf
```

```ini
[program:tpc-clinic-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/tpc-clinic/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600 --queue=default,emails,notifications
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=3
redirect_stderr=true
stdout_logfile=/var/www/tpc-clinic/storage/logs/worker.log
stopwaitsecs=3600
```

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start tpc-clinic-worker:*
sudo supervisorctl status
```

---

## 7. Scheduler Setup

Add to crontab (`crontab -e` as `www-data`):

```cron
* * * * * cd /var/www/tpc-clinic && php artisan schedule:run >> /dev/null 2>&1
```

**Scheduled tasks:**
- `clinic:check-low-stock` — Daily at 08:00 AM (notifies admins of low/out-of-stock medicines)
- `clinic:send-appointment-reminders` — Daily at 07:00 AM (sends tomorrow's appointment reminders)

---

## 8. File Storage Configuration

### Local (Default)

Files stored in `storage/app/private` — NOT publicly accessible via URL.  
Use signed URLs or force-download endpoints for requirement files.

### AWS S3 (Recommended for Production)

```env
FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_DEFAULT_REGION=ap-southeast-1
AWS_BUCKET=tpc-clinic-files
```

---

## 9. Real-time Broadcasting (Pusher)

1. Create account at [pusher.com](https://pusher.com)
2. Create a new app (Cluster: `mt1` for Southeast Asia)
3. Copy credentials to `.env`
4. Channel format: `private-conversation.{id}`
5. Frontend subscribes via:

```javascript
const channel = pusher.subscribe(`private-conversation.${conversationId}`);
channel.bind('MessageSent', (data) => {
    console.log('New message:', data);
});
```

---

## 10. API Documentation (Swagger)

```bash
# Generate Swagger docs
php artisan l5-swagger:generate

# Access at:
# https://clinic.tpc.edu.ph/api/documentation
```

---

## 11. Running Tests

```bash
# Run all tests
php artisan test

# Run with coverage
php artisan test --coverage

# Run specific suite
php artisan test --testsuite=Feature
php artisan test --testsuite=Unit

# Run specific test file
php artisan test tests/Feature/Auth/AuthTest.php

# Run specific method
php artisan test --filter test_user_can_login_with_correct_credentials
```

---

## 12. Default Credentials

> ⚠️ **Change all passwords immediately after first deployment!**

| Role       | Email                    | Password       |
|------------|--------------------------|----------------|
| Super Admin| superadmin@tpc.edu.ph    | SuperAdmin@123 |
| Admin      | admin@tpc.edu.ph         | Admin@123      |
| Student    | student@tpc.edu.ph       | Student@123    |
| Faculty    | faculty@tpc.edu.ph       | Faculty@123    |

---

## 13. Role & Permission Matrix

| Feature                        | Student | Faculty | Admin | SuperAdmin |
|--------------------------------|---------|---------|-------|-----------|
| Login / Logout                 | ✅      | ✅      | ✅    | ✅        |
| View own profile               | ✅      | ✅      | ✅    | ✅        |
| Book appointment               | ✅      | ✅      | ✅    | ✅        |
| Request medicine               | ✅      | ✅      | ✅    | ✅        |
| Submit health survey           | ✅      | ✅      | ✅    | ✅        |
| Upload requirements            | ✅      | ✅      | ✅    | ✅        |
| Send/receive messages          | ✅      | ✅      | ✅    | ✅        |
| Manage appointment slots       | ❌      | ❌      | ✅    | ✅        |
| Approve/Decline appointments   | ❌      | ❌      | ✅    | ✅        |
| Manage medicines & inventory   | ❌      | ❌      | ✅    | ✅        |
| Approve medicine requests      | ❌      | ❌      | ✅    | ✅        |
| Manage survey questions        | ❌      | ❌      | ✅    | ✅        |
| Manage requirement types       | ❌      | ❌      | ✅    | ✅        |
| Review user requirements       | ❌      | ❌      | ✅    | ✅        |
| Manage announcements           | ❌      | ❌      | ✅    | ✅        |
| View dashboard analytics       | ❌      | ❌      | ✅    | ✅        |
| Generate reports               | ❌      | ❌      | ✅    | ✅        |
| Create user accounts           | ❌      | ❌      | ✅    | ✅        |
| Manage programs                | ❌      | ❌      | ✅    | ✅        |
| View audit logs                | ❌      | ❌      | ❌    | ✅        |
| Delete admin accounts          | ❌      | ❌      | ❌    | ✅        |

---

## 14. API Endpoint Summary

All endpoints are prefixed with `/api/v1`.

### Authentication
| Method | Endpoint                       | Description             |
|--------|-------------------------------|-------------------------|
| POST   | /auth/login                   | Login                   |
| POST   | /auth/logout                  | Logout (auth required)  |
| GET    | /auth/me                      | Current user info       |
| POST   | /auth/change-password         | Change password         |
| POST   | /auth/forgot-password         | Send reset link         |
| POST   | /auth/reset-password          | Reset password          |

### Public
| Method | Endpoint                         | Description           |
|--------|----------------------------------|-----------------------|
| GET    | /public/announcements            | List announcements    |
| GET    | /public/announcements/{id}       | Single announcement   |
| POST   | /public/contact                  | Contact form          |

### Student & Faculty (role-scoped)
| Method | Endpoint                                   | Description                |
|--------|--------------------------------------------|----------------------------|
| GET    | /student/profile                           | View profile               |
| PUT    | /student/profile                           | Update profile             |
| GET    | /student/appointment-slots                 | Available slots            |
| GET    | /student/appointments                      | My appointments            |
| POST   | /student/appointments                      | Book appointment           |
| POST   | /student/appointments/{id}/cancel          | Cancel appointment         |
| GET    | /student/medicines                         | Available medicines        |
| GET    | /student/medicine-requests                 | My requests                |
| POST   | /student/medicine-requests                 | Request medicine           |
| GET    | /student/survey/questions                  | Survey questions           |
| GET    | /student/survey/my-answers                 | My survey answers          |
| POST   | /student/survey/submit                     | Submit survey              |
| GET    | /student/requirements                      | My requirements status     |
| POST   | /student/requirements/upload               | Upload requirement file    |

### Admin
| Method | Endpoint                                              | Description              |
|--------|-------------------------------------------------------|--------------------------|
| GET    | /admin/dashboard/stats                                | Dashboard statistics     |
| GET    | /admin/dashboard/appointments-chart                   | Chart data               |
| GET    | /admin/dashboard/medicine-chart                       | Medicine chart           |
| GET    | /admin/dashboard/pregnancy-stats                      | Pregnancy statistics     |
| GET    | /admin/users                                          | List users               |
| POST   | /admin/users                                          | Create user              |
| POST   | /admin/users/bulk-import                              | Bulk import via TXT      |
| PUT    | /admin/users/{id}                                     | Update user              |
| DELETE | /admin/users/{id}                                     | Delete user              |
| POST   | /admin/users/{id}/toggle-active                       | Toggle user status       |
| GET/POST/PUT/DELETE | /admin/programs/{id}                     | Program CRUD             |
| GET/POST/PUT/DELETE | /admin/appointment-slots/{id}            | Slot management          |
| GET    | /admin/appointments                                   | All appointments         |
| GET    | /admin/appointments/calendar?month=YYYY-MM            | Calendar view            |
| POST   | /admin/appointments/{id}/approve                      | Approve appointment      |
| POST   | /admin/appointments/{id}/decline                      | Decline appointment      |
| GET/POST/PUT/DELETE | /admin/medicines/{id}                    | Medicine CRUD            |
| GET    | /admin/medicines/low-stock                            | Low stock list           |
| GET    | /admin/medicine-requests                              | All requests             |
| POST   | /admin/medicine-requests/{id}/approve                 | Approve request          |
| POST   | /admin/medicine-requests/{id}/reject                  | Reject request           |
| POST   | /admin/medicine-requests/{id}/release                 | Release medicine         |
| GET/POST/PUT/DELETE | /admin/survey/questions/{id}             | Survey CRUD              |
| POST   | /admin/survey/questions/reorder                       | Reorder questions        |
| GET/POST/PUT/DELETE | /admin/requirement-types/{id}            | Requirement type CRUD    |
| GET    | /admin/user-requirements                              | User requirement list    |
| POST   | /admin/user-requirements/{id}/review                  | Approve/reject           |
| GET/POST/PUT/DELETE | /admin/announcements/{id}                | Announcement CRUD        |
| POST   | /admin/reports/generate                               | Generate report          |
| GET    | /admin/reports/{id}/download                          | Download report          |
| GET    | /admin/audit-logs                                     | Audit logs (SuperAdmin)  |

---

## 15. Troubleshooting

### Common Issues

**Queue jobs not running:**
```bash
php artisan queue:work redis
php artisan queue:failed           # View failed jobs
php artisan queue:retry all        # Retry failed jobs
```

**Permission errors:**
```bash
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

**Cache issues:**
```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

**Emails not sending:**
- Verify SMTP credentials in `.env`
- Check queue worker is running
- Check `storage/logs/laravel.log` for errors

**File upload issues:**
- Check `php.ini`: `upload_max_filesize` and `post_max_size` ≥ 15M
- Check Nginx `client_max_body_size` ≥ 15M

**Rate limiting (429 errors):**
- Login endpoint: 5 attempts/minute per email+IP
- API endpoints: 60 requests/minute per user/IP
- Contact form: 10 requests/minute per IP

---

*TPC Clinic — Talibon Polytechnic College Clinic Management System*  
*Built with Laravel 12 · For support: clinic@tpc.edu.ph*
