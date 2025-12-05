export interface AppConfig {
	app: {
		port: number;
		name: string;
		environment: string;
		corsOrigin: string;
		throttler: {
			limit: number;
			ttl: number;
		};
		cache: {
			ttl: number;
		};
	};
	databases: {
		postgres: {
			host: string;
			port: number;
			username: string;
			password: string;
			database: string;
		};
		mongodb: {
			host: string;
			port: string;
			username: string;
			password: string;
			database: string;
		};
		redis: {
			host: string;
			port: number;
			ttls: {
				loremIpsum: number;
			};
		};
	};
	apis: {
		exampleAPI: {
			baseURL: string;
			key: string;
			requestTimeoutInSeconds: number;
		};
		buenroMaterialsAPI: {
			baseURL: string;
			requestTimeoutInMilliseconds: number;
			retryAttempts: number;
		};
	};
}
