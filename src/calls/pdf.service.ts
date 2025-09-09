import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import { Call } from './entities/call.entity';

@Injectable()
export class PdfService {
  async generateCallReport(call: Call): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50,
        },
      });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // Generate PDF content
        this.generatePdfContent(doc, call);
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private generatePdfContent(doc: PDFDocument, call: Call): void {
    // Try to parse responses/transcripts from webhook data
    let responses = [];
    let transcripts = [];
    
    try {
      if (call.responsesCollected) {
        const parsed = JSON.parse(call.responsesCollected);
        if (Array.isArray(parsed)) {
          responses = parsed;
        } else if (typeof parsed === 'string') {
          // If it's a concatenated transcript, treat as single response
          responses = [{ question: 'Call Transcript', answer: parsed }];
        }
      }
    } catch (error) {
      console.log('Could not parse responsesCollected:', error);
    }

    // Header
    doc.fontSize(24)
       .fillColor('#2c5aa0')
       .text('AVREK LAW', { align: 'center' });
    
    doc.moveDown(0.5);
    doc.fontSize(18)
       .fillColor('#333')
       .text('Call Report', { align: 'center' });
    
    doc.moveDown(1);
    
    // Draw line under header
    doc.strokeColor('#2c5aa0')
       .lineWidth(2)
       .moveTo(50, doc.y)
       .lineTo(doc.page.width - 50, doc.y)
       .stroke();
    
    doc.moveDown(1);

    // Call Information Section
    doc.fontSize(16)
       .fillColor('#2c5aa0')
       .text('Call Information', { underline: true });
    
    doc.moveDown(0.5);
    
    // Call details
    const callInfo = [
      ['Phone Number:', call.phoneNumber],
      ['Date/Time:', new Date(call.createdAt).toLocaleString()],
      ['Status:', call.status],
    ];

    if (call.callDuration) {
      const minutes = Math.floor(call.callDuration / 60);
      const seconds = call.callDuration % 60;
      callInfo.push(['Duration:', `${minutes}:${seconds.toString().padStart(2, '0')}`]);
    }

    callInfo.forEach(([label, value]) => {
      doc.fontSize(12)
         .fillColor('#2c5aa0')
         .text(label, { continued: true })
         .fillColor('#333')
         .text(` ${value}`);
      doc.moveDown(0.3);
    });

    doc.moveDown(1);

    // Base Script Section
    doc.fontSize(16)
       .fillColor('#2c5aa0')
       .text('Base Script', { underline: true });
    
    doc.moveDown(0.5);
    
    // Add background for script
    const scriptY = doc.y;
    doc.rect(50, scriptY - 10, doc.page.width - 100, 100)
       .fillColor('#f8f9fa')
       .fill();
    
    doc.fillColor('#333')
       .fontSize(10)
       .text(call.baseScript, 60, scriptY, {
         width: doc.page.width - 120,
         align: 'left'
       });

    // Calculate actual height used by script
    const scriptHeight = doc.heightOfString(call.baseScript, {
      width: doc.page.width - 120
    });
    
    // Redraw background with correct height
    doc.rect(50, scriptY - 10, doc.page.width - 100, scriptHeight + 20)
       .fillColor('#f8f9fa')
       .fill();
    
    // Redraw text
    doc.fillColor('#333')
       .fontSize(10)
       .text(call.baseScript, 60, scriptY, {
         width: doc.page.width - 120,
         align: 'left'
       });

    doc.y = scriptY + scriptHeight + 20;
    doc.moveDown(1);

    // Call Transcript Section
    if (responses.length > 0) {
      doc.fontSize(16)
         .fillColor('#2c5aa0')
         .text('Call Transcript', { underline: true });
      
      doc.moveDown(0.5);

      responses.forEach((response: any, index: number) => {
        const responseY = doc.y;
        const question = response.question || 'Response';
        const answer = response.answer || response;

        // Response background
        doc.rect(50, responseY - 10, doc.page.width - 100, 60)
           .fillColor('#f8f9fa')
           .fill();

        // Question
        doc.fillColor('#2c5aa0')
           .fontSize(12)
           .text(question, 60, responseY, {
             width: doc.page.width - 120,
             align: 'left'
           });

        // Answer
        doc.fillColor('#333')
           .fontSize(10)
           .text(answer, 60, responseY + 20, {
             width: doc.page.width - 120,
             align: 'left'
           });

        // Calculate actual height
        const questionHeight = doc.heightOfString(question, {
          width: doc.page.width - 120
        });
        const answerHeight = doc.heightOfString(answer, {
          width: doc.page.width - 120
        });
        const totalHeight = Math.max(60, questionHeight + answerHeight + 30);

        // Redraw background with correct height
        doc.rect(50, responseY - 10, doc.page.width - 100, totalHeight)
           .fillColor('#f8f9fa')
           .fill();

        // Redraw content
        doc.fillColor('#2c5aa0')
           .fontSize(12)
           .text(question, 60, responseY, {
             width: doc.page.width - 120,
             align: 'left'
           });

        doc.fillColor('#333')
           .fontSize(10)
           .text(answer, 60, responseY + 20, {
             width: doc.page.width - 120,
             align: 'left'
           });

        doc.y = responseY + totalHeight + 10;
        doc.moveDown(0.5);
      });
    }

    // Footer
    doc.fontSize(8)
       .fillColor('#666')
       .text(`Generated on ${new Date().toLocaleString()}`, 50, doc.page.height - 30, {
         align: 'center',
         width: doc.page.width - 100
       });
  }
}
