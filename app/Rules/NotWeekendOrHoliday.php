<?php

namespace App\Rules;

use App\Support\PhilippineHolidays;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class NotWeekendOrHoliday implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $reason = PhilippineHolidays::unavailableReason($value);

        if ($reason) {
            $fail("The selected date is invalid: " . ucfirst($reason));
        }
    }
}