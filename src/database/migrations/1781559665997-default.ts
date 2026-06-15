import { MigrationInterface, QueryRunner } from "typeorm";

export class Default1781559665997 implements MigrationInterface {
    name = 'Default1781559665997'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "company" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "description" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_a76c5cd486f7779bd9c319afd27" UNIQUE ("name"), CONSTRAINT "PK_056f7854a7afdba7cbd6d45fc20" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."invite_role_enum" AS ENUM('superadmin', 'editor', 'viewer')`);
        await queryRunner.query(`CREATE TYPE "public"."invite_status_enum" AS ENUM('pending', 'accepted', 'refused', 'expired', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "invite" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "token" character varying(255) NOT NULL, "role" "public"."invite_role_enum" NOT NULL, "status" "public"."invite_status_enum" NOT NULL DEFAULT 'pending', "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "accepted_at" TIMESTAMP WITH TIME ZONE, "refused_at" TIMESTAMP WITH TIME ZONE, "cancelled_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "invited_by_id" uuid, CONSTRAINT "UQ_83dbe83cb33c3e8468c8045ea7c" UNIQUE ("token"), CONSTRAINT "PK_fc9fa190e5a3c5d80604a4f63e1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('superadmin', 'editor', 'viewer')`);
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "password" character varying(255) NOT NULL, "role" "public"."user_role_enum" NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "password_reset_token" character varying(255), "password_reset_expires" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_company" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid, "company_id" uuid, CONSTRAINT "UQ_245698fa55a6268c024725e61cb" UNIQUE ("user_id", "company_id"), CONSTRAINT "PK_9e70b5f9d7095018e86970c7874" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "invite_company" ("invite_id" uuid NOT NULL, "company_id" uuid NOT NULL, CONSTRAINT "PK_aeb3c15a0d3b0bd76a154934b43" PRIMARY KEY ("invite_id", "company_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9c47bf7a28ffb22e6b5536b170" ON "invite_company" ("invite_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_6ade16fa1000e7c9ab99aafe5a" ON "invite_company" ("company_id") `);
        await queryRunner.query(`ALTER TABLE "invite" ADD CONSTRAINT "FK_c0c1e425621a28a6996f4a71266" FOREIGN KEY ("invited_by_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_company" ADD CONSTRAINT "FK_128160a3dfe4065da308a3cc6b3" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_company" ADD CONSTRAINT "FK_a34b2349be9db8ab53fe3d0e230" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invite_company" ADD CONSTRAINT "FK_9c47bf7a28ffb22e6b5536b1702" FOREIGN KEY ("invite_id") REFERENCES "invite"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "invite_company" ADD CONSTRAINT "FK_6ade16fa1000e7c9ab99aafe5ac" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invite_company" DROP CONSTRAINT "FK_6ade16fa1000e7c9ab99aafe5ac"`);
        await queryRunner.query(`ALTER TABLE "invite_company" DROP CONSTRAINT "FK_9c47bf7a28ffb22e6b5536b1702"`);
        await queryRunner.query(`ALTER TABLE "user_company" DROP CONSTRAINT "FK_a34b2349be9db8ab53fe3d0e230"`);
        await queryRunner.query(`ALTER TABLE "user_company" DROP CONSTRAINT "FK_128160a3dfe4065da308a3cc6b3"`);
        await queryRunner.query(`ALTER TABLE "invite" DROP CONSTRAINT "FK_c0c1e425621a28a6996f4a71266"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6ade16fa1000e7c9ab99aafe5a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9c47bf7a28ffb22e6b5536b170"`);
        await queryRunner.query(`DROP TABLE "invite_company"`);
        await queryRunner.query(`DROP TABLE "user_company"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
        await queryRunner.query(`DROP TABLE "invite"`);
        await queryRunner.query(`DROP TYPE "public"."invite_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."invite_role_enum"`);
        await queryRunner.query(`DROP TABLE "company"`);
    }

}
