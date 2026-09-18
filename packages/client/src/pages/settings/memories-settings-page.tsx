import { ChevronDown, Combine, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { runPixel, usePixel } from "@semoss/sdk/react";
import type { Project } from "@semoss/shared";
import {
	Badge,
	Button,
	Card,
	CardContent,
	Checkbox,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	cn,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Field,
	FieldLabel,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Separator,
	Spinner,
	Textarea,
	toast,
} from "@semoss/ui/next";
import { CatalogLayout, CatalogSearchBar } from "@/components/catalog";
import { MemoryFilterBox } from "@/components/settings/memory-filter-box";

interface Memory {
	memory_id: string;
	event_type: string;
	content: string;
	room_id?: string;
	workspace_id?: string;
	project_id?: string;
	agent_id?: string;
	parent_memory_id?: string;
	date_created: string;
	date_updated: string;
}

interface ListMemoriesResult {
	memories: Memory[];
	total_count: number;
	has_more: boolean;
}

interface AuditRow {
	audit_id: string;
	memory_id: string;
	action: string;
	previous_content?: string;
	previous_metadata?: string;
	user_id: string;
	date_created: string;
}

interface ActionItem {
	action_item_id: string;
	memory_id?: string;
	content: string;
	owner?: string;
	status: string;
	due_date?: string;
	room_id?: string;
	workspace_id?: string;
	date_created: string;
	date_updated: string;
}

interface ListActionItemsResult {
	action_items: ActionItem[];
	total_count: number;
	has_more: boolean;
}

const PAGE_SIZE = 20;

const EVENT_TYPES = [
	"memory",
	"decision",
	"lesson",
	"error",
	"task",
	"session_summary",
	"user_preference",
	"observation",
	"status_update",
];

const ACTION_ITEM_STATUSES = [
	"open",
	"in_progress",
	"blocked",
	"completed",
	"cancelled",
];

const EVENT_TYPE_BADGE_VARIANT: Record<string, string> = {
	decision: "border-primary/50 text-primary bg-primary/10 font-normal",
	error: "border-destructive/50 text-destructive bg-destructive/10 font-normal",
	session_summary: "border-success/50 text-success bg-success/10 font-normal",
};

const STATUS_BADGE_VARIANT: Record<string, string> = {
	completed: "border-success/50 text-success bg-success/10 font-normal",
	cancelled: "border-muted-foreground/30 text-muted-foreground font-normal",
	blocked:
		"border-destructive/50 text-destructive bg-destructive/10 font-normal",
	open: "border-primary/50 text-primary bg-primary/10 font-normal",
	in_progress: "border-warning/50 text-warning bg-warning/10 font-normal",
};

const formatLabel = (value: string) =>
	value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

type View = "memories" | "action_items";

/**
 * Account-wide memory management, modeled after the old memory_mcp app's
 * "Memory desk" portal for the list/card/dialog UX, and after the Engine/
 * Project catalog pages for search + filter placement: a top search bar
 * (`CatalogSearchBar`) and a left filter sidebar (`MemoryFilterBox`, styled
 * like `CatalogFilterBox`) instead of routed tabs or a side Sheet panel.
 *
 * The "Agent" selector lets a user see every memory they've personally told
 * a specific agent, across every room/app they've used it from - see
 * `MEMORY.AGENT_ID` in docs/platform_services/memory.md for the scoping
 * model this maps to on the backend (`ListMemories(agentId=...)`).
 */
export const MemoriesSettingsPage = () => {
	const [view, setView] = useState<View>("memories");
	const [isAddOpen, setIsAddOpen] = useState(false);
	const [refreshToken, setRefreshToken] = useState(0);
	const bumpRefresh = () => setRefreshToken((prev) => prev + 1);

	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
	const [agentId, setAgentId] = useState("");

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearch(search), 400);
		return () => clearTimeout(timer);
	}, [search]);

	const getAgentWorkspaces = usePixel<Project[]>(
		`MyProjects(projectType=["WORKSPACE"]);`,
		{ data: [] },
	);

	const [eventTypes, setEventTypes] = useState<Set<string>>(new Set());
	const [statuses, setStatuses] = useState<Set<string>>(new Set());
	const [metaFilters, setMetaFilters] = useState<Record<string, string[]>>(
		{},
	);

	return (
		<CatalogLayout
			title="Memories"
			description="Review context captured on your behalf, preserve edits, and compact knowledge when it has earned a shorter shape."
			headerActions={
				<div className="flex items-center gap-2">
					<div className="flex items-center rounded-md border p-0.5">
						<button
							type="button"
							className={cn(
								"rounded-sm px-3 py-1 text-sm transition-colors",
								view === "memories"
									? "bg-accent font-medium"
									: "text-muted-foreground hover:text-foreground",
							)}
							onClick={() => setView("memories")}
						>
							Memories
						</button>
						<button
							type="button"
							className={cn(
								"rounded-sm px-3 py-1 text-sm transition-colors",
								view === "action_items"
									? "bg-accent font-medium"
									: "text-muted-foreground hover:text-foreground",
							)}
							onClick={() => setView("action_items")}
						>
							Action Items
						</button>
					</div>
					<Button size="sm" onClick={() => setIsAddOpen(true)}>
						<Plus className="mr-2 size-4" />
						Add
					</Button>
				</div>
			}
			searchBar={
				<div className="flex w-full flex-col gap-2">
					<CatalogSearchBar
						search={search}
						onSearchChange={setSearch}
						placeholder="Search memory content"
						sortValue="DATE_CREATED"
						sortOrder={sortOrder}
						sortOptions={[
							{ value: "DATE_CREATED", label: "Date Created" },
						]}
						onSortChange={(_value, order) => setSortOrder(order)}
						showGridStyle={false}
						gridStyle="LIST"
						onGridStyleChange={() => {}}
					/>
					<div className="flex items-center gap-2">
						<span className="text-muted-foreground text-xs">
							Viewing memories for
						</span>
						<Select
							value={agentId || "personal"}
							onValueChange={(value) =>
								setAgentId(value === "personal" ? "" : value)
							}
						>
							<SelectTrigger className="h-8 w-[220px]">
								<SelectValue placeholder="Personal (all agents)" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="personal">
									Personal (all agents)
								</SelectItem>
								{(getAgentWorkspaces.data ?? []).map(
									(project) => (
										<SelectItem
											key={project.project_id}
											value={project.project_id}
										>
											{project.project_display_name ||
												project.project_name}
										</SelectItem>
									),
								)}
							</SelectContent>
						</Select>
						{agentId ? (
							<span className="text-muted-foreground text-xs">
								Showing everything you've personally told this
								agent, across every room.
							</span>
						) : null}
					</div>
				</div>
			}
			filterBox={
				view === "memories" ? (
					<MemoryFilterBox
						fixedSection={{ label: "Type", values: EVENT_TYPES }}
						fixedSelected={eventTypes}
						onToggleFixed={(value) =>
							setEventTypes((prev) => {
								const next = new Set(prev);
								next.has(value)
									? next.delete(value)
									: next.add(value);
								return next;
							})
						}
						workspaceId={undefined}
						metaFilters={metaFilters}
						onMetaFiltersChange={setMetaFilters}
					/>
				) : (
					<MemoryFilterBox
						fixedSection={{
							label: "Status",
							values: ACTION_ITEM_STATUSES,
						}}
						fixedSelected={statuses}
						onToggleFixed={(value) =>
							setStatuses((prev) => {
								const next = new Set(prev);
								next.has(value)
									? next.delete(value)
									: next.add(value);
								return next;
							})
						}
						workspaceId={undefined}
						metaFilters={{}}
						onMetaFiltersChange={() => {}}
					/>
				)
			}
		>
			{view === "memories" ? (
				<MemoriesView
					refreshToken={refreshToken}
					onRefresh={bumpRefresh}
					search={debouncedSearch}
					sortOrder={sortOrder}
					agentId={agentId}
					eventTypes={eventTypes}
					metaFilters={metaFilters}
				/>
			) : (
				<ActionItemsView
					refreshToken={refreshToken}
					onRefresh={bumpRefresh}
					search={debouncedSearch}
					sortOrder={sortOrder}
					statuses={statuses}
				/>
			)}

			<AddDialog
				open={isAddOpen}
				onOpenChange={setIsAddOpen}
				onCreated={bumpRefresh}
			/>
		</CatalogLayout>
	);
};

