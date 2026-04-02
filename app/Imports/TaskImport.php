<?php

namespace App\Imports;

use App\Models\Board;
use App\Models\Card;
use App\Models\CardList;
use App\Models\User;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class TaskImport implements ToCollection, WithHeadingRow
{
    protected $board;

    public function __construct(Board $board)
    {
        $this->board = $board;
    }

    public function collection(Collection $rows)
    {
        foreach ($rows as $row) {
            $listName = $row['list_name'] ?? null;
            $taskTitle = $row['task_title'] ?? null;

            if (!$listName || !$taskTitle) continue;

            // 1. Find or Create List
            $cardList = CardList::firstOrCreate([
                'board_id' => $this->board->id,
                'name' => $listName
            ], [
                'position' => CardList::where('board_id', $this->board->id)->max('position') + 1
            ]);

            // 2. Find or Create Card
            $taskAssignee = null;
            if (!empty($row['task_assignee'])) {
                $taskAssignee = User::where('username', $row['task_assignee'])->first();
            }

            Card::updateOrCreate([
                'card_list_id' => $cardList->id,
                'title' => $taskTitle,
            ], [
                'description' => $row['task_description'] ?? '',
                'assigned_to' => $taskAssignee?->id,
                'priority' => $row['task_priority'] ?? 'medium',
                'due_date' => $row['task_due_date'] ?? null,
                'position' => Card::where('card_list_id', $cardList->id)->max('position') + 1
            ]);
        }
    }
}
