<?php

namespace App\Services;

use App\Models\SmtpSetting;
use App\Models\NotificationLog;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Mail\Message;

class EmailService
{
    /**
     * Configure the mailer dynamically from the database SMTP settings.
     */
    protected function configure(): bool
    {
        $setting = SmtpSetting::first();

        if (!$setting || empty($setting->host) || empty($setting->username)) {
            Log::info('Email notification skipped: SMTP not configured.');
            return false;
        }

        Config::set('mail.mailers.smtp.host', $setting->host);
        Config::set('mail.mailers.smtp.port', $setting->port ?? 587);
        Config::set('mail.mailers.smtp.username', $setting->username);
        Config::set('mail.mailers.smtp.password', $setting->password);
        Config::set('mail.mailers.smtp.encryption', $setting->encryption ?? 'tls');
        Config::set('mail.from.address', $setting->from_address);
        Config::set('mail.from.name', $setting->from_name ?? 'Tracker BPKP');

        // Reset the mail manager so it picks up the new config
        app()->forgetInstance('mail.manager');
        app()->forgetInstance('mailer');

        return true;
    }

    /**
     * Send an email.
     *
     * @param  string  $to       Recipient email address
     * @param  string  $subject  Email subject
     * @param  string  $body     HTML body
     */
    public function sendMail(string $to, string $subject, string $body, $userId = null, $context = null, $cardId = null, $taskType = null, $purpose = null): bool
    {
        if (!$this->configure()) {
            return false;
        }

        if (empty($to)) {
            Log::info('Email notification skipped: Recipient email is empty.');
            return false;
        }

        $logData = [
            'user_id' => $userId,
            'type' => 'email',
            'recipient' => $to,
            'subject' => $subject,
            'content' => $body,
            'context' => $context,
            'card_id' => $cardId,
            'task_type' => $taskType,
            'purpose' => $purpose,
        ];

        try {
            Mail::html($body, function (Message $message) use ($to, $subject) {
                $message->to($to)->subject($subject);
            });

            Log::info("Email sent to {$to}: {$subject}");
            NotificationLog::create(array_merge($logData, ['status' => 'sent']));
            return true;
        } catch (\Exception $e) {
            $errorMessage = $e->getMessage();
            Log::error('Email service error: ' . $errorMessage);
            NotificationLog::create(array_merge($logData, [
                'status' => 'failed',
                'error_message' => $errorMessage
            ]));
            return false;
        }
    }

    /**
     * Send an email using a Blade template.
     */
    public function sendTemplateMail(string $to, string $subject, string $view, array $data, $userId = null, $context = null, $cardId = null, $taskType = null, $purpose = null): bool
    {
        try {
            $body = view($view, $data)->render();
            return $this->sendMail($to, $subject, $body, $userId, $context, $cardId, $taskType, $purpose);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Template email error: ' . $e->getMessage());
            return false;
        }
    }
}
