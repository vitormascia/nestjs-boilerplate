import {
	Inject,
	Injectable,
	Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Redis } from "ioredis";

import { AppConfig } from "../app/@types/app.interfaces.js";
import { LockThingResult } from "./@types/things.types.js";

@Injectable()
export class ThingLocksService {
	private readonly logger = new Logger(this.constructor.name);
	private readonly loremIpsumTtl: number;

	constructor(
		@Inject("REDIS_CLIENT")
		private readonly redisClient: Redis,
		private readonly configService: ConfigService<AppConfig, true>,
	) {
		this.loremIpsumTtl = this.configService.get("databases.redis.ttls.loremIpsum", { infer: true });
	}

	private async lock(thingLockKey: string): Promise<LockThingResult> {
		/*
			This ensures that the lock is temporary and auto-clears if something
			goes wrong (like a crash)
		*/
		const result = await this.redisClient.set(
			thingLockKey,
			"LOREM_IPSUM_VALUE",
			/* TTL in seconds */
			"EX",
			/* Expire the key to avoid stale locks */
			this.loremIpsumTtl,
			/* Only set if key does Not eXist */
			"NX",
		);

		this.logger.debug("LOCKED_THING", {
			result,
		});

		return result;
	}

	public async unlock(thingLockKey: string): Promise<void> {
		await this.redisClient.del(thingLockKey);

		this.logger.debug("UNLOCKED_THING", { thingLockKey });
	}

	public async acquireLock(thingId: string): Promise<void> {
		const thingLockKey = `lock:thing:${thingId}`;

		const isThingLocked = await this.lock(thingLockKey);

		/* If Thing is already locked, abort the operation */
		if (!isThingLocked) {
			this.logger.error("THING_IS_ALREADY_LOCKED", {
				thingId,
				thingLockKey,
			});

			throw new Error("Thing is already locked");
		}
	}
}
