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

        // Analysis Level 1: Tasks (Cards)
        $taskStats = DB::table('card_lists')
            ->join('boards', 'card_lists.board_id', '=', 'boards.id')
            ->select('card_lists.name as status', DB::raw('COUNT(cards.id) as count'), 'card_lists.id as list_id')
            ->leftJoin('cards', 'card_lists.id', '=', 'cards.card_list_id')
            ->whereIn('boards.id', $accessibleBoardIds)
            ->groupBy('card_lists.name', 'card_lists.id')
            ->get()
            ->map(function($stat) use ($accessibleBoardIds) {
                $stat->tasks = DB::table('cards')
                    ->join('card_lists', 'cards.card_list_id', '=', 'card_lists.id')
                    ->join('boards', 'card_lists.board_id', '=', 'boards.id')
                    ->where('cards.card_list_id', $stat->list_id)
                    ->whereIn('boards.id', $accessibleBoardIds)
                    ->select('cards.id', 'cards.title', 'boards.name as board_name', 'card_lists.board_id')
                    ->limit(50)
                    ->get();
                return $stat;
            });

        // Analysis Level 2: Subtasks (Checklists)
        $subTaskStats = DB::table('checklists')
            ->join('cards', 'checklists.card_id', '=', 'cards.id')
            ->join('card_lists', 'cards.card_list_id', '=', 'card_lists.id')
            ->join('boards', 'card_lists.board_id', '=', 'boards.id')
            ->whereIn('boards.id', $accessibleBoardIds)
            ->select('checklists.status', DB::raw('COUNT(*) as count'))
            ->groupBy('checklists.status')
            ->get()
            ->map(function($stat) use ($accessibleBoardIds) {
                $stat->tasks = DB::table('checklists')
                    ->join('cards', 'checklists.card_id', '=', 'cards.id')
                    ->join('card_lists', 'cards.card_list_id', '=', 'card_lists.id')
                    ->join('boards', 'card_lists.board_id', '=', 'boards.id')
                    ->where('checklists.status', $stat->status)
                    ->whereIn('boards.id', $accessibleBoardIds)
                    ->select('checklists.id', 'checklists.content as title', 'boards.name as board_name', 'card_lists.board_id')
                    ->limit(50)
                    ->get();
                return $stat;
            });

        // Analysis Level 3: Detail Subtasks (QaDetails)
        $detailStats = DB::table('qa_details')
            ->join('checklists', 'qa_details.checklist_id', '=', 'checklists.id')
            ->join('cards', 'checklists.card_id', '=', 'cards.id')
            ->join('card_lists', 'cards.card_list_id', '=', 'card_lists.id')
            ->join('boards', 'card_lists.board_id', '=', 'boards.id')
            ->whereIn('boards.id', $accessibleBoardIds)
            ->select('qa_details.status', DB::raw('COUNT(*) as count'))
            ->groupBy('qa_details.status')
            ->get()
            ->map(function($stat) use ($accessibleBoardIds) {
                $stat->tasks = DB::table('qa_details')
                    ->join('checklists', 'qa_details.checklist_id', '=', 'checklists.id')
                    ->join('cards', 'checklists.card_id', '=', 'cards.id')
                    ->join('card_lists', 'cards.card_list_id', '=', 'card_lists.id')
                    ->join('boards', 'card_lists.board_id', '=', 'boards.id')
                    ->where('qa_details.status', $stat->status)
                    ->whereIn('boards.id', $accessibleBoardIds)
                    ->select('qa_details.id', 'qa_details.title', 'boards.name as board_name', 'card_lists.board_id')
                    ->limit(50)
                    ->get();
                return $stat;
            });

        $userStats = DB::table('users')
            ->select('users.username', DB::raw('COUNT(cards.id) as count'))
            ->leftJoin('cards', function($join) use ($accessibleBoardIds) {
                $join->on('users.id', '=', 'cards.assigned_to')
                     ->whereIn('cards.card_list_id', function($query) use ($accessibleBoardIds) {
                         $query->select('id')->from('card_lists')->whereIn('board_id', $accessibleBoardIds);
                     });
            })
            ->groupBy('users.username')
            ->get();

        $completionStats = DB::table('card_lists')
            ->join('cards', 'card_lists.id', '=', 'cards.card_list_id')
            ->join('boards', 'card_lists.board_id', '=', 'boards.id')
            ->whereIn('boards.id', $accessibleBoardIds)
            ->select(
                DB::raw("COUNT(*) FILTER (WHERE card_lists.name = 'done') as done"),
                DB::raw("COUNT(*) FILTER (WHERE card_lists.name != 'done') as not_done")
            )
            ->first();

        // Per-project aggregated stats with deep relationships for accurate progress
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
                'tasks'   => DB::table('cards')->join('card_lists', 'cards.card_list_id', '=', 'card_lists.id')->whereIn('card_lists.board_id', $accessibleBoardIds)->count(),
                'subtasks' => DB::table('checklists')->join('cards', 'checklists.card_id', '=', 'cards.id')->join('card_lists', 'cards.card_list_id', '=', 'card_lists.id')->whereIn('card_lists.board_id', $accessibleBoardIds)->count(),
                'details'  => DB::table('qa_details')->join('checklists', 'qa_details.checklist_id', '=', 'checklists.id')->join('cards', 'checklists.card_id', '=', 'cards.id')->join('card_lists', 'cards.card_list_id', '=', 'card_lists.id')->whereIn('card_lists.board_id', $accessibleBoardIds)->count(),
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

        // Deep load for accurate progress
        $board->load(['cardLists.cards.checklists.qaDetails']);

        $totalTasks = $board->cardLists->flatMap->cards->count();
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

        // Subtask stats for this board
        $subTaskStats = DB::table('checklists')
            ->join('cards', 'checklists.card_id', '=', 'cards.id')
            ->join('card_lists', 'cards.card_list_id', '=', 'card_lists.id')
            ->where('card_lists.board_id', $board->id)
            ->select('checklists.status', DB::raw('COUNT(*) as count'))
            ->groupBy('checklists.status')
            ->get()
            ->map(function($stat) use ($board) {
                $stat->tasks = DB::table('checklists')
                    ->join('cards', 'checklists.card_id', '=', 'cards.id')
                    ->join('card_lists', 'cards.card_list_id', '=', 'card_lists.id')
                    ->where('card_lists.board_id', $board->id)
                    ->where('checklists.status', $stat->status)
                    ->select('checklists.id', 'checklists.content as title', DB::raw("'{$board->name}' as board_name"), DB::raw("{$board->id} as board_id"))
                    ->limit(50)
                    ->get();
                return $stat;
            });

        // Detail Subtask stats for this board
        $detailStats = DB::table('qa_details')
            ->join('checklists', 'qa_details.checklist_id', '=', 'checklists.id')
            ->join('cards', 'checklists.card_id', '=', 'cards.id')
            ->join('card_lists', 'cards.card_list_id', '=', 'card_lists.id')
            ->where('card_lists.board_id', $board->id)
            ->select('qa_details.status', DB::raw('COUNT(*) as count'))
            ->groupBy('qa_details.status')
            ->get()
            ->map(function($stat) use ($board) {
                $stat->tasks = DB::table('qa_details')
                    ->join('checklists', 'qa_details.checklist_id', '=', 'checklists.id')
                    ->join('cards', 'checklists.card_id', '=', 'cards.id')
                    ->join('card_lists', 'cards.card_list_id', '=', 'card_lists.id')
                    ->where('card_lists.board_id', $board->id)
                    ->where('qa_details.status', $stat->status)
                    ->select('qa_details.id', 'qa_details.title', DB::raw("'{$board->name}' as board_name"), DB::raw("{$board->id} as board_id"))
                    ->limit(50)
                    ->get();
                return $stat;
            });

        $reopenedTasks = DB::table('cards')
            ->join('users', 'cards.assigned_to', '=', 'users.id')
            ->join('card_lists', 'cards.card_list_id', '=', 'card_lists.id')
            ->where('card_lists.board_id', $board->id)
            ->where('cards.reopen_count', '>', 0)
            ->select('cards.*', 'users.username as assignee', 'card_lists.name as status')
            ->orderByDesc('reopen_count')
            ->get();

        $totalReopens = $reopenedTasks->sum('reopen_count');

        // High Accuracy Progress Calculation
        $overallProgress = $this->calculateBoardProgress($board);

        // Total board-specific ecosystem metrics
        $totalSubtasks = DB::table('checklists')
            ->join('cards', 'checklists.card_id', '=', 'cards.id')
            ->join('card_lists', 'cards.card_list_id', '=', 'card_lists.id')
            ->where('card_lists.board_id', $board->id)
            ->count();

        $totalDetails = DB::table('qa_details')
            ->join('checklists', 'qa_details.checklist_id', '=', 'checklists.id')
            ->join('cards', 'checklists.card_id', '=', 'cards.id')
            ->join('card_lists', 'cards.card_list_id', '=', 'card_lists.id')
            ->where('card_lists.board_id', $board->id)
            ->count();

        return Inertia::render('Dashboard/Project', [
            'board' => [
                'id' => $board->id,
                'name' => $board->name,
                'description' => $board->description
            ],
            'totalTasks' => $totalTasks,
            'totalSubtasks' => $totalSubtasks,
            'totalDetails' => $totalDetails,
            'doneTasks' => $doneTasks,
            'overallProgress' => $overallProgress,
            'statusBreakdown' => $statusBreakdown,
            'subTaskStats' => $subTaskStats,
            'detailStats' => $detailStats,
            'reopenedTasks' => $reopenedTasks,
            'totalReopens' => $totalReopens
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
            'ready to test' => 50,
            're open'       => 10,
            'done'          => 100,
        ];
        return $weights[$status] ?? 0;
    }
}
