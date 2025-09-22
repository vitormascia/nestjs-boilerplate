import { Job } from "bullmq";

import {
	PlainProperties,
	StrictRequired,
} from "../../../helpers/types.helpers.js";
import { ThingEntity } from "../things.entity.js";
import { ThingJobData } from "./things.interfaces.js";

export type ThingJob = Job<ThingJobData, void, string>

export type Thing = Pick<ThingEntity, PlainProperties<ThingEntity>>

export type CreateThing = StrictRequired<
	Pick<Thing, "name" | "description">
>

export type UpdateThing = Partial<
	Pick<Thing, "name" | "description">
>

export type LockThingResult = "OK" | null;
