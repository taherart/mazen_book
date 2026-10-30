import "server-only";

/**
 * Outgoing email through Resend's HTTP API. Configured by RESEND_API_KEY and MAIL_FROM; without a
 * key nothing is sent and callers fall back to logging (see password-reset-actions.ts).
 *
 * Until a domain is verified in Resend, the only sender it accepts is onboarding@resend.dev, and it
 * delivers that only to the Resend account's own address: fine for trying the flow, not for members.
 */
export const mailEnabled = () => Boolean(process.env.RESEND_API_KEY);

const FROM_DEFAULT = "52 طريقة <onboarding@resend.dev>";

export async function sendMail(message: { to: string; subject: string; text: string; html: string }): Promise<{ ok: true } | { ok: false; error: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "mail is not configured" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.MAIL_FROM || FROM_DEFAULT, to: [message.to], subject: message.subject, text: message.text, html: message.html }),
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) return { ok: true };
    const body = (await res.text()).slice(0, 300);
    console.error(`mail: Resend answered ${res.status}: ${body}`);
    return { ok: false, error: `Resend ${res.status}` };
  } catch (err) {
    console.error("mail: could not reach Resend", err);
    return { ok: false, error: "unreachable" };
  }
}

/** A plain, right-to-left message in the site's colours: one heading, one paragraph, one button. */
export function template({ title, intro, action, url, footer }: { title: string; intro: string; action: string; url: string; footer: string }) {
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
  const html = `<!doctype html><html lang="ar" dir="rtl"><body style="margin:0;background:#f7f3ea;font-family:'IBM Plex Sans Arabic',Tahoma,Arial,sans-serif;color:#1d1f26">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border:1px solid #e2dbc9;border-radius:14px">
<tr><td style="padding:28px 28px 8px;font-size:14px;font-weight:700;color:#2f5bd3">52 طريقة لزيادة الدخل</td></tr>
<tr><td style="padding:0 28px;font-size:24px;font-weight:700;line-height:1.4">${esc(title)}</td></tr>
<tr><td style="padding:12px 28px 0;font-size:16px;line-height:1.8;color:#4a4d57">${esc(intro)}</td></tr>
<tr><td style="padding:24px 28px"><a href="${esc(url)}" style="display:inline-block;background:#2f5bd3;color:#fff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 28px;border-radius:999px">${esc(action)}</a></td></tr>
<tr><td style="padding:0 28px 28px;font-size:13px;line-height:1.7;color:#63666f">${esc(footer)}<br><span dir="ltr" style="color:#63666f;word-break:break-all">${esc(url)}</span></td></tr>
</table></td></tr></table></body></html>`;
  const text = `${title}\n\n${intro}\n\n${action}: ${url}\n\n${footer}`;
  return { html, text };
}
