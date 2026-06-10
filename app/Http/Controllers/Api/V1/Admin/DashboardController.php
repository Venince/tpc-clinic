<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __construct(private DashboardService $dashboardService) {}

    public function stats(): JsonResponse
    {
        return response()->json(['data' => $this->dashboardService->getAdminStats()]);
    }

    public function appointmentChart(): JsonResponse
    {
        return response()->json(['data' => $this->dashboardService->getAppointmentChartData()]);
    }

    public function medicineChart(): JsonResponse
    {
        return response()->json(['data' => $this->dashboardService->getMedicineChartData()]);
    }

    public function programDistribution(): JsonResponse
    {
        return response()->json(['data' => $this->dashboardService->getProgramDistribution()]);
    }

    public function pregnancyStats(): JsonResponse
    {
        return response()->json(['data' => $this->dashboardService->getPregnancyStats()]);
    }
}
