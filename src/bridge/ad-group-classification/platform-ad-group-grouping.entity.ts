import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Grouping } from 'src/business/grouping/grouping.entity';
import { SubGrouping } from 'src/business/grouping/sub-grouping.entity';
import { PlatformAdGroupClassification } from './platform-ad-group-classification.entity';

/**
 * A atribuição de eixo.
 *
 * A PK `(classificação, eixo)` é o que garante **um valor por eixo** — não substituir por
 * `@ManyToMany`, que não consegue exprimir essa regra.
 */
@Entity({ name: 'platform_ad_group_grouping' })
export class PlatformAdGroupGrouping {
  @PrimaryColumn({ name: 'ad_group_classification_id', type: 'uuid' })
  adGroupClassificationId: string;

  @PrimaryColumn({ name: 'grouping_id', type: 'uuid' })
  groupingId: string;

  @Column({ name: 'campaign_id', type: 'uuid' })
  campaignId: string;

  @Column({ name: 'sub_grouping_id', type: 'uuid' })
  subGroupingId: string;

  // a cópia de campanha não pode divergir da classificação
  @ManyToOne(
    () => PlatformAdGroupClassification,
    (classification) => classification.groupings,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn([
    { name: 'ad_group_classification_id', referencedColumnName: 'id' },
    { name: 'campaign_id', referencedColumnName: 'campaignId' },
  ])
  adGroupClassification: PlatformAdGroupClassification;

  // regra 5 — o eixo é da campanha de negócio do binding
  @ManyToOne(() => Grouping, { onDelete: 'CASCADE' })
  @JoinColumn([
    { name: 'campaign_id', referencedColumnName: 'campaignId' },
    { name: 'grouping_id', referencedColumnName: 'id' },
  ])
  grouping: Grouping;

  // regra 4 — o valor pertence ao eixo declarado
  @ManyToOne(() => SubGrouping, { onDelete: 'CASCADE' })
  @JoinColumn([
    { name: 'grouping_id', referencedColumnName: 'groupingId' },
    { name: 'sub_grouping_id', referencedColumnName: 'id' },
  ])
  subGrouping: SubGrouping;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}
