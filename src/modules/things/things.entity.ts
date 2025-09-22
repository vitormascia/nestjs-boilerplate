import {
	Column,
	Entity,
	PrimaryGeneratedColumn,
} from "typeorm";

import { AbstractEntity } from "../app/base.entity.js";
import { Thing } from "./@types/things.types.js";

@Entity("things")
export class ThingEntity extends AbstractEntity implements Thing {
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
}
