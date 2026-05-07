import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, Unique, DeleteDateColumn, ManyToMany, JoinTable } from 'typeorm'

@Entity()
export class Campaign {
    @PrimaryGeneratedColumn('uuid', { name: 'id' })
    id: string;

    @Column({ name: 'name', type: 'character varying', unique: true })
    name: string;

    @Column({ name: 'status', type: 'boolean', default: true })
    status: boolean;

    @Column({ name: "description", type: "character varying" })
    description: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
    updatedAt: Date;
}