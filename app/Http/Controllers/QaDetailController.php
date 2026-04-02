<?php

namespace App\Http\Controllers;

use App\Models\Checklist;
use App\Models\QaDetail;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Traits\ResolvesPermissions;

class QaDetailController extends Controller
{
    use ResolvesPermissions;

    protected $whatsapp;
    protected $email;
    protected $activityLog;

    public function __construct(\App\Services\WhatsappService $whatsapp, \App\Services\EmailService $email, \App\Services\ActivityLogService $activityLog)
    {
        $this->whatsapp = $whatsapp;
        $this->email = $email;
        $this->activityLog = $activityLog;
    }

    public function store(Request $request, Checklist $checklist)
    {
        $this->authorizeProjectAction($request->user(), $checklist->card->cardList->board_id, 'qa_manage');

        $request->validate([
            'title' => 'required|string|max:255',
            'status' => 'nullable|string|in:to do,in progress,done dev,re open,done',
            'priority' => 'nullable|string|in:low,medium,high,urgent',
            'assigned_to' => 'nullable|exists:users,id',
        ]);

        $qaDetail = $checklist->qaDetails()->create([
            'title' => $request->title,
            'status' => $request->status ?? 'to do',
            'priority' => $request->priority ?? 'medium',
            'assigned_to' => $request->assigned_to,
            'position' => $checklist->qaDetails()->count(),
        ]);

        $this->activityLog->log('Transaction', "Created QA detail: {$qaDetail->title}", $checklist->card_id);

        $this->notifyOnCreation($qaDetail);

        return back();
    }

    protected function notifyOnCreation(QaDetail $qaDetail)
    {
        // 1. If specifically assigned, notify the assignee
        if ($qaDetail->assigned_to) {
            $this->notifyAssignee($qaDetail);
            return;
        }

        // 2. If not specifically assigned, notify the parent Checklist assignee
        $parentAssignee = $qaDetail->checklist->assignee;
        if ($parentAssignee) {
            $this->notifyParentAssignee($qaDetail, $parentAssignee);
        }
    }

    protected function notifyParentAssignee(QaDetail $qaDetail, \App\Models\User $user)
    {
        $checklist = $qaDetail->checklist;
        $card = $checklist->card;
        
        // WA Notification
        if ($user->phone) {
            $msg = "📢 *New Detail Added to Your Subtask*\n\n"
                 . "Halo *{$user->username}*,\n"
                 . "Ada detail QA baru pada subtask yang kamu kerjakan:\n\n"
                 . "🔸 *Detail:* {$qaDetail->title}\n"
                 . "🔹 *Subtask:* {$checklist->content}\n"
                 . "📋 *Main Task:* {$card->title}\n\n"
                 . "Silakan cek dashboard.";
            
            $this->whatsapp->sendMessage($user->phone, $msg, $user->id, 'qa_addition', $card->id, 'detail', 'addition');
        }

        // Email Notification
        if ($user->email) {
            $subject = "📢 Detail Baru: {$checklist->content}";
            $this->email->sendTemplateMail(
                $user->email, 
                $subject, 
                'emails.notification', 
                [
                    'username' => $user->username,
                    'title' => 'Detail QA Baru Ditambahkan',
                    'message_body' => 'ada detail QA baru pada subtask yang kamu kerjakan.',
                    'target_type' => 'DETAIL',
                    'target_name' => $qaDetail->title,
                    'icon' => '📝',
                    'header_color' => '#d946ef',
                    'header_color_end' => '#a855f7',
                    'slot' => '<tr><td style="color:#64748b;font-size:12px;font-weight:600;width:90px;padding:4px 0;">🔹 Subtask</td><td style="color:#cbd5e1;font-size:13px;font-weight:600;padding:4px 0;">' . $checklist->content . '</td></tr>'
                ],
                $user->id, 'qa_addition', $card->id, 'detail', 'addition'
            );
        }
    }

    public function show(QaDetail $qaDetail)
    {
        $this->authorizeProjectAction(auth()->user(), $qaDetail->checklist->card->cardList->board_id, 'project_view');

        return Inertia::render('QaDetail/Show', [
            'qaDetail' => $qaDetail->load(['checklist.card.cardList.board', 'assignee']),
            'users' => \App\Models\User::all(),
        ]);
    }

