
import { InjectQueue } from "@nestjs/bullmq";
import {
	Injectable,
	Logger,
	NotFoundException,
} from "@nestjs/common";
import { Queue } from "bullmq";
import _ from "lodash";
import { EntityManager } from "typeorm";
import { v4 as uuidv4 } from "uuid";

import { QueueName } from "../app/@types/queues.enums.js";
import { ThingJobData } from "./@types/things.interfaces.js";
import {
	CreateThing,
	Thing,
	UpdateThing,
} from "./@types/things.types.js";
import { ThingLocksService } from "./locks.service.js";
import { ThingEntity } from "./things.entity.js";

@Injectable()
export class ThingsService {
	private readonly logger = new Logger(this.constructor.name);

	constructor(
		@InjectQueue(QueueName.Things)
		private readonly thingsQueue: Queue<ThingJobData>,
		private readonly thingLocksService: ThingLocksService,
	) { }

	public async create(createThing: CreateThing, entityManager: EntityManager): Promise<Thing> {
		const thingsRepository = entityManager.getRepository(ThingEntity);

		const insertThingResult = await thingsRepository.insert(createThing);

		const thingId: string = insertThingResult.identifiers[0].id;

		const thing = await thingsRepository.findOneBy({
			id: thingId,
		});

		if (!thing) {
			throw new NotFoundException("Thing not found");
		}

		this.logger.debug("CREATED_THING", {
			createThing,
			thing,
		});

		return thing;
	}

	public async update(thingId: string, updateThing: UpdateThing, entityManager: EntityManager): Promise<Thing> {
		const thingsRepository = entityManager.getRepository(ThingEntity);

		await thingsRepository.update(thingId, updateThing);

		const thing = await thingsRepository.findOneBy({
			id: thingId,
		});

		if (!thing) {
			throw new NotFoundException("Thing not found");
		}

		this.logger.debug("UPDATED_THING", {
			updateThing,
			thing,
		});

		return thing;
	}

	public async submit(thingId: string): Promise<void> {
		await this.thingLocksService.acquireLock(thingId);

		const traceId = uuidv4();
		const thingJobData: ThingJobData = {
			traceId,
			thingId,
		};

		await this.thingsQueue.add(
			"SOME_MEANINGFUL_JOB_NAME",
			thingJobData,
		);

		this.logger.debug("ENQUEUED_THING_SUBMISSION", { thingJobData });
	}
}
