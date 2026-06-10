<?php
namespace App\Mail;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ContactFormMail extends Mailable
{
    use Queueable, SerializesModels;
    public function __construct(public readonly array $data) {}
    public function envelope(): Envelope
    {
        return new Envelope(subject: 'TPC Clinic Contact: ' . $this->data['subject']);
    }
    public function content(): Content
    {
        return new Content(view: 'emails.contact', with: ['data' => $this->data]);
    }
}
