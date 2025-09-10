import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum CallStatus {
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  NOT_ANSWERED = 'Not Answered',
}

@Entity('calls')
export class Call {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  phoneNumber: string;

  @Column({ nullable: true })
  fromNumber: string;

  @Column('text')
  baseScript: string;

  @Column({
    type: 'varchar',
    default: CallStatus.IN_PROGRESS,
  })
  status: CallStatus;

  @Column('text', { nullable: true })
  responsesCollected: string;

  @Column({ nullable: true })
  blandCallId: string;

  @Column({ nullable: true })
  callDuration: number;

  @Column({ nullable: true })
  recordingUrl: string;

  @Column('text', { nullable: true })
  issues: string;

  @Column({ nullable: true })
  pathway: string;

  @Column('text', { nullable: true })
  tags: string;

  @Column({ nullable: true })
  batchId: string;

  @Column({ nullable: true })
  transferredTo: string;

  @Column({ nullable: true })
  reviewStatus: string;

  @Column('text', { nullable: true })
  summary: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
