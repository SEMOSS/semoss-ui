/**
 * Managed project-tag helpers, shared by projectStore/WorkspaceProvider and the
 * folder/tag UI. Some tags are stamped and read by the app itself (ownership
 * markers, the parameterized-app classification) rather than user-assigned
 * folders, so they must never appear as editable tag chips or foldable folders.
 */
import { resolveQuery } from "@/lib/resolveQuery";
import type { Dashboard } from "@/types/dashboard";

/** Marker tag stamped on every dashboard this app creates, so we can reliably
 *  filter OUR projects out of the full SEMOSS catalog. */
export const APP_TAG = "reporting-insights--app";

/** Classification tag: synced automatically when a dashboard has saved parameters. */
export const PARAM_APP_TAG = "param-app";

/** Older marker(s) still recognised so previously-published apps keep appearing. */
export const LEGACY_APP_TAGS = ["data--insight"] as const;

export const tagKey = (tag: string): string => tag.trim().toLowerCase();
const OWNERSHIP_MARKER_KEYS = new Set(
	[APP_TAG, ...LEGACY_APP_TAGS].map(tagKey),
);
const MANAGED_TAG_BY_KEY = new Map(
	[APP_TAG, PARAM_APP_TAG, ...LEGACY_APP_TAGS].map((tag) => [
		tagKey(tag),
		tag,
	]),
);

/** Tags that mean "this project belongs to this app" — never shown as folders. */
export const isOwnershipMarkerTag = (tag: string): boolean =>
	OWNERSHIP_MARKER_KEYS.has(tagKey(tag));

/** Any tag the app manages itself (ownership markers + classification tags). */
export const isManagedSystemTag = (tag: string): boolean =>
	MANAGED_TAG_BY_KEY.has(tagKey(tag));

export const isParamAppTag = (tag: string): boolean =>
	tagKey(tag) === PARAM_APP_TAG;

/** User-assignable folder tags: trims and drops managed tags. */
export function userFolderTags(tags: string[] | undefined): string[] {
	return (tags ?? [])
		.map((tag) => tag.trim())
		.filter((tag) => tag && !isManagedSystemTag(tag));
}

/** De-duplicates tags case-insensitively, normalizing managed tags to their canonical casing. */
export function canonicalizeProjectTags(tags: string[]): string[] {
	const unique = new Map<string, string>();
	for (const rawTag of tags) {
		const trimmed = rawTag.trim();
		if (!trimmed) continue;
		const key = tagKey(trimmed);
		if (!unique.has(key))
			unique.set(key, MANAGED_TAG_BY_KEY.get(key) ?? trimmed);
	}
	return [...unique.values()];
}

interface TaggedItem {
	tags?: string[];
	createdAt?: string;
	updatedAt?: string;
}

/** Resolve each folder key to the spelling used by the earliest project carrying it. */
export function buildCanonicalFolderNames(
	items: TaggedItem[],
): Map<string, string> {
	const ordered = items
		.map((item, index) => ({ item, index }))
		.sort((a, b) => {
			const aTime = Date.parse(
				a.item.createdAt || a.item.updatedAt || "",
			);
			const bTime = Date.parse(
				b.item.createdAt || b.item.updatedAt || "",
			);
			if (
				Number.isFinite(aTime) &&
				Number.isFinite(bTime) &&
				aTime !== bTime
			)
				return aTime - bTime;
			if (Number.isFinite(aTime) !== Number.isFinite(bTime))
				return Number.isFinite(aTime) ? -1 : 1;
			return a.index - b.index;
		});
	const names = new Map<string, string>();
	for (const { item } of ordered) {
		for (const tag of userFolderTags(item.tags)) {
			const key = tagKey(tag);
			if (!names.has(key)) names.set(key, tag);
		}
	}
	return names;
}

/** Deduplicate folder tags by lowercase key and apply the established display spelling. */
export function canonicalizeFolderTags(
	tags: string[],
	folderNames: Map<string, string>,
): string[] {
	const unique = new Map<string, string>();
	for (const tag of canonicalizeProjectTags(tags)) {
		const key = tagKey(tag);
		if (!unique.has(key))
			unique.set(
				key,
				isManagedSystemTag(tag) ? tag : (folderNames.get(key) ?? tag),
			);
	}
	return [...unique.values()];
}

/** True when any visualization's resolved query has a named parameter. */
export function hasSavedParameters(
	dashboard: Pick<Dashboard, "queries" | "sheets">,
): boolean {
	return dashboard.sheets.some((sheet) =>
		sheet.visualizations.some((visualization) =>
			(
				resolveQuery(visualization, dashboard.queries).parameters ?? []
			).some((parameter) => Boolean(parameter.name?.trim())),
		),
	);
}

/** Adds/removes PARAM_APP_TAG on `tags` to match whether `dashboard` currently has saved parameters. */
export function syncParamAppTag(
	tags: string[] | undefined,
	dashboard: Pick<Dashboard, "queries" | "sheets">,
): string[] {
	const withoutParamTag = canonicalizeProjectTags(tags ?? []).filter(
		(tag) => !isParamAppTag(tag),
	);
	return hasSavedParameters(dashboard)
		? [...withoutParamTag, PARAM_APP_TAG]
		: withoutParamTag;
}
