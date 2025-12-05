import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model } from "mongoose";

import { Stay } from "./schemas/stay.schema.js";
import { StayProfile } from "./schemas/stay_profile.schema.js";
import { StaySummary } from "./schemas/stay_summary.schema.js";
import { QueryStaysDto } from "./stays.dto.js";

@Injectable()
export class StaysService {
	private readonly logger = new Logger(this.constructor.name);

	constructor(@InjectModel(Stay.name)
	private readonly stayModel: Model<Stay>) { }

	public async search(queryDto: QueryStaysDto): Promise<{
		total: number;
		data: Array<StayProfile | StaySummary>;
	}> {
		const {
			filter, sort, skip, limit,
		} = this.buildQuery(queryDto);

		this.logger.debug("EXECUTING_UNIFIED_QUERY", {
			filter,
			sort,
			skip,
			limit,
		});

		const [data, total] = await Promise.all([
			this.stayModel.find(filter)
				.sort(sort)
				.skip(skip)
				.limit(limit)
				.exec() as unknown as Promise<Array<StayProfile | StaySummary>>,

			this.stayModel.countDocuments(filter),
		]);

		return {
			total,
			data,
		};
	}

	private buildQuery(queryDto: QueryStaysDto): {
		filter: FilterQuery<Stay>;
		sort: Record<string, 1 | -1>;
		skip: number;
		limit: number;
	} {
		const {
			text,
			name,
			city,
			country,
			priceSegment,
			isAvailable,
			minPrice,
			maxPrice,
			sortBy,
			sortDirection,
			skip,
			limit,
		} = queryDto;

		const filter: FilterQuery<Stay> = {};
		const sort: Record<string, 1 | -1> = {};

		if (text) {
			filter.$text = { $search: text };
		}

		if (name) {
			filter.name = name;
		}

		if (city) {
			filter.city = city;
		}

		if (country) {
			filter.country = country;
		}

		if (priceSegment) {
			filter.priceSegment = priceSegment;
		}

		if (isAvailable !== undefined) {
			filter.isAvailable = isAvailable;
		}

		if (minPrice !== undefined || maxPrice !== undefined) {
			filter.pricePerNight = {};

			if (minPrice !== undefined) {
				filter.pricePerNight.$gte = minPrice;
			}

			if (maxPrice !== undefined) {
				filter.pricePerNight.$lte = maxPrice;
			}
		}

		if (sortBy) {
			sort[sortBy] = sortDirection === "DESC" ? -1 : 1;
		} else {
			sort.pricePerNight = 1;
		}

		return {
			filter,
			sort,
			skip,
			limit,
		};
	}
}
