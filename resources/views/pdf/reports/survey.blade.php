<!DOCTYPE html><html><head><meta charset="utf-8">
<style>body{font-family:DejaVu Sans,sans-serif;font-size:11px}
h1{font-size:17px;color:#4f46e5;text-align:center;border-bottom:2px solid #4f46e5;padding-bottom:8px}
.qblock{margin:12px 0;padding:10px 14px;border:1px solid #ddd;border-radius:4px;background:#f8fafc}
.qtitle{font-weight:bold;color:#4f46e5;font-size:12px}
.meta{font-size:9px;color:#888;margin:3px 0}
.count{display:inline-block;background:#4f46e5;color:#fff;border-radius:10px;padding:1px 8px;font-size:9px}</style>
</head><body>
<h1>TPC Clinic — Survey Report</h1>
<p style="text-align:center;font-size:10px;color:#555">Generated: {{ now()->format('F d, Y h:i A') }}</p>
@foreach($data as $q)
<div class="qblock">
<div class="qtitle">{{ $loop->iteration }}. {{ $q['question'] }}</div>
<div class="meta">Type: {{ ucfirst($q['type']) }} &nbsp;|&nbsp; <span class="count">{{ $q['answers_count'] }} responses</span></div>
</div>
@endforeach
</body></html>
