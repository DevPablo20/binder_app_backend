import { MigrationInterface, QueryRunner } from "typeorm";

export class Default1784904043505 implements MigrationInterface {
    name = 'Default1784904043505'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."invite_role_enum" AS ENUM('superadmin', 'editor', 'viewer')`);
        await queryRunner.query(`CREATE TYPE "public"."invite_status_enum" AS ENUM('pending', 'accepted', 'refused', 'expired', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "invite" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "token" character varying(255) NOT NULL, "role" "public"."invite_role_enum" NOT NULL, "status" "public"."invite_status_enum" NOT NULL DEFAULT 'pending', "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "accepted_at" TIMESTAMP WITH TIME ZONE, "refused_at" TIMESTAMP WITH TIME ZONE, "cancelled_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "invited_by_id" uuid, CONSTRAINT "UQ_83dbe83cb33c3e8468c8045ea7c" UNIQUE ("token"), CONSTRAINT "PK_fc9fa190e5a3c5d80604a4f63e1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('superadmin', 'editor', 'viewer')`);
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "password" character varying(255) NOT NULL, "role" "public"."user_role_enum" NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "password_reset_token" character varying(255), "password_reset_expires" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_company" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid, "company_id" uuid, CONSTRAINT "UQ_245698fa55a6268c024725e61cb" UNIQUE ("user_id", "company_id"), CONSTRAINT "PK_9e70b5f9d7095018e86970c7874" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "company" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "description" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_a76c5cd486f7779bd9c319afd27" UNIQUE ("name"), CONSTRAINT "PK_056f7854a7afdba7cbd6d45fc20" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "client" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "description" character varying NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "company_id" uuid, CONSTRAINT "UQ_e97773b18175a1f9c6b6573fb6e" UNIQUE ("company_id", "name"), CONSTRAINT "PK_96da49381769303a6515a8785c7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "buying_type" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "description" character varying NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_fdd78359597e71325a4833e2fd9" UNIQUE ("name"), CONSTRAINT "PK_0d43b920aa71270793132e666f1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "channel" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "description" character varying NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "platform_id" uuid, CONSTRAINT "UQ_9ceb151672252801f903d4e0895" UNIQUE ("platform_id", "name"), CONSTRAINT "PK_590f33ee6ee7d76437acf362e39" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "platform" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "catalog_key" character varying(64), "description" character varying NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_b9b57ec16b9c2ac927aa62b8b3f" UNIQUE ("name"), CONSTRAINT "UQ_851cdf0fa4105d68ef5694abff1" UNIQUE ("catalog_key"), CONSTRAINT "PK_c33d6abeebd214bd2850bfd6b8e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "platform_account" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "external_account_id" character varying(255) NOT NULL, "name" character varying(255) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "client_id" uuid, "platform_id" uuid, CONSTRAINT "UQ_3f5918d004d9bee0d2bf03be2e2" UNIQUE ("platform_id", "external_account_id", "client_id"), CONSTRAINT "PK_2afc887b1d8a7f7895da99c4a38" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "campaign" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "description" character varying NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "client_id" uuid, CONSTRAINT "UQ_05b2e6e2311e8152896afd5335a" UNIQUE ("client_id", "name"), CONSTRAINT "PK_0ce34d26e7f2eb316a3a592cdc4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sub_format" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "description" character varying NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "format_id" uuid, CONSTRAINT "UQ_4aab0062c1c94e037ddb1442069" UNIQUE ("format_id", "name"), CONSTRAINT "PK_6b8d4ee9979a13e40f5878a5724" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "format" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "description" character varying NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_4d63df90f21850eff3f5773f16a" UNIQUE ("name"), CONSTRAINT "PK_f9f8ca2f11b7b80bef08cef66fa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "grouping" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "description" character varying NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "campaign_id" uuid, CONSTRAINT "UQ_b796415a7c15dbe554b5fa1c8c2" UNIQUE ("campaign_id", "name"), CONSTRAINT "PK_135d73da7246e0250716afdc0ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sub_grouping" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "description" character varying NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "grouping_id" uuid, CONSTRAINT "UQ_fa1b86b92da55946789dc47f596" UNIQUE ("grouping_id", "name"), CONSTRAINT "PK_fc7e7c94130b890d5de77b64b2e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."platform_object_map_object_type_enum" AS ENUM('campaign', 'ad_group', 'ad')`);
        await queryRunner.query(`CREATE TABLE "platform_object_map" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "object_type" "public"."platform_object_map_object_type_enum" NOT NULL, "external_id" character varying(255) NOT NULL, "external_name" character varying(255), "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "platform_account_id" uuid, "campaign_id" uuid, "channel_id" uuid, "buying_type_id" uuid, "format_id" uuid, "sub_format_id" uuid, CONSTRAINT "UQ_09449d1920646eaa619a15631ed" UNIQUE ("platform_account_id", "object_type", "external_id"), CONSTRAINT "PK_a216bf901bd630c61e850453116" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "invite_company" ("invite_id" uuid NOT NULL, "company_id" uuid NOT NULL, CONSTRAINT "PK_aeb3c15a0d3b0bd76a154934b43" PRIMARY KEY ("invite_id", "company_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9c47bf7a28ffb22e6b5536b170" ON "invite_company" ("invite_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_6ade16fa1000e7c9ab99aafe5a" ON "invite_company" ("company_id") `);
        await queryRunner.query(`CREATE TABLE "channel_buying_type" ("channel_id" uuid NOT NULL, "buying_type_id" uuid NOT NULL, CONSTRAINT "PK_013966ad996c395612e0b005aab" PRIMARY KEY ("channel_id", "buying_type_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_aeb231a25515b3b75c50f84bd6" ON "channel_buying_type" ("channel_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_418cfc464f029df3347fe05e59" ON "channel_buying_type" ("buying_type_id") `);
        await queryRunner.query(`CREATE TABLE "platform_object_map_sub_grouping" ("platform_object_map_id" uuid NOT NULL, "sub_grouping_id" uuid NOT NULL, CONSTRAINT "PK_67661e1f36c5dfb4da26a19332b" PRIMARY KEY ("platform_object_map_id", "sub_grouping_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a7def60134b44cc4636fe90889" ON "platform_object_map_sub_grouping" ("platform_object_map_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_9a495c162ff13029a2e4a7b5c1" ON "platform_object_map_sub_grouping" ("sub_grouping_id") `);
        await queryRunner.query(`ALTER TABLE "invite" ADD CONSTRAINT "FK_c0c1e425621a28a6996f4a71266" FOREIGN KEY ("invited_by_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_company" ADD CONSTRAINT "FK_128160a3dfe4065da308a3cc6b3" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_company" ADD CONSTRAINT "FK_a34b2349be9db8ab53fe3d0e230" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "client" ADD CONSTRAINT "FK_75fffe092dc8bb594720f9b7598" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channel" ADD CONSTRAINT "FK_e3a9ec90a3b8a45f8bf8ef0a5a9" FOREIGN KEY ("platform_id") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "platform_account" ADD CONSTRAINT "FK_9abb5cb047034bf5f3f31169a01" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "platform_account" ADD CONSTRAINT "FK_b5c15f999e5e94ba0c9b4e3baca" FOREIGN KEY ("platform_id") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "campaign" ADD CONSTRAINT "FK_06fbab111ff7400305e1927b2de" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sub_format" ADD CONSTRAINT "FK_e7b59869314f0c0557403b518cf" FOREIGN KEY ("format_id") REFERENCES "format"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "grouping" ADD CONSTRAINT "FK_c4bb6bbffcbfde9a2ceaaea703b" FOREIGN KEY ("campaign_id") REFERENCES "campaign"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sub_grouping" ADD CONSTRAINT "FK_d10e9ebe76e5758b3e5c657c1ba" FOREIGN KEY ("grouping_id") REFERENCES "grouping"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "platform_object_map" ADD CONSTRAINT "FK_95adc6490ec3a1ca77a681056c5" FOREIGN KEY ("platform_account_id") REFERENCES "platform_account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "platform_object_map" ADD CONSTRAINT "FK_2fc55f8e0d1239f421c299cad72" FOREIGN KEY ("campaign_id") REFERENCES "campaign"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "platform_object_map" ADD CONSTRAINT "FK_296d15b608086539806e03ddee8" FOREIGN KEY ("channel_id") REFERENCES "channel"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "platform_object_map" ADD CONSTRAINT "FK_46acb7ab05b1b57cef57c643df5" FOREIGN KEY ("buying_type_id") REFERENCES "buying_type"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "platform_object_map" ADD CONSTRAINT "FK_10dc25de72295a337e462feb990" FOREIGN KEY ("format_id") REFERENCES "format"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "platform_object_map" ADD CONSTRAINT "FK_54d6e425732c7395a5a791673b3" FOREIGN KEY ("sub_format_id") REFERENCES "sub_format"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invite_company" ADD CONSTRAINT "FK_9c47bf7a28ffb22e6b5536b1702" FOREIGN KEY ("invite_id") REFERENCES "invite"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "invite_company" ADD CONSTRAINT "FK_6ade16fa1000e7c9ab99aafe5ac" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "channel_buying_type" ADD CONSTRAINT "FK_aeb231a25515b3b75c50f84bd6a" FOREIGN KEY ("channel_id") REFERENCES "channel"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "channel_buying_type" ADD CONSTRAINT "FK_418cfc464f029df3347fe05e595" FOREIGN KEY ("buying_type_id") REFERENCES "buying_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "platform_object_map_sub_grouping" ADD CONSTRAINT "FK_a7def60134b44cc4636fe908898" FOREIGN KEY ("platform_object_map_id") REFERENCES "platform_object_map"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "platform_object_map_sub_grouping" ADD CONSTRAINT "FK_9a495c162ff13029a2e4a7b5c18" FOREIGN KEY ("sub_grouping_id") REFERENCES "sub_grouping"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "platform_object_map_sub_grouping" DROP CONSTRAINT "FK_9a495c162ff13029a2e4a7b5c18"`);
        await queryRunner.query(`ALTER TABLE "platform_object_map_sub_grouping" DROP CONSTRAINT "FK_a7def60134b44cc4636fe908898"`);
        await queryRunner.query(`ALTER TABLE "channel_buying_type" DROP CONSTRAINT "FK_418cfc464f029df3347fe05e595"`);
        await queryRunner.query(`ALTER TABLE "channel_buying_type" DROP CONSTRAINT "FK_aeb231a25515b3b75c50f84bd6a"`);
        await queryRunner.query(`ALTER TABLE "invite_company" DROP CONSTRAINT "FK_6ade16fa1000e7c9ab99aafe5ac"`);
        await queryRunner.query(`ALTER TABLE "invite_company" DROP CONSTRAINT "FK_9c47bf7a28ffb22e6b5536b1702"`);
        await queryRunner.query(`ALTER TABLE "platform_object_map" DROP CONSTRAINT "FK_54d6e425732c7395a5a791673b3"`);
        await queryRunner.query(`ALTER TABLE "platform_object_map" DROP CONSTRAINT "FK_10dc25de72295a337e462feb990"`);
        await queryRunner.query(`ALTER TABLE "platform_object_map" DROP CONSTRAINT "FK_46acb7ab05b1b57cef57c643df5"`);
        await queryRunner.query(`ALTER TABLE "platform_object_map" DROP CONSTRAINT "FK_296d15b608086539806e03ddee8"`);
        await queryRunner.query(`ALTER TABLE "platform_object_map" DROP CONSTRAINT "FK_2fc55f8e0d1239f421c299cad72"`);
        await queryRunner.query(`ALTER TABLE "platform_object_map" DROP CONSTRAINT "FK_95adc6490ec3a1ca77a681056c5"`);
        await queryRunner.query(`ALTER TABLE "sub_grouping" DROP CONSTRAINT "FK_d10e9ebe76e5758b3e5c657c1ba"`);
        await queryRunner.query(`ALTER TABLE "grouping" DROP CONSTRAINT "FK_c4bb6bbffcbfde9a2ceaaea703b"`);
        await queryRunner.query(`ALTER TABLE "sub_format" DROP CONSTRAINT "FK_e7b59869314f0c0557403b518cf"`);
        await queryRunner.query(`ALTER TABLE "campaign" DROP CONSTRAINT "FK_06fbab111ff7400305e1927b2de"`);
        await queryRunner.query(`ALTER TABLE "platform_account" DROP CONSTRAINT "FK_b5c15f999e5e94ba0c9b4e3baca"`);
        await queryRunner.query(`ALTER TABLE "platform_account" DROP CONSTRAINT "FK_9abb5cb047034bf5f3f31169a01"`);
        await queryRunner.query(`ALTER TABLE "channel" DROP CONSTRAINT "FK_e3a9ec90a3b8a45f8bf8ef0a5a9"`);
        await queryRunner.query(`ALTER TABLE "client" DROP CONSTRAINT "FK_75fffe092dc8bb594720f9b7598"`);
        await queryRunner.query(`ALTER TABLE "user_company" DROP CONSTRAINT "FK_a34b2349be9db8ab53fe3d0e230"`);
        await queryRunner.query(`ALTER TABLE "user_company" DROP CONSTRAINT "FK_128160a3dfe4065da308a3cc6b3"`);
        await queryRunner.query(`ALTER TABLE "invite" DROP CONSTRAINT "FK_c0c1e425621a28a6996f4a71266"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9a495c162ff13029a2e4a7b5c1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a7def60134b44cc4636fe90889"`);
        await queryRunner.query(`DROP TABLE "platform_object_map_sub_grouping"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_418cfc464f029df3347fe05e59"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_aeb231a25515b3b75c50f84bd6"`);
        await queryRunner.query(`DROP TABLE "channel_buying_type"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6ade16fa1000e7c9ab99aafe5a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9c47bf7a28ffb22e6b5536b170"`);
        await queryRunner.query(`DROP TABLE "invite_company"`);
        await queryRunner.query(`DROP TABLE "platform_object_map"`);
        await queryRunner.query(`DROP TYPE "public"."platform_object_map_object_type_enum"`);
        await queryRunner.query(`DROP TABLE "sub_grouping"`);
        await queryRunner.query(`DROP TABLE "grouping"`);
        await queryRunner.query(`DROP TABLE "format"`);
        await queryRunner.query(`DROP TABLE "sub_format"`);
        await queryRunner.query(`DROP TABLE "campaign"`);
        await queryRunner.query(`DROP TABLE "platform_account"`);
        await queryRunner.query(`DROP TABLE "platform"`);
        await queryRunner.query(`DROP TABLE "channel"`);
        await queryRunner.query(`DROP TABLE "buying_type"`);
        await queryRunner.query(`DROP TABLE "client"`);
        await queryRunner.query(`DROP TABLE "company"`);
        await queryRunner.query(`DROP TABLE "user_company"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
        await queryRunner.query(`DROP TABLE "invite"`);
        await queryRunner.query(`DROP TYPE "public"."invite_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."invite_role_enum"`);
    }

}
