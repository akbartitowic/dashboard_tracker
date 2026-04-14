<?php

namespace App\Http\Controllers;

use App\Models\Board;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Traits\ResolvesPermissions;

class DashboardController extends Controller
{
    use ResolvesPermissions;
    public function index(Request $request)
    {
        $user = $request->user();
        $isAdmin = $user->role === 'admin';
        
        $accessibleBoardIds = $isAdmin 
            ? Board::pluck('id')->toArray() 
            : $user->assignedBoards()
                ->where(function($q) {
                    $q->wherePivot('can_view', true)
                      ->orWherePivot('access_group_id', '!=', null);
                })
                ->get()
                ->filter(fn($b) => ($this->getPermissions($user, $b->id)['project_view'] ?? false))
                ->pluck('id')
                ->toArray();

        // 1. Optimized Data Fetching (Fetch everything needed once)
        $allCards = DB::table('cards')
            ->join('card_lists', 'cards.card_list_id', '=', 'card_lists.id')
            ->join('boards', 'card_lists.board_id', '=', 'boards.id')
            ->whereIn('boards.id', $accessibleBoardIds)
            ->select('cards.*', 'boards.name as board_name', 'card_lists.name as list_name', 'card_lists.board_id')
            ->get();

        $allSubtasks = DB::table('checklists')
            ->join('cards', 'checklists.card_id', '=', 'cards.id')
            ->join('card_lists', 'cards.card_list_id', '=', 'card_lists.id')
            ->join('boards', 'card_lists.board_id', '=', 'boards.id')
            ->whereIn('boards.id', $accessibleBoardIds)
            ->select('checklists.*', 'boards.name as board_name', 'card_lists.board_id')
            ->get();

        $allDetails = DB::table('qa_details')
            ->join('checklists', 'qa_details.checklist_id', '=', 'checklists.id')
            ->join('cards', 'checklists.card_id', '=', 'cards.id')
            ->join('card_lists', 'cards.card_list_id', '=', 'card_lists.id')
            ->join('boards', 'card_lists.board_id', '=', 'boards.id')
            ->whereIn('boards.id', $accessibleBoardIds)
            ->select('qa_details.*', 'boards.name as board_name', 'card_lists.board_id')
            ->get();

        // 2. Grouping in PHP (Analysis Levels)
        $taskStats = $allCards->groupBy('list_name')->map(function($items, $name) {
            return (object)[
                'status' => $name,
                'count' => $items->count(),
                'tasks' => $items->take(50)->map(fn($item) => (object)[
                    'id' => $item->id,
                    'title' => $item->title,
                    'board_name' => $item->board_name,
                    'board_id' => $item->board_id
                ])
            ];
        })->values();

        $subTaskStats = $allSubtasks->groupBy('status')->map(function($items, $status) {
            return (object)[
                'status' => $status,
                'count' => $items->count(),
                'tasks' => $items->take(50)->map(fn($item) => (object)[
                    'id' => $item->id,
                    'title' => $item->content,
                    'board_name' => $item->board_name,
                    'board_id' => $item->board_id
                ])
            ];
        })->values();

        $detailStats = $allDetails->groupBy('status')->map(function($items, $status) {
            return (object)[
                'status' => $status,
                'count' => $items->count(),
                'tasks' => $items->take(50)->map(fn($item) => (object)[
                    'id' => $item->id,
                    'title' => $item->title,
                    'board_name' => $item->board_name,
                    'board_id' => $item->board_id
                ])
            ];
        })->values();

        // 3. Optimized User Stats
        $userStats = DB::table('users')
            ->select('users.username', DB::raw('COUNT(cards.id) as count'))
            ->leftJoin('cards', function($join) use ($accessibleBoardIds) {
                $join->on('users.id', '=', 'cards.assigned_to')
                     ->whereIn('cards.card_list_id', function($query) use ($accessibleBoardIds) {
                         $query->select('id')->from('card_lists')->whereIn('board_id', $accessibleBoardIds);
                     });
            })
            ->groupBy('users.username', 'users.id') // Added users.id for robust grouping
            ->get();

        // 4. Completion Stats (Using already fetched cards)
        $doneCount = $allCards->filter(fn($c) => strtolower(trim($c->list_name)) === 'done')->count();
        $completionStats = (object)[
            'done' => $doneCount,
            'not_done' => $allCards->count() - $doneCount
        ];

        // 5. Per-project aggregated stats
        $boards = Board::with(['cardLists.cards.checklists.qaDetails'])
            ->whereIn('id', $accessibleBoardIds)
            ->orderBy('created_at', 'desc')
            ->get();

        $projects = $boards->map(function ($board) {
            $statusBreakdown = [];
            $totalTasks = 0;
            $totalReopens = 0;

            foreach ($board->cardLists as $list) {
                $count = $list->cards->count();
                $statusBreakdown[$list->name] = $count;
                $totalTasks += $count;
                $totalReopens += $list->cards->sum('reopen_count');
            }

            // High Accuracy Progress Calculation
            $overallProgress = $this->calculateBoardProgress($board);

            // Dominant status
            arsort($statusBreakdown);
            $dominantStatus = $totalTasks > 0 ? array_key_first($statusBreakdown) : 'todo';

            return [
                'id'              => $board->id,
                'name'            => $board->name,
                'description'     => $board->description,
                'total_tasks'     => $totalTasks,
                'progress'        => $overallProgress,
                'status_breakdown'=> $statusBreakdown,
                'dominant_status' => $dominantStatus,
                'total_reopens'   => $totalReopens,
                'created_at'      => $board->created_at->format('d M Y'),
            ];
        });

        return Inertia::render('Dashboard', [
            'totalExcellence' => [
                'tasks'   => $allCards->count(),
                'subtasks' => $allSubtasks->count(),
                'details'  => $allDetails->count(),
            ],
            'taskStats'       => $taskStats,
            'subTaskStats'    => $subTaskStats,
            'detailStats'     => $detailStats,
            'userStats'       => $userStats,
            'completion'      => $completionStats,
            'projects'        => $projects,
        ]);
    }

