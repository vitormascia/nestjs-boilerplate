import { StayPriceSegment } from "./stays.enums.js";

export type StayProfile = {
	id: number;
	name: string;
	address: {
		country: string;
		city: string;
	};
	isAvailable: boolean;
	priceForNight: number;
}

export type StaySummary = {
	id: string;
	city: string;
	availability: boolean;
	priceSegment: StayPriceSegment;
	pricePerNight: number;
}
