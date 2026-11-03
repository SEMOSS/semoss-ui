import type {
	RoomMcpEntry,
	RoomOptionsMap,
	RoomSkillReference,
} from "@/api/rooms";

/** Restore editable room tools from mcp, excluding the current workbench defaults. */
export const readRoomResources = (
	options: RoomOptionsMap | null,
	baseMcp: RoomMcpEntry[] = [],
): {
	customMcp: RoomMcpEntry[];
	customSkills: RoomSkillReference[];
} => ({
	customMcp: Array.isArray(options?.mcp)
		? [
				...new Map(
					options.mcp
						.filter(
							(item) =>
								item &&
								typeof item.id === "string" &&
								typeof item.name === "string" &&
								typeof item.type === "string" &&
								!baseMcp.some((base) => base.id === item.id),
						)
						.map((item) => [item.id, { ...item }]),
				).values(),
			]
		: [],
	customSkills: Array.isArray(options?.skills)
		? options.skills
				.filter((item) => item && typeof item.skill_id === "string")
				.map((item) => ({ ...item }))
		: [],
});

/** Assemble additions without replacing unrelated room options or base tools. */
export const assembleRoomResources = (
	options: RoomOptionsMap | null,
	mcp: RoomMcpEntry[],
	customMcp: RoomMcpEntry[],
	customSkills: RoomSkillReference[],
): RoomOptionsMap => ({
	...options,
	mcp: [
		...new Map(
			[
				...mcp,
				...customMcp.filter(
					(entry) => !mcp.some((base) => base.id === entry.id),
				),
			].map((entry) => [entry.id, { ...entry }]),
		).values(),
	],
	skills: [
		...new Map(
			customSkills.map((entry) => [entry.skill_id, { ...entry }]),
		).values(),
	],
});
