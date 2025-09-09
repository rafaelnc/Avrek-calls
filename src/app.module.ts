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
      database: process.env.DATABASE_URL || 'avrek-calls.db',
      entities: [Call],
      synchronize: true, // Enable for now to create tables
      logging: process.env.NODE_ENV !== 'production', // Log SQL queries in development
    }),
    AuthModule,
    CallsModule,
  ],
})
export class AppModule {}

