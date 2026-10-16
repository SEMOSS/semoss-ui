import {
	Check,
	Search,
	ShieldAlert,
	TriangleAlert,
	UsersRound,
} from "lucide-react";
import { type ChangeEvent, useEffect, useId, useRef, useState } from "react";
import type { ModelUsageLimit, Role } from "@semoss/sdk";
import { useIteratorApi } from "@semoss/sdk/react";
import {
	describeModelUsageLimit,
	findModelUsageLimitProblem,
	ModelUsageLimitEditor,
	type ModelUsageLimitEditorHandle,
	OWNERS_ONLY_LIMIT_REASON,
	UsageLimitGuideButton,
	useCostLimitsAvailable,
} from "@semoss/shared";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
	Button,
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
	Label,
	ScrollArea,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
	toast,
	useDebouncedValue,
	useInfiniteScroll,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import {
	type AvailableGroup,
	addGroupResourceAccess,
	type GroupAccessResource,
	type GroupManager,
	getAvailableGroupsForResource,
	getTeams,
	toTeamSummaries,
} from "@/api/teams";
import { useGroupManagers } from "@/features/group-managers/use-group-managers";
import { TeamPeopleManagers } from "@/features/team-people/team-people-managers";
import { TeamPeopleMembers } from "@/features/team-people/team-people-members";
import { TEAM_RESOURCE_NOUNS } from "@/features/team-resource-access/team-resource-nouns";
import { CUSTOM_TEAM_TYPE } from "@/features/team-type/team-type";
import { TeamTypeBadge } from "@/features/team-type/team-type-badge";
import { useTeamTypeName } from "@/features/team-type/use-team-type-name";
import { PUBLIC_TEAM_HINT } from "@/features/team-usage-limit/team-usage-limit";
import { GROUP_ACCESS_LEVELS } from "./group-access-levels";

/** Teams fetched per page */
const PAGE_SIZE = 20;

/** Centered status line inside the results pane */
const STATUS_CLASS =
	"flex items-center justify-center gap-2 px-3 py-6 text-center text-muted-foreground text-sm";

/** A section heading in the team's people */
const SECTION_TITLE_CLASS = "font-medium text-sm";

/** The row style the shared add-members dialog uses, so the pickers match */
const TEAM_ROW_CLASS =
	"flex w-full items-start gap-3 rounded-md border bg-muted/40 px-3 py-2 text-start hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** What the dialog needs to know to give a team a limit on a model */
export interface GroupAccessModel {
	/** Whether the model is public, so a team with no limit defined uses the public use limit */
	isPublic: boolean;
	/** Whether the model has known prices; read from the model when left out */
	isCostAvailable?: boolean;
	/**
	 * Whether the user can give the team a limit: the model's owners, and admins
	 * in admin mode. False when not given, so the team is added with no limit
	 * defined.
	 */
	canChangeLimit?: boolean;
}

/** The names of a team's managers, in a sentence */
const getManagerNames = (managers: GroupManager[]): string =>
	managers
		.map((manager) => manager.name || manager.email || manager.userid)
		.join(", ");

export interface AddGroupAccessDialogProps {
	/** Whether the dialog is open */
	open: boolean;
	/** The type of resource the team gets access to */
	resource: GroupAccessResource;
	/** The project or engine id */
	resourceId: string;
	/** Called when the dialog closes, with true after a team was given access */
	onClose: (added?: boolean) => void;
	/**
	 * Adds the chosen team to a permission batch instead of giving it access
	 * now, as Bulk Access Management does; the dialog then closes without saving
	 * anything. On a model, the team limit comes with it, or null for none.
	 */
	onStage?: (
		team: AvailableGroup,
		level: Role,
		usageLimit: ModelUsageLimit | null,
	) => void;
	/**
	 * Whether in admin mode, from Bulk Access Management, where every team is listed
	 * and its managers are read as an admin; it then only stages teams
	 */
	admin?: boolean;
	/** Teams that already have access, left out of the list, as `type:id` keys */
	excludedTeams?: ReadonlySet<string>;
	/**
	 * On a model, what the team limit needs; the dialog then shows it below the
	 * access level, starting at No Limit Defined
	 */
	model?: GroupAccessModel;
}

