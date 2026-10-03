<?php

namespace App\Exports;

use App\Models\User;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;

class NeverLoggedInUsersExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithTitle
{
    public function collection(): Collection
    {
        // Same scoping as the Users page count and the bulk-delete action:
        // never logged in, and never super_admin accounts.
        return User::with('role:id,name,display_name')
            ->whereNull('last_login_at')
            ->whereHas('role', fn($r) => $r->where('name', '!=', 'super_admin'))
            ->orderBy('name')
            ->get();
    }

    public function headings(): array
    {
        return ['#', 'Name', 'Email', 'Role', 'Status', 'Date Created'];
    }

    public function map($user): array
    {
        static $i = 0;
        $i++;

        return [
            $i,
            $user->name,
            $user->email,
            $user->role?->display_name ?? $user->role?->name ?? '—',
            $user->is_active ? 'Active' : 'Inactive',
            $user->created_at?->format('Y-m-d'),
        ];
    }

    public function title(): string
    {
        return 'Never Logged In';
    }
}