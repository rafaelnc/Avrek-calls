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
    // Parse transcripts from responsesCollected
    let transcripts = [];
    
    try {
      if (call.responsesCollected) {
        try {
          const parsed = JSON.parse(call.responsesCollected);
          if (Array.isArray(parsed)) {
            transcripts = parsed;
          } else if (typeof parsed === 'string') {
            // If it's a concatenated transcript, split by lines
            const lines = parsed.split('\n').filter(line => line.trim());
            transcripts = lines.map((line, index) => ({
              id: index,
              user: line.includes(':') ? line.split(':')[0].trim() : 'unknown',
              text: line.includes(':') ? line.split(':').slice(1).join(':').trim() : line.trim(),
              created_at: new Date().toISOString()
            }));
          }
        } catch (jsonError) {
          // If JSON parsing fails, treat as concatenated transcript string
          const lines = call.responsesCollected.split('\n').filter(line => line.trim());
          transcripts = lines.map((line, index) => ({
            id: index,
            user: line.includes(':') ? line.split(':')[0].trim() : 'unknown',
            text: line.includes(':') ? line.split(':').slice(1).join(':').trim() : line.trim(),
            created_at: new Date().toISOString()
          }));
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
    
    doc.moveDown(1.5);

    // Call Information Section
    this.addSection(doc, 'Call Information', [
      { label: 'Phone Number', value: call.phoneNumber || 'Unknown' },
      { label: 'Date/Time', value: new Date(call.createdAt).toLocaleString() },
      { label: 'Status', value: call.status || 'Unknown' },
      { label: 'From Number', value: call.fromNumber || 'System' },
      { label: 'Pathway', value: call.pathway || 'Unknown' },
    ]);

    // Call Details Section
    const details = [];
    if (call.callDuration) {
      const minutes = Math.floor(call.callDuration / 60);
      const seconds = Math.floor(call.callDuration % 60);
      details.push({ label: 'Duration', value: `${minutes}:${seconds.toString().padStart(2, '0')}` });
    }
    if (call.recordingUrl) {
      details.push({ label: 'Recording', value: 'Available' });
    }
    if (details.length > 0) {
      this.addSection(doc, 'Call Details', details);
    }

    // Summary Section
    if (call.summary && call.summary.trim()) {
      this.addTextSection(doc, 'Call Summary', call.summary);
    }

    // Issues Section
    if (call.issues && call.issues.trim()) {
      this.addTextSection(doc, 'Issues Detected', call.issues);
    }

    // Transcript Section
    if (transcripts && transcripts.length > 0) {
      this.addTranscriptSection(doc, 'Call Transcript', transcripts);
    }

    // Footer
    doc.moveDown(2);
    doc.fontSize(8)
       .fillColor('#666')
       .text(`Generated on ${new Date().toLocaleString()}`, { align: 'center' });
  }

  private addSection(doc: PDFDocument, title: string, items: { label: string; value: string }[]): void {
    // Check if we need a new page
    const estimatedHeight = 60 + (items.length * 25);
    if (doc.y + estimatedHeight > doc.page.height - 100) {
      doc.addPage();
    }

    // Section title
    doc.fontSize(16)
       .fillColor('#2c5aa0')
       .font('Helvetica-Bold')
       .text(title, { underline: true });
    
    doc.moveDown(0.5);

    // Create a table-like layout
    const startY = doc.y;
    const rowHeight = 25;
    const totalHeight = items.length * rowHeight + 20;

    // Background
    doc.rect(50, startY - 10, doc.page.width - 100, totalHeight)
       .fillColor('#f8f9fa')
       .fill();

    // Border
    doc.rect(50, startY - 10, doc.page.width - 100, totalHeight)
       .strokeColor('#e5e7eb')
       .lineWidth(1)
       .stroke();

    // Items
    items.forEach((item, index) => {
      const y = startY + (index * rowHeight);
      
      // Label
      doc.fillColor('#374151')
         .fontSize(11)
         .font('Helvetica-Bold')
         .text(item.label + ':', 60, y + 5);

      // Value
      doc.fillColor('#6b7280')
         .fontSize(11)
         .font('Helvetica')
         .text(item.value, 200, y + 5, {
           width: doc.page.width - 250,
           align: 'left'
         });
    });

    // Update position
    doc.y = startY + totalHeight + 10;
    doc.moveDown(1);
  }

  private addTextSection(doc: PDFDocument, title: string, content: string): void {
    // Check if we need a new page
    const contentHeight = doc.heightOfString(content, {
      width: doc.page.width - 120,
      fontSize: 11
    });
    const estimatedHeight = 60 + contentHeight;
    
    if (doc.y + estimatedHeight > doc.page.height - 100) {
      doc.addPage();
    }

    // Section title
    doc.fontSize(16)
       .fillColor('#2c5aa0')
       .font('Helvetica-Bold')
       .text(title, { underline: true });
    
    doc.moveDown(0.5);

    const startY = doc.y;
    const blockHeight = contentHeight + 30;

    // Background
    doc.rect(50, startY - 10, doc.page.width - 100, blockHeight)
       .fillColor('#f8f9fa')
       .fill();

    // Border
    doc.rect(50, startY - 10, doc.page.width - 100, blockHeight)
       .strokeColor('#e5e7eb')
       .lineWidth(1)
       .stroke();

    // Content
    doc.fillColor('#374151')
       .fontSize(11)
       .font('Helvetica')
       .text(content, 60, startY + 5, {
         width: doc.page.width - 120,
         align: 'left'
       });

    // Update position
    doc.y = startY + blockHeight + 10;
    doc.moveDown(1);
  }

  private addTranscriptSection(doc: PDFDocument, title: string, transcripts: any[]): void {
    // Force new page for transcript section
    doc.addPage();
    
    // Section title
    doc.fontSize(16)
       .fillColor('#2c5aa0')
       .font('Helvetica-Bold')
       .text(title, { underline: true });
    
    doc.moveDown(0.5);

    transcripts.forEach((transcript, index) => {
      // Check if we need a new page for this transcript entry
      const contentHeight = doc.heightOfString(transcript.text || 'No text', {
        width: doc.page.width - 120,
        fontSize: 10
      });
      const estimatedHeight = 40 + contentHeight;
      
      if (doc.y + estimatedHeight > doc.page.height - 100) {
        doc.addPage();
      }

      const startY = doc.y;
      const blockHeight = contentHeight + 30;

      // Background
      doc.rect(50, startY - 5, doc.page.width - 100, blockHeight)
         .fillColor('#f8f9fa')
         .fill();

      // Border
      doc.rect(50, startY - 5, doc.page.width - 100, blockHeight)
         .strokeColor('#e5e7eb')
         .lineWidth(1)
         .stroke();

      // User label with color
      const userColor = transcript.user === 'user' ? '#3b82f6' : '#10b981';
      doc.fillColor(userColor)
         .fontSize(12)
         .font('Helvetica-Bold')
         .text(`${transcript.user || 'Unknown'}:`, 60, startY + 5);

      // Text content
      doc.fillColor('#374151')
         .fontSize(10)
         .font('Helvetica')
         .text(transcript.text || 'No text', 60, startY + 20, {
           width: doc.page.width - 120,
           align: 'left'
         });

      // Update position
      doc.y = startY + blockHeight + 5;
    });

    doc.moveDown(1);
  }
}