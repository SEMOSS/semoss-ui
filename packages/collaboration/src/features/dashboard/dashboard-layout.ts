import { z } from "@semoss/ui/next";

const widgetSchema = z
	.object({
		id: z.string().min(1),
		kind: z.enum(["day", "needs", "agents", "email", "app"]),
		title: z.string().max(160),
		visible: z.boolean(),
		width: z.number().int().min(3).max(12),
		height: z.number().int().min(32).max(120),
		density: z.enum(["comfortable", "compact"]),
		filter: z.enum(["all", "urgent", "latest", "vip", "unread"]),
		appId: z.string().min(1).optional(),
	})
	.refine((widget) => widget.kind !== "app" || Boolean(widget.appId));

const widgetsSchema = z
	.array(widgetSchema)
	.max(40)
	.refine(
		(widgets) =>
			new Set(widgets.map((widget) => widget.id)).size === widgets.length,
		"Widget identifiers must be unique",
	);
const preferencesSchema = z.object({
	version: z.literal(1),
	widgets: widgetsSchema,
	presets: z
		.array(
			z.object({
				name: z.string().trim().min(1).max(60),
				widgets: widgetsSchema,
			}),
		)
		.max(20),
});
export type DashboardPreferences = z.infer<typeof preferencesSchema>;
/** Store layout metadata only, isolated by account and deployment. */
export function dashboardStorageKey(
	account: string,
	deployment: string,
): string {
	return `semoss:collaboration:dashboard:v1:${encodeURIComponent(deployment)}:${encodeURIComponent(account)}`;
}

/** Corrupt preferences are recoverable and never passed directly into grid styles. */
export function readDashboardPreferences(key: string): {
	preferences: DashboardPreferences;
	error: string;
} {
	const fallback: DashboardPreferences = {
		version: 1,
		widgets: [],
		presets: [],
	};
	try {
		const value = localStorage.getItem(key);
		if (!value) return { preferences: fallback, error: "" };
		const parsed = preferencesSchema.safeParse(JSON.parse(value));
		if (!parsed.success)
			return {
				preferences: fallback,
				error: "Your saved pinned apps could not be read.",
			};
		return { preferences: parsed.data, error: "" };
	} catch {
		return {
			preferences: fallback,
			error: "Saved pinned apps are unavailable in this browser.",
		};
	}
}
