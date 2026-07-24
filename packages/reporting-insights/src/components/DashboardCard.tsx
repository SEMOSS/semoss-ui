import { Copy, Database, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { timeAgo } from "@/lib/format";
import { publishedPortalUrl } from "@/lib/portalUrl";
import type { Dashboard } from "@/types/dashboard";

// ── Shared accent palette ─────────────────────────────────────────────────────
// A cohesive cool ramp (indigo · violet · blue · sky · cyan · teal) so per-dashboard
// identity colors harmonize with the indigo/violet primary instead of clashing.
export const ACCENTS = [
	{ stop1: "#6366f1", stop2: "#8b5cf6" }, // indigo → violet
	{ stop1: "#8b5cf6", stop2: "#a855f7" }, // violet → purple
	{ stop1: "#6366f1", stop2: "#0ea5e9" }, // indigo → sky
	{ stop1: "#0ea5e9", stop2: "#06b6d4" }, // sky → cyan
	{ stop1: "#06b6d4", stop2: "#14b8a6" }, // cyan → teal
	{ stop1: "#3b82f6", stop2: "#6366f1" }, // blue → indigo
	{ stop1: "#7c3aed", stop2: "#6366f1" }, // violet → indigo
	{ stop1: "#0891b2", stop2: "#38bdf8" }, // cyan → sky
];

export function accentFor(id: string) {
	const hash = [...id].reduce((acc, c) => acc + c.charCodeAt(0), 0);
	return ACCENTS[hash % ACCENTS.length];
}

function MoreChip({ n }: { n: number }) {
	return (
		<span className="inline-flex items-center rounded-md bg-stone-100 px-2 py-0.5 font-medium text-[11px] text-stone-500">
			+{n}
		</span>
	);
}

// ── DashboardCard ─────────────────────────────────────────────────────────────
interface DashboardCardProps {
	dashboard: Dashboard;
	onDelete?: (id: string, name: string, e: React.MouseEvent) => void;
	onDuplicate?: (id: string, e: React.MouseEvent) => void;
}

export function DashboardCard({
	dashboard,
	onDelete,
	onDuplicate,
}: DashboardCardProps) {
	const accent = accentFor(dashboard.id);
	const sheets = dashboard.sheets ?? [];
	const allVizs = sheets.flatMap((s) => s.visualizations);
	const vizCount = allVizs.length;
	const initial = (dashboard.name.trim()[0] ?? "?").toUpperCase();
	const updated = timeAgo(dashboard.updatedAt);

	const databases = [
		...new Set(
			allVizs
				.map((v) => v.databaseName)
				.filter((n): n is string => !!n?.trim()),
		),
	];
	const paramMap = new Map<string, string>();
	allVizs.forEach((v) =>
		(v.parameters ?? []).forEach((p) => {
			if (p.name && !paramMap.has(p.name))
				paramMap.set(p.name, p.label || p.name);
		}),
	);
	const params = [...paramMap.values()];

	const MAX_DB = 2,
		MAX_PARAM = 3;
	const visibleDbs = databases.slice(0, MAX_DB);
	const moreDbs = Math.max(0, databases.length - MAX_DB);
	const visibleParams = params.slice(0, MAX_PARAM);
	const moreParams = Math.max(0, params.length - MAX_PARAM);

	const hasActions = !!(onDelete || onDuplicate);

	return (
		<div className="group hover:-translate-y-0.5 relative flex flex-col rounded-xl border border-stone-200 bg-white shadow-soft transition-all duration-200 ease-out focus-within:ring-2 focus-within:ring-indigo-500/20 hover:border-stone-300 hover:shadow-soft-lg">
			{/* Action cluster — visible on hover/focus; sibling of the card Link (not nested) */}
			<div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
				<a
					href={publishedPortalUrl(dashboard.id)}
					target="_blank"
					rel="noopener noreferrer"
					title="Open portal"
					onClick={(e) => e.stopPropagation()}
					className="rounded-md p-1.5 text-stone-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
				>
					<ExternalLink className="h-3.5 w-3.5" />
				</a>
				{hasActions && (
					<>
						<Link
							to={`/dashboard/${dashboard.id}/edit`}
							title="Edit"
							onClick={(e) => e.stopPropagation()}
							className="rounded-md p-1.5 text-stone-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
						>
							<Pencil className="h-3.5 w-3.5" />
						</Link>
						{onDuplicate && (
							<button
								onClick={(e) => onDuplicate(dashboard.id, e)}
								title="Duplicate"
								className="rounded-md p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
							>
								<Copy className="h-3.5 w-3.5" />
							</button>
						)}
						{onDelete && (
							<button
								onClick={(e) =>
									onDelete(dashboard.id, dashboard.name, e)
								}
								title="Delete"
								className="rounded-md p-1.5 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-500"
							>
								<Trash2 className="h-3.5 w-3.5" />
							</button>
						)}
					</>
				)}
			</div>

			<Link
				to={`/dashboard/${dashboard.id}`}
				className="flex flex-1 flex-col rounded-xl focus:outline-none"
			>
				{/* Header */}
				<div
					className={`flex items-start gap-3 px-4 pt-4 pb-3 ${hasActions ? "pr-28" : "pr-12"}`}
				>
					<div
						className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg font-bold text-sm text-white"
						style={{
							background: `linear-gradient(135deg, ${accent.stop1}, ${accent.stop2})`,
						}}
					>
						{initial}
					</div>
					<div className="min-w-0 flex-1">
						<p className="truncate font-semibold text-sm text-stone-900 leading-snug">
							{dashboard.name}
						</p>
						<p className="mt-0.5 line-clamp-1 text-stone-500 text-xs leading-relaxed">
							{dashboard.description || (
								<span className="text-stone-400 italic">
									No description
								</span>
							)}
						</p>
					</div>
				</div>

				{/* Details: databases + params */}
				{(databases.length > 0 || params.length > 0) && (
					<div className="space-y-1.5 border-stone-50 border-t px-4 pt-2.5 pb-3">
						{databases.length > 0 && (
							<div className="flex flex-wrap gap-1">
								{visibleDbs.map((db) => (
									<span
										key={db}
										className="inline-flex max-w-[150px] items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 font-medium text-[11px] text-stone-600"
									>
										<Database className="h-2.5 w-2.5 flex-shrink-0 text-stone-400" />
										<span className="truncate">{db}</span>
									</span>
								))}
								{moreDbs > 0 && <MoreChip n={moreDbs} />}
							</div>
						)}
						{params.length > 0 && (
							<div className="flex flex-wrap gap-1">
								{visibleParams.map((label) => (
									<span
										key={label}
										className="inline-flex max-w-[120px] items-center rounded-md px-2 py-0.5 font-medium text-[11px]"
										style={{
											background: `${accent.stop1}12`,
											color: accent.stop1,
											border: `1px solid ${accent.stop1}28`,
										}}
									>
										<span className="truncate">
											{label}
										</span>
									</span>
								))}
								{moreParams > 0 && <MoreChip n={moreParams} />}
							</div>
						)}
					</div>
				)}

				{/* Footer */}
				<div className="mt-auto flex items-center gap-2 border-stone-100 border-t bg-stone-50/60 px-4 py-2.5">
					<div className="flex min-w-0 flex-1 items-center gap-1">
						<span className="flex gap-1">
							{sheets.slice(0, 6).map((s) => (
								<span
									key={s.id}
									className="h-1.5 w-1.5 rounded-full"
									style={{
										background: s.color ?? accent.stop1,
									}}
									title={s.name}
								/>
							))}
						</span>
					</div>
					<span className="whitespace-nowrap text-[11px] text-stone-400 tabular-nums">
						{vizCount} viz{vizCount !== 1 ? "s" : ""}
						<span className="mx-1 text-stone-300">·</span>
						{sheets.length} sheet{sheets.length !== 1 ? "s" : ""}
						<span className="mx-1 text-stone-300">·</span>
						{updated}
					</span>
				</div>
			</Link>
		</div>
	);
}
