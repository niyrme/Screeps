import { RoleBuild, RoleDefend, RoleHarvest, RoleHaul, RoleManage, RoleMine, RoleRepair, RoleUpgrade } from "Creep";

export function roomHandlerSpawning(room: Room) {
	if (!room.controller?.my) { return; }
	const spawns = room.find(FIND_MY_SPAWNS, {
		filter: s => !s.spawning,
	});

	if (spawns.length === 0) { return; }

	const creeps = _.filter(Game.creeps, c => c.memory.home === room.name);

	if (creeps.length === 0) {
		for (const spawn of spawns) {
			RoleHarvest.spawn(spawn);
		}
		return;
	}

	function handleSpawnError(err: StructureSpawn.SpawnCreepReturnType, shiftOnNoEnergy = false) {
		switch (err) {
			case OK:
				spawns.shift();
				break;
			case ERR_NOT_ENOUGH_RESOURCES:
				shiftOnNoEnergy && spawns.shift();
				break;
		}
		return err;
	}

	if (room.memory.attackTargets.length !== 0) {
		const defenders = creeps.filter((c): c is RoleDefend.Creep => c.decodeName().role === RoleDefend.NAME);

		for (let i = defenders.length; i < room.memory.attackTargets.length * 1.5; i++) {
			if (spawns.length === 0) { return; }
			handleSpawnError(RoleDefend.spawn(spawns[0]), true);
		}
	}

	const minerCount = creeps.filter(c => c.decodeName().role === RoleMine.NAME).length;
	for (const sourceID of Object.keys(room.memory.resources.energy)) {
		if (spawns.length === 0) { return; }

		const source = Game.getObjectById(sourceID)!;

		const miner = _.find(creeps, creep => {
			switch (creep.decodeName().role) {
				case RoleMine.NAME:
					return (creep as RoleMine.Creep).memory.source === source.id;
				default:
					return false;
			}
		});

		if (!miner) {
			const [link] = source.pos.findInRange(FIND_MY_STRUCTURES, 2, {
				filter: s => s.structureType === STRUCTURE_LINK,
			}) as Array<StructureLink>;

			handleSpawnError(
				RoleMine.spawn(spawns[0], {
					source: source.id,
					minerRole: (!!link) ? "link" : "drop",
					// @ts-ignore
					link: link ? link.id : undefined,
				}),
				true,
			);
		}
	}

	const haulers = creeps.filter((c): c is RoleHaul.Creep => c.decodeName().role === RoleHaul.NAME);
	for (let i = haulers.length; i < minerCount; i++) {
		if (spawns.length === 0) { return; }
		handleSpawnError(RoleHaul.spawn(spawns[0], haulers.length === 0), haulers.length === 0);
	}

	const hasHandler = creeps.filter((c): c is RoleManage.Creep => c.decodeName().role === RoleManage.NAME).length !== 0;
	if (!hasHandler) {
		if (spawns.length === 0) { return; }
		handleSpawnError(RoleManage.spawn(spawns[0]), true);
	}

	const upgraders = creeps.filter((c): c is RoleUpgrade.Creep => c.decodeName().role === RoleUpgrade.NAME);
	for (let i = upgraders.length; i < Math.clamp(9 - room.controller.level, 1, 3); i++) {
		if (spawns.length === 0) { return; }
		handleSpawnError(RoleUpgrade.spawn(spawns[0], room.controller));
	}

	if (spawns.length === 0) { return; }

	if (room.find(FIND_MY_STRUCTURES, { filter: s => s.structureType === STRUCTURE_TOWER }).length !== 0) {
		const repairers = creeps.filter((c): c is RoleRepair.Creep => c.decodeName().role === RoleRepair.NAME);
		if (repairers.length < 1) {
			handleSpawnError(RoleRepair.spawn(spawns[0]));
		}
	} else {
		const damagedStructures = room.getDamagedStructures();
		if (damagedStructures.length !== 0) {
			const repairers = creeps.filter((c): c is RoleRepair.Creep => c.decodeName().role === RoleRepair.NAME);
			for (
				let i = repairers.length;
				i < Math.clamp(Math.floor(Math.sqrt(damagedStructures.length)), 0, 3);
				i++
			) {
				if (spawns.length === 0) { return; }
				handleSpawnError(RoleRepair.spawn(spawns[0]));
			}
		}
	}

	if (spawns.length === 0) { return; }

	const constructionSites = room.getConstructionSites();
	if (constructionSites.length !== 0) {
		const builders = creeps.filter((c): c is RoleBuild.Creep => c.decodeName().role === RoleBuild.NAME);
		const constructionCost = constructionSites.reduce((cost, site) => cost + site.progressTotal - site.progress, 0);
		for (
			let i = builders.length;
			i < Math.clamp(Math.floor(Math.sqrt(constructionCost / 1000)), 1, 3);
			i++
		) {
			if (spawns.length === 0) { return; }
			handleSpawnError(RoleBuild.spawn(spawns[0]));
		}
	}
}
