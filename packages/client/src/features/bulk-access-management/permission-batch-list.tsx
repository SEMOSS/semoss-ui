import { Search, Trash2, Undo2 } from "lucide-react";
import { useState } from "react";
import type { AccessLevel, PermissionAllowedChanges } from "@semoss/sdk";
import {
	Badge,
	Button,
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
import { AccessIdentity } from "./access-identity";
import {
	type BatchEntry,
	type BatchEntryStatus,
	describeModelLimit,
	getEntryStatus,
	getLevelLabel,
	matchesSearch,
} from "./permission-batch";

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
	/** Whether the target is a model engine, whose people have usage limits */
	showModelLimits: boolean;
	/** Called with an entry's new level */
	onLevelChange: (entry: BatchEntry, level: AccessLevel) => void;
	/** Called to take an entry's access away, or to drop a person or team the batch adds */
	onRemove: (entry: BatchEntry) => void;
	/** Called to put an entry back the way it is now */
	onRestore: (entry: BatchEntry) => void;
}

/**
 * The people and teams in a permission batch, with the access each has now and
 * after the batch is saved. The user changes levels, takes access away and
 * undoes changes here; nothing is saved until the changes are reviewed.
 */
export const PermissionBatchList = ({
	entries,
	allowedChanges,
	showModelLimits,
	onLevelChange,
	onRemove,
	onRestore,
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
	const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
	const currentPage = Math.min(page, totalPages - 1);
	const pageEntries = visible.slice(
		currentPage * PAGE_SIZE,
		currentPage * PAGE_SIZE + PAGE_SIZE,
	);

	/** Whether the user can change an entry, and which levels they can give */
	const getEditing = (entry: BatchEntry) => {
		if (entry.subject.kind === "TEAM") {
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

			<div className="grow overflow-x-auto rounded-xl border border-border bg-background">
				<Table className="bg-background">
					<TableHeader>
						<TableRow>
							<TableHead className="pl-6">Name</TableHead>
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
						{pageEntries.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={showModelLimits ? 5 : 4}
									className="text-center"
								>
									{entries.length === 0
										? "No one has access yet"
										: "No one matches"}
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
								const label =
									entry.person?.name ||
									entry.person?.email ||
									entry.subject.id;
								const grant = entry.staged ?? entry.current;
								const endDate = formatLocalDateTime(
									grant?.endDate ?? undefined,
									"MMM D, YYYY",
								);
								const limit = describeModelLimit(grant);
								const previousLimit =
									status === "CHANGED"
										? describeModelLimit(entry.current)
										: limit;
								return (
									<TableRow key={entry.key}>
										<TableCell className="pl-6">
											<AccessIdentity
												kind={entry.subject.kind}
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
														<SelectValue />
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
												{entry.subject.kind ===
												"USER" ? (
													<>
														<span
															className={
																limit ===
																"No limit"
																	? "text-muted-foreground"
																	: undefined
															}
														>
															{limit}
														</span>
														{previousLimit !==
														limit ? (
															<div className="text-muted-foreground text-xs">
																Was{" "}
																{previousLimit}
															</div>
														) : null}
													</>
												) : null}
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
																	onClick={() =>
																		onRemove(
																			entry,
																		)
																	}
																>
																	<Trash2
																		className="size-4"
																		aria-hidden
																	/>
																</Button>
															</TooltipTrigger>
															<TooltipContent>
																Remove Access
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
