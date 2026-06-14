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
        h3 { color: #16a34a; border-left: 4px solid #16a34a; padding-left: 8px }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px }
        th { background: #16a34a; color: #fff; padding: 5px 6px; font-size: 9px; text-align: left }
        td { padding: 4px 6px; border-bottom: 1px solid #e8e8e8; font-size: 9px; color: #111 }
        tr:nth-child(even) { background: #f0fdf4 }
        .small { font-size: 8px; color: #111 }
    </style>
</head>
<body>
    <div class="hdr">
        <img src="{{ public_path('images/header.png') }}" style="width:100%" alt="TPC Header" />
        <h1 style="font-size:14px;color:#16a34a;margin:6px 0 2px">TPC Clinic — Pregnancy Monitoring Report</h1>
        <p style="font-size:10px;color:#111;margin:0">Generated: {{ now()->format('F d, Y') }}</p>
    </div>

    <h3>Pregnant Students ({{ count($data['students']) }})</h3>
    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Program</th>
                <th>Year/Block</th>
                <th>Birth Date</th>
                <th>Contact</th>
                <th>Address</th>
                <th>Guardian</th>
                <th>Guardian Contact</th>
                <th>Due Date</th>
                <th>Medical Notes</th>
            </tr>
        </thead>
        <tbody>
            @forelse($data['students'] as $i => $p)
                <tr>
                    <td>{{ $i + 1 }}</td>
                    <td>{{ $p['user']['name'] ?? '—' }}</td>
                    <td class="small">{{ $p['user']['email'] ?? '—' }}</td>
                    <td>{{ $p['program']['code'] ?? '—' }}</td>
                    <td>{{ $p['year_level'] ?? '—' }}{{ $p['block'] ? ' - '.$p['block'] : '' }}</td>
                    <td>{{ $p['birth_date'] ? \Carbon\Carbon::parse($p['birth_date'])->format('Y-m-d') : '—' }}</td>
                    <td>{{ $p['contact_number'] ?? '—' }}</td>
                    <td class="small">{{ $p['address'] ?? '—' }}</td>
                    <td>{{ $p['guardian_name'] ?? '—' }}</td>
                    <td>{{ $p['guardian_contact'] ?? '—' }}</td>
                    <td>{{ $p['pregnancy_due_date'] ? \Carbon\Carbon::parse($p['pregnancy_due_date'])->format('Y-m-d') : '—' }}</td>
                    <td class="small">{{ $p['medical_notes'] ?? '—' }}</td>
                </tr>
            @empty
                <tr><td colspan="12" style="text-align:center">None</td></tr>
            @endforelse
        </tbody>
    </table>

    <h3>Pregnant Faculty/Staff ({{ count($data['faculty']) }})</h3>
    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Position</th>
                <th>Birth Date</th>
                <th>Contact</th>
                <th>Address</th>
                <th>Due Date</th>
                <th>Medical Notes</th>
            </tr>
        </thead>
        <tbody>
            @forelse($data['faculty'] as $i => $p)
                <tr>
                    <td>{{ $i + 1 }}</td>
                    <td>{{ $p['user']['name'] ?? '—' }}</td>
                    <td class="small">{{ $p['user']['email'] ?? '—' }}</td>
                    <td>{{ $p['department'] ?? '—' }}</td>
                    <td>{{ $p['position'] ?? '—' }}</td>
                    <td>{{ $p['birth_date'] ? \Carbon\Carbon::parse($p['birth_date'])->format('Y-m-d') : '—' }}</td>
                    <td>{{ $p['contact_number'] ?? '—' }}</td>
                    <td class="small">{{ $p['address'] ?? '—' }}</td>
                    <td>{{ $p['pregnancy_due_date'] ? \Carbon\Carbon::parse($p['pregnancy_due_date'])->format('Y-m-d') : '—' }}</td>
                    <td class="small">{{ $p['medical_notes'] ?? '—' }}</td>
                </tr>
            @empty
                <tr><td colspan="10" style="text-align:center">None</td></tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>