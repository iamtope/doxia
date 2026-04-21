import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import type { EhrProvider } from '../providers/provider-registry';

@Entity('ehr_connections')
@Index('IDX_ehr_connection_user_provider', ['userId', 'provider'], {
  unique: true,
})
export class EhrConnection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  userId: number;

  /** Which EHR this row belongs to — drives scope/URL selection per request. */
  @Column({ type: 'varchar', length: 32 })
  provider: EhrProvider;

  @Column({ type: 'text' })
  fhirBaseUrl: string;

  @Column({ type: 'text', nullable: true })
  authorizeUrl: string | null;

  @Column({ type: 'text', nullable: true })
  tokenUrl: string | null;

  @Column({ type: 'text', nullable: true })
  patientId: string | null;

  @Column({ type: 'text', nullable: true })
  encounterId: string | null;

  @Column({ type: 'text', nullable: true })
  fhirUser: string | null;

  @Column({ type: 'text' })
  accessTokenEncrypted: string;

  @Column({ type: 'text', nullable: true })
  refreshTokenEncrypted: string | null;

  @Column({ type: 'text', nullable: true })
  scope: string | null;

  @Column({ type: 'text', nullable: true })
  tokenType: string | null;

  @Column({ type: 'timestamptz' })
  accessTokenExpiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