/**
 * Lets the owner of a project or engine give a team access to it. Before they
 * confirm, it says who decides the team's members, so the owner knows whom they
 * are trusting with the access; a custom team cannot be authorized until its
 * managers are known. The owner can also open a custom team's managers and
 * members, to see exactly who gets the access. On a model, the team can be
 * given a team limit with it, with shared and each-member rules. Give it a new
 * key each time it opens so it starts from an empty search.
 */
export const AddGroupAccessDialog = ({
	open,
	resource,
	resourceId,
	onClose,
	onStage,
	admin = false,
	excludedTeams,
	model,
}: AddGroupAccessDialogProps) => {
	const levelId = useId();
	const [searchTerm, setSearchTerm] = useState("");
	const debouncedSearch = useDebouncedValue(searchTerm.trim(), 300);
	const [selected, setSelected] = useState<AvailableGroup | null>(null);
	// the chosen custom team's managers and members replace the team list
	const [isShowingPeople, setIsShowingPeople] = useState(false);
	const [level, setLevel] = useState<Role>("READ_ONLY");
	const [listError, setListError] = useState<string | null>(null);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [usageLimit, setUsageLimit] = useState<ModelUsageLimit | null>(null);
	// the team limit's problems show from the first submit they stop
	const [shouldShowLimitProblems, setShouldShowLimitProblems] =
		useState(false);
	const limitEditorRef = useRef<ModelUsageLimitEditorHandle>(null);
	const noun = TEAM_RESOURCE_NOUNS[resource].singular;
	const readCostAvailable = useCostLimitsAvailable(
		model && model.isCostAvailable === undefined ? resourceId : null,
		admin,
	);
	const isCostAvailable = model?.isCostAvailable ?? readCostAvailable;
	const canGiveLimit = model?.canChangeLimit === true;
	const limitProblem = canGiveLimit
		? findModelUsageLimitProblem(usageLimit, {
				source: "TEAM",
				isCostAvailable,
			})
		: null;

	const groups = useIteratorApi<AvailableGroup>(
		async (limit, offset) => {
			try {
				// an admin lists every team, since the owner endpoint is for owners
				const page = admin
					? toTeamSummaries(
							await getTeams(
								true,
								debouncedSearch,
								limit,
								offset,
							),
						).map((team) => ({
							id: team.id,
							type: team.type,
							description: team.description,
						}))
					: await getAvailableGroupsForResource(
							resource,
							resourceId,
							debouncedSearch,
							limit,
							offset,
						);
				setListError(null);
				return page;
			} catch (e) {
				setListError(getErrorMessage(e, "Could not load the teams"));
				throw e;
			}
		},
		{ enabled: open, limit: PAGE_SIZE },
		[debouncedSearch, resource, resourceId, admin],
	);
	// the teams with access are left out as they show, so paging is not cut short
	const shownGroups = groups.data.filter(
		(group) => !excludedTeams?.has(`${group.type}:${group.id}`),
	);
	const shownCount = shownGroups.length;
	const loadedCount = groups.data.length;
	const {
		isLoading: isLoadingGroups,
		hasMore,
		next: loadMoreGroups,
	} = groups;

	useEffect(() => {
		// a page whose teams all have access shows nothing to scroll, so the
		// next page is read rather than saying every team has access
		if (
			open &&
			!isLoadingGroups &&
			hasMore &&
			loadedCount > 0 &&
			shownCount === 0
		) {
			loadMoreGroups();
		}
	}, [
		open,
		isLoadingGroups,
		hasMore,
		loadedCount,
		shownCount,
		loadMoreGroups,
	]);

	const { setScroll } = useInfiniteScroll({
		disabled: groups.isLoading || !groups.hasMore,
		onNext: groups.next,
	});

	const isCustomTeam = selected?.type === CUSTOM_TEAM_TYPE;
	const {
		managers,
		isLoading: isLoadingManagers,
		error: managersError,
		refresh: refreshManagers,
	} = useGroupManagers(
		isCustomTeam && selected ? selected.id : null,
		admin,
		admin ? undefined : { resource, resourceId },
	);
	// the owner must know who controls a custom team's members before trusting them
	const isManagersUnknown =
		isCustomTeam && (isLoadingManagers || managersError !== null);
	const selectedTypeName = useTeamTypeName(
		selected?.type ?? CUSTOM_TEAM_TYPE,
	);
	const levelLabel =
		GROUP_ACCESS_LEVELS.find((option) => option.value === level)?.label ??
		level;

	const handleClose = (added?: boolean) => {
		setSearchTerm("");
		setSelected(null);
		setIsShowingPeople(false);
		setLevel("READ_ONLY");
		setUsageLimit(null);
		setShouldShowLimitProblems(false);
		setSubmitError(null);
		onClose(added);
	};

	const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value);
	};

	const handleSubmit = async () => {
		if (!selected) {
			return;
		}
		if (limitProblem) {
			setShouldShowLimitProblems(true);
			limitEditorRef.current?.focusFirstProblem();
			return;
		}
		const limit = canGiveLimit ? usageLimit : null;
		if (onStage) {
			onStage(selected, level, limit);
			handleClose();
			return;
		}
		setIsSubmitting(true);
		setSubmitError(null);
		try {
			if (model) {
				await addGroupResourceAccess(
					resource,
					resourceId,
					selected,
					level,
					limit,
				);
			} else {
				await addGroupResourceAccess(
					resource,
					resourceId,
					selected,
					level,
				);
			}
		} catch (e) {
			setSubmitError(
				getErrorMessage(e, "Could not give the team access"),
			);
			setIsSubmitting(false);
			return;
		}
		setIsSubmitting(false);
		toast.success(`${selected.id} now has ${levelLabel} access`);
		handleClose(true);
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(isOpen) => {
				if (!isOpen && !isSubmitting) {
					handleClose();
				}
			}}
		>
			<DialogContent className="sm:max-w-xl">
				<DialogHeader>
					<DialogTitle className="font-medium text-base leading-6">
						Give a Team Access
					</DialogTitle>
					<DialogDescription>
						Everyone in the team you choose can use this {noun}.
					</DialogDescription>
				</DialogHeader>

				{isShowingPeople && selected ? (
					// the dialog's own gap, so the breadcrumb sits evenly between
					// the description above and the people below
					<div className="flex flex-col gap-4">
						{/* as tall as the search it replaces, so the dialog keeps its height */}
						<Breadcrumb className="flex min-h-9 flex-col justify-center">
							<BreadcrumbList className="gap-2 sm:gap-2">
								<BreadcrumbItem>
									<BreadcrumbLink asChild>
										<button
											type="button"
											className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
											onClick={() =>
												setIsShowingPeople(false)
											}
										>
											All Teams
										</button>
									</BreadcrumbLink>
								</BreadcrumbItem>
								<BreadcrumbSeparator />
								<BreadcrumbItem className="min-w-0 gap-2">
									<BreadcrumbPage className="wrap-break-word min-w-0 font-medium">
										{selected.id}
									</BreadcrumbPage>
									<TeamTypeBadge type={selected.type} />
								</BreadcrumbItem>
							</BreadcrumbList>
						</Breadcrumb>
						<ScrollArea className="h-72 shrink-0 rounded-md border bg-background">
							<div className="flex flex-col gap-4 p-3">
								<section className="flex flex-col gap-2">
									<h3 className={SECTION_TITLE_CLASS}>
										Managers
									</h3>
									<TeamPeopleManagers
										managers={managers}
										isLoading={isLoadingManagers}
										error={managersError}
									/>
								</section>
								<section className="flex flex-col gap-2">
									<h3 className={SECTION_TITLE_CLASS}>
										Members
									</h3>
									<TeamPeopleMembers
										key={selected.id}
										groupId={selected.id}
										target={{ resource, resourceId }}
										admin={admin}
									/>
								</section>
							</div>
						</ScrollArea>
					</div>
				) : null}

				{/* the team list stays mounted while the people show, so going
				back keeps its search, its loaded pages and where it was scrolled */}
				<InputGroup className={cn(isShowingPeople && "hidden")}>
					<InputGroupAddon>
						<Search className="size-4" aria-hidden />
					</InputGroupAddon>
					<InputGroupInput
						aria-label="Search teams by name"
						placeholder="Search teams by name"
						value={searchTerm}
						autoComplete="off"
						spellCheck={false}
						onChange={handleSearchChange}
					/>
				</InputGroup>

				{listError && !isShowingPeople ? (
					<Alert variant="destructive">
						<AlertDescription>{listError}</AlertDescription>
					</Alert>
				) : null}

				<ScrollArea
					viewportRef={setScroll}
					className={cn(
						"h-72 shrink-0 rounded-md border bg-background",
						isShowingPeople && "hidden",
					)}
				>
					<div
						className="flex flex-col gap-1.5 p-2"
						aria-busy={groups.isLoading}
					>
						{groups.isLoading && shownGroups.length === 0 ? (
							<p className={STATUS_CLASS}>
								<Spinner />
								Loading teams...
							</p>
						) : shownGroups.length === 0 ? (
							listError ? null : (
								<output className={STATUS_CLASS}>
									{debouncedSearch
										? "No teams match that search."
										: "Every team already has access."}
								</output>
							)
						) : (
							<ul className="flex flex-col gap-1.5">
								{shownGroups.map((group) => {
									const isSelected =
										selected?.id === group.id &&
										selected.type === group.type;
									return (
										<li key={`${group.type}:${group.id}`}>
											<button
												type="button"
												aria-pressed={isSelected}
												className={cn(
													TEAM_ROW_CLASS,
													isSelected &&
														"border-primary bg-primary/5 hover:bg-primary/10",
												)}
												onClick={() =>
													setSelected(group)
												}
											>
												<span className="flex min-w-0 flex-1 flex-col gap-1">
													<span className="flex min-w-0 items-center justify-between gap-2">
														<span
															className={cn(
																"font-medium text-sm",
																isSelected
																	? "wrap-break-word min-w-0"
																	: "truncate",
															)}
														>
															{group.id}
														</span>
														<TeamTypeBadge
															type={group.type}
														/>
													</span>
													{/* long descriptions show two lines until the team is picked */}
													{group.description ? (
														<span
															className={cn(
																"wrap-break-word text-muted-foreground text-xs",
																!isSelected &&
																	"line-clamp-2",
															)}
														>
															{group.description}
														</span>
													) : null}
												</span>
												<Check
													className={cn(
														"mt-0.5 size-4 shrink-0 text-primary",
														!isSelected &&
															"invisible",
													)}
													aria-hidden
												/>
											</button>
										</li>
									);
								})}
								{groups.isLoading ? (
									<li className={STATUS_CLASS}>
										<Spinner />
										Loading more teams...
									</li>
								) : null}
							</ul>
						)}
					</div>
				</ScrollArea>

				{selected ? (
					<div className="flex flex-col gap-4">
						<div className="flex flex-col gap-1.5">
							<Label htmlFor={levelId}>Access Level</Label>
							<Select
								value={level}
								onValueChange={(value) => {
									const option = GROUP_ACCESS_LEVELS.find(
										(candidate) =>
											candidate.value === value,
									);
									if (option) {
										setLevel(option.value);
									}
								}}
								disabled={isSubmitting}
							>
								<SelectTrigger
									id={levelId}
									className="w-full sm:w-56"
								>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{GROUP_ACCESS_LEVELS.map((option) => (
										<SelectItem
											key={option.value}
											value={option.value}
										>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{canGiveLimit ? (
							<ModelUsageLimitEditor
								ref={limitEditorRef}
								defaultValue={null}
								onChange={setUsageLimit}
								source="TEAM"
								label="Team Limit"
								isCostAvailable={isCostAvailable}
								notDefinedHint={
									model?.isPublic
										? PUBLIC_TEAM_HINT
										: undefined
								}
								shouldShowProblems={shouldShowLimitProblems}
								disabled={isSubmitting}
							/>
						) : model ? (
							<p className="text-muted-foreground text-xs">
								{OWNERS_ONLY_LIMIT_REASON}. The team starts with
								No Limit Defined.
							</p>
						) : null}
						{model ? (
							<UsageLimitGuideButton
								className="self-start"
								section="teams"
								viewer={{
									canSetModelLimits: canGiveLimit,
									isAdminMode: admin,
								}}
							/>
						) : null}

						<Alert className="wrap-break-word bg-muted/40">
							<ShieldAlert aria-hidden />
							<AlertTitle className="font-semibold">
								Review Before You Authorize
							</AlertTitle>
							<AlertDescription className="gap-2">
								<p>
									You are authorizing everyone in{" "}
									<span className="font-semibold">
										{selected.id}
									</span>{" "}
									to have{" "}
									<span className="font-semibold">
										{levelLabel}
									</span>{" "}
									access to this {noun}.
								</p>
								{canGiveLimit && usageLimit && !limitProblem ? (
									<p>
										Calls this team's limit applies to are
										capped at{" "}
										<span className="font-semibold">
											{describeModelUsageLimit(
												usageLimit,
												"TEAM",
											)}
										</span>
										.
									</p>
								) : null}
								{isCustomTeam ? (
									isLoadingManagers ? (
										<p className="flex items-center gap-2">
											<Spinner />
											Checking who manages this team...
										</p>
									) : managersError ? (
										<div className="flex flex-col items-start gap-2">
											<p>
												Could not check who manages this
												team, so it cannot be given
												access yet. {managersError}
											</p>
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={refreshManagers}
											>
												Try Again
											</Button>
										</div>
									) : managers.length > 0 ? (
										<p>
											This team's members are chosen by
											its managers,{" "}
											<span className="font-semibold">
												{getManagerNames(managers)}
											</span>
											, and by{" "}
											<span className="font-semibold">
												platform admins
											</span>
											. Anyone they add later gets this
											access too, and they can change who
											manages the team.
										</p>
									) : (
										<p>
											This team has no managers yet, so
											only{" "}
											<span className="font-semibold">
												platform admins
											</span>{" "}
											choose its members. Anyone they add
											later gets this access too.
										</p>
									)
								) : (
									<p>
										Its members come from your
										organization's {selectedTypeName} sign
										in, so its membership is managed outside
										of this app.
									</p>
								)}
								{isCustomTeam &&
								!isLoadingManagers &&
								managersError === null &&
								!isShowingPeople ? (
									<Button
										type="button"
										variant="outline"
										size="sm"
										className="self-start"
										onClick={() => setIsShowingPeople(true)}
									>
										<UsersRound
											className="size-4"
											aria-hidden
										/>
										See Managers and Members
									</Button>
								) : null}
								{level === "OWNER" ? (
									<p className="flex items-start gap-2 font-semibold">
										<TriangleAlert
											className="mt-0.5 size-4 shrink-0"
											aria-hidden
										/>
										Author access also lets every member
										delete this {noun} and decide who else
										can use it.
									</p>
								) : null}
							</AlertDescription>
						</Alert>
					</div>
				) : null}

				{submitError ? (
					<Alert variant="destructive">
						<AlertDescription>{submitError}</AlertDescription>
					</Alert>
				) : null}
				{selected && shouldShowLimitProblems && limitProblem ? (
					<p className="text-destructive text-xs">{limitProblem}</p>
				) : null}

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						disabled={isSubmitting}
						onClick={() => handleClose()}
					>
						Cancel
					</Button>
					<Button
						type="button"
						disabled={
							!selected || isManagersUnknown || isSubmitting
						}
						onClick={handleSubmit}
					>
						{onStage
							? "Add to My Changes"
							: isSubmitting
								? "Authorizing..."
								: "Authorize Access"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
