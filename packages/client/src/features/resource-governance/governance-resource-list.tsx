import { ArrowDownUp, Search, Trash2 } from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import {
	Button,
	Card,
	Checkbox,
	cn,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Label,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	useInfiniteScroll,
} from "@semoss/ui/next";
import { DeleteGovernanceResourcesDialog } from "./delete-governance-resources-dialog";
import { GovernanceResourceIcon } from "./governance-resource-icon";
import { GOVERNANCE_NOUNS, type GovernanceType } from "./governance-types";
import type {
	GovernanceResource,
	GovernanceResources,
	GovernanceSort,
} from "./use-governance-resources";

const SORT_OPTIONS: readonly { value: GovernanceSort; label: string }[] = [
	{ value: "NAME", label: "Name" },
	{ value: "NEWEST", label: "Newest First" },
	{ value: "OLDEST", label: "Oldest First" },
];

export interface GovernanceResourceListProps {
	/** The type whose projects or engines are listed */
	entry: GovernanceType;
	/** The type dropdown, shown at the top of the list */
	typeSelect: ReactNode;
	/** The resources read so far, and how to read more */
	list: GovernanceResources;
	/** The search as typed */
	search: string;
	/** The search the list was read with, once typing paused */
	appliedSearch: string;
	/** Changes the search */
	onSearchChange: (search: string) => void;
	/** How the list is ordered */
	sort: GovernanceSort;
	/** Changes the order */
	onSortChange: (sort: GovernanceSort) => void;
	/** The resource open beside the list */
	selectedId?: string;
	/** Opens a resource */
	onSelect: (resource: GovernanceResource) => void;
	/** Called with the ids of the resources deleted from the list */
	onDeleted: (ids: string[]) => void;
}

/**
 * The projects or engines of one type, searchable by name, read a page at a
 * time as the list scrolls. Choosing one opens it beside the list; checking
 * several deletes them together, after a confirmation.
 */
