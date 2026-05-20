import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Note } from './note.entity';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';
export declare class AppService {
    private userRepository;
    private noteRepository;
    private jwtService;
    private readonly client;
    constructor(userRepository: Repository<User>, noteRepository: Repository<Note>, jwtService: JwtService, client: ClientProxy);
    private normalizeEmail;
    issueAuthResponse(user: User): {
        access_token: string;
        user: {
            id: number;
            email: string;
            fullName: string;
        };
    };
    authenticateGoogleUser(profile: {
        sub: string;
        email: string;
        email_verified?: boolean;
        name?: string;
        given_name?: string;
        family_name?: string;
    }): Promise<{
        access_token: string;
        user: {
            id: number;
            email: string;
            fullName: string;
        };
    }>;
    signup(data: any): Promise<{
        id: number;
        fullName: string;
        email: string;
        specialty: string;
        clinicName: string;
        googleId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    login(data: any): Promise<{
        access_token: string;
        user: {
            id: number;
            email: string;
            fullName: string;
        };
    }>;
    saveNote(userId: number, noteData: any): Promise<Note[]>;
    updateNote(userId: number, noteId: number, noteData: any): Promise<Note>;
    getNotes(userId: number): Promise<Note[]>;
    getHello(): string;
}
