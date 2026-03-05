import {
	Bookmark,
	ChevronDown,
	Ellipsis,
	SearchIcon,
	SquarePen,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "@semoss/i18n";
import { Env, post, useInsight, useIteratorPixel } from "@semoss/sdk/react";
import {
	Badge,
	Button,
	Card,
	CardContent,
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
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Input,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Muted,
	Popover,
	PopoverContent,
	PopoverTrigger,
	ScrollArea,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
	toast,
	useDebouncedValue,
	useInfiniteScroll,
} from "@semoss/ui/next";
import workspaceImage from "@/assets/img/workspace.png";
import { useChat, useGlobalBreadcrumbs, useRoot } from "@/hooks";
import type { App, Workspace } from "@/types";
import { formatDateTime } from "@/utility";

/**
 * Renders the WorkspacePage, allowing users to access their workspace or discover new ones
 *
 * @component
 */
export const WorkspacePage = observer(() => {
	const { t } = useTranslation(["workspace", "notifications", "common"]);
	const { root } = useRoot();
	const navigate = useNavigate();
	const { chat } = useChat();
	const { actions } = useInsight();

	// set the breadcrumbs
	useGlobalBreadcrumbs({
		breadcrumbs: [
			{
				name: t("workspace:breadcrumbs.home"),
				path: "/",
			},
			{
				name: t("workspace:breadcrumbs.agent"),
				path: "/agent",
			},
		],
	});

	const [search, setSearch] = useState("");
	const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
	const [sortBy, setSortBy] = useState<"name" | "date">("name");
	const [tagFilter, setTagFilter] = useState<string[]>([]);
	const [permissionFilter, setPermissionFilter] = useState<number[]>([]);
	const [favorites, setFavorites] = useState<Record<string, boolean>>({});
	const [deleteTarget, setDeleteTarget] = useState<App | null>(null);
	const [cloneTarget, setCloneTarget] = useState<App | null>(null);
	const [cloneName, setCloneName] = useState<string>("");
	const [isCloning, setIsCloning] = useState<boolean>(false);

	const debouncedSearch = useDebouncedValue(search);

	/**
	 * Get all of the workspaces with lazy loading
	 */
	const getWorkspaces = useIteratorPixel<App[], App>(
		(limit, offset) =>
			`MyProjects(metaKeys=["tag","description"], ${debouncedSearch ? `filterWord=["<encode>${debouncedSearch}</encode>"], ` : ""}${showFavoritesOnly ? "onlyFavorites=[true], " : ""}type="WORKSPACE", limit=[${limit}], offset=[${offset}]);`,
		(response) => {
			if (response.length < 25) {
				return -1;
			}
			return Infinity;
		},
		(response) => response,
		{ limit: 25 },
		[debouncedSearch, showFavoritesOnly],
	);

	/**
	 * Setup infinite scroll
	 */
	const { setScroll } = useInfiniteScroll({
		disabled: getWorkspaces.isLoading || !getWorkspaces.hasMore,
		onNext: () => {
			getWorkspaces.next();
		},
	});

	/**
	 * Derive unique tag list from all loaded workspaces
	 */
	const allTags = useMemo(() => {
		const tags = new Set<string>();
		getWorkspaces.data.forEach((w) => {
			const wTags = Array.isArray(w.tag)
				? w.tag
				: w.tag
					? [w.tag as string]
					: [];
			wTags
				.filter((t) => t !== "Workspace_Project")
				.forEach((tag) => {
					if (tag) tags.add(String(tag));
				});
		});
		return Array.from(tags).sort();
	}, [getWorkspaces.data]);

	/**
	 * Client-side tag filter + sort on the already-loaded data
	 */
	const filtered = useMemo(() => {
		return getWorkspaces.data
			.filter((w) => {
				if (tagFilter.length === 0 && permissionFilter.length === 0)
					return true;
				const wTags = Array.isArray(w.tag)
					? w.tag
					: w.tag
						? [w.tag as string]
						: [];
				const tagOk =
					tagFilter.length === 0 ||
					tagFilter.some((t) => wTags.map(String).includes(t));
				const permOk =
					permissionFilter.length === 0 ||
					permissionFilter.includes(w.permission ?? -1);
				return tagOk && permOk;
			})
			.sort((a, b) => {
				if (sortBy === "name") {
					return a.project_name.localeCompare(b.project_name);
				}
				return b.project_date_created.localeCompare(
					a.project_date_created,
				);
			});
	}, [getWorkspaces.data, tagFilter, permissionFilter, sortBy]);

	const toggleFavorite = async (e: React.MouseEvent, w: App) => {
		e.stopPropagation();
		const current = favorites[w.project_id] ?? Boolean(w.project_favorite);
		const next = !current;
		setFavorites((prev) => ({ ...prev, [w.project_id]: next }));
		try {
			await post<{ success: boolean }>(
				`${Env.MODULE}/api/auth/project/setProjectFavorite`,
				{ projectId: w.project_id, isFavorite: next },
				{},
			);
		} catch {
			setFavorites((prev) => ({ ...prev, [w.project_id]: current }));
		}
	};

	const handleDelete = async () => {
		if (!deleteTarget) return;
		try {
			await chat.deleteWorkspace(deleteTarget.project_id);
			setDeleteTarget(null);
			getWorkspaces.reset();
		} catch (e) {
			toast.error(
				e instanceof Error
					? e.message
					: t("notifications:workspace.deleteError"),
			);
		}
	};

	const handleClone = async () => {
		if (!cloneTarget || !cloneName.trim()) return;
		setIsCloning(true);
		try {
			const wsResult = await actions.run<[Workspace]>(
				`GetWorkspace(workspaceId=["${cloneTarget.project_id}"]);`,
			);
			const source = wsResult.pixelReturn[0].output;
			const newId = await chat.addWorkspace({
				name: cloneName.trim(),
				description: source.description || "",
				system_prompt: source.system_prompt || "",
				mcp: source.mcp || [],
			});
			try {
				const metaResult = await actions.run<
					[{ tag?: string | string[] }]
				>(
					`GetProjectMetadata(project=["${cloneTarget.project_id}"], metaKeys=["tag"]);`,
				);
				const rawTag = metaResult.pixelReturn[0].output?.tag;
				const tags = Array.isArray(rawTag)
					? rawTag
					: rawTag
						? [rawTag as string]
						: [];
				if (tags.length > 0) {
					await actions.run(
						`SetProjectMetadata(project=["${newId}"], meta=[{"tag":${JSON.stringify(tags)}}], jsonCleanup=[true]);`,
					);
				}
			} catch {
				// non-fatal: tags did not copy
			}
			toast.success(`"${cloneName.trim()}" created`);
			setCloneTarget(null);
			setCloneName("");
			navigate(`/agent/${newId}`);
		} catch (e) {
			toast.error(
				e instanceof Error ? e.message : "Failed to clone agent",
			);
		} finally {
			setIsCloning(false);
		}
	};

	return (
		<TooltipProvider>
			<div className="relative h-full w-full overflow-hidden">
				<div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-6 px-12 pt-8 pb-4">
					{/* Welcome banner */}
					<div className="flex w-full rounded-lg bg-primary/10">
						<div className="flex flex-1 flex-col gap-4 p-6 font-sans">
							<div className="font-medium text-primary text-xl leading-normal">
								{t("workspace:welcomeTitle")}
							</div>
							<div className="font-normal text-base text-primary leading-normal">
								{t("workspace:welcomeDescription")}
							</div>
						</div>
						<div className="relative hidden w-[351px] overflow-hidden rounded-r-lg lg:block">
							<img
								src={
									root.theme.images.workspace ||
									workspaceImage
								}
								alt={t("workspace:images.agentIllustration")}
								className="-translate-y-1/2 absolute top-1/2 left-0 h-[351px] w-full select-none object-cover"
							/>
						</div>
					</div>

					{/* Toolbar */}
					<div className="flex flex-wrap items-center gap-2">
						<InputGroup className="min-w-[220px] flex-1 bg-background">
							<InputGroupInput
								placeholder={t("common:buttons.search")}
								value={search}
								onChange={(e) => setSearch(e.target.value)}
							/>
							<InputGroupAddon>
								<SearchIcon />
							</InputGroupAddon>
						</InputGroup>

						{/* Tags filter */}
						<Popover>
							<PopoverTrigger asChild>
								<Button variant="outline" size="sm">
									{tagFilter.length === 0
										? "Tags"
										: `Tags (${tagFilter.length})`}
									<ChevronDown className="ml-1 h-4 w-4" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-56 p-0" align="start">
								<Command>
									<CommandInput placeholder="Search tags…" />
									<CommandList className="max-h-[50vh]">
										<CommandEmpty>
											No tags found.
										</CommandEmpty>
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
																: [
																		...prev,
																		tag,
																	],
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

						{/* Permission filter */}
						<Popover>
							<PopoverTrigger asChild>
								<Button variant="outline" size="sm">
									{permissionFilter.length === 0
										? "Role"
										: `Role (${permissionFilter.length})`}
									<ChevronDown className="ml-1 h-4 w-4" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-44 p-1" align="start">
								{(
									[
										{ label: "Author", value: 1 },
										{ label: "Editor", value: 2 },
										{ label: "Read Only", value: 3 },
									] as { label: string; value: number }[]
								).map(({ label, value }) => (
									<button
										key={value}
										type="button"
										className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted"
										onClick={() =>
											setPermissionFilter((prev) =>
												prev.includes(value)
													? prev.filter(
															(p) => p !== value,
														)
													: [...prev, value],
											)
										}
									>
										<Checkbox
											checked={permissionFilter.includes(
												value,
											)}
											className="pointer-events-none"
										/>
										{label}
									</button>
								))}
							</PopoverContent>
						</Popover>

						{/* Favorites toggle */}
						<Button
							variant={
								showFavoritesOnly ? "secondary" : "outline"
							}
							size="sm"
							onClick={() => setShowFavoritesOnly((v) => !v)}
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

						{/* Sort */}
						<Popover>
							<PopoverTrigger asChild>
								<Button variant="outline" size="sm">
									{sortBy === "name"
										? "Sort: Name"
										: "Sort: Date"}
									<ChevronDown className="ml-1 h-4 w-4" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-44 p-1" align="start">
								<Button
									variant={
										sortBy === "name"
											? "secondary"
											: "ghost"
									}
									size="sm"
									className="w-full justify-start"
									onClick={() => setSortBy("name")}
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
									onClick={() => setSortBy("date")}
								>
									Date (newest)
								</Button>
							</PopoverContent>
						</Popover>

						<Button onClick={() => navigate("/agent/new")}>
							{t("workspace:actions.createAgent")}
						</Button>
					</div>

					{/* Agent list */}
					<ScrollArea
						className="flex-1 overflow-auto"
						viewportRef={(ele) => setScroll(ele)}
					>
						{getWorkspaces.isLoading &&
						getWorkspaces.data.length === 0 ? (
							<div className="flex items-center justify-center py-12">
								<Spinner />
							</div>
						) : filtered.length === 0 ? (
							<div className="flex items-center justify-center py-12">
								<Muted>
									{t("workspace:messages.noResults")}
								</Muted>
							</div>
						) : (
							<div className="flex max-w-3xl flex-col gap-2">
								{filtered.map((w) => {
									const isFav =
										favorites[w.project_id] ??
										Boolean(w.project_favorite);
									const wTags = Array.isArray(w.tag)
										? w.tag
										: w.tag
											? [w.tag as string]
											: [];
									return (
										<button
											type="button"
											key={w.project_id}
											className="w-full text-left"
											onClick={() =>
												navigate(
													`/agent/${w.project_id}`,
												)
											}
										>
											<Card className="group transition hover:bg-muted/40">
												<CardContent className="flex items-center gap-4 py-3">
													<div className="min-w-0 flex-1">
														<Tooltip>
															<TooltipTrigger
																asChild
															>
																<p className="min-w-0 truncate font-medium text-sm">
																	{
																		w.project_name
																	}
																</p>
															</TooltipTrigger>
															<TooltipContent>
																{w.project_name}
															</TooltipContent>
														</Tooltip>
														{wTags.filter(
															(t) =>
																t !==
																"Workspace_Project",
														).length > 0 && (
															<div className="mt-0.5 flex flex-wrap gap-1">
																{wTags
																	.filter(
																		(t) =>
																			t !==
																			"Workspace_Project",
																	)
																	.map(
																		(
																			tag,
																		) => (
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
														{w.description && (
															<p className="truncate text-muted-foreground text-xs">
																{w.description}
															</p>
														)}
													</div>
													{w.project_date_created && (
														<p className="w-44 shrink-0 text-right text-muted-foreground text-xs tabular-nums">
															{formatDateTime(
																w.project_date_created,
															)}
														</p>
													)}
													{w.permission != null && (
														<span
															className={`shrink-0 rounded-full px-2 py-0.5 font-medium text-xs ${
																w.permission ===
																1
																	? "bg-green-100 text-green-800"
																	: w.permission ===
																			2
																		? "bg-blue-100 text-blue-800"
																		: "bg-gray-100 text-gray-600"
															}`}
														>
															{w.permission === 1
																? "Author"
																: w.permission ===
																		2
																	? "Editor"
																	: "Read Only"}
														</span>
													)}
													<div className="flex shrink-0 items-center gap-1">
														<Tooltip>
															<TooltipTrigger
																asChild
															>
																<Button
																	variant="ghost"
																	size="icon-sm"
																	onClick={(
																		e,
																	) =>
																		toggleFavorite(
																			e,
																			w,
																		)
																	}
																	aria-label="Toggle favorite"
																>
																	<Bookmark
																		className={`h-4 w-4 ${isFav ? "fill-current text-primary" : "text-muted-foreground"}`}
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
																	`/new?workspaceId=${w.project_id}`,
																);
															}}
														>
															<SquarePen className="h-4 w-4" />
															{t(
																"workspace:actions.newChat",
															)}
														</Button>
														<DropdownMenu>
															<DropdownMenuTrigger
																asChild
															>
																<Button
																	variant="ghost"
																	size="icon-sm"
																	onClick={(
																		e,
																	) =>
																		e.stopPropagation()
																	}
																>
																	<Ellipsis className="h-4 w-4" />
																</Button>
															</DropdownMenuTrigger>
															<DropdownMenuContent align="end">
																<DropdownMenuGroup>
																	<DropdownMenuItem
																		onClick={(
																			e,
																		) =>
																			e.stopPropagation()
																		}
																		asChild
																	>
																		<Link
																			to={`/agent/${w.project_id}`}
																		>
																			{t(
																				"workspace:actions.edit",
																			)}
																		</Link>
																	</DropdownMenuItem>
																	<DropdownMenuItem
																		onClick={(
																			e,
																		) => {
																			e.stopPropagation();
																			setCloneTarget(
																				w,
																			);
																			setCloneName(
																				`${w.project_name}_copy`,
																			);
																		}}
																	>
																		Clone
																	</DropdownMenuItem>
																	<DropdownMenuItem
																		onClick={(
																			e,
																		) => {
																			e.stopPropagation();
																			setDeleteTarget(
																				w,
																			);
																		}}
																	>
																		{t(
																			"workspace:actions.delete",
																		)}
																	</DropdownMenuItem>
																</DropdownMenuGroup>
															</DropdownMenuContent>
														</DropdownMenu>
													</div>
												</CardContent>
											</Card>
										</button>
									);
								})}
							</div>
						)}

						{/* Loading more indicator */}
						{getWorkspaces.isLoading &&
							getWorkspaces.data.length > 0 && (
								<div className="flex items-center justify-center p-4">
									<Spinner className="size-4" />
								</div>
							)}
					</ScrollArea>
				</div>
			</div>

			{/* Delete confirmation dialog */}
			<Dialog
				open={deleteTarget !== null}
				onOpenChange={(open) => {
					if (!open) setDeleteTarget(null);
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{t("workspace:card.deleteConfirmTitle")}
						</DialogTitle>
						<DialogDescription>
							{t("workspace:card.deleteConfirmDescription", {
								name: deleteTarget?.project_name,
							})}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDeleteTarget(null)}
						>
							{t("common:buttons.cancel")}
						</Button>
						<Button variant="destructive" onClick={handleDelete}>
							{t("workspace:actions.delete")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Clone dialog */}
			<Dialog
				open={cloneTarget !== null}
				onOpenChange={(open) => {
					if (!open) {
						setCloneTarget(null);
						setCloneName("");
					}
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Clone Agent</DialogTitle>
						<DialogDescription>
							Create a copy of &ldquo;{cloneTarget?.project_name}
							&rdquo; with a new name.
						</DialogDescription>
					</DialogHeader>
					<Input
						value={cloneName}
						onChange={(e) => setCloneName(e.target.value)}
						placeholder="New agent name"
						disabled={isCloning}
						onKeyDown={(e) => {
							if (e.key === "Enter" && cloneName.trim())
								handleClone();
						}}
					/>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setCloneTarget(null);
								setCloneName("");
							}}
							disabled={isCloning}
						>
							{t("common:buttons.cancel")}
						</Button>
						<Button
							onClick={handleClone}
							disabled={isCloning || !cloneName.trim()}
						>
							{isCloning ? (
								<Spinner className="size-4" />
							) : (
								"Clone"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</TooltipProvider>
	);
});
