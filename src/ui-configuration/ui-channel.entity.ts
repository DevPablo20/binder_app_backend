import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany,
} from 'typeorm';
import { UiPlatform } from './ui-platform.entity';
import { UiBuyingType } from './ui-buying-type.entity';

@Entity()
export class UiChannel {
    @PrimaryGeneratedColumn('uuid', { name: 'id' })
    id: string;

    @Column({ name: 'name', type: 'character varying' })
    name: string;

    @Column({ name: 'description', type: 'character varying', nullable: true })
    description: string | null;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
    updatedAt: Date;

    @ManyToOne(() => UiPlatform, (platform) => platform.channels, { cascade: true })
    @JoinColumn({ name: 'platform_id', referencedColumnName: 'id' })
    platform: UiPlatform;

    @OneToMany(() => UiBuyingType, (buyingType) => buyingType.channel)
    buyingTypes: UiBuyingType[];
}
