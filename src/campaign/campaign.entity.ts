import { Company } from 'src/company/company.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm'

@Entity()
export class Campaign {
    @PrimaryGeneratedColumn('uuid', { name: 'id' })
    id: string;

    @Column({ name: 'display_name', type: 'character varying' })
    displayName: string;

    @Column({ name: 'utm_campaign', type: 'character varying' })
    utmCampaign: string;

    @Column({ name: 'utm_id', type: 'character varying', unique: true })
    utmId: string;

    @Column({ name: 'status', type: 'boolean', default: true })
    status: boolean;

    @Column({ name: "description", type: "character varying" })
    description: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
    updatedAt: Date;

    @ManyToOne(() => Company, company => company.campaigns, { eager: true })
    @JoinColumn({ name: "company_id", referencedColumnName: "id" })
    company: Company
}