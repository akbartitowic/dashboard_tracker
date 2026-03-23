<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class RegistrationFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_full_registration_and_setup_flow(): void
    {
        // 1. Register
        $response = $this->post('/register', [
            'username' => 'budi_santoso',
            'email' => 'budi@example.com',
        ]);

        $response->assertRedirect(route('login'));
        $this->assertDatabaseHas('users', [
            'username' => 'budi_santoso',
            'email' => 'budi@example.com',
            'email_verified_at' => null,
        ]);

        $user = User::where('email', 'budi@example.com')->first();

        // 2. Simulate clicking email verification link (which redirects to setup account)
        // The URL is signed
        $verificationUrl = URL::temporarySignedRoute(
            'account.setup',
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => sha1($user->email)]
        );

        $response = $this->get($verificationUrl);
        $response->assertOk();
        $response->assertSee('budi@example.com');

        // 3. Setup password
        $response = $this->post(route('account.setup.store'), [
            'id' => $user->id,
            'hash' => sha1($user->email),
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertRedirect(route('login'));
        $user->refresh();
        $this->assertTrue(Hash::check('password123', $user->password));
        $this->assertNotNull($user->email_verified_at);

        // 4. Login
        $response = $this->post('/login', [
            'email' => 'budi@example.com',
            'password' => 'password123',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard'));
    }
}
