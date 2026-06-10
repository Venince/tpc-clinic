<?php
namespace App\Http\Controllers\Student;
use App\Http\Controllers\Controller;
use App\Models\RequirementType;
use App\Models\UserRequirement;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RequirementController extends Controller
{
    private function page(Request $request): string
    {
        return $request->user()->role->name === 'student' ? 'Student/Requirements/Index' : 'Faculty/Requirements/Index';
    }

    public function index(Request $request)
    {
        $types = RequirementType::where('is_active',true)->orderBy('sort_order')->get();
        $mine  = UserRequirement::where('user_id',$request->user()->id)->with('requirementType')->get()->keyBy('requirement_type_id');
        return Inertia::render($this->page($request), ['types'=>$types,'requirements'=>$mine]);
    }

    public function upload(Request $request)
    {
        $request->validate([
            'requirement_type_id' => ['required','exists:requirement_types,id'],
            'file'                => ['required','file','mimes:pdf,jpg,jpeg,png,doc,docx','max:10240'],
        ]);

        $path = $request->file('file')->store("requirements/{$request->user()->id}",'private');

        UserRequirement::updateOrCreate(
            ['user_id'=>$request->user()->id,'requirement_type_id'=>$request->requirement_type_id],
            ['file_path'=>$path,'original_filename'=>$request->file('file')->getClientOriginalName(),
             'mime_type'=>$request->file('file')->getMimeType(),'file_size'=>$request->file('file')->getSize(),
             'verification_status'=>'pending','approval_status'=>'pending','rejection_reason'=>null,'reviewed_by'=>null,'reviewed_at'=>null]
        );

        return back()->with('success','File uploaded successfully.');
    }
}
