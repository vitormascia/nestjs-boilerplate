import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

import { DataKind } from "../../harvester/@types/harvester.enums.js";

export type StayDocument = HydratedDocument<Stay>;

@Schema({
	discriminatorKey: "kind",
	minimize: false,
	timestamps: true,
})
export class Stay {
	@Prop({
		type: String,
		required: true,
		enum: Object.values(DataKind),
	})
	kind: string;

	@Prop({
		type: String,
		required: true,
		validate: {
			validator: (value: string) => {
				const isAlphanumericId = /^[a-zA-Z0-9]+$/.test(value);

				return isAlphanumericId;
			},
			message: "externalId must be an alphanumeric string",
		},
	})
	externalId: string;

	@Prop({
		type: String,
		required: true,
		maxLength: 150,
	})
	city: string;

	@Prop({
		type: Boolean,
		required: true,
	})
	isAvailable: boolean;

	@Prop({
		type: Number,
		required: true,
		min: 0,
		validate: {
			validator: (value: number) => {
				const isMoney = /^\d+(\.\d{1,2})?$/.test(value.toString());

				return Number.isFinite(value)
					&& value >= 0
					&& isMoney;
			},
			message: "pricePerNight must be a positive float with up to 2 decimal places (money-like)",
		},
	})
	pricePerNight: number;
}

export const StaySchema = SchemaFactory.createForClass(Stay);
