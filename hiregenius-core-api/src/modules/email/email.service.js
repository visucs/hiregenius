const nodemailer = require('nodemailer');
const env = require('../../config/env');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    if (env.MAIL_USERNAME && env.MAIL_PASSWORD) {
      this.transporter = nodemailer.createTransport({
        host: env.MAIL_HOST,
        port: env.MAIL_PORT,
        secure: env.MAIL_PORT === 465,
        auth: {
          user: env.MAIL_USERNAME,
          pass: env.MAIL_PASSWORD,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });
    } else {
      this.transporter = null;
    }
  }

  isConfigured() {
    return Boolean(this.transporter);
  }

  /**
   * Verifies SMTP server connectivity.
   * @returns {Promise<boolean>}
   */
  async verifyConnection() {
    if (!this.isConfigured()) {
      throw new Error('SMTP credentials not configured');
    }
    return this.transporter.verify();
  }

  /**
   * Sends an email via Nodemailer SMTP.
   * Completely isolated: never throws to caller.
   *
   * @param {{ to: string, subject: string, html: string, text?: string, notificationId?: number|string, type?: string }} options
   * @returns {Promise<{ success: boolean, messageId?: string, skipped?: boolean, error?: string }>}
   */
  async sendEmail({ to, subject, html, text, notificationId = null, type = 'GENERAL' }) {
    const startTime = Date.now();

    if (!to || !to.includes('@')) {
      console.warn(`[EmailService] Skipped sending email: invalid or missing recipient "${to}" (notification: ${notificationId}, type: ${type})`);
      return { success: false, skipped: true, error: 'Invalid recipient email' };
    }

    if (!this.isConfigured()) {
      console.warn(`[EmailService] Skipped sending email to ${to}: SMTP credentials not configured (notification: ${notificationId}, type: ${type})`);
      return { success: false, skipped: true, error: 'SMTP credentials not configured' };
    }

    // In automated test environments, prevent real external network calls unless explicitly allowed or mocked
    if (env.NODE_ENV === 'test' && !this.allowRealSendingInTest) {
      if (this.transporter && typeof this.transporter.sendMail === 'function' && this.transporter.sendMail._isMockFunction) {
        const info = await this.transporter.sendMail({ to, subject, html, text });
        return { success: true, messageId: info?.messageId || '<test-mock-id>' };
      }
      return { success: true, messageId: '<test-mock-id>', mocked: true };
    }

    try {
      const mailOptions = {
        from: env.MAIL_FROM || `HireGenius AI <${env.MAIL_USERNAME}>`,
        to,
        subject,
        html,
        text: text || '',
      };

      console.log(`[EmailService] Preparing dispatch - TYPE: ${type} | TO: ${to} | FROM: ${mailOptions.from} | SUBJECT: "${subject}"`);
      const info = await this.transporter.sendMail(mailOptions);
      const duration = Date.now() - startTime;
      console.log(`[EmailService] Email sent successfully to ${to} for notification ${notificationId || 'N/A'} (${type}) in ${duration}ms [messageId: ${info.messageId}]`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      const duration = Date.now() - startTime;
      console.error(`[EmailService] ERROR: Failed to send email to ${to} for notification ${notificationId || 'N/A'} (${type}) after ${duration}ms: ${err.message}`);
      return { success: false, error: err.message };
    }
  }
}

module.exports = new EmailService();
