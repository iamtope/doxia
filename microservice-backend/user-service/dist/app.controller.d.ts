import type { Response } from 'express';
import { AppService } from './app.service';
import { GoogleAuthService } from './google-auth.service';
export declare class AppController {
    private readonly appService;
    private readonly googleAuth;
    constructor(appService: AppService, googleAuth: GoogleAuthService);
    getHello(): string;
    signup(signupDto: any): Promise<{
        id: number;
        fullName: string;
        email: string;
        specialty: string;
        clinicName: string;
        googleId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    login(loginDto: any): Promise<{
        access_token: string;
        user: {
            id: number;
            email: string;
            fullName: string;
        };
    }>;
    googleAuthorize(res: Response): void;
    googleCallback(code: string, state: string, oauthError: string, res: Response): Promise<void>;
    saveNote(req: any, data: {
        note: any;
    }): Promise<import("./note.entity").Note[]>;
    updateNote(req: any, id: number, data: {
        note: any;
    }): Promise<import("./note.entity").Note>;
    getMyNotes(req: any): Promise<import("./note.entity").Note[]>;
    getNotes(req: any, userId: string): Promise<import("./note.entity").Note[]>;
    handleSignup(data: any): Promise<{
        id: number;
        fullName: string;
        email: string;
        specialty: string;
        clinicName: string;
        googleId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    handleLogin(data: any): Promise<{
        access_token: string;
        user: {
            id: number;
            email: string;
            fullName: string;
        };
    }>;
}
