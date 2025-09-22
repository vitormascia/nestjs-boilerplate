import { FastifyRequest } from "fastify";

import { User } from "../../middlewares/@types/middleware.types.js";

export type GuardRequest = FastifyRequest & {
	user?: User
}
