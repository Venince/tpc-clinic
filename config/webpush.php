<?php

return [
    'vapid' => [
        'subject'     => env('APP_URL', 'http://localhost'),
        'public_key'  => env('VAPID_PUBLIC_KEY'),
        'private_key' => env('VAPID_PRIVATE_KEY'),
    ],
];
