import { Controller, Get } from "@nestjs/common";
import {
	HealthCheck,
	HealthCheckResult,
	HealthCheckService,
	HealthIndicatorResult,
	HttpHealthIndicator,
	MongooseHealthIndicator,
	TypeOrmHealthIndicator,
} from "@nestjs/terminus";

@Controller("/health")
export class HealthController {
	constructor(
		private health: HealthCheckService,
		private http: HttpHealthIndicator,
		private typeORM: TypeOrmHealthIndicator,
		private mongoose: MongooseHealthIndicator,
	) { }

	@Get()
	@HealthCheck()
	public check(): Promise<HealthCheckResult> {
		return this.health.check([
			(): Promise<HealthIndicatorResult<string>> => this.http.pingCheck("nestjs-docs", "https://docs.nestjs.com"),
			(): Promise<HealthIndicatorResult<string>> => this.typeORM.pingCheck("typeORM"),
			(): Promise<HealthIndicatorResult<string>> => this.mongoose.pingCheck("mongoose"),
		]);
	}
}
