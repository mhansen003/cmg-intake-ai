import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import fs from 'fs';
import path from 'path';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean; // true for 465, false for other ports
  auth: {
    user: string;
    pass: string;
  };
}

export interface SupportEmailData {
  fromEmail: string;
  fromName?: string;
  subject: string;
  body: string;
  attachmentPaths?: string[];
}

export class EmailService {
  private transporter: Mail;
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.auth.user,
        pass: config.auth.pass,
      },
    });
  }

  /**
   * Send a support email to appsupport@cmgfi.com
   */
  async sendSupportEmail(emailData: SupportEmailData): Promise<boolean> {
    try {
      // Build email body with proper formatting
      const htmlBody = this.buildEmailBody(emailData.body);

      // Prepare attachments
      const attachments: Mail.Attachment[] = [];
      if (emailData.attachmentPaths && emailData.attachmentPaths.length > 0) {
        console.log(`Attaching ${emailData.attachmentPaths.length} file(s) to email...`);

        for (const filePath of emailData.attachmentPaths) {
          if (fs.existsSync(filePath)) {
            attachments.push({
              filename: path.basename(filePath),
              path: filePath,
            });
          } else {
            console.warn(`Attachment not found: ${filePath}`);
          }
        }
      }

      // Send email
      const mailOptions: Mail.Options = {
        from: {
          name: emailData.fromName || emailData.fromEmail,
          address: this.config.auth.user, // Use authenticated email as sender
        },
        replyTo: emailData.fromEmail, // Set user's email as reply-to
        to: 'appsupport@cmgfi.com',
        subject: emailData.subject,
        html: htmlBody,
        attachments: attachments,
      };

      console.log('Sending support email...');
      console.log(`To: appsupport@cmgfi.com`);
      console.log(`From: ${emailData.fromEmail}`);
      console.log(`Subject: ${emailData.subject}`);

      const info = await this.transporter.sendMail(mailOptions);

      console.log(`✅ Email sent successfully! Message ID: ${info.messageId}`);
      return true;
    } catch (error: any) {
      console.error('❌ Error sending support email:', error.message);
      throw new Error(`Failed to send support email: ${error.message}`);
    }
  }

  /**
   * Build HTML email body with proper formatting
   */
  private buildEmailBody(body: string): string {
    const htmlParts: string[] = [];

    htmlParts.push('<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">');
    htmlParts.push('<div style="background-color: #2b3e50; padding: 20px; margin-bottom: 20px;">');
    htmlParts.push('<h2 style="color: #9bc53d; margin: 0;">Application Support Request</h2>');
    htmlParts.push('<p style="color: #95a5a6; margin: 5px 0 0 0; font-size: 14px;">Submitted via CMG Intake AI Assistant</p>');
    htmlParts.push('</div>');

    htmlParts.push('<div style="padding: 20px;">');
    htmlParts.push('<h3 style="color: #2b3e50; margin-top: 0;">Request Details:</h3>');
    htmlParts.push(`<div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #9bc53d; margin: 10px 0;">`);
    htmlParts.push(`<p style="white-space: pre-wrap; margin: 0;">${this.escapeHtml(body)}</p>`);
    htmlParts.push('</div>');
    htmlParts.push('</div>');

    htmlParts.push('<div style="padding: 20px; background-color: #f9f9f9; margin-top: 20px; border-top: 1px solid #ddd;">');
    htmlParts.push('<p style="font-size: 12px; color: #718096; margin: 0;">');
    htmlParts.push(`<em>Submitted: ${new Date().toLocaleString()}</em>`);
    htmlParts.push('</p>');
    htmlParts.push('</div>');

    htmlParts.push('</div>');

    return htmlParts.join('\n');
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
      '\n': '<br>',
    };
    return text.replace(/[&<>"'\n]/g, (m) => map[m]);
  }

  /**
   * Test the SMTP connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ SMTP connection test successful');
      return true;
    } catch (error: any) {
      console.error('❌ SMTP connection test failed:', error.message);
      return false;
    }
  }
}
