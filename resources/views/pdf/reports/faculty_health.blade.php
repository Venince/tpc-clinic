<!DOCTYPE html><html><head><meta charset="utf-8">
<style>body{font-family:DejaVu Sans,sans-serif;font-size:11px}
.hdr{text-align:center;border-bottom:2px solid #4f46e5;padding-bottom:10px;margin-bottom:15px}
h1{font-size:17px;color:#4f46e5;margin:0}table{width:100%;border-collapse:collapse}
th{background:#4f46e5;color:#fff;padding:6px 8px;font-size:10px;text-align:left}
td{padding:5px 8px;border-bottom:1px solid #e8e8e8}tr:nth-child(even){background:#f7f9fc}</style>
</head><body>
<div class="hdr"><h1>TPC Clinic — Faculty Health Report</h1><p style="font-size:10px;color:#555">Generated: {{ now()->format('F d, Y h:i A') }}</p></div>
<table><thead><tr><th>#</th><th>Name</th><th>Department</th><th>Position</th><th>Sex</th><th>Pregnant</th></tr></thead>
<tbody>
@forelse($data as $i=>$p)
<tr><td>{{ $i+1 }}</td><td>{{ $p['user']['name']??'—' }}</td><td>{{ $p['department']??'—' }}</td><td>{{ $p['position']??'—' }}</td><td>{{ ucfirst($p['sex']??'—') }}</td><td>{{ $p['is_pregnant']?'Yes':'No' }}</td></tr>
@empty<tr><td colspan="6" style="text-align:center">No records.</td></tr>@endforelse
</tbody></table>
</body></html>
