<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Medicine extends Model {
    use SoftDeletes;

    protected $fillable = ['name','description','unit','quantity','reorder_level','expiration_date','batch_number','is_active'];

    protected $appends = ['is_low_stock', 'is_out_of_stock', 'is_expired']; // ← add this

    protected function casts(): array {
        return ['expiration_date'=>'date','is_active'=>'boolean','quantity'=>'integer','reorder_level'=>'integer'];
    }

    public function requests() { return $this->hasMany(MedicineRequest::class); }

    // ← rename to getX to become appended attributes
    public function getIsLowStockAttribute(): bool  { return $this->quantity > 0 && $this->quantity <= $this->reorder_level; }
    public function getIsOutOfStockAttribute(): bool { return $this->quantity === 0; }
    public function getIsExpiredAttribute(): bool    { return $this->expiration_date && $this->expiration_date->isPast(); }
}