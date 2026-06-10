<?php
/**
 * TPC Clinic Application Configuration
 * Custom application-level settings for the clinic system.
 */
return [

    /*
    |--------------------------------------------------------------------------
    | Application Settings
    |--------------------------------------------------------------------------
    */
    'name'     => env('APP_NAME', 'TPC Clinic'),
    'timezone' => env('APP_TIMEZONE', 'Asia/Manila'),

    /*
    |--------------------------------------------------------------------------
    | File Upload Settings
    |--------------------------------------------------------------------------
    */
    'uploads' => [
        'max_file_size'       => env('MAX_FILE_SIZE', 10240),   // KB
        'allowed_mime_types'  => ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
        'requirements_disk'   => 'private',
        'messages_disk'       => 'private',
        'photos_disk'         => 'public',
    ],

    /*
    |--------------------------------------------------------------------------
    | Rate Limiting
    |--------------------------------------------------------------------------
    */
    'rate_limits' => [
        'api'     => env('API_RATE_LIMIT', 60),    // requests per minute
        'login'   => env('LOGIN_RATE_LIMIT', 5),   // attempts per minute
        'contact' => 10,                            // contact form per minute
    ],

    /*
    |--------------------------------------------------------------------------
    | Appointment Settings
    |--------------------------------------------------------------------------
    */
    'appointments' => [
        'reminder_days_before' => 1,   // Send reminder N days before appointment
        'max_future_days'      => 60,  // How far in advance can slots be created
    ],

    /*
    |--------------------------------------------------------------------------
    | Medicine Inventory Settings
    |--------------------------------------------------------------------------
    */
    'medicine' => [
        'low_stock_check_time' => '08:00',  // Daily check time (HH:MM)
    ],

    /*
    |--------------------------------------------------------------------------
    | Report Settings
    |--------------------------------------------------------------------------
    */
    'reports' => [
        'disk'             => 'local',
        'path'             => 'reports',
        'retention_days'   => 90,    // Delete reports older than N days
    ],

    /*
    |--------------------------------------------------------------------------
    | Audit Log Settings
    |--------------------------------------------------------------------------
    */
    'audit' => [
        'enabled'          => true,
        'retention_days'   => 365,   // Keep audit logs for N days
    ],

];
