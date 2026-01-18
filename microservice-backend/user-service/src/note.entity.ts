import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity('notes')
export class Note {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'text' })
    rawTranscript: string;

    @Column({ type: 'jsonb' })
    structuredNote: any;

    @Column()
    template: string;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => User, (user) => user.id)
    user: User;

    @Column()
    userId: number;
}

