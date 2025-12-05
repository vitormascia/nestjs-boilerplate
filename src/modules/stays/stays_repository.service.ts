import {
	Injectable, Logger,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { AnyBulkWriteOperation, Model } from "mongoose";

import { StayProfile as TStayProfile, StaySummary as TStaySummary } from "../stays/@types/stays.types.js";
import { Stay } from "./schemas/stay.schema.js";
import { StayProfile } from "./schemas/stay_profile.schema.js";
import { StaySummary } from "./schemas/stay_summary.schema.js";

@Injectable()
export class StaysRepositoryService {
	private readonly logger = new Logger(this.constructor.name);

	constructor(
		@InjectModel(StayProfile.name)
		private readonly stayProfileModel: Model<StayProfile>,
		@InjectModel(StaySummary.name)
		private readonly staySummaryModel: Model<StaySummary>,
	) { }

	public async upsertStayProfile(stayProfile: TStayProfile): Promise<void> {
		try {
			const externalId = stayProfile.id.toString();

			const stay: Omit<Stay, "kind"> = {
				externalId,
				city: stayProfile.address.city,
				isAvailable: stayProfile.isAvailable,
				pricePerNight: stayProfile.priceForNight,
			};
			const normalizedStayProfile: StayProfile = {
				...stay,
				name: stayProfile.name,
				country: stayProfile.address.country,
			};

			await this.stayProfileModel.findOneAndUpdate(
				{ externalId },
				{ $set: normalizedStayProfile },
				{
					new: true,
					upsert: true,
					runValidators: true,
				},
			);
		} catch (error: any) {
			this.logger.error("UPSERT_STAY_PROFILE_ERROR", {
				data: stayProfile,
				error: error instanceof Error
					? {
						cause: error.cause,
						message: error.message,
						name: error.name,
						stack: error.stack,
					}
					: { message: String(error) },
			});
		}
	}

	public async bulkUpsertStaysProfiles(staysProfiles: Array<TStayProfile>): Promise<void> {
		try {
			if (!staysProfiles.length) {
				return;
			}

			const bulkOperations: Array<AnyBulkWriteOperation<StayProfile>> = staysProfiles.map((stayProfile) => {
				const externalId = stayProfile.id.toString();

				const stay: Omit<Stay, "kind"> = {
					externalId,
					city: stayProfile.address.city,
					isAvailable: stayProfile.isAvailable,
					pricePerNight: stayProfile.priceForNight,
				};
				const normalizedStayProfile: StayProfile = {
					...stay,
					name: stayProfile.name,
					country: stayProfile.address.country,
				};

				return {
					updateOne: {
						filter: { externalId },
						update: { $set: normalizedStayProfile },
						upsert: true,
					},
				};
			});

			await this.stayProfileModel.bulkWrite(
				bulkOperations,
				{ ordered: false },
			);
		} catch (error: any) {
			this.logger.error("BULK_UPSERT_STAYS_PROFILES_ERROR", {
				staysProfilesAmount: staysProfiles.length,
				error: error instanceof Error
					? {
						cause: error.cause,
						message: error.message,
						name: error.name,
						stack: error.stack,
					}
					: { message: String(error) },
			});

			throw error;
		}
	}

	public async upsertStaySummary(staySummary: TStaySummary): Promise<void> {
		try {
			const externalId = staySummary.id.toString();

			const stay: Omit<Stay, "kind"> = {
				externalId,
				city: staySummary.city,
				isAvailable: staySummary.availability,
				pricePerNight: staySummary.pricePerNight,
			};
			const normalizedStayProfile: StaySummary = {
				...stay,
				priceSegment: staySummary.priceSegment,
			};

			await this.staySummaryModel.findOneAndUpdate(
				{ externalId },
				{ $set: normalizedStayProfile },
				{
					new: true,
					upsert: true,
					runValidators: true,
				},
			);
		} catch (error: any) {
			this.logger.error("UPSERT_STAY_SUMMARY_ERROR", {
				data: staySummary,
				error: error instanceof Error
					? {
						cause: error.cause,
						message: error.message,
						name: error.name,
						stack: error.stack,
					}
					: { message: String(error) },
			});
		}
	}

	public async bulkUpsertStaysSummaries(staysSummaries: Array<TStaySummary>): Promise<void> {
		try {
			if (!staysSummaries.length) {
				return;
			}

			const bulkOperations: Array<AnyBulkWriteOperation<StayProfile>> = staysSummaries.map((staySummary) => {
				const externalId = staySummary.id.toString();

				const stay: Omit<Stay, "kind"> = {
					externalId,
					city: staySummary.city,
					isAvailable: staySummary.availability,
					pricePerNight: staySummary.pricePerNight,
				};
				const normalizedStaySummary: StaySummary = {
					...stay,
					priceSegment: staySummary.priceSegment,
				};

				return {
					updateOne: {
						filter: { externalId },
						update: { $set: normalizedStaySummary },
						upsert: true,
					},
				};
			});

			await this.staySummaryModel.bulkWrite(
				bulkOperations,
				{ ordered: false },
			);
		} catch (error: any) {
			this.logger.error("BULK_UPSERT_STAYS_SUMMARIES_ERROR", {
				staysSummariesAmount: staysSummaries.length,
				error: error instanceof Error
					? {
						cause: error.cause,
						message: error.message,
						name: error.name,
						stack: error.stack,
					}
					: { message: String(error) },
			});

			throw error;
		}
	}
}
