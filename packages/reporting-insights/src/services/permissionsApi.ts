/**
 * permissionsApi — thin, CSRF-aware wrappers over the SEMOSS auth REST endpoints
 * used by the Admin page (database permissioning + user lookup).
 *
 * Endpoints verified against the official SemossWeb client:
 *   GET  /api/auth/admin/user/isAdminUser
 *   GET  /api/auth/[admin/]engine/getEngines?engineTypes=DATABASE&...
 *   GET  /api/auth/[admin/]engine/getEngineUsers?engineId=...
 *   POST /api/auth/[admin/]engine/addEngineUserPermissions   {engineId, userpermissions:[{userid,permission}]}
 *   POST /api/auth/[admin/]engine/removeEngineUserPermissions{engineId, ids:[userid,...]}
 *   GET  /api/auth/[admin/]user/getAllUsers / getUsers
 *   POST /api/auth/[admin/]engine/setEngineGlobal            {engineId, public}
 */

const MODULE = "/Monolith";

/** Loosely-shaped REST response row — these endpoints' field names vary by SEMOSS build. */
type RawRecord = Record<string, unknown>;
const asRecord = (v: unknown): RawRecord =>
	v && typeof v === "object" ? (v as RawRecord) : {};

export type Role =
	| "OWNER"
	| "EDIT"
	| "EDITOR"
	| "VIEWER"
	| "READ_ONLY"
	| "DISCOVERABLE";

export interface EngineInfo {
	id: string;
	name: string;
	type: string;
	global: boolean;
	/** Current user's role on the engine, when known. */
	permission?: string;
}

export interface EngineMember {
	id: string;
	name: string;
	permission: string;
}

export interface DirectoryUser {
	id: string;
	name: string;
	email?: string;
}

// ── low-level helpers ─────────────────────────────────────────────────────────
let csrfToken: string | null = null;
async function csrf(): Promise<string | null> {
	if (csrfToken) return csrfToken;
	try {
		const r = await fetch(`${MODULE}/api/config/fetchCsrf`, {
			credentials: "include",
			headers: { "X-CSRF-Token": "fetch" },
		});
		if (r.ok)
			csrfToken =
				r.headers.get("X-CSRF-Token") || r.headers.get("x-csrf-token");
	} catch {
		/* non-fatal */
	}
	return csrfToken;
}

async function getJson<T>(path: string): Promise<T> {
	const r = await fetch(`${MODULE}${path}`, { credentials: "include" });
	if (!r.ok) throw new Error(`HTTP ${r.status}`);
	return (await r.json()) as T;
}

async function postForm<T>(
	path: string,
	data: Record<string, unknown>,
): Promise<T> {
	const token = await csrf();
	const headers: Record<string, string> = {
		"Content-Type": "application/x-www-form-urlencoded",
	};
	if (token) headers["X-CSRF-Token"] = token;
	const body = Object.entries(data)
		.map(
			([k, v]) =>
				`${k}=${encodeURIComponent(typeof v === "string" ? v : JSON.stringify(v))}`,
		)
		.join("&");
	const r = await fetch(`${MODULE}${path}`, {
		method: "POST",
		credentials: "include",
		headers,
		body,
	});
	if (!r.ok) throw new Error(`HTTP ${r.status}`);
	try {
		return (await r.json()) as T;
	} catch {
		return undefined as T;
	}
}

const adminSeg = (admin: boolean) => (admin ? "admin/" : "");

// ── API ───────────────────────────────────────────────────────────────────────

/**
 * True if the logged-in user is a SEMOSS admin. Safe: returns false on 403/error.
 * Memoised — admin status is constant for the session, and this is called from
 * multiple mount points (WorkspaceProvider + AdminPage). Caching the promise
 * collapses concurrent callers onto a single network request.
 */
let adminCheck: Promise<boolean> | null = null;
export function isAdminUser(): Promise<boolean> {
	if (!adminCheck) {
		adminCheck = (async () => {
			try {
				const data = await getJson<unknown>(
					"/api/auth/admin/user/isAdminUser",
				);
				return (
					data === true ||
					asRecord(data).data === true ||
					data === "true"
				);
			} catch {
				return false;
			}
		})();
	}
	return adminCheck;
}

