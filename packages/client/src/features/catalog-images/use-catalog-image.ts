import { create } from "zustand";
import { Env } from "@semoss/sdk";

export type CatalogImageResource = "PROJECT" | "ENGINE";

interface CatalogImageState {
	/** Only resources changed in this session need a cache revision. */
	revisions: Record<string, number>;
	/** Refresh every mounted catalog icon after a confirmed upload. */
	refresh: (resource: CatalogImageResource, id: string) => void;
}

const useCatalogImageStore = create<CatalogImageState>()((set) => ({
	revisions: {},
	refresh: (resource, id) =>
		set((state) => ({
			revisions: {
				...state.revisions,
				[`${resource}:${id}`]: Math.max(
					Date.now(),
					(state.revisions[`${resource}:${id}`] ?? 0) + 1,
				),
			},
		})),
}));

/** Invalidate the displayed image only after the server confirms the upload. */
export function refreshCatalogImage(
	resource: CatalogImageResource,
	id: string,
): void {
	useCatalogImageStore.getState().refresh(resource, id);
}

/** Resolve a download URL that updates when this resource's image is replaced. */
export function useCatalogImageUrl(
	resource: CatalogImageResource,
	id: string,
): string {
	const revision = useCatalogImageStore(
		(state) => state.revisions[`${resource}:${id}`],
	);
	const path =
		resource === "PROJECT"
			? `project-${encodeURIComponent(id)}/projectImage/download`
			: `e-${encodeURIComponent(id)}/image/download`;
	return `${Env.MODULE}/api/${path}${revision ? `?v=${revision}` : ""}`;
}
