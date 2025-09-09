import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Call } from './entities/call.entity';

@Injectable()
export class EmailService {
  private transporter;

  constructor() {
    // Configure email transporter
    console.log('📧 EmailService - Initializing SMTP configuration...');
    console.log('📧 SMTP_HOST:', process.env.SMTP_HOST || 'NOT SET');
    console.log('📧 SMTP_PORT:', process.env.SMTP_PORT || 'NOT SET');
    console.log('📧 SMTP_USER:', process.env.SMTP_USER || 'NOT SET');
    console.log('📧 SMTP_FROM:', process.env.SMTP_FROM || 'NOT SET');
    console.log('📧 ADMIN_EMAIL:', process.env.ADMIN_EMAIL || 'NOT SET');
    
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || 'your-email@gmail.com',
        pass: process.env.SMTP_PASS || 'your-app-password',
      },
    });
    
    console.log('📧 EmailService - SMTP transporter created successfully');
  }

  async sendCallReport(call: Call, pdfBuffer: Buffer): Promise<void> {
    try {
      console.log('📧 ===== EMAIL SENDING STARTED =====');
      console.log('📧 Call ID:', call.id);
      console.log('📧 Phone Number:', call.phoneNumber);
      console.log('📧 Status:', call.status);
      console.log('📧 Timestamp:', new Date().toISOString());

      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@avrek.com',
        to: process.env.ADMIN_EMAIL || 'admin@avrek.com',
        subject: `Call Report - ${call.phoneNumber} - ${call.createdAt.toLocaleDateString()}`,
        html: `
          <h2>Call Report Generated</h2>
          <p>A new call report has been generated for the call made to <strong>${call.phoneNumber}</strong>.</p>
          <p><strong>Date:</strong> ${call.createdAt.toLocaleString()}</p>
          <p><strong>Status:</strong> ${call.status}</p>
          ${call.callDuration ? `<p><strong>Duration:</strong> ${Math.floor(call.callDuration / 60)}:${(call.callDuration % 60).toString().padStart(2, '0')}</p>` : ''}
          <p>Please find the detailed report attached as a PDF.</p>
        `,
        attachments: [
          {
            filename: `call-report-${call.phoneNumber}-${call.createdAt.toISOString().split('T')[0]}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      };

      console.log('📧 Email Configuration:');
      console.log('📧 From:', mailOptions.from);
      console.log('📧 To:', mailOptions.to);
      console.log('📧 Subject:', mailOptions.subject);
      console.log('📧 Attachment:', mailOptions.attachments[0].filename);
      console.log('📧 PDF Size:', pdfBuffer.length, 'bytes');

      // Verify SMTP connection before sending
      console.log('📧 Verifying SMTP connection...');
      await this.transporter.verify();
      console.log('📧 SMTP connection verified successfully');

      // Send email
      console.log('📧 Sending email...');
      const info = await this.transporter.sendMail(mailOptions);
      console.log('📧 Email sent successfully!');
      console.log('📧 Message ID:', info.messageId);
      console.log('📧 Response:', info.response);
      
      console.log('✅ ===== EMAIL SENT SUCCESSFULLY =====');
      console.log('✅ Call ID:', call.id);
      console.log('✅ Email sent to:', mailOptions.to);
      console.log('✅ Timestamp:', new Date().toISOString());
    } catch (error) {
      console.error('❌ ===== EMAIL SENDING FAILED =====');
      console.error('❌ Call ID:', call.id);
      console.error('❌ Error:', error.message);
      console.error('❌ Stack:', error.stack);
      console.error('❌ Timestamp:', new Date().toISOString());
      // Don't throw error to avoid breaking the call flow
    }
  }
}
