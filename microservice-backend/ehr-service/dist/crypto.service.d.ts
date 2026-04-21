export declare class CryptoService {
    private readonly logger;
    private readonly key;
    constructor();
    encrypt(plaintext: string): string;
    decrypt(payload: string): string;
}
