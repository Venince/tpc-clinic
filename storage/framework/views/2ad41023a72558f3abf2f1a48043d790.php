<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 10px }
        .hdr { text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; margin-bottom: 15px }
        h1 { font-size: 17px; color: #4f46e5; margin: 0 }
        table { width: 100%; border-collapse: collapse }
        th { background: #4f46e5; color: #fff; padding: 5px 6px; font-size: 9px; text-align: left }
        td { padding: 4px 6px; border-bottom: 1px solid #e8e8e8; font-size: 9px }
        tr:nth-child(even) { background: #f7f9fc }
        .small { font-size: 8px; color: #888 }
        .status-pending   { color: #d97706; font-weight: bold }
        .status-approved  { color: #2563eb; font-weight: bold }
        .status-completed { color: #16a34a; font-weight: bold }
        .status-declined, .status-cancelled { color: #dc2626; font-weight: bold }
    </style>
</head>
<body>
    <div class="hdr">
        <h1>TPC Clinic — Appointment Report</h1>
        <p style="font-size:10px;color:#555">Generated: <?php echo e(now()->format('F d, Y h:i A')); ?></p>
        <p style="font-size:9px;color:#888;margin:2px 0 0">Total Records: <?php echo e(count($data)); ?></p>
    </div>
    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Patient</th>
                <th>Email</th>
                <th>Purpose</th>
                <th>Notes</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Reviewed By</th>
                <th>Reviewed At</th>
                <th>Decline Reason</th>
            </tr>
        </thead>
        <tbody>
            <?php $__empty_1 = true; $__currentLoopData = $data; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $i => $a): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
                <tr>
                    <td><?php echo e($i + 1); ?></td>
                    <td><?php echo e($a['user']['name'] ?? '—'); ?></td>
                    <td class="small"><?php echo e($a['user']['email'] ?? '—'); ?></td>
                    <td><?php echo e($a['purpose'] ?? '—'); ?></td>
                    <td class="small"><?php echo e($a['notes'] ?? '—'); ?></td>
                    <td><?php echo e($a['slot']['date'] ?? '—'); ?></td>
                    <td><?php echo e($a['slot']['start_time'] ?? '—'); ?></td>
                    <td class="status-<?php echo e($a['status']); ?>"><?php echo e(ucfirst($a['status'])); ?></td>
                    <td><?php echo e($a['reviewer']['name'] ?? '—'); ?></td>
                    <td class="small"><?php echo e($a['reviewed_at'] ?? '—'); ?></td>
                    <td class="small"><?php echo e($a['decline_reason'] ?? '—'); ?></td>
                </tr>
            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
                <tr><td colspan="11" style="text-align:center">No records.</td></tr>
            <?php endif; ?>
        </tbody>
    </table>
</body>
</html><?php /**PATH C:\Projects\Laravel\tpc-clinic\resources\views/pdf/reports/appointment.blade.php ENDPATH**/ ?>