    public function update(Request $request, QaDetail $qaDetail)
    {
        $this->authorizeProjectAction($request->user(), $qaDetail->checklist->card->cardList->board_id, 'qa_manage');

        $request->validate([
            'title' => 'nullable|string',
            'status' => 'nullable|string|in:to do,in progress,done dev,re open,done',
            'priority' => 'nullable|string|in:low,medium,high,urgent',
            'assigned_to' => 'nullable|exists:users,id',
            'expected_result' => 'nullable|string',
            'steps_to_reproduce' => 'nullable|string',
            'image_url' => 'nullable|string|max:1000',
            'error_url' => 'nullable|string|max:1000',
        ]);

        $oldAssigneeId = $qaDetail->assigned_to;
        $data = $request->only(['title', 'status', 'priority', 'assigned_to', 'expected_result', 'steps_to_reproduce', 'image_url', 'error_url']);
        $qaDetail->update($data);

        $this->activityLog->log('Transaction', "Updated QA detail: {$qaDetail->title}", $qaDetail->checklist->card_id);

        if ($qaDetail->assigned_to && $qaDetail->assigned_to != $oldAssigneeId) {
            $this->notifyAssignee($qaDetail);
        }

        return back();
    }

    protected function notifyAssignee(QaDetail $qaDetail)
    {
        $user = $qaDetail->assignee;
        if (!$user) return;

        $checklist = $qaDetail->checklist;
        $card = $checklist->card;
        
        // WA Notification
        if ($user->phone) {
            $msg = "📢 *QA Detail Assigned*\n\n"
                 . "Halo *{$user->username}*,\n"
                 . "Kamu telah ditugaskan pada detail QA baru:\n\n"
                 . "🔸 *Detail:* {$qaDetail->title}\n"
                 . "🔹 *Subtask:* {$checklist->content}\n"
                 . "📋 *Main Task:* {$card->title}\n\n"
                 . "Silakan cek dashboard untuk detailnya.";
            
            $this->whatsapp->sendMessage($user->phone, $msg, $user->id, 'qa_assignment', $card->id, 'detail', 'assignment');
        }

        // Email Notification
        if ($user->email) {
            $subject = "📢 Detail QA Baru: {$qaDetail->title}";
            $this->email->sendTemplateMail(
                $user->email, 
                $subject, 
                'emails.notification', 
                [
                    'username' => $user->username,
                    'title' => 'Detail QA Di-assign',
                    'message_body' => 'kamu telah ditugaskan pada detail QA baru.',
                    'target_type' => 'DETAIL',
                    'target_name' => $qaDetail->title,
                    'icon' => '📝',
                    'header_color' => '#d946ef',
                    'header_color_end' => '#a855f7',
                    'slot' => '<tr><td style="color:#64748b;font-size:12px;font-weight:600;width:90px;padding:4px 0;">🔹 Subtask</td><td style="color:#cbd5e1;font-size:13px;font-weight:600;padding:4px 0;">' . $checklist->content . '</td></tr>'
                ],
                $user->id, 'qa_assignment', $card->id, 'detail', 'assignment'
            );
        }
    }

    public function move(Request $request, QaDetail $qaDetail)
    {
        $this->authorizeProjectAction($request->user(), $qaDetail->checklist->card->cardList->board_id, 'qa_manage');

        $request->validate([
            'checklist_id' => 'required|exists:checklists,id',
            'assigned_to' => 'required|exists:users,id',
        ]);

        $qaDetail->update([
            'checklist_id' => $request->checklist_id,
            'assigned_to' => $request->assigned_to,
            'position' => \App\Models\Checklist::find($request->checklist_id)->qaDetails()->count(),
        ]);

        return redirect()->route('checklists.show', $request->checklist_id);
    }

    public function destroy(QaDetail $qaDetail)
    {
        $this->authorizeProjectAction(request()->user(), $qaDetail->checklist->card->cardList->board_id, 'qa_manage');

        $title = $qaDetail->title;
        $cardId = $qaDetail->checklist->card_id;
        $qaDetail->delete();

        $this->activityLog->log('Transaction', "Deleted QA detail: {$title}", $cardId);

        return back();
    }
}
