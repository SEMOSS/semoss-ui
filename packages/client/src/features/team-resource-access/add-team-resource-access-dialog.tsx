import { Search, TriangleAlert } from "lucide-react";
import { useId, useState } from "react";
import type { Role } from "@semoss/sdk";
import { useIteratorApi } from "@semoss/sdk/react";
import { AppCatalogAvatar, EngineSubtypeIcon } from "@semoss/shared";
import {
	Alert,
	AlertDescription,
	Button,
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
	addTeamResourceAccess,
	type GroupAccessResource,
	type GroupKey,
	getAvailableTeamResources,
	type TeamResource,
} from "@/api/teams";
import {
	DEFAULT_GROUP_ACCESS_LEVEL,
	GROUP_ACCESS_LEVELS,
} from "@/features/group-access/group-access-levels";
import { TEAM_RESOURCE_NOUNS } from "./team-resource-nouns";

/** Projects or engines fetched per page */
const PAGE_SIZE = 20;

/** Centered status line inside the results pane */
const STATUS_CLASS =
	"flex items-center justify-center gap-2 px-3 py-6 text-center text-muted-foreground text-sm";

export interface AddTeamResourceAccessDialogProps {
	/** Whether the dialog is open */
	open: boolean;
	/** Projects or engines */
	kind: GroupAccessResource;
	/** The team that gets the access */
	group: GroupKey;
	/** Called when the dialog closes, with true when any access was given */
	onClose: (added?: boolean) => void;
}

/**
 * Lets an admin give a team access to projects or engines it cannot use yet,
 * at one access level for everything picked.
 */
