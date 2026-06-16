<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0 }
        body { font-family: DejaVu Sans, sans-serif; font-size: 9px; color: #111 }

        /* ── Header ── */
        .hdr { text-align: center; border-bottom: 2px solid #16a34a; padding-bottom: 10px; margin-bottom: 14px }
        .hdr img { width: 100% }
        .hdr-title { font-size: 14px; color: #16a34a; font-weight: bold; margin: 6px 0 2px }
        .hdr-meta  { font-size: 9px; color: #444; margin: 2px 0 }

        /* ── Summary badges ── */
        .summary { width: 100%; margin-bottom: 12px; border-collapse: separate; border-spacing: 6px 0 }
        .badge-box {
            border: 1px solid #d1fae5; background: #f0fdf4;
            border-radius: 6px; padding: 6px 10px; text-align: center; width: 25%
        }
        .badge-box .num  { font-size: 15px; font-weight: bold; color: #16a34a }
        .badge-box .lbl  { font-size: 8px; color: #555; margin-top: 1px }

        /* ── Table ── */
        table { width: 100%; border-collapse: collapse; margin-top: 4px }
        thead th {
            background: #16a34a; color: #fff;
            padding: 5px 5px; font-size: 8px; text-align: left;
            white-space: nowrap
        }
        tbody td { padding: 4px 5px; border-bottom: 1px solid #e5e7eb; font-size: 8px; vertical-align: top }
        tbody tr:nth-child(even) { background: #f0fdf4 }
        tbody tr:hover { background: #dcfce7 }

        /* ── Vital signs sub-table ── */
        .vs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1px 6px }
        .vs-row  { font-size: 7.5px; color: #374151 }
        .vs-lbl  { color: #6b7280; font-size: 7px }

        /* ── Meds pill list ── */
        .med-pill {
            display: inline-block; background: #dbeafe;
            color: #1e40af; border-radius: 10px;
            padding: 1px 5px; font-size: 7px; margin: 1px 1px 0 0
        }

        /* ── No records ── */
        .empty { text-align: center; color: #9ca3af; padding: 20px; font-size: 10px }

        /* ── Footer ── */
        .footer {
            position: fixed; bottom: 0; left: 0; right: 0;
            border-top: 1px solid #e5e7eb;
            font-size: 7.5px; color: #9ca3af;
            padding: 4px 12px;
            display: flex; justify-content: space-between
        }
    </style>
</head>
<body>

    {{-- ── Header ── --}}
    <div class="hdr">
        <img src="{{ public_path('images/header.png') }}" alt="TPC Header" />
        <div class="hdr-title">TPC Clinic — Walk-in Log Report</div>
        <div class="hdr-meta">Generated: {{ now()->format('F d, Y \a\t h:i A') }}</div>
        <div class="hdr-meta">Prepared by: {{ $report->generatedBy?->name ?? '—' }}</div>
    </div>

    {{-- ── Summary row ── --}}
    @php
        $total      = count($data);
        $uniquePats = collect($data)->pluck('user.id')->unique()->count();
        $withMeds   = collect($data)->filter(fn($r) => !empty($r['medicines_dispensed']))->count();
        $today      = collect($data)->filter(fn($r) => isset($r['visited_at']) && \Carbon\Carbon::parse($r['visited_at'])->isToday())->count();
    @endphp
    <table class="summary">
        <tr>
            <td class="badge-box">
                <div class="num">{{ $total }}</div>
                <div class="lbl">Total Visits</div>
            </td>
            <td class="badge-box">
                <div class="num">{{ $uniquePats }}</div>
                <div class="lbl">Unique Patients</div>
            </td>
            <td class="badge-box">
                <div class="num">{{ $withMeds }}</div>
                <div class="lbl">Received Medicines</div>
            </td>
            <td class="badge-box">
                <div class="num">{{ $today }}</div>
                <div class="lbl">Visits Today</div>
            </td>
        </tr>
    </table>

    {{-- ── Main table ── --}}
    <table>
        <thead>
            <tr>
                <th style="width:20px">#</th>
                <th style="width:90px">Patient</th>
                <th style="width:65px">Date &amp; Time</th>
                <th style="width:80px">Chief Complaint</th>
                <th style="width:95px">Vital Signs</th>
                <th style="width:80px">Diagnosis</th>
                <th style="width:70px">Treatment</th>
                <th style="width:85px">Medicines Dispensed</th>
                <th style="width:60px">Notes</th>
                <th style="width:60px">Logged By</th>
            </tr>
        </thead>
        <tbody>
            @forelse($data as $i => $row)
                @php
                    $vs   = $row['vital_signs'] ?? [];
                    $meds = $row['medicines_dispensed'] ?? [];
                @endphp
                <tr>
                    <td>{{ $i + 1 }}</td>

                    {{-- Patient --}}
                    <td>
                        <div style="font-weight:bold">{{ $row['user']['name'] ?? '—' }}</div>
                        <div style="color:#6b7280;font-size:7px">{{ $row['user']['email'] ?? '' }}</div>
                    </td>

                    {{-- Date & Time --}}
                    <td>
                        @if(isset($row['visited_at']))
                            <div>{{ \Carbon\Carbon::parse($row['visited_at'])->format('M d, Y') }}</div>
                            <div style="color:#6b7280">{{ \Carbon\Carbon::parse($row['visited_at'])->format('h:i A') }}</div>
                        @else
                            —
                        @endif
                    </td>

                    {{-- Chief Complaint --}}
                    <td>{{ $row['chief_complaint'] ?? '—' }}</td>

                    {{-- Vital Signs grid --}}
                    <td>
                        @if(!empty($vs))
                            <div class="vs-grid">
                                @if(isset($vs['blood_pressure']))
                                    <div class="vs-row"><span class="vs-lbl">BP</span><br>{{ $vs['blood_pressure'] }}</div>
                                @endif
                                @if(isset($vs['temperature']))
                                    <div class="vs-row"><span class="vs-lbl">Temp</span><br>{{ $vs['temperature'] }}°C</div>
                                @endif
                                @if(isset($vs['heart_rate']))
                                    <div class="vs-row"><span class="vs-lbl">HR</span><br>{{ $vs['heart_rate'] }} bpm</div>
                                @endif
                                @if(isset($vs['respiratory_rate']))
                                    <div class="vs-row"><span class="vs-lbl">RR</span><br>{{ $vs['respiratory_rate'] }} rpm</div>
                                @endif
                                @if(isset($vs['oxygen_saturation']))
                                    <div class="vs-row"><span class="vs-lbl">O₂ Sat</span><br>{{ $vs['oxygen_saturation'] }}%</div>
                                @endif
                                @if(isset($vs['weight']) || isset($vs['height']))
                                    <div class="vs-row">
                                        <span class="vs-lbl">Wt/Ht</span><br>
                                        {{ $vs['weight'] ?? '—' }}kg / {{ $vs['height'] ?? '—' }}cm
                                    </div>
                                @endif
                            </div>
                        @else
                            <span style="color:#9ca3af">—</span>
                        @endif
                    </td>

                    {{-- Diagnosis --}}
                    <td>{{ $row['diagnosis'] ?? '—' }}</td>

                    {{-- Treatment --}}
                    <td>{{ $row['treatment'] ?? '—' }}</td>

                    {{-- Medicines Dispensed --}}
                    <td>
                        @if(!empty($meds))
                            @foreach($meds as $med)
                                <span class="med-pill">
                                    {{ $med['name'] ?? '?' }}
                                    @if(isset($med['quantity'])) × {{ $med['quantity'] }} @endif
                                </span>
                            @endforeach
                        @else
                            <span style="color:#9ca3af">—</span>
                        @endif
                    </td>

                    {{-- Notes --}}
                    <td style="color:#6b7280">{{ $row['notes'] ?? '—' }}</td>

                    {{-- Logged By --}}
                    <td>{{ $row['logged_by_name'] ?? '—' }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="10" class="empty">No walk-in records found.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    {{-- ── Footer ── --}}
    <div class="footer">
        <span>TPC Clinic Walk-in Log Report</span>
        <span>Total: {{ $total }} record(s)</span>
        <span>{{ now()->format('Y-m-d H:i') }}</span>
    </div>

</body>
</html>
