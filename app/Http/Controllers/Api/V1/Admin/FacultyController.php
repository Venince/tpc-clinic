<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\FacultyProfile;
use Illuminate\Http\JsonResponse;

class FacultyController extends Controller
{
    public function index(): JsonResponse
    {
        $faculty = FacultyProfile::with('user')
            ->orderBy('id')
            ->get();

        return response()->json(['data' => $faculty]);
    }
}