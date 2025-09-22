import {
	ArrayMinSize,
	IsEnum,
	IsOptional,
	IsString,
	MaxLength,
	MinLength,
} from "class-validator";

import { LoremRole } from "../../guards/@types/roles.enums.js";

export class CreateLoremBodyDto {
	@MaxLength(20)
	@MinLength(1)
	@IsString()
	name: string;

	@MaxLength(1_000)
	@IsString()
	description: string;

	@IsEnum(LoremRole, { each: true })
	@ArrayMinSize(1)
	@IsOptional()
	roles?: Array<LoremRole>;
}
