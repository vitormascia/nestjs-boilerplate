import {
	CanActivate,
	ExecutionContext,
	Injectable,
	Logger,
	UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { validate as isUUID } from "uuid";

import { ROLES_KEY } from "../decorators/roles.decorators.js";
import { LoremEntity } from "../modules/lorems/lorems.entity.js";
import { GuardRequest } from "./@types/guard.interfaces.js";
import { LoremRole } from "./@types/roles.enums.js";

@Injectable()
export class LoremRolesGuard implements CanActivate {
	private readonly logger = new Logger(this.constructor.name);

	constructor(
		private reflector: Reflector,
		@InjectRepository(LoremEntity)
		private readonly loremsRepository: Repository<LoremEntity>,
	) { }

	public async canActivate(context: ExecutionContext): Promise<boolean> {
		const req = context.switchToHttp().getRequest<GuardRequest>();

		this.logger.debug("FETCHING_USER_DATA_FROM_HEADERS", {
			request: {
				method: req.method,
				url: req.url,
				headers: req.headers,
				host: req.host,
				hostName: req.hostname,
				socket: {
					remoteAddress: req.socket.remoteAddress,
					remotePort: req.socket.remotePort,
				},
			},
		});

		const loremId = req.headers["user-id"];

		if (typeof loremId !== "string") {
			throw new UnauthorizedException("User-Id Header has to be set");
		}

		if (!isUUID(loremId)) {
			throw new UnauthorizedException("User-Id Header has to be a valid UUID");
		}

		const lorem = await this.loremsRepository.findOne({
			select: {
				id: true,
				roles: true,
			},
			where: {
				id: loremId,
			},
		});

		if (!lorem) {
			throw new UnauthorizedException("User-Id Header doesn’t reference a Lorem");
		}

		req.user = lorem;

		this.logger.debug("ATTACHED_USER_TO_REQUEST", {
			request: {
				user: req.user,
				method: req.method,
				url: req.url,
				headers: req.headers,
				host: req.host,
				hostName: req.hostname,
				socket: {
					remoteAddress: req.socket.remoteAddress,
					remotePort: req.socket.remotePort,
				},
			},
		});

		const requiredRoles = this.reflector.getAllAndOverride<Array<LoremRole>>(ROLES_KEY, [
			context.getHandler(),
			context.getClass(),
		]);

		const loremHasRequiredRoles = requiredRoles.some((role) => lorem.roles.includes(role));

		this.logger.debug("ROLES_GUARD_RESULT", {
			request: {
				user: req.user,
				method: req.method,
				url: req.url,
				headers: req.headers,
				host: req.host,
				hostName: req.hostname,
				socket: {
					remoteAddress: req.socket.remoteAddress,
					remotePort: req.socket.remotePort,
				},
			},
			requiredRoles,
			loremHasRequiredRoles,
		});

		return loremHasRequiredRoles;
	}
}
