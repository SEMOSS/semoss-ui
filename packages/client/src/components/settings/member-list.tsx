import { Plus, Search, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
	Avatar,
	AvatarFallback,
	Badge,
	Button,
	Card,
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
} from "@semoss/ui/next";
import type { SETTINGS_MEMBER } from "./settings.types";
import { useMembers } from "./use-members";
import { UserAddOverlay } from "./user-add-overlay";

export interface MemberListProps {
	/** id of the currently selected user */
	selectedUserId?: string;
	/** Called when a user is selected (or cleared, e.g. after delete) */
	onSelectUser: (user: SETTINGS_MEMBER | null) => void;
	/** Bump to force a refresh (e.g. after the access panel edits the user) */
	refreshKey?: number;
	/** When true (desktop with both panels), select the first user on load */
	autoSelectFirst?: boolean;
}

/**
 * Compact, searchable, paginated list of platform members (left pane of the
 * members tab). Selecting a row surfaces that user's access in the right pane.
 */
export const MemberList = ({
	selectedUserId,
	onSelectUser,
	refreshKey,
	autoSelectFirst,
}: MemberListProps) => {
	const {
		search,
		setSearch,
		users,
		isLoading,
		totalUsers,
		filteredUsers,
		hasSearch,
		page,
		totalPages,
		setPage,
		refresh,
		removeMember,
	} = useMembers();

	const [addOpen, setAddOpen] = useState(false);
	const [addUser, setAddUser] = useState<SETTINGS_MEMBER | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<SETTINGS_MEMBER | null>(
		null,
	);
	const [isDeleting, setIsDeleting] = useState(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: refresh on external signal only
	useEffect(() => {
		if (refreshKey) {
			refresh();
		}
	}, [refreshKey]);

	// On desktop (both panels visible) default to the first user so the right
	// pane isn't empty on load.
	useEffect(() => {
		if (autoSelectFirst && !selectedUserId && users.length > 0) {
			onSelectUser(users[0]);
		}
	}, [autoSelectFirst, selectedUserId, users, onSelectUser]);

	const memberLabel = totalUsers === 1 ? "member" : "members";

	const confirmDelete = async () => {
		if (!deleteTarget) {
			return;
		}
		setIsDeleting(true);
		const ok = await removeMember(deleteTarget);
		setIsDeleting(false);
		if (ok && deleteTarget.id === selectedUserId) {
			onSelectUser(null);
		}
		setDeleteTarget(null);
	};

	return (
		<Card className="flex h-full min-h-0 flex-col border border-border/60">
			<div className="flex flex-col gap-2 border-border/60 border-b p-3">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<div className="flex items-center gap-2">
						<span className="font-semibold text-sm">Members</span>
						<Badge variant="secondary" className="rounded-full">
							{hasSearch
								? `${filteredUsers} of ${totalUsers}`
								: `${totalUsers} ${memberLabel}`}
						</Badge>
					</div>
					<Button
						size="sm"
						onClick={() => {
							setAddUser(null);
							setAddOpen(true);
						}}
					>
						<Plus className="size-4" />
						Add
					</Button>
				</div>
				<InputGroup>
					<InputGroupAddon>
						<Search className="size-4" />
					</InputGroupAddon>
					<InputGroupInput
						placeholder="Search users"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
				</InputGroup>
			</div>

			<div className="min-h-0 flex-1 overflow-y-auto">
				{isLoading ? (
					<div className="flex h-40 items-center justify-center">
						<Spinner className="size-5" />
					</div>
				) : users.length === 0 ? (
					<div className="flex h-40 items-center justify-center text-muted-foreground text-sm">
						No members found
					</div>
				) : (
					users.map((user) => {
						const displayName = user.name || user.id || "Unknown";
						const isSelected = user.id === selectedUserId;
						return (
							<button
								key={user.id}
								type="button"
								data-state={isSelected ? "selected" : undefined}
								className={`flex w-full items-center gap-2.5 border-border/40 border-b px-3 py-2 text-start hover:bg-accent ${
									isSelected ? "bg-accent" : ""
								}`}
								onClick={() => onSelectUser(user)}
							>
								<Avatar className="size-8 shrink-0">
									<AvatarFallback>
										{displayName.charAt(0).toUpperCase()}
									</AvatarFallback>
								</Avatar>
								<div className="flex min-w-0 flex-1 flex-col leading-tight">
									<span className="flex min-w-0 items-center gap-1.5 font-medium text-sm">
										<span className="truncate">
											{displayName}
										</span>
										{user.type ? (
											<Badge
												variant="outline"
												className="shrink-0 rounded-full font-normal text-[10px]"
											>
												{user.type}
											</Badge>
										) : null}
										{user.admin ? (
											<span
												title="Admin"
												className="inline-flex shrink-0 text-primary"
											>
												<ShieldCheck
													className="size-4"
													aria-label="Admin"
												/>
											</span>
										) : null}
									</span>
									<span className="truncate text-muted-foreground text-xs">
										id: {user.id}
									</span>
									<span className="truncate text-muted-foreground text-xs">
										email: {user.email || "—"}
									</span>
								</div>
								<Button
									variant="ghost"
									size="icon-sm"
									aria-label={`Delete ${displayName}`}
									onClick={(e) => {
										e.stopPropagation();
										setDeleteTarget(user);
									}}
								>
									<Trash2 className="size-4" />
								</Button>
							</button>
						);
					})
				)}
			</div>

			{totalPages > 1 ? (
				<div className="flex items-center justify-between gap-2 border-border/60 border-t p-3">
					<Button
						variant="outline"
						size="sm"
						disabled={page === 0}
						onClick={() => setPage(Math.max(0, page - 1))}
					>
						Previous
					</Button>
					<span className="text-muted-foreground text-sm">
						{page + 1} of {totalPages}
					</span>
					<Button
						variant="outline"
						size="sm"
						disabled={page + 1 >= totalPages}
						onClick={() =>
							setPage(Math.min(totalPages - 1, page + 1))
						}
					>
						Next
					</Button>
				</div>
			) : null}

			<UserAddOverlay
				user={addUser}
				open={addOpen}
				onClose={(success) => {
					setAddOpen(false);
					setAddUser(null);
					if (success) {
						refresh();
					}
				}}
			/>

			<Dialog
				open={!!deleteTarget}
				onOpenChange={(open) => !open && setDeleteTarget(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete member</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete{" "}
							<span className="font-medium text-foreground">
								{deleteTarget?.name || deleteTarget?.id}
							</span>
							? This action cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDeleteTarget(null)}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={confirmDelete}
							disabled={isDeleting}
						>
							{isDeleting ? "Deleting..." : "Delete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Card>
	);
};
