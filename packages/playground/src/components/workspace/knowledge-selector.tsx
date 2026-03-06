import {
	BookmarkIcon,
	CheckIcon,
	ChevronDownIcon,
	FileIcon,
	FileImageIcon,
	FileSpreadsheetIcon,
	FileTextIcon,
	InfoIcon,
	PlusIcon,
	SearchIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Env, post, useInsight, usePixel } from "@semoss/sdk/react";
import {
	Badge,
	Button,
	Checkbox,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Spinner,
	toast,
} from "@semoss/ui/next";
import { NewKnowledgeOverlay } from "@/components/knowledge/new-knowledge-mcp-overlay";
import type { MCPConfig } from "@/types";
import { formatDateTime } from "@/utility";

type KnowledgeItem = {
	id: string;
	name: string;
	description: string;
	tags: string[];
	dateCreated: string;
	favorite: boolean;
};

type EngineAsset = {
	fileName?: string;
	name?: string;
	path?: string;
	type?: string;
	lastModified?: string;
	fileSize?: string | number;
};

const getFileIcon = (fileName: string) => {
	const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
	if (ext === "pdf")
		return <FileTextIcon className="h-4 w-4 shrink-0 text-red-500" />;
	if (ext === "doc" || ext === "docx")
		return <FileTextIcon className="h-4 w-4 shrink-0 text-blue-500" />;
	if (ext === "xls" || ext === "xlsx" || ext === "csv")
		return (
			<FileSpreadsheetIcon className="h-4 w-4 shrink-0 text-green-600" />
		);
	if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext))
		return <FileImageIcon className="h-4 w-4 shrink-0 text-purple-500" />;
	return <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />;
};

