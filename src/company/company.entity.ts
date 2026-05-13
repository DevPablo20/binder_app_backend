import { Campaign } from 'src/campaign/campaign.entity';
import { User } from 'src/user/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToMany, OneToMany } from 'typeorm'

@Entity()
export class Company {
    @PrimaryGeneratedColumn('uuid', { name: 'id' })
    id: string;

    @Column({ name: 'name', type: 'character varying', unique: true })
    name: string;

    @Column({ name: 'short_id', type: 'character varying', unique: true })
    shortId: string;

    @Column({ name: 'status', type: 'boolean', default: true })
    status: boolean;

    @Column({ name: "description", type: "character varying" })
    description: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
    updatedAt: Date;

    @ManyToMany(() => User, (user) => user.companies)
    users: User[];

    @OneToMany(() => Campaign, (campaign) => campaign.company)
    campaigns: Campaign[];
}