import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Platform } from 'src/media/platform/platform.entity';
import { SubFormat } from 'src/media/format/sub-format.entity';

/**
 * Tradução de valor nativo da plataforma para o vocabulário do Binder.
 *
 * Poucas traduções por plataforma em vez de N classificações por ad — escala com plataformas,
 * não com volume de criativos. A PK composta é a própria unicidade que a tradução exige.
 */
@Entity({ name: 'platform_format_mapping' })
export class PlatformFormatMapping {
  @PrimaryColumn({ name: 'platform_id', type: 'uuid' })
  platformId: string;

  @PrimaryColumn({
    name: 'native_value',
    type: 'character varying',
    length: 255,
  })
  nativeValue: string;

  @Column({ name: 'format_id', type: 'uuid' })
  formatId: string;

  @Column({ name: 'sub_format_id', type: 'uuid' })
  subFormatId: string;

  @ManyToOne(() => Platform, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'platform_id', referencedColumnName: 'id' })
  platform: Platform;

  // regra 4 — o sub-formato pertence ao formato
  @ManyToOne(() => SubFormat, { onDelete: 'NO ACTION' })
  @JoinColumn([
    { name: 'format_id', referencedColumnName: 'formatId' },
    { name: 'sub_format_id', referencedColumnName: 'id' },
  ])
  subFormat: SubFormat;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}