const MemoriesView = ({
	refreshToken,
	onRefresh,
	search,
	sortOrder,
	agentId,
	eventTypes,
	metaFilters,
}: {
	refreshToken: number;
	onRefresh: () => void;
	search: string;
	sortOrder: "ASC" | "DESC";
	agentId: string;
	eventTypes: Set<string>;
	metaFilters: Record<string, string[]>;
}) => {
	const [offset, setOffset] = useState(0);
	const [memories, setMemories] = useState<Memory[]>([]);
	const [totalCount, setTotalCount] = useState(0);
	const [hasMore, setHasMore] = useState(false);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [isCompacting, setIsCompacting] = useState(false);
	const [isBulkDeleting, setIsBulkDeleting] = useState(false);

	useEffect(() => {
		setOffset(0);
		setSelectedIds(new Set());
	}, [search, agentId, eventTypes, metaFilters]);

	const eventTypeFilter = useMemo(() => Array.from(eventTypes), [eventTypes]);

	const listMemories = usePixel<ListMemoriesResult>(
		`ListMemories(${search ? `search=${JSON.stringify(search)}, ` : ""}${eventTypeFilter.length ? `eventType=${JSON.stringify(eventTypeFilter)}, ` : ""}${agentId ? `agentId=${JSON.stringify(agentId)}, ` : ""}${Object.keys(metaFilters).length ? `metaFilters=${JSON.stringify(metaFilters)}, ` : ""}includeSuperseded=true, limit=${PAGE_SIZE}, offset=${offset});`,
		{ data: { memories: [], total_count: 0, has_more: false } },
	);

	useEffect(() => {
		if (listMemories.status === "SUCCESS") {
			const rows = listMemories.data.memories ?? [];
			setMemories(sortOrder === "ASC" ? [...rows].reverse() : rows);
			setTotalCount(listMemories.data.total_count ?? 0);
			setHasMore(listMemories.data.has_more ?? false);
		} else if (listMemories.status === "ERROR") {
			toast.error(String(listMemories.error));
		}
	}, [
		listMemories.status,
		listMemories.data,
		listMemories.error,
		sortOrder,
		refreshToken,
	]);

	const refresh = () => {
		listMemories.refresh();
		onRefresh();
	};

	const toggleSelected = (memoryId: string, checked: boolean) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (checked) {
				next.add(memoryId);
			} else {
				next.delete(memoryId);
			}
			return next;
		});
	};

	const handleCompact = async () => {
		if (selectedIds.size < 2) return;
		setIsCompacting(true);
		try {
			const memoryIds = Array.from(selectedIds);
			const response = await runPixel(
				`CompactMemories(memoryIds=${JSON.stringify(memoryIds)});`,
			);
			const firstResult = response?.pixelReturn?.[0];
			if (firstResult?.operationType?.includes("ERROR")) {
				throw new Error(String(firstResult.output));
			}
			toast.success(
				`Compacted ${memoryIds.length} memories into one summary`,
			);
			setSelectedIds(new Set());
			refresh();
		} catch (error) {
			toast.error(`Failed to compact memories: ${error}`);
		} finally {
			setIsCompacting(false);
		}
	};

	const handleDeleteSelected = async () => {
		if (!selectedIds.size) return;
		setIsBulkDeleting(true);
		try {
			for (const memoryId of selectedIds) {
				const response = await runPixel(
					`DeleteMemory(memoryId=${JSON.stringify(memoryId)});`,
				);
				const firstResult = response?.pixelReturn?.[0];
				if (firstResult?.operationType?.includes("ERROR")) {
					throw new Error(String(firstResult.output));
				}
			}
			toast.success(`Deleted ${selectedIds.size} memories`);
			setSelectedIds(new Set());
			refresh();
		} catch (error) {
			toast.error(`Failed to delete selected memories: ${error}`);
		} finally {
			setIsBulkDeleting(false);
		}
	};

	const isLoading = listMemories.status === "LOADING";

	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-center gap-2">
				<span className="text-muted-foreground text-sm">
					<strong className="text-foreground">{totalCount}</strong>{" "}
					visible
				</span>
				{selectedIds.size > 0 ? (
					<span className="text-muted-foreground text-sm">
						·{" "}
						<strong className="text-foreground">
							{selectedIds.size}
						</strong>{" "}
						selected
					</span>
				) : null}
				<div className="ml-auto flex items-center gap-2">
					{selectedIds.size >= 2 ? (
						<Button
							variant="outline"
							size="sm"
							disabled={isCompacting}
							onClick={handleCompact}
						>
							<Combine className="mr-2 size-4" />
							{isCompacting
								? "Compacting..."
								: "Compact selected"}
						</Button>
					) : null}
					{selectedIds.size > 0 ? (
						<Button
							variant="destructive"
							size="sm"
							disabled={isBulkDeleting}
							onClick={handleDeleteSelected}
						>
							<Trash2 className="mr-2 size-4" />
							{isBulkDeleting ? "Deleting..." : "Delete selected"}
						</Button>
					) : null}
				</div>
			</div>

			<div className="flex flex-col gap-2">
				{isLoading ? (
					<div className="flex justify-center py-10">
						<Spinner />
					</div>
				) : memories.length === 0 ? (
					<div className="py-10 text-center text-muted-foreground text-sm">
						No memories match these filters.
					</div>
				) : (
					memories.map((memory) => (
						<MemoryCard
							key={memory.memory_id}
							memory={memory}
							selected={selectedIds.has(memory.memory_id)}
							onSelectChange={(checked) =>
								toggleSelected(memory.memory_id, checked)
							}
							onChanged={refresh}
						/>
					))
				)}
			</div>

			<div className="flex items-center justify-between border-t pt-2 text-muted-foreground text-sm">
				<span>Page {Math.floor(offset / PAGE_SIZE) + 1}</span>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						disabled={offset === 0}
						onClick={() =>
							setOffset((prev) => Math.max(0, prev - PAGE_SIZE))
						}
					>
						Previous
					</Button>
					<Button
						variant="outline"
						size="sm"
						disabled={!hasMore}
						onClick={() => setOffset((prev) => prev + PAGE_SIZE)}
					>
						Next
					</Button>
				</div>
			</div>
		</div>
	);
};

