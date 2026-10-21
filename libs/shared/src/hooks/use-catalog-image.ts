import { useSyncExternalStore } from "react";
import { Env } from "@semoss/sdk";
import { useTheme } from "@semoss/ui/next";

export type CatalogImageResource = "PROJECT" | "ENGINE";

// Only resources uploaded in this browser session need a cache revision.
const revisions = new Map<string, number>();
const listeners = new Set<() => void>();

const subscribe = (listener: () => void): (() => void) => {
	listeners.add(listener);
	return () => listeners.delete(listener);
};

const getServerSnapshot = (): number => 0;

/** Refresh all mounted images for a resource after its upload succeeds. */
export function refreshCatalogImage(
	resource: CatalogImageResource,
	id: string,
): void {
	if (!id) return;
	const key = `${resource}:${id}`;
	revisions.set(key, Math.max(Date.now(), (revisions.get(key) ?? 0) + 1));
	for (const listener of listeners) listener();
}

/** Resolve a themed download URL, or an empty string when there is no saved ID. */
export function useCatalogImageUrl(
	resource: CatalogImageResource,
	id: string,
): string {
	const { resolvedTheme } = useTheme();
	const revision = useSyncExternalStore(
		subscribe,
		() => revisions.get(`${resource}:${id}`) ?? 0,
		getServerSnapshot,
	);
	if (!id) return "";
	const path =
		resource === "PROJECT"
			? `project-${encodeURIComponent(id)}/projectImage/download`
			: `e-${encodeURIComponent(id)}/image/download`;
	const params = new URLSearchParams({ theme: resolvedTheme });
	if (revision) params.set("v", String(revision));
	return `${Env.MODULE}/api/${path}?${params}`;
}
