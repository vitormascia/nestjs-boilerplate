
import { Module } from "@nestjs/common";

import { BuenroMaterialsApiService } from "./buenro_materials_api.service.js";

@Module({
	imports: [],
	controllers: [],
	providers: [BuenroMaterialsApiService],
	exports: [BuenroMaterialsApiService],
})
export class BuenroModule { }