export const AddTeamResourceAccessDialog = ({
	open,
	kind,
	group,
	onClose,
}: AddTeamResourceAccessDialogProps) => {
	const levelId = useId();
	const nouns = TEAM_RESOURCE_NOUNS[kind];
	const [search, setSearch] = useState("");
	const debouncedSearch = useDebouncedValue(search.trim(), 300);
	const [selected, setSelected] = useState<TeamResource[]>([]);
	const [level, setLevel] = useState<Role>("READ_ONLY");
	const [listError, setListError] = useState<string | null>(null);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [hasAdded, setHasAdded] = useState(false);
	const levelOption =
		GROUP_ACCESS_LEVELS.find((option) => option.value === level) ??
		DEFAULT_GROUP_ACCESS_LEVEL;

	const resources = useIteratorApi<TeamResource>(
		async (limit, offset) => {
			try {
				const page = await getAvailableTeamResources(
					kind,
					group,
					debouncedSearch,
					limit,
					offset,
				);
				setListError(null);
				return page;
			} catch (e) {
				setListError(
					getErrorMessage(e, `Could not load the ${nouns.plural}`),
				);
				throw e;
			}
		},
		{ enabled: open, limit: PAGE_SIZE },
		[debouncedSearch, kind, group],
	);

	const { setScroll } = useInfiniteScroll({
		disabled: resources.isLoading || !resources.hasMore,
		onNext: resources.next,
	});

	const selectedIds = new Set(selected.map((resource) => resource.id));

	const toggleSelected = (resource: TeamResource) => {
		setSelected((current) =>
			current.some((item) => item.id === resource.id)
				? current.filter((item) => item.id !== resource.id)
				: [...current, resource],
		);
	};

	const resetState = () => {
		setSearch("");
		setSelected([]);
		setLevel("READ_ONLY");
		setSubmitError(null);
		setHasAdded(false);
	};

	const handleClose = () => {
		const added = hasAdded;
		resetState();
		onClose(added);
	};

	const handleSubmit = async () => {
		setIsSubmitting(true);
		setSubmitError(null);
		const failed: TeamResource[] = [];
		const messages: string[] = [];
		for (const resource of selected) {
			try {
				await addTeamResourceAccess(
					kind,
					group,
					resource.id,
					levelOption.id,
				);
			} catch (e) {
				failed.push(resource);
				messages.push(
					`${resource.name}: ${getErrorMessage(e, "not added")}`,
				);
			}
		}
		setIsSubmitting(false);
		const addedCount = selected.length - failed.length;
		if (addedCount > 0) {
			setHasAdded(true);
			toast.success(
				`${group.id} now has ${levelOption.label} access to ${addedCount} ${
					addedCount === 1 ? nouns.singular : nouns.plural
				}`,
			);
		}
		if (failed.length > 0) {
			setSelected(failed);
			setSubmitError(messages.join(" "));
			resources.reset();
			return;
		}
		resetState();
		onClose(true);
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
						Add {nouns.title}
					</DialogTitle>
					<DialogDescription>
						Everyone in {group.id} gets access to the {nouns.plural}{" "}
						you pick.
					</DialogDescription>
				</DialogHeader>

				<InputGroup>
					<InputGroupAddon>
						<Search className="size-4" aria-hidden />
					</InputGroupAddon>
					<InputGroupInput
						aria-label={`Search ${nouns.plural} by name`}
						placeholder={`Search ${nouns.plural} by name`}
						value={search}
						autoComplete="off"
						spellCheck={false}
						onChange={(e) => setSearch(e.target.value)}
					/>
				</InputGroup>

				{listError ? (
					<Alert variant="destructive">
						<AlertDescription>{listError}</AlertDescription>
					</Alert>
				) : null}

				<ScrollArea
					viewportRef={setScroll}
					className="h-64 shrink-0 rounded-md border bg-background"
				>
					<div
						className="flex flex-col gap-1 p-2"
						aria-busy={resources.isLoading}
					>
						{resources.isLoading && resources.data.length === 0 ? (
							<p className={STATUS_CLASS}>
								<Spinner />
								Loading {nouns.plural}...
							</p>
						) : resources.data.length === 0 ? (
							listError ? null : (
								<output className={STATUS_CLASS}>
									{debouncedSearch
										? `No ${nouns.plural} match that search.`
										: `The team can already use every ${nouns.singular}.`}
								</output>
							)
						) : (
							<ul className="flex flex-col gap-1">
								{resources.data.map((resource) => {
									const isSelected = selectedIds.has(
										resource.id,
									);
									const checkboxId = `add-${kind}-${resource.id}`;
									return (
										<li key={resource.id}>
											<label
												htmlFor={checkboxId}
												className={cn(
													"flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 hover:bg-accent",
													isSelected && "bg-accent",
												)}
											>
												<Checkbox
													id={checkboxId}
													checked={isSelected}
													disabled={isSubmitting}
													onCheckedChange={() =>
														toggleSelected(resource)
													}
												/>
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
														projectId={resource.id}
														name={resource.name}
														className="size-8 shrink-0 rounded-md text-xs"
													/>
												)}
												<span className="flex min-w-0 flex-1 flex-col">
													<span className="truncate font-medium text-sm">
														{resource.name}
													</span>
													<span className="truncate text-muted-foreground text-xs">
														id: {resource.id}
													</span>
												</span>
											</label>
										</li>
									);
								})}
								{resources.isLoading ? (
									<li className={STATUS_CLASS}>
										<Spinner />
										Loading more {nouns.plural}...
									</li>
								) : null}
							</ul>
						)}
					</div>
				</ScrollArea>

				<div className="flex flex-col gap-1.5">
					<Label htmlFor={levelId}>Access Level</Label>
					<Select
						value={level}
						disabled={isSubmitting}
						onValueChange={(value) => {
							const option = GROUP_ACCESS_LEVELS.find(
								(candidate) => candidate.value === value,
							);
							if (option) {
								setLevel(option.value);
							}
						}}
					>
						<SelectTrigger id={levelId} className="w-full sm:w-56">
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
					{level === "OWNER" ? (
						<p className="flex items-start gap-2 text-sm text-warning">
							<TriangleAlert
								className="mt-0.5 size-4 shrink-0"
								aria-hidden
							/>
							Author access lets every member delete these{" "}
							{nouns.plural} and decide who else can use them.
						</p>
					) : null}
				</div>

				{submitError ? (
					<Alert variant="destructive">
						<AlertDescription>{submitError}</AlertDescription>
					</Alert>
				) : null}

				<DialogFooter className="items-center sm:justify-between">
					<p
						className="text-muted-foreground text-sm"
						aria-live="polite"
					>
						{selected.length === 1
							? `1 ${nouns.singular} selected`
							: `${selected.length} ${nouns.plural} selected`}
					</p>
					<div className="flex flex-col-reverse gap-2 sm:flex-row">
						<Button
							type="button"
							variant="outline"
							disabled={isSubmitting}
							onClick={handleClose}
						>
							Cancel
						</Button>
						<Button
							type="button"
							disabled={selected.length === 0 || isSubmitting}
							onClick={handleSubmit}
						>
							{isSubmitting ? <Spinner /> : null}
							{isSubmitting
								? "Adding..."
								: selected.length > 0
									? `Add ${selected.length}`
									: "Add"}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
