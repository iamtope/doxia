import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
} from 'crypto';

/**
 * AES-256-GCM encryption for tokens at rest.
 *
 * Format of persisted string: base64(iv) . base64(authTag) . base64(ciphertext)
 * where "." is a literal dot separator.
 */
@Injectable()
export class CryptoService {
  private readonly logger = new Logger(CryptoService.name);
  private readonly key: Buffer;

  constructor() {
    const raw = process.env.TOKEN_ENCRYPTION_KEY;
    if (!raw) {
      this.logger.warn(
        'TOKEN_ENCRYPTION_KEY is not set. Deriving an ephemeral key from JWT_SECRET; tokens will not be readable after restart!',
      );
      this.key = createHash('sha256')
        .update(process.env.JWT_SECRET || 'doxxia-dev-fallback')
        .digest();
    } else if (/^[0-9a-fA-F]{64}$/.test(raw)) {
      this.key = Buffer.from(raw, 'hex');
    } else {
      this.key = createHash('sha256').update(raw).digest();
    }
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('base64')}.${authTag.toString('base64')}.${ciphertext.toString('base64')}`;
  }

  decrypt(payload: string): string {
    try {
      const [ivB64, tagB64, dataB64] = payload.split('.');
      if (!ivB64 || !tagB64 || !dataB64) {
        throw new Error('Invalid ciphertext format');
      }
      const decipher = createDecipheriv(
        'aes-256-gcm',
        this.key,
        Buffer.from(ivB64, 'base64'),
      );
      decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
      const plaintext = Buffer.concat([
        decipher.update(Buffer.from(dataB64, 'base64')),
        decipher.final(),
      ]);
      return plaintext.toString('utf8');
    } catch (err: any) {
      this.logger.error('Failed to decrypt token', err.message);
      throw new InternalServerErrorException('Stored token could not be decrypted');
    }
  }
}
