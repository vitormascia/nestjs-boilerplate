import { Logger } from "@nestjs/common";
import got, { ExtendOptions, Got } from "got";

export abstract class GotClient {
	protected readonly logger = new Logger(this.constructor.name);
	protected readonly gotInstance: Got<ExtendOptions>;

	constructor(options: ExtendOptions) {
		this.gotInstance = got.extend(options);
	}
}
