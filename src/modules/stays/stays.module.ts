import { Logger, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import {
	AnyBulkWriteOperation,
	CallbackError,
	CallbackWithoutResultAndOptionalError, Model,
	MongooseBulkWriteOptions,
	SaveOptions, Schema,
} from "mongoose";

import { StayProfile, StayProfileDocument, StayProfileSchema } from "../stays/schemas/stay_profile.schema.js";
import { StaySummary, StaySummaryDocument, StaySummarySchema } from "../stays/schemas/stay_summary.schema.js";
import { Stay, StaySchema } from "./schemas/stay.schema.js";
import { StaysController } from "./stays.controller.js";
import { StaysService } from "./stays.service.js";
import { StaysRepositoryService } from "./stays_repository.service.js";

@Module({
	imports: [
		MongooseModule.forFeatureAsync([
			{
				name: Stay.name,
				imports: [ConfigModule],
				useFactory: (_configService: ConfigService): Schema<Stay, Model<Stay>> => {
					const logger = new Logger("MongooseModuleFactory");

					const schema = StaySchema;

					/* PRIMARY LOOKUPS AND UNIQUENESS */
					/*
						Global uniqueness on the external ID, preventing duplicate ingestion from
						any source
					*/
					schema.index(
						{ externalId: 1 },
						{ unique: true },
					);
					/* Discriminator Key: Essential for Mongoose and fast lookups by source type */
					schema.index({ kind: 1 });
					/* Temporal Index: Supports fast sorting and reporting for the latest data */
					schema.index({ createdAt: -1 });

					/* COMMON SINGLE-FIELD FILTERS */
					/* Basic lookups for city name filtering */
					schema.index({ city: 1 });
					/* Fast lookups on boolean availability status */
					schema.index({ isAvailable: 1 });
					/* Range queries and sorting on price */
					schema.index({ pricePerNight: 1 });

					/* COMPOUND INDEXES FOR ADVANCED/OPTIMIZED QUERIES */
					/*
						Compound Index (City-PricePerNight): Supports efficient queries that filter
						by city AND sort/filter by price
					*/
					schema.index({
						city: 1,
						pricePerNight: 1,
					});
					/*
						Compound Index (Kind-PriceSegment): Optimizes filtering on the large Source
						2 dataset by leveraging the discriminator key first
					*/
					schema.index({
						kind: 1,
						priceSegment: 1,
					});
					/*
						Compound Index (Kind-ExternalId): High-efficiency lookup for services
						querying a specific source/ID combination
					*/
					schema.index({
						kind: 1,
						externalId: 1,
					});

					/* TEXT INDEX FOR PARTIAL SEARCH */
					/*
						Single Text Index across multiple fields for unified full-text search
						capability
					*/
					schema.index({
						name: "text",
						city: "text",
						country: "text",
					});

					logger.debug("SET_UP_SCHEMA_INDEXES", { indexes: schema.indexes() });

					/*
						PRE & POST
						method: 'aggregate'
						method: 'bulkWrite'
						method: 'createCollection'
						method: 'init'
						method: 'insertMany'
						method: 'save'
					*/
					schema.pre(
						"save",
						function (
							this: StayProfileDocument | StaySummaryDocument,
							next: CallbackWithoutResultAndOptionalError,
							_opts: SaveOptions,
						) {
							// logger.debug("PRE_HOOK::SAVE", {
							// 	entry: this,
							// 	saveOptions: opts,
							// });

							next();
						},
					);
					schema.pre(
						"bulkWrite",
						function (
							this: Model<StayProfile | StaySummary>,
							next: (err?: CallbackError) => void,
							_ops: Array<AnyBulkWriteOperation<any>>,
							_options?: MongooseBulkWriteOptions,
						) {
							// logger.debug("PRE_HOOK::BULK_WRITE", {
							// 	model: this.modelName,
							// 	writeSize: ops.length,
							// 	options,
							// });

							next();
						},
					);

					return schema;
				},
				discriminators: [
					{
						name: StayProfile.name,
						schema: StayProfileSchema,
					},
					{
						name: StaySummary.name,
						schema: StaySummarySchema,
					},
				],
				inject: [ConfigService],
			},
		]),
	],
	controllers: [StaysController],
	providers: [
		StaysService,
		StaysRepositoryService,
	],
	exports: [
		MongooseModule,
		StaysRepositoryService,
	],
})
export class StaysModule { }
