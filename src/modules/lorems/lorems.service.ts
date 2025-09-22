import {
	Injectable,
	Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Something } from "./@types/lorems.interfaces.js";
import { Lorem } from "./@types/lorems.types.js";
import { CreateLoremBodyDto } from "./lorems.dtos.js";
import { LoremEntity } from "./lorems.entity.js";

@Injectable()
export class LoremsService {
	private readonly logger = new Logger(this.constructor.name);

	constructor(@InjectRepository(LoremEntity) private loremsRepository: Repository<LoremEntity>) { }

	public async create(createLoremDto: CreateLoremBodyDto): Promise<Lorem> {
		/* Remove possible duplicities */
		createLoremDto.roles = createLoremDto.roles ? [...new Set(createLoremDto.roles)] : createLoremDto.roles;

		const lorem: Lorem = await this.loremsRepository.save(createLoremDto);

		this.logger.debug("CREATED_LOREM", { lorem });

		return lorem;
	}

	public async getSomething(): Promise<Something> {
		const [lorems, loremsAmount] = await this.loremsRepository.findAndCount({
			select: {
				id: true,
				name: true,
			},
			// relations: {},
			// where: {},
			// order: {},
			// skip: 0,
			// take: 10_000,
		});

		const something = {
			size: loremsAmount,
			lorems: lorems.map(({ id, name }) => ({
				id,
				name,
			})),
		};

		return something;
	}
}
