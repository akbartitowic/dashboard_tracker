<?php

namespace App\Imports;

use App\Models\Card;
use App\Models\Checklist;
use App\Models\User;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class SubTaskImport implements ToCollection, WithHeadingRow
{
    protected $card;

    public function __construct(Card $card)
    {
        $this->card = $card;
    }

    public function collection(Collection $rows)
    {
        foreach ($rows as $row) {
            $content = $row['subtask_content'] ?? null;
            if (!$content) continue;

            $assignee = null;
            if (!empty($row['subtask_assignee'])) {
                $assignee = User::where('username', $row['subtask_assignee'])->first();
            }

            Checklist::updateOrCreate([
                'card_id' => $this->card->id,
                'content' => $content
            ], [
                'status' => $row['subtask_status'] ?? 'to do',
                'assigned_to' => $assignee?->id,
                'position' => Checklist::where('card_id', $this->card->id)->max('position') + 1
            ]);
        }
    }
}
