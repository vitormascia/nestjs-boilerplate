import { Err } from "./@types/util.types";

export function normalizeError(error: any): Err | Pick<Err, "message"> {
	return error instanceof Error
		? {
			cause: error.cause,
			message: error.message,
			name: error.name,
			stack: error.stack,
		}
		: { message: String(error) };
}
