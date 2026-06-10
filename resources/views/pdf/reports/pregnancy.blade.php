<!DOCTYPE html><html><head><meta charset="utf-8">
<style>body{font-family:DejaVu Sans,sans-serif;font-size:11px}
h1{font-size:17px;color:#4f46e5;text-align:center;border-bottom:2px solid #4f46e5;padding-bottom:8px}
h3{color:#4f46e5;border-left:4px solid #4f46e5;padding-left:8px}
table{width:100%;border-collapse:collapse;margin-bottom:20px}
th{background:#4f46e5;color:#fff;padding:6px 8px;font-size:10px;text-align:left}
td{padding:5px 8px;border-bottom:1px solid #e8e8e8}tr:nth-child(even){background:#f7f9fc}</style>
</head><body>
<h1>TPC Clinic — Pregnancy Monitoring Report</h1>
<p style="text-align:center;font-size:10px;color:#555">Generated: {{ now()->format('F d, Y h:i A') }}</p>
<h3>Pregnant Students ({{ count($data['students']) }})</h3>
<table><thead><tr><th>#</th><th>Name</th><th>Program</th><th>Year</th><th>Due Date</th></tr></thead>
<tbody>
@forelse($data['students'] as $i=>$p)<tr><td>{{ $i+1 }}</td><td>{{ $p['user']['name']??'—' }}</td><td>{{ $p['program']['code']??'—' }}</td><td>{{ $p['year_level']??'—' }}</td><td>{{ $p['pregnancy_due_date']??'—' }}</td></tr>
@empty<tr><td colspan="5" style="text-align:center">None</td></tr>@endforelse
</tbody></table>
<h3>Pregnant Faculty/Staff ({{ count($data['faculty']) }})</h3>
<table><thead><tr><th>#</th><th>Name</th><th>Department</th><th>Due Date</th></tr></thead>
<tbody>
@forelse($data['faculty'] as $i=>$p)<tr><td>{{ $i+1 }}</td><td>{{ $p['user']['name']??'—' }}</td><td>{{ $p['department']??'—' }}</td><td>{{ $p['pregnancy_due_date']??'—' }}</td></tr>
@empty<tr><td colspan="4" style="text-align:center">None</td></tr>@endforelse
</tbody></table>
</body></html>
