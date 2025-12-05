import helmet from "@fastify/helmet";
import {
	ConsoleLogger,
	Logger,
	NestApplicationOptions,
	ValidationPipe,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from "@nestjs/swagger";

import { COMMA } from "./constants/symbols.constants.js";
import { HttpExceptionFilter } from "./filters/http_exception.filters.js";
import { AppConfig } from "./modules/app/@types/app.interfaces.js";
import { AppModule } from "./modules/app/app.module.js";
import { TrimPipe } from "./pipes/trim.pipes.js";
import { normalizeError } from "./utils/error.utils.js";

async function bootstrap(): Promise<void> {
	const fastifyAdapter = new FastifyAdapter({
		logger: true,
		trustProxy: true,
		maxParamLength: 200,
	});

	const options: NestApplicationOptions = {
		rawBody: true,
		logger: new ConsoleLogger({
			logLevels: [
				"debug",
				"log",
				"verbose",
				"warn",
				"error",
				"fatal",
			],
			prefix: "NestJSBoilerplate",
			timestamp: true,
			colors: true,
			sorted: true,
		}),
	};

	const app = await NestFactory.create<NestFastifyApplication>(
		AppModule,
		fastifyAdapter,
		options,
	);

	app.useGlobalFilters(new HttpExceptionFilter());

	app.useGlobalPipes(new ValidationPipe({
		whitelist: true,
		transform: true,
	}));
	app.useGlobalPipes(new TrimPipe());

	const configService = app.get<ConfigService<AppConfig, true>>(ConfigService);

	const corsOrigin = configService.get("app.corsOrigin", { infer: true });

	app.enableCors({
		origin: corsOrigin.split(COMMA),
		methods: [
			"GET",
			"POST",
			"PUT",
			"PATCH",
			"DELETE",
			"OPTIONS",
		],
		credentials: true,
	});

	/*
		When using Fastify and Helmet, there may be a problem with CSP, to solve this collision,
		configure the CSP as shown below
	*/
	await app.register(helmet, {
		contentSecurityPolicy: {
			directives: {
				defaultSrc: ["'self'"],
				styleSrc: ["'self'", "'unsafe-inline'"],
				imgSrc: ["'self'", "data:", "validator.swagger.io"],
				scriptSrc: ["'self'", "https: 'unsafe-inline'"],
			},
		},
	});

	const config = new DocumentBuilder()
		.setTitle("NestJS Boilerplate")
		.setDescription("Ready-to-use NestJS boilerplate")
		.setVersion("1.0.0")
		.build();
	const documentFactory = (): OpenAPIObject => SwaggerModule.createDocument(
		app,
		config,
		{
			deepScanRoutes: true,
			autoTagControllers: true,
		},
	);

	SwaggerModule.setup(
		"/api",
		app,
		documentFactory,
		{
			ui: true,
			explorer: true,
			customSiteTitle: "NestJS Boilerplate",
			jsonDocumentUrl: "/swagger/json",
			raw: ["json"],
		},
	);

	const appConfig = {
		name: configService.get("app.name", { infer: true }),
		port: configService.get("app.port", { infer: true }),
		environment: configService.get("app.environment", { infer: true }),
		corsOrigin,
		throtller: {
			limit: configService.get("app.throttler.limit", { infer: true }),
			ttl: configService.get("app.throttler.ttl", { infer: true }),
		},
		cache: {
			ttl: configService.get("app.cache.ttl", { infer: true }),
		},
	};
	const postgresConfig = {
		host: configService.get("databases.postgres.host", { infer: true }),
		port: configService.get("databases.postgres.port", { infer: true }),
		username: configService.get("databases.postgres.username", { infer: true }),
		password: configService.get("databases.postgres.password", { infer: true }),
		database: configService.get("databases.postgres.database", { infer: true }),
	};
	const mongoDbConfig = {
		host: configService.get("databases.mongodb.host", { infer: true }),
		port: configService.get("databases.mongodb.port", { infer: true }),
		username: configService.get("databases.mongodb.username", { infer: true }),
		password: configService.get("databases.mongodb.password", { infer: true }),
		database: configService.get("databases.mongodb.database", { infer: true }),
	};
	const redisConfig = {
		host: configService.get("databases.redis.host", { infer: true }),
		port: configService.get("databases.redis.port", { infer: true }),
		ttls: {
			loremIpsum: configService.get("databases.redis.ttls.loremIpsum", { infer: true }),
		},
	};
	const exampleAPIConfig = {
		baseURL: configService.get("apis.exampleAPI.baseURL", { infer: true }),
		key: configService.get("apis.exampleAPI.key", { infer: true }),
		requestTimeoutInSeconds: configService.get("apis.exampleAPI.requestTimeoutInSeconds", { infer: true }),
	};
	const buenroMaterialsAPIConfig = {
		baseURL: configService.get("apis.buenroMaterialsAPI.baseURL", { infer: true }),
		requestTimeoutMs: configService.get("apis.buenroMaterialsAPI.requestTimeoutInMilliseconds", { infer: true }),
		retryAttempts: configService.get("apis.buenroMaterialsAPI.retryAttempts", { infer: true }),
	};

	const logger = new Logger("AppBootstrap");

	try {
		await app.listen(appConfig.port);

		logger.debug("RUNNING_APP", {
			app: appConfig,
			databases: {
				postgres: postgresConfig,
				mongodb: mongoDbConfig,
				redis: redisConfig,
			},
			apis: {
				exampleAPI: exampleAPIConfig,
				buenroMaterialsAPI: buenroMaterialsAPIConfig,
			},
		});
	} catch (error: any) {
		logger.error("BOOTSTRAP_APP_ERROR", {
			app: appConfig,
			databases: {
				postgres: postgresConfig,
				mongodb: mongoDbConfig,
				redis: redisConfig,
			},
			apis: {
				exampleAPI: exampleAPIConfig,
				buenroMaterialsAPI: buenroMaterialsAPIConfig,
			},
			error: normalizeError(error),
		});

		process.exit(1);
	}

	const gracefulShutdown = async (): Promise<void> => {
		try {
			logger.debug("SHUTTING_DOWN_SERVER");

			await app.close();

			process.exit(0);
		} catch (error: any) {
			logger.error("SHUTTING_DOWN_SERVER_ERROR", {
				error: normalizeError(error),
			});

			process.exit(1);
		}
	};

	/* Listen for termination signal (e.g., `kill` command) */
	process.on("SIGTERM", gracefulShutdown);
	/* Listen for interrupt signal (e.g., Ctrl+C in terminal) */
	process.on("SIGINT", gracefulShutdown);
}

void bootstrap();
