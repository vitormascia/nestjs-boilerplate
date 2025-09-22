
import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { TerminusModule } from "@nestjs/terminus";

import time from "../../constants/time.constants.js";
import { HealthController } from "./health_check.controller.js";

@Module({
	imports: [
		TerminusModule.forRoot({
			logger: true,
			errorLogStyle: "pretty",
			gracefulShutdownTimeoutMs: time.milliseconds.second,
		}),
		HttpModule,
	],
	controllers: [HealthController],
	providers: [],
	exports: [],
})
export class HealthModule { }
