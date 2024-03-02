import { NotImplementedError } from "Utils";
import { BaseRole } from "./_base.ts";
import { registerRole } from "./_util.ts";

declare global {
	interface AllRoles {
		[RoleClaim.NAME]: typeof RoleClaim;
	}
}

export namespace RoleClaim {
	export interface Memory {
		readonly room: Room["name"];
	}

	export type Creep = BaseCreep<Memory>
}

export class RoleClaim extends BaseRole {
	public static readonly NAME: "claim" = "claim";

	public static spawn(spawn: StructureSpawn): StructureSpawn.SpawnCreepReturnType {
		throw new NotImplementedError(`${this}.spawn`);
	}

	public static execute(creep: RoleClaim.Creep): ScreepsReturnCode {
		throw new NotImplementedError(`${this}.execute(${creep})`);
	}
}

registerRole(RoleClaim.NAME);
