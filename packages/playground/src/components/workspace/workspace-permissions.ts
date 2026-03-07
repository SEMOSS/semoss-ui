import type { Role } from "@semoss/shared";

export interface ProjectDependency {
	engine_type:
		| "PROJECT"
		| "STORAGE"
		| "DATABASE"
		| "FUNCTION"
		| "MODEL"
		| "VECTOR";
	engine_id: string;
	engine_name: string;
	description?: string;
	engine_discoverable?: boolean;
	permission_name?: Role;
	engine_global?: boolean;
	access_permission?: number;
	tags: string; // comma separated tags
}

export type EffectivePermission =
	| Role
	| "REQUESTED"
	| "DISCOVERABLE"
	| "FULLY_PRIVATE";

export const PERMISSION_VARIANT: Record<
	EffectivePermission,
	"default" | "secondary" | "outline" | "destructive"
> = {
	OWNER: "default",
	EDIT: "secondary",
	READ_ONLY: "outline",
	REQUESTED: "outline",
	DISCOVERABLE: "outline",
	FULLY_PRIVATE: "destructive",
};
