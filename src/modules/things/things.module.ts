import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import time from "../../constants/time.constants.js";
import { QueueName } from "../app/@types/queues.enums.js";
import { LoremsModule } from "../lorems/lorems.module.js";
import { RedisModule } from "../redis/redis.module.js";
import { ThingLocksService } from "./locks.service.js";
import { ThingsConsumer } from "./things.consumer.js";
import { ThingsController } from "./things.controller.js";
import { ThingEntity } from "./things.entity.js";
import { ThingsService } from "./things.service.js";

const ThingsQueueDynamicModule = BullModule.registerQueue({
	name: QueueName.Things,
	defaultJobOptions: {
		attempts: 3,
		backoff: {
			type: "exponential",
			delay: time.milliseconds.second / 2,
			/*
				Jitter introduces random variance to the retry delay. Instead of all retries
				happening at exact intervals (which can overwhelm the system), it adds noise
				to spread them out. This is crucial in systems with high concurrency + backoff,
				preventing the so-called [Thundering herd problem](https://en.wikipedia.org/wiki/Thundering_herd_problem)

				TL;DR
				Adds 30% randomness to retry delays to prevent retry storms and balance load
			*/
			jitter: 0.3,
		},
		removeOnComplete: {
			age: time.seconds.day * 2,
		},
		removeOnFail: {
			age: time.seconds.day * 15,
		},
	},
});

@Module({
	imports: [
		TypeOrmModule.forFeature([
			ThingEntity,
		]),
		ThingsQueueDynamicModule,
		RedisModule,
		LoremsModule,
	],
	controllers: [ThingsController],
	providers: [
		ThingsService,
		ThingLocksService,
		ThingsConsumer,
	],
	exports: [
		TypeOrmModule,
		ThingsService,
		ThingLocksService,
	],
})
export class ThingsModule { }
