import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, IsIn } from 'class-validator';

export class CreateCallDto {
  @IsString()
  @IsNotEmpty()
  phone_number: string;

  @IsString()
  @IsOptional()
  voice?: string;

  @IsBoolean()
  @IsOptional()
  wait_for_greeting?: boolean;

  @IsBoolean()
  @IsOptional()
  record?: boolean;

  @IsBoolean()
  @IsOptional()
  answered_by_enabled?: boolean;

  @IsBoolean()
  @IsOptional()
  noise_cancellation?: boolean;

  @IsNumber()
  @IsOptional()
  interruption_threshold?: number;

  @IsBoolean()
  @IsOptional()
  block_interruptions?: boolean;

  @IsNumber()
  @IsOptional()
  max_duration?: number;

  @IsString()
  @IsOptional()
  model?: string;

  @IsString()
  @IsOptional()
  language?: string;

  @IsString()
  @IsOptional()
  background_track?: string;

  @IsString()
  @IsOptional()
  endpoint?: string;

  @IsString()
  @IsOptional()
  voicemail_action?: string;

  @IsString()
  @IsNotEmpty()
  task: string;

  // Legacy fields for backward compatibility
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  fromNumber?: string;

  @IsString()
  @IsOptional()
  baseScript?: string;
}
