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
        .badge-red { color: #dc2626; font-weight: bold }
        .small { font-size: 8px; color: #888 }
    </style>
</head>
<body>
    <div class="hdr">
        <h1>TPC Clinic — Faculty Health Report</h1>
        <p style="font-size:10px;color:#555">Generated: <?php echo e(now()->format('F d, Y h:i A')); ?></p>
        <p style="font-size:9px;color:#888;margin:2px 0 0">Total Records: <?php echo e(count($data)); ?></p>
    </div>
    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Position</th>
                <th>Sex</th>
                <th>Birth Date</th>
                <th>Civil Status</th>
                <th>Contact</th>
                <th>Address</th>
                <th>Pregnant</th>
                <th>Due Date</th>
                <th>Medical Notes</th>
            </tr>
        </thead>
        <tbody>
            <?php $__empty_1 = true; $__currentLoopData = $data; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $i => $p): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
                <tr>
                    <td><?php echo e($i + 1); ?></td>
                    <td><?php echo e($p['employee_id'] ?? '—'); ?></td>
                    <td><?php echo e($p['user']['name'] ?? '—'); ?></td>
                    <td class="small"><?php echo e($p['user']['email'] ?? '—'); ?></td>
                    <td><?php echo e($p['department'] ?? '—'); ?></td>
                    <td><?php echo e($p['position'] ?? '—'); ?></td>
                    <td><?php echo e(ucfirst($p['sex'] ?? '—')); ?></td>
                    <td><?php echo e($p['birth_date'] ?? '—'); ?></td>
                    <td><?php echo e(ucfirst($p['civil_status'] ?? '—')); ?></td>
                    <td><?php echo e($p['contact_number'] ?? '—'); ?></td>
                    <td class="small"><?php echo e($p['address'] ?? '—'); ?></td>
                    <td class="<?php echo e($p['is_pregnant'] ? 'badge-red' : ''); ?>"><?php echo e($p['is_pregnant'] ? 'Yes' : 'No'); ?></td>
                    <td><?php echo e($p['pregnancy_due_date'] ?? '—'); ?></td>
                    <td class="small"><?php echo e($p['medical_notes'] ?? '—'); ?></td>
                </tr>
            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
                <tr><td colspan="14" style="text-align:center">No records.</td></tr>
            <?php endif; ?>
        </tbody>
    </table>
</body>
</html><?php /**PATH C:\Projects\Laravel\tpc-clinic\resources\views/pdf/reports/faculty_health.blade.php ENDPATH**/ ?>