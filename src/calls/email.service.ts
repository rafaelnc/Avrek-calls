import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Call } from './entities/call.entity';

@Injectable()
export class EmailService {
  private transporter;

  constructor() {
    // Configure email transporter
    console.log('📧 ===== EMAIL SERVICE INITIALIZATION =====');
    console.log('📧 EmailService - Initializing SMTP configuration...');
    console.log('📧 NODE_ENV:', process.env.NODE_ENV || 'NOT SET');
    console.log('📧 SMTP_HOST:', process.env.SMTP_HOST || 'NOT SET');
    console.log('📧 SMTP_PORT:', process.env.SMTP_PORT || 'NOT SET');
    console.log('📧 SMTP_USER:', process.env.SMTP_USER || 'NOT SET');
    console.log('📧 SMTP_PASS:', process.env.SMTP_PASS ? '***SET***' : 'NOT SET');
    console.log('📧 SMTP_FROM:', process.env.SMTP_FROM || 'NOT SET');
    console.log('📧 ADMIN_EMAIL:', process.env.ADMIN_EMAIL || 'NOT SET');
    console.log('📧 All env vars:', Object.keys(process.env).filter(key => key.startsWith('SMTP')));
    
    // Check if running on Railway
    const isRailway = process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID;
    console.log('📧 Running on Railway:', !!isRailway);
    
    if (isRailway) {
      console.log('📧 Using Railway-optimized SMTP configuration...');
      // Railway-optimized configuration with shorter timeouts
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'mail.avanz.com.br',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER || 'rafaelcastro@avanz.com.br',
          pass: process.env.SMTP_PASS || 'rc@@2023@@avz',
        },
        // Shorter timeouts for Railway
        connectionTimeout: 30000, // 30 seconds
        greetingTimeout: 15000,   // 15 seconds
        socketTimeout: 30000,     // 30 seconds
        // Add debug info for troubleshooting
        debug: true,
        logger: true,
      } as any);
    } else {
      console.log('📧 Using standard SMTP configuration...');
      // Standard configuration for local development
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'mail.avanz.com.br',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER || 'rafaelcastro@avanz.com.br',
          pass: process.env.SMTP_PASS || 'rc@@2023@@avz',
        },
        // Standard timeout settings
        connectionTimeout: 60000, // 60 seconds
        greetingTimeout: 30000,   // 30 seconds
        socketTimeout: 60000,     // 60 seconds
        // Add debug info for troubleshooting
        debug: true,
        logger: true,
      } as any);
    }
    
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
        from: process.env.SMTP_FROM || 'rafaelcastro@avanz.com.br',
        to: process.env.ADMIN_EMAIL || 'rafaelnunes.ti@gmail.com',
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
      console.log('📧 Railway Environment Check:');
      console.log('📧 NODE_ENV:', process.env.NODE_ENV);
      console.log('📧 RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT);
      console.log('📧 RAILWAY_PROJECT_ID:', process.env.RAILWAY_PROJECT_ID);
      console.log('📧 RAILWAY_SERVICE_ID:', process.env.RAILWAY_SERVICE_ID);
      
      try {
        await this.transporter.verify();
        console.log('📧 SMTP connection verified successfully');
      } catch (verifyError) {
        console.error('❌ SMTP verification failed:', verifyError.message);
        console.error('❌ Verify error code:', verifyError.code);
        console.error('❌ Verify error command:', verifyError.command);
        
        // Try alternative configuration for Railway
        const isRailway = process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID;
        if (isRailway) {
          console.log('🔄 Trying alternative SMTP configuration for Railway...');
          try {
            const altTransporter = nodemailer.createTransport({
              host: process.env.SMTP_HOST || 'mail.avanz.com.br',
              port: 465, // Try SSL port
              secure: true,
              auth: {
                user: process.env.SMTP_USER || 'rafaelcastro@avanz.com.br',
                pass: process.env.SMTP_PASS || 'rc@@2023@@avz',
              },
              connectionTimeout: 20000,
              greetingTimeout: 10000,
              socketTimeout: 20000,
            } as any);
            
            await altTransporter.verify();
            console.log('✅ Alternative SMTP configuration works!');
            this.transporter = altTransporter;
          } catch (altError) {
            console.error('❌ Alternative configuration also failed:', altError.message);
            throw verifyError; // Throw original error
          }
        } else {
          throw verifyError;
        }
      }

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
