import { Injectable, ConflictException, UnauthorizedException, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Note } from './note.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Note)
    private noteRepository: Repository<Note>,
    private jwtService: JwtService,
    @Inject('RABBIT_SERVICE') private readonly client: ClientProxy,
  ) {}

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  issueAuthResponse(user: User) {
    const payload = { sub: user.id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
    };
  }

  async authenticateGoogleUser(profile: {
    sub: string;
    email: string;
    email_verified?: boolean;
    name?: string;
    given_name?: string;
    family_name?: string;
  }) {
    if (profile.email_verified === false) {
      throw new UnauthorizedException('Google email is not verified');
    }

    const email = this.normalizeEmail(profile.email);
    const fullName =
      profile.name?.trim() ||
      [profile.given_name, profile.family_name].filter(Boolean).join(' ').trim() ||
      email.split('@')[0];

    let user = await this.userRepository.findOne({
      where: { googleId: profile.sub },
    });

    if (!user) {
      user = await this.userRepository.findOne({ where: { email } });
      if (user) {
        user.googleId = profile.sub;
        await this.userRepository.save(user);
      }
    }

    if (!user) {
      const newUser = this.userRepository.create({
        email,
        googleId: profile.sub,
        fullName,
      });
      user = await this.userRepository.save(newUser);

      this.client.emit('user_created', {
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
      });
    }

    return this.issueAuthResponse(user);
  }

  async signup(data: any) {
    const { email, password, fullName, specialty, clinicName } = data;
    const normalizedEmail = this.normalizeEmail(email);

    const existingUser = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      email: normalizedEmail,
      password: hashedPassword,
      fullName,
      specialty,
      clinicName,
    });

    await this.userRepository.save(user);

    // Emit event for other services (e.g., Scribe Service)
    this.client.emit('user_created', {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
    });

    // Remove password from response
    const { password: _, ...result } = user;
    return result;
  }

  async login(data: any) {
    const { email, password } = data;
    const normalizedEmail = this.normalizeEmail(email);

    const user = await this.userRepository.findOne({
      where: { email: normalizedEmail },
      select: ['id', 'email', 'password', 'fullName', 'googleId'],
    });

    if (!user || !user.password) {
      throw new UnauthorizedException(
        user?.googleId
          ? 'This account uses Google sign-in. Continue with Google.'
          : 'Invalid credentials',
      );
    }

    if (!(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueAuthResponse(user);
  }

  async saveNote(userId: number, noteData: any) {
    const note = this.noteRepository.create({
      ...noteData,
      userId,
    });
    return this.noteRepository.save(note);
  }

  async updateNote(userId: number, noteId: number, noteData: any) {
    const note = await this.noteRepository.findOne({
      where: { id: noteId, userId },
    });
    if (!note) {
      throw new NotFoundException('Note not found');
    }
    Object.assign(note, noteData);
    return this.noteRepository.save(note);
  }

  async getNotes(userId: number) {
    return this.noteRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  getHello(): string {
    return 'User Service is running';
  }
}
