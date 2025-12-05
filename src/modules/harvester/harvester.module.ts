
import { Module } from "@nestjs/common";

import { BuenroModule } from "../buenro/buenro.module.js";
import { StaysModule } from "../stays/stays.module.js";
import { HarvesterService } from "./harvester.service.js";

@Module({
	imports: [
		StaysModule,
		BuenroModule,
	],
	controllers: [],
	providers: [HarvesterService],
	exports: [HarvesterService],
})
export class HarvesterModule { }
