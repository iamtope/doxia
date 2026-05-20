import { User } from './user.entity';
export declare class Note {
    id: number;
    rawTranscript: string;
    structuredNote: any;
    template: string;
    createdAt: Date;
    user: User;
    userId: number;
}
