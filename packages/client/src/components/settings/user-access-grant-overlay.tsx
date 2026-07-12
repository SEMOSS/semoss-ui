import { Search } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
	Button,
	Checkbox,
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
} from "@semoss/ui/next";
import type { Role } from "@/types";
import { ACCESS_PERMISSIONS } from "./user-access-table";

export interface GrantCandidate {
	id: string;
	name: string;
	type?: string;
	subtype?: string;
}

export interface UserAccessGrantOverlayProps {
	open: boolean;
	title: string;
	description?: string;
	/** Resources the user does NOT yet have access to */
	candidates: GrantCandidate[];
	loading?: boolean;
	busy?: boolean;
	/** Controlled search term (parent decides client- vs server-side filtering) */
	search: string;
	onSearchChange: (value: string) => void;
	/** Extra controls rendered in the header, e.g. an engine-type selector */
	headerControls?: ReactNode;
	/** Render a leading logo/icon for a candidate row */
	renderIcon?: (candidate: GrantCandidate) => ReactNode;
	onClose: () => void;
	onGrant: (selected: GrantCandidate[], permission: Role) => void;
}

/**
 * Dialog for granting a user access to resources they don't yet have. The
 * parent owns the candidate list (and any filtering); this component owns the
 * multi-selection and the permission level to grant.
 */
export const UserAccessGrantOverlay = ({
	open,
	title,
	description,
	candidates,
	loading = false,
	busy = false,
	search,
	onSearchChange,
	headerControls,
	renderIcon,
	onClose,
	onGrant,
}: UserAccessGrantOverlayProps) => {
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [permission, setPermission] = useState<Role>("READ_ONLY");

	// Reset selection whenever the dialog is opened or closed
	useEffect(() => {
		if (!open) {
			setSelectedIds(new Set());
			setPermission("READ_ONLY");
		}
	}, [open]);

	const selectedCandidates = useMemo(
		() => candidates.filter((candidate) => selectedIds.has(candidate.id)),
		[candidates, selectedIds],
	);

	const allSelected =
		candidates.length > 0 &&
		candidates.every((candidate) => selectedIds.has(candidate.id));
	const someSelected =
		!allSelected &&
		candidates.some((candidate) => selectedIds.has(candidate.id));

	const toggle = (id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	};

	const toggleAll = () => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (allSelected) {
				for (const candidate of candidates) {
					next.delete(candidate.id);
				}
			} else {
				for (const candidate of candidates) {
					next.add(candidate.id);
				}
			}
			return next;
		});
	};

	return (
		<Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
			<DialogContent className="flex max-h-[85vh] w-full max-w-2xl flex-col gap-4 overflow-hidden">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					{description ? (
						<DialogDescription>{description}</DialogDescription>
					) : null}
				</DialogHeader>

				<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
					{headerControls}
					<InputGroup className="flex-1">
						<InputGroupAddon>
							<Search className="size-4" />
						</InputGroupAddon>
						<InputGroupInput
							placeholder="Search"
							value={search}
							onChange={(e) => onSearchChange(e.target.value)}
						/>
					</InputGroup>
				</div>

				<div className="flex items-center justify-between px-1">
					<button
						type="button"
						className="flex items-center gap-2 text-sm disabled:opacity-50"
						disabled={candidates.length === 0}
						onClick={toggleAll}
					>
						<Checkbox
							checked={
								allSelected
									? true
									: someSelected
										? "indeterminate"
										: false
							}
							aria-label="Select all"
							onClick={(e) => e.preventDefault()}
						/>
						Select all
					</button>
					<span className="text-muted-foreground text-xs">
						{selectedCandidates.length} selected
					</span>
				</div>

				<div className="min-h-40 flex-1 overflow-y-auto rounded-md border border-border/60">
					{loading ? (
						<div className="flex h-40 items-center justify-center">
							<Spinner className="size-5" />
						</div>
					) : candidates.length === 0 ? (
						<div className="flex h-40 items-center justify-center px-3 text-center text-muted-foreground text-sm">
							No resources available to grant
						</div>
					) : (
						candidates.map((candidate) => {
							const isSelected = selectedIds.has(candidate.id);
							return (
								<button
									key={candidate.id}
									type="button"
									className="flex w-full items-center gap-3 px-3 py-2 text-start hover:bg-accent"
									onClick={() => toggle(candidate.id)}
								>
									<Checkbox
										checked={isSelected}
										aria-label={`Select ${candidate.name}`}
										onClick={(e) => e.preventDefault()}
									/>
									{renderIcon ? (
										<span className="flex size-8 shrink-0 items-center justify-center overflow-hidden">
											{renderIcon(candidate)}
										</span>
									) : null}
									<div className="flex min-w-0 flex-1 flex-col">
										<span className="truncate font-medium text-sm">
											{candidate.name || candidate.id}
										</span>
										<span className="truncate text-muted-foreground text-xs">
											id: {candidate.id}
										</span>
									</div>
								</button>
							);
						})
					)}
				</div>

				<DialogFooter className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center gap-2">
						<Label className="text-muted-foreground text-sm">
							Permission
						</Label>
						<Select
							value={permission}
							onValueChange={(value) =>
								setPermission(value as Role)
							}
						>
							<SelectTrigger className="h-8 w-[150px]">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{ACCESS_PERMISSIONS.map((option) => (
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
					<div className="flex items-center gap-2">
						<Button variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<Button
							disabled={busy || selectedCandidates.length === 0}
							onClick={() =>
								onGrant(selectedCandidates, permission)
							}
						>
							Grant
							{selectedCandidates.length > 0
								? ` (${selectedCandidates.length})`
								: ""}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
