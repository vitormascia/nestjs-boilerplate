import { Lorem } from "./lorems.types.js";

export interface Something {
	size: number;
	lorems: Array<Pick<Lorem, "id" | "name">>
}
