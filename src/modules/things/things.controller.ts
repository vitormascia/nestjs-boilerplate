import {
	BadRequestException,
	Body,
	Controller,
	Headers,
	Post,
	UseGuards,
} from "@nestjs/common";
import { validate as isUUID } from "uuid";

import { Roles } from "../../decorators/roles.decorators.js";
import { LoremRole } from "../../guards/@types/roles.enums.js";
import { LoremRolesGuard } from "../../guards/lorem_roles.guards.js";
import { SubmitThingBodyDto } from "./things.dtos.js";
import { ThingsService } from "./things.service.js";

@Controller("/things")
@UseGuards(LoremRolesGuard)
export class ThingsController {

	constructor(private readonly thingsService: ThingsService) { }

	@Post()
	@Roles(LoremRole.One)
	public async submit(
		@Body() body: SubmitThingBodyDto,
		@Headers("User-Id") userId?: string,
	): Promise<void> {
		if (typeof userId !== "string") {
			throw new BadRequestException("User-Id Header has to be set");
		}

		if (!isUUID(userId)) {
			throw new BadRequestException("User-Id Header has to be a valid UUID");
		}

		const { thingId } = body;

		await this.thingsService.submit(thingId);
	}
}
