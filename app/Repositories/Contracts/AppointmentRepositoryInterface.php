<?php
namespace App\Repositories\Contracts;
use App\Models\Appointment;
use Illuminate\Pagination\LengthAwarePaginator;

interface AppointmentRepositoryInterface
{
    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator;
    public function findById(int $id): ?Appointment;
    public function getByUser(int $userId): \Illuminate\Database\Eloquent\Collection;
}