    public function projectDetail(Request $request, Board $board)
    {
        $this->authorizeProjectAction($request->user(), $board->id, 'analytics_view');

        // 1. Deep load for accurate progress and stats
        $board->load(['cardLists.cards.checklists.qaDetails']);

        $allCards = $board->cardLists->flatMap->cards;
        $allSubtasks = $allCards->flatMap->checklists;
        $allDetails = $allSubtasks->flatMap->qaDetails;

        $totalTasks = $allCards->count();
        $doneTasks = 0;
        foreach($board->cardLists as $list) {
            if (strtolower(trim($list->name)) === 'done') {
                $doneTasks += $list->cards->count();
            }
        }

        $statusBreakdown = $board->cardLists->map(function($list) use ($totalTasks) {
            $count = $list->cards->count();
            return [
                'name' => $list->name,
                'count' => $count,
                'percent' => $totalTasks > 0 ? round(($count / $totalTasks) * 100) : 0,
                'tasks' => $list->cards->map(fn($c) => ['id' => $c->id, 'title' => $c->title])
            ];
        });

        // 2. Optimized Subtask stats (Derived from memory)
        $subTaskStats = $allSubtasks->groupBy('status')->map(function($items, $status) use ($board) {
            return (object)[
                'status' => $status,
                'count' => $items->count(),
                'tasks' => $items->take(50)->map(fn($item) => (object)[
                    'id' => $item->id,
                    'title' => $item->content,
                    'board_name' => $board->name,
                    'board_id' => $board->id
                ])
            ];
        })->values();

        // 3. Optimized Detail stats (Derived from memory)
        $detailStats = $allDetails->groupBy('status')->map(function($items, $status) use ($board) {
            return (object)[
                'status' => $status,
                'count' => $items->count(),
                'tasks' => $items->take(50)->map(fn($item) => (object)[
                    'id' => $item->id,
                    'title' => $item->title,
                    'board_name' => $board->name,
                    'board_id' => $board->id
                ])
            ];
        })->values();

        $reopenedTasks = DB::table('cards')
            ->join('users', 'cards.assigned_to', '=', 'users.id')
            ->join('card_lists', 'cards.card_list_id', '=', 'card_lists.id')
            ->where('card_lists.board_id', $board->id)
            ->where('cards.reopen_count', '>', 0)
            ->select('cards.*', 'users.username as assignee', 'card_lists.name as status')
            ->orderByDesc('reopen_count')
            ->get();

        $totalReopens = $reopenedTasks->sum('reopen_count');

        // 4. High Accuracy Progress Calculation
        $overallProgress = $this->calculateBoardProgress($board);

        return Inertia::render('Dashboard/Project', [
            'board' => [
                'id' => $board->id,
                'name' => $board->name,
                'description' => $board->description
            ],
            'totalTasks' => $totalTasks,
            'totalSubtasks' => $allSubtasks->count(),
            'totalDetails' => $allDetails->count(),
            'doneTasks' => $doneTasks,
            'overallProgress' => $overallProgress,
            'statusBreakdown' => $statusBreakdown,
            'subTaskStats' => $subTaskStats,
            'detailStats' => $detailStats,
            'reopenedTasks' => $reopenedTasks,
            'totalReopens' => $totalReopens
        ]);
    }


