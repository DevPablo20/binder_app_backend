import { MigrationInterface, QueryRunner } from "typeorm";

export class Default1781278841362 implements MigrationInterface {
    name = 'Default1781278841362'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "company" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "short_id" character varying NOT NULL, "status" boolean NOT NULL DEFAULT true, "description" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_a76c5cd486f7779bd9c319afd27" UNIQUE ("name"), CONSTRAINT "UQ_f0c9abb85b7e3ae9f35da0dadac" UNIQUE ("short_id"), CONSTRAINT "PK_056f7854a7afdba7cbd6d45fc20" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('superadmin', 'editor', 'viewer')`);
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "password" character varying(255) NOT NULL, "role" "public"."user_role_enum" NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "password_reset_token" character varying(255), "password_reset_expires" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_company" ("user_id" uuid NOT NULL, "company_id" uuid NOT NULL, CONSTRAINT "PK_245698fa55a6268c024725e61cb" PRIMARY KEY ("user_id", "company_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_128160a3dfe4065da308a3cc6b" ON "user_company" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_a34b2349be9db8ab53fe3d0e23" ON "user_company" ("company_id") `);
        await queryRunner.query(`ALTER TABLE "user_company" ADD CONSTRAINT "FK_128160a3dfe4065da308a3cc6b3" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_company" ADD CONSTRAINT "FK_a34b2349be9db8ab53fe3d0e230" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_company" DROP CONSTRAINT "FK_a34b2349be9db8ab53fe3d0e230"`);
        await queryRunner.query(`ALTER TABLE "user_company" DROP CONSTRAINT "FK_128160a3dfe4065da308a3cc6b3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a34b2349be9db8ab53fe3d0e23"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_128160a3dfe4065da308a3cc6b"`);
        await queryRunner.query(`DROP TABLE "user_company"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
        await queryRunner.query(`DROP TABLE "company"`);
    }

}
