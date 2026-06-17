import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
  Unique,
} from 'typeorm';
import { PlatformObjectType } from 'src/common/platform-object-type.enum';
import { PlatformAccount } from './platform-account.entity';
import { Campaign } from 'src/campaign/campaign.entity';
import { Channel } from 'src/platform/channel.entity';
import { BuyingType } from 'src/platform/buying-type.entity';
import { Format } from 'src/format/format.entity';
import { SubFormat } from 'src/format/sub-format.entity';
import { SubGrouping } from 'src/grouping/sub-grouping.entity';

@Entity({ name: 'platform_object_map' })
@Unique(['platformAccount', 'objectType', 'externalId'])
export class PlatformObjectMap {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'object_type', type: 'enum', enum: PlatformObjectType })
  objectType: PlatformObjectType;

  @Column({ name: 'external_id', type: 'character varying', length: 255 })
  externalId: string;

  @Column({
    name: 'external_name',
    type: 'character varying',
    length: 255,
    nullable: true,
  })
  externalName?: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @ManyToOne(() => PlatformAccount, (account) => account.objectMaps, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'platform_account_id', referencedColumnName: 'id' })
  platformAccount: PlatformAccount;

  @ManyToOne(() => Campaign, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_id', referencedColumnName: 'id' })
  campaign: Campaign;

  @ManyToOne(() => Channel, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'channel_id', referencedColumnName: 'id' })
  channel?: Channel | null;

  @ManyToOne(() => BuyingType, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'buying_type_id', referencedColumnName: 'id' })
  buyingType?: BuyingType | null;

  @ManyToOne(() => Format, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'format_id', referencedColumnName: 'id' })
  format?: Format | null;

  @ManyToOne(() => SubFormat, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'sub_format_id', referencedColumnName: 'id' })
  subFormat?: SubFormat | null;

  @ManyToMany(() => SubGrouping)
  @JoinTable({
    name: 'platform_object_map_sub_grouping',
    joinColumn: {
      name: 'platform_object_map_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: { name: 'sub_grouping_id', referencedColumnName: 'id' },
  })
  subGroupings: SubGrouping[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}
