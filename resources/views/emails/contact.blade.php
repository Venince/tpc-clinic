<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f0fdf4; margin: 0; padding: 20px; }
    .wrap { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,.1); }
    .hdr { background: #16a34a; color: #fff; padding: 30px; text-align: center; }
    .hdr h1 { margin: 0; font-size: 22px; letter-spacing: .5px; }
    .hdr p { margin: 4px 0 0; opacity: .85; font-size: 13px; }
    .body { padding: 32px 30px; }
    .body h2 { color: #15803d; margin-top: 0; }
    .field { margin-bottom: 16px; }
    .field-label { font-size: 12px; text-transform: uppercase; letter-spacing: .5px; color: #6b7280; margin-bottom: 4px; }
    .field-value { background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; padding: 10px 14px; color: #111827; font-size: 14px; }
    .message-box { background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; padding: 14px; color: #111827; font-size: 14px; line-height: 1.6; white-space: pre-wrap; }
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
      <h2>New Contact Form Submission</h2>
      <p style="color:#374151;">Someone has sent a message through the TPC e-Clinic contact form.</p>

      <div class="field">
        <div class="field-label">Name</div>
        <div class="field-value">{{ $data['name'] }}</div>
      </div>
      <div class="field">
        <div class="field-label">Email</div>
        <div class="field-value">{{ $data['email'] }}</div>
      </div>
      <div class="field">
        <div class="field-label">Subject</div>
        <div class="field-value">{{ $data['subject'] }}</div>
      </div>
      <div class="field">
        <div class="field-label">Message</div>
        <div class="message-box">{{ $data['message'] }}</div>
      </div>

      <hr class="divider">
      <p style="font-size:13px; color:#6b7280;">
        Reply directly to <strong>{{ $data['email'] }}</strong> to respond to this inquiry.
      </p>
    </div>
    <div class="ftr">
      © {{ date('Y') }} <strong>TPC e-Clinic</strong> · Talibon Polytechnic College<br>
      This is an automated notification from the contact form.
    </div>
  </div>
</body>
</html>