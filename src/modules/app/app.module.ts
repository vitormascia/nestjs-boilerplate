import { BullModule } from "@nestjs/bullmq";
import { CacheModule } from "@nestjs/cache-manager";
import {
	MiddlewareConsumer,
	Module,
	NestModule,
} from "@nestjs/common";
import {
	ConfigModule,
	ConfigService,
} from "@nestjs/config";
import {
	APP_GUARD,
	APP_INTERCEPTOR,
} from "@nestjs/core";
import {
	seconds,
	ThrottlerGuard,
	ThrottlerModule,
} from "@nestjs/throttler";
import { TypeOrmModule } from "@nestjs/typeorm";
import ms from "ms";
import path from "path";

import time from "../../constants/time.constants.js";
import { TelemetryInterceptor } from "../../interceptors/telemetry.interceptors.js";
import { LoggerMiddleware } from "../../middlewares/logger.middlewares.js";
import { CacheManagerModule } from "../cache/cache_manager.module.js";
import { HealthModule } from "../health_check/health_check.module.js";
import { LoremsModule } from "../lorems/lorems.module.js";
import { RedisModule } from "../redis/redis.module.js";
import { ThingsModule } from "../things/things.module.js";
import { AppConfig } from "./@types/app.interfaces.js";
import configuration from "./app.configuration.js";

@Module({
	imports: [
		ConfigModule.forRoot({
			load: [configuration],
			envFilePath: [
				path.join(process.cwd(), ".env"),
			],
			isGlobal: true,
		}),
		CacheModule.registerAsync({
			isGlobal: true,
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (config: ConfigService<AppConfig, true>) => ({
				ttl: ms(`${config.get("app.cache.ttl", { infer: true })} Seconds`),
			}),
		}),
		CacheManagerModule,
		/*
			Single Throttler Definition
			Use @SkipThrottle() or @Throttle() decorators to change the behavior
		*/
		ThrottlerModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (config: ConfigService<AppConfig, true>) => ({
				throttlers: [
					{
						limit: config.get("app.throttler.limit", { infer: true }),
						ttl: seconds(config.get("app.throttler.ttl", { infer: true })),
					},
				],
			}),
		}),
		/*
			Multiple Throttler Definitions
			Use @SkipThrottle() or @Throttle() decorators to change the behavior
		*/
		// ThrottlerModule.forRoot([
		// 	/* No more than 3 calls in a second */
		// 	{
		// 		name: "short",
		// 		ttl: time.milliseconds.second,
		// 		limit: 3,
		// 	},
		// 	/* No more than 20 calls in 10 seconds */
		// 	{
		// 		name: "medium",
		// 		ttl: time.milliseconds.second * 10,
		// 		limit: 20,
		// 	},
		// 	/* No more than 100 calls in a minute */
		// 	{
		// 		name: "long",
		// 		ttl: time.milliseconds.second * 60,
		// 		limit: 100,
		// 	},
		// ]),
		TypeOrmModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (config: ConfigService<AppConfig, true>) => ({
				type: "postgres",
				host: config.get("databases.postgres.host", { infer: true }),
				port: config.get("databases.postgres.port", { infer: true }),
				username: config.get("databases.postgres.username", { infer: true }),
				password: config.get("databases.postgres.password", { infer: true }),
				database: config.get("databases.postgres.database", { infer: true }),
				entities: [
					path.join(process.cwd(), "build/modules/**/*.entity.js"),
					path.join(process.cwd(), "build/modules/**/entities/*.entity.js"),
				],
				connectTimeoutMS: time.milliseconds.second * 10,
				logNotifications: true,
				migrations: [
					path.join(process.cwd(), "build/migrations/**/*.js"),
				],
				migrationsRun: true,
				/*
					- Behavior: Each migration runs in its own transaction
					- Pros: Migrations can override transaction = false safely (which is needed for
					the creation of DB Indexes)
					- Cons: Partial changes if one migration fails (earlier ones aren’t rolled back)
				*/
				migrationsTransactionMode: "each",
				synchronize: !(config.get("app.environment", { infer: true }) === "production"),
				retryAttempts: 10,
				retryDelay: time.milliseconds.second * 3,
				autoLoadEntities: false,
				logging: true,
				logger: "advanced-console",
			}),
		}),
		BullModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (config: ConfigService<AppConfig, true>) => ({
				connection: {
					host: config.get("databases.redis.host", { infer: true }),
					port: config.get("databases.redis.port", { infer: true }),
				},
			}),
		}),
		LoremsModule,
		ThingsModule,
		HealthModule,
		RedisModule,
	],
	controllers: [],
	providers: [
		/* Binds CacheInterceptor to all endpoints globally */
		// {
		// 	provide: APP_INTERCEPTOR,
		// 	useClass: CacheInterceptor,
		// },
		{
			provide: APP_INTERCEPTOR,
			useClass: TelemetryInterceptor,
		},
		{
			provide: APP_GUARD,
			useClass: ThrottlerGuard,
		},
	],
	exports: [],
})
export class AppModule implements NestModule {
	public configure(consumer: MiddlewareConsumer): void {
		consumer
			.apply(LoggerMiddleware)
			.forRoutes("*");
	}
}
