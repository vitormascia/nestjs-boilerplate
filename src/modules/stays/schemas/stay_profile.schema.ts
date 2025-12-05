import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type StayProfileDocument = HydratedDocument<StayProfile>;

@Schema()
export class StayProfile {
	@Prop({
		type: String,
		required: false,
		maxLength: 150,
	})
	name: string;

	@Prop({
		type: String,
		required: false,
		maxLength: 60,
	})
	country: string;
}

export const StayProfileSchema = SchemaFactory.createForClass(StayProfile);
