<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;

class TemplateExport implements FromArray, WithHeadings
{
    public function headings(): array
    {
        return [
            'List Name',
            'Task Title',
            'Task Description',
            'Task Assignee',
            'Task Priority',
            'Task Due Date',
            'Subtask Content',
            'Subtask Status',
            'Subtask Priority',
            'Subtask Assignee',
            'Subtask Expected Result',
            'Subtask Steps',
            'Subtask Image URL',
            'Subtask Error URL',
            'Detail Title',
            'Detail Status',
            'Detail Priority',
            'Detail Assignee',
            'Detail Expected Result',
            'Detail Steps',
            'Detail Image URL',
            'Detail Error URL'
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
                date('Y-m-d', strtotime('+7 days')),
                'Develop Auth Controller',
                'in progress',
                'high',
                'admin',
                'Successful login returns a bearer token.',
                "1. Create Login function\n2. Setup JWT Middleware\n3. Return User Object",
                'https://api.screenshot.com/auth-flow.png',
                'https://api.screenshot.com/auth-error.png',
                'Validation Logic',
                'ready to test',
                'medium',
                'admin',
                'Request fails with 422 if email is invalid.',
                '1. Check email format\n2. Verify password length',
                'https://api.screenshot.com/validation-flow.png',
                'https://api.screenshot.com/validation-error.png'
            ],
            [
                'In Progress',
                'UI Modernization - Dashboard',
                'Apply glassmorphism and modern aesthetics to the main analytics dashboard.',
                'admin',
                'medium',
                date('Y-m-d', strtotime('+3 days')),
                'Refactor Stat Cards',
                'to do',
                'medium',
                'admin',
                'Cards look sleek and have hover effects.',
                '1. Update CSS tokens\n2. Re-render charts',
                '',
                '',
                'Gradient System',
                'to do',
                'low',
                'admin',
                'Smooth transitions between dark and light modes.',
                '1. Define linear gradients\n2. Test on OLED screens',
                '',
                ''
            ]
        ];
    }
}
