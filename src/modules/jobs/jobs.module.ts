import { Module } from "@nestjs/common";

import { HarvesterModule } from "../harvester/harvester.module.js";
import { JobsService } from "./jobs.service.js";

@Module({
	imports: [HarvesterModule],
	controllers: [],
	providers: [JobsService],
	exports: [],
})
export class JobsModule { }
