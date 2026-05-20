"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./user.entity");
const note_entity_1 = require("./note.entity");
const bcrypt = __importStar(require("bcrypt"));
const jwt_1 = require("@nestjs/jwt");
const microservices_1 = require("@nestjs/microservices");
let AppService = class AppService {
    userRepository;
    noteRepository;
    jwtService;
    client;
    constructor(userRepository, noteRepository, jwtService, client) {
        this.userRepository = userRepository;
        this.noteRepository = noteRepository;
        this.jwtService = jwtService;
        this.client = client;
    }
    normalizeEmail(email) {
        return email.trim().toLowerCase();
    }
    issueAuthResponse(user) {
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
    async authenticateGoogleUser(profile) {
        if (profile.email_verified === false) {
            throw new common_1.UnauthorizedException('Google email is not verified');
        }
        const email = this.normalizeEmail(profile.email);
        const fullName = profile.name?.trim() ||
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
    async signup(data) {
        const { email, password, fullName, specialty, clinicName } = data;
        const normalizedEmail = this.normalizeEmail(email);
        const existingUser = await this.userRepository.findOne({
            where: { email: normalizedEmail },
        });
        if (existingUser) {
            throw new common_1.ConflictException('Email already exists');
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
        this.client.emit('user_created', {
            userId: user.id,
            email: user.email,
            fullName: user.fullName,
        });
        const { password: _, ...result } = user;
        return result;
    }
    async login(data) {
        const { email, password } = data;
        const normalizedEmail = this.normalizeEmail(email);
        const user = await this.userRepository.findOne({
            where: { email: normalizedEmail },
            select: ['id', 'email', 'password', 'fullName', 'googleId'],
        });
        if (!user || !user.password) {
            throw new common_1.UnauthorizedException(user?.googleId
                ? 'This account uses Google sign-in. Continue with Google.'
                : 'Invalid credentials');
        }
        if (!(await bcrypt.compare(password, user.password))) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        return this.issueAuthResponse(user);
    }
    async saveNote(userId, noteData) {
        const note = this.noteRepository.create({
            ...noteData,
            userId,
        });
        return this.noteRepository.save(note);
    }
    async updateNote(userId, noteId, noteData) {
        const note = await this.noteRepository.findOne({
            where: { id: noteId, userId },
        });
        if (!note) {
            throw new common_1.NotFoundException('Note not found');
        }
        Object.assign(note, noteData);
        return this.noteRepository.save(note);
    }
    async getNotes(userId) {
        return this.noteRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }
    getHello() {
        return 'User Service is running';
    }
};
exports.AppService = AppService;
exports.AppService = AppService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(note_entity_1.Note)),
    __param(3, (0, common_1.Inject)('RABBIT_SERVICE')),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService,
        microservices_1.ClientProxy])
], AppService);
//# sourceMappingURL=app.service.js.map