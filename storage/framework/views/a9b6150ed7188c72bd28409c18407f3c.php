<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 10px }
        h1 { font-size: 17px; color: #4f46e5; text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 8px }
        h3 { color: #4f46e5; border-left: 4px solid #4f46e5; padding-left: 8px }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px }
        th { background: #4f46e5; color: #fff; padding: 5px 6px; font-size: 9px; text-align: left }
        td { padding: 4px 6px; border-bottom: 1px solid #e8e8e8; font-size: 9px }
        tr:nth-child(even) { background: #f7f9fc }
        .small { font-size: 8px; color: #888 }
    </style>
</head>
<body>
    <h1>TPC Clinic — Pregnancy Monitoring Report</h1>
    <p style="text-align:center;font-size:10px;color:#555">Generated: <?php echo e(now()->format('F d, Y h:i A')); ?></p>

    <h3>Pregnant Students (<?php echo e(count($data['students'])); ?>)</h3>
    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Program</th>
                <th>Year/Block</th>
                <th>Birth Date</th>
                <th>Contact</th>
                <th>Address</th>
                <th>Guardian</th>
                <th>Guardian Contact</th>
                <th>Due Date</th>
                <th>Medical Notes</th>
            </tr>
        </thead>
        <tbody>
            <?php $__empty_1 = true; $__currentLoopData = $data['students']; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $i => $p): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
                <tr>
                    <td><?php echo e($i + 1); ?></td>
                    <td><?php echo e($p['user']['name'] ?? '—'); ?></td>
                    <td class="small"><?php echo e($p['user']['email'] ?? '—'); ?></td>
                    <td><?php echo e($p['program']['code'] ?? '—'); ?></td>
                    <td><?php echo e($p['year_level'] ?? '—'); ?><?php echo e($p['block'] ? ' - '.$p['block'] : ''); ?></td>
                    <td><?php echo e($p['birth_date'] ?? '—'); ?></td>
                    <td><?php echo e($p['contact_number'] ?? '—'); ?></td>
                    <td class="small"><?php echo e($p['address'] ?? '—'); ?></td>
                    <td><?php echo e($p['guardian_name'] ?? '—'); ?></td>
                    <td><?php echo e($p['guardian_contact'] ?? '—'); ?></td>
                    <td><?php echo e($p['pregnancy_due_date'] ?? '—'); ?></td>
                    <td class="small"><?php echo e($p['medical_notes'] ?? '—'); ?></td>
                </tr>
            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
                <tr><td colspan="12" style="text-align:center">None</td></tr>
            <?php endif; ?>
        </tbody>
    </table>

    <h3>Pregnant Faculty/Staff (<?php echo e(count($data['faculty'])); ?>)</h3>
    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Position</th>
                <th>Birth Date</th>
                <th>Contact</th>
                <th>Address</th>
                <th>Due Date</th>
                <th>Medical Notes</th>
            </tr>
        </thead>
        <tbody>
            <?php $__empty_1 = true; $__currentLoopData = $data['faculty']; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $i => $p): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
                <tr>
                    <td><?php echo e($i + 1); ?></td>
                    <td><?php echo e($p['user']['name'] ?? '—'); ?></td>
                    <td class="small"><?php echo e($p['user']['email'] ?? '—'); ?></td>
                    <td><?php echo e($p['department'] ?? '—'); ?></td>
                    <td><?php echo e($p['position'] ?? '—'); ?></td>
                    <td><?php echo e($p['birth_date'] ?? '—'); ?></td>
                    <td><?php echo e($p['contact_number'] ?? '—'); ?></td>
                    <td class="small"><?php echo e($p['address'] ?? '—'); ?></td>
                    <td><?php echo e($p['pregnancy_due_date'] ?? '—'); ?></td>
                    <td class="small"><?php echo e($p['medical_notes'] ?? '—'); ?></td>
                </tr>
            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
                <tr><td colspan="10" style="text-align:center">None</td></tr>
            <?php endif; ?>
        </tbody>
    </table>
</body>
</html><?php /**PATH C:\Projects\Laravel\tpc-clinic\resources\views/pdf/reports/pregnancy.blade.php ENDPATH**/ ?>