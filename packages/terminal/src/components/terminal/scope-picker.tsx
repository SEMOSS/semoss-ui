import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { useInsight } from "@semoss/sdk/react";
import { AppCatalogAvatar } from "@semoss/shared";
import type { AppRef, FileMode } from "../../types";
import { runPixel } from "../../utility/pixel";
import { useTerminal } from "./terminal-context";

const PAGE_SIZE = 50;
const DEBOUNCE_MS = 250;

/**
 * Top header for the FileExplorer pane. Lets the user choose whether the file
 * tree shows insight-scoped assets or project (app) assets, and which project
 * to browse. The project list paginates 50-at-a-time and supports
 * debounced search via MyProjects's filterWord arg.
 */
export const ScopePicker = () => {
	const terminal = useTerminal();
	const { actions } = useInsight();
	const { t } = useTranslation("chrome");

	const [scope, setScope] = useState<"INSIGHT" | "APP" | "USER">(
		terminal.fileMode.type === "APP"
			? "APP"
			: terminal.fileMode.type === "USER"
				? "USER"
				: "INSIGHT",
	);
	// Lifted into terminal context so file tabs can snapshot the project
	// name (not just the id) when they capture open-time scope.
	const selectedApp = terminal.selectedApp;
	const setSelectedApp = terminal.setSelectedApp;
	const [pickerOpen, setPickerOpen] = useState(false);

	// search + pagination state
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [apps, setApps] = useState<AppRef[]>([]);
	const [offset, setOffset] = useState(0);
	const [hasMore, setHasMore] = useState(true);
	const [loading, setLoading] = useState(false);

	const pickerWrapRef = useRef<HTMLDivElement | null>(null);
	const searchInputRef = useRef<HTMLInputElement | null>(null);

	// focus the search field whenever the picker opens
	useEffect(() => {
		if (pickerOpen) searchInputRef.current?.focus();
	}, [pickerOpen]);

	// close on outside click
	useEffect(() => {
		if (!pickerOpen) return;
		const onClick = (e: MouseEvent) => {
			if (
				pickerWrapRef.current &&
				!pickerWrapRef.current.contains(e.target as Node)
			) {
				setPickerOpen(false);
			}
		};
		document.addEventListener("mousedown", onClick);
		return () => document.removeEventListener("mousedown", onClick);
	}, [pickerOpen]);

	// debounce the search input
	useEffect(() => {
		const t = setTimeout(() => setDebouncedSearch(search), DEBOUNCE_MS);
		return () => clearTimeout(t);
	}, [search]);

	/** Fetch one page of MyProjects, optionally filtered. Resets the list
	 * when `offsetOverride` is 0 (used by search-changes), otherwise appends. */
	const fetchPage = async (offsetOverride: number, filter: string) => {
		setLoading(true);
		const filterArg = filter
			? `filterWord=["<encode>${filter}</encode>"], `
			: "";
		const pixel = `META | MyProjects(${filterArg}limit=[${PAGE_SIZE}], offset=[${offsetOverride}]);`;
		const resp = await runPixel<AppRef[]>(actions, pixel);
		setLoading(false);

		let next: AppRef[] = [];
		if (
			resp &&
			!resp.operationType.some((opType) => opType.indexOf("ERROR") > -1)
		) {
			next = Array.isArray(resp.output) ? resp.output : [];
		}

		if (offsetOverride === 0) {
			setApps(next);
		} else {
			setApps((curr) => [...curr, ...next]);
		}
		setOffset(offsetOverride + next.length);
		setHasMore(next.length === PAGE_SIZE);
	};

	// (re)load when the picker opens or the debounced search changes
	useEffect(() => {
		if (!pickerOpen) return;
		fetchPage(0, debouncedSearch);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pickerOpen, debouncedSearch]);

	// push the resolved mode into the terminal context so FileExplorer + tabs
	// pick it up
	useEffect(() => {
		let nextMode: FileMode = { type: "INSIGHT" };
		if (scope === "USER") {
			nextMode = { type: "USER" };
		} else if (scope === "APP" && selectedApp) {
			nextMode = { type: "APP", app: selectedApp.project_id };
		}
		terminal.setFileMode(nextMode);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [scope, selectedApp?.project_id]);

	return (
		<div className="flex flex-col gap-1.5 border-border border-b bg-muted p-2">
			<div className="inline-flex overflow-hidden rounded border border-border">
				<button
					type="button"
					className={`flex-1 border-border border-r px-2 py-1 text-xs ${
						scope === "INSIGHT"
							? "bg-primary/15 text-primary"
							: "bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
					}`}
					onClick={() => setScope("INSIGHT")}
				>
					{t("scope.insight")}
				</button>
				<button
					type="button"
					className={`flex-1 border-border border-r px-2 py-1 text-xs ${
						scope === "APP"
							? "bg-primary/15 text-primary"
							: "bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
					}`}
					onClick={() => {
						setScope("APP");
						if (!selectedApp) setPickerOpen(true);
					}}
				>
					{t("scope.app")}
				</button>
				<button
					type="button"
					className={`flex-1 px-2 py-1 text-xs ${
						scope === "USER"
							? "bg-primary/15 text-primary"
							: "bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
					}`}
					onClick={() => setScope("USER")}
				>
					{t("scope.user")}
				</button>
			</div>

			{scope === "APP" && (
				<div className="relative" ref={pickerWrapRef}>
					<button
						type="button"
						className={`flex w-full items-center gap-2 rounded border border-border bg-background px-2 py-1.5 text-left text-xs hover:bg-accent hover:text-accent-foreground ${
							pickerOpen ? "border-ring" : ""
						}`}
						onClick={() => setPickerOpen((v) => !v)}
					>
						{selectedApp ? (
							<>
								<AppCatalogAvatar
									name={selectedApp.project_name}
									className="size-6 shrink-0 rounded text-[10px]"
								/>
								<div className="flex min-w-0 flex-1 flex-col">
									<span className="truncate font-medium text-foreground">
										{selectedApp.project_name}
									</span>
									<span className="truncate text-[10px] text-muted-foreground">
										{selectedApp.project_id}
									</span>
								</div>
							</>
						) : (
							<span className="flex-1 text-muted-foreground">
								{t("scope.selectProject")}
							</span>
						)}
						<span className="text-muted-foreground">▾</span>
					</button>

					{pickerOpen && (
						<div className="absolute top-full right-0 left-0 z-20 mt-1 rounded border border-border bg-popover text-popover-foreground shadow-md">
							<div className="border-border border-b p-1.5">
								<input
									ref={searchInputRef}
									type="text"
									placeholder={t("scope.searchProjects")}
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									className="w-full rounded border border-border bg-background px-2 py-1 text-foreground text-xs focus:border-ring focus:outline-none"
								/>
							</div>

							<div
								className="max-h-64 overflow-y-auto"
								onScroll={(e) => {
									if (loading || !hasMore) return;
									const el = e.currentTarget;
									// load next page when we're within 40px of
									// the bottom (infinite scroll)
									if (
										el.scrollHeight -
											el.scrollTop -
											el.clientHeight <
										40
									) {
										fetchPage(offset, debouncedSearch);
									}
								}}
							>
								{loading && apps.length === 0 && (
									<div className="px-2 py-3 text-center text-muted-foreground text-xs">
										{t("scope.loadingProjects")}
									</div>
								)}
								{!loading && apps.length === 0 && (
									<div className="px-2 py-3 text-center text-muted-foreground text-xs">
										{debouncedSearch
											? t("scope.noProjectsMatch", {
													query: debouncedSearch,
												})
											: t("scope.noProjectsFound")}
									</div>
								)}
								{apps.map((app) => (
									<button
										type="button"
										key={app.project_id}
										className={`flex w-full items-center gap-2 border-border border-b px-2 py-2 text-left text-xs last:border-b-0 hover:bg-accent hover:text-accent-foreground ${
											selectedApp?.project_id ===
											app.project_id
												? "bg-primary/10"
												: ""
										}`}
										onClick={() => {
											setSelectedApp(app);
											setPickerOpen(false);
											// attach the project so
											// app-scoped reactors (GetAppAssets,
											// etc.) have what they need
											// server-side
											runPixel(
												actions,
												`LoadApp("${app.project_id}");`,
											).catch(() => {
												/* errors surface on next call */
											});
										}}
										title={app.project_id}
									>
										<AppCatalogAvatar
											name={app.project_name}
											className="size-6 shrink-0 rounded text-[10px]"
										/>
										<div className="flex min-w-0 flex-1 flex-col">
											<span className="truncate font-medium text-foreground">
												{app.project_name}
											</span>
											<span className="truncate text-[10px] text-muted-foreground">
												{app.project_id}
											</span>
										</div>
									</button>
								))}
								{loading && apps.length > 0 && (
									<div className="px-2 py-2 text-center text-[11px] text-muted-foreground">
										{t("scope.loadingMore")}
									</div>
								)}
								{!loading && !hasMore && apps.length > 0 && (
									<div className="px-2 py-2 text-center text-[11px] text-muted-foreground">
										{t("scope.endOfList")}
									</div>
								)}
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
};
