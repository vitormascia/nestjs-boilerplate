import ms from "ms";

export function sleep(seconds: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms(`${seconds} Seconds`)));
}
