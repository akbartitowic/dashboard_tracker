<?php

namespace App\Http\Controllers;

use App\Models\Board;
use App\Models\Card;
use App\Models\CardList;
use App\Models\Checklist;
use App\Models\QaDetail;
use App\Exports\TemplateExport;
use App\Imports\ProjectDataImport;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use App\Traits\ResolvesPermissions;

class DataImportController extends Controller
{
    use ResolvesPermissions;
    public function downloadTaskTemplate()
    {
        return Excel::download(new \App\Exports\TaskTemplateExport, 'task_import_template.xlsx');
    }

    public function downloadSubTaskTemplate()
    {
        return Excel::download(new \App\Exports\SubTaskTemplateExport, 'subtask_import_template.xlsx');
    }

    public function downloadDetailTemplate()
    {
        return Excel::download(new \App\Exports\DetailTemplateExport, 'detail_import_template.xlsx');
    }

    public function importTasks(Request $request, Board $board)
    {
        $this->authorizeProjectAction($request->user(), $board->id, 'data_import');
        $request->validate(['file' => 'required|mimes:xlsx,xls,csv|max:10240']);

        try {
            Excel::import(new \App\Imports\TaskImport($board), $request->file('file'));
            return back()->with('success', 'Tasks imported successfully!');
        } catch (\Exception $e) {
            return back()->withErrors(['file' => 'Import failed: ' . $e->getMessage()]);
        }
    }

    public function importSubTasks(Request $request, Card $card)
    {
        $this->authorizeProjectAction($request->user(), $card->cardList->board_id, 'data_import');
        $request->validate(['file' => 'required|mimes:xlsx,xls,csv|max:10240']);

        try {
            Excel::import(new \App\Imports\SubTaskImport($card), $request->file('file'));
            return back()->with('success', 'Subtasks imported successfully!');
        } catch (\Exception $e) {
            return back()->withErrors(['file' => 'Import failed: ' . $e->getMessage()]);
        }
    }

    public function importDetails(Request $request, Checklist $checklist)
    {
        $this->authorizeProjectAction($request->user(), $checklist->card->cardList->board_id, 'data_import');
        $request->validate(['file' => 'required|mimes:xlsx,xls,csv|max:10240']);

        try {
            Excel::import(new \App\Imports\DetailImport($checklist), $request->file('file'));
            return back()->with('success', 'Details imported successfully!');
        } catch (\Exception $e) {
            return back()->withErrors(['file' => 'Import failed: ' . $e->getMessage()]);
        }
    }

    public function getBoardsList(Request $request)
    {
        $user = $request->user();
        
        $boards = $user->role === 'admin' 
            ? Board::select('id', 'name')->orderBy('name')->get()
            : $user->assignedBoards()
                ->wherePivot('can_view', true)
                ->select('boards.id', 'boards.name')
                ->orderBy('name')
                ->get();

        return response()->json($boards);
    }

    public function getBoardCards(Request $request, Board $board)
    {
        $this->authorizeProjectAction($request->user(), $board->id, 'project_view');

        $cards = Card::whereIn('card_list_id', $board->cardLists()->pluck('id'))
            ->select('id', 'title')
            ->orderBy('title')
            ->get();
        return response()->json($cards);
    }

    public function getCardChecklists(Request $request, Card $card)
    {
        $this->authorizeProjectAction($request->user(), $card->cardList->board_id, 'project_view');

        return response()->json($card->checklists()->select('id', 'content')->orderBy('position')->get());
    }
}
