import { FastifyRequest } from "fastify";

import { User } from "../../middlewares/@types/middleware.types.js";

export type FilterRequest = FastifyRequest & {
	user?: User
}
