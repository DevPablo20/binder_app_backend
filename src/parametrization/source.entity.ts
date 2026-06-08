// import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
// import { SourceType } from 'src/common/source-type.enum';
// import { Medium } from './medium.entity';

// @Entity()
// export class Source {
//     @PrimaryGeneratedColumn('uuid', { name: 'id' })
//     id: string;

//     @Column({ name: 'display_name', type: 'character varying' })
//     displayName: string;

//     @Column({ name: 'utm_source', type: 'character varying', unique: true })
//     utmSource: string;

//     @Column({ name: 'source_type', type: 'enum', enum: SourceType })
//     sourceType: SourceType;

//     @Column({ name: 'description', type: 'character varying' })
//     description: string;

//     @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
//     createdAt: Date;

//     @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
//     updatedAt: Date;

//     @OneToMany(() => Medium, (medium) => medium.source)
//     mediums: Medium[];
// }
