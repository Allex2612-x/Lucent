import { Resend } from 'resend';

/**
 * Tiny wrapper over the Resend API for transactional email
 * (password reset for now; later: budget breach summaries, etc.).
 *
 * Configuration:
 *   - RESEND_API_KEY — required to actually send. Without it, the
 *     wrapper logs the would-be email to console and returns ok so
 *     local dev still works.
 *   - RESEND_FROM — sender address. Defaults to onboarding@resend.dev
 *     which works without any DNS setup but emails will come from
 *     that domain. For production, verify your own domain in Resend.
 */

let client: Resend | null = null;
function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!client) client = new Resend(key);
  return client;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<{ ok: boolean; error?: string }> {
  const c = getClient();
  const from = process.env.RESEND_FROM || 'FARO <onboarding@resend.dev>';

  if (!c) {
    console.warn(
      '[email] RESEND_API_KEY not set — email NOT sent. Subject:',
      params.subject,
      '→',
      params.to,
    );
    console.warn('[email] body preview (first 200 chars):', params.text?.slice(0, 200) ?? '');
    return { ok: false, error: 'RESEND_API_KEY missing' };
  }

  try {
    const result = await c.emails.send({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });
    if (result.error) {
      console.error('[email] resend error:', result.error);
      return { ok: false, error: result.error.message };
    }
    console.log('[email] sent to', params.to, '— id', result.data?.id);
    return { ok: true };
  } catch (err: any) {
    console.error('[email] send failed:', err);
    return { ok: false, error: err?.message ?? 'unknown' };
  }
}

/**
 * Branded HTML template for a password-reset email. Plain-text version
 * included for clients that don't render HTML.
 */
export function passwordResetEmailHtml(resetUrl: string, firstName?: string | null) {
  const greeting = firstName ? `Salut, ${firstName}` : 'Salut';
  return `<!doctype html>
<html lang="ro">
  <body style="margin:0;padding:0;background:#f7f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0e0e10;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f7f5f0;padding:40px 16px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;background:#ffffff;border-radius:16px;border:1px solid #e7e3d9;overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 24px;text-align:center;">
                <div style="display:inline-block;width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#2547f5,#6c4cf8);color:#fff;font-size:28px;line-height:48px;font-style:italic;font-family:'Times New Roman',serif;">F</div>
                <h1 style="font-size:22px;margin:18px 0 0;letter-spacing:-0.02em;">FARO</h1>
                <p style="font-size:11.5px;color:#8c8879;letter-spacing:0.08em;text-transform:uppercase;margin:6px 0 0;">Finanțe personale</p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 24px;">
                <h2 style="font-size:18px;margin:0 0 14px;">${greeting},</h2>
                <p style="font-size:14px;line-height:1.6;color:#56544c;margin:0 0 18px;">
                  Am primit o cerere de resetare a parolei pentru contul tău FARO. Apasă pe butonul de mai jos pentru a-ți seta o parolă nouă:
                </p>
                <table cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 20px;">
                  <tr>
                    <td align="center" style="background:#0e0e10;border-radius:10px;">
                      <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;">
                        Resetează parola
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="font-size:12.5px;line-height:1.55;color:#8c8879;margin:0 0 8px;">
                  Sau copiază acest link în browser:
                </p>
                <p style="font-size:12px;line-height:1.55;color:#2547f5;word-break:break-all;margin:0 0 22px;">
                  ${resetUrl}
                </p>
                <p style="font-size:12px;line-height:1.55;color:#8c8879;margin:0;border-top:1px solid #e7e3d9;padding-top:16px;">
                  Linkul expiră în <b>1 oră</b>. Dacă nu ai cerut tu această resetare, poți ignora email-ul — parola rămâne neschimbată.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px 28px;text-align:center;background:#faf9f5;border-top:1px solid #e7e3d9;">
                <p style="font-size:11px;color:#8c8879;margin:0;">
                  Acest email a fost trimis de FARO către ${''}<!-- recipient is implied from the To header -->
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function passwordResetEmailText(resetUrl: string, firstName?: string | null) {
  return `${firstName ? `Salut, ${firstName}` : 'Salut'},

Am primit o cerere de resetare a parolei pentru contul tău FARO.
Deschide acest link pentru a seta o parolă nouă:

${resetUrl}

Linkul expiră în 1 oră. Dacă nu ai cerut tu această resetare, ignoră acest email.

— FARO`;
}
