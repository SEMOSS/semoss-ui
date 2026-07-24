import {
	Check,
	Copy,
	ExternalLink,
	Globe,
	Lock,
	Plus,
	RefreshCw,
	Rocket,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { accentFor } from "@/components/DashboardCard";
import { FolderRail, type FolderSel } from "@/components/FolderRail";
import { MoveToFolder } from "@/components/MoveToFolder";
import {
	Button,
	ConfirmDialog,
	EmptyState,
	ErrorState,
	Input,
	LoadingState,
} from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { useWorkspace } from "@/workspace/WorkspaceProvider";

// Public portal URL for a published project — must point at the SEMOSS backend.
const BACKEND_ORIGIN = String(import.meta.env.ENDPOINT || "").replace(
	/\/+$/,
	"",
);
const MODULE_PATH = (
	String(import.meta.env.MODULE || "") || "/Monolith"
).replace(/\/+$/, "");
const publishedUrl = (id: string) =>
	`${(BACKEND_ORIGIN || window.location.origin) + MODULE_PATH}/public_home/${encodeURIComponent(id)}/portals/`;

export function PublishedPage() {
	const {
		dashboards,
		folders,
		renameFolder,
		deleteFolder,
		toggleDashboardTag,
		loading,
		error,
		reload,
	} = useWorkspace();
	// Every dashboard you can access (access is enforced by SEMOSS — apps shared
	// with no one but their owner never appear for other users).
	const apps = useMemo(
		() =>
			dashboards.map((d) => ({
				id: d.id,
				name: d.name,
				description: d.description ?? "",
				url: publishedUrl(d.id),
				published: !!d.published,
				tags: d.tags ?? [],
			})),
		[dashboards],
	);
	const [query, setQuery] = useState("");
	const [folderSel, setFolderSel] = useState<FolderSel>("all");
	const [folderToDelete, setFolderToDelete] = useState<string | null>(null);
	const toast = useToast();
	const [copiedId, setCopiedId] = useState<string | null>(null);
	const copyLink = async (id: string, url: string) => {
		const absolute = new URL(url, window.location.origin).href;
		try {
			await navigator.clipboard.writeText(absolute);
			setCopiedId(id);
			setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1500);
			toast.success("Portal link copied to clipboard.", "Copied");
		} catch {
			toast.error(absolute, "Copy failed — here’s the link");
		}
	};

	// A dashboard can be in MANY folders at once — count it in each tag's folder.
	const counts = useMemo(() => {
		const map = new Map<string, number>();
		let unfiled = 0;
		for (const a of apps) {
			if (a.tags.length === 0) unfiled += 1;
			for (const t of a.tags) map.set(t, (map.get(t) ?? 0) + 1);
		}
		return { map, unfiled };
	}, [apps]);

	const inFolder = (a: { tags: string[] }) => {
		if (folderSel === "all") return true;
		if (folderSel === "unfiled") return a.tags.length === 0;
		return a.tags.includes(folderSel);
	};

	const filtered = apps.filter((a) => {
		const q = query.toLowerCase();
		const matchesSearch =
			!q ||
			a.name.toLowerCase().includes(q) ||
			a.description?.toLowerCase().includes(q);
		return inFolder(a) && matchesSearch;
	});

	return (
		<div className="mx-auto max-w-7xl px-6 py-6">
			{/* Header */}
			<div className="flex flex-wrap items-end justify-between gap-3">
				<div>
					<h1 className="font-bold text-stone-900 text-xl tracking-tight">
						Dashboards
					</h1>
					<p className="mt-0.5 text-[13px] text-stone-500">
						Saved dashboards, organized by folder tags
						{!loading && !error && (
							<>
								<span className="mx-1.5 text-stone-300">·</span>
								{apps.length} dashboard
								{apps.length !== 1 ? "s" : ""}
							</>
						)}
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="secondary"
						size="sm"
						onClick={() => void reload()}
						disabled={loading}
					>
						<RefreshCw
							className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
						/>{" "}
						Refresh
					</Button>
					<Link
						to="/dashboards/new"
						className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 px-3.5 py-2 font-semibold text-[13px] text-white shadow-soft transition-colors hover:from-indigo-400 hover:to-violet-500"
					>
						<Plus className="h-4 w-4" /> New dashboard
					</Link>
				</div>
			</div>

			<div className="mt-5 flex items-start gap-5">
				{/* Folder rail */}
				<FolderRail
					folders={folders}
					counts={counts}
					total={apps.length}
					selected={folderSel}
					onSelect={setFolderSel}
					allLabel="All dashboards"
					allIcon={Globe}
					onRename={renameFolder}
					onDelete={(id) => setFolderToDelete(id)}
				/>

				{/* Main column */}
				<div className="min-w-0 flex-1 space-y-4">
					{apps.length > 0 && (
						<Input
							type="text"
							placeholder="Search published apps…"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							className="w-full max-w-md rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
						/>
					)}

					{loading ? (
						<div className="rounded-xl border border-stone-200 bg-white">
							<LoadingState message="Loading published dashboards…" />
						</div>
					) : error ? (
						<div className="space-y-3">
							<ErrorState message={error} />
							<p className="text-stone-400 text-xs">
								This list reads from your SEMOSS instance. If
								you're running locally without a session it may
								be unavailable.
							</p>
						</div>
					) : apps.length === 0 ? (
						<div className="rounded-xl border border-stone-200 border-dashed bg-white">
							<EmptyState
								icon={Rocket}
								title="Nothing published yet"
								description="Publish a dashboard to deploy it as a live SEMOSS app. Published apps tagged data--insight appear here for everyone."
								action={
									<Link
										to="/dashboards"
										className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 px-3 py-1.5 font-semibold text-white text-xs shadow-soft transition-colors hover:from-indigo-400 hover:to-violet-500"
									>
										Go to dashboards
									</Link>
								}
							/>
						</div>
					) : filtered.length === 0 ? (
						<div className="rounded-xl border border-stone-200 border-dashed bg-white">
							<EmptyState
								icon={Globe}
								title={
									folderSel !== "all"
										? "This folder is empty"
										: "No matches"
								}
								description={
									folderSel !== "all"
										? "Move apps here from the folder menu on any card."
										: `Nothing matches “${query}”.`
								}
							/>
						</div>
					) : (
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
							{filtered.map((app) => {
								const accent = accentFor(app.id);
								const initial = (
									app.name.trim()[0] ?? "?"
								).toUpperCase();
								return (
									<div
										key={app.id}
										className="group hover:-translate-y-0.5 relative flex flex-col rounded-xl border border-stone-200 bg-white shadow-soft transition-all duration-200 ease-out hover:border-stone-300 hover:shadow-soft-lg"
									>
										{/* Folder picker overlay (sibling of the link) */}
										<div className="absolute top-2.5 right-2.5 z-10 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
											<MoveToFolder
												folders={folders}
												selected={app.tags}
												onToggle={(folderId, on) =>
													toggleDashboardTag(
														app.id,
														folderId,
														on,
													)
												}
												className="rounded-md bg-white/80 p-1.5 text-stone-400 backdrop-blur-sm transition-colors hover:bg-indigo-50 hover:text-indigo-600"
											/>
										</div>

										<Link
											to={`/dashboard/${app.id}`}
											className="flex flex-1 flex-col rounded-xl focus:outline-none"
										>
											<div className="flex items-start gap-3 px-4 pt-4 pr-12 pb-3">
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
										</Link>

										{/* Footer is a SIBLING of the card Link so it can hold a real
                                            anchor (an <a> nested inside <Link> would be invalid). */}
										<div className="mt-auto flex items-center gap-2 border-stone-100 border-t bg-stone-50/60 px-4 py-2.5">
											{app.published ? (
												<span className="inline-flex items-center gap-1.5 font-medium text-[11px] text-emerald-600">
													<span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{" "}
													Live
												</span>
											) : (
												<span className="inline-flex items-center gap-1 font-medium text-[11px] text-stone-400">
													<Lock className="h-3 w-3" />{" "}
													Private
												</span>
											)}
											<span className="flex-1" />
											<button
												type="button"
												onClick={() =>
													void copyLink(
														app.id,
														app.url,
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
												href={app.url}
												target="_blank"
												rel="noopener noreferrer"
												title="Open the dashboard portal in a new tab"
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
			</div>

			<ConfirmDialog
				open={folderToDelete !== null}
				danger
				title="Delete folder?"
				message={
					<>
						This permanently removes the folder{" "}
						<span className="font-medium">tag</span>. The dashboards
						inside just lose this tag — they are{" "}
						<span className="font-medium">not</span> deleted. This
						action can’t be undone.
					</>
				}
				confirmLabel="Delete folder"
				onCancel={() => setFolderToDelete(null)}
				onConfirm={() => {
					if (folderToDelete) {
						deleteFolder(folderToDelete);
						if (folderSel === folderToDelete) setFolderSel("all");
					}
					setFolderToDelete(null);
				}}
			/>
		</div>
	);
}
