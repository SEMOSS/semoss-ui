import { CircleAlert, Search } from "lucide-react";
import { useEffect, useState } from "react";
import {
	type PermissionBatch,
	type PermissionBatchSaveResult,
	type PermissionChange,
	savePermissionBatches,
	validatePermissionBatches,
} from "@semoss/sdk";
import {
	Alert,
	AlertDescription,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Spinner,
	ToggleGroup,
	ToggleGroupItem,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { ReviewChangeRow } from "./review-change-row";

/** One change, as the review lists it */
export interface ReviewItem {
	/** The index of its permission batch */
	batchIndex: number;
	/** Its index in the batch's changes */
	changeIndex: number;
	/** The key of the entry it is for, so a blocked change can be left out */
	key: string;
	/** Where it happens, such as the app's name */
	where: string;
	/** Whether it gives, changes or takes away access */
	action: PermissionChange["action"];
	/** The person's or team's name */
	name: string;
	/** A person or a team */
	kind: "USER" | "TEAM";
	/** The person's login type, or the team's type */
	type: string;
	/** The person's id */
	id?: string;
	/** The person's email, when they have one */
	email?: string | null;
	/** What the change does to their access, such as "Read-Only to Editor", or empty */
	detail: string;
}

/** Rows shown at first, and added by each Show More */
const PAGE_SIZE = 200;

/** Which changes the list shows */
type ReviewFilter = "ALL" | PermissionChange["action"] | "BLOCKED";

export interface PermissionBatchReviewDialogProps {
	/** Whether the dialog is open */
	open: boolean;
	/** The batches to validate and save; make them with useMemo so they are validated once */
	batches: PermissionBatch[];
	/** Every change in the batches, as the review lists them */
	items: ReviewItem[];
	/** Called after the batches were saved */
	onApplied: (result: PermissionBatchSaveResult) => void;
	/** Called to leave the blocked changes out of the batch */
	onLeaveOut?: (items: ReviewItem[]) => void;
	/** Called when the dialog closes without saving */
	onClose: () => void;
	/** Whether to validate and save in admin mode; outside it an admin has only their own permissions */
	admin?: boolean;
}

/**
 * Validates permission batches against the current access and the user's
 * permissions, lists every change with the reason any is blocked, and saves
 * them all in one go. Nothing is saved while a change is blocked. Long reviews
 * can be searched and filtered by what each change does; blocked changes come
 * first.
 */
export const PermissionBatchReviewDialog = ({
	open,
	batches,
	items,
	onApplied,
	onLeaveOut,
	onClose,
	admin = false,
}: PermissionBatchReviewDialogProps) => {
	const [reasons, setReasons] = useState<ReadonlyMap<string, string>>(
		() => new Map(),
	);
	const [isChecking, setIsChecking] = useState(false);
	const [checkError, setCheckError] = useState<string | null>(null);
	const [applyError, setApplyError] = useState<string | null>(null);
	const [isApplying, setIsApplying] = useState(false);
	const [search, setSearch] = useState("");
	const [filter, setFilter] = useState<ReviewFilter>("ALL");
	const [shownCount, setShownCount] = useState(PAGE_SIZE);

	useEffect(() => {
		if (!open || batches.length === 0) {
			return;
		}
		let isStale = false;
		setIsChecking(true);
		setCheckError(null);
		setApplyError(null);
		// the reasons are keyed by position, which leaving changes out shifts
		setReasons(new Map());
		validatePermissionBatches(batches, admin)
			.then((validations) => {
				if (isStale) {
					return;
				}
				const next = new Map<string, string>();
				validations.forEach((validation, batchIndex) => {
					for (const change of validation.changes) {
						if (!change.allowed) {
							next.set(
								`${batchIndex}:${change.index}`,
								change.reason ??
									validation.reason ??
									"This change cannot be made",
							);
						}
					}
				});
				setReasons(next);
			})
			.catch((e: unknown) => {
				if (!isStale) {
					setCheckError(
						getErrorMessage(e, "Could not check the changes"),
					);
				}
			})
			.finally(() => {
				if (!isStale) {
					setIsChecking(false);
				}
			});
		return () => {
			isStale = true;
		};
	}, [open, batches, admin]);

	const reasonOf = (item: ReviewItem): string | null =>
		reasons.get(`${item.batchIndex}:${item.changeIndex}`) ?? null;
	const blocked = items.filter((item) => reasonOf(item) !== null);
	const countOf = (action: PermissionChange["action"]): number =>
		items.filter((item) => item.action === action).length;
	const filters: { value: ReviewFilter; label: string; count: number }[] = [
		{ value: "ALL", label: "All", count: items.length },
		{ value: "ADD", label: "Added", count: countOf("ADD") },
		{ value: "CHANGE", label: "Changed", count: countOf("CHANGE") },
		{ value: "REMOVE", label: "Removed", count: countOf("REMOVE") },
		{ value: "BLOCKED", label: "Blocked", count: blocked.length },
	].filter((option) => option.value === "ALL" || option.count > 0);
	// a filter whose changes were all left out falls back to everything
	const activeFilter = filters.some((option) => option.value === filter)
		? filter
		: "ALL";
	const normalizedSearch = search.trim().toLowerCase();
	// blocked changes first, so they are seen without scrolling
	const visible = [
		...blocked,
		...items.filter((item) => reasonOf(item) === null),
	].filter(
		(item) =>
			(activeFilter === "ALL" ||
				(activeFilter === "BLOCKED"
					? reasonOf(item) !== null
					: item.action === activeFilter)) &&
			(!normalizedSearch ||
				[
					item.name,
					item.type,
					item.detail,
					item.where,
					item.id,
					item.email,
				]
					.filter(
						(value): value is string => typeof value === "string",
					)
					.some((value) =>
						value.toLowerCase().includes(normalizedSearch),
					)),
	);
	const shown = visible.slice(0, shownCount);
	// the target is said once, unless the changes reach more than one
	const targets = [...new Set(items.map((item) => item.where))];
	const isOneTarget = targets.length === 1;
	// leaving out every blocked change can leave nothing to save
	const changeCount = batches.reduce(
		(sum, batch) => sum + batch.changes.length,
		0,
	);
	const canApply =
		changeCount > 0 &&
		!isChecking &&
		!isApplying &&
		checkError === null &&
		blocked.length === 0;

	const handleApply = async () => {
		setIsApplying(true);
		setApplyError(null);
		try {
			const result = await savePermissionBatches(batches, admin);
			setIsApplying(false);
			onApplied(result);
		} catch (e) {
			setApplyError(getErrorMessage(e, "The changes were not saved"));
			setIsApplying(false);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(isOpen) => {
				if (!isOpen && !isApplying) {
					onClose();
				}
			}}
		>
			<DialogContent className="sm:max-w-3xl">
				<DialogHeader>
					<DialogTitle className="font-medium text-base leading-6">
						Review and Apply
					</DialogTitle>
					<DialogDescription>
						{changeCount === 1
							? "1 change"
							: `${changeCount.toLocaleString()} changes`}
						{isOneTarget ? ` to ${targets[0]}` : ""}. They are saved
						together: all of them or none.
					</DialogDescription>
				</DialogHeader>

				{isChecking ? (
					<output className="flex items-center gap-2 text-muted-foreground text-sm">
						<Spinner className="size-4" />
						Checking the changes...
					</output>
				) : null}
				{checkError ? (
					<Alert variant="destructive">
						<AlertDescription>{checkError}</AlertDescription>
					</Alert>
				) : null}
				{!isChecking && blocked.length > 0 ? (
					<Alert variant="destructive">
						<CircleAlert className="size-4" aria-hidden />
						<AlertDescription>
							{blocked.length === 1
								? "1 change cannot be made."
								: `${blocked.length.toLocaleString()} changes cannot be made.`}{" "}
							They are listed first. Leave them out or change them
							to apply the rest.
						</AlertDescription>
					</Alert>
				) : null}

				{changeCount === 0 ? (
					<p className="text-muted-foreground text-sm">
						Nothing is left to save. Go back to make more changes.
					</p>
				) : (
					<div className="flex min-w-0 flex-col gap-3">
						<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
							<InputGroup className="w-full md:max-w-xs">
								<InputGroupAddon>
									<Search className="size-4" aria-hidden />
								</InputGroupAddon>
								<InputGroupInput
									aria-label="Search the changes"
									placeholder="Search the changes"
									value={search}
									onChange={(e) => {
										setSearch(e.target.value);
										setShownCount(PAGE_SIZE);
									}}
								/>
							</InputGroup>
							<ToggleGroup
								type="single"
								variant="outline"
								size="sm"
								value={activeFilter}
								onValueChange={(value) => {
									const option = filters.find(
										(item) => item.value === value,
									);
									if (option) {
										setFilter(option.value);
										setShownCount(PAGE_SIZE);
									}
								}}
								aria-label="Show"
								className="flex-wrap"
							>
								{filters.map((option) => (
									<ToggleGroupItem
										key={option.value}
										value={option.value}
										className={
											option.value === "BLOCKED"
												? "text-destructive"
												: undefined
										}
									>
										{option.label} (
										{option.count.toLocaleString()})
									</ToggleGroupItem>
								))}
							</ToggleGroup>
						</div>

						<div className="max-h-80 overflow-y-auto rounded-md border border-border">
							{shown.length === 0 ? (
								<p className="px-3 py-6 text-center text-muted-foreground text-sm">
									No changes match
								</p>
							) : (
								<ul className="flex flex-col divide-y divide-border">
									{shown.map((item) => (
										<ReviewChangeRow
											key={`${item.batchIndex}:${item.changeIndex}`}
											action={item.action}
											name={item.name}
											kind={item.kind}
											type={item.type}
											id={item.id}
											email={item.email}
											detail={item.detail}
											where={
												isOneTarget
													? undefined
													: item.where
											}
											reason={reasonOf(item)}
										/>
									))}
								</ul>
							)}
							{visible.length > shown.length ? (
								<div className="flex items-center justify-between gap-2 border-border border-t px-3 py-2">
									<span className="text-muted-foreground text-xs">
										Showing {shown.length.toLocaleString()}{" "}
										of {visible.length.toLocaleString()}
									</span>
									<Button
										type="button"
										size="sm"
										variant="outline"
										onClick={() =>
											setShownCount(
												(count) => count + PAGE_SIZE,
											)
										}
									>
										Show More
									</Button>
								</div>
							) : null}
						</div>
					</div>
				)}

				{applyError ? (
					<Alert variant="destructive">
						<AlertDescription>{applyError}</AlertDescription>
					</Alert>
				) : null}

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						disabled={isApplying}
						onClick={onClose}
					>
						Back to Editing
					</Button>
					{blocked.length > 0 && onLeaveOut ? (
						<Button
							type="button"
							variant="outline"
							disabled={
								isApplying || isChecking || checkError !== null
							}
							onClick={() => onLeaveOut(blocked)}
						>
							Leave Out {blocked.length.toLocaleString()} Blocked
						</Button>
					) : null}
					<Button
						type="button"
						disabled={!canApply}
						onClick={handleApply}
					>
						{isApplying
							? "Applying..."
							: changeCount === 1
								? "Apply 1 Change"
								: `Apply ${changeCount.toLocaleString()} Changes`}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
