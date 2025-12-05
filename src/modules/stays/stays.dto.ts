import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
	IsBoolean, IsIn, IsInt, IsOptional, IsPositive, IsString,
	Max, MaxLength, Min, MinLength,
} from "class-validator";

import { StayPriceSegment } from "./@types/stays.enums.js";

const allowedSortByColumns = [
	"city",
	"pricePerNight",
	"name",
	"country",
	"priceSegment",
];

export class QueryStaysDto {
	/* --- Full Text Search --- */
	@ApiProperty({
		type: String,
		required: false,
		description: "Lorem Ipsum",
	})
	@MaxLength(150)
	@MinLength(1)
	@IsString()
	@IsOptional()
	public readonly text?: string;

	/* --- Exact Filtering (Common & Discriminator Fields) --- */
	@ApiProperty({
		type: String,
		required: false,
		description: "Lorem Ipsum",
	})
	@MaxLength(150)
	@MinLength(1)
	@IsString()
	@IsOptional()
	public readonly name?: string;

	@ApiProperty({
		type: String,
		required: false,
		description: "Lorem Ipsum",
	})
	@MaxLength(150)
	@MinLength(1)
	@IsOptional()
	@IsString()
	public readonly city?: string;

	@ApiProperty({
		type: String,
		required: false,
		description: "Lorem Ipsum",
	})
	@MaxLength(150)
	@MinLength(1)
	@IsString()
	@IsOptional()
	public readonly country?: string;

	@ApiProperty({
		type: String,
		required: false,
		description: "Lorem Ipsum",
	})
	// @IsEnum(StayPriceSegment)
	@IsIn(Object.values(StayPriceSegment))
	@IsString()
	@IsOptional()
	public readonly priceSegment?: "low" | "medium" | "high";

	@ApiProperty({
		type: Boolean,
		required: false,
		description: "Lorem Ipsum",
	})
	@IsBoolean()
	@IsOptional()
	@Transform(({ value }: { value: any }): any => {
		if (value === "true" || value === "1") {
			return true;
		}

		if (value === "false" || value === "0") {
			return false;
		}

		return value;
	})
	public readonly isAvailable?: boolean;

	@ApiProperty({
		type: Number,
		required: false,
		description: "Lorem Ipsum",
	})
	/* --- Numeric Range Filtering (PricePerNight) --- */
	@IsPositive()
	@IsInt()
	@IsOptional()
	@Transform(({ value }) => parseInt(value))
	public readonly minPrice?: number;

	@ApiProperty({
		type: Number,
		required: false,
		description: "Lorem Ipsum",
	})
	@IsPositive()
	@IsInt()
	@IsOptional()
	@Transform(({ value }) => parseInt(value))
	public readonly maxPrice?: number;

	/* --- Pagination and Sorting --- */
	@ApiProperty({
		type: Number,
		required: false,
		description: "Lorem Ipsum",
		default: 0,
	})
	@Min(0)
	@IsInt()
	@IsOptional()
	@Transform(({ value }) => parseInt(value))
	public readonly skip: number = 0;

	@ApiProperty({
		type: Number,
		required: false,
		description: "Lorem Ipsum",
		default: 25,
	})
	@Max(100)
	@IsPositive()
	@IsInt()
	@IsOptional()
	@Transform(({ value }) => parseInt(value))
	public readonly limit: number = 25;

	@ApiProperty({
		type: String,
		required: false,
		description: "Lorem Ipsum",
		default: "pricePerNight",
	})
	@IsIn(allowedSortByColumns)
	@IsString()
	@IsOptional()
	public readonly sortBy?: string = "pricePerNight";

	@ApiProperty({
		type: String,
		required: false,
		description: "Lorem Ipsum",
		default: "ASC",
	})
	@IsIn(["ASC", "DESC"])
	@IsString()
	@IsOptional()
	public readonly sortDirection?: "ASC" | "DESC" = "ASC";
}
