# TPC Clinic — Database Schema & ERD

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         TPC CLINIC DATABASE                          │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────────┐
│    roles     │         │    users     │         │  student_profiles│
├──────────────┤    1    ├──────────────┤   1..1  ├──────────────────┤
│ id           │◄────────│ id           │─────────│ id               │
│ name         │         │ role_id (FK) │         │ user_id (FK)     │
│ display_name │         │ name         │         │ program_id (FK)  │
│ description  │         │ email        │         │ student_id       │
└──────────────┘         │ password     │         │ year_level       │
                         │ is_active    │         │ block            │
┌──────────────┐         │ force_pw     │         │ birth_date       │
│  permissions │         │ last_login   │         │ sex              │
├──────────────┤         │ ...          │         │ is_pregnant      │
│ id           │         └──────────────┘         │ ...              │
│ name         │                │                 └──────────────────┘
│ display_name │                │ 1..1
│ group        │                │                 ┌──────────────────┐
└──────────────┘                │                 │ faculty_profiles │
       │                        ▼                 ├──────────────────┤
       │ M..M           ┌──────────────┐          │ id               │
       └────────────────│role_perms    │          │ user_id (FK)     │
                        └──────────────┘          │ employee_id      │
                                                  │ department       │
                                                  │ is_pregnant      │
                                                  │ ...              │
                                                  └──────────────────┘

┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│    programs      │     │ appointment_slots│     │   appointments   │
├──────────────────┤     ├──────────────────┤     ├──────────────────┤
│ id               │     │ id               │◄────│ id               │
│ code             │     │ date             │ 1   │ user_id (FK)     │
│ name             │     │ start_time       │     │ slot_id (FK)     │
│ description      │     │ end_time         │     │ purpose          │
│ is_active        │     │ max_appointments │     │ status           │
└──────────────────┘     │ booked_count     │     │ decline_reason   │
        │                │ is_available     │     │ reviewed_by (FK) │
        │ 1..M           │ created_by (FK)  │     │ reviewed_at      │
        ▼                └──────────────────┘     └──────────────────┘
┌──────────────────┐
│ student_profiles │ (links programs → students via program_id)
└──────────────────┘

┌──────────────────┐     ┌──────────────────┐
│    medicines     │     │ medicine_requests│
├──────────────────┤     ├──────────────────┤
│ id               │◄────│ id               │
│ name             │ 1   │ user_id (FK)     │
│ description      │     │ medicine_id (FK) │
│ unit             │     │ qty_requested    │
│ quantity         │     │ qty_released     │
│ reorder_level    │     │ reason           │
│ expiration_date  │     │ status           │
│ is_active        │     │ reviewed_by (FK) │
└──────────────────┘     └──────────────────┘

┌──────────────────┐     ┌──────────────────┐
│ requirement_types│     │user_requirements │
├──────────────────┤     ├──────────────────┤
│ id               │◄────│ id               │
│ name             │ 1   │ user_id (FK)     │
│ description      │     │ req_type_id (FK) │
│ is_active        │     │ file_path        │
│ sort_order       │     │ verification_sta │
└──────────────────┘     │ approval_status  │
                         │ reviewed_by (FK) │
                         └──────────────────┘

┌──────────────────┐     ┌──────────────────┐
│ survey_questions │     │  survey_answers  │
├──────────────────┤     ├──────────────────┤
│ id               │◄────│ id               │
│ question         │ 1   │ user_id (FK)     │
│ type             │     │ question_id (FK) │
│ options (JSON)   │     │ answer (JSON)    │
│ is_required      │     └──────────────────┘
│ sort_order       │
│ is_active        │
└──────────────────┘

┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  conversations   │     │conv_participants │     │    messages      │
├──────────────────┤     ├──────────────────┤     ├──────────────────┤
│ id               │◄────│ conversation_id  │     │ id               │
│ subject          │ 1   │ user_id (FK)     │     │conversation_id   │
│ is_active        │     │ last_read_at     │     │ sender_id (FK)   │
│ last_message_at  │     │ is_archived      │     │ body             │
└──────────────────┘     └──────────────────┘     │ attachments JSON │
        │                                          │ is_read          │
        │ 1..M                                     └──────────────────┘
        └─────────────────────────────────────────────▲
                                                       │ FK

┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  announcements   │     │   audit_logs     │     │    reports       │
├──────────────────┤     ├──────────────────┤     ├──────────────────┤
│ id               │     │ id               │     │ id               │
│ created_by (FK)  │     │ user_id (FK)     │     │ generated_by(FK) │
│ title            │     │ action           │     │ type             │
│ content          │     │ model_type       │     │ title            │
│ category         │     │ model_id         │     │ filters (JSON)   │
│ is_published     │     │ old_values (JSON)│     │ file_path        │
│ published_at     │     │ new_values (JSON)│     │ format           │
│ expires_at       │     │ ip_address       │     │ status           │
└──────────────────┘     │ user_agent       │     │ completed_at     │
                         └──────────────────┘     └──────────────────┘

┌──────────────────────────────────────────────────┐
│               notifications (Laravel)            │
├──────────────────────────────────────────────────┤
│ id (UUID)                                        │
│ type                                             │
│ notifiable_type                                  │
│ notifiable_id                                    │
│ data (TEXT/JSON)                                 │
│ read_at                                          │
│ created_at                                       │
└──────────────────────────────────────────────────┘
```

---

## Table Descriptions

### `roles`
Stores the 4 system roles: `student`, `faculty_staff`, `admin`, `super_admin`.

### `permissions`
Fine-grained permission flags grouped by feature area.  
Linked to roles via `role_permissions` pivot.

### `users`
Core authentication table. All accounts created by admin only.  
`force_password_change = true` on first login until password is updated.

### `student_profiles`
1:1 with users where role = student. Stores academic info, pregnancy status.

### `faculty_profiles`
1:1 with users where role = faculty_staff. Stores departmental info, pregnancy status.

### `programs`
Academic programs (BSIT, BSED, etc.). Students are categorized by program, year, and block.

### `appointment_slots`
Admin-created time slots. `booked_count` tracks bookings, slot auto-disables when full.

### `appointments`
Student/faculty bookings linked to slots. Soft-deleted on removal.

### `medicines`
Inventory items with quantity tracking. `reorder_level` triggers low-stock alerts.

### `medicine_requests`
Tracks requests through states: `pending → approved → released` or `rejected`.

### `requirement_types`
Dynamic requirement definitions (Drug Test, Medical Cert, Vaccination Card + custom).

### `user_requirements`
User-uploaded files linked to requirement types. Dual-status: verification + approval.

### `survey_questions`
Dynamic health survey with 6 question types. `sort_order` for drag-and-drop reordering.

### `survey_answers`
JSON-based answer storage, unique per user+question combination.

### `conversations` + `conversation_participants` + `messages`
Three-table messaging system. Participants track read status per user.  
Broadcasting-ready via `MessageSent` event on `private-conversation.{id}`.

### `announcements`
Published with optional expiry dates. Category-filtered.

### `audit_logs`
Immutable activity log. Records action, actor, model, old/new values, IP.

### `reports`
Async report generation queue. Stores filters, format, status, output path.

### `notifications`
Standard Laravel notifications table (UUID primary key).

---

## Indexes Summary

| Table                 | Index                                    |
|-----------------------|------------------------------------------|
| users                 | email, is_active                         |
| appointment_slots     | date, is_available; date                 |
| appointments          | user_id + status; status                 |
| medicine_requests     | user_id + status; status                 |
| survey_questions      | sort_order                               |
| survey_answers        | user_id + survey_question_id (unique)    |
| user_requirements     | user_id + requirement_type_id            |
| messages              | conversation_id + created_at             |
| audit_logs            | user_id + created_at; model; action      |
| announcements         | is_published + published_at              |
