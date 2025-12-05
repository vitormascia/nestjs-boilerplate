import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Interval } from "@nestjs/schedule";

import time from "../../constants/time.constants.js";
import { HarvesterService } from "../harvester/harvester.service.js";

@Injectable()
export class JobsService implements OnModuleInit {
	private readonly logger = new Logger(this.constructor.name);

	constructor(private readonly harvestService: HarvesterService) { }

	public async onModuleInit(): Promise<void> {
		this.logger.debug("HARVESTING_STAYS::ON_MODULE_INIT");

		await this.harvestStays();
	}

	/* Other option using Cron and CronExpression from @nestjs/schedule */
	// @Cron(
	// 	CronExpression.EVERY_4_HOURS,
	// 	{
	// 		name: "harvest_stays",
	// 		timeZone: "Etc/UTC",
	// 		waitForCompletion: true,
	// 		disabled: false,
	// 	},
	// )
	@Interval("harvest_stays", time.milliseconds.hour * 4)
	public async harvestStays(): Promise<void> {
		this.logger.debug("HARVESTING_STAYS");

		await this.harvestService.harvestStays();
	}
}
