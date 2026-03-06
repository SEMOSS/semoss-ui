/* eslint-disable */
/** biome-ignore-all lint/nursery/useSortedClasses: using existing Tailwind order in this file */

import {
	Bookmark,
	ChevronDown,
	Info,
	MoreHorizontal,
	Search,
	Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
	app_name: string;
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
	const d = new Date(dateStr.replace(" ", "T") + "Z");
	if (isNaN(d.getTime())) return dateStr;
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
	const [deleteEngineId, setDeleteEngineId] = useState<string | null>(null);
	const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

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

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				menuRef.current &&
				!menuRef.current.contains(e.target as Node)
			) {
				setActiveMenuId(null);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleDeleteEngine = async () => {
		if (!deleteEngineId) return;
		setIsDeleting(true);
		try {
			await actions.run(`DeleteEngine(engine=['${deleteEngineId}']);`);
			setData((prev) => {
				if (!prev[0]) return prev;
				const updated = prev[0].filter(
					(i: { app_id: string }) => i.app_id !== deleteEngineId,
				);
				return [updated];
			});
		} catch (err) {
			console.error("DeleteEngine failed:", err);
		} finally {
			setIsDeleting(false);
			setDeleteEngineId(null);
		}
	};

	useEffect(() => {
		const getEngines = async () => {
			try {
				const result = await actions.run(
					`MyEngines ( engineTypes = [ 'VECTOR' ], metaKeys = ["description", "tag"])`,
				);
				const pixelData = result?.pixelReturn?.[0];
				if (!pixelData) {
					console.warn("No pixelReturn data found.");
					return;
				}
				setData([pixelData.output]);
			} catch (error) {
				console.error("Error retrieving vectors", error);
			}
		};
		getEngines();
	}, [actions]);

	const centers = useMemo(() => {
		const tags = new Set<string>();
		data[0]?.forEach((item) => {
			const itemTags = Array.isArray(item?.tag)
				? item.tag
				: item?.tag
					? [item.tag]
					: [];
			itemTags.forEach((tag) => {
				if (tag) tags.add(String(tag));
			});
		});
		return Array.from(tags).sort();
	}, [data]);

	useEffect(() => {
		if (!documentsModalOpen || !selectedEngine?.id) return;
		let cancelled = false;
		setIsLoadingAssets(true);
		setAssetsError(null);
		setEngineAssets([]);
		void actions
			.run<
				{ fileName: string; lastModified: string; fileSize: string }[]
			>(`ListDocumentsInVectorDatabase(engine=["${selectedEngine.id}"]);`)
			.then((result) => {
				if (cancelled) return;
				const output = result?.pixelReturn?.[0]?.output;
				setEngineAssets(
					Array.isArray(output) ? (output as EngineAsset[]) : [],
				);
			})
			.catch((e) => {
				if (cancelled) return;
				setAssetsError(e instanceof Error ? e.message : String(e));
			})
			.finally(() => {
				if (cancelled) return;
				setIsLoadingAssets(false);
			});
		return () => {
			cancelled = true;
		};
	}, [actions, documentsModalOpen, selectedEngine?.id]);

	const formatted: DocumentLibraryEngine[] =
		data[0]?.reduce((acc, item) => {
			acc.push({
				name: item?.app_name || item?.tag || "Untitled",
				subheader: item.database_name || "",
				description: item.description || "",
				id: item.app_id || "",
				app_name: item.app_name || item.tag || "",
				tag: Array.isArray(item?.tag)
					? item.tag
					: item?.tag
						? [item.tag]
						: [],
				dateCreated: item.database_date_created || "",
				favorite:
					item.app_favorite === 1 || item.database_favorite === 1,
			});
			return acc;
		}, []) || [];

	const filteredItems = formatted
		.filter((item) => {
			if (libraryTab === "all") return true;
			const lowerTags = (Array.isArray(item.tag) ? item.tag : [])
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
			return (matchesSearch && matchesCenter) || matchesName;
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

	const getDisplayName = (f: EngineAsset) =>
		f.fileName ||
		f.name ||
		(f.path ? f.path.split(/[/\\]/).pop() : "") ||
		"Untitled";

	const getDisplayPath = (f: EngineAsset) => f.path || "";

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
			setFavorites((prev) => ({ ...prev, [item.id]: current }));
		}
	};

	return (
		<TooltipProvider>
			<div className="space-y-6 p-6">
				<NewKnowledgeOverlay
					open={isNewKnowledgeOpen}
					onClose={(knowledge) => {
						setIsNewKnowledgeOpen(false);
						if (knowledge) {
							void actions
								.run(
									`MyEngines ( engineTypes = [ 'VECTOR' ], metaKeys = ["description", "tag"], metaFilters=[{"tag":${JSON.stringify(["FDA", ...centers])}}])`,
								)
								.then((result) => {
									const pixelData = result?.pixelReturn?.[0];
									if (!pixelData) return;
									setData([pixelData.output]);
									navigate(`/knowledge/${knowledge.id}`);
								});
						}
					}}
				/>

				{/* Documents modal */}
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
								{selectedEngine?.app_name
									? `: ${selectedEngine.app_name}`
									: ""}
							</DialogTitle>
							<DialogDescription>
								{t("knowledge:documents.description")}
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-3">
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

				{/* Delete confirmation dialog — uses only Dialog which we know works */}
				<Dialog
					open={!!deleteEngineId}
					onOpenChange={(open) => {
						if (!isDeleting && !open) setDeleteEngineId(null);
					}}
				>
					<DialogContent className="max-w-sm">
						<DialogHeader>
							<DialogTitle>
								Delete from Knowledge Library?
							</DialogTitle>
							<DialogDescription>
								This action cannot be undone.
							</DialogDescription>
						</DialogHeader>
						<div className="flex justify-end gap-2 pt-4">
							<Button
								variant="outline"
								disabled={isDeleting}
								onClick={() => setDeleteEngineId(null)}
							>
								Cancel
							</Button>
							<Button
								variant="outline"
								disabled={isDeleting}
								onClick={handleDeleteEngine}
								className="border-red-500 text-red-500 hover:bg-red-50"
							>
								{isDeleting ? "Deleting..." : "Delete"}
							</Button>
						</div>
					</DialogContent>
				</Dialog>

				<Card className="rounded-xl border-border bg-card shadow-sm">
					<CardHeader className="pb-3">
						<CardTitle className="text-xl">
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
									className="max-w-xs"
								>
									<div className="space-y-2">
										<p className="font-medium">
											{t(
												"knowledge:whatIsKnowledgeLibrary",
											)}
										</p>
										<p className="text-sm leading-relaxed">
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
					<CardContent className="space-y-3">
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
									<div className="items-bottom flex w-full flex-row flex-wrap items-center gap-2">
										<InputGroup className="min-w-[220px] flex-1 bg-background">
											<InputGroupInput
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
														? "Tags"
														: `Tags (${centerFilter.length})`}
													<ChevronDown className="ml-1 h-4 w-4" />
												</Button>
											</PopoverTrigger>
											<PopoverContent
												className="w-56 p-0"
												align="start"
											>
												<Command>
													<CommandInput placeholder="Search tags…" />
													<CommandList className="max-h-[50vh]">
														<CommandEmpty>
															No tags found.
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
																			className="mr-2"
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
											Favorites
										</Button>

										<Popover>
											<PopoverTrigger asChild>
												<Button
													variant="outline"
													size="sm"
												>
													{sortBy === "name"
														? "Sort: Name"
														: "Sort: Date"}
													<ChevronDown className="ml-1 h-4 w-4" />
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
													Name (A-Z)
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
													Date (newest)
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

				{filteredItems.length > 0 ? (
					<div className="max-h-[70vh] overflow-y-auto pr-1">
						<div className="grid max-w-8xl grid-cols-1 gap-4 md:grid-cols-2">
							{filteredItems.map((item, index) => (
								<div
									key={item.app_name || item.id || index}
									className="relative group"
									ref={
										activeMenuId === item.id
											? menuRef
											: null
									}
								>
									{/* Card — navigates to detail page */}
									<button
										type="button"
										className="w-full text-left"
										onClick={() =>
											navigate(`/knowledge/${item.id}`)
										}
									>
										<Card className="group transition hover:bg-muted/40">
											<CardContent className="flex items-center gap-4 py-2">
												<div className="min-w-0 flex-1">
													<div className="flex min-w-0 items-center gap-2">
														<p className="min-w-0 truncate font-medium text-sm">
															{item.name}
														</p>
														{item.tag.length >
															0 && (
															<div className="flex shrink-0 flex-wrap gap-1">
																{item.tag.map(
																	(tag) => (
																		<Badge
																			key={
																				tag
																			}
																			variant="secondary"
																			className="text-xs"
																		>
																			{
																				tag
																			}
																		</Badge>
																	),
																)}
															</div>
														)}
													</div>
												</div>
												{item.dateCreated && (
													<p className="w-44 shrink-0 text-right text-muted-foreground text-xs tabular-nums">
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
																aria-label="Toggle favorite"
															>
																<Bookmark
																	className={`h-4 w-4 ${
																		(favorites[
																			item
																				.id
																		] ??
																		item.favorite)
																			? "fill-current text-primary"
																			: "text-muted-foreground"
																	}`}
																/>
															</Button>
														</TooltipTrigger>
														<TooltipContent>
															Favorite
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
									</button>

									<div
										className="absolute top-2 right-2 z-10"
										role="none"
										onClick={(e) => e.stopPropagation()}
									>
										<button
											type="button"
											className="flex h-7 w-7 items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 text-gray-500"
											onClick={() =>
												setActiveMenuId((prev) =>
													prev === item.id
														? null
														: item.id,
												)
											}
											aria-label="More options"
										>
											<MoreHorizontal className="h-4 w-4" />
										</button>

										{activeMenuId === item.id && (
											<div className="absolute right-0 top-8 z-20 w-52 rounded-md border border-gray-200 bg-white shadow-lg">
												<button
													type="button"
													className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
													onClick={() => {
														setActiveMenuId(null);
														setDeleteEngineId(
															item.id,
														);
													}}
												>
													<Trash2 className="h-4 w-4" />
													Delete Knowledge
												</button>
											</div>
										)}
									</div>
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
