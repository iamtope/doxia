import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import type { EhrProvider } from '../providers/provider-registry';

/**
 * Short-lived record holding the PKCE verifier + redirect context between the
 * /authorize redirect and the /callback round-trip.
 */
@Entity('ehr_oauth_states')
export class OAuthState {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: 'text' })
  state: string;

  @Column({ type: 'varchar', length: 32 })
  provider: EhrProvider;

  @Column({ type: 'text' })
  codeVerifier: string;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'text' })
  fhirBaseUrl: string;

  @Column({ type: 'text' })
  authorizeUrl: string;

  @Column({ type: 'text' })
  tokenUrl: string;

  @Column({ type: 'text', nullable: true })
  launch: string | null;

  @Column({ type: 'text' })
  redirectUri: string;

  @Column({ type: 'text' })
  scope: string;

  @CreateDateColumn()
  createdAt: Date;
}
