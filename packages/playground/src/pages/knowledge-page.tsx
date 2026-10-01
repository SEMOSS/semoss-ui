import { Bookmark, ChevronDown, Info, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "@semoss/i18n";
import { Env, post, useInsight } from "@semoss/sdk/react";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Checkbox,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Spinner,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@semoss/ui/next";
import { NewKnowledgeOverlay } from "@/components/knowledge/new-knowledge-mcp-overlay";

type DocumentLibraryEngine = {
	name: string;
	subheader: string;
	description: string;
	id: string;
	engine_name: string;
	tag: string[];
	dateCreated: string;
	favorite: boolean;
};

type EngineAsset = {
	name?: string;
	path?: string;
	type?: string;
	fileName?: string;
	lastModified?: string;
	fileSize?: string;
};

const formatDateTime = (dateStr: string): string => {
	const d = new Date(`${dateStr.replace(" ", "T")}Z`);
	if (Number.isNaN(d.getTime())) return dateStr;
	return d.toLocaleString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	});
};

export const DocumentLibrary = () => {
	const { t } = useTranslation(["knowledge", "common"]);
	const navigate = useNavigate();

	const [search, setSearch] = useState("");
	const [centerFilter, setCenterFilter] = useState<string[]>([]);
	const [sortBy, setSortBy] = useState<"name" | "date">("name");
	const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
	const [libraryTab, setLibraryTab] = useState<"all" | "global" | "mine">(
		"all",
	);
	const [isNewKnowledgeOpen, setIsNewKnowledgeOpen] = useState(false);

	const [documentsModalOpen, setDocumentsModalOpen] = useState(false);
	const [selectedEngine, setSelectedEngine] =
		useState<DocumentLibraryEngine | null>(null);
	const [engineAssets, setEngineAssets] = useState<EngineAsset[]>([]);
	const [isLoadingAssets, setIsLoadingAssets] = useState(false);
	const [assetsError, setAssetsError] = useState<string | null>(null);
	const [favorites, setFavorites] = useState<Record<string, boolean>>({});

	const { actions } = useInsight();
	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState(false);
	const [reload, setReload] = useState(0);

	// biome-ignore lint/correctness/useExhaustiveDependencies: explicit retry counter restarts this read after an error.
	useEffect(() => {
		let active = true;
		const getEngines = async () => {
			setLoading(true);
			setLoadError(false);
			try {
				const result = await actions.run(
					`MyEngines ( engineTypes = [ 'VECTOR' ], metaKeys = ["description", "tag"])`,
				);

				const pixelData = result?.pixelReturn?.[0];
				if (!pixelData) {
					console.warn("No pixelReturn data found.");
					return;
				}

				const output = pixelData.output;
				if (active) setData([output]);
			} catch (error) {
				console.error("Error retrieving vectors", error);
				if (active) setLoadError(true);
			} finally {
				if (active) setLoading(false);
			}
		};

		void getEngines();
		return () => {
			active = false;
		};
	}, [actions, reload]);

	const centers = useMemo(() => {
		const tags = new Set<string>();
		data[0]?.forEach((item) => {
			const itemTags = Array.isArray(item?.tag)
				? item.tag
				: item?.tag
					? [item.tag]
					: [];
			itemTags.forEach((tag) => {
				if (tag) {
					tags.add(String(tag));
				}
			});
		});
		return Array.from(tags).sort();
	}, [data]);

	useEffect(() => {
		if (!documentsModalOpen || !selectedEngine?.id) {
			return;
		}

		let cancelled = false;
		setIsLoadingAssets(true);
		setAssetsError(null);
		setEngineAssets([]);

		void actions
			.run<
				{ fileName: string; lastModified: string; fileSize: string }[]
			>(`ListDocumentsInVectorDatabase(engine=["${selectedEngine.id}"]);`)
			.then((result) => {
				if (cancelled) {
					return;
				}

				const output = result?.pixelReturn?.[0]?.output;
				const assets = Array.isArray(output)
					? (output as EngineAsset[])
					: [];
				setEngineAssets(assets);
			})
			.catch((e) => {
				if (cancelled) {
					return;
				}
				setAssetsError(e instanceof Error ? e.message : String(e));
			})
			.finally(() => {
				if (cancelled) {
					return;
				}
				setIsLoadingAssets(false);
			});

		return () => {
			cancelled = true;
		};
	}, [actions, documentsModalOpen, selectedEngine?.id]);

	const formatted: DocumentLibraryEngine[] =
		data[0]?.reduce((acc, item) => {
			const name =
				item?.engine_display_name ||
				item?.engine_name ||
				item?.tag ||
				"Untitled";
			acc.push({
				name,
				subheader: item.engine_name || "",
				description: item.description || "",
				id: item.engine_id || "",
				engine_name: item.engine_name || item.tag || "",
				tag: Array.isArray(item?.tag)
					? item.tag
					: item?.tag
						? [item.tag]
						: [],
				dateCreated: item.engine_date_created || "",
				favorite: item.engine_favorite === 1,
			});

			return acc;
		}, []) || [];

	const filteredItems = formatted
		.filter((item) => {
			// NOTE: Today we only have tags; until we have an explicit ownership/global flag,
			// use conservative heuristics:
			// - "mine": no FDA/center tags
			// - "global": has FDA or a known center tag
			if (libraryTab === "all") {
				return true;
			}

			const tags = Array.isArray(item.tag) ? item.tag : [];
			const lowerTags = tags
				.filter(Boolean)
				.map((t) => String(t).toLowerCase());

			const isGlobal = lowerTags.includes("fda")
				? true
				: centers.some((c) => lowerTags.includes(c.toLowerCase()));

			return libraryTab === "global" ? isGlobal : !isGlobal;
		})
		.filter((item) => {
			const matchesSearch =
				!search ||
				search.trim() === "" ||
				item?.tag?.some((a) =>
					a?.toLowerCase()?.includes(search?.toLowerCase()),
				);

			let matchesCenter = true;
			try {
				matchesCenter =
					centerFilter.length === 0 ||
					centerFilter.some((filter) =>
						item?.tag?.some((a) =>
							a?.toLowerCase()?.includes(filter.toLowerCase()),
						),
					);
			} catch (e) {
				console.error(e);
			}

			let matchesName = true;

			try {
				matchesName = item?.name
					?.toLowerCase()
					?.includes(search?.toLowerCase());
			} catch (e) {
				console.error(e);
			}

			return (matchesSearch || matchesName) && matchesCenter;
		})
		.filter((item) => {
			if (!showFavoritesOnly) return true;
			return favorites[item.id] ?? item.favorite;
		})
		.sort((a, b) => {
			if (sortBy === "name") return a.name.localeCompare(b.name);
			return b.dateCreated.localeCompare(a.dateCreated);
		});

	const documentFiles = useMemo(() => {
		return engineAssets
			.filter((a) => a && typeof a === "object")
			.filter((a) => (a.type ? a.type !== "folder" : true));
	}, [engineAssets]);

	const getDisplayName = (f: EngineAsset) => {
		return (
			f.fileName ||
			f.name ||
			(f.path ? f.path.split(/[/\\]/).pop() : "") ||
			"Untitled"
		);
	};

	const getDisplayPath = (f: EngineAsset) => {
		return f.path || "";
	};

	const toggleFavorite = async (
		e: React.MouseEvent,
		item: DocumentLibraryEngine,
	) => {
		e.stopPropagation();
		const current = favorites[item.id] ?? item.favorite;
		const next = !current;
		setFavorites((prev) => ({ ...prev, [item.id]: next }));
		try {
			await post<{ success: boolean }>(
				`${Env.MODULE}/api/auth/engine/setEngineFavorite`,
				{ engineId: item.id, isFavorite: next },
				{},
			);
		} catch {
			// Revert on failure
			setFavorites((prev) => ({ ...prev, [item.id]: current }));
		}
	};

	return (
		<TooltipProvider>
			<div className="mx-auto h-full w-full max-w-5xl space-y-6 overflow-y-auto px-4 py-6 sm:px-6">
				<NewKnowledgeOverlay
					open={isNewKnowledgeOpen}
					onClose={(knowledge) => {
						setIsNewKnowledgeOpen(false);

						// refresh list if a knowledge source was created
						if (knowledge) {
							void actions
								.run(
									`MyEngines ( engineTypes = [ 'VECTOR' ], metaKeys = ["description", "tag"],  metaFilters=[{"tag":${JSON.stringify(
										["FDA", ...centers],
									)}}])`,
								)
								.then((result) => {
									const pixelData = result?.pixelReturn?.[0];
									if (!pixelData) {
										return;
									}
									setData([pixelData.output]);
								});
						}
					}}
				/>

				<Dialog
					open={documentsModalOpen}
					onOpenChange={(open) => {
						setDocumentsModalOpen(open);
						if (!open) {
							setSelectedEngine(null);
							setEngineAssets([]);
							setAssetsError(null);
							setIsLoadingAssets(false);
						}
					}}
				>
					<DialogContent className="max-w-2xl">
						<DialogHeader>
							<DialogTitle>
								{t("knowledge:documents.title")}
								{selectedEngine?.engine_name
									? `: ${selectedEngine.engine_name}`
									: ""}
							</DialogTitle>
							<DialogDescription>
								{t("knowledge:documents.description")}
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-3 px-0">
							{isLoadingAssets ? (
								<div className="text-muted-foreground text-sm">
									{t("knowledge:messages.loadingDocuments")}
								</div>
							) : assetsError ? (
								<div className="text-destructive text-sm">
									{assetsError}
								</div>
							) : documentFiles.length === 0 ? (
								<div className="text-muted-foreground text-sm">
									{t("knowledge:messages.noDocuments")}
								</div>
							) : (
								<ul className="divide-y rounded-md border">
									{documentFiles.map((f, idx) => (
										<li
											key={`${getDisplayPath(f) || getDisplayName(f)}-${idx}`}
											className="flex items-center justify-between gap-3 px-3 py-2"
										>
											<div className="min-w-0">
												<p className="truncate font-medium text-sm">
													{getDisplayName(f)}
												</p>
												{getDisplayPath(f) ? (
													<p className="truncate text-muted-foreground text-xs">
														{getDisplayPath(f)}
													</p>
												) : null}
											</div>
										</li>
									))}
								</ul>
							)}
						</div>
					</DialogContent>
				</Dialog>

				<Card className="rounded-none border-0 border-b bg-transparent shadow-none">
					<CardHeader className="px-0 pb-3">
						<CardTitle className="text-2xl">
							{t("knowledge:title")}{" "}
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										className="h-8 w-8 text-muted-foreground"
									>
										<Info className="h-4 w-4" />
										<span className="sr-only">
											{t("knowledge:aboutTitle")}
										</span>
									</Button>
								</TooltipTrigger>
								<TooltipContent
									side="right"
									className="max-w-sm"
								>
									<div className="space-y-2">
										<p className="font-medium">
											{t(
												"knowledge:whatIsKnowledgeStore",
											)}
										</p>
										<p className="text-muted-foreground text-sm leading-relaxed">
											{t("knowledge:ragDescription")}
										</p>
									</div>
								</TooltipContent>
							</Tooltip>
						</CardTitle>
						<CardDescription>
							{t("knowledge:subtitle")}
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3 px-0">
						<Tabs
							value={libraryTab}
							onValueChange={(v) =>
								setLibraryTab(v as "all" | "global" | "mine")
							}
						>
							<TabsList>
								<TabsTrigger value="all">
									{t("knowledge:tabs.all")}
								</TabsTrigger>
								<TabsTrigger value="global">
									{t("knowledge:tabs.global")}
								</TabsTrigger>
								<TabsTrigger value="mine">
									{t("knowledge:tabs.mine")}
								</TabsTrigger>
							</TabsList>
							<TabsContent value={libraryTab}>
								<div className="flex w-full flex-col gap-3">
									<div className="flex w-full flex-row flex-wrap items-center gap-2">
										<InputGroup className="min-w-0 flex-1 basis-full bg-background sm:basis-auto">
											<InputGroupInput
												aria-label={t(
													"common:buttons.search",
												)}
												placeholder={t(
													"common:buttons.search",
												)}
												value={search}
												onChange={(e) =>
													setSearch(e.target.value)
												}
											/>
											<InputGroupAddon>
												<Search />
											</InputGroupAddon>
										</InputGroup>

										<Popover>
											<PopoverTrigger asChild>
												<Button
													variant="outline"
													size="sm"
												>
													{centerFilter.length === 0
														? t(
																"knowledge:studio.tags",
															)
														: `${t("knowledge:studio.tags")} (${centerFilter.length})`}
													<ChevronDown className="ms-1 h-4 w-4" />
												</Button>
											</PopoverTrigger>
											<PopoverContent
												className="w-56 p-0"
												align="start"
											>
												<Command>
													<CommandInput
														placeholder={t(
															"knowledge:studio.searchTags",
														)}
													/>
													<CommandList className="max-h-[50vh]">
														<CommandEmpty>
															{t(
																"knowledge:studio.noTags",
															)}
														</CommandEmpty>
														<CommandGroup>
															{centers.map(
																(center) => (
																	<CommandItem
																		key={
																			center
																		}
																		onSelect={() =>
																			setCenterFilter(
																				(
																					prev,
																				) =>
																					prev.includes(
																						center,
																					)
																						? prev.filter(
																								(
																									c,
																								) =>
																									c !==
																									center,
																							)
																						: [
																								...prev,
																								center,
																							],
																			)
																		}
																	>
																		<Checkbox
																			checked={centerFilter.includes(
																				center,
																			)}
																			className="me-2"
																		/>
																		{center}
																	</CommandItem>
																),
															)}
														</CommandGroup>
													</CommandList>
												</Command>
											</PopoverContent>
										</Popover>

										<Button
											variant={
												showFavoritesOnly
													? "secondary"
													: "outline"
											}
											size="sm"
											onClick={() =>
												setShowFavoritesOnly((v) => !v)
											}
										>
											<Bookmark
												className={
													showFavoritesOnly
														? "h-4 w-4 fill-current"
														: "h-4 w-4"
												}
											/>
											{t("knowledge:studio.favorites")}
										</Button>

										<Popover>
											<PopoverTrigger asChild>
												<Button
													variant="outline"
													size="sm"
												>
													{sortBy === "name"
														? t(
																"knowledge:studio.sortName",
															)
														: t(
																"knowledge:studio.sortDate",
															)}
													<ChevronDown className="ms-1 h-4 w-4" />
												</Button>
											</PopoverTrigger>
											<PopoverContent
												className="w-44 p-1"
												align="start"
											>
												<Button
													variant={
														sortBy === "name"
															? "secondary"
															: "ghost"
													}
													size="sm"
													className="w-full justify-start"
													onClick={() =>
														setSortBy("name")
													}
												>
													{t(
														"knowledge:studio.sortName",
													)}
												</Button>
												<Button
													variant={
														sortBy === "date"
															? "secondary"
															: "ghost"
													}
													size="sm"
													className="w-full justify-start"
													onClick={() =>
														setSortBy("date")
													}
												>
													{t(
														"knowledge:studio.sortDate",
													)}
												</Button>
											</PopoverContent>
										</Popover>

										<Button
											variant="default"
											onClick={() =>
												setIsNewKnowledgeOpen(true)
											}
										>
											{t(
												"knowledge:actions.createSource",
											)}
										</Button>
									</div>
								</div>
							</TabsContent>
						</Tabs>
					</CardContent>
				</Card>

				{loading ? (
					<div className="flex justify-center p-8">
						<Spinner />
					</div>
				) : loadError ? (
					<div
						role="alert"
						className="flex flex-col items-center gap-3 rounded-xl border p-6"
					>
						<p>{t("knowledge:studio.loadError")}</p>
						<Button
							variant="outline"
							onClick={() => setReload((value) => value + 1)}
						>
							{t("knowledge:studio.retry")}
						</Button>
					</div>
				) : filteredItems.length > 0 ? (
					<div className="w-full">
						<div className="flex flex-col gap-2">
							{filteredItems.map((item) => (
								<div key={item.id} className="w-full">
									<Card className="group border-border bg-card shadow-none transition-colors hover:border-primary/30">
										<CardContent className="flex flex-wrap items-center gap-3 p-3">
											<div className="min-w-0 flex-1">
												<div className="flex min-w-0 flex-wrap items-center gap-2">
													<Link
														to={`/knowledge/${item.id}`}
														className="min-w-0 break-words font-medium text-foreground text-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
													>
														{item.name}
													</Link>
													{item.tag.length > 0 && (
														<div className="flex min-w-0 flex-wrap gap-1">
															{item.tag.map(
																(tag) => (
																	<Badge
																		key={
																			tag
																		}
																		variant="secondary"
																		className="text-xs"
																	>
																		{tag}
																	</Badge>
																),
															)}
														</div>
													)}
												</div>
											</div>
											{item.dateCreated && (
												<p className="hidden shrink-0 text-end text-muted-foreground text-xs tabular-nums lg:block">
													{formatDateTime(
														item.dateCreated,
													)}
												</p>
											)}
											<div className="flex shrink-0 items-center gap-2">
												<Tooltip>
													<TooltipTrigger asChild>
														<Button
															variant="ghost"
															size="icon-sm"
															onClick={(e) =>
																toggleFavorite(
																	e,
																	item,
																)
															}
															aria-label={t(
																"knowledge:studio.favorite",
															)}
															aria-pressed={
																favorites[
																	item.id
																] ??
																item.favorite
															}
														>
															<Bookmark
																className={`h-4 w-4 ${
																	(favorites[
																		item.id
																	] ??
																	item.favorite)
																		? "fill-current text-primary"
																		: "text-muted-foreground"
																}`}
															/>
														</Button>
													</TooltipTrigger>
													<TooltipContent>
														{t(
															"knowledge:studio.favorite",
														)}
													</TooltipContent>
												</Tooltip>
												<Button
													size="sm"
													variant="outline"
													onClick={(e) => {
														e.stopPropagation();
														navigate(
															`/new?knowledgeId=${encodeURIComponent(item.id)}`,
														);
													}}
												>
													{t(
														"knowledge:actions.newChat",
													)}
												</Button>
											</div>
										</CardContent>
									</Card>
								</div>
							))}
						</div>
					</div>
				) : (
					<div className="rounded-lg border border-dashed p-10 text-center">
						<p className="text-muted-foreground">
							{t("knowledge:messages.noLibrariesFound")}
						</p>
					</div>
				)}
			</div>
		</TooltipProvider>
	);
};
