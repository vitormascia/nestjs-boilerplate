import { Controller, Get, Query } from "@nestjs/common";

import { StayProfile } from "../stays/schemas/stay_profile.schema.js";
import { StaySummary } from "../stays/schemas/stay_summary.schema.js";
import { QueryStaysDto } from "./stays.dto.js";
import { StaysService } from "./stays.service.js";

@Controller("/stays")
export class StaysController {
	constructor(private readonly harvesterService: StaysService) { }

	@Get("/search")
	public async findData(@Query() queryDto: QueryStaysDto): Promise<{
		total: number;
		data: Array<StayProfile | StaySummary>;
	}> {
		return this.harvesterService.search(queryDto);
	}
}