function mapEngine(e: RawRecord): EngineInfo {
	return {
		id: String(e.app_id ?? e.database_id ?? e.engine_id ?? e.id ?? ""),
		name: String(
			e.engine_name ??
				e.app_name ??
				e.database_name ??
				e.low_database_name ??
				e.id ??
				"Untitled",
		),
		type: String(e.engine_type ?? e.app_type ?? e.type ?? "DATABASE"),
		global:
			e.engine_global === true ||
			e.database_global === true ||
			e.global === true,
		permission: (e.user_permission ?? e.permission) as string | undefined,
	};
}

/** List databases. admin=true → all databases; admin=false → only the user's. */
export async function getEngines(admin: boolean): Promise<EngineInfo[]> {
	const out = await getJson<unknown>(
		`/api/auth/${adminSeg(admin)}engine/getEngines?engineTypes=DATABASE&limit=1000&offset=0`,
	);
	const rows: RawRecord[] = Array.isArray(out)
		? out
		: ((asRecord(out).data ??
				asRecord(out).databases ??
				asRecord(out).engines ??
				[]) as RawRecord[]);
	return rows.map(mapEngine);
}

/** Users (and their roles) with access to an engine. */
export async function getEngineUsers(
	admin: boolean,
	engineId: string,
): Promise<EngineMember[]> {
	const out = await getJson<unknown>(
		`/api/auth/${adminSeg(admin)}engine/getEngineUsers?engineId=${encodeURIComponent(engineId)}&limit=1000&offset=0`,
	);
	const members: RawRecord[] =
		(asRecord(out).members as RawRecord[] | undefined) ??
		(asRecord(asRecord(out).data).members as RawRecord[] | undefined) ??
		(Array.isArray(out) ? out : []);
	return members.map((m) => ({
		id: String(m.id),
		name: String(m.name ?? m.id),
		permission: String(m.permission ?? "READ_ONLY"),
	}));
}

/** Grant (or update) a user's role on an engine. */
export async function grantEngineUser(
	admin: boolean,
	engineId: string,
	userId: string,
	permission: Role,
): Promise<void> {
	await postForm(
		`/api/auth/${adminSeg(admin)}engine/addEngineUserPermissions`,
		{
			engineId,
			userpermissions: [{ userid: userId, permission }],
		},
	);
}

/** Revoke a user's access to an engine. */
export async function revokeEngineUser(
	admin: boolean,
	engineId: string,
	userId: string,
): Promise<void> {
	await postForm(
		`/api/auth/${adminSeg(admin)}engine/removeEngineUserPermissions`,
		{
			engineId,
			ids: [userId],
		},
	);
}

/** Make an engine public (discoverable by all users) or private. */
export async function setEngineGlobal(
	engineId: string,
	isPublic: boolean,
): Promise<void> {
	await postForm("/api/auth/engine/setEngineGlobal", {
		engineId,
		public: String(isPublic),
	});
}

// ── Projects (apps) ─────────────────────────────────────────────────────────
export interface ProjectInfo {
	id: string;
	name: string;
	global: boolean;
	permission?: string;
}

/**
 * Normalize a project permission value from any shape the backend returns
 * (array, object, numeric string, role name with spaces/dashes) into a `Role`.
 */
export function normalizeProjectPermission(
	permission: unknown,
): Role | undefined {
	let value: unknown = Array.isArray(permission) ? permission[0] : permission;
	if (value && typeof value === "object") {
		const record = value as Record<string, unknown>;
		value =
			record.project_permission ??
			record.user_permission ??
			record.permission ??
			record.name ??
			record.value;
	}
	const normalized = String(value ?? "")
		.trim()
		.toUpperCase()
		.replace(/[ -]+/g, "_");
	if (!normalized) return undefined;
	if (normalized === "1") return "OWNER";
	if (normalized === "2") return "EDIT";
	if (normalized === "3") return "READ_ONLY";
	if (normalized === "READONLY") return "READ_ONLY";
	const roles: Role[] = [
		"OWNER",
		"EDIT",
		"EDITOR",
		"VIEWER",
		"READ_ONLY",
		"DISCOVERABLE",
	];
	return roles.find((role) => role === normalized);
}

