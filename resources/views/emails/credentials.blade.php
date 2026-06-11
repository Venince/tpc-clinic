<!DOCTYPE html>
<html>

<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      background: #f4f4f4;
      margin: 0;
      padding: 20px
    }

    .wrap {
      max-width: 600px;
      margin: 0 auto;
      background: #fff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0, 0, 0, .1)
    }

    .hdr {
      background: #4f46e5;
      color: #fff;
      padding: 30px;
      text-align: center
    }

    .hdr h1 {
      margin: 0;
      font-size: 22px
    }

    .hdr p {
      margin: 4px 0 0;
      opacity: .8;
      font-size: 13px
    }

    .body {
      padding: 30px
    }

    .creds {
      background: #eef2ff;
      border: 1px solid #c7d2fe;
      border-radius: 6px;
      padding: 20px;
      margin: 20px 0
    }

    .creds p {
      margin: 5px 0
    }

    .pwd {
      font-size: 22px;
      letter-spacing: 3px;
      color: #4338ca;
      font-weight: bold
    }

    .warn {
      background: #fef9e7;
      border-left: 4px solid #f59e0b;
      padding: 12px 16px;
      margin: 20px 0;
      font-size: 13px
    }

    .btn {
      display: inline-block;
      background: #4f46e5;
      color: #fff;
      padding: 12px 28px;
      border-radius: 5px;
      text-decoration: none;
      margin: 16px 0
    }

    .ftr {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 11px;
      color: #888
    }
  </style>
</head>

<body>
  <div class="wrap">
    <div class="hdr">
      <h1>🏥 TPC Clinic</h1>
      <p>Talibon Polytechnic College Clinic Management System</p>
    </div>
    <div class="body">
      <h2>Welcome, {{ $user->name }}!</h2>
      <p>Your account has been created. Here are your login credentials:</p>
      <div class="creds">
        <p><strong>Email:</strong> {{ $user->email }}</p>
        <p><strong>Temporary Password:</strong></p>
        <p class="pwd">{{ $password }}</p>
      </div>
      <div class="warn">⚠️ <strong>Important:</strong> You must change your password on first login.</div>
      <a href="{{ config('app.url') }}/login" class="btn">Login to TPC Clinic</a>
      <p>If you need help, contact the clinic staff.</p>
    </div>
    <div class="ftr">© {{ date('Y') }} Talibon Polytechnic College Clinic · Do not reply to this email.</div>
  </div>
</body>

</html>