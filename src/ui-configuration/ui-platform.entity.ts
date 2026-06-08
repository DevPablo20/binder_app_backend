// import {
//     Entity,
//     Column,
//     PrimaryGeneratedColumn,
//     CreateDateColumn,
//     UpdateDateColumn,
//     OneToMany,
// } from 'typeorm';
// import { SourceType } from 'src/common/source-type.enum';
// import { UiChannel } from './ui-channel.entity';

// @Entity()
// export class UiPlatform {
//     @PrimaryGeneratedColumn('uuid', { name: 'id' })
//     id: string;

//     @Column({ name: 'display_name', type: 'character varying' })
//     displayName: string;

//     @Column({ name: 'description', type: 'character varying', nullable: true })
//     description: string | null;

//     @Column({ name: 'source_type', type: 'enum', enum: SourceType})
//     sourceType: SourceType;

//     @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
//     createdAt: Date;

//     @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
//     updatedAt: Date;

//     @OneToMany(() => UiChannel, (channel) => channel.platform)
//     channels: UiChannel[];
// }
