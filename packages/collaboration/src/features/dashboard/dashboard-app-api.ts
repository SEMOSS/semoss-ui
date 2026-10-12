import { Env } from "@semoss/sdk/react";
import { z } from "@semoss/ui/next";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";

const appSchema = z.object({
	project_id: z.string().min(1),
	project_name: z.string(),
	project_display_name: z.string().nullish(),
	project_type: z.enum(["CODE", "BLOCKS"]),
	project_portal_published_date: z.string().nullish(),
});
export type DashboardApp = z.infer<typeof appSchema>;

/** Use SEMOSS's published portal route, never a user-supplied embedding URL. */
export function appPortalPath(appId: string): string {
	return `${Env.MODULE}/public_home/${encodeURIComponent(appId)}/portals/`;
}

/** MyProjects applies the current user's catalog access; launch revalidates permission. */
export async function listDashboardApps(
	actions: InsightActions,
	search: string,
	offset: number,
): Promise<{ apps: DashboardApp[]; hasMore: boolean; nextOffset: number }> {
	const rows = await callPixel(
		actions,
		pixel("MyProjects", {
			projectType: ["CODE", "BLOCKS"],
			filterWord: search.trim() || undefined,
			limit: 25,
			offset,
		}),
		z.array(appSchema),
	);
	return {
		apps: rows.filter((row) => Boolean(row.project_portal_published_date)),
		hasMore: rows.length === 25,
		nextOffset: offset + rows.length,
	};
}

/** Reject an unpublished or inaccessible app before mounting its portal. */
export async function validateDashboardApp(
	actions: InsightActions,
	appId: string,
): Promise<void> {
	const details = await callPixel(
		actions,
		pixel("GetProjectPortalDetails", { project: appId }),
		z.object({
			project_is_published: z.boolean(),
			project_portal_url: z.string(),
		}),
	);
	if (!details.project_is_published)
		throw new Error(
			"This app is no longer published. You can remove its tile or try again after it is published.",
		);
}
