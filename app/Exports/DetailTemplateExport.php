<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;

class DetailTemplateExport implements FromArray, WithHeadings
{
    public function headings(): array
    {
        return [
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
                'Validation Logic',
                'to do',
                'medium',
                'admin',
                'Request fails with 422 if email is invalid.',
                '1. Check email format\n2. Verify password length',
                'https://api.screenshot.com/validation-flow.png',
                'https://api.screenshot.com/validation-error.png'
            ],
            [
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
