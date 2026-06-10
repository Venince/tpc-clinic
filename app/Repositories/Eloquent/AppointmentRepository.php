<?php
namespace App\Repositories\Eloquent;
use App\Models\Appointment;
use App\Repositories\Contracts\AppointmentRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class AppointmentRepository implements AppointmentRepositoryInterface
{
    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return Appointment::with(['user', 'slot', 'reviewer'])
            ->when(isset($filters['status']),  fn($q) => $q->where('status', $filters['status']))
            ->when(isset($filters['user_id']), fn($q) => $q->where('user_id', $filters['user_id']))
            ->when(isset($filters['date']),    fn($q) => $q->whereHas('slot', fn($s) => $s->whereDate('date', $filters['date'])))
            ->latest()->paginate($perPage);
    }

    public function findById(int $id): ?Appointment
    {
        return Appointment::with(['user', 'slot', 'reviewer'])->find($id);
    }

    public function getByUser(int $userId): \Illuminate\Database\Eloquent\Collection
    {
        return Appointment::with('slot')->where('user_id', $userId)->latest()->get();
    }
}
