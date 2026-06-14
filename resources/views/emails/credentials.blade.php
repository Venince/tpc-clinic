<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f0fdf4; margin: 0; padding: 20px; }
    .wrap { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,.1); }
    .hdr { background: #16a34a; color: #fff; padding: 30px; text-align: center; }
    .hdr img { width: 48px; height: 48px; margin-bottom: 10px; }
    .hdr h1 { margin: 0; font-size: 22px; letter-spacing: .5px; }
    .hdr p { margin: 4px 0 0; opacity: .85; font-size: 13px; }
    .body { padding: 32px 30px; }
    .body h2 { color: #15803d; margin-top: 0; }
    .body p { color: #374151; line-height: 1.6; }
    .creds { background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .creds p { margin: 6px 0; color: #374151; }
    .pwd { font-size: 24px; letter-spacing: 4px; color: #15803d; font-weight: bold; margin-top: 8px !important; }
    .warn { background: #fefce8; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 20px 0; font-size: 13px; color: #92400e; border-radius: 0 6px 6px 0; }
    .btn { display: inline-block; background: #16a34a; color: #fff !important; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }
    .btn:hover { background: #15803d; }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
    .ftr { background: #f0fdf4; padding: 20px; text-align: center; font-size: 11px; color: #6b7280; border-top: 1px solid #bbf7d0; }
    .ftr strong { color: #15803d; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="hdr">
      <h1>🏥 TPC e-Clinic</h1>
      <p>Talibon Polytechnic College Clinic Management System</p>
    </div>
    <div class="body">
      <h2>Welcome, {{ $user->name }}!</h2>
      <p>Your account has been created on <strong>TPC e-Clinic</strong>. Here are your login credentials:</p>
      <div class="creds">
        <p><strong>Email:</strong> {{ $user->email }}</p>
        <p><strong>Temporary Password:</strong></p>
        <p class="pwd">{{ $password }}</p>
      </div>
      <div class="warn">
        ⚠️ <strong>Important:</strong> You must change your password upon your first login. Keep your credentials safe and do not share them with anyone.
      </div>
      <a href="{{ config('app.url') }}/tpc_login" class="btn">Login to TPC e-Clinic</a>
      <hr class="divider">
      <p style="font-size:13px; color:#6b7280;">If you did not expect this email or need assistance, please contact the clinic staff directly.</p>
    </div>
    <div class="ftr">
      © {{ date('Y') }} <strong>TPC e-Clinic</strong> · Talibon Polytechnic College<br>
      Do not reply to this email.
    </div>
  </div>
</body>
</html>