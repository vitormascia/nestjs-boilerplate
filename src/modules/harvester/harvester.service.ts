import { Injectable } from "@nestjs/common";

import { BuenroMaterialsApiService } from "../buenro/buenro_materials_api.service.js";
import { StayProfile, StaySummary } from "../stays/@types/stays.types.js";
import { StaysRepositoryService } from "../stays/stays_repository.service.js";

@Injectable()
export class HarvesterService {
	// private readonly logger = new Logger(this.constructor.name);

	constructor(
		private readonly buenroMaterialsApiService: BuenroMaterialsApiService,
		private readonly staysRepositoryService: StaysRepositoryService,
	) { }

	public async harvestStays(): Promise<void> {
		await this.harvestStaysProfiles();
		await this.harvestStaysSummaries();
	}

	private async harvestStaysProfiles(): Promise<void> {
		const dataIterator = this.buenroMaterialsApiService.getStaysProfilesStream();

		const BATCH_SIZE = 1_000;
		let staysProfiles: Array<StayProfile> = [];

		for await (const staysProfilesChunk of dataIterator) {
			// this.logger.debug("HARVESTING_STAY_PROFILE", { staysProfilesChunk });

			staysProfiles.push(staysProfilesChunk.value);

			if (staysProfiles.length >= BATCH_SIZE) {
				// this.logger.debug(
				// 	"BULK_HARVESTING_STAYS_PROFILES",
				// 	{ l: staysProfiles.length },
				// );

				await this.staysRepositoryService.bulkUpsertStaysProfiles(staysProfiles);

				staysProfiles = [];
			}
		}

		if (staysProfiles.length > 0) {
			// this.logger.debug(
			// 	"BULK_HARVESTING_STAYS_PROFILES::LEFTOVER",
			// 	{ l: staysProfiles.length },
			// );

			await this.staysRepositoryService.bulkUpsertStaysProfiles(staysProfiles);
		}
	}

	private async harvestStaysSummaries(): Promise<void> {
		const dataIterator = this.buenroMaterialsApiService.getStaysSummariesStream();

		const BATCH_SIZE = 1_000;
		let staysSummaries: Array<StaySummary> = [];

		for await (const staysSummariesChunk of dataIterator) {
			// this.logger.debug("HARVESTING_STAY_SUMMARY", { staysSummariesChunk });

			staysSummaries.push(staysSummariesChunk.value);

			if (staysSummaries.length >= BATCH_SIZE) {
				// this.logger.debug(
				// 	"BULK_HARVESTING_STAYS_SUMMARIES",
				// 	{ l: staysSummaries.length },
				// );

				await this.staysRepositoryService.bulkUpsertStaysSummaries(staysSummaries);

				staysSummaries = [];
			}
		}

		if (staysSummaries.length > 0) {
			// this.logger.debug(
			// 	"BULK_HARVESTING_STAYS_SUMMARIES::LEFTOVER",
			// 	{ l: staysSummaries.length },
			// );

			await this.staysRepositoryService.bulkUpsertStaysSummaries(staysSummaries);
		}
	}
}
