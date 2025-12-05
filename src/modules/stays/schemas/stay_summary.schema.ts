import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

import { StayPriceSegment } from "../@types/stays.enums.js";

export type StaySummaryDocument = HydratedDocument<StaySummary>;

@Schema()
export class StaySummary {
	@Prop({
		type: String,
		required: true,
		enum: Object.values(StayPriceSegment),
	})
	priceSegment: string;
}

export const StaySummarySchema = SchemaFactory.createForClass(StaySummary);
