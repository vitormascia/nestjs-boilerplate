import { FastifyRequest } from "fastify";

import { User } from "../../middlewares/@types/middleware.types.js";

export type InterceptorRequest = FastifyRequest & {
	user?: User;
}
