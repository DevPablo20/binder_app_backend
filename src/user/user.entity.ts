import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToMany,
    JoinTable,
} from 'typeorm';
import { Role } from 'src/common/role.enum';
import { Company } from 'src/company/company.entity';

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid', { name: 'id' })
    id: string;

    @Column({ name: 'name', type: 'character varying', length: 255 })
    name: string;

    @Column({ name: 'email', type: 'character varying', length: 255, unique: true })
    email: string;

    @Column({ name: 'password', type: 'character varying', length: 255, select: false })
    password: string;

    @Column({ name: 'role', type: 'enum', enum: Role })
    role: Role;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;

    @Column({ name: 'password_reset_token', type: 'character varying', length: 255, nullable: true })
    passwordResetToken?: string | null;

    @Column({ name: 'password_reset_expires', type: 'timestamp with time zone', nullable: true })
    passwordResetExpires?: Date | null;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
    updatedAt: Date;

    @ManyToMany(() => Company, (company) => company.users)
    @JoinTable({
        name: 'user_company',
        joinColumn: { name: 'user_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'company_id', referencedColumnName: 'id' },
    })
    companies: Company[];
}