/**
 * workspaceStore — TYPES ONLY.
 *
 * The app no longer uses a dedicated H2 database, DDL, migrations, or table calls
 * for persistence. Dashboards are SEMOSS projects and folders are derived from
 * project tags (see services/projectStore.ts + workspace/WorkspaceProvider.tsx).
 *
 * This module is kept solely to host the shared folder TYPES that the folder UI
 * still references. A "folder" is now simply a tag: a WorkspaceFolder.id IS the
 * tag string.
 */

/** Which list a tag-folder belongs to. */
export type FolderKind = "dashboard" | "published";

/** Retained for type-compatibility with the folder UI. Always 'public' now —
 *  per-folder visibility was a DB-era feature; access is governed by SEMOSS
 *  project permissions instead. */
export type FolderVisibility = "public" | "private";

/**
 * A folder in the tag-based model. `id` IS the tag string (id === name).
 */
export interface WorkspaceFolder {
	/** The tag string. Same as `name`. */
	id: string;
	name: string;
	kind: FolderKind;
	visibility: FolderVisibility;
	ownerId?: string;
	/** Higher = shown first. Client-side ordering only. */
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}
