import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Client } from 'src/business/client/client.entity';
import { Platform } from 'src/media/platform/platform.entity';
import { PlatformObjectMap } from 'src/bridge/platform-object-map/platform-object-map.entity';
import { PlatformCampaignBinding } from 'src/bridge/campaign-binding/platform-campaign-binding.entity';
import { PlatformAdClassification } from 'src/bridge/ad-classification/platform-ad-classification.entity';

@Entity({ name: 'platform_account' })
@Unique(['platformId', 'externalAccountId'])
@Unique(['id', 'clientId', 'platformId']) // ancora o binding
@Unique(['id', 'platformId']) // ancora a classificacao de ad
export class PlatformAccount {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({
    name: 'external_account_id',
    type: 'character varying',
    length: 255,
  })
  externalAccountId: string;

  @Column({ name: 'name', type: 'character varying', length: 255 })
  name: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId: string;

  @Column({ name: 'platform_id', type: 'uuid' })
  platformId: string;

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id', referencedColumnName: 'id' })
  client: Client;

  @ManyToOne(() => Platform, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'platform_id', referencedColumnName: 'id' })
  platform: Platform;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  @OneToMany(() => PlatformObjectMap, (map) => map.platformAccount)
  objectMaps: PlatformObjectMap[];

  @OneToMany(
    () => PlatformCampaignBinding,
    (binding) => binding.platformAccount,
  )
  campaignBindings: PlatformCampaignBinding[];

  @OneToMany(
    () => PlatformAdClassification,
    (classification) => classification.platformAccount,
  )
  adClassifications: PlatformAdClassification[];
}
