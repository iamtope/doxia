import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    fullName: string;

    @Column({ unique: true })
    email: string;

    @Column({ nullable: true })
    specialty: string;

    @Column({ nullable: true })
    clinicName: string;

    @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
    googleId: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true, select: false })
    password: string | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
