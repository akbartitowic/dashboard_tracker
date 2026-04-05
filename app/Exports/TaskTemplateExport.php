<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;

class TaskTemplateExport implements FromArray, WithHeadings
{
    public function headings(): array
    {
        return [
            'List Name',
            'Task Title',
            'Task Description',
            'Task Assignee',
            'Task Priority',
            'Task Due Date'
        ];
    }

    public function array(): array
    {
        return [
            [
                'To Do',
                'Implement JWT Member Authentication',
                'Build a secure login system for the mobile app using JWT tokens.',
                'admin',
                'urgent',
                date('Y-m-d', strtotime('+7 days'))
            ],
            [
                'In Progress',
                'UI Modernization - Dashboard',
                'Apply glassmorphism and modern aesthetics to the main analytics dashboard.',
                'admin',
                'medium',
                date('Y-m-d', strtotime('+3 days'))
            ],
            [
                'Ready to Test',
                'Final QA - Mobile Auth',
                'Verify that JWT authentication works on all mobile platforms.',
                'admin',
                'high',
                date('Y-m-d', strtotime('+5 days'))
            ]
        ];
    }
}
