<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\Rule;

class LowercaseWithUnderscore implements Rule
{
    public function passes($attribute, $value)
    {
        // Check if the value is lowercase with underscores replacing spaces
        return preg_match('/^[a-z_]+$/', $value);
    }

    public function message()
    {
        return 'This field must be in lowercase with underscores replacing spaces.';
    }
}
