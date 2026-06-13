<!DOCTYPE html>
<html>

<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: Arial, sans-serif;
    }
  </style>
</head>

<body>
  <h2>Contact Form Submission - TPC Clinic</h2>
  <p><strong>Name:</strong> <?php echo e($data['name']); ?></p>
  <p><strong>Email:</strong> <?php echo e($data['email']); ?></p>
  <p><strong>Subject:</strong> <?php echo e($data['subject']); ?></p>
  <hr>
  <p><strong>Message:</strong></p>
  <p><?php echo e($data['message']); ?></p>
</body>

</html><?php /**PATH C:\Projects\Laravel\tpc-clinic\resources\views\emails\contact.blade.php ENDPATH**/ ?>