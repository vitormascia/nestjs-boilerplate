import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { LoremsController } from "./lorems.controller.js";
import { LoremEntity } from "./lorems.entity.js";
import { LoremsService } from "./lorems.service.js";

@Module({
	imports: [TypeOrmModule.forFeature([LoremEntity])],
	controllers: [LoremsController],
	providers: [LoremsService],
	exports: [
		TypeOrmModule,
		LoremsService,
	],
})
export class LoremsModule { }
