import {
	OnWorkerEvent,
	Processor,
	WorkerHost,
} from "@nestjs/bullmq";
import {
	Injectable,
	Logger,
} from "@nestjs/common";
import { InjectEntityManager } from "@nestjs/typeorm";
import { EntityManager } from "typeorm";
import { IsolationLevel } from "typeorm/driver/types/IsolationLevel.js";

import { QueueName } from "../app/@types/queues.enums.js";
import { ThingJob } from "./@types/things.types.js";
import { ThingLocksService } from "./locks.service.js";
import { ThingsService } from "./things.service.js";

/* Allows up to 10 Things to be processed in parallel */
@Processor(QueueName.Things, { concurrency: 10 })
@Injectable()
export class ThingsConsumer extends WorkerHost {
	private readonly logger = new Logger(this.constructor.name);

	constructor(
		@InjectEntityManager()
		private readonly entityManager: EntityManager,
		private readonly thingsService: ThingsService,
		private readonly thingLocksService: ThingLocksService,
	) {
		super();
	}

	private logJob(
		message: string,
		job: ThingJob,
		logLevel: "debug" | "warn" | "error",
		metadata?: Record<string, any>,
	): void {
		this.logger[logLevel](message, {
			job: {
				id: job.id,
				name: job.name,
				data: job.data,
				attemptsMade: job.attemptsMade,
				attemptsStarted: job.attemptsStarted,
				deduplicationId: job.deduplicationId,
				deferredFailure: job.deferredFailure,
				delay: job.delay,
				failedReason: job.failedReason,
				finishedOn: job.finishedOn,
				nextRepeatableJobId: job.nextRepeatableJobId,
				opts: job.opts,
				parent: job.parent,
				parentKey: job.parentKey,
				prefix: job.prefix,
				priority: job.priority,
				processedBy: job.processedBy,
				processedOn: job.processedOn,
				progress: job.progress,
				queueName: job.queueName,
				queueQualifiedName: job.queueQualifiedName,
				repeatJobKey: job.repeatJobKey,
				returnvalue: job.returnvalue,
				stacktrace: job.stacktrace,
				stalledCounter: job.stalledCounter,
				timestamp: job.timestamp,
				token: job.token,
			},
			metadata,
		});
	}

	public async process(job: ThingJob): Promise<void> {
		const { thingId } = job.data;

		const isolationLevel: IsolationLevel = "READ COMMITTED";

		await this.entityManager.transaction(
			isolationLevel,
			async (transactionalEntityManager): Promise<void> => {
				await this.thingsService.create(
					{
						name: "Lorem Ipsum",
						description: `My ID is ${thingId}`,
					},
					transactionalEntityManager,
				);
			},
		);
	}

	@OnWorkerEvent("active")
	public onActive(job: ThingJob, prev: string): void {
		this.logJob("JOB::ON_ACTIVE", job, "debug", { prev });
	}

	@OnWorkerEvent("closed")
	public onClosed(): void {
		this.logger.warn("QUEUE::ON_CLOSED");
	}

	@OnWorkerEvent("closing")
	public onClosing(message: string): void {
		this.logger.warn("QUEUE::ON_CLOSING", { message });
	}

	@OnWorkerEvent("completed")
	public async onCompleted(job: ThingJob, result: void, prev: string): Promise<void> {
		this.logJob("JOB::ON_COMPLETED", job, "debug", {
			result,
			prev,
		});

		const { thingId } = job.data;

		const thingLockKey = `lock:thing:${thingId}`;

		await this.thingLocksService.unlock(thingLockKey);
	}

	@OnWorkerEvent("drained")
	public onDrained(): void {
		this.logger.debug("QUEUE::ON_DRAINED");
	}

	@OnWorkerEvent("error")
	public onError(failedReason: Error): void {
		this.logger.error("QUEUE::ON_ERROR", { failedReason });
	}

	@OnWorkerEvent("failed")
	public async onFailed(job: ThingJob, error: Error, prev: string): Promise<void> {
		this.logJob("JOB::ON_FAILED", job, "error", {
			prev,
			error: {
				message: error.message,
				stack: error.stack,
			},
		});

		const { thingId } = job.data;

		const thingLockKey = `lock:thing:${thingId}`;

		await this.thingLocksService.unlock(thingLockKey);
	}

	@OnWorkerEvent("paused")
	public onPaused(): void {
		this.logger.warn("QUEUE::ON_PAUSED");
	}

	@OnWorkerEvent("progress")
	public onProgress(job: ThingJob, progress: number | object): void {
		this.logJob("JOB::ON_PROGRESS", job, "debug", { progress });
	}

	@OnWorkerEvent("ready")
	public onReady(): void {
		this.logger.debug("QUEUE::ON_READY");
	}

	@OnWorkerEvent("resumed")
	public onResumed(): void {
		this.logger.debug("QUEUE::ON_RESUMED");
	}

	@OnWorkerEvent("stalled")
	public onStalled(jobId: string, prev: string): void {
		this.logger.warn("JOB::ON_STALLED", {
			jobId,
			prev,
		});
	}

	@OnWorkerEvent("ioredis:close")
	public onRedisClose(): void {
		this.logger.warn("REDIS::ON_CLOSE");
	}
}
