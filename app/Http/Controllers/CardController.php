<?php

namespace App\Http\Controllers;

use App\Models\Card;
use App\Models\CardList;
use Illuminate\Http\Request;
use App\Traits\ResolvesPermissions;

use App\Services\WhatsappService;
use App\Services\EmailService;

class CardController extends Controller
{
    use ResolvesPermissions;

    protected $whatsappService;
    protected $emailService;
    protected $activityLog;

    public function __construct(WhatsappService $whatsappService, EmailService $emailService, \App\Services\ActivityLogService $activityLog)
    {
        $this->whatsappService = $whatsappService;
        $this->emailService = $emailService;
        $this->activityLog = $activityLog;
    }
    public function store(Request $request, CardList $cardList)
    {
        $this->authorizeProjectAction($request->user(), $cardList->board_id, 'card_create');

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'assigned_to' => 'nullable|exists:users,id',
            'position' => 'nullable|integer',
            'priority' => 'nullable|string',
            'due_date' => 'nullable|date'
        ]);

        $card = $cardList->cards()->create([
            'title' => $request->title,
            'description' => $request->description,
            'assigned_to' => $request->assigned_to,
            'position' => $request->position ?? $cardList->cards()->count(),
            'priority' => $request->priority ?? 'medium',
            'due_date' => $request->due_date
        ]);

        $this->activityLog->log('Transaction', "Created card: {$card->title}", $card->id);

        if ($card->assigned_to) {
            $user = \App\Models\User::find($card->assigned_to);
            if ($user) {
                $boardName = $cardList->board->name ?? 'Project';
                $dueInfo = $card->due_date ? ' (Due: ' . \Carbon\Carbon::parse($card->due_date)->format('d M Y') . ')' : '';

                // WhatsApp
                if ($user->phone) {
                    $waMsg = "📋 *Task Baru Diterima*\n\nHalo *{$user->username}*, Anda telah di-assign task baru:\n\n"
                        . "*Task:* {$card->title}{$dueInfo}\n*Project:* {$boardName}\n\nSilakan cek aplikasi Tracker untuk detail selengkapnya.";
                    $this->whatsappService->sendMessage($user->phone, $waMsg, $user->id, 'assignment', $card->id, 'task', 'assignment');
                }

                // Email
                if ($user->email) {
                    $subject = "📋 Task Baru: {$card->title}";
                    $this->emailService->sendTemplateMail(
                        $user->email, 
                        $subject, 
                        'emails.notification', 
                        [
                            'username' => $user->username,
                            'title' => 'Task Baru Di-assign',
                            'message_body' => 'sebuah task baru telah di-assign kepadamu.',
                            'target_type' => 'TASK',
                            'target_name' => $card->title,
                            'icon' => '📋',
                            'slot' => '<tr><td style="color:#64748b;font-size:12px;font-weight:600;width:90px;padding:4px 0;">📁 Project</td><td style="color:#cbd5e1;font-size:13px;font-weight:600;padding:4px 0;">' . $boardName . '</td></tr>' . ($card->due_date ? '<tr><td style="color:#64748b;font-size:12px;font-weight:600;width:90px;padding:4px 0;">📅 Due Date</td><td style="color:#cbd5e1;font-size:13px;font-weight:600;padding:4px 0;">' . \Carbon\Carbon::parse($card->due_date)->format('d M Y') . '</td></tr>' : '')
                        ],
                        $user->id, 'assignment', $card->id, 'task', 'assignment'
                    );
                }
            }
        }

        return back();
    }

    public function update(Request $request, Card $card)
    {
        $this->authorizeProjectAction($request->user(), $card->cardList->board_id, 'card_edit');

        $request->validate([
            'card_list_id' => 'required|exists:card_lists,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'assigned_to' => 'nullable|exists:users,id',
            'position' => 'required|integer',
            'priority' => 'nullable|string',
            'due_date' => 'nullable|date'
        ]);

        $data = $request->all();

        if ($request->has('card_list_id') && $request->card_list_id != $card->card_list_id) {
            $newList = \App\Models\CardList::find($request->card_list_id);
            if ($newList && strtolower(trim($newList->name)) === 're open') {
                $data['reopen_count'] = $card->reopen_count + 1;
            }
        }

        $oldAssignedTo = $card->assigned_to;
        $card->update($data);

        $this->activityLog->log('Transaction', "Updated card: {$card->title}", $card->id);

        if ($card->assigned_to && $card->assigned_to != $oldAssignedTo) {
            $user = \App\Models\User::find($card->assigned_to);
            if ($user) {
                $boardName = $card->cardList->board->name ?? 'Project';

                // WhatsApp
                if ($user->phone) {
                    $waMsg = "📋 *Task Di-assign*\n\nHalo *{$user->username}*, Anda telah di-assign task:\n\n"
                        . "*Task:* {$card->title}" . ($card->due_date ? ' (Due: ' . \Carbon\Carbon::parse($card->due_date)->format('d M Y') . ')' : '') . "\n*Project:* {$boardName}\n\nSilakan cek aplikasi Tracker untuk detail selengkapnya.";
                    $this->whatsappService->sendMessage($user->phone, $waMsg, $user->id, 'reassignment', $card->id, 'task', 'assignment');
                }

                // Email
                if ($user->email) {
                    $subject = "📋 Task Di-assign: {$card->title}";
                    $this->emailService->sendTemplateMail(
                        $user->email, 
                        $subject, 
                        'emails.notification', 
                        [
                            'username' => $user->username,
                            'title' => 'Task Di-assign',
                            'message_body' => 'sebuah task baru telah di-assign kepadamu.',
                            'target_type' => 'TASK',
                            'target_name' => $card->title,
                            'icon' => '📋',
                            'slot' => '<tr><td style="color:#64748b;font-size:12px;font-weight:600;width:90px;padding:4px 0;">📁 Project</td><td style="color:#cbd5e1;font-size:13px;font-weight:600;padding:4px 0;">' . $boardName . '</td></tr>' . ($card->due_date ? '<tr><td style="color:#64748b;font-size:12px;font-weight:600;width:90px;padding:4px 0;">📅 Due Date</td><td style="color:#cbd5e1;font-size:13px;font-weight:600;padding:4px 0;">' . \Carbon\Carbon::parse($card->due_date)->format('d M Y') . '</td></tr>' : '')
                        ],
                        $user->id, 'reassignment', $card->id, 'task', 'assignment'
                    );
                }
            }
        }

        return back();
    }

    public function destroy(Card $card)
    {
        $this->authorizeProjectAction(request()->user(), $card->cardList->board_id, 'card_delete');

        $title = $card->title;
        $card->delete();

        $this->activityLog->log('Transaction', "Deleted card: {$title}");

        return back();
    }

    public function reorder(Request $request, CardList $cardList)
    {
        $this->authorizeProjectAction($request->user(), $cardList->board_id, 'card_move');

        $request->validate([
            'cards' => 'required|array',
            'cards.*.id' => 'required|exists:cards,id',
            'cards.*.position' => 'required|integer',
        ]);

        $isReopen = strtolower(trim($cardList->name)) === 're open';

        foreach ($request->cards as $item) {
            $card = Card::find($item['id']);
            if (!$card) continue;

            $updateData = [
                'card_list_id' => $cardList->id,
                'position' => $item['position']
            ];

            // Specific reassignment if provided in the item
            if (isset($item['assigned_to'])) {
                $updateData['assigned_to'] = $item['assigned_to'];
            }

            // If moved to "re open" from a different list, increment reopen_count
            if ($isReopen && $card->card_list_id != $cardList->id) {
                $updateData['reopen_count'] = $card->reopen_count + 1;
            }

            $card->update($updateData);
        }

        return back();
    }
}
