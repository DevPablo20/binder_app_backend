import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Format } from 'src/media/format/format.entity';
import { SubFormat } from 'src/media/format/sub-format.entity';
import { PlatformAccount } from 'src/bridge/platform-account/platform-account.entity';

/**
 * Nível ad — só formato, e só como exceção à tradução de `platform_format_mapping`.
 *
 * `format_id` e `sub_format_id` são `NOT NULL`: uma exceção nomeia os dois. Com um deles nulo
 * a FK composta usaria `MATCH SIMPLE` e a regra 4 ficaria silenciosamente desligada na linha.
 */
@Entity({ name: 'platform_ad_classification' })
@Unique(['platformAccountId', 'externalAdId'])
@Unique(['platformId', 'externalAdId']) // chave do join de enriquecimento
export class PlatformAdClassification {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'platform_account_id', type: 'uuid' })
  platformAccountId: string;

  @Column({ name: 'external_ad_id', type: 'character varying', length: 255 })
  externalAdId: string;

  @Column({ name: 'platform_id', type: 'uuid' })
  platformId: string;

  @Column({ name: 'format_id', type: 'uuid' })
  formatId: string;

  @Column({ name: 'sub_format_id', type: 'uuid' })
  subFormatId: string;

  @ManyToOne(() => PlatformAccount, (account) => account.adClassifications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([
    { name: 'platform_account_id', referencedColumnName: 'id' },
    { name: 'platform_id', referencedColumnName: 'platformId' },
  ])
  platformAccount: PlatformAccount;

  @ManyToOne(() => Format, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'format_id', referencedColumnName: 'id' })
  format: Format;

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
