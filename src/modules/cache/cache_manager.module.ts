import { Module } from "@nestjs/common";

import { CacheService } from "./cache.service.js";

@Module({
	imports: [],
	controllers: [],
	providers: [CacheService],
	exports: [CacheService],
})
export class CacheManagerModule { }
