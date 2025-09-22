import {
	CustomDecorator,
	SetMetadata,
} from "@nestjs/common";

import { LoremRole } from "../guards/@types/roles.enums.js";

export const ROLES_KEY = "roles";

export const Roles =
	(...roles: Array<LoremRole>): CustomDecorator<string> => SetMetadata(ROLES_KEY, roles);
