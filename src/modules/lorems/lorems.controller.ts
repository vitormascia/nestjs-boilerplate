import {
	Body,
	Controller,
	Get,
	Post,
	UseGuards,
} from "@nestjs/common";

import { Roles } from "../../decorators/roles.decorators.js";
import { LoremRole } from "../../guards/@types/roles.enums.js";
import { LoremRolesGuard } from "../../guards/lorem_roles.guards.js";
import { Something } from "./@types/lorems.interfaces.js";
import { Lorem } from "./@types/lorems.types.js";
import { CreateLoremBodyDto } from "./lorems.dtos.js";
import { LoremsService } from "./lorems.service.js";

@Controller("/lorems")
export class LoremsController {
	constructor(private readonly loremsService: LoremsService) { }

	@Post()
	public async create(@Body() body: CreateLoremBodyDto): Promise<Lorem> {
		return this.loremsService.create(body);
	}

	@Get("/something")
	@UseGuards(LoremRolesGuard)
	@Roles(LoremRole.One)
	public async getSomething(): Promise<Something> {
		return this.loremsService.getSomething();
	}
}
