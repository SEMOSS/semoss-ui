// Engine dependencies types (moved from utility/types.ts)
export interface EngineFile {
	filename: string;
	instances: string | number;
}

export interface EngineData {
	engineName?: string;
	files?: EngineFile[];
}

// Project Dependencies Engine Data (from GetProjectDependencies pixel)
export interface ProjectDependencyEngine {
	engine_id: string;
	engine_name: string;
	engine_type: string;
	engine_subtype: string;
	engine_date_created: string;
	engine_discoverable: boolean;
	engine_global: boolean;
}

// User interface for settings and member management
export interface User {
	id: string;
	type: string;
	name: string;
	email: string;
	permission_granted_by_type: string;
	permission_granted_by: string;
	permission: string;
	date_added: string;
	usage_restriction?: string;
	usage_frequency?: string;
	max_tokens?: number;
	max_response_time?: number;
}

export interface EngineDependenciesResponse {
	success?: Record<string, EngineData>;
	failed?: Record<string, EngineData>;
}

export interface EngineInfo {
	name: string;
	files: string[];
	instances: (string | number)[];
}

export interface EngineDependenciesState {
	successfulEngineIds: string[];
	failedEngineIds: string[];
	engineDetails: Record<string, EngineInfo>;
}
export type Role =
	| "OWNER"
	| "EDIT"
	| "VIEWER"
	| "READ_ONLY"
	| "DISCOVERABLE"
	| "EDITOR";

export interface PixelCommand {
	type: string;
	components: unknown[];
	terminal?: boolean;
	meta?: boolean;
}

/**
 * All types used in the app
 */
export type ALL_TYPES = ENGINE_TYPES | "PROJECT";

/**
 * Engine types used in the app
 */
export type ENGINE_TYPES =
	| "DATABASE"
	| "STORAGE"
	| "MODEL"
	| "VECTOR"
	| "FUNCTION"
	| "GUARDRAIL";

export type Join<K, P> = K extends string | number
	? P extends string | number
		? `${K}${"" extends P ? "" : "."}${P}`
		: never
	: never;

export type Idx<T, K> = K extends keyof T
	? T[K]
	: number extends keyof T
		? K extends `${number}`
			? T[number]
			: never
		: never;

export type Prev = [
	never,
	0,
	1,
	2,
	3,
	4,
	5,
	6,
	7,
	8,
	9,
	10,
	11,
	12,
	13,
	14,
	15,
	16,
	17,
	18,
	19,
	20,
	...0[],
];

export type Paths<T, D extends number = 10> = [D] extends [never]
	? never
	: T extends object
		? {
				[K in keyof T]-?: K extends string | number
					? `${K}` | Join<K, Paths<T[K], Prev[D]>>
					: never;
			}[keyof T]
		: "";

export type PathValue<
	T,
	P extends Paths<T, 4>,
> = P extends `${infer Key}.${infer Rest}`
	? Rest extends Paths<Idx<T, Key>, 4>
		? PathValue<Idx<T, Key>, Rest>
		: never
	: Idx<T, P>;

// Upload Project App types
export interface UploadProjectAppOutput {
	project_id: string;
	engineIds: {
		success: Record<
			string,
			{
				engineType: string;
				engineName: string;
				files: Array<{
					filename: string;
					instances: number;
				}>;
			}
		>;
		failed: Record<
			string,
			{
				files: Array<{
					filename: string;
					instances: number;
				}>;
			}
		>;
	};
}

// Create Project types
export interface CreateProjectOutput {
	project_id: string;
	portal_id?: string;
	[key: string]: unknown; // allow backend-extensible fields
}
export interface EventData {
	startTime: string;
	endTime: string;
	logTimestamp: string;
	request: string;
	response: string;
	tokens: string | null;
	latency: number;
	status: string | null;
	engineName: string;
	engineType: string;
	userId: string;
	sessionId: string;
	spanId: string;
}
