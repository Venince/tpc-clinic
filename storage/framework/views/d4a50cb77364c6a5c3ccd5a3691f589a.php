<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 10px }
        .hdr { text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; margin-bottom: 15px }
        h1 { font-size: 17px; color: #4f46e5; margin: 0 }
        table { width: 100%; border-collapse: collapse; margin-bottom: 10px }
        th { background: #4f46e5; color: #fff; padding: 5px 6px; font-size: 9px; text-align: left }
        td { padding: 4px 6px; border-bottom: 1px solid #e8e8e8; font-size: 9px }
        tr:nth-child(even) { background: #f7f9fc }
        .low { color: #d97706; font-weight: bold }
        .out { color: #dc2626; font-weight: bold }
        .sub { font-size: 8px; color: #666; margin: 2px 0 6px 6px }
    </style>
</head>
<body>
    <div class="hdr">
        <h1>TPC Clinic — Medicine Inventory Report</h1>
        <p style="font-size:10px;color:#555">Generated: <?php echo e(now()->format('F d, Y h:i A')); ?></p>
        <p style="font-size:9px;color:#888;margin:2px 0 0">Total Items: <?php echo e(count($data)); ?></p>
    </div>
    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Name</th>
                <th>Description</th>
                <th>Unit</th>
                <th>Qty</th>
                <th>Reorder</th>
                <th>Batch #</th>
                <th>Expires</th>
                <th>Status</th>
                <th>Recent Requests</th>
            </tr>
        </thead>
        <tbody>
            <?php $__empty_1 = true; $__currentLoopData = $data; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $i => $m): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
                <?php
                    $qty = $m['quantity']; $rl = $m['reorder_level'];
                    $cls = $qty === 0 ? 'out' : ($qty <= $rl ? 'low' : '');
                    $label = $qty === 0 ? 'Out of Stock' : ($qty <= $rl ? 'Low Stock' : 'OK');
                ?>
                <tr>
                    <td><?php echo e($i + 1); ?></td>
                    <td><?php echo e($m['name']); ?></td>
                    <td><?php echo e($m['description'] ?? '—'); ?></td>
                    <td><?php echo e($m['unit']); ?></td>
                    <td class="<?php echo e($cls); ?>"><?php echo e($qty); ?></td>
                    <td><?php echo e($rl); ?></td>
                    <td><?php echo e($m['batch_number'] ?? '—'); ?></td>
                    <td><?php echo e($m['expiration_date'] ?? '—'); ?></td>
                    <td class="<?php echo e($cls); ?>"><?php echo e($label); ?></td>
                    <td>
                        <?php $__empty_2 = true; $__currentLoopData = ($m['requests'] ?? []); $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $r): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_2 = false; ?>
                            <?php echo e($r['user']['name'] ?? '—'); ?> (<?php echo e($r['quantity_requested'] ?? 0); ?>, <?php echo e(ucfirst($r['status'] ?? '—')); ?>)<?php if(!$loop->last): ?>, <?php endif; ?>
                        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_2): ?>
                            —
                        <?php endif; ?>
                    </td>
                </tr>
            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
                <tr><td colspan="10" style="text-align:center">No records.</td></tr>
            <?php endif; ?>
        </tbody>
    </table>
</body>
</html><?php /**PATH C:\Projects\Laravel\tpc-clinic\resources\views/pdf/reports/medicine.blade.php ENDPATH**/ ?>