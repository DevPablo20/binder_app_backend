import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, Unique, DeleteDateColumn, ManyToMany, JoinTable } from 'typeorm'

export enum PlatformType {
    SOCIALMEDIA = 'social_media',
    SEARCH = 'search',
    DIRECT_MESSAGING = 'direct_messaging',
    STREAMING = 'streaming',
    MARKETPLACE = 'marketplace',
    OFFLINE = 'offline',
    PROGRAMATIC = 'programatic',
    PARTNERSHIPS = 'partnerships',
    CRM = 'crm',
    REFERRAL = 'referral',
    OTHER = 'other'
}

@Entity()
export class Platform {
    @PrimaryGeneratedColumn('uuid', { name: 'id' })
    id: string;

    @Column({ name: 'name', type: 'character varying' })
    name: string;

    @Column({ name: 'platform_type', type: 'enum', enum: PlatformType })
    platformType: PlatformType;

    @Column({ name: "description", type: "character varying" })
    description: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
    updatedAt: Date;
}