import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { CallsModule } from './calls/calls.module';
import { Call } from './calls/entities/call.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'avrek-calls.db',
      entities: [Call],
      synchronize: true, // Only for development
    }),
    AuthModule,
    CallsModule,
  ],
})
export class AppModule {}

