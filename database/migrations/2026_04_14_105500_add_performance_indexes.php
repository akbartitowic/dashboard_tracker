<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('card_lists', function (Blueprint $table) {
            $table->index(['board_id', 'position']);
        });

        Schema::table('cards', function (Blueprint $table) {
            $table->index(['card_list_id', 'assigned_to']);
            $table->index('reopen_count');
        });

        Schema::table('checklists', function (Blueprint $table) {
            $table->index(['card_id', 'status']);
        });

        Schema::table('qa_details', function (Blueprint $table) {
            $table->index(['checklist_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('card_lists', function (Blueprint $table) {
            $table->dropIndex(['board_id', 'position']);
        });

        Schema::table('cards', function (Blueprint $table) {
            $table->dropIndex(['card_list_id', 'assigned_to']);
            $table->dropIndex(['reopen_count']);
        });

        Schema::table('checklists', function (Blueprint $table) {
            $table->dropIndex(['card_id', 'status']);
        });

        Schema::table('qa_details', function (Blueprint $table) {
            $table->dropIndex(['checklist_id', 'status']);
        });
    }
};
