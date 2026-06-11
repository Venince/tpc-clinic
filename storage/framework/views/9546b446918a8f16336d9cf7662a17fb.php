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
            border-bottom: 2px solid #16a34a;
            padding-bottom: 10px;
            margin-bottom: 15px
        }

        .hdr-inner {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            margin-bottom: 4px
        }

        .logo {
            width: 48px;
            height: 48px
        }

        h1 {
            font-size: 17px;
            color: #16a34a;
            margin: 0
        }

        table {
            width: 100%;
            border-collapse: collapse
        }

        th {
            background: #16a34a;
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
            background: #f0fdf4
        }
    </style>
</head>

<body>
    <div class="hdr">
        <div class="hdr-inner">
            <img src="<?php echo e(public_path('images/tpc-logo.png')); ?>" class="logo" alt="TPC Logo" />
            <h1>TPC Clinic — Student Health Report</h1>
        </div>
        <p style="font-size:10px;color:#555;margin:0">Generated: <?php echo e(now()->format('F d, Y h:i A')); ?></p>
    </div>
    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Name</th>
                <th>Program</th>
                <th>Year</th>
                <th>Sex</th>
                <th>Pregnant</th>
            </tr>
        </thead>
        <tbody>
            <?php $__empty_1 = true; $__currentLoopData = $data; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $i => $p): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
                <tr>
                    <td><?php echo e($i + 1); ?></td>
                    <td><?php echo e($p['user']['name'] ?? '—'); ?></td>
                    <td><?php echo e($p['program']['code'] ?? '—'); ?></td>
                    <td><?php echo e($p['year_level'] ?? '—'); ?></td>
                    <td><?php echo e(ucfirst($p['sex'] ?? '—')); ?></td>
                    <td><?php echo e($p['is_pregnant'] ? 'Yes' : 'No'); ?></td>
                </tr>
            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?><tr>
                <td colspan="6" style="text-align:center">No records.</td>
            </tr><?php endif; ?>
        </tbody>
    </table>
</body>

</html><?php /**PATH C:\Projects\Laravel\tpc-clinic\resources\views/pdf/reports/student_health.blade.php ENDPATH**/ ?>