/** List projects/apps. admin=true → all; admin=false → only the user's. */
export async function getProjects(admin: boolean): Promise<ProjectInfo[]> {
	const out = await getJson<unknown>(
		`/api/auth/${adminSeg(admin)}project/getProjects?limit=1000&offset=0`,
	);
	const rows: RawRecord[] = Array.isArray(out)
		? out
		: ((asRecord(out).data ?? asRecord(out).projects ?? []) as RawRecord[]);
	return rows
		.map((p) => ({
			id: String(p.project_id ?? p.id ?? p.app_id ?? ""),
			name: String(
				p.project_name ??
					p.low_project_name ??
					p.app_name ??
					p.project_id ??
					"Untitled",
			),
			global: p.project_global === true || p.global === true,
			permission: normalizeProjectPermission(
				p.project_permission ??
					p.project_user_permission ??
					p.user_permission ??
					p.permission,
			),
		}))
		.filter((p) => p.id);
}

/** Users (and their roles) with access to a project. */
export async function getProjectUsers(
	admin: boolean,
	projectId: string,
): Promise<EngineMember[]> {
	const out = await getJson<unknown>(
		`/api/auth/${adminSeg(admin)}project/getProjectUsers?projectId=${encodeURIComponent(projectId)}&limit=1000&offset=0`,
	);
	const members: RawRecord[] =
		(asRecord(out).members as RawRecord[] | undefined) ??
		(asRecord(asRecord(out).data).members as RawRecord[] | undefined) ??
		(Array.isArray(out) ? out : []);
	return members.map((m) => ({
		id: String(m.id),
		name: String(m.name ?? m.id),
		permission: String(m.permission ?? "READ_ONLY"),
	}));
}

/** Grant (or update) a user's role on a project. */
export async function grantProjectUser(
	admin: boolean,
	projectId: string,
	userId: string,
	permission: Role,
): Promise<void> {
	await postForm(
		`/api/auth/${adminSeg(admin)}project/addProjectUserPermissions`,
		{
			projectId,
			userpermissions: [{ userid: userId, permission }],
		},
	);
}

/** Revoke a user's access to a project. */
export async function revokeProjectUser(
	admin: boolean,
	projectId: string,
	userId: string,
): Promise<void> {
	await postForm(
		`/api/auth/${adminSeg(admin)}project/removeProjectUserPermissions`,
		{
			projectId,
			ids: [userId],
		},
	);
}

/** Make a project public (discoverable by all users) or private. */
export async function setProjectGlobal(
	admin: boolean,
	projectId: string,
	isPublic: boolean,
): Promise<void> {
	await postForm(`/api/auth/${adminSeg(admin)}project/setProjectGlobal`, {
		projectId,
		public: String(isPublic),
	});
}

function mapUserRows(out: unknown): DirectoryUser[] {
	const rows: RawRecord[] =
		(asRecord(out).members as RawRecord[] | undefined) ??
		(asRecord(out).users as RawRecord[] | undefined) ??
		(asRecord(out).data as RawRecord[] | undefined) ??
		(Array.isArray(out) ? out : []);
	if (!Array.isArray(rows)) return [];
	return rows
		.map((u) => ({
			id: String(u.id ?? u.userId ?? u.ID ?? ""),
			name: String(u.name ?? u.username ?? u.id ?? ""),
			email: (u.email ?? u.EMAIL) as string | undefined,
		}))
		.filter((u) => u.id);
}

/**
 * Every user in the directory — fetched with NO limit so the full list is
 * returned. Deduped by id (directories can return a user under multiple auth
 * providers). Filtering/search is done client-side by the UI.
 */
