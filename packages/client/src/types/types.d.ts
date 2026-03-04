export type Role =
	| "OWNER"
	| "EDIT"
	| "VIEWER"
	| "READ_ONLY"
	| "DISCOVERABLE"
	| "EDITOR";

export interface PixelCommandComponent {
	id?: string;
	value?: unknown;
	type?: string;
	[key: string]: unknown;
}

export interface PixelCommand {
	type: string;
	components: PixelCommandComponent[];
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

//Represents a single commit version in the project history
export interface CommitVersion {
	commitId: string;
	author: {
		userId: string;
		userEmail: string;
	};
	date: string;
	commitMessage: string;
	tags?: string[]; // Array of tags for this commit
}

// Enhanced error handling types
export interface ApiError {
	code: string;
	message: string;
	details?: string;
}

export interface ValidationError {
	field: string;
	message: string;
	code: string;
}

// Enhanced tag validation
export interface TagValidationResult {
	isValid: boolean;
	errors: ValidationError[];
}

// Enhanced API response structure
export interface ApiResponse<T = unknown> {
	success: boolean;
	data?: T;
	error?: ApiError;
	operationType?: string[];
}

// Interface for VersionsTable component props
export interface VersionsTableProps {
	/** The unique identifier of the project/app */
	id: string;
}

// Interface for AddTagModal component props
export interface AddTagModalProps {
	open: boolean;
	onClose: () => void;
	version: CommitVersion;
	projectId: string;
	existingTags: string[]; // All existing tags for this app to check uniqueness
	onTagAdded: (tag: string) => void; // Callback when tag is successfully added
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
