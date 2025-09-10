import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Call, CallStatus } from './entities/call.entity';
import { CreateCallDto } from './dto/create-call.dto';
import { BlandAiService, StartCallData } from './bland-ai.service';
import { PdfService } from './pdf.service';
import { EmailService } from './email.service';

@Injectable()
export class CallsService {
  constructor(
    @InjectRepository(Call)
    private callsRepository: Repository<Call>,
    private blandAiService: BlandAiService,
    private pdfService: PdfService,
    private emailService: EmailService,
  ) {}

  async create(createCallDto: CreateCallDto): Promise<Call> {
    try {
      // Handle both new comprehensive format and legacy format
      const phoneNumber = createCallDto.phone_number || createCallDto.phoneNumber;
      const script = createCallDto.task || createCallDto.baseScript;

      if (!phoneNumber || !script) {
        throw new HttpException(
          'Phone number and task/script are required',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Create call record in database
      const call = this.callsRepository.create({
        phoneNumber: phoneNumber,
        fromNumber: createCallDto.fromNumber || 'System',
        baseScript: script,
        status: CallStatus.IN_PROGRESS,
        pathway: createCallDto.model || 'base',
        reviewStatus: 'pending',
      });

      const savedCall = await this.callsRepository.save(call);

      // Start call with Bland.ai using comprehensive payload
      const blandResponse = await this.blandAiService.startCall({
        phone_number: phoneNumber,
        voice: createCallDto.voice,
        wait_for_greeting: createCallDto.wait_for_greeting,
        record: createCallDto.record,
        answered_by_enabled: createCallDto.answered_by_enabled,
        noise_cancellation: createCallDto.noise_cancellation,
        interruption_threshold: createCallDto.interruption_threshold,
        block_interruptions: createCallDto.block_interruptions,
        max_duration: createCallDto.max_duration,
        model: createCallDto.model,
        language: createCallDto.language,
        background_track: createCallDto.background_track,
        endpoint: createCallDto.endpoint,
        voicemail_action: createCallDto.voicemail_action,
        task: script,
        callId: savedCall.id.toString(),
        webhook: "https://avrek-calls-production.up.railway.app/calls/webhook"
      });

      // Update call with Bland.ai call ID
      savedCall.blandCallId = blandResponse.callId;
      await this.callsRepository.save(savedCall);

      return savedCall;
    } catch (error) {
      throw new HttpException(
        'Failed to start call',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(): Promise<Call[]> {
    return this.callsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Call> {
    const call = await this.callsRepository.findOne({ where: { id } });
    if (!call) {
      throw new HttpException('Call not found', HttpStatus.NOT_FOUND);
    }
    return call;
  }

  async getCallDetails(id: number): Promise<any> {
    console.log('🔍 Getting call details for ID:', id);
    
    const call = await this.findOne(id);
    console.log('📋 Local call data:', JSON.stringify(call, null, 2));
    
    if (!call.blandCallId) {
      console.error('❌ Bland.ai call ID not found for call:', id);
      throw new HttpException('Bland.ai call ID not found', HttpStatus.NOT_FOUND);
    }

    console.log('🔗 Bland.ai call ID:', call.blandCallId);

    try {
      // Get detailed information from Bland.ai API
      const blandDetails = await this.blandAiService.getCallStatus(call.blandCallId);
      
      console.log('✅ Bland.ai details retrieved successfully');
      
      // Parse responses if available - handle both JSON and concatenated strings
      let responses = [];
      if (call.responsesCollected) {
        try {
          // Try to parse as JSON first
          const parsed = JSON.parse(call.responsesCollected);
          if (Array.isArray(parsed)) {
            responses = parsed;
          } else if (typeof parsed === 'string') {
            // If it's a string, treat as concatenated transcript
            responses = [{ question: 'Call Transcript', answer: parsed }];
          }
        } catch (jsonError) {
          console.log('📝 Not valid JSON, treating as concatenated transcript');
          // If JSON parsing fails, treat as concatenated transcript
          responses = [{ question: 'Call Transcript', answer: call.responsesCollected }];
        }
      }

      // Combine local call data with Bland.ai details
      const result = {
        localCall: call,
        blandDetails: blandDetails,
        responses: responses,
      };

      console.log('📊 Final result structure:', {
        localCallId: result.localCall.id,
        blandCallId: result.blandDetails.call_id,
        responsesCount: result.responses.length,
        hasTranscript: !!result.blandDetails.transcripts,
        hasRecording: !!result.blandDetails.recording_url,
      });

      return result;
    } catch (error) {
      console.error('❌ Error fetching call details:', error);
      throw new HttpException(
        'Failed to fetch call details from Bland.ai',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateCallStatus(
    blandCallId: string,
    status: CallStatus,
    responses?: string,
    duration?: number,
    recordingUrl?: string,
    issues?: string,
    transferredTo?: string,
    phoneNumber?: string,
    summary?: string,
  ): Promise<void> {
    console.log('🔍 ===== UPDATE CALL STATUS STARTED =====');
    console.log('🔍 Looking for call with Bland Call ID:', blandCallId);
    console.log('🔍 Status to update:', status);
    
    const call = await this.callsRepository.findOne({
      where: { blandCallId },
    });

    if (call) {
      console.log('✅ Call found in database:', call.id);
      console.log('✅ Current status:', call.status);
      console.log('✅ Phone number:', call.phoneNumber);
      call.status = status;
      if (responses) {
        call.responsesCollected = responses;
      }
      if (duration) {
        call.callDuration = duration;
      }
      if (recordingUrl) {
        call.recordingUrl = recordingUrl;
      }
      if (issues) {
        call.issues = issues;
      }
      if (transferredTo) {
        call.transferredTo = transferredTo;
      }
      if (phoneNumber) {
        call.phoneNumber = phoneNumber;
        console.log('✅ Phone number updated:', phoneNumber);
      }
      if (summary) {
        call.summary = summary;
        console.log('✅ Summary updated:', summary.substring(0, 100) + '...');
      }
      await this.callsRepository.save(call);
      console.log('✅ Call updated successfully in database');
      console.log('✅ New status:', call.status);
      console.log('✅ Duration:', call.callDuration);
      console.log('✅ Recording URL:', call.recordingUrl);

      // If call is completed, generate and send PDF
      if (status === CallStatus.COMPLETED) {
        console.log('📧 Call completed, generating and sending PDF...');
        console.log('📧 Call ID:', call.id);
        console.log('📧 Bland Call ID:', call.blandCallId);
        await this.generateAndSendPdf(call.id);
        console.log('📧 PDF generation and email sending completed for call:', call.id);
      }
    } else {
      console.log('❌ Call not found in database with Bland Call ID:', blandCallId);
      console.log('🔄 Creating new call record from webhook data...');
      
      // Create new call record from webhook data
      const newCall = this.callsRepository.create({
        phoneNumber: phoneNumber || 'Unknown',
        fromNumber: 'System',
        baseScript: 'Call imported from webhook',
        status: status,
        blandCallId: blandCallId,
        responsesCollected: responses,
        callDuration: duration,
        recordingUrl: recordingUrl,
        issues: issues,
        transferredTo: transferredTo,
        summary: summary,
        pathway: 'webhook-import',
        reviewStatus: 'pending',
      });

      const savedCall = await this.callsRepository.save(newCall);
      console.log('✅ New call created from webhook:', savedCall.id);
      console.log('✅ Phone number:', savedCall.phoneNumber);
      console.log('✅ Status:', savedCall.status);
      console.log('✅ Bland Call ID:', savedCall.blandCallId);

      // If call is completed, generate and send PDF
      if (status === CallStatus.COMPLETED) {
        console.log('📧 Call completed, generating and sending PDF...');
        console.log('📧 Call ID:', savedCall.id);
        console.log('📧 Bland Call ID:', savedCall.blandCallId);
        await this.generateAndSendPdf(savedCall.id);
        console.log('📧 PDF generation and email sending completed for call:', savedCall.id);
      }
    }
  }

  async generateAndSendPdf(callId: number): Promise<void> {
    console.log('📄 ===== PDF GENERATION STARTED =====');
    console.log('📄 Call ID:', callId);
    console.log('📄 Timestamp:', new Date().toISOString());
    
    const call = await this.findOne(callId);
    console.log('📄 Call found:', call.phoneNumber, '- Status:', call.status);
    
    const pdfBuffer = await this.pdfService.generateCallReport(call);
    console.log('📄 PDF generated successfully, size:', pdfBuffer.length, 'bytes');
    
    // Send email with PDF attachment
    console.log('📧 Starting email sending process...');
    await this.emailService.sendCallReport(call, pdfBuffer);
    console.log('📄 ===== PDF GENERATION COMPLETED =====');
  }

  async downloadPdf(callId: number): Promise<Buffer> {
    const call = await this.findOne(callId);
    if (call.status !== CallStatus.COMPLETED) {
      throw new HttpException(
        'PDF is only available for completed calls',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.pdfService.generateCallReport(call);
  }

  async clearAll(): Promise<{ message: string; deletedCount: number }> {
    const result = await this.callsRepository.delete({});
    return {
      message: 'All calls cleared successfully',
      deletedCount: result.affected || 0,
    };
  }

  async syncWithBlandAi(): Promise<{ message: string; syncedCount: number; createdCount: number; updatedCount: number }> {
    try {
      console.log('🔄 ===== SYNC REQUEST STARTED =====');
      console.log('🔄 Starting sync with Bland.ai API...');
      console.log('🔄 Timestamp:', new Date().toISOString());
      
      // Get all calls from Bland.ai API
      console.log('📡 Making request to Bland.ai API to get all calls...');
      const blandCalls = await this.blandAiService.getAllCalls();
      console.log(`📞 Found ${blandCalls.length} calls in Bland.ai API`);
      
      if (blandCalls.length > 0) {
        console.log('📋 First call sample:', JSON.stringify(blandCalls[0], null, 2));
      }

      let syncedCount = 0;
      let createdCount = 0;
      let updatedCount = 0;

      console.log('🔄 Starting to process each call...');
      for (const blandCall of blandCalls) {
        try {
          console.log(`🔍 Processing call ID: ${blandCall.call_id}`);
          
          // Check if call exists in local DB
          const existingCall = await this.callsRepository.findOne({
            where: { blandCallId: blandCall.call_id }
          });

          if (existingCall) {
            console.log(`📝 Call ${blandCall.call_id} exists in DB, updating...`);
            // Update existing call
            const updated = await this.updateCallFromBlandData(existingCall, blandCall);
            if (updated) {
              updatedCount++;
              console.log(`✅ Call ${blandCall.call_id} updated successfully`);
            } else {
              console.log(`⚠️ Call ${blandCall.call_id} was not updated (no changes)`);
            }
          } else {
            console.log(`🆕 Call ${blandCall.call_id} not found in DB, creating new...`);
            // Create new call
            await this.createCallFromBlandData(blandCall);
            createdCount++;
            console.log(`✅ Call ${blandCall.call_id} created successfully`);
          }
          syncedCount++;
        } catch (error) {
          console.error(`❌ Error syncing call ${blandCall.call_id}:`, error);
          console.error(`❌ Call data:`, JSON.stringify(blandCall, null, 2));
        }
      }

      console.log(`✅ ===== SYNC COMPLETED =====`);
      console.log(`✅ Total processed: ${syncedCount}`);
      console.log(`✅ Created: ${createdCount}`);
      console.log(`✅ Updated: ${updatedCount}`);
      console.log(`✅ Timestamp: ${new Date().toISOString()}`);
      
      return {
        message: 'Sync completed successfully',
        syncedCount,
        createdCount,
        updatedCount,
      };
    } catch (error) {
      console.error('❌ ===== SYNC FAILED =====');
      console.error('❌ Sync failed with error:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Timestamp:', new Date().toISOString());
      
      throw new HttpException(
        'Failed to sync with Bland.ai',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async updateCallFromBlandData(existingCall: Call, blandCall: any): Promise<boolean> {
    try {
      let hasChanges = false;

      // Map Bland.ai status to our status
      let newStatus = existingCall.status;
      switch (blandCall.status) {
        case 'completed':
          newStatus = CallStatus.COMPLETED;
          break;
        case 'no-answer':
          newStatus = CallStatus.NOT_ANSWERED;
          break;
        case 'in-progress':
          newStatus = CallStatus.IN_PROGRESS;
          break;
      }

      if (newStatus !== existingCall.status) {
        existingCall.status = newStatus;
        hasChanges = true;
      }

      // Update phone number if it's missing or different
      if (blandCall.to && blandCall.to !== existingCall.phoneNumber) {
        existingCall.phoneNumber = blandCall.to;
        hasChanges = true;
      }

      // Update from number if it's missing or different
      if (blandCall.from && blandCall.from !== existingCall.fromNumber) {
        existingCall.fromNumber = blandCall.from;
        hasChanges = true;
      }

      // Update duration if it exists and is different
      const duration = blandCall.call_length || blandCall.duration;
      if (duration && duration !== existingCall.callDuration) {
        existingCall.callDuration = duration;
        hasChanges = true;
      }

      // Update recording URL if it exists and is different
      if (blandCall.recording_url && blandCall.recording_url !== existingCall.recordingUrl) {
        existingCall.recordingUrl = blandCall.recording_url;
        hasChanges = true;
      }

      // Update responses/transcripts if they exist and are different
      const responses = blandCall.transcripts || blandCall.responses;
      if (responses && JSON.stringify(responses) !== existingCall.responsesCollected) {
        existingCall.responsesCollected = JSON.stringify(responses);
        hasChanges = true;
      }

      // Update summary if it exists and is different
      if (blandCall.summary && blandCall.summary !== existingCall.summary) {
        existingCall.summary = blandCall.summary;
        hasChanges = true;
      }

      if (hasChanges) {
        await this.callsRepository.save(existingCall);
        console.log(`📝 Updated call ${existingCall.id} (${existingCall.blandCallId})`);
      }

      return hasChanges;
    } catch (error) {
      console.error(`❌ Error updating call ${existingCall.id}:`, error);
      return false;
    }
  }

  private async createCallFromBlandData(blandCall: any): Promise<void> {
    try {
      // Map Bland.ai status to our status
      let status = CallStatus.IN_PROGRESS;
      switch (blandCall.status) {
        case 'completed':
          status = CallStatus.COMPLETED;
          break;
        case 'no-answer':
          status = CallStatus.NOT_ANSWERED;
          break;
        case 'in-progress':
          status = CallStatus.IN_PROGRESS;
          break;
      }

      const newCall = this.callsRepository.create({
        phoneNumber: blandCall.to || 'Unknown',
        fromNumber: blandCall.from || 'System',
        baseScript: blandCall.script || 'Imported from Bland.ai',
        status: status,
        blandCallId: blandCall.call_id,
        callDuration: blandCall.call_length || blandCall.duration || null,
        recordingUrl: blandCall.recording_url || null,
        responsesCollected: blandCall.transcripts ? JSON.stringify(blandCall.transcripts) : (blandCall.responses ? JSON.stringify(blandCall.responses) : null),
        summary: blandCall.summary || null,
        pathway: blandCall.model || 'base',
        reviewStatus: 'pending',
      });

      await this.callsRepository.save(newCall);
      console.log(`➕ Created new call ${newCall.id} from Bland.ai (${blandCall.call_id})`);
    } catch (error) {
      console.error(`❌ Error creating call from Bland.ai data:`, error);
      throw error;
    }
  }
}
