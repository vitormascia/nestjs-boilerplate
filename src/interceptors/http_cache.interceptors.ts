import {
	CACHE_KEY_METADATA,
	CacheInterceptor,
} from "@nestjs/cache-manager";
import {
	ExecutionContext,
	Injectable,
	Logger,
} from "@nestjs/common";

import { InterceptorRequest } from "./@types/interceptor.interfaces.js";

@Injectable()
export class HttpCacheInterceptor extends CacheInterceptor {
	private readonly logger = new Logger(this.constructor.name);

	trackBy(context: ExecutionContext): string | undefined {
		const req = context.switchToHttp().getRequest<InterceptorRequest>();

		this.logger.debug("INCOMMING_REQUEST", {
			request: {
				user: req.user,
				method: req.method,
				url: req.url,
				headers: req.headers,
				host: req.host,
				hostName: req.hostname,
				socket: {
					remoteAddress: req.socket.remoteAddress,
					remotePort: req.socket.remotePort,
				},
			},
		});

		const cacheKey = this.reflector.get<string | undefined>(CACHE_KEY_METADATA, context.getHandler()) ?? `${req.method}${req.url}`;

		const userId = req.headers["user-id"];

		const userCacheKey = `${cacheKey}_${userId}`;

		this.logger.debug("BUILT_USER_CACHE_KEY", {
			userCacheKey,
		});

		return userCacheKey;
	}
}
