<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;}</style></head>
<body>
<h2>Contact Form Submission - TPC Clinic</h2>
<p><strong>Name:</strong> {{ $data['name'] }}</p>
<p><strong>Email:</strong> {{ $data['email'] }}</p>
<p><strong>Subject:</strong> {{ $data['subject'] }}</p>
<hr>
<p><strong>Message:</strong></p>
<p>{{ $data['message'] }}</p>
</body>
</html>
