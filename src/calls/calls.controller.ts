import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Res,
  ParseIntPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { CallsService } from './calls.service';
import { CreateCallDto } from './dto/create-call.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';

@Controller('calls')
@UseGuards(JwtAuthGuard)
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  @Post()
  create(@Body() createCallDto: CreateCallDto) {
    return this.callsService.create(createCallDto);
  }

  @Get()
  findAll() {
    return this.callsService.findAll();
  }

  @Get('health')
  healthCheck() {
    return { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'avrek-calls-backend'
    };
  }

  @Post('clear')
  clearAll() {
    return this.callsService.clearAll();
  }

  @Post('sync')
  syncWithBlandAi() {
    console.log('🎯 ===== SYNC ENDPOINT CALLED =====');
    console.log('🎯 Endpoint: POST /calls/sync');
    console.log('🎯 Timestamp:', new Date().toISOString());
    console.log('🎯 Calling callsService.syncWithBlandAi()...');
    
    return this.callsService.syncWithBlandAi();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.callsService.findOne(id);
  }

  @Get(':id/details')
  async getCallDetails(@Param('id', ParseIntPipe) id: number) {
    return this.callsService.getCallDetails(id);
  }

  @Get(':id/pdf')
  async downloadPdf(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const pdfBuffer = await this.callsService.downloadPdf(id);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="call-report-${id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    
    res.send(pdfBuffer);
  }

  // Webhook endpoint for Bland.ai status updates
  @Public()
  @Post('webhook')
  async handleWebhook(@Body() webhookData: any) {
    console.log('🎯 ===== WEBHOOK RECEIVED =====');
    console.log('📞 Bland.ai Webhook Received:');
    console.log('🕐 Timestamp:', new Date().toISOString());
    console.log('📋 Webhook Data:', JSON.stringify(webhookData, null, 2));

    const { 
      call_id, 
      status, 
      transcripts, 
      call_length, 
      recording_url,
      error_message,
      transferred_to,
      from,
      to,
      summary,
      analysis,
      variables,
      answered_by,
      call_ended_by,
      concatenated_transcript
    } = webhookData;
    
    console.log('🔍 Extracted Data:');
    console.log('📞 Call ID:', call_id);
    console.log('📊 Status:', status);
    console.log('⏱️ Call Length:', call_length);
    console.log('🎵 Recording URL:', recording_url);
    console.log('⚠️ Error Message:', error_message);
    console.log('🔄 Transferred To:', transferred_to);
    console.log('📱 From Number:', from);
    console.log('📱 To Number:', to);
    console.log('📝 Summary:', summary);
    console.log('🔍 Analysis:', analysis);
    console.log('👤 Answered By:', answered_by);
    console.log('🔚 Call Ended By:', call_ended_by);
    console.log('💬 Transcripts:', transcripts ? JSON.stringify(transcripts, null, 2) : 'None');
    console.log('📄 Concatenated Transcript:', concatenated_transcript);
    
    let callStatus;
    switch (status) {
      case 'completed':
        callStatus = 'Completed';
        break;
      case 'no-answer':
        callStatus = 'Not Answered';
        break;
      default:
        callStatus = 'In Progress';
    }

    console.log('🔄 Mapped Status:', callStatus);

    try {
      console.log('🔄 Processing webhook data...');
      
      // Process webhook in background to avoid blocking the response
      this.processWebhookInBackground(
        call_id,
        callStatus as any,
        concatenated_transcript || (transcripts ? JSON.stringify(transcripts) : undefined),
        call_length,
        recording_url,
        error_message,
        transferred_to,
      );

      console.log('✅ ===== WEBHOOK ACCEPTED =====');
      console.log('✅ Call ID:', call_id);
      console.log('✅ Status to process:', callStatus);
      console.log('✅ Timestamp:', new Date().toISOString());
      return { success: true, message: 'Webhook received and queued for processing' };
    } catch (error) {
      console.error('❌ ===== WEBHOOK ACCEPTANCE ERROR =====');
      console.error('❌ Call ID:', call_id);
      console.error('❌ Error:', error.message);
      console.error('❌ Timestamp:', new Date().toISOString());
      // Still return success to avoid webhook retries
      return { success: true, message: 'Webhook received but processing failed', error: error.message };
    }
  }

  private async processWebhookInBackground(
    call_id: string,
    status: any,
    responses?: string,
    duration?: number,
    recording_url?: string,
    issues?: string,
    transferred_to?: string,
  ): Promise<void> {
    try {
      console.log('🔄 ===== BACKGROUND PROCESSING STARTED =====');
      console.log('🔄 Call ID:', call_id);
      console.log('🔄 Timestamp:', new Date().toISOString());
      
      await this.callsService.updateCallStatus(
        call_id,
        status,
        responses,
        duration,
        recording_url,
        issues,
        transferred_to,
      );

      console.log('✅ ===== BACKGROUND PROCESSING COMPLETED =====');
      console.log('✅ Call ID:', call_id);
      console.log('✅ Timestamp:', new Date().toISOString());
    } catch (error) {
      console.error('❌ ===== BACKGROUND PROCESSING ERROR =====');
      console.error('❌ Call ID:', call_id);
      console.error('❌ Error:', error.message);
      console.error('❌ Stack:', error.stack);
      console.error('❌ Timestamp:', new Date().toISOString());
      // Don't throw error - this is background processing
    }
  }
}