const formatFileSize = (fileSize: string | number): string => {
	const s = String(fileSize ?? "");
	const match = s.match(/^([\d.]+)\s*(KB|MB|GB|B)?$/i);
	if (!match) return s;
	const num = parseFloat(match[1]);
	const unit = (match[2] ?? "B").toUpperCase();
	let bytes = num;
	if (unit === "GB") bytes = num * 1024 * 1024 * 1024;
	else if (unit === "MB") bytes = num * 1024 * 1024;
	else if (unit === "KB") bytes = num * 1024;
	if (bytes === 0) return s;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

interface KnowledgeSelectorProps {
	values: MCPConfig[];
	onChange: (values: MCPConfig[]) => void;
	disabled?: boolean;
}

export const KnowledgeSelector = ({
	values,
	onChange,
	disabled = false,
}: KnowledgeSelectorProps) => {
	const { actions } = useInsight();

	// Filter / sort state
	const [search, setSearch] = useState("");
	const [tagFilter, setTagFilter] = useState<string[]>([]);
	const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
	const [sortBy, setSortBy] = useState<"name" | "date">("name");

	// Local favorite overrides (optimistic updates)
	const [favorites, setFavorites] = useState<Record<string, boolean>>({});

	// Create new knowledge
	const [newKnowledgeOpen, setNewKnowledgeOpen] = useState(false);

	// Info / document modal
	const [infoItem, setInfoItem] = useState<KnowledgeItem | null>(null);
	const [docAssets, setDocAssets] = useState<EngineAsset[]>([]);
	const [docLoading, setDocLoading] = useState(false);
	const [docError, setDocError] = useState<string | null>(null);

	// Fetch all vector engines (same pixel as the main knowledge page)
	const getKnowledge = usePixel<
		{
			app_id?: string;
			app_name?: string;
			app_favorite?: number;
			database_date_created?: string;
			database_favorite?: number;
			description?: string;
			tag?: string | string[];
		}[]
	>(`MyEngines(engineTypes=['VECTOR'], metaKeys=["description","tag"]);`, {
		data: [],
	});

	// Normalize raw pixel response into typed items
	const items: KnowledgeItem[] = useMemo(() => {
		if (!getKnowledge.data) return [];
		return getKnowledge.data.map((item) => {
			const rawTag = item.tag;
			const tags = Array.isArray(rawTag)
				? rawTag
				: rawTag
					? [rawTag]
					: [];
			return {
				id: item.app_id || "",
				name: item.app_name || "Untitled",
				description: item.description || "",
				tags,
				dateCreated: item.database_date_created || "",
				favorite:
					item.app_favorite === 1 || item.database_favorite === 1,
			};
		});
	}, [getKnowledge.data]);

	// All unique tags across all items (for the filter popover)
	const allTags = useMemo(() => {
		const set = new Set<string>();
		items.forEach((item) => {
			item.tags.forEach((t) => {
				if (t) set.add(t);
			});
		});
		return Array.from(set).sort();
	}, [items]);

	// IDs of currently attached knowledge sources (local state to avoid re-render loops)
	const [selectedIds, setSelectedIds] = useState<Set<string>>(
		() => new Set(values.map((v) => v.id)),
	);

	// Sync selectedIds when the values prop changes from the parent
	useEffect(() => {
		setSelectedIds(new Set(values.map((v) => v.id)));
	}, [values]);

	// Apply search + tag filter + favorites filter + sort
	const filtered = useMemo(() => {
		let list = items;

		if (search.trim()) {
			const q = search.toLowerCase();
			list = list.filter(
				(item) =>
					item.name.toLowerCase().includes(q) ||
					item.description.toLowerCase().includes(q) ||
					item.tags.some((t) => t.toLowerCase().includes(q)),
			);
		}

		if (tagFilter.length > 0) {
			list = list.filter((item) =>
				tagFilter.some((f) =>
					item.tags.some((t) => t.toLowerCase() === f.toLowerCase()),
				),
			);
		}

		if (showFavoritesOnly) {
			list = list.filter((item) => favorites[item.id] ?? item.favorite);
		}

		list = [...list].sort((a, b) => {
			if (sortBy === "name") return a.name.localeCompare(b.name);
			return b.dateCreated.localeCompare(a.dateCreated);
		});

		return list;
	}, [items, search, tagFilter, showFavoritesOnly, favorites, sortBy]);

	const toggleSelected = (item: KnowledgeItem) => {
		if (disabled) return;
		const next = new Set(selectedIds);
		if (next.has(item.id)) {
			next.delete(item.id);
			onChange(values.filter((v) => v.id !== item.id));
		} else {
			next.add(item.id);
			onChange([
				...values,
				{
					id: item.id,
					name: item.name,
					description: item.description,
					type: "VECTOR",
				},
			]);
		}
		setSelectedIds(next);
	};

	const toggleFavorite = async (e: React.MouseEvent, item: KnowledgeItem) => {
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
			toast.error("Failed to update favorite.");
		}
	};

	const openInfo = async (e: React.MouseEvent, item: KnowledgeItem) => {
		e.stopPropagation();
		setInfoItem(item);
		setDocAssets([]);
		setDocError(null);
		setDocLoading(true);
		try {
			const result = await actions.run(
				`ListDocumentsInVectorDatabase(engine=["${item.id}"]);`,
			);
			const output = result?.pixelReturn?.[0]?.output;
			const assets: EngineAsset[] = Array.isArray(output) ? output : [];
			setDocAssets(assets.filter((a) => a?.type !== "folder"));
		} catch (err) {
			setDocError(
				err instanceof Error
					? err.message
					: "Failed to load documents.",
			);
		} finally {
			setDocLoading(false);
		}
	};

	if (getKnowledge.status === "LOADING") {
		return (
			<div className="flex h-32 items-center justify-center">
				<Spinner />
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-3">
			{/* Row 1: search + filter controls */}
			<div className="flex flex-wrap items-center gap-2">
				<InputGroup className="min-w-[180px] flex-1 bg-background">
					<InputGroupInput
						placeholder="Search knowledge sources..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") e.preventDefault();
						}}
					/>
					<InputGroupAddon>
						<SearchIcon className="size-4" />
					</InputGroupAddon>
				</InputGroup>

				{/* Tag filter */}
				{allTags.length > 0 && (
					<Popover>
						<PopoverTrigger asChild>
							<Button type="button" variant="outline" size="sm">
								{tagFilter.length === 0
									? "Tags"
									: `Tags (${tagFilter.length})`}
								<ChevronDownIcon className="ml-1 h-4 w-4" />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-52 p-0" align="start">
							<Command>
								<CommandInput placeholder="Search tags…" />
								<CommandList className="max-h-48">
									<CommandEmpty>No tags found.</CommandEmpty>
									<CommandGroup>
										{allTags.map((tag) => (
											<CommandItem
												key={tag}
												onSelect={() =>
													setTagFilter((prev) =>
														prev.includes(tag)
															? prev.filter(
																	(t) =>
																		t !==
																		tag,
																)
															: [...prev, tag],
													)
												}
											>
												<Checkbox
													checked={tagFilter.includes(
														tag,
													)}
													className="mr-2"
												/>
												{tag}
											</CommandItem>
										))}
									</CommandGroup>
								</CommandList>
							</Command>
						</PopoverContent>
					</Popover>
				)}

				{/* Favorites toggle */}
				<Button
					type="button"
					variant={showFavoritesOnly ? "secondary" : "outline"}
					size="sm"
					onClick={() => setShowFavoritesOnly((v) => !v)}
				>
					<BookmarkIcon
						className={`h-4 w-4 ${showFavoritesOnly ? "fill-current" : ""}`}
					/>
					Favorites
				</Button>

				{/* Sort */}
				<Popover>
					<PopoverTrigger asChild>
						<Button type="button" variant="outline" size="sm">
							{sortBy === "name" ? "Sort: Name" : "Sort: Date"}
							<ChevronDownIcon className="ml-1 h-4 w-4" />
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-40 p-1" align="start">
						<Button
							type="button"
							variant={sortBy === "name" ? "secondary" : "ghost"}
							size="sm"
							className="w-full justify-start"
							onClick={() => setSortBy("name")}
						>
							Name (A–Z)
						</Button>
						<Button
							type="button"
							variant={sortBy === "date" ? "secondary" : "ghost"}
							size="sm"
							className="w-full justify-start"
							onClick={() => setSortBy("date")}
						>
							Date (newest)
						</Button>
					</PopoverContent>
				</Popover>

				{/* New knowledge source */}
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => setNewKnowledgeOpen(true)}
					disabled={disabled}
				>
					<PlusIcon className="size-4" />
					New
				</Button>
			</div>

			{/* Scrollable list */}
			<div className="h-80 overflow-y-auto rounded-lg border border-border">
				{filtered.length === 0 ? (
					<div className="flex h-32 items-center justify-center text-muted-foreground text-sm">
						{search || tagFilter.length > 0 || showFavoritesOnly
							? "No results match your filters."
							: "No knowledge sources available."}
					</div>
				) : (
					<div className="divide-y divide-border">
						{filtered.map((item) => {
							const isSelected = selectedIds.has(item.id);
							const isFav = favorites[item.id] ?? item.favorite;
							return (
								<button
									key={item.id}
									type="button"
									onClick={() => toggleSelected(item)}
									className={`flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition hover:bg-muted/40 ${disabled ? "pointer-events-none opacity-60" : ""}`}
								>
									{/* Plain div checkbox - avoids Radix usePresence ref loop */}
									<div
										aria-hidden="true"
										className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border shadow-xs ${isSelected ? "border-primary bg-primary text-primary-foreground" : "border-input bg-transparent dark:bg-input/30"}`}
									>
										{isSelected && (
											<CheckIcon className="h-3 w-3" />
										)}
									</div>
									{/* Name + description + tags */}
									<div className="min-w-0 flex-1 space-y-1">
										<div className="flex items-center">
											<p className="truncate font-medium text-sm leading-none">
												{item.name}
											</p>
											<Button
												type="button"
												variant="ghost"
												size="icon-sm"
												className="ml-2 shrink-0 text-muted-foreground hover:text-primary"
												onClick={(e) =>
													openInfo(e, item)
												}
											>
												<InfoIcon className="h-3.5 w-3.5" />
											</Button>
										</div>
										{item.description && (
											<p className="line-clamp-1 text-muted-foreground text-xs">
												{item.description}
											</p>
										)}
										{item.tags.length > 0 && (
											<div className="flex flex-wrap gap-1 pt-0.5">
												{item.tags.map((tag) => (
													<Badge
														key={tag}
														variant="secondary"
														className="text-xs"
													>
														{tag}
													</Badge>
												))}
											</div>
										)}
									</div>
									{item.dateCreated && (
										<span className="shrink-0 whitespace-nowrap text-muted-foreground text-xs tabular-nums">
											{formatDateTime(item.dateCreated)}
										</span>
									)}
									<Button
										type="button"
										variant="ghost"
										size="icon-sm"
										onClick={(e) => toggleFavorite(e, item)}
										className="shrink-0"
										disabled={disabled}
									>
										<BookmarkIcon
											className={`h-4 w-4 ${isFav ? "fill-current text-primary" : "text-muted-foreground"}`}
										/>
									</Button>
								</button>
							);
						})}
					</div>
				)}
			</div>

			{/* Selection summary */}
			{selectedIds.size > 0 && (
				<p className="text-muted-foreground text-xs">
					{selectedIds.size} knowledge source
					{selectedIds.size !== 1 ? "s" : ""} selected
				</p>
			)}

			{/* Create new knowledge overlay */}
			<NewKnowledgeOverlay
				open={newKnowledgeOpen}
				onClose={(newKnowledge) => {
					if (newKnowledge) {
						onChange([...values, newKnowledge]);
						getKnowledge.refresh();
					}
					setNewKnowledgeOpen(false);
				}}
			/>

			{/* Document list modal */}
			<Dialog
				open={!!infoItem}
				onOpenChange={(open) => {
					if (!open) {
						setInfoItem(null);
						setDocAssets([]);
						setDocError(null);
					}
				}}
			>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>{infoItem?.name}</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						{/* Description + tags */}
						{infoItem?.description && (
							<p className="text-muted-foreground text-sm">
								{infoItem.description}
							</p>
						)}
						{infoItem?.tags && infoItem.tags.length > 0 && (
							<div className="flex flex-wrap gap-1">
								{infoItem.tags.map((tag) => (
									<Badge
										key={tag}
										variant="secondary"
										className="text-xs"
									>
										{tag}
									</Badge>
								))}
							</div>
						)}
						{infoItem?.dateCreated && (
							<p className="text-muted-foreground text-xs">
								Created {formatDateTime(infoItem.dateCreated)}
							</p>
						)}

						{/* Document list */}
						<div>
							<p className="mb-2 font-medium text-sm">
								Documents
								{!docLoading && docAssets.length > 0 && (
									<span className="ml-1.5 font-normal text-muted-foreground">
										({docAssets.length})
									</span>
								)}
							</p>
							{docLoading ? (
								<div className="flex items-center gap-2 text-muted-foreground text-sm">
									<Spinner className="size-3" />
									Loading…
								</div>
							) : docError ? (
								<p className="text-destructive text-sm">
									{docError}
								</p>
							) : docAssets.length === 0 ? (
								<p className="text-muted-foreground text-sm">
									No documents found.
								</p>
							) : (
								<ScrollArea className="h-52 rounded-md border">
									<table className="w-full table-fixed text-sm">
										<thead>
											<tr className="border-b text-muted-foreground text-xs">
												<th className="px-4 pt-2 pb-2 text-left font-medium">
													Name
												</th>
												<th className="w-36 px-3 pt-2 pb-2 text-left font-medium">
													Date Uploaded
												</th>
												<th className="w-20 px-4 pt-2 pb-2 text-right font-medium">
													Size
												</th>
											</tr>
										</thead>
										<tbody>
											{docAssets.map((f, idx) => {
												const name =
													f.fileName ||
													f.name ||
													(f.path
														? f.path
																.split(/[/\\]/)
																.pop()
														: "") ||
													"Untitled";
												return (
													<tr
														key={`${f.path || name}-${idx}`}
														className="border-b transition last:border-0 hover:bg-muted/40"
													>
														<td className="px-4 py-2">
															<div className="flex min-w-0 items-center gap-2">
																{getFileIcon(
																	name,
																)}
																<span className="break-all font-medium text-xs">
																	{name}
																</span>
															</div>
														</td>
														<td className="w-36 px-3 py-2 text-muted-foreground text-xs tabular-nums">
															{f.lastModified
																? formatDateTime(
																		f.lastModified,
																	)
																: "—"}
														</td>
														<td className="w-20 px-4 py-2 text-right text-muted-foreground text-xs tabular-nums">
															{f.fileSize != null
																? formatFileSize(
																		f.fileSize,
																	)
																: "—"}
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								</ScrollArea>
							)}
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
};