    public function projectItems(Request $request, Board $board)
    {
        $this->authorizeProjectAction($request->user(), $board->id, 'analytics_view');

        $type = $request->query('type', 'tasks');

        $items = [];

        if ($type === 'tasks') {
            $items = DB::table('cards')
                ->join('card_lists', 'cards.card_list_id', '=', 'card_lists.id')
                ->leftJoin('users as assignees', 'cards.assigned_to', '=', 'assignees.id')
                ->where('card_lists.board_id', $board->id)
                ->select('cards.*', 'card_lists.name as status', 'assignees.username as assignee_name')
                ->orderBy('cards.created_at', 'desc')
                ->get();
        } elseif ($type === 'subtasks') {
            $items = DB::table('checklists')
                ->join('cards', 'checklists.card_id', '=', 'cards.id')
                ->join('card_lists', 'cards.card_list_id', '=', 'card_lists.id')
                ->leftJoin('users as assignees', 'cards.assigned_to', '=', 'assignees.id')
                ->where('card_lists.board_id', $board->id)
                ->select('checklists.*', 'cards.title as card_title', 'card_lists.name as root_status', 'assignees.username as pic_name')
                ->orderBy('checklists.created_at', 'desc')
                ->get();
        } elseif ($type === 'details') {
            $items = DB::table('qa_details')
                ->join('checklists', 'qa_details.checklist_id', '=', 'checklists.id')
                ->join('cards', 'checklists.card_id', '=', 'cards.id')
                ->join('card_lists', 'cards.card_list_id', '=', 'card_lists.id')
                ->where('card_lists.board_id', $board->id)
                ->select('qa_details.*', 'checklists.content as checklist_title', 'cards.title as card_title')
                ->orderBy('qa_details.created_at', 'desc')
                ->get();
        } elseif ($type === 'resolved') {
            $items = DB::table('cards')
                ->join('card_lists', 'cards.card_list_id', '=', 'card_lists.id')
                ->leftJoin('users as assignees', 'cards.assigned_to', '=', 'assignees.id')
                ->where('card_lists.board_id', $board->id)
                ->whereRaw("LOWER(TRIM(card_lists.name)) = 'done'")
                ->select('cards.*', 'card_lists.name as status', 'assignees.username as assignee_name')
                ->orderBy('cards.created_at', 'desc')
                ->get();
        } elseif ($type === 'instability') {
            $items = DB::table('cards')
                ->join('card_lists', 'cards.card_list_id', '=', 'card_lists.id')
                ->leftJoin('users as assignees', 'cards.assigned_to', '=', 'assignees.id')
                ->where('card_lists.board_id', $board->id)
                ->where('cards.reopen_count', '>', 0)
                ->select('cards.*', 'card_lists.name as status', 'assignees.username as assignee_name')
                ->orderByDesc('cards.reopen_count')
                ->get();
        }

        // Optimize: Fetch only necessary user fields
        $users = \App\Models\User::select('id', 'username', 'email')->get();
        
        // Optimize: Load only what is needed for the item creation forms
        if (in_array($type, ['tasks', 'subtasks', 'details'])) {
            $board->load(['cardLists.cards.checklists']);
        }

        return Inertia::render('Dashboard/ProjectItems', [
            'board' => $board,
            'type' => $type,
            'items' => $items,
            'users' => $users,
        ]);
    }


    private function calculateBoardProgress($board)
    {
        $cards = $board->cardLists->flatMap->cards;
        if ($cards->isEmpty()) return 0;

        $totalCardProgress = 0;
        foreach ($cards as $card) {
            $totalCardProgress += $this->calculateCardProgress($card);
        }

        return round($totalCardProgress / $cards->count());
    }

    private function calculateCardProgress($card)
    {
        if ($card->checklists->isEmpty()) {
            return $this->getStatusWeight($card->cardList->name);
        }

        $totalChecklistProgress = 0;
        foreach ($card->checklists as $checklist) {
            $totalChecklistProgress += $this->calculateChecklistProgress($checklist);
        }

        return $totalChecklistProgress / $card->checklists->count();
    }

    private function calculateChecklistProgress($checklist)
    {
        if ($checklist->qaDetails->isEmpty()) {
            return $this->getStatusWeight($checklist->status);
        }

        $totalDetailProgress = 0;
        foreach ($checklist->qaDetails as $detail) {
            $totalDetailProgress += $this->getStatusWeight($detail->status);
        }

        return $totalDetailProgress / $checklist->qaDetails->count();
    }

    private function getStatusWeight($status)
    {
        $status = strtolower(trim($status));
        $weights = [
            'to do'         => 0,
            'todo'          => 0,
            'in progress'   => 25,
            'inprogress'    => 25,
            'done dev'      => 50,
            'ready to test' => 75,
            're open'       => 10,
            'done'          => 100,
        ];
        return $weights[$status] ?? 0;
    }
}
