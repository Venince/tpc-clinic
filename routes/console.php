<?php
use Illuminate\Support\Facades\Schedule;
Schedule::command('clinic:check-low-stock')->dailyAt('08:00');
