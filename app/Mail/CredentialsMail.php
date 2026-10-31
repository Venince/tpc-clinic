<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CredentialsMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public readonly User $user, public readonly string $password) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Your TPC Clinic Account Credentials');
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.credentials',
            // HTML-only messages score worse with spam filters; send a plain-text
            // alternative as well (also easier to copy the password from).
            text: 'emails.credentials-text',
            with: ['user' => $this->user, 'password' => $this->password],
        );
    }
}