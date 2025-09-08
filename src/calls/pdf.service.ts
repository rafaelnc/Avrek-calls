import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer';
import { Call } from './entities/call.entity';

@Injectable()
export class PdfService {
  async generateCallReport(call: Call): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      
      const html = this.generateHtml(call);
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm',
        },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  private generateHtml(call: Call): string {
    const responses = call.responsesCollected 
      ? JSON.parse(call.responsesCollected) 
      : [];

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Call Report - ${call.phoneNumber}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #2c5aa0;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2c5aa0;
            margin-bottom: 10px;
          }
          .call-info {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 5px 0;
            border-bottom: 1px solid #e9ecef;
          }
          .info-label {
            font-weight: bold;
            color: #2c5aa0;
          }
          .script-section {
            margin-bottom: 30px;
          }
          .script-content {
            background-color: #f8f9fa;
            padding: 15px;
            border-left: 4px solid #2c5aa0;
            border-radius: 4px;
            white-space: pre-wrap;
          }
          .responses-section {
            margin-bottom: 30px;
          }
          .response-item {
            background-color: #f8f9fa;
            padding: 15px;
            margin-bottom: 15px;
            border-radius: 8px;
            border-left: 4px solid #28a745;
          }
          .response-question {
            font-weight: bold;
            color: #2c5aa0;
            margin-bottom: 8px;
          }
          .response-answer {
            color: #333;
          }
          .status {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .status.completed {
            background-color: #d4edda;
            color: #155724;
          }
          .status.in-progress {
            background-color: #fff3cd;
            color: #856404;
          }
          .status.not-answered {
            background-color: #f8d7da;
            color: #721c24;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">AVREK LAW</div>
          <h1>Call Report</h1>
        </div>

        <div class="call-info">
          <div class="info-row">
            <span class="info-label">Phone Number:</span>
            <span>${call.phoneNumber}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Date/Time:</span>
            <span>${call.createdAt.toLocaleString()}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Status:</span>
            <span class="status ${call.status.toLowerCase().replace(' ', '-')}">${call.status}</span>
          </div>
          ${call.callDuration ? `
          <div class="info-row">
            <span class="info-label">Duration:</span>
            <span>${Math.floor(call.callDuration / 60)}:${(call.callDuration % 60).toString().padStart(2, '0')}</span>
          </div>
          ` : ''}
        </div>

        <div class="script-section">
          <h2>Base Script</h2>
          <div class="script-content">${call.baseScript}</div>
        </div>

        ${responses.length > 0 ? `
        <div class="responses-section">
          <h2>Responses Collected</h2>
          ${responses.map((response: any) => `
            <div class="response-item">
              <div class="response-question">${response.question || 'Response'}</div>
              <div class="response-answer">${response.answer || response}</div>
            </div>
          `).join('')}
        </div>
        ` : ''}
      </body>
      </html>
    `;
  }
}
