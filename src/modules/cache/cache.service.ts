import {
	Cache,
	CACHE_MANAGER,
} from "@nestjs/cache-manager";
import {
	Inject,
	Injectable,
	Logger,
} from "@nestjs/common";
import ms from "ms";

import { EMPTY_STRING } from "../../constants/symbols.constants.js";

@Injectable()
export class CacheService {
	private readonly logger = new Logger(this.constructor.name);

	constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) { }

	public async get<TValue>(key: string): Promise<TValue | undefined> {
		const value = await this.cacheManager.get<TValue>(key);

		if (!value) {
			this.logger.warn("CACHE_NOT_FOUND", { key });

			return value;
		}

		this.logger.debug("FOUND_CACHE", {
			key,
			value,
		});

		return value;
	}

	public async set<TValue>(key: string, value: TValue, ttlInSeconds: number): Promise<TValue> {
		const _value = await this.cacheManager.set(key, value, ms(`${ttlInSeconds} Seconds`));

		const cacheHasNoExpiration = ttlInSeconds === 0;

		this.logger.debug(`SET_CACHE${cacheHasNoExpiration ? "::NO_EXPIRATION" : EMPTY_STRING}`, {
			key,
			value: _value,
			ttlInSeconds,
		});

		return _value;
	}

	public async delete(key: string): Promise<boolean> {
		const deleteOutcome = await this.cacheManager.del(key);

		if (!deleteOutcome) {
			this.logger.warn("CACHE_NOT_FOUND", { key });

			return deleteOutcome;
		}

		this.logger.debug("DELETED_CACHE", { key });

		return deleteOutcome;
	}

	public async clear(): Promise<void> {
		await this.cacheManager.clear();

		this.logger.debug("CLEARED_CACHE");
	}
}