export async function getAllUsers(admin: boolean): Promise<DirectoryUser[]> {
	const endpoints = [
		`/api/auth/${adminSeg(admin)}user/getAllUsers`,
		`/api/auth/${adminSeg(admin)}user/getUsers`,
	];
	for (const base of endpoints) {
		try {
			// No limit/offset params → the server returns every user.
			const out = await getJson<unknown>(base);
			const rows = mapUserRows(out);
			if (!rows.length) continue; // endpoint shape didn't match → try next
			const seen = new Set<string>();
			return rows.filter((u) => {
				if (seen.has(u.id)) return false;
				seen.add(u.id);
				return true;
			});
		} catch {
			/* try next endpoint */
		}
	}
	return [];
}

// ── Teams / groups ─────────────────────────────────────────────────────────
// SEMOSS "teams" are groups. Group permissions use a NUMERIC level
// (1=Owner, 2=Editor, 3=Read-Only) and a separate set of endpoints.

export interface GroupInfo {
	id: string;
	name: string;
	/** Group type (e.g. NATIVE / custom) — required by add/remove on some builds. */
	type?: string;
}

export interface GroupMember extends GroupInfo {
	permission: string; // normalized Role string
}

export const GROUP_PERM_NUM: Record<string, number> = {
	OWNER: 1,
	EDIT: 2,
	EDITOR: 2,
	READ_ONLY: 3,
	VIEWER: 3,
};
const numToRole = (n: unknown): string =>
	(({ 1: "OWNER", 2: "EDIT", 3: "READ_ONLY" }) as Record<number, string>)[
		Number(n)
	] ?? (typeof n === "string" ? n : "READ_ONLY");

const mapGroup = (g: RawRecord): GroupInfo => ({
	id: String(g.id ?? g.groupId ?? g.group_id ?? g.ID ?? ""),
	name: String(g.name ?? g.groupName ?? g.group_name ?? g.id ?? ""),
	type: (g.type ?? g.groupType ?? g.group_type) as string | undefined,
});

/** Teams/groups the user can grant access to. */
export async function getGroups(
	admin: boolean,
	search = "",
): Promise<GroupInfo[]> {
	const q = `limit=500&offset=0${search ? `&searchTerm=${encodeURIComponent(search)}` : ""}`;
	try {
		const out = await getJson<unknown>(
			`/api/auth/${adminSeg(admin)}group/getGroups?${q}`,
		);
		const rows: RawRecord[] =
			(asRecord(out).data as RawRecord[] | undefined) ??
			(asRecord(out).groups as RawRecord[] | undefined) ??
			(asRecord(out).members as RawRecord[] | undefined) ??
			(Array.isArray(out) ? out : []);
		return rows.map(mapGroup).filter((g) => g.id);
	} catch {
		return [];
	}
}

/** Teams/groups that currently have access to a project. */
export async function getProjectGroups(
	projectId: string,
): Promise<GroupMember[]> {
	try {
		const out = await getJson<unknown>(
			`/api/auth/group/project/getGroupsWithAccessToProject?projectId=${encodeURIComponent(projectId)}&limit=500&offset=0`,
		);
		const rows: RawRecord[] =
			(asRecord(out).data as RawRecord[] | undefined) ??
			(asRecord(out).members as RawRecord[] | undefined) ??
			(Array.isArray(out) ? out : []);
		return rows
			.map((g) => ({
				...mapGroup(g),
				permission: numToRole(g.permission),
			}))
			.filter((g) => g.id);
	} catch {
		return [];
	}
}

/** Grant a team/group access to a project (default View / read-only). */
export async function grantProjectGroup(
	admin: boolean,
	projectId: string,
	groupId: string,
	groupType?: string,
	permission: Role = "READ_ONLY",
): Promise<void> {
	await postForm(
		`/api/auth/${adminSeg(admin)}group/addGroupProjectPermission`,
		{
			projectId,
			groupId,
			permission: GROUP_PERM_NUM[permission] ?? 3,
			...(groupType ? { type: groupType } : {}),
		},
	);
}

/** Revoke a team/group's access to a project. */
export async function revokeProjectGroup(
	admin: boolean,
	projectId: string,
	groupId: string,
	groupType?: string,
): Promise<void> {
	await postForm(
		`/api/auth/${adminSeg(admin)}group/removeGroupProjectPermission`,
		{
			projectId,
			groupId,
			...(groupType ? { type: groupType } : {}),
		},
	);
}
