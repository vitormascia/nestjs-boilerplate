import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

import { LoremRole } from "../../guards/@types/roles.enums.js";
import { AbstractEntity } from "../app/base.entity.js";
import { Lorem } from "./@types/lorems.types.js";

@Entity("lorems")
export class LoremEntity extends AbstractEntity implements Lorem {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({
		type: "varchar",
		length: 20,
		nullable: false,
	})
	name: string;

	@Column({
		type: "varchar",
		length: 1_000,
		nullable: false,
	})
	description: string;

	@Column({
		type: "enum",
		nullable: false,
		array: true,
		enum: LoremRole,
		default: [LoremRole.One],
	})
	roles: Array<LoremRole>;

	public get bio(): string {
		return `
			Greetings 👋🏻 I am ${this.name}

			📜 Description:
			"${this.description}"

			===========================
			🎭 Roles
			===========================
			- ${this.roles.join("\n- ")}
		`;
	}
}
