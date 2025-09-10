import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CallsController } from './calls.controller';
import { CallsService } from './calls.service';
import { Call } from './entities/call.entity';
import { BlandAiService } from './bland-ai.service';
import { PdfService } from './pdf.service';
import { EmailService } from './email.service';

@Module({
  imports: [TypeOrmModule.forFeature([Call])],
  controllers: [CallsController],
  providers: [CallsService, BlandAiService, PdfService, EmailService],
  exports: [CallsService],
})
export class CallsModule {}




