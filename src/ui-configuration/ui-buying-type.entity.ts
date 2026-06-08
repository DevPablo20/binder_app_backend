// import {
//     Entity,
//     Column,
//     PrimaryGeneratedColumn,
//     CreateDateColumn,
//     UpdateDateColumn,
//     ManyToOne,
//     JoinColumn,
// } from 'typeorm';
// import { UiChannel } from './ui-channel.entity';

// @Entity()
// export class UiBuyingType {
//     @PrimaryGeneratedColumn('uuid', { name: 'id' })
//     id: string;

//     @Column({ name: 'display_name', type: 'character varying' })
//     displayName: string;

//     @Column({ name: 'description', type: 'character varying', nullable: true })
//     description: string | null;

//     @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
//     createdAt: Date;

//     @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
//     updatedAt: Date;

//     @ManyToOne(() => UiChannel, (channel) => channel.buyingTypes, { cascade: true })
//     @JoinColumn({ name: 'channel_id', referencedColumnName: 'id' })
//     channel: UiChannel;
// }
