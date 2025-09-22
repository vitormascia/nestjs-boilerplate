import {
	MigrationInterface,
	QueryRunner,
} from "typeorm";

export class BootstrapApp1753495313655 implements MigrationInterface {
	name = this.constructor.name;

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            CREATE TYPE "public"."lorems_roles_enum" AS ENUM(
				'ONE',
				'TWO'
			)
        `);

		await queryRunner.query(`
            CREATE TABLE "lorems" (
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(20) NOT NULL,
                "description" character varying(1000) NOT NULL,
                "roles" "public"."lorems_roles_enum" array NOT NULL DEFAULT '{ONE}',
                CONSTRAINT "PK_de22b8fdeee0c33ab55ae71da3b" PRIMARY KEY ("id")
            )
        `);

		await queryRunner.query(`
            CREATE TABLE "things" (
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
				"name" character varying(20) NOT NULL,
				"description" character varying(1000) NOT NULL,
                CONSTRAINT "PK_23c1704905b19ad7f8b957ac916" PRIMARY KEY ("id")
            )
        `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query("DROP TABLE \"things\"");

		await queryRunner.query("DROP TABLE \"lorems\"");

		await queryRunner.query("DROP TYPE \"public\".\"lorems_roles_enum\"");
	}
}
