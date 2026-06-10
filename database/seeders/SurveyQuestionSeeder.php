<?php
namespace Database\Seeders;
use App\Models\SurveyQuestion;
use Illuminate\Database\Seeder;

class SurveyQuestionSeeder extends Seeder
{
    public function run(): void
    {
        $questions = [
            ['question' => 'Do you have any known allergies?',           'type' => 'radio',     'options' => ['Yes','No'], 'is_required' => true,  'sort_order' => 1],
            ['question' => 'If yes, please describe your allergies.',    'type' => 'paragraph', 'options' => null,         'is_required' => false, 'sort_order' => 2],
            ['question' => 'Do you have any chronic conditions?',        'type' => 'checkbox',  'options' => ['Diabetes','Hypertension','Asthma','Heart Disease','None'], 'is_required' => true, 'sort_order' => 3],
            ['question' => 'Are you currently taking any medications?',  'type' => 'radio',     'options' => ['Yes','No'], 'is_required' => true,  'sort_order' => 4],
            ['question' => 'List medications if applicable.',            'type' => 'paragraph', 'options' => null,         'is_required' => false, 'sort_order' => 5],
            ['question' => 'Date of last physical examination',          'type' => 'date',      'options' => null,         'is_required' => false, 'sort_order' => 6],
            ['question' => 'How would you rate your overall health?',    'type' => 'dropdown',  'options' => ['Excellent','Good','Fair','Poor'], 'is_required' => true, 'sort_order' => 7],
            ['question' => 'Do you smoke or use tobacco products?',      'type' => 'radio',     'options' => ['Yes','No','Former smoker'], 'is_required' => true, 'sort_order' => 8],
            ['question' => 'Do you consume alcoholic beverages?',        'type' => 'radio',     'options' => ['Never','Occasionally','Regularly'], 'is_required' => true, 'sort_order' => 9],
            ['question' => 'Any additional health concerns or notes?',   'type' => 'paragraph', 'options' => null,         'is_required' => false, 'sort_order' => 10],
        ];
        foreach ($questions as $q) {
            SurveyQuestion::firstOrCreate(['question' => $q['question']], array_merge($q, ['is_active' => true]));
        }
    }
}
