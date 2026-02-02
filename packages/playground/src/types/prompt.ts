import type { MetaMap } from "./metadata";

export type Prompt = {
	ID: string;
	TITLE: string;
	CONTEXT?: string;
	INTENT?: string;
	TAGS?: string[];
	CREATED_BY: string;
	GLOBAL: boolean;
	metaMap?: MetaMap; // missing/empty => public (for GLOBAL prompts)
};
