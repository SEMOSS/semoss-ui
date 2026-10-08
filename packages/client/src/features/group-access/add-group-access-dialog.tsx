import { Check, Search, ShieldAlert, TriangleAlert } from "lucide-react";
import { type ChangeEvent, useId, useState } from "react";
import type { Role } from "@semoss/sdk";
import { useIteratorApi } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
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
} from "@/api/teams";
import { useGroupManagers } from "@/features/group-managers/use-group-managers";
import { TEAM_RESOURCE_NOUNS } from "@/features/team-resource-access/team-resource-nouns";
import { CUSTOM_TEAM_TYPE } from "@/features/team-type/team-type";
import { TeamTypeBadge } from "@/features/team-type/team-type-badge";
import { useTeamTypeName } from "@/features/team-type/use-team-type-name";
import { GROUP_ACCESS_LEVELS } from "./group-access-levels";

/** Teams fetched per page */
const PAGE_SIZE = 20;

/** Centered status line inside the results pane */
const STATUS_CLASS =
	"flex items-center justify-center gap-2 px-3 py-6 text-center text-muted-foreground text-sm";

/** The row style the shared add-members dialog uses, so the pickers match */
const TEAM_ROW_CLASS =
	"flex w-full items-start gap-3 rounded-md border bg-muted/40 px-3 py-2 text-start hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** The names of a team's managers, in a sentence */
const getManagerNames = (managers: GroupManager[]): string =>
	managers
		.map((manager) => manager.name || manager.email || manager.userid)
		.join(", ");

export interface AddGroupAccessDialogProps {
	/** Whether the dialog is open */
	open: boolean;
	/** The kind of resource the team gets access to */
	resource: GroupAccessResource;
	/** The project or engine id */
	resourceId: string;
	/** Called when the dialog closes, with true after a team was given access */
	onClose: (added?: boolean) => void;
}

/**
 * Lets the owner of a project or engine give a team access to it. Before they
 * confirm, it says who decides the team's members, so the owner knows whom they
 * are trusting with the access; a custom team cannot be authorized until its
 * managers are known. Give it a new key each time it opens so it starts from an
 * empty search.
 */
export const AddGroupAccessDialog = ({
	open,
	resource,
	resourceId,
	onClose,
}: AddGroupAccessDialogProps) => {
	const levelId = useId();
	const [searchTerm, setSearchTerm] = useState("");
	const debouncedSearch = useDebouncedValue(searchTerm.trim(), 300);
	const [selected, setSelected] = useState<AvailableGroup | null>(null);
	const [level, setLevel] = useState<Role>("READ_ONLY");
	const [listError, setListError] = useState<string | null>(null);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const noun = TEAM_RESOURCE_NOUNS[resource].singular;

	const groups = useIteratorApi<AvailableGroup>(
		async (limit, offset) => {
			try {
				const page = await getAvailableGroupsForResource(
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
		[debouncedSearch, resource, resourceId],
	);

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
	} = useGroupManagers(isCustomTeam && selected ? selected.id : null, false, {
		resource,
		resourceId,
	});
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
		setLevel("READ_ONLY");
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
		setIsSubmitting(true);
		setSubmitError(null);
		try {
			await addGroupResourceAccess(resource, resourceId, selected, level);
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

				<InputGroup>
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

				{listError ? (
					<Alert variant="destructive">
						<AlertDescription>{listError}</AlertDescription>
					</Alert>
				) : null}

				<ScrollArea
					viewportRef={setScroll}
					className="h-72 shrink-0 rounded-md border bg-background"
				>
					<div
						className="flex flex-col gap-1.5 p-2"
						aria-busy={groups.isLoading}
					>
						{groups.isLoading && groups.data.length === 0 ? (
							<p className={STATUS_CLASS}>
								<Spinner />
								Loading teams...
							</p>
						) : groups.data.length === 0 ? (
							listError ? null : (
								<output className={STATUS_CLASS}>
									{debouncedSearch
										? "No teams match that search."
										: "Every team already has access."}
								</output>
							)
						) : (
							<ul className="flex flex-col gap-1.5">
								{groups.data.map((group) => {
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
						{isSubmitting ? "Authorizing..." : "Authorize Access"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
