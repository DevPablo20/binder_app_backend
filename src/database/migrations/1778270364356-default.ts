import { MigrationInterface, QueryRunner } from "typeorm";

export class Default1778270364356 implements MigrationInterface {
    name = 'Default1778270364356'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('superadmin', 'editor', 'viewer')`);
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "password" character varying(255) NOT NULL, "role" "public"."user_role_enum" NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "password_reset_token" character varying(255), "password_reset_expires" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."platform_platform_type_enum" AS ENUM('social_media', 'search', 'direct_messaging', 'streaming', 'marketplace', 'offline', 'programatic', 'partnerships', 'crm', 'referral', 'other')`);
        await queryRunner.query(`CREATE TABLE "platform" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "platform_type" "public"."platform_platform_type_enum" NOT NULL, "description" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_c33d6abeebd214bd2850bfd6b8e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "company" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "status" boolean NOT NULL DEFAULT true, "description" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_a76c5cd486f7779bd9c319afd27" UNIQUE ("name"), CONSTRAINT "PK_056f7854a7afdba7cbd6d45fc20" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "campaign" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "status" boolean NOT NULL DEFAULT true, "description" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_e290ca6f46908d64b270de65471" UNIQUE ("name"), CONSTRAINT "PK_0ce34d26e7f2eb316a3a592cdc4" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "campaign"`);
        await queryRunner.query(`DROP TABLE "company"`);
        await queryRunner.query(`DROP TABLE "platform"`);
        await queryRunner.query(`DROP TYPE "public"."platform_platform_type_enum"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
    }

}
