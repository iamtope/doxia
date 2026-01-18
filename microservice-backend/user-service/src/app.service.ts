import { Injectable, ConflictException, UnauthorizedException, Inject } from '@nestjs/common';
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

  async signup(data: any) {
    const { email, password, fullName, specialty, clinicName } = data;

    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      email,
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

    const user = await this.userRepository.findOne({ 
      where: { email },
      select: ['id', 'email', 'password', 'fullName'] 
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

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

  async saveNote(userId: number, noteData: any) {
    const note = this.noteRepository.create({
      ...noteData,
      userId,
    });
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
