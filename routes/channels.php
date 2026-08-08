<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Laravel automatically broadcasts new notifications on a private channel
| named "App.Models.User.{id}" for any Notifiable model. This authorizes
| a user to listen only on their own channel.
|
*/

Broadcast::channel('App.Models.User.{id}', function ($user, int $id) {
    return (int) $user->id === $id;
});
