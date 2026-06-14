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
        table { width: 100%; border-collapse: collapse; margin-bottom: 10px }
        th { background: #16a34a; color: #fff; padding: 5px 6px; font-size: 9px; text-align: left }
        td { padding: 4px 6px; border-bottom: 1px solid #e8e8e8; font-size: 9px; color: #111 }
        tr:nth-child(even) { background: #f0fdf4 }
        .low { color: #d97706; font-weight: bold }
        .out { color: #dc2626; font-weight: bold }
        .sub { font-size: 8px; color: #111; margin: 2px 0 6px 6px }
    </style>
</head>
<body>
    <div class="hdr">
        <img src="{{ public_path('images/header.png') }}" style="width:100%" alt="TPC Header" />
        <h1 style="font-size:14px;color:#16a34a;margin:6px 0 2px">TPC Clinic — Medicine Inventory Report</h1>
        <p style="font-size:10px;color:#111;margin:0">Generated: {{ now()->format('F d, Y') }}</p>
        <p style="font-size:9px;color:#111;margin:2px 0 0">Total Records: {{ count($data) }}</p>
    </div>
    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Name</th>
                <th>Description</th>
                <th>Unit</th>
                <th>Qty</th>
                <th>Reorder</th>
                <th>Batch #</th>
                <th>Expires</th>
                <th>Status</th>
                <th>Recent Requests</th>
            </tr>
        </thead>
        <tbody>
            @forelse($data as $i => $m)
                @php
                    $qty = $m['quantity']; $rl = $m['reorder_level'];
                    $cls = $qty === 0 ? 'out' : ($qty <= $rl ? 'low' : '');
                    $label = $qty === 0 ? 'Out of Stock' : ($qty <= $rl ? 'Low Stock' : 'OK');
                @endphp
                <tr>
                    <td>{{ $i + 1 }}</td>
                    <td>{{ $m['name'] }}</td>
                    <td>{{ $m['description'] ?? '—' }}</td>
                    <td>{{ $m['unit'] }}</td>
                    <td class="{{ $cls }}">{{ $qty }}</td>
                    <td>{{ $rl }}</td>
                    <td>{{ $m['batch_number'] ?? '—' }}</td>
                    <td>{{ $m['expiration_date'] ? \Carbon\Carbon::parse($m['expiration_date'])->format('Y-m-d') : '—' }}</td>
                    <td class="{{ $cls }}">{{ $label }}</td>
                    <td>
                        @forelse(($m['requests'] ?? []) as $r)
                            {{ $r['user']['name'] ?? '—' }} ({{ $r['quantity_requested'] ?? 0 }}, {{ ucfirst($r['status'] ?? '—') }})@if(!$loop->last), @endif
                        @empty
                            —
                        @endforelse
                    </td>
                </tr>
            @empty
                <tr><td colspan="10" style="text-align:center">No records.</td></tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>