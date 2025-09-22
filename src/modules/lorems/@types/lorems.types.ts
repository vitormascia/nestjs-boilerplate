import { PlainProperties } from "../../../helpers/types.helpers.js";
import { LoremEntity } from "../lorems.entity.js";

export type Lorem = Pick<LoremEntity, PlainProperties<LoremEntity>>;
