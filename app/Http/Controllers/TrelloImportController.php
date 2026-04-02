<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class TrelloImportController extends Controller
{
    public function import(Request $request)
    {
        // TODO: Implement complex JSON parsing logic to create Boards, Lists, Cards from Trello Export
        return redirect()->route('dashboard')->with('success', 'Trello Import Triggered.');
    }

    /**
     * Nuclear database wipe with password verification.
     */
    public function resetData(Request $request)
    {
        $request->validate([
            'password' => 'required'
        ]);

        if (!Hash::check($request->password, $request->user()->password)) {
            return back()->withErrors(['password' => 'Verification failed: Incorrect password.']);
        }

        try {
            // Drop all tables and re-seed
            Artisan::call('migrate:fresh', [
                '--seed' => true,
                '--force' => true
            ]);

            return redirect()->route('login')->with('success', 'System reset successful. Please login with default credentials.');
        } catch (\Exception $e) {
            return back()->withErrors(['password' => 'Reset failed: ' . $e->getMessage()]);
        }
    }
}
