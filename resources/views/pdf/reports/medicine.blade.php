<!DOCTYPE html>
<html>

<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: DejaVu Sans, sans-serif;
      font-size: 11px
    }

    .hdr {
      text-align: center;
      border-bottom: 2px solid #4f46e5;
      padding-bottom: 10px;
      margin-bottom: 15px
    }

    h1 {
      font-size: 17px;
      color: #4f46e5;
      margin: 0
    }

    table {
      width: 100%;
      border-collapse: collapse
    }

    th {
      background: #4f46e5;
      color: #fff;
      padding: 6px 8px;
      font-size: 10px;
      text-align: left
    }

    td {
      padding: 5px 8px;
      border-bottom: 1px solid #e8e8e8
    }

    tr:nth-child(even) {
      background: #f7f9fc
    }

    .low {
      color: #d97706;
      font-weight: bold
    }

    .out {
      color: #dc2626;
      font-weight: bold
    }
  </style>
</head>

<body>
  <div class="hdr">
    <h1>TPC Clinic — Medicine Inventory Report</h1>
    <p style="font-size:10px;color:#555">Generated: {{ now()->format('F d, Y h:i A') }}</p>
  </div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Name</th>
        <th>Unit</th>
        <th>Qty</th>
        <th>Reorder</th>
        <th>Expires</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      @forelse($data as $i => $m)
        @php $qty = $m['quantity'];
          $rl = $m['reorder_level'];
          $cls = $qty === 0 ? 'out' : ($qty <= $rl ? 'low' : '');
        $label = $qty === 0 ? 'Out of Stock' : ($qty <= $rl ? 'Low Stock' : 'OK'); @endphp
        <tr>
          <td>{{ $i + 1 }}</td>
          <td>{{ $m['name'] }}</td>
          <td>{{ $m['unit'] }}</td>
          <td class="{{ $cls }}">{{ $qty }}</td>
          <td>{{ $rl }}</td>
          <td>{{ $m['expiration_date'] ?? '—' }}</td>
          <td class="{{ $cls }}">{{ $label }}</td>
        </tr>
      @empty<tr>
        <td colspan="7" style="text-align:center">No records.</td>
      </tr>@endforelse
    </tbody>
  </table>
</body>

</html>