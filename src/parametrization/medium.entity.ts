// import {
//     Entity,
//     Column,
//     PrimaryGeneratedColumn,
//     CreateDateColumn,
//     UpdateDateColumn,
//     ManyToOne,
//     JoinColumn,
// } from 'typeorm';
// import { Source } from './source.entity';
// import { UiBuyingType } from 'src/ui-configuration/ui-buying-type.entity';

// @Entity()
// export class Medium {
//     @PrimaryGeneratedColumn('uuid', { name: 'id' })
//     id: string;

//     @Column({ name: 'display_name', type: 'character varying' })
//     displayName: string;

//     @Column({ name: 'utm_medium', type: 'character varying' })
//     utmMedium: string;

//     @Column({ name: 'description', type: 'character varying', nullable: true })
//     description: string | null;

//     @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
//     createdAt: Date;

//     @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
//     updatedAt: Date;

//     @ManyToOne(() => Source, (source) => source.mediums, { nullable: false })
//     @JoinColumn({ name: 'source_id', referencedColumnName: 'id' })
//     source: Source;

//     @ManyToOne(() => UiBuyingType, { nullable: true, onDelete: 'SET NULL' })
//     @JoinColumn({ name: 'ui_buying_type_id', referencedColumnName: 'id' })
//     uiBuyingType: UiBuyingType | null;
// }
