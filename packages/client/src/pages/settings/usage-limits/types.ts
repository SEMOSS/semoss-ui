export type TimePeriod =
	| "HOUR"
	| "DAY"
	| "WEEK"
	| "MONTH"
	| "YEAR"
	| "ALL_TIME";

export interface ExceptionEntry {
	entityId: string;
	entityName: string;
	entityDetails: { label: string; value: string }[];
	combinedLimit: number | null;
	inputLimit: number | null;
	outputLimit: number | null;
	period: TimePeriod;
	isActive: boolean;
}

export interface TokenLimitEntry {
	id: string;
	period: TimePeriod;
	maxTokens: number | null;
	maxInputTokens: number | null;
	maxOutputTokens: number | null;
	isActive: boolean;
	_saved: {
		period: TimePeriod;
		maxTokens: number | null;
		maxInputTokens: number | null;
		maxOutputTokens: number | null;
		isActive: boolean;
	};
}

export interface ComputeLimitEntry {
	id: string;
	period: TimePeriod;
	maxResponseTime: number | null;
	isActive: boolean;
	_saved: {
		period: TimePeriod;
		maxResponseTime: number | null;
		isActive: boolean;
	};
}

// --- Database Limits ---
export interface DatabaseLimitConfig {
	id: string;
	recordsPerQuery: number;
	dataSizePerQueryMB: number;
	recordsPerWindow: number;
	windowPeriod: TimePeriod;
	isActive: boolean;
}

export interface DatabaseException {
	entityId: string;
	entityName: string;
	entityDetails: { label: string; value: string }[];
	recordsPerQuery: number;
	dataSizePerQueryMB: number;
	recordsPerWindow: number;
	isActive: boolean;
}

// --- Vector Limits ---
export interface VectorLimitConfig {
	id: string;
	chunksPerRetrieval: number;
	chunkSizeCap: number; // characters
	retrievalsPerWindow: number;
	windowPeriod: TimePeriod;
	indexingDocsPerWindow: number;
	indexingSizeMBPerWindow: number;
	embeddingTokensPerWindow: number;
	isActive: boolean;
}

export interface VectorException {
	entityId: string;
	entityName: string;
	entityDetails: { label: string; value: string }[];
	chunksPerRetrieval: number;
	chunkSizeCap: number;
	retrievalsPerWindow: number;
	indexingDocsPerWindow: number;
	indexingSizeMBPerWindow: number;
	embeddingTokensPerWindow: number;
	isActive: boolean;
}

// --- Storage Limits ---
export interface StorageLimitConfig {
	id: string;
	uploadSizePerFileMB: number;
	uploadSizePerWindowMB: number;
	downloadSizePerWindowMB: number;
	fileCountPerWindow: number;
	totalUploadedSizeMB: number;
	windowPeriod: TimePeriod;
	isActive: boolean;
}

export interface StorageException {
	entityId: string;
	entityName: string;
	entityDetails: { label: string; value: string }[];
	uploadSizePerFileMB: number;
	uploadSizePerWindowMB: number;
	downloadSizePerWindowMB: number;
	fileCountPerWindow: number;
	totalUploadedSizeMB: number;
	isActive: boolean;
}

export interface MockUser {
	[key: string]: unknown;
	id: string;
	name: string;
	email: string;
	loginType: string;
}

export interface MockTeam {
	[key: string]: unknown;
	id: string;
	name: string;
	teamType: string;
	memberCount: number;
}
