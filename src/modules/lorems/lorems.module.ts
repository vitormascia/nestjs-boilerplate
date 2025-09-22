import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ExampleApiService } from "./example_api.service.js";
import { LoremsController } from "./lorems.controller.js";
import { LoremEntity } from "./lorems.entity.js";
import { LoremsService } from "./lorems.service.js";

@Module({
	imports: [TypeOrmModule.forFeature([LoremEntity])],
	controllers: [LoremsController],
	providers: [LoremsService, ExampleApiService],
	exports: [
		TypeOrmModule,
		LoremsService,
		ExampleApiService,
	],
})
export class LoremsModule { }
