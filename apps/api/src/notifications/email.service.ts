import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

/**
 * Email service — devsecops-engineer pattern:
 * - Reads EMAIL_PROVIDER from env at call time (not constructor) so Railway
 *   env changes take effect on redeploy without code changes.
 * - Falls back to console logger in development if no provider is configured.
 * - Resend is the active provider; SendGrid stubs kept for reference.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    const provider = process.env.EMAIL_PROVIDER;

    if (provider === 'resend' && process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const from =
        process.env.EMAIL_FROM || 'N.E.X.A Loop <noreply@nexaloop.io>';
      const { error } = await resend.emails.send({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      if (error) {
        this.logger.error(`Resend error sending to ${options.to}: ${error.message}`);
      } else {
        this.logger.log(`[Resend] Email sent to ${options.to}: ${options.subject}`);
      }
      return;
    }

    // Default: log to console (development / no provider configured)
    this.logger.log(
      `\n╔══════════════════════════════════════════════════════════╗\n` +
      `║  EMAIL (dev mode — no provider configured)              ║\n` +
      `╠══════════════════════════════════════════════════════════╣\n` +
      `║  To:      ${options.to.substring(0, 46).padEnd(46)}║\n` +
      `║  Subject: ${options.subject.substring(0, 46).padEnd(46)}║\n` +
      `╚══════════════════════════════════════════════════════════╝`,
    );
  }

  // ── Convenience methods ──────────────────────────────────────────

  async sendExpiryWarning(
    to: string,
    documentTypeName: string,
    supplierName: string,
    daysUntilExpiry: number,
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: `[N.E.X.A Loop] ${documentTypeName} for ${supplierName} expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#4f46e5;padding:24px;border-radius:8px 8px 0 0;">
            <h1 style="color:white;margin:0;font-size:20px;">N.E.X.A Loop</h1>
          </div>
          <div style="background:white;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;">
            <h2 style="color:#1e293b;margin-top:0;">Document Expiring Soon</h2>
            <p style="color:#475569;">
              <strong>${documentTypeName}</strong> for supplier <strong>${supplierName}</strong>
              will expire in <strong style="color:#d97706;">${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}</strong>.
            </p>
            <p style="color:#475569;">Please upload a renewed document or take appropriate action.</p>
            <a href="${process.env.WEB_URL || 'http://localhost:3000'}/dashboard/suppliers"
               style="display:inline-block;background:#4f46e5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">
              View Suppliers
            </a>
          </div>
        </div>
      `,
    });
  }

  async sendExpiredNotice(
    to: string,
    documentTypeName: string,
    supplierName: string,
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: `[N.E.X.A Loop] URGENT: ${documentTypeName} for ${supplierName} has expired`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#dc2626;padding:24px;border-radius:8px 8px 0 0;">
            <h1 style="color:white;margin:0;font-size:20px;">N.E.X.A Loop — Urgent</h1>
          </div>
          <div style="background:white;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;">
            <h2 style="color:#1e293b;margin-top:0;">Document Expired</h2>
            <p style="color:#475569;">
              <strong>${documentTypeName}</strong> for supplier <strong>${supplierName}</strong>
              has <strong style="color:#dc2626;">expired</strong>.
            </p>
            <p style="color:#475569;">Please upload a renewed document immediately to maintain compliance.</p>
            <a href="${process.env.WEB_URL || 'http://localhost:3000'}/dashboard/suppliers"
               style="display:inline-block;background:#dc2626;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">
              Take Action
            </a>
          </div>
        </div>
      `,
    });
  }
}
