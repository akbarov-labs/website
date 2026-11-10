// The two outside services the assistant calls besides Claude.

import type { Lead } from './chat.ts';

// Sends a lead to Sarvar through the leads bot. Plain text, so nothing a
// visitor typed can turn into formatting or links that look like ours.
export async function sendLeadToTelegram(botToken: string, chatId: string, lead: Lead): Promise<void> {
  const text = [
    'Yangi ariza — akbarovlabs.uz yordamchisi',
    '',
    `Ism: ${lead.name}`,
    `Aloqa: ${lead.contact}`,
    `Kerak: ${lead.need}`,
  ].join('\n');
  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, link_preview_options: { is_disabled: true } }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Telegram answered ${response.status}`);
}

const turnstileVerify = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

// Asks Cloudflare whether a Turnstile token came from a person. A token works once.
export async function checkTurnstile(secret: string, token: string | undefined, ip: string): Promise<boolean> {
  if (!token) return false;
  const form = new URLSearchParams({ secret, response: token, remoteip: ip });
  try {
    const response = await fetch(turnstileVerify, { method: 'POST', body: form, signal: AbortSignal.timeout(10_000) });
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch {
    return false;
  }
}
