import { BullModule } from "@nestjs/bullmq";
import { CacheModule } from "@nestjs/cache-manager";
import {
	Logger,
	MiddlewareConsumer,
	Module,
	NestModule,
} from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { MongooseModule, MongooseModuleOptions } from "@nestjs/mongoose";
import { ScheduleModule } from "@nestjs/schedule";
import { seconds, ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Connection } from "mongoose";
import ms from "ms";
import path from "path";

import { EMPTY_STRING } from "../../constants/symbols.constants.js";
import time from "../../constants/time.constants.js";
import { TelemetryInterceptor } from "../../interceptors/telemetry.interceptors.js";
import { LoggerMiddleware } from "../../middlewares/logger.middlewares.js";
import { BuenroModule } from "../buenro/buenro.module.js";
import { CacheManagerModule } from "../cache/cache_manager.module.js";
import { HarvesterModule } from "../harvester/harvester.module.js";
import { HealthModule } from "../health_check/health_check.module.js";
import { JobsModule } from "../jobs/jobs.module.js";
import { LoremsModule } from "../lorems/lorems.module.js";
import { RedisModule } from "../redis/redis.module.js";
import { StaysModule } from "../stays/stays.module.js";
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
		MongooseModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (config: ConfigService<AppConfig, true>): MongooseModuleOptions => {
				const username = config.get("databases.mongodb.username", { infer: true });
				const password = config.get("databases.mongodb.password", { infer: true });
				const host = config.get("databases.mongodb.host", { infer: true });
				const port = config.get("databases.mongodb.port", { infer: true });
				const database = config.get("databases.mongodb.database", { infer: true });
				const authentication = username && password
					? `${username}:${password}@`
					: EMPTY_STRING;
				const uri = `mongodb://${authentication}${host}:${port}/${database}`;

				return {
					uri,
					onConnectionCreate: (connection: Connection): Connection => {
						const logger = new Logger("MongooseConnectionEvents");

						/* Triggered when the connection is successfully established */
						connection.on("connected", () => logger.debug("MONGOOSE_CONNECTION_ON::CONNECTED"));
						/* Fires when the connection is fully opened and ready for operations */
						connection.on("open", () => logger.debug("MONGOOSE_CONNECTION_ON::OPEN"));
						/* Called when the connection is lost */
						connection.on("disconnected", () => logger.debug("MONGOOSE_CONNECTION_ON::DISCONNECTED"));
						/* Invoked when the connection is re-established after being disconnected */
						connection.on("reconnected", () => logger.debug("MONGOOSE_CONNECTION_ON::RECONNECTED"));
						/* Occurs when the connection is in the process of closing */
						connection.on("disconnecting", () => logger.debug("MONGOOSE_CONNECTION_ON::DISCONNECTING"));

						return connection;
					},
					/* RELIABILITY & FAILOVER */
					/*
						How long the driver waits to find a server before erroring.
						Default is 30000 (30s). Lower this to 5000ms (5s) to fail fast
						in microservices/Kubernetes so pods restart quickly rather than hang.
					*/
					serverSelectionTimeoutMS: 5000,
					/*
						Close sockets after inactivity to prevent "hanging" connections
						behind load balancers/firewalls.
					*/
					socketTimeoutMS: 45000,
					/*
						Force IPv4. In many containerized envs (Docker/K8s), IPv6 lookup
						delays can cause connection timeouts.
					*/
					family: 4,
					/* PERFORMANCE & POOLING */
					/* Maintain a minimum number of connections to avoid "cold start" latency. */
					minPoolSize: 10,
					/*
						Cap the pool to prevent one instance from overwhelming the DB.
						Default is 100. Adjust based on your instance count
						(e.g. 4 instances * 50 = 200 connections).
					*/
					maxPoolSize: 100,
					/*
						Turn OFF automatic index creation in production.
						Index builds can lock collections and slow down startup.
						deployment scripts or migrations should handle indexing.
					*/
					autoIndex: true,
					/* DATA SAFETY & CONSISTENCY */
					/*
						Ensure writes are acknowledged by the majority of replica set members.
						Crucial for data durability (prevents rollbacks during failovers).
					*/
					w: "majority",
					/* NESTJS SPECIFIC OPTIONS (NOT MONGOOSE DRIVER OPTIONS) */
					/* These control how NestJS handles the initial connection attempt. */
					retryAttempts: 5,
					retryDelay: 1000,
				};
			},
			inject: [ConfigService],
		}),
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
		ScheduleModule.forRoot(),
		JobsModule,
		LoremsModule,
		ThingsModule,
		HarvesterModule,
		StaysModule,
		BuenroModule,
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
