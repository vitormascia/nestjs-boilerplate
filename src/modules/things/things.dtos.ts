import { IsUUID } from "class-validator";

export class SubmitThingBodyDto {
	@IsUUID("all")
	thingId: string;
}
