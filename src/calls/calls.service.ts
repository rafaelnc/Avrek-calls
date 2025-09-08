import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Call, CallStatus } from './entities/call.entity';
import { CreateCallDto } from './dto/create-call.dto';
import { BlandAiService } from './bland-ai.service';
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
      
      // Combine local call data with Bland.ai details
      const result = {
        localCall: call,
        blandDetails: blandDetails,
        // Parse responses if available
        responses: call.responsesCollected ? JSON.parse(call.responsesCollected) : [],
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
  ): Promise<void> {
    const call = await this.callsRepository.findOne({
      where: { blandCallId },
    });

    if (call) {
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
      await this.callsRepository.save(call);

      // If call is completed, generate and send PDF
      if (status === CallStatus.COMPLETED) {
        await this.generateAndSendPdf(call.id);
      }
    }
  }

  async generateAndSendPdf(callId: number): Promise<void> {
    const call = await this.findOne(callId);
    const pdfBuffer = await this.pdfService.generateCallReport(call);
    
    // Send email with PDF attachment
    await this.emailService.sendCallReport(call, pdfBuffer);
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
      console.log('🔄 Starting sync with Bland.ai API...');
      
      // Get all calls from Bland.ai API
      const blandCalls = await this.blandAiService.getAllCalls();
      console.log(`📞 Found ${blandCalls.length} calls in Bland.ai API`);

      let syncedCount = 0;
      let createdCount = 0;
      let updatedCount = 0;

      for (const blandCall of blandCalls) {
        try {
          // Check if call exists in local DB
          const existingCall = await this.callsRepository.findOne({
            where: { blandCallId: blandCall.call_id }
          });

          if (existingCall) {
            // Update existing call
            const updated = await this.updateCallFromBlandData(existingCall, blandCall);
            if (updated) {
              updatedCount++;
            }
          } else {
            // Create new call
            await this.createCallFromBlandData(blandCall);
            createdCount++;
          }
          syncedCount++;
        } catch (error) {
          console.error(`❌ Error syncing call ${blandCall.call_id}:`, error);
        }
      }

      console.log(`✅ Sync completed: ${syncedCount} synced, ${createdCount} created, ${updatedCount} updated`);
      
      return {
        message: 'Sync completed successfully',
        syncedCount,
        createdCount,
        updatedCount,
      };
    } catch (error) {
      console.error('❌ Sync failed:', error);
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

      // Update other fields if they exist
      if (blandCall.duration && blandCall.duration !== existingCall.callDuration) {
        existingCall.callDuration = blandCall.duration;
        hasChanges = true;
      }

      if (blandCall.recording_url && blandCall.recording_url !== existingCall.recordingUrl) {
        existingCall.recordingUrl = blandCall.recording_url;
        hasChanges = true;
      }

      if (blandCall.responses && JSON.stringify(blandCall.responses) !== existingCall.responsesCollected) {
        existingCall.responsesCollected = JSON.stringify(blandCall.responses);
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
        phoneNumber: blandCall.to_number || 'Unknown',
        fromNumber: blandCall.from_number || 'System',
        baseScript: blandCall.script || 'Imported from Bland.ai',
        status: status,
        blandCallId: blandCall.call_id,
        callDuration: blandCall.duration || null,
        recordingUrl: blandCall.recording_url || null,
        responsesCollected: blandCall.responses ? JSON.stringify(blandCall.responses) : null,
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
