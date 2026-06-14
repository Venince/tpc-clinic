<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 10px; color: #111 }
        .hdr { text-align: center; border-bottom: 2px solid #16a34a; padding-bottom: 10px; margin-bottom: 15px }
        h1 { font-size: 17px; color: #16a34a; margin: 0 }
        .qblock { margin: 12px 0; padding: 10px 14px; border: 1px solid #ddd; border-radius: 4px; background: #f8fafc }
        .qtitle { font-weight: bold; color: #16a34a; font-size: 12px }
        .meta { font-size: 9px; color: #111; margin: 3px 0 6px }
        .count { display: inline-block; background: #16a34a; color: #fff; border-radius: 10px; padding: 1px 8px; font-size: 9px }
        table { width: 100%; border-collapse: collapse; margin-top: 4px }
        th { background: #e5e7eb; color: #111; padding: 4px 6px; font-size: 9px; text-align: left }
        td { padding: 3px 6px; border-bottom: 1px solid #eee; font-size: 9px }
        .small { font-size: 8px; color: #111 }
    </style>
</head>
<body>
    <div class="hdr">
        <img src="{{ public_path('images/header.png') }}" style="width:100%" alt="TPC Header" />
        <h1 style="font-size:14px;color:#16a34a;margin:6px 0 2px">TPC Clinic — Survey Report</h1>
        <p style="font-size:10px;color:#111;margin:0">Generated: {{ now()->format('F d, Y') }}</p>
    </div>
    @foreach($data as $q)
        <div class="qblock">
            <div class="qtitle">{{ $loop->iteration }}. {{ $q['question'] }}</div>
            <div class="meta">
                Type: {{ ucfirst($q['type']) }} &nbsp;|&nbsp;
                Required: {{ $q['is_required'] ? 'Yes' : 'No' }} &nbsp;|&nbsp;
                <span class="count">{{ $q['answers_count'] }} responses</span>
            </div>
            @if(!empty($q['answers']))
                <table>
                    <thead><tr><th>Respondent</th><th>Answer</th></tr></thead>
                    <tbody>
                        @foreach($q['answers'] as $a)
                            <tr>
                                <td>{{ $a['user']['name'] ?? '—' }}</td>
                                <td class="small">
                                    @php $ans = $a['answer']; @endphp
                                    {{ is_array($ans) ? implode(', ', $ans) : $ans }}
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @endif
        </div>
    @endforeach
</body>
</html>