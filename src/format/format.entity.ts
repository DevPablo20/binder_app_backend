import {
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Entity,
} from 'typeorm';
import { Platform } from 'src/platform/platform.entity';

@Entity()
export class Format {
    @PrimaryGeneratedColumn('uuid', { name: 'id' })
    id: string;

    @Column({ name: 'display_name', type: 'character varying' })
    displayName: string;

    @Column({ name: 'utm_medium', type: 'character varying' })
    utmMedium: string;

    @Column({ name: 'description', type: 'character varying', nullable: true })
    description: string | null;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
    updatedAt: Date;

    @ManyToOne(() => Platform, platform => platform.id, { nullable: false })
    @JoinColumn({ name: 'platform_id', referencedColumnName: 'id' })
    platform: Platform;
}