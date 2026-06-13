<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px }
        .hdr { text-align: center; border-bottom: 2px solid #16a34a; padding-bottom: 10px; margin-bottom: 15px }
        .hdr-inner { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 4px }
        .logo { width: 48px; height: 48px }
        h1 { font-size: 17px; color: #16a34a; margin: 0 }
        .qblock { margin: 12px 0; padding: 10px 14px; border: 1px solid #ddd; border-radius: 4px; background: #f8fafc }
        .qtitle { font-weight: bold; color: #16a34a; font-size: 12px }
        .meta { font-size: 9px; color: #888; margin: 3px 0 6px }
        .count { display: inline-block; background: #16a34a; color: #fff; border-radius: 10px; padding: 1px 8px; font-size: 9px }
        table { width: 100%; border-collapse: collapse; margin-top: 4px }
        th { background: #e5e7eb; color: #374151; padding: 4px 6px; font-size: 9px; text-align: left }
        td { padding: 3px 6px; border-bottom: 1px solid #eee; font-size: 9px }
        .small { font-size: 8px; color: #888 }
    </style>
</head>
<body>
    <div class="hdr">
        <div class="hdr-inner">
            <img src="<?php echo e(public_path('images/tpc-logo.png')); ?>" class="logo" alt="TPC Logo" />
            <h1>TPC Clinic — Survey Report</h1>
        </div>
        <p style="font-size:10px;color:#555;margin:0">Generated: <?php echo e(now()->format('F d, Y h:i A')); ?></p>
    </div>
    <?php $__currentLoopData = $data; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $q): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
        <div class="qblock">
            <div class="qtitle"><?php echo e($loop->iteration); ?>. <?php echo e($q['question']); ?></div>
            <div class="meta">
                Type: <?php echo e(ucfirst($q['type'])); ?> &nbsp;|&nbsp;
                Required: <?php echo e($q['is_required'] ? 'Yes' : 'No'); ?> &nbsp;|&nbsp;
                <span class="count"><?php echo e($q['answers_count']); ?> responses</span>
            </div>
            <?php if(!empty($q['answers'])): ?>
                <table>
                    <thead><tr><th>Respondent</th><th>Answer</th></tr></thead>
                    <tbody>
                        <?php $__currentLoopData = $q['answers']; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $a): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                            <tr>
                                <td><?php echo e($a['user']['name'] ?? '—'); ?></td>
                                <td class="small">
                                    <?php $ans = $a['answer']; ?>
                                    <?php echo e(is_array($ans) ? implode(', ', $ans) : $ans); ?>

                                </td>
                            </tr>
                        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>
    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
</body>
</html><?php /**PATH C:\Projects\Laravel\tpc-clinic\resources\views\pdf\reports\survey.blade.php ENDPATH**/ ?>