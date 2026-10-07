import { z } from "@semoss/ui/next";

const WIDGET_NAMES = {
	day: "Your day",
	needs: "Needs you",
	agents: "Agents needing you",
	email: "Relevant email",
	app: "App",
} as const;

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
export type DashboardWidget = z.infer<typeof widgetSchema>;

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
export type DashboardPreset = "Balanced" | "Focus" | "Meetings";

/** Built-in presets keep all four sections available and change their emphasis. */
export function presetWidgets(
	preset: DashboardPreset = "Balanced",
): DashboardWidget[] {
	const order: DashboardWidget["kind"][] =
		preset === "Focus"
			? ["needs", "agents", "day", "email"]
			: preset === "Meetings"
				? ["day", "email", "needs", "agents"]
				: ["day", "needs", "agents", "email"];
	return order.map((kind) => ({
		id: kind,
		kind,
		title: WIDGET_NAMES[kind],
		visible: true,
		width: preset === "Balanced" ? (kind === "needs" ? 6 : 3) : 6,
		height:
			preset === "Balanced"
				? kind === "needs"
					? 104
					: kind === "day"
						? 80
						: kind === "agents"
							? 32
							: 64
				: 64,
		density: "comfortable",
		filter: "all",
	}));
}

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
		widgets: presetWidgets(),
		presets: [],
	};
	try {
		const value = localStorage.getItem(key);
		if (!value) return { preferences: fallback, error: "" };
		const parsed = preferencesSchema.safeParse(JSON.parse(value));
		if (!parsed.success)
			return {
				preferences: fallback,
				error: "Your saved layout could not be read. The Balanced layout is shown.",
			};
		return { preferences: parsed.data, error: "" };
	} catch {
		return {
			preferences: fallback,
			error: "Layout storage is unavailable. You can still customize this session.",
		};
	}
}

/** Validate before writing; callers keep edits open when storage fails. */
export function saveDashboardPreferences(
	key: string,
	preferences: DashboardPreferences,
): void {
	localStorage.setItem(
		key,
		JSON.stringify(preferencesSchema.parse(preferences)),
	);
}

/** Reordering is shared by drag gestures and explicit move buttons. */
export function moveWidget(
	widgets: DashboardWidget[],
	id: string,
	targetId: string,
): DashboardWidget[] {
	const from = widgets.findIndex((widget) => widget.id === id);
	const to = widgets.findIndex((widget) => widget.id === targetId);
	if (from < 0 || to < 0 || from === to) return widgets;
	const next = [...widgets];
	const [widget] = next.splice(from, 1);
	if (widget) next.splice(to, 0, widget);
	return next;
}