export const GovernanceResourceList = ({
	entry,
	typeSelect,
	list,
	search,
	appliedSearch,
	onSearchChange,
	sort,
	onSortChange,
	selectedId,
	onSelect,
	onDeleted,
}: GovernanceResourceListProps) => {
	const selectAllId = useId();
	const { resources, isLoading, hasMore, loadMore } = list;
	const nouns = GOVERNANCE_NOUNS[entry.kind];
	const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [deleteTargets, setDeleteTargets] = useState<GovernanceResource[]>(
		[],
	);
	const { setScroll } = useInfiniteScroll({
		disabled: isLoading || !hasMore,
		onNext: loadMore,
	});

	// a resource that left the list, such as after a search, is no longer picked
	const checked = resources.filter((resource) => checkedIds.has(resource.id));
	const isAllChecked =
		resources.length > 0 && checked.length === resources.length;

	const toggleChecked = (id: string) => {
		setCheckedIds((current) => {
			const next = new Set(current);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	};

	const toggleAll = () => {
		setCheckedIds((current) => {
			const next = new Set(current);
			for (const resource of resources) {
				if (isAllChecked) {
					next.delete(resource.id);
				} else {
					next.add(resource.id);
				}
			}
			return next;
		});
	};

	const openDelete = () => {
		setDeleteTargets(checked);
		setIsDeleteOpen(true);
	};

	const handleDeleted = (ids: string[]) => {
		setIsDeleteOpen(false);
		// the ones that could not be deleted stay picked, to try again
		setCheckedIds((current) => {
			const next = new Set(current);
			for (const id of ids) {
				next.delete(id);
			}
			return next;
		});
		if (ids.length > 0) {
			onDeleted(ids);
		}
	};

	return (
		<Card className="flex h-full min-h-0 flex-col gap-0 overflow-hidden border border-border/60 py-0">
			<div className="flex flex-col gap-2 border-border/60 border-b p-3">
				{typeSelect}
				<div className="flex items-center gap-2">
					<InputGroup className="flex-1">
						<InputGroupAddon>
							<Search className="size-4" aria-hidden />
						</InputGroupAddon>
						<InputGroupInput
							placeholder={`Search ${entry.label.toLowerCase()} ${nouns.plural}`}
							aria-label={`Search ${entry.label.toLowerCase()} ${nouns.plural}`}
							value={search}
							onChange={(event) =>
								onSearchChange(event.target.value)
							}
						/>
					</InputGroup>
					<DropdownMenu>
						<Tooltip>
							<TooltipTrigger asChild>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										size="icon-sm"
										aria-label="Sort"
									>
										<ArrowDownUp
											className="size-4"
											aria-hidden
										/>
									</Button>
								</DropdownMenuTrigger>
							</TooltipTrigger>
							<TooltipContent>Sort</TooltipContent>
						</Tooltip>
						<DropdownMenuContent align="end">
							<DropdownMenuRadioGroup
								value={sort}
								onValueChange={(value) =>
									onSortChange(value as GovernanceSort)
								}
							>
								{SORT_OPTIONS.map((option) => (
									<DropdownMenuRadioItem
										key={option.value}
										value={option.value}
									>
										{option.label}
									</DropdownMenuRadioItem>
								))}
							</DropdownMenuRadioGroup>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			{resources.length > 0 ? (
				<div className="flex h-11 shrink-0 items-center gap-2.5 border-border/60 border-b px-3">
					<Checkbox
						id={selectAllId}
						checked={isAllChecked}
						onCheckedChange={toggleAll}
					/>
					<Label
						htmlFor={selectAllId}
						className="flex-1 font-normal text-muted-foreground text-xs"
					>
						Select all shown
					</Label>
					{checked.length > 0 ? (
						<Button
							variant="outline"
							size="sm"
							className="text-destructive hover:bg-destructive/10 hover:text-destructive"
							onClick={openDelete}
						>
							<Trash2 className="size-4" aria-hidden />
							Delete ({checked.length})
						</Button>
					) : null}
				</div>
			) : null}

			<div ref={setScroll} className="min-h-0 flex-1 overflow-y-auto">
				{resources.length === 0 ? (
					<div className="flex h-40 items-center justify-center p-3 text-center text-muted-foreground text-sm">
						{isLoading ? (
							<Spinner className="size-5" />
						) : appliedSearch ? (
							`Nothing matches ${appliedSearch}`
						) : (
							`There are no ${entry.label.toLowerCase()} ${nouns.plural} yet`
						)}
					</div>
				) : (
					<ul aria-label={entry.label}>
						{resources.map((resource) => {
							const isSelected = resource.id === selectedId;
							return (
								<li
									key={resource.id}
									className={cn(
										"flex items-center gap-2.5 border-border/40 border-b pl-3 hover:bg-accent has-[button:focus-visible]:bg-accent",
										isSelected && "bg-accent",
									)}
								>
									<Checkbox
										aria-label={`Select ${resource.name}`}
										checked={checkedIds.has(resource.id)}
										onCheckedChange={() =>
											toggleChecked(resource.id)
										}
									/>
									<button
										type="button"
										aria-current={isSelected || undefined}
										className="flex min-w-0 flex-1 items-center gap-2.5 py-2 pr-3 text-start focus-visible:outline-none"
										onClick={() => onSelect(resource)}
									>
										<GovernanceResourceIcon
											entry={entry}
											resource={resource}
											className="size-8"
										/>
										<span className="flex min-w-0 flex-1 flex-col">
											<span className="truncate font-medium text-sm">
												{resource.name}
											</span>
											<span className="truncate text-muted-foreground text-xs">
												id: {resource.id}
											</span>
										</span>
									</button>
								</li>
							);
						})}
					</ul>
				)}
				{resources.length > 0 && isLoading ? (
					<div className="flex justify-center py-3">
						<Spinner className="size-4" />
					</div>
				) : null}
			</div>

			<DeleteGovernanceResourcesDialog
				open={isDeleteOpen}
				entry={entry}
				resources={deleteTargets}
				onCancel={() => setIsDeleteOpen(false)}
				onDeleted={handleDeleted}
			/>
		</Card>
	);
};
