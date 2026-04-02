<?php

namespace App\Imports;

use App\Models\Checklist;
use App\Models\QaDetail;
use App\Models\User;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class DetailImport implements ToCollection, WithHeadingRow
{
    protected $checklist;

    public function __construct(Checklist $checklist)
    {
        $this->checklist = $checklist;
    }

    public function collection(Collection $rows)
    {
        foreach ($rows as $row) {
            $title = $row['detail_title'] ?? null;
            if (!$title) continue;

            $assignee = null;
            if (!empty($row['detail_assignee'])) {
                $assignee = User::where('username', $row['detail_assignee'])->first();
            }

            QaDetail::updateOrCreate([
                'checklist_id' => $this->checklist->id,
                'title' => $title
            ], [
                'status' => $row['detail_status'] ?? 'to do',
                'priority' => $row['detail_priority'] ?? 'medium',
                'assigned_to' => $assignee?->id,
                'expected_result' => $row['detail_expected_result'] ?? null,
                'steps_to_reproduce' => $row['detail_steps'] ?? null,
                'image_url' => $row['detail_image_url'] ?? null,
                'error_url' => $row['detail_error_url'] ?? null,
                'position' => QaDetail::where('checklist_id', $this->checklist->id)->max('position') + 1
            ]);
        }
    }
}
