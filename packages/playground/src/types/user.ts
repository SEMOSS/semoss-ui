import type { MetaMap } from "./metadata";

export type User = {
	userId: string;
	metaMap: MetaMap; // trusted user metadata
};
