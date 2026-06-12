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
        .small { font-size: 8px; color: #888 }
        .status-pending   { color: #d97706; font-weight: bold }
        .status-approved  { color: #2563eb; font-weight: bold }
        .status-completed { color: #16a34a; font-weight: bold }
        .status-declined, .status-cancelled { color: #dc2626; font-weight: bold }
    </style>
</head>
<body>
    <div class="hdr">
        <div class="hdr-inner">
            <img src="{{ public_path('images/tpc-logo.png') }}" class="logo" alt="TPC Logo" />
            <h1>TPC Clinic — Appointment Report</h1>
        </div>
        <p style="font-size:10px;color:#555;margin:0">Generated: {{ now()->format('F d, Y h:i A') }}</p>
        <p style="font-size:9px;color:#888;margin:2px 0 0">Total Records: {{ count($data) }}</p>
    </div>
    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Patient</th>
                <th>Email</th>
                <th>Purpose</th>
                <th>Notes</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Reviewed By</th>
                <th>Reviewed At</th>
                <th>Decline Reason</th>
            </tr>
        </thead>
        <tbody>
            @forelse($data as $i => $a)
                <tr>
                    <td>{{ $i + 1 }}</td>
                    <td>{{ $a['user']['name'] ?? '—' }}</td>
                    <td class="small">{{ $a['user']['email'] ?? '—' }}</td>
                    <td>{{ $a['purpose'] ?? '—' }}</td>
                    <td class="small">{{ $a['notes'] ?? '—' }}</td>
                    <td>{{ $a['slot']['date'] ?? '—' }}</td>
                    <td>{{ $a['slot']['start_time'] ?? '—' }}</td>
                    <td class="status-{{ $a['status'] }}">{{ ucfirst($a['status']) }}</td>
                    <td>{{ $a['reviewer']['name'] ?? '—' }}</td>
                    <td class="small">{{ $a['reviewed_at'] ?? '—' }}</td>
                    <td class="small">{{ $a['decline_reason'] ?? '—' }}</td>
                </tr>
            @empty
                <tr><td colspan="11" style="text-align:center">No records.</td></tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>