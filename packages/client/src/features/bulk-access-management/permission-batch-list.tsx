import { Gauge, Search, Trash2, Undo2 } from "lucide-react";
import { useState } from "react";
import type { AccessLevel, PermissionAllowedChanges } from "@semoss/sdk";
import {
	type ModelUsageLimitSource,
	OWNERS_ONLY_LIMIT_REASON,
} from "@semoss/shared";
import {
	Badge,
	Button,
	Checkbox,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	ToggleGroup,
	ToggleGroupItem,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { formatLocalDateTime } from "@semoss/utility/date";
import { TablePagination } from "@/components/ui/table-pagination/table-pagination";
import { GROUP_ACCESS_LEVELS } from "@/features/group-access/group-access-levels";
import { MODEL_LIMIT_NAMES } from "@/features/model-usage-limits/model-usage-limits";
import { AccessIdentity } from "./access-identity";
import {
	type BatchEntry,
	type BatchEntryStatus,
	canSetUsageLimits,
	getEntryStatus,
	getLevelLabel,
	getLimitBlockReason,
	getRemoveBlockReason,
	isModelLimitChanged,
	type ModelLimitEntry,
	matchesSearch,
} from "./permission-batch";
import { UsageLimitEditButton } from "./usage-limit-edit-button";
import { UsageLimitSummary } from "./usage-limit-summary";

/** Rows per page; most lists fit on one */
const PAGE_SIZE = 1000;

/** What each status says, and its color */
const STATUS_BADGES: Record<
	Exclude<BatchEntryStatus, "UNCHANGED">,
	{ label: string; className: string }
> = {
	ADDED: { label: "Added", className: "text-success" },
	CHANGED: { label: "Changed", className: "text-warning" },
	REMOVED: { label: "Removed", className: "text-destructive" },
};

/** Which entries the list shows */
type ListFilter = "ALL" | "CHANGES";

export interface PermissionBatchListProps {
	/** Everyone in the batch */
	entries: BatchEntry[];
	/** What the signed in user may change */
	allowedChanges: PermissionAllowedChanges;
	/** Whether the target is a model engine, whose people and teams have usage limits */
	showModelLimits: boolean;
	/** On a model, its total and its public use limit, pinned at the top */
	modelLimitEntries?: ModelLimitEntry[];
	/** On a model, whether it is public, so its public use limit applies */
	isPublic?: boolean;
	/** The rows picked to be given one usage limit, by key */
	selectedKeys?: ReadonlySet<string>;
	/** Called with the rows picked */
	onSelectedKeysChange?: (keys: Set<string>) => void;
	/** Called with an entry's new level */
	onLevelChange: (entry: BatchEntry, level: AccessLevel) => void;
	/** Called to take an entry's access away, or to drop a person or team the batch adds */
	onRemove: (entry: BatchEntry) => void;
	/** Called to put an entry back the way it is now */
	onRestore: (entry: BatchEntry) => void;
	/** Called to open an entry's usage limit */
	onEditLimit?: (entry: BatchEntry) => void;
	/** Called to open the model total or the public use limit */
	onEditModelLimit?: (entry: ModelLimitEntry) => void;
	/** Called to put a model's total or public use limit back the way it is now */
	onRestoreModelLimit?: (entry: ModelLimitEntry) => void;
	/** Called with the rows picked, to give them one usage limit */
	onSetUsageLimits?: (entries: BatchEntry[]) => void;
}

/**
 * The people and teams in a permission batch, with the access each has now and
 * after the batch is saved. The user changes levels and usage limits, takes
 * access away and undoes changes here; nothing is saved until the changes are
 * reviewed. On a model, the model total and the public use limit are pinned at
 * the top, and rows can be picked to be given one usage limit together.
 */
export const PermissionBatchList = ({
	entries,
	allowedChanges,
	showModelLimits,
	modelLimitEntries = [],
	isPublic = false,
	selectedKeys,
	onSelectedKeysChange,
	onLevelChange,
	onRemove,
	onRestore,
	onEditLimit,
	onEditModelLimit,
	onRestoreModelLimit,
	onSetUsageLimits,
}: PermissionBatchListProps) => {
	const [search, setSearch] = useState("");
	const [filter, setFilter] = useState<ListFilter>("ALL");
	const [page, setPage] = useState(0);
	const normalizedSearch = search.trim().toLowerCase();
	const visible = entries.filter(
		(entry) =>
			matchesSearch(entry, normalizedSearch) &&
			(filter === "ALL" || getEntryStatus(entry) !== "UNCHANGED"),
	);
	const pinned = showModelLimits
		? modelLimitEntries.filter(
				(entry) =>
					(filter === "ALL" || isModelLimitChanged(entry)) &&
					(!normalizedSearch ||
						MODEL_LIMIT_NAMES[entry.category]
							.toLowerCase()
							.includes(normalizedSearch)),
			)
		: [];
	const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
	const currentPage = Math.min(page, totalPages - 1);
	const pageEntries = visible.slice(
		currentPage * PAGE_SIZE,
		currentPage * PAGE_SIZE + PAGE_SIZE,
	);
	const canSetLimits = canSetUsageLimits(allowedChanges);
	// only owners set limits, so only they pick rows to give one limit
	const canSelect =
		showModelLimits && canSetLimits && onSelectedKeysChange !== undefined;
	const selected = selectedKeys ?? new Set<string>();
	const selectable = canSelect
		? pageEntries.filter(
				(entry) => getLimitBlockReason(entry, allowedChanges) === null,
			)
		: [];
	// a row whose limit can no longer be changed, such as one removed, drops out
	const selectedEntries = entries.filter(
		(entry) =>
			selected.has(entry.key) &&
			getLimitBlockReason(entry, allowedChanges) === null,
	);
	const isAllSelected =
		selectable.length > 0 &&
		selectable.every((entry) => selected.has(entry.key));
	const isSomeSelected = selectable.some((entry) => selected.has(entry.key));
	const columnCount = 4 + (showModelLimits ? 1 : 0) + (canSelect ? 1 : 0);

	/** Whether the user can change an entry, and which levels they can give */
	const getEditing = (entry: BatchEntry) => {
		if (entry.subject.category === "TEAM") {
			return {
				canEdit: allowedChanges.canChangeTeams,
				levels: GROUP_ACCESS_LEVELS,
			};
		}
		const touchesAuthor =
			entry.current?.level === "OWNER" || entry.staged?.level === "OWNER";
		return {
			canEdit:
				allowedChanges.canChangePeople &&
				(!touchesAuthor || allowedChanges.canGiveAuthorAccess),
			levels: allowedChanges.canGiveAuthorAccess
				? GROUP_ACCESS_LEVELS
				: GROUP_ACCESS_LEVELS.filter(
						(level) => level.value !== "OWNER",
					),
		};
	};

	const toggleSelected = (key: string) => {
		const next = new Set(selected);
		if (next.has(key)) {
			next.delete(key);
		} else {
			next.add(key);
		}
		onSelectedKeysChange?.(next);
	};

	const toggleAll = () => {
		const next = new Set(selected);
		for (const entry of selectable) {
			if (isAllSelected) {
				next.delete(entry.key);
			} else {
				next.add(entry.key);
			}
		}
		onSelectedKeysChange?.(next);
	};

	return (
		// grows with its column, so the table's box ends with the Add People card
		<div className="flex grow flex-col gap-3">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<InputGroup className="w-full sm:max-w-sm">
					<InputGroupAddon>
						<Search className="size-4" aria-hidden />
					</InputGroupAddon>
					<InputGroupInput
						aria-label="Search people and teams"
						placeholder="Search people and teams"
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setPage(0);
						}}
					/>
				</InputGroup>
				<ToggleGroup
					type="single"
					variant="outline"
					value={filter}
					onValueChange={(value) => {
						if (value === "ALL" || value === "CHANGES") {
							setFilter(value);
							setPage(0);
						}
					}}
					aria-label="Show"
				>
					<ToggleGroupItem value="ALL">Everyone</ToggleGroupItem>
					<ToggleGroupItem value="CHANGES">
						Changes Only
					</ToggleGroupItem>
				</ToggleGroup>
			</div>

			{canSelect && selectedEntries.length > 0 ? (
				<div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
					<span className="font-medium text-sm">
						{selectedEntries.length === 1
							? "1 selected"
							: `${selectedEntries.length.toLocaleString()} selected`}
					</span>
					<div className="flex flex-wrap gap-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => onSelectedKeysChange?.(new Set())}
						>
							Clear Selection
						</Button>
						<Button
							type="button"
							size="sm"
							onClick={() => onSetUsageLimits?.(selectedEntries)}
						>
							<Gauge className="size-4" aria-hidden />
							Set Usage Limit
						</Button>
					</div>
				</div>
			) : null}

			<div className="grow overflow-x-auto rounded-xl border border-border bg-background">
				<Table className="bg-background">
					<TableHeader>
						<TableRow>
							{canSelect ? (
								<TableHead className="w-10 pl-4">
									<Checkbox
										checked={
											isAllSelected
												? true
												: isSomeSelected
													? "indeterminate"
													: false
										}
										disabled={selectable.length === 0}
										onCheckedChange={toggleAll}
										aria-label="Select everyone whose usage limit you can change"
									/>
								</TableHead>
							) : null}
							<TableHead
								className={canSelect ? undefined : "pl-6"}
							>
								Name
							</TableHead>
							<TableHead>Access</TableHead>
							{showModelLimits ? (
								<TableHead>Usage Limit</TableHead>
							) : null}
							<TableHead>Ends</TableHead>
							{/* as narrow as its contents: the change and its action */}
							<TableHead className="w-px">
								<span className="sr-only">Change</span>
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{currentPage === 0
							? pinned.map((entry) => {
									const name =
										MODEL_LIMIT_NAMES[entry.category];
									const isChanged =
										isModelLimitChanged(entry);
									const source =
										entry.category === "MODEL"
											? "MODEL_TOTAL"
											: "PUBLIC";
									return (
										<TableRow
											key={entry.key}
											className="bg-muted/30"
										>
											{canSelect ? <TableCell /> : null}
											<TableCell
												className={
													canSelect
														? undefined
														: "pl-6"
												}
											>
												<AccessIdentity
													category={entry.category}
													type=""
													name={name}
												/>
											</TableCell>
											<TableCell className="text-sm">
												{entry.category === "MODEL" ? (
													"Everyone Together"
												) : isPublic ? (
													"Public"
												) : (
													<span className="text-muted-foreground">
														Applies while this model
														is public
													</span>
												)}
											</TableCell>
											<TableCell className="text-sm">
												{canSetLimits ? (
													<UsageLimitEditButton
														context={name}
														onClick={() =>
															onEditModelLimit?.(
																entry,
															)
														}
													>
														<UsageLimitSummary
															limit={entry.staged}
															previous={
																entry.current
															}
															isChanged={
																isChanged
															}
															source={source}
														/>
													</UsageLimitEditButton>
												) : (
													<span className="flex flex-col gap-0.5">
														<UsageLimitSummary
															limit={entry.staged}
															previous={
																entry.current
															}
															isChanged={
																isChanged
															}
															source={source}
														/>
														<span className="text-muted-foreground text-xs">
															{
																OWNERS_ONLY_LIMIT_REASON
															}
														</span>
													</span>
												)}
											</TableCell>
											<TableCell />
											<TableCell className="pr-4">
												{isChanged ? (
													<div className="flex items-center justify-end gap-2">
														<Badge
															variant="outline"
															className={
																STATUS_BADGES
																	.CHANGED
																	.className
															}
														>
															{
																STATUS_BADGES
																	.CHANGED
																	.label
															}
														</Badge>
														<Tooltip>
															<TooltipTrigger
																asChild
															>
																<Button
																	variant="ghost"
																	size="icon-sm"
																	aria-label={`Undo the change for ${name}`}
																	onClick={() =>
																		onRestoreModelLimit?.(
																			entry,
																		)
																	}
																>
																	<Undo2
																		className="size-4"
																		aria-hidden
																	/>
																</Button>
															</TooltipTrigger>
															<TooltipContent>
																Undo
															</TooltipContent>
														</Tooltip>
													</div>
												) : null}
											</TableCell>
										</TableRow>
									);
								})
							: null}
						{pageEntries.length === 0 && pinned.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={columnCount}
									className="py-6 text-center text-muted-foreground"
								>
									{entries.length === 0
										? "No one has access yet"
										: normalizedSearch
											? "No one matches"
											: "No changes yet"}
								</TableCell>
							</TableRow>
						) : (
							pageEntries.map((entry) => {
								const status = getEntryStatus(entry);
								const badge =
									status === "UNCHANGED"
										? null
										: STATUS_BADGES[status];
								const { canEdit, levels } = getEditing(entry);
								const limitBlockReason = getLimitBlockReason(
									entry,
									allowedChanges,
								);
								const removeBlockReason = getRemoveBlockReason(
									entry,
									allowedChanges,
								);
								const label =
									entry.person?.name ||
									entry.person?.email ||
									entry.subject.id;
								const grant = entry.staged ?? entry.current;
								const endDate = formatLocalDateTime(
									grant?.endDate ?? undefined,
									"MMM D, YYYY",
								);
								const limitSource: ModelUsageLimitSource =
									entry.subject.category === "TEAM"
										? "TEAM"
										: "DIRECT";
								const limitSummary = (
									<UsageLimitSummary
										limit={grant?.usageLimit}
										previous={entry.current?.usageLimit}
										isChanged={status === "CHANGED"}
										source={limitSource}
									/>
								);
								return (
									<TableRow
										key={entry.key}
										data-state={
											selected.has(entry.key)
												? "selected"
												: undefined
										}
									>
										{canSelect ? (
											<TableCell className="w-10 pl-4">
												<Checkbox
													checked={selected.has(
														entry.key,
													)}
													disabled={
														limitBlockReason !==
														null
													}
													onCheckedChange={() =>
														toggleSelected(
															entry.key,
														)
													}
													aria-label={`Select ${label}`}
												/>
											</TableCell>
										) : null}
										<TableCell
											className={
												canSelect ? undefined : "pl-6"
											}
										>
											<AccessIdentity
												category={
													entry.subject.category
												}
												type={entry.subject.type}
												name={label}
												id={entry.subject.id}
												email={entry.person?.email}
												nameClassName={
													status === "REMOVED"
														? "text-muted-foreground line-through"
														: undefined
												}
											>
												{entry.note ? (
													<span className="text-muted-foreground text-xs">
														{entry.note}
													</span>
												) : null}
											</AccessIdentity>
										</TableCell>
										<TableCell>
											{entry.staged && canEdit ? (
												<Select
													value={entry.staged.level}
													onValueChange={(value) => {
														const level =
															levels.find(
																(option) =>
																	option.value ===
																	value,
															);
														if (
															level &&
															(level.value ===
																"OWNER" ||
																level.value ===
																	"EDIT" ||
																level.value ===
																	"READ_ONLY")
														) {
															onLevelChange(
																entry,
																level.value,
															);
														}
													}}
												>
													<SelectTrigger
														size="sm"
														className="w-36"
														aria-label={`Access for ${label}`}
													>
														<SelectValue>
															{getLevelLabel(
																entry.staged
																	.level,
															)}
														</SelectValue>
													</SelectTrigger>
													<SelectContent>
														{levels.map(
															(option) => (
																<SelectItem
																	key={
																		option.value
																	}
																	value={
																		option.value
																	}
																>
																	{
																		option.label
																	}
																</SelectItem>
															),
														)}
													</SelectContent>
												</Select>
											) : (
												<span>
													{entry.staged
														? getLevelLabel(
																entry.staged
																	.level,
															)
														: "No Access"}
												</span>
											)}
											{status === "CHANGED" &&
											entry.current &&
											entry.staged &&
											entry.current.level !==
												entry.staged.level ? (
												<div className="text-muted-foreground text-xs">
													Was{" "}
													{getLevelLabel(
														entry.current.level,
													)}
												</div>
											) : null}
										</TableCell>
										{showModelLimits ? (
											<TableCell className="text-sm">
												{limitBlockReason === null ? (
													<UsageLimitEditButton
														context={`Usage limit for ${label}`}
														onClick={() =>
															onEditLimit?.(entry)
														}
													>
														{limitSummary}
													</UsageLimitEditButton>
												) : (
													<span className="flex max-w-64 flex-col gap-0.5">
														{limitSummary}
														{entry.staged ? (
															<span className="text-muted-foreground text-xs">
																{
																	limitBlockReason
																}
															</span>
														) : null}
													</span>
												)}
											</TableCell>
										) : null}
										<TableCell className="text-sm">
											{endDate ?? (
												<span className="text-muted-foreground">
													Never
												</span>
											)}
										</TableCell>
										<TableCell className="pr-4">
											<div className="flex items-center justify-end gap-2">
												{badge ? (
													<Badge
														variant="outline"
														className={
															badge.className
														}
													>
														{badge.label}
													</Badge>
												) : null}
												{status === "UNCHANGED" ? (
													canEdit ? (
														<Tooltip>
															<TooltipTrigger
																asChild
															>
																<Button
																	variant="ghost"
																	size="icon-sm"
																	aria-label={`Remove access for ${label}`}
																	// stays focusable, so its tooltip can say why
																	aria-disabled={
																		removeBlockReason !==
																		null
																	}
																	className={
																		removeBlockReason
																			? "cursor-not-allowed opacity-50"
																			: undefined
																	}
																	onClick={() => {
																		if (
																			removeBlockReason ===
																			null
																		) {
																			onRemove(
																				entry,
																			);
																		}
																	}}
																>
																	<Trash2
																		className="size-4"
																		aria-hidden
																	/>
																</Button>
															</TooltipTrigger>
															<TooltipContent>
																{removeBlockReason ??
																	"Remove Access"}
															</TooltipContent>
														</Tooltip>
													) : null
												) : (
													<Tooltip>
														<TooltipTrigger asChild>
															<Button
																variant="ghost"
																size="icon-sm"
																aria-label={`Undo the change for ${label}`}
																onClick={() =>
																	onRestore(
																		entry,
																	)
																}
															>
																<Undo2
																	className="size-4"
																	aria-hidden
																/>
															</Button>
														</TooltipTrigger>
														<TooltipContent>
															Undo
														</TooltipContent>
													</Tooltip>
												)}
											</div>
										</TableCell>
									</TableRow>
								);
							})
						)}
					</TableBody>
				</Table>
			</div>
			{visible.length > PAGE_SIZE ? (
				<TablePagination
					startRow={currentPage * PAGE_SIZE + 1}
					endRow={Math.min(
						(currentPage + 1) * PAGE_SIZE,
						visible.length,
					)}
					totalCount={visible.length}
					page={currentPage}
					totalPages={totalPages}
					rowsPerPage={PAGE_SIZE}
					onPageChange={setPage}
					onRowsPerPageChange={() => setPage(0)}
					rowsPerPageOptions={[PAGE_SIZE]}
				/>
			) : null}
		</div>
	);
};
