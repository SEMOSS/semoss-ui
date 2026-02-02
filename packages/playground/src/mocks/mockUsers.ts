import type { User } from "../types/user";

export const MOCK_USERS: User[] = [
	{ userId: "user-abc-it", metaMap: { office: ["ABC"], department: ["IT"] } },
	{ userId: "user-def-hr", metaMap: { office: ["DEF"], department: ["HR"] } },
	{
		userId: "user-multi",
		metaMap: { office: ["ABC", "GHI"], department: ["Finance"] },
	},
	{ userId: "user-no-meta", metaMap: {} },
];
