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

  @Post('clear')
  clearAll() {
    return this.callsService.clearAll();
  }

  @Post('sync')
  syncWithBlandAi() {
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
  @Post('webhook')
  async handleWebhook(@Body() webhookData: any) {
    console.log('📞 Bland.ai Webhook Received:');
    console.log('📋 Webhook Data:', JSON.stringify(webhookData, null, 2));

    const { 
      call_id, 
      status, 
      responses, 
      duration, 
      recording_url,
      issues,
      transferred_to,
      from_number,
      to_number
    } = webhookData;
    
    console.log('🔍 Extracted Data:');
    console.log('📞 Call ID:', call_id);
    console.log('📊 Status:', status);
    console.log('⏱️ Duration:', duration);
    console.log('🎵 Recording URL:', recording_url);
    console.log('⚠️ Issues:', issues);
    console.log('🔄 Transferred To:', transferred_to);
    console.log('📱 From Number:', from_number);
    console.log('📱 To Number:', to_number);
    console.log('💬 Responses:', responses ? JSON.stringify(responses, null, 2) : 'None');
    
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
      await this.callsService.updateCallStatus(
        call_id,
        callStatus as any,
        responses ? JSON.stringify(responses) : undefined,
        duration,
        recording_url,
        issues,
        transferred_to,
      );

      console.log('✅ Webhook processed successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Webhook processing error:', error);
      throw error;
    }
  }
}
