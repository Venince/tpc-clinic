<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 10px; color: #111 }
        .hdr { text-align: center; border-bottom: 2px solid #16a34a; padding-bottom: 10px; margin-bottom: 15px }
        .hdr-inner { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 4px }
        .logo { width: 48px; height: 48px }
        h1 { font-size: 17px; color: #16a34a; margin: 0 }
        table { width: 100%; border-collapse: collapse }
        th { background: #16a34a; color: #fff; padding: 5px 6px; font-size: 9px; text-align: left }
        td { padding: 4px 6px; border-bottom: 1px solid #e8e8e8; font-size: 9px; color: #111 }
        tr:nth-child(even) { background: #f0fdf4 }
        .badge-red { color: #dc2626; font-weight: bold }
        .small { font-size: 8px; color: #111 }
    </style>
</head>
<body>
    <div class="hdr">
        <img src="{{ public_path('images/header.png') }}" style="width:100%" alt="TPC Header" />
        <h1 style="font-size:14px;color:#16a34a;margin:6px 0 2px">TPC Clinic — Student Health Report</h1>
        <p style="font-size:10px;color:#111;margin:0">Generated: {{ now()->format('F d, Y') }}</p>
        <p style="font-size:9px;color:#111;margin:2px 0 0">Total Records: {{ count($data) }}</p>
    </div>
    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Student ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Program</th>
                <th>Year/Block</th>
                <th>Sex</th>
                <th>Birth Date</th>
                <th>Civil Status</th>
                <th>Contact</th>
                <th>Address</th>
                <th>Guardian</th>
                <th>Guardian Contact</th>
                <th>Pregnant</th>
                <th>Due Date</th>
                <th>Medical Notes</th>
            </tr>
        </thead>
        <tbody>
            @forelse($data as $i => $p)
                <tr>
                    <td>{{ $i + 1 }}</td>
                    <td>{{ $p['student_id'] ?? '—' }}</td>
                    <td>{{ $p['user']['name'] ?? '—' }}</td>
                    <td class="small">{{ $p['user']['email'] ?? '—' }}</td>
                    <td>{{ $p['program']['code'] ?? '—' }}</td>
                    <td>{{ $p['year_level'] ?? '—' }}{{ $p['block'] ? ' - '.$p['block'] : '' }}</td>
                    <td>{{ ucfirst($p['sex'] ?? '—') }}</td>
                    <td>{{ $p['birth_date'] ? \Carbon\Carbon::parse($p['birth_date'])->format('Y-m-d') : '—' }}</td>
                    <td>{{ ucfirst($p['civil_status'] ?? '—') }}</td>
                    <td>{{ $p['contact_number'] ?? '—' }}</td>
                    <td class="small">{{ $p['address'] ?? '—' }}</td>
                    <td>{{ $p['guardian_name'] ?? '—' }}</td>
                    <td>{{ $p['guardian_contact'] ?? '—' }}</td>
                    <td class="{{ $p['is_pregnant'] ? 'badge-red' : '' }}">{{ $p['is_pregnant'] ? 'Yes' : 'No' }}</td>
                    <td>{{ $p['pregnancy_due_date'] ? \Carbon\Carbon::parse($p['pregnancy_due_date'])->format('Y-m-d') : '—' }}</td>
                    <td class="small">{{ $p['medical_notes'] ?? '—' }}</td>
                </tr>
            @empty
                <tr><td colspan="16" style="text-align:center">No records.</td></tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>