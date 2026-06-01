import { genId } from "../constants";
import type {
	DatabaseLimitConfig,
	MockTeam,
	MockUser,
	StorageLimitConfig,
	VectorLimitConfig,
} from "../types";

const MOCK_USERS: MockUser[] = [
	{
		id: "ielnemr",
		name: "Ibrahim ElNemr",
		email: "ielnemr@deloitte.com",
		loginType: "NATIVE",
	},
	{
		id: "ajohnson",
		name: "Alice Johnson",
		email: "ajohnson@deloitte.com",
		loginType: "NATIVE",
	},
	{
		id: "bsmith",
		name: "Bob Smith",
		email: "bsmith@deloitte.com",
		loginType: "SSO",
	},
	{
		id: "dprince",
		name: "Diana Prince",
		email: "dprince@deloitte.com",
		loginType: "NATIVE",
	},
	{
		id: "ewilliams",
		name: "Eve Williams",
		email: "ewilliams@deloitte.com",
		loginType: "SSO",
	},
];

const MOCK_TEAMS: MockTeam[] = [
	{
		id: "team-demo",
		name: "Demo Team",
		teamType: "CUSTOM",
		memberCount: 3,
	},
	{
		id: "team-eng",
		name: "Engineering",
		teamType: "CUSTOM",
		memberCount: 8,
	},
	{
		id: "team-prod",
		name: "Product",
		teamType: "CUSTOM",
		memberCount: 5,
	},
	{
		id: "team-exec",
		name: "Executive",
		teamType: "DEFAULT",
		memberCount: 4,
	},
];

const MOCK_APPS = [
	{
		id: "857e7266-3d49-4380-8a99-45f2c56ff3cb",
		name: "Vibe Model Token Limit",
		type: "App",
	},
	{
		id: "b446e953-7ee7-4f3a-a946-702f5a405a9a",
		name: "Playwright Single App",
		type: "App",
	},
	{
		id: "c27165e3-7b1e-4737-b9cd-6a6ba89259d9",
		name: "GCS Certification Review",
		type: "App",
	},
	{
		id: "d8832abc-4e01-4d32-987c-2f5a6b123456",
		name: "Customer Support Bot",
		type: "App",
	},
];

const MOCK_ROOMS = [
	{ id: "room-general-001", name: "General Chat", type: "Room" },
	{ id: "room-eng-002", name: "Engineering Discussion", type: "Room" },
	{ id: "room-prod-003", name: "Product Planning", type: "Room" },
];

const MOCK_DATABASES = [
	{
		id: "5dc23fc5-8dff-491f-a015-eae5f11871a7",
		name: "GlobalAssetDB",
		type: "Database",
	},
	{
		id: "a1b2c3d4-5678-9012-3456-789012345678",
		name: "Production Analytics DB",
		type: "Database",
	},
	{
		id: "f9e8d7c6-b5a4-3210-fedc-ba0987654321",
		name: "Reporting Warehouse",
		type: "Database",
	},
];

const MOCK_VECTORS = [
	{
		id: "a7d4548b-5d4d-449a-9b6b-0c3121aed493",
		name: "Core-Documentation",
		vectorType: "PGVector",
	},
	{
		id: "b8e5659c-6e5e-550b-a7c8-1d4232bfe504",
		name: "Product Docs Index",
		vectorType: "Weaviate",
	},
	{
		id: "c9f6760d-7f6f-661c-b8d9-2e5343c0f615",
		name: "Code Embeddings",
		vectorType: "FAISS",
	},
];

const MOCK_STORAGES = [
	{
		id: "stor-primary-001",
		name: "Primary File Storage",
		type: "Storage",
	},
	{ id: "stor-media-002", name: "Media Assets", type: "Storage" },
	{ id: "stor-user-003", name: "User Uploads", type: "Storage" },
];

const MOCK_AGENTS = [
	{
		id: "a7d45s8b-5d4d-449a-9b6b-0a3121aeds93",
		name: "Orchestrator Agent",
		type: "Agent",
	},
	{
		id: "b8e56t9c-6e5e-550b-a7c8-1d4232bfet04",
		name: "Code Review Agent",
		type: "Agent",
	},
	{
		id: "c9f67u0d-7f6f-661c-b8d9-2e5343c0fu15",
		name: "Daily Report Summarizer",
		type: "Agent",
	},
];

// --- Default mock limits for each entity type ---

function getDefaultDatabaseLimits(): DatabaseLimitConfig {
	return {
		id: genId(),
		recordsPerQuery: 10000,
		dataSizePerQueryMB: 50,
		recordsPerWindow: 100000,
		windowPeriod: "DAY",
		isActive: true,
	};
}

function getDefaultVectorLimits(): VectorLimitConfig {
	return {
		id: genId(),
		chunksPerRetrieval: 10,
		chunkSizeCap: 2000,
		retrievalsPerWindow: 200,
		windowPeriod: "DAY",
		indexingDocsPerWindow: 500,
		indexingSizeMBPerWindow: 100,
		embeddingTokensPerWindow: 5000000,
		isActive: true,
	};
}

function getDefaultStorageLimits(): StorageLimitConfig {
	return {
		id: genId(),
		uploadSizePerFileMB: 250,
		uploadSizePerWindowMB: 2048,
		downloadSizePerWindowMB: 5120,
		fileCountPerWindow: 100,
		totalUploadedSizeMB: 10240,
		windowPeriod: "DAY",
		isActive: true,
	};
}

/**
 * Hook that provides all mock data for usage limits.
 * Will be replaced with actual API/pixel calls in the future.
 */
export function useMockLimitsData() {
	return {
		users: MOCK_USERS,
		teams: MOCK_TEAMS,
		apps: MOCK_APPS,
		rooms: MOCK_ROOMS,
		databases: MOCK_DATABASES,
		vectors: MOCK_VECTORS,
		storages: MOCK_STORAGES,
		agents: MOCK_AGENTS,
		getDefaultDatabaseLimits,
		getDefaultVectorLimits,
		getDefaultStorageLimits,
	};
}