const MemoryCard = ({
	memory,
	selected,
	onSelectChange,
	onChanged,
}: {
	memory: Memory;
	selected: boolean;
	onSelectChange: (checked: boolean) => void;
	onChanged: () => void;
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [editedContent, setEditedContent] = useState(memory.content);
	const [isSaving, setIsSaving] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isPromoting, setIsPromoting] = useState(false);
	const [promoteWorkspaceId, setPromoteWorkspaceId] = useState(
		memory.workspace_id ?? "",
	);
	const [audit, setAudit] = useState<AuditRow[] | null>(null);
	const [meta, setMeta] = useState<Record<string, string[]>>({});
	const [isLoadingDetails, setIsLoadingDetails] = useState(false);

	const loadDetailsOnce = async () => {
		if (audit !== null) return;
		setIsLoadingDetails(true);
		try {
			const [auditRes, metaRes] = await Promise.all([
				runPixel(
					`ListMemoryAudit(memoryId=${JSON.stringify(memory.memory_id)});`,
				),
				runPixel(
					`GetMemoryMeta(memoryId=${JSON.stringify(memory.memory_id)});`,
				),
			]);
			const auditOutput = auditRes?.pixelReturn?.[0]
				?.output as AuditRow[];
			const metaOutput = metaRes?.pixelReturn?.[0]?.output as Record<
				string,
				string[]
			>;
			setAudit(Array.isArray(auditOutput) ? auditOutput : []);
			setMeta(metaOutput ?? {});
		} catch (error) {
			toast.error(`Failed to load memory details: ${error}`);
		} finally {
			setIsLoadingDetails(false);
		}
	};

	const handleSaveEdit = async () => {
		if (!editedContent.trim()) {
			toast.error("Content cannot be empty");
			return;
		}
		setIsSaving(true);
		try {
			const response = await runPixel(
				`EditMemory(memoryId=${JSON.stringify(memory.memory_id)}, content=${JSON.stringify(editedContent)});`,
			);
			const firstResult = response?.pixelReturn?.[0];
			if (firstResult?.operationType?.includes("ERROR")) {
				throw new Error(String(firstResult.output));
			}
			toast.success("Memory updated");
			setIsEditing(false);
			setAudit(null);
			onChanged();
		} catch (error) {
			toast.error(`Failed to update memory: ${error}`);
		} finally {
			setIsSaving(false);
		}
	};

	const handleDelete = async () => {
		setIsDeleting(true);
		try {
			const response = await runPixel(
				`DeleteMemory(memoryId=${JSON.stringify(memory.memory_id)});`,
			);
			const firstResult = response?.pixelReturn?.[0];
			if (firstResult?.operationType?.includes("ERROR")) {
				throw new Error(String(firstResult.output));
			}
			toast.success("Memory deleted");
			onChanged();
		} catch (error) {
			toast.error(`Failed to delete memory: ${error}`);
		} finally {
			setIsDeleting(false);
		}
	};

	const handlePromote = async () => {
		setIsPromoting(true);
		try {
			const response = await runPixel(
				`PromoteMemoryToWorkspace(memoryId=${JSON.stringify(memory.memory_id)}${promoteWorkspaceId ? `, workspaceId=${JSON.stringify(promoteWorkspaceId)}` : ""});`,
			);
			const firstResult = response?.pixelReturn?.[0];
			if (firstResult?.operationType?.includes("ERROR")) {
				throw new Error(String(firstResult.output));
			}
			toast.success(
				promoteWorkspaceId
					? "Memory shared to workspace"
					: "Memory made personal again",
			);
			onChanged();
		} catch (error) {
			toast.error(`Failed to update memory scope: ${error}`);
		} finally {
			setIsPromoting(false);
		}
	};

	const metaKeys = Object.keys(meta);

	return (
		<Collapsible
			open={isOpen}
			onOpenChange={(open) => {
				setIsOpen(open);
				if (open) loadDetailsOnce();
			}}
			asChild
		>
			<Card className="py-0">
				<CardContent className="flex flex-col gap-2 p-3">
					<div className="flex items-start gap-3">
						<Checkbox
							className="mt-1"
							checked={selected}
							onCheckedChange={(checked) =>
								onSelectChange(checked === true)
							}
							aria-label={`Select memory: ${memory.content.slice(0, 40)}`}
						/>
						<CollapsibleTrigger asChild>
							<button
								type="button"
								className="flex flex-1 flex-col gap-1 text-left"
							>
								<div className="flex items-center gap-2">
									<Badge
										variant="outline"
										className={
											EVENT_TYPE_BADGE_VARIANT[
												memory.event_type
											] ?? "font-normal"
										}
									>
										{formatLabel(memory.event_type)}
									</Badge>
									{memory.workspace_id ? (
										<Badge
											variant="secondary"
											className="font-normal"
										>
											Workspace
										</Badge>
									) : null}
									<span className="text-muted-foreground text-xs">
										{memory.date_created}
									</span>
									<ChevronDown
										className={cn(
											"ml-auto size-4 text-muted-foreground transition-transform",
											isOpen && "rotate-180",
										)}
									/>
								</div>
								<p
									className={cn(
										"text-sm",
										!isOpen && "line-clamp-2",
									)}
								>
									{memory.content}
								</p>
							</button>
						</CollapsibleTrigger>
					</div>

					<CollapsibleContent className="flex flex-col gap-3 pl-8">
						{isEditing ? (
							<div className="flex flex-col gap-2">
								<Textarea
									value={editedContent}
									onChange={(e) =>
										setEditedContent(e.target.value)
									}
									rows={5}
								/>
								<div className="flex justify-end gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => {
											setIsEditing(false);
											setEditedContent(memory.content);
										}}
									>
										Cancel
									</Button>
									<Button
										size="sm"
										disabled={isSaving}
										onClick={handleSaveEdit}
									>
										{isSaving ? "Saving..." : "Save"}
									</Button>
								</div>
							</div>
						) : null}

						{metaKeys.length > 0 ? (
							<div className="flex flex-wrap gap-1.5">
								{metaKeys.map((key) =>
									meta[key].map((value) => (
										<Badge
											key={`${key}-${value}`}
											variant="secondary"
											className="font-normal"
										>
											{key}: {value}
										</Badge>
									)),
								)}
							</div>
						) : null}

						<div className="flex items-center gap-2">
							<Input
								placeholder="Workspace/project id to share with"
								value={promoteWorkspaceId}
								onChange={(e) =>
									setPromoteWorkspaceId(e.target.value)
								}
								className="h-8 max-w-xs text-sm"
							/>
							<Button
								variant="outline"
								size="sm"
								disabled={isPromoting}
								onClick={handlePromote}
							>
								{promoteWorkspaceId ? "Share" : "Make personal"}
							</Button>
						</div>

						{isLoadingDetails ? (
							<Spinner className="size-4" />
						) : audit && audit.length > 0 ? (
							<div className="flex flex-col gap-1.5">
								<span className="text-muted-foreground text-xs">
									Audit trail
								</span>
								{audit.map((row) => (
									<div
										key={row.audit_id}
										className="rounded-md border p-2 text-xs"
									>
										<div className="flex items-center justify-between">
											<Badge
												variant="outline"
												className="font-normal"
											>
												{formatLabel(row.action)}
											</Badge>
											<span className="text-muted-foreground">
												{row.date_created}
											</span>
										</div>
										{row.previous_content ? (
											<p className="mt-1 text-muted-foreground">
												Previous: "
												{row.previous_content}"
											</p>
										) : null}
									</div>
								))}
							</div>
						) : null}

						<Separator />

						<div className="flex items-center gap-2">
							{!isEditing ? (
								<Button
									variant="outline"
									size="sm"
									onClick={() => setIsEditing(true)}
								>
									<Pencil className="mr-2 size-4" />
									Edit
								</Button>
							) : null}
							<Button
								variant="destructive"
								size="sm"
								disabled={isDeleting}
								onClick={handleDelete}
							>
								<Trash2 className="mr-2 size-4" />
								{isDeleting ? "Deleting..." : "Delete"}
							</Button>
						</div>
					</CollapsibleContent>
				</CardContent>
			</Card>
		</Collapsible>
	);
};

