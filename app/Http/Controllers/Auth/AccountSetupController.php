<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Illuminate\Auth\Events\Verified;

class AccountSetupController extends Controller
{
    public function create(Request $request, $id, $hash)
    {
        $user = User::findOrFail($id);

        if (! hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
            abort(403);
        }

        if ($user->hasVerifiedEmail()) {
            return redirect(route('login'))->with('status', 'Account already verified. Please login.');
        }

        return Inertia::render('Auth/SetupAccount', [
            'id' => $id,
            'hash' => $hash,
            'email' => $user->email
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'id' => 'required',
            'hash' => 'required',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = User::findOrFail($request->id);

        if (! hash_equals((string) $request->hash, sha1($user->getEmailForVerification()))) {
            abort(403);
        }

        $user->password = Hash::make($request->password);
        $user->email_verified_at = now();
        $user->save();

        event(new Verified($user));

        return redirect(route('login'))->with('status', 'Account verified and password set successfully. You can now login.');
    }
}
