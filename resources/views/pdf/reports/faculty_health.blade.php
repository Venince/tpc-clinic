<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 10px }
        .hdr { text-align: center; border-bottom: 2px solid #16a34a; padding-bottom: 10px; margin-bottom: 15px }
        .hdr-inner { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 4px }
        .logo { width: 48px; height: 48px }
        h1 { font-size: 17px; color: #16a34a; margin: 0 }
        table { width: 100%; border-collapse: collapse }
        th { background: #16a34a; color: #fff; padding: 5px 6px; font-size: 9px; text-align: left }
        td { padding: 4px 6px; border-bottom: 1px solid #e8e8e8; font-size: 9px }
        tr:nth-child(even) { background: #f0fdf4 }
        .badge-red { color: #dc2626; font-weight: bold }
        .small { font-size: 8px; color: #888 }
    </style>
</head>
<body>
    <div class="hdr">
        <div class="hdr-inner">
            <img src="{{ public_path('images/tpc-logo.png') }}" class="logo" alt="TPC Logo" />
            <h1>TPC Clinic — Faculty Health Report</h1>
        </div>
        <p style="font-size:10px;color:#555;margin:0">Generated: {{ now()->format('F d, Y h:i A') }}</p>
        <p style="font-size:9px;color:#888;margin:2px 0 0">Total Records: {{ count($data) }}</p>
    </div>
    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Position</th>
                <th>Sex</th>
                <th>Birth Date</th>
                <th>Civil Status</th>
                <th>Contact</th>
                <th>Address</th>
                <th>Pregnant</th>
                <th>Due Date</th>
                <th>Medical Notes</th>
            </tr>
        </thead>
        <tbody>
            @forelse($data as $i => $p)
                <tr>
                    <td>{{ $i + 1 }}</td>
                    <td>{{ $p['employee_id'] ?? '—' }}</td>
                    <td>{{ $p['user']['name'] ?? '—' }}</td>
                    <td class="small">{{ $p['user']['email'] ?? '—' }}</td>
                    <td>{{ $p['department'] ?? '—' }}</td>
                    <td>{{ $p['position'] ?? '—' }}</td>
                    <td>{{ ucfirst($p['sex'] ?? '—') }}</td>
                    <td>{{ $p['birth_date'] ?? '—' }}</td>
                    <td>{{ ucfirst($p['civil_status'] ?? '—') }}</td>
                    <td>{{ $p['contact_number'] ?? '—' }}</td>
                    <td class="small">{{ $p['address'] ?? '—' }}</td>
                    <td class="{{ $p['is_pregnant'] ? 'badge-red' : '' }}">{{ $p['is_pregnant'] ? 'Yes' : 'No' }}</td>
                    <td>{{ $p['pregnancy_due_date'] ?? '—' }}</td>
                    <td class="small">{{ $p['medical_notes'] ?? '—' }}</td>
                </tr>
            @empty
                <tr><td colspan="14" style="text-align:center">No records.</td></tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>