<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DataImportController;
use App\Http\Controllers\TrelloImportController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/', fn() => redirect()->route('dashboard'))->name('home');
    Route::get('/boards', [\App\Http\Controllers\BoardController::class, 'index'])->name('boards.index');
    Route::post('/boards', [\App\Http\Controllers\BoardController::class, 'store'])->name('boards.store');
    Route::get('/boards/{board}', [\App\Http\Controllers\BoardController::class, 'show'])->name('boards.show');
    Route::put('/boards/{board}', [\App\Http\Controllers\BoardController::class, 'update'])->name('boards.update');
    Route::delete('/boards/{board}', [\App\Http\Controllers\BoardController::class, 'destroy'])->name('boards.destroy');
    
    // CardLists
    Route::post('/boards/{board}/lists', [\App\Http\Controllers\CardListController::class, 'store'])->name('card-lists.store');
    Route::delete('/lists/{cardList}', [\App\Http\Controllers\CardListController::class, 'destroy'])->name('card-lists.destroy');
    Route::post('/boards/{board}/lists/reorder', [\App\Http\Controllers\CardListController::class, 'reorder'])->name('card-lists.reorder');
    
    // Cards
    Route::post('/lists/{cardList}/cards', [\App\Http\Controllers\CardController::class, 'store'])->name('cards.store');
    Route::put('/cards/{card}', [\App\Http\Controllers\CardController::class, 'update'])->name('cards.update');
    Route::post('/lists/{cardList}/cards/reorder', [\App\Http\Controllers\CardController::class, 'reorder'])->name('cards.reorder');
    Route::delete('/cards/{card}', [\App\Http\Controllers\CardController::class, 'destroy'])->name('cards.destroy');

    // Checklists (Subtasks)
    Route::get('/checklists/{checklist}', [\App\Http\Controllers\ChecklistController::class, 'show'])->name('checklists.show');
    Route::post('/cards/{card}/checklists', [\App\Http\Controllers\ChecklistController::class, 'store'])->name('checklists.store');
    Route::put('/checklists/{checklist}', [\App\Http\Controllers\ChecklistController::class, 'update'])->name('checklists.update');
    Route::put('/checklists/{checklist}/move', [\App\Http\Controllers\ChecklistController::class, 'move'])->name('checklists.move');
    Route::delete('/checklists/{checklist}', [\App\Http\Controllers\ChecklistController::class, 'destroy'])->name('checklists.destroy');

    // QA Details
    Route::post('/checklists/{checklist}/qa-details', [\App\Http\Controllers\QaDetailController::class, 'store'])->name('qa-details.store');
    Route::get('/qa-details/{qaDetail}', [\App\Http\Controllers\QaDetailController::class, 'show'])->name('qa-details.show');
    Route::put('/qa-details/{qaDetail}', [\App\Http\Controllers\QaDetailController::class, 'update'])->name('qa-details.update');
    Route::put('/qa-details/{qaDetail}/move', [\App\Http\Controllers\QaDetailController::class, 'move'])->name('qa-details.move');
    Route::delete('/qa-details/{qaDetail}', [\App\Http\Controllers\QaDetailController::class, 'destroy'])->name('qa-details.destroy');

    // Dashboard
    Route::get('/dashboard', [\App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');
    Route::get('/dashboard/projects/{board}', [\App\Http\Controllers\DashboardController::class, 'projectDetail'])->name('dashboard.project');
    Route::get('/dashboard/projects/{board}/items', [\App\Http\Controllers\DashboardController::class, 'projectItems'])->name('dashboard.project.items');

    // Users
    Route::get('/users', [\App\Http\Controllers\UserController::class, 'index'])->name('users.index');
    Route::post('/users', [\App\Http\Controllers\UserController::class, 'store'])->name('users.store');
    Route::put('/users/{user}', [\App\Http\Controllers\UserController::class, 'update'])->name('users.update');
    Route::delete('/users/{user}', [\App\Http\Controllers\UserController::class, 'destroy'])->name('users.destroy');

    // Permissions & Access Groups
    Route::get('/access-groups', [\App\Http\Controllers\AccessGroupController::class, 'index'])->name('access-groups.index');
    Route::post('/access-groups', [\App\Http\Controllers\AccessGroupController::class, 'store'])->name('access-groups.store');
    Route::put('/access-groups/{accessGroup}', [\App\Http\Controllers\AccessGroupController::class, 'update'])->name('access-groups.update');
    Route::delete('/access-groups/{accessGroup}', [\App\Http\Controllers\AccessGroupController::class, 'destroy'])->name('access-groups.destroy');

    Route::put('/permissions', [\App\Http\Controllers\UserController::class, 'updatePermission'])->name('permissions.update');
    Route::put('/permissions/project', [\App\Http\Controllers\UserController::class, 'updateProjectPermission'])->name('permissions.project.update');

    // SMTP Settings
    Route::get('/smtp-settings', [\App\Http\Controllers\SmtpSettingController::class, 'index'])->name('smtp-settings.index');
    Route::put('/smtp-settings', [\App\Http\Controllers\SmtpSettingController::class, 'update'])->name('smtp-settings.update');

    // WhatsApp Settings
    Route::get('/whatsapp-settings', fn() => redirect('/users?tab=whatsapp'))->name('whatsapp-settings.index');
    Route::put('/whatsapp-settings', [\App\Http\Controllers\WhatsappSettingController::class, 'update'])->name('whatsapp-settings.update');
    Route::post('/whatsapp-settings/send-reminders', [\App\Http\Controllers\WhatsappSettingController::class, 'sendReminders'])->name('whatsapp-settings.send-reminders');

    // Telegram Settings
    Route::get('/telegram-settings', [\App\Http\Controllers\TelegramSettingController::class, 'index'])->name('telegram-settings.index');
    Route::put('/telegram-settings', [\App\Http\Controllers\TelegramSettingController::class, 'update'])->name('telegram-settings.update');

    // Audit Logs (Unified)
    Route::get('/logs', [\App\Http\Controllers\AuditLogController::class, 'index'])->name('logs.index');
    Route::delete('/activities/{activity}', [\App\Http\Controllers\AuditLogController::class, 'destroyActivity'])->name('activities.destroy');

    // Notification Logs (Legacy/API compat)
    Route::get('/notification-logs', [\App\Http\Controllers\AuditLogController::class, 'index'])->name('notification-logs.index');
    Route::post('/notification-logs/{log}/resend', [\App\Http\Controllers\NotificationLogController::class, 'resend'])->name('notification-logs.resend');

    // Trello/Excel Import
    Route::post('/import/trello', [TrelloImportController::class, 'import'])->name('import.trello');
    // Improved Import Flow
    Route::get('/import/tasks/template', [DataImportController::class, 'downloadTaskTemplate'])->name('import.task.template');
    Route::get('/import/subtasks/template', [DataImportController::class, 'downloadSubTaskTemplate'])->name('import.subtask.template');
    Route::get('/import/details/template', [DataImportController::class, 'downloadDetailTemplate'])->name('import.detail.template');
    
    Route::post('/import/tasks/{board}', [DataImportController::class, 'importTasks'])->name('import.tasks');
    Route::post('/import/subtasks/{card}', [DataImportController::class, 'importSubTasks'])->name('import.subtasks');
    Route::post('/import/details/{checklist}', [DataImportController::class, 'importDetails'])->name('import.details');
    Route::post('/admin/reset', [TrelloImportController::class, 'resetData'])->name('admin.reset');

    // Selection Helpers for Move Feature
    Route::get('/api/boards-list', [DataImportController::class, 'getBoardsList'])->name('api.boards');
    Route::get('/api/boards/{board}/cards', [DataImportController::class, 'getBoardCards'])->name('api.board-cards');
    Route::get('/api/cards/{card}/checklists', [DataImportController::class, 'getCardChecklists'])->name('api.card-checklists');

    // Custom Profile was removed, Breeze generates Profile folder but we will rely on Auth only for this demo.
});

require __DIR__.'/auth.php';
