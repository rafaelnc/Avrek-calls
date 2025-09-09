import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

export interface StartCallData {
  phone_number: string;
  voice?: string;
  wait_for_greeting?: boolean;
  record?: boolean;
  answered_by_enabled?: boolean;
  noise_cancellation?: boolean;
  interruption_threshold?: number;
  block_interruptions?: boolean;
  max_duration?: number;
  model?: string;
  language?: string;
  background_track?: string;
  endpoint?: string;
  voicemail_action?: string;
  task: string;
  callId: string;
  webhook?: string;
}

@Injectable()
export class BlandAiService {
  private readonly apiKey = process.env.BLAND_AI_API_KEY || 'your-bland-ai-api-key';
  private readonly baseUrl = 'https://api.bland.ai/v1';

  constructor() {
    console.log('🔧 BlandAiService initialized:');
    console.log('🔑 API Key from env:', this.apiKey ? `${this.apiKey.substring(0, 8)}...` : 'NOT SET');
    console.log('🌐 Base URL:', this.baseUrl);
  }

  async startCall(callData: StartCallData): Promise<{ callId: string }> {
    const requestData = {
      phone_number: callData.phone_number,
      voice: callData.voice || 'June',
      wait_for_greeting: callData.wait_for_greeting ?? false,
      record: callData.record ?? true,
      answered_by_enabled: callData.answered_by_enabled ?? true,
      noise_cancellation: callData.noise_cancellation ?? false,
      interruption_threshold: callData.interruption_threshold || 100,
      block_interruptions: callData.block_interruptions ?? false,
      max_duration: callData.max_duration || 12,
      model: callData.model || 'base',
      language: callData.language || 'en',
      background_track: callData.background_track || 'none',
      endpoint: callData.endpoint || 'https://api.bland.ai',
      voicemail_action: callData.voicemail_action || 'hangup',
      task: callData.task,
      webhook_url: callData.webhook || `${process.env.BASE_URL || 'http://localhost:3001'}/calls/webhook`,
    };

    const requestHeaders = {
      'Authorization': this.apiKey,
      'Content-Type': 'application/json',
    };

    console.log('🚀 Bland.ai API Request - Start Call:');
    console.log('📍 URL:', `${this.baseUrl}/calls`);
    console.log('🔑 API Key:', this.apiKey ? `${this.apiKey.substring(0, 8)}...` : 'NOT SET');
    console.log('📋 Request Data:', JSON.stringify(requestData, null, 2));
    console.log('📋 Request Headers:', JSON.stringify(requestHeaders, null, 2));

    try {
      const response = await axios.post(
        `${this.baseUrl}/calls`,
        requestData,
        {
          headers: requestHeaders,
        },
      );

      console.log('✅ Bland.ai API Response - Start Call:');
      console.log('📊 Status:', response.status);
      console.log('📋 Response Data:', JSON.stringify(response.data, null, 2));

      return { callId: response.data.call_id };
    } catch (error) {
      console.error('❌ Bland.ai API Error - Start Call:');
      console.error('📊 Status:', error.response?.status);
      console.error('📋 Error Data:', JSON.stringify(error.response?.data, null, 2));
      console.error('📋 Error Message:', error.message);
      console.error('📋 Full Error:', error);

      throw new HttpException(
        'Failed to start call with Bland.ai',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getCallStatus(callId: string): Promise<any> {
    const requestHeaders = {
      'Authorization': this.apiKey,
    };

    console.log('🔍 Bland.ai API Request - Get Call Status:');
    console.log('📍 URL:', `${this.baseUrl}/calls/${callId}`);
    console.log('🔑 API Key:', this.apiKey ? `${this.apiKey.substring(0, 8)}...` : 'NOT SET');
    console.log('📋 Request Headers:', JSON.stringify(requestHeaders, null, 2));

    try {
      const response = await axios.get(`${this.baseUrl}/calls/${callId}`, {
        headers: requestHeaders,
      });

      console.log('✅ Bland.ai API Response - Get Call Status:');
      console.log('📊 Status:', response.status);
      console.log('📋 Response Data:', JSON.stringify(response.data, null, 2));

      return response.data;
    } catch (error) {
      console.error('❌ Bland.ai API Error - Get Call Status:');
      console.error('📊 Status:', error.response?.status);
      console.error('📋 Error Data:', JSON.stringify(error.response?.data, null, 2));
      console.error('📋 Error Message:', error.message);
      console.error('📋 Full Error:', error);

      throw new HttpException(
        'Failed to fetch call status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getAllCalls(): Promise<any[]> {
    const requestHeaders = {
      'Authorization': this.apiKey,
    };

    console.log('📋 Bland.ai API Request - Get All Calls:');
    console.log('📍 URL:', `${this.baseUrl}/calls`);
    console.log('🔑 API Key:', this.apiKey ? `${this.apiKey.substring(0, 8)}...` : 'NOT SET');
    console.log('📋 Request Headers:', JSON.stringify(requestHeaders, null, 2));

    try {
      const response = await axios.get(`${this.baseUrl}/calls`, {
        headers: requestHeaders,
      });

      console.log('✅ Bland.ai API Response - Get All Calls:');
      console.log('📊 Status:', response.status);
      console.log('📋 Response Data:', JSON.stringify(response.data, null, 2));

      return response.data.calls || [];
    } catch (error) {
      console.error('❌ Bland.ai API Error - Get All Calls:');
      console.error('📊 Status:', error.response?.status);
      console.error('📋 Error Data:', JSON.stringify(error.response?.data, null, 2));
      console.error('📋 Error Message:', error.message);
      console.error('📋 Full Error:', error);

      throw new HttpException(
        'Failed to fetch calls from Bland.ai',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
