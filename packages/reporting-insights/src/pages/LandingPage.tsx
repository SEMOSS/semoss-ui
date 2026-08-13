import { ArrowLeft, BookOpen, Check, Copy, ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";
import { accentFor } from "@/components/DashboardCard";
import { EmptyState, LoadingState } from "@/components/ui";
import { LANDING_PAGE_TAG } from "@/services/projectStore";
import { useWorkspace } from "@/workspace/WorkspaceProvider";
import { useToast } from "../components/ui/Toast";

const BACKEND_ORIGIN = String(import.meta.env.ENDPOINT || "").replace(
	/\/+$/,
	"",
);
const MODULE_PATH = (
	String(import.meta.env.MODULE || "") || "/Monolith"
).replace(/\/+$/, "");
const publishedUrl = (id: string) =>
	`${(BACKEND_ORIGIN || window.location.origin) + MODULE_PATH}/public_home/${encodeURIComponent(id)}/portals/`;

/** Tags that are never shown as folder categories in the landing page view. */
const HIDDEN_TAGS = new Set([
	"reporting-insights--app",
	"data--insight",
	LANDING_PAGE_TAG,
]);

export function LandingPage() {
	const { dashboards, loading } = useWorkspace();
	const [selectedTag, setSelectedTag] = useState<string | null>(null);
	const [copiedId, setCopiedId] = useState<string | null>(null);
	const toast = useToast();
	const copyLink = async (id: string, url: string) => {
		const absolute = new URL(url, window.location.origin).href;
		try {
			await navigator.clipboard.writeText(absolute);
			setCopiedId(id);
			setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1500);
			toast.success("Portal link copied to clipboard.", "Copied");
		} catch {
			toast.error(absolute, "Copy failed — here\u2019s the link");
		}
	};

	const landingDashboards = useMemo(
		() =>
			dashboards.filter((d) => (d.tags ?? []).includes(LANDING_PAGE_TAG)),
		[dashboards],
	);

	// Only the distinct visible folder tags
	// Dashboards without one are excluded from the grid.
	const landingTags = useMemo(() => {
		const names = new Set<string>();
		for (const d of landingDashboards)
			for (const t of d.tags ?? []) if (!HIDDEN_TAGS.has(t)) names.add(t);
		return [...names].sort((a, b) => a.localeCompare(b));
	}, [landingDashboards]);

	const taggedDashboards = useMemo(() => {
		if (!selectedTag) return [];
		return landingDashboards.filter((d) =>
			(d.tags ?? []).includes(selectedTag),
		);
	}, [selectedTag, landingDashboards]);

	if (loading) {
		return (
			<div className="mx-auto max-w-7xl px-6 py-6">
				<LoadingState message="Loading insights…" />
			</div>
		);
	}

	// Tag Detail View
	if (selectedTag !== null) {
		return (
			<div className="mx-auto max-w-7xl px-6 py-6">
				<button
					type="button"
					onClick={() => setSelectedTag(null)}
					className="mb-5 inline-flex items-center gap-1.5 font-medium text-sm text-stone-500 transition-colors hover:text-stone-800"
				>
					<ArrowLeft className="h-4 w-4" />
					Back
				</button>

				<h1 className="font-bold text-stone-900 text-xl tracking-tight">
					{selectedTag}
				</h1>
				<p className="mt-0.5 text-[13px] text-stone-500">
					{taggedDashboards.length} insight
					{taggedDashboards.length !== 1 ? "s" : ""}
				</p>

				{taggedDashboards.length === 0 ? (
					<div className="mt-6 rounded-xl border border-stone-200 border-dashed bg-white">
						<EmptyState
							icon={BookOpen}
							title="No insights here"
							description="No landing page insights have been added to this folder yet."
						/>
					</div>
				) : (
					<div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
						{taggedDashboards.map((app) => {
							const accent = accentFor(app.id);
							const initial = (
								app.name.trim()[0] ?? "?"
							).toUpperCase();
							return (
								<div
									key={app.id}
									className="hover:-translate-y-0.5 flex flex-col rounded-xl border border-stone-200 bg-white shadow-soft transition-all duration-200 hover:border-stone-300 hover:shadow-soft-lg"
								>
									<div className="flex items-start gap-3 px-4 pt-4 pb-3">
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
												{app.name}
											</p>
											<p className="mt-0.5 line-clamp-2 text-stone-500 text-xs leading-relaxed">
												{app.description || (
													<span className="text-stone-400 italic">
														No description
													</span>
												)}
											</p>
										</div>
									</div>
									<div className="mt-auto border-stone-100 border-t bg-stone-50/60 px-4 py-2.5">
										<span className="flex-1" />
										<button
											type="button"
											onClick={() =>
												void copyLink(
													app.id,
													publishedUrl(app.id),
												)
											}
											title="Copy the portal link"
											className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2 py-1 font-medium text-[11px] text-stone-600 transition-colors hover:border-indigo-300 hover:text-indigo-600"
										>
											{copiedId === app.id ? (
												<>
													<Check className="h-3 w-3 text-emerald-500" />{" "}
													Copied
												</>
											) : (
												<>
													<Copy className="h-3 w-3" />{" "}
													Copy link
												</>
											)}
										</button>
										<a
											href={publishedUrl(app.id)}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2 py-1 font-medium text-[11px] text-stone-600 transition-colors hover:border-indigo-300 hover:text-indigo-600"
										>
											<ExternalLink className="h-3 w-3" />{" "}
											Open portal
										</a>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>
		);
	}

	// Tag Grid View
	return (
		<div className="mx-auto max-w-7xl px-6 py-6">
			<div className="flex flex-wrap items-end justify-between gap-3">
				<div>
					<h1 className="font-bold text-stone-900 text-xl tracking-tight">
						Welcome to Reporting Insights
					</h1>
					<p className="mt-0.5 text-[13px] text-stone-500">
						Select a group to view the relevant reports.
						{!loading && (
							<>
								<span className="mx-1.5 text-stone-300">·</span>
								{landingDashboards.length} insight
								{landingDashboards.length !== 1 ? "s" : ""}
							</>
						)}
					</p>
				</div>
			</div>

			<div className="mt-6">
				{landingTags.length === 0 ? (
					<div className="rounded-xl border border-stone-200 border-dashed bg-white">
						<EmptyState
							icon={BookOpen}
							title="No landing page insights yet"
							description="Admins can pin insights to this portal by selecting 'Landing Page' when publishing a dashboard."
						/>
					</div>
				) : (
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{landingTags.map((tag) => {
							const count = landingDashboards.filter((d) =>
								(d.tags ?? []).includes(tag),
							).length;
							const accent = accentFor(tag);
							return (
								<button
									key={tag}
									type="button"
									onClick={() => setSelectedTag(tag)}
									className="group hover:-translate-y-0.5 flex cursor-pointer flex-col rounded-xl border border-stone-200 bg-white p-5 text-left shadow-soft transition-all duration-200 hover:border-stone-300 hover:shadow-soft-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
								>
									<div className="flex items-center gap-3">
										<div
											className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg text-white"
											style={{
												background: `linear-gradient(135deg, ${accent.stop1}, ${accent.stop2})`,
											}}
										>
											<BookOpen className="h-5 w-5" />
										</div>
										<p className="font-semibold text-[15px] text-stone-900 leading-snug transition-colors group-hover:text-indigo-700">
											{tag}
										</p>
									</div>
									<p className="mt-1 text-[12px] text-stone-400">
										{count} insight
										{count !== 1 ? "s" : ""}
									</p>
								</button>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
