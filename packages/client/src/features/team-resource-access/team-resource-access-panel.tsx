import { Boxes, Plus, Search, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { AppCatalogAvatar, EngineSubtypeIcon } from "@semoss/shared";
import {
	Alert,
	AlertDescription,
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Checkbox,
	cn,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	toast,
	useDebouncedValue,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import {
	editTeamResourceAccess,
	type GroupAccessResource,
	type GroupKey,
	getTeamResourceCount,
	getTeamResources,
	removeTeamResourceAccess,
	type TeamResource,
} from "@/api/teams";
import { TablePagination } from "@/components/ui/table-pagination/table-pagination";
import {
	GROUP_ACCESS_LEVELS,
	getGroupAccessLevel,
} from "@/features/group-access/group-access-levels";
import { usePagedList } from "@/hooks/use-paged-list";
import { AddTeamResourceAccessDialog } from "./add-team-resource-access-dialog";
import { TEAM_RESOURCE_NOUNS } from "./team-resource-nouns";

export interface TeamResourceAccessPanelProps {
	/** Projects or engines */
	kind: GroupAccessResource;
	/** The team. Keep the object stable, such as with useMemo, so it does not reload. */
	group: GroupKey;
	/**
	 * For a custom team's managers: lists through their endpoints, with no
	 * adding, changing or removing, which only owners and admins do
	 */
	readOnly?: boolean;
}

/**
 * The projects or engines a team can use, and at which level. Admins add more,
 * change a level, and take access away here; a team's managers only see them,
 * so they know what the people they add can use.
 */
export const TeamResourceAccessPanel = ({
	kind,
	group,
	readOnly = false,
}: TeamResourceAccessPanelProps) => {
	const nouns = TEAM_RESOURCE_NOUNS[kind];
	const [search, setSearch] = useState("");
	const debouncedSearch = useDebouncedValue(search.trim(), 300);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [isAddOpen, setIsAddOpen] = useState(false);
	// a new key each time the add dialog opens starts it with a fresh list
	const [addDialogKey, setAddDialogKey] = useState(0);
	const [removeTargets, setRemoveTargets] = useState<TeamResource[]>([]);
	const [isChanging, setIsChanging] = useState(false);
	const [firstRemoveTarget] = removeTargets;

	const loadPage = useCallback(
		(limit: number, offset: number) =>
			getTeamResources(
				kind,
				group,
				debouncedSearch,
				limit,
				offset,
				!readOnly,
			),
		[kind, group, debouncedSearch, readOnly],
	);
	const countRows = useCallback(
		() => getTeamResourceCount(kind, group, debouncedSearch, !readOnly),
		[kind, group, debouncedSearch, readOnly],
	);
	// name, type and access, plus the selection and actions when it can change
	const columnCount = readOnly ? 3 : 5;
	const { rows, totalCount, isLoading, error, refresh, pagination } =
		usePagedList({
			loadPage,
			countRows,
			errorMessage: `Could not load the team's ${nouns.plural}`,
		});

	const selectedRows = rows.filter((resource) =>
		selectedIds.has(resource.id),
	);
	const isAllSelected =
		rows.length > 0 && selectedRows.length === rows.length;
	const hasSearch = debouncedSearch.length > 0;

	const openAddDialog = () => {
		setAddDialogKey((key) => key + 1);
		setIsAddOpen(true);
	};

	const toggleSelected = (resource: TeamResource) => {
		setSelectedIds((current) => {
			const next = new Set(current);
			if (next.has(resource.id)) {
				next.delete(resource.id);
			} else {
				next.add(resource.id);
			}
			return next;
		});
	};

	const toggleAll = () => {
		setSelectedIds((current) => {
			const next = new Set(current);
			for (const resource of rows) {
				if (isAllSelected) {
					next.delete(resource.id);
				} else {
					next.add(resource.id);
				}
			}
			return next;
		});
	};

	const handleLevelChange = async (resource: TeamResource, value: string) => {
		const level = GROUP_ACCESS_LEVELS.find(
			(option) => option.value === value,
		);
		if (!level || level.id === resource.permission) {
			return;
		}
		setIsChanging(true);
		try {
			await editTeamResourceAccess(kind, group, resource.id, level.id);
		} catch (e) {
			toast.error(getErrorMessage(e, "Could not change the access"));
			setIsChanging(false);
			return;
		}
		setIsChanging(false);
		toast.success(
			`${group.id} now has ${level.label} access to ${resource.name}`,
		);
		refresh();
	};

	const handleRemove = async () => {
		setIsChanging(true);
		let removed = 0;
		const failures: string[] = [];
		for (const resource of removeTargets) {
			try {
				await removeTeamResourceAccess(kind, group, resource.id);
				removed += 1;
			} catch (e) {
				failures.push(
					`${resource.name}: ${getErrorMessage(e, "not removed")}`,
				);
			}
		}
		setIsChanging(false);
		setRemoveTargets([]);
		setSelectedIds(new Set());
		if (removed > 0) {
			toast.success(
				`Removed ${removed} ${removed === 1 ? nouns.singular : nouns.plural}`,
			);
		}
		if (failures.length > 0) {
			toast.error(failures.join(" "));
		}
		refresh();
	};

	return (
		<Card>
			<CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex flex-col gap-1.5">
					<CardTitle className="flex items-center gap-2">
						{nouns.title}
						<Badge variant="secondary" className="font-normal">
							{totalCount}
						</Badge>
					</CardTitle>
					<CardDescription>
						Everyone in this team can use these {nouns.plural} at
						the level shown.
						{readOnly
							? " Their owners decide which teams can use them."
							: null}
					</CardDescription>
				</div>
				{readOnly ? null : (
					<Button className="shrink-0" onClick={openAddDialog}>
						<Plus className="size-4" aria-hidden />
						Add {nouns.title}
					</Button>
				)}
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<InputGroup className="w-full sm:max-w-sm">
						<InputGroupAddon>
							<Search className="size-4" aria-hidden />
						</InputGroupAddon>
						<InputGroupInput
							aria-label={`Search ${nouns.plural}`}
							placeholder={`Search ${nouns.plural}`}
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								pagination.resetPage();
							}}
						/>
					</InputGroup>
					{!readOnly && selectedRows.length > 0 ? (
						<Button
							variant="outline"
							className="text-destructive"
							disabled={isChanging}
							onClick={() => setRemoveTargets(selectedRows)}
						>
							<Trash2 className="size-4" aria-hidden />
							Remove {selectedRows.length}
						</Button>
					) : null}
				</div>

				{error ? (
					<Alert variant="destructive">
						<AlertDescription className="flex flex-wrap items-center justify-between gap-2">
							{error}
							<Button
								variant="outline"
								size="sm"
								onClick={refresh}
							>
								Try Again
							</Button>
						</AlertDescription>
					</Alert>
				) : null}

				<div className="overflow-hidden rounded-lg border">
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									{readOnly ? null : (
										<TableHead className="w-10 pl-4">
											<Checkbox
												aria-label={`Select every ${nouns.singular} on this page`}
												checked={isAllSelected}
												disabled={rows.length === 0}
												onCheckedChange={toggleAll}
											/>
										</TableHead>
									)}
									<TableHead
										className={
											readOnly ? "pl-4" : undefined
										}
									>
										Name
									</TableHead>
									<TableHead className="hidden md:table-cell">
										Type
									</TableHead>
									<TableHead>Access</TableHead>
									{readOnly ? null : (
										<TableHead className="w-12">
											<span className="sr-only">
												Actions
											</span>
										</TableHead>
									)}
								</TableRow>
							</TableHeader>
							<TableBody aria-busy={isLoading}>
								{rows.length > 0 ? (
									rows.map((resource) => {
										const level = getGroupAccessLevel(
											resource.permission,
										);
										return (
											<TableRow key={resource.id}>
												{readOnly ? null : (
													<TableCell className="pl-4">
														<Checkbox
															aria-label={`Select ${resource.name}`}
															checked={selectedIds.has(
																resource.id,
															)}
															onCheckedChange={() =>
																toggleSelected(
																	resource,
																)
															}
														/>
													</TableCell>
												)}
												<TableCell
													className={cn(
														"max-w-0",
														readOnly && "pl-4",
													)}
												>
													<div className="flex items-center gap-3">
														{kind === "ENGINE" ? (
															<EngineSubtypeIcon
																engineType={
																	resource.resourceType ||
																	"DATABASE"
																}
																engineSubtype={
																	resource.subtype ??
																	undefined
																}
																className="size-8 shrink-0 rounded object-contain"
															/>
														) : (
															<AppCatalogAvatar
																projectId={
																	resource.id
																}
																name={
																	resource.name
																}
																className="size-8 shrink-0 rounded-md text-xs"
															/>
														)}
														<div className="min-w-0">
															<p className="truncate font-medium">
																{resource.name}
															</p>
															<p className="truncate text-muted-foreground text-xs">
																id:{" "}
																{resource.id}
															</p>
														</div>
													</div>
												</TableCell>
												<TableCell className="hidden w-40 md:table-cell">
													{resource.resourceType ? (
														<Badge
															variant="outline"
															className="font-normal"
														>
															{
																resource.resourceType
															}
														</Badge>
													) : (
														"-"
													)}
												</TableCell>
												<TableCell className="w-40">
													{readOnly ? (
														(level?.label ??
														"Unknown")
													) : (
														<Select
															value={level?.value}
															disabled={
																isChanging
															}
															onValueChange={(
																value,
															) =>
																handleLevelChange(
																	resource,
																	value,
																)
															}
														>
															<SelectTrigger
																size="sm"
																className="w-36"
																aria-label={`Access level for ${resource.name}`}
															>
																<SelectValue placeholder="Unknown" />
															</SelectTrigger>
															<SelectContent>
																{GROUP_ACCESS_LEVELS.map(
																	(
																		option,
																	) => (
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
													)}
												</TableCell>
												{readOnly ? null : (
													<TableCell className="w-12 pr-4 text-right">
														<Button
															variant="ghost"
															size="icon-sm"
															disabled={
																isChanging
															}
															aria-label={`Remove access to ${resource.name}`}
															onClick={() =>
																setRemoveTargets(
																	[resource],
																)
															}
														>
															<Trash2
																className="size-4"
																aria-hidden
															/>
														</Button>
													</TableCell>
												)}
											</TableRow>
										);
									})
								) : (
									<TableRow>
										<TableCell
											colSpan={columnCount}
											className="h-40"
										>
											{isLoading ? (
												<p className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
													<Spinner />
													Loading {nouns.plural}...
												</p>
											) : error ? null : (
												<div className="flex flex-col items-center gap-2 text-center">
													<Boxes
														className="size-5 text-muted-foreground"
														aria-hidden
													/>
													<p className="font-medium">
														{hasSearch
															? `No ${nouns.plural} match that search`
															: `This team cannot use any ${nouns.plural} yet`}
													</p>
													{hasSearch ? (
														<Button
															variant="outline"
															size="sm"
															onClick={() => {
																setSearch("");
																pagination.resetPage();
															}}
														>
															Clear Search
														</Button>
													) : readOnly ? null : (
														<Button
															size="sm"
															onClick={
																openAddDialog
															}
														>
															<Plus
																className="size-4"
																aria-hidden
															/>
															Add {nouns.title}
														</Button>
													)}
												</div>
											)}
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
					<TablePagination
						className="border-t px-4 py-3"
						startRow={pagination.startRow}
						endRow={pagination.endRow}
						totalCount={totalCount}
						page={pagination.page}
						totalPages={pagination.totalPages}
						rowsPerPage={pagination.rowsPerPage}
						onPageChange={pagination.setPage}
						onRowsPerPageChange={pagination.setRowsPerPage}
						disabled={isLoading}
					/>
				</div>
			</CardContent>

			{readOnly ? null : (
				<AddTeamResourceAccessDialog
					key={addDialogKey}
					open={isAddOpen}
					kind={kind}
					group={group}
					onClose={(added) => {
						setIsAddOpen(false);
						if (added) {
							refresh();
						}
					}}
				/>
			)}

			<Dialog
				open={removeTargets.length > 0}
				onOpenChange={(isOpen) => {
					if (!isOpen && !isChanging) {
						setRemoveTargets([]);
					}
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="font-medium text-base leading-6">
							Remove Access
						</DialogTitle>
						<DialogDescription>
							{removeTargets.length === 1 && firstRemoveTarget ? (
								<>
									The team loses its access to{" "}
									<span className="font-medium text-foreground">
										{firstRemoveTarget.name}
									</span>
									.
								</>
							) : (
								`The team loses its access to ${removeTargets.length} ${nouns.plural}.`
							)}{" "}
							Access given to members directly stays.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							disabled={isChanging}
							onClick={() => setRemoveTargets([])}
						>
							Cancel
						</Button>
						<Button
							type="button"
							variant="destructive"
							disabled={isChanging}
							onClick={handleRemove}
						>
							{isChanging ? <Spinner /> : null}
							{isChanging ? "Removing..." : "Remove"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Card>
	);
};