const ActionItemsView = ({
	refreshToken,
	onRefresh,
	search,
	sortOrder,
	statuses,
}: {
	refreshToken: number;
	onRefresh: () => void;
	search: string;
	sortOrder: "ASC" | "DESC";
	statuses: Set<string>;
}) => {
	const [offset, setOffset] = useState(0);
	const [actionItems, setActionItems] = useState<ActionItem[]>([]);
	const [totalCount, setTotalCount] = useState(0);
	const [hasMore, setHasMore] = useState(false);
	const [updatingId, setUpdatingId] = useState<string | null>(null);

	useEffect(() => {
		setOffset(0);
	}, [search, statuses]);

	const statusFilter = useMemo(() => Array.from(statuses), [statuses]);

	const listActionItems = usePixel<ListActionItemsResult>(
		`ListActionItems(${search ? `search=${JSON.stringify(search)}, ` : ""}${statusFilter.length ? `status=${JSON.stringify(statusFilter)}, ` : ""}limit=${PAGE_SIZE}, offset=${offset});`,
		{ data: { action_items: [], total_count: 0, has_more: false } },
	);

	useEffect(() => {
		if (listActionItems.status === "SUCCESS") {
			const rows = listActionItems.data.action_items ?? [];
			setActionItems(sortOrder === "ASC" ? [...rows].reverse() : rows);
			setTotalCount(listActionItems.data.total_count ?? 0);
			setHasMore(listActionItems.data.has_more ?? false);
		} else if (listActionItems.status === "ERROR") {
			toast.error(String(listActionItems.error));
		}
	}, [
		listActionItems.status,
		listActionItems.data,
		listActionItems.error,
		sortOrder,
		refreshToken,
	]);

	const handleStatusChange = async (
		actionItemId: string,
		newStatus: string,
	) => {
		setUpdatingId(actionItemId);
		try {
			const response = await runPixel(
				`UpdateActionItemStatus(actionItemId=${JSON.stringify(actionItemId)}, status=${JSON.stringify(newStatus)});`,
			);
			const firstResult = response?.pixelReturn?.[0];
			if (firstResult?.operationType?.includes("ERROR")) {
				throw new Error(String(firstResult.output));
			}
			setActionItems((prev) =>
				prev.map((item) =>
					item.action_item_id === actionItemId
						? { ...item, status: newStatus }
						: item,
				),
			);
			toast.success("Status updated");
			onRefresh();
		} catch (error) {
			toast.error(`Failed to update status: ${error}`);
		} finally {
			setUpdatingId(null);
		}
	};

	const isLoading = listActionItems.status === "LOADING";

	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-center gap-2">
				<span className="text-muted-foreground text-sm">
					<strong className="text-foreground">{totalCount}</strong>{" "}
					visible
				</span>
			</div>

			<div className="flex flex-col gap-2">
				{isLoading ? (
					<div className="flex justify-center py-10">
						<Spinner />
					</div>
				) : actionItems.length === 0 ? (
					<div className="py-10 text-center text-muted-foreground text-sm">
						No action items match these filters.
					</div>
				) : (
					actionItems.map((item) => (
						<Card key={item.action_item_id} className="py-0">
							<CardContent className="flex items-center gap-3 p-3">
								<div className="flex flex-1 flex-col gap-1">
									<p className="text-sm">{item.content}</p>
									<div className="flex items-center gap-2 text-muted-foreground text-xs">
										<span>
											{item.owner || "Unassigned"}
										</span>
										{item.due_date ? (
											<span>Due {item.due_date}</span>
										) : null}
										<span>{item.date_created}</span>
									</div>
								</div>
								<Select
									value={item.status}
									onValueChange={(value) =>
										handleStatusChange(
											item.action_item_id,
											value,
										)
									}
									disabled={
										updatingId === item.action_item_id
									}
								>
									<SelectTrigger className="h-7 w-[150px]">
										<Badge
											variant="outline"
											className={
												STATUS_BADGE_VARIANT[
													item.status
												] ?? "font-normal"
											}
										>
											{formatLabel(item.status)}
										</Badge>
									</SelectTrigger>
									<SelectContent>
										{ACTION_ITEM_STATUSES.map((s) => (
											<SelectItem key={s} value={s}>
												{formatLabel(s)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</CardContent>
						</Card>
					))
				)}
			</div>

			<div className="flex items-center justify-between border-t pt-2 text-muted-foreground text-sm">
				<span>Page {Math.floor(offset / PAGE_SIZE) + 1}</span>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						disabled={offset === 0}
						onClick={() =>
							setOffset((prev) => Math.max(0, prev - PAGE_SIZE))
						}
					>
						Previous
					</Button>
					<Button
						variant="outline"
						size="sm"
						disabled={!hasMore}
						onClick={() => setOffset((prev) => prev + PAGE_SIZE)}
					>
						Next
					</Button>
				</div>
			</div>
		</div>
	);
};

const AddDialog = ({
	open,
	onOpenChange,
	onCreated,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onCreated: () => void;
}) => {
	const contentId = useId();
	const ownerId = useId();
	const dueDateId = useId();
	const parentId = useId();
	const [type, setType] = useState("memory");
	const [content, setContent] = useState("");
	const [owner, setOwner] = useState("");
	const [dueDate, setDueDate] = useState("");
	const [status, setStatus] = useState("open");
	const [parentMemoryId, setParentMemoryId] = useState("");
	const [isCreating, setIsCreating] = useState(false);

	const isActionItem = type === "action_item";

	const resetForm = () => {
		setType("memory");
		setContent("");
		setOwner("");
		setDueDate("");
		setStatus("open");
		setParentMemoryId("");
	};

	const handleCreate = async () => {
		if (!content.trim()) {
			toast.error("Content is required");
			return;
		}
		setIsCreating(true);
		try {
			const response = isActionItem
				? await runPixel(
						`CreateActionItem(content=${JSON.stringify(content)}${owner ? `, owner=${JSON.stringify(owner)}` : ""}${dueDate ? `, dueDate=${JSON.stringify(`${dueDate} 00:00:00`)}` : ""}, status=${JSON.stringify(status)}${parentMemoryId ? `, memoryId=${JSON.stringify(parentMemoryId)}` : ""});`,
					)
				: await runPixel(
						`AddMemory(content=${JSON.stringify(content)}, eventType=${JSON.stringify(type)});`,
					);
			const firstResult = response?.pixelReturn?.[0];
			if (firstResult?.operationType?.includes("ERROR")) {
				throw new Error(String(firstResult.output));
			}
			toast.success(
				isActionItem ? "Action item created" : "Memory added",
			);
			resetForm();
			onOpenChange(false);
			onCreated();
		} catch (error) {
			toast.error(`Failed to save: ${error}`);
		} finally {
			setIsCreating(false);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (!next) resetForm();
				onOpenChange(next);
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add memory</DialogTitle>
					<DialogDescription>
						Choose a type, then add the memory. Duplicate content in
						the same scope is detected automatically.
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-4">
					<Field>
						<FieldLabel>Type</FieldLabel>
						<Select value={type} onValueChange={setType}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{EVENT_TYPES.map((t) => (
									<SelectItem key={t} value={t}>
										{formatLabel(t)}
									</SelectItem>
								))}
								<SelectItem value="action_item">
									Action Item
								</SelectItem>
							</SelectContent>
						</Select>
					</Field>
					{isActionItem ? (
						<>
							<Field>
								<FieldLabel htmlFor={parentId}>
									Parent memory ID
								</FieldLabel>
								<Input
									id={parentId}
									value={parentMemoryId}
									onChange={(e) =>
										setParentMemoryId(e.target.value)
									}
									placeholder="Optional (blank = standalone)"
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor={ownerId}>Owner</FieldLabel>
								<Input
									id={ownerId}
									value={owner}
									onChange={(e) => setOwner(e.target.value)}
									placeholder="Optional assignee"
								/>
							</Field>
							<div className="grid grid-cols-2 gap-4">
								<Field>
									<FieldLabel htmlFor={dueDateId}>
										Due date
									</FieldLabel>
									<Input
										id={dueDateId}
										type="date"
										value={dueDate}
										onChange={(e) =>
											setDueDate(e.target.value)
										}
									/>
								</Field>
								<Field>
									<FieldLabel>Status</FieldLabel>
									<Select
										value={status}
										onValueChange={setStatus}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{ACTION_ITEM_STATUSES.map((s) => (
												<SelectItem key={s} value={s}>
													{formatLabel(s)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</Field>
							</div>
						</>
					) : null}
					<Field>
						<FieldLabel htmlFor={contentId}>Memory text</FieldLabel>
						<Textarea
							id={contentId}
							value={content}
							onChange={(e) => setContent(e.target.value)}
							rows={8}
							placeholder="Paste a decision, lesson, task, or other context..."
						/>
					</Field>
				</div>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button disabled={isCreating} onClick={handleCreate}>
						{isCreating ? "Saving..." : "Add"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
