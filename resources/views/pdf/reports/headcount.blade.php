<!DOCTYPE html>
<html>

<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: DejaVu Sans, sans-serif;
      font-size: 10px;
      color: #111
    }

    .hdr {
      text-align: center;
      border-bottom: 2px solid #16a34a;
      padding-bottom: 10px;
      margin-bottom: 15px
    }

    h1 {
      font-size: 17px;
      color: #16a34a;
      margin: 0
    }

    table {
      width: 100%;
      border-collapse: collapse
    }

    th {
      background: #16a34a;
      color: #fff;
      padding: 5px 6px;
      font-size: 9px;
      text-align: left
    }

    td {
      padding: 4px 6px;
      border-bottom: 1px solid #e8e8e8;
      font-size: 9px;
      color: #111
    }

    tr:nth-child(even) {
      background: #f0fdf4
    }

    .small {
      font-size: 8px;
      color: #666
    }

    tfoot td {
      border-top: 2px solid #16a34a;
      border-bottom: none
    }
  </style>
</head>

<body>
  <div class="hdr">
    <img src="{{ public_path('images/header.png') }}" style="width:100%" alt="TPC Header" />
    <h1 style="font-size:14px;color:#16a34a;margin:6px 0 2px">
      TPC Clinic — {{ $data['category'] === 'faculty' ? 'Faculty & Staff' : 'Student' }} Headcount Report
    </h1>
    <p style="font-size:10px;color:#111;margin:0">Generated: {{ now()->format('F d, Y') }}</p>
    <p style="font-size:9px;color:#111;margin:2px 0 0">Total: {{ $data['total'] }}</p>
  </div>

  @if($data['category'] === 'faculty')
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Department</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        @forelse($data['rows'] as $i => $r)
          <tr>
            <td>{{ $i + 1 }}</td>
            <td>{{ $r['department'] ?? '—' }}</td>
            <td>{{ $r['total'] }}</td>
          </tr>
        @empty
          <tr>
            <td colspan="3" style="text-align:center">No records.</td>
          </tr>
        @endforelse
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="font-weight:bold;text-align:right">Grand Total</td>
          <td style="font-weight:bold">{{ $data['total'] }}</td>
        </tr>
      </tfoot>
    </table>
  @else
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Program</th>
          <th>Year Level</th>
          <th>Block</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        @forelse($data['rows'] as $i => $r)
          <tr>
            <td>{{ $i + 1 }}</td>
            <td>
              {{ $r['program_code'] ?? '—' }}
              @if(!empty($r['program_name']))
                <span class="small"> — {{ $r['program_name'] }}</span>
              @endif
            </td>
            <td>{{ $r['year_level'] ?? '—' }}</td>
            <td>{{ $r['block'] ?? '—' }}</td>
            <td>{{ $r['total'] }}</td>
          </tr>
        @empty
          <tr>
            <td colspan="5" style="text-align:center">No records.</td>
          </tr>
        @endforelse
      </tbody>
      <tfoot>
        <tr>
          <td colspan="4" style="font-weight:bold;text-align:right">Grand Total</td>
          <td style="font-weight:bold">{{ $data['total'] }}</td>
        </tr>
      </tfoot>
    </table>
  @endif
</body>

</html>