<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;

class SubTaskTemplateExport implements FromArray, WithHeadings
{
    public function headings(): array
    {
        return [
            'Subtask Content',
            'Subtask Status',
            'Subtask Assignee'
        ];
    }

    public function array(): array
    {
        return [
            [
                'Develop Auth Controller',
                'in progress',
                'admin'
            ],
            [
                'Refactor Stat Cards',
                'to do',
                'admin'
            ]
        ];
    }
}
