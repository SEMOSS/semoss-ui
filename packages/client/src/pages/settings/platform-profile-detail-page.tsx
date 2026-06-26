import { Pencil, Search, Trash2, UserPlus, X } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useId, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useDebouncedValue } from "@semoss/sdk/react";
import {
	Avatar,
	AvatarFallback,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Label,
	Muted,
	Switch,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	Textarea,
	toast,
} from "@semoss/ui/next";
import { type AdminUser, searchAllUsers } from "@/api/auth";
import { useRootStore } from "@/hooks/";
import { useNavigate } from "@/hooks/useNavigate";
import { PLATFORM_FEATURES } from "./settings.constants";

interface PlatformProfile {
	profileId: string;
	profileName: string;
	description: string;
	userCount: number;
}

interface ProfileUser {
	userId: string;
	name: string | null;
	email: string | null;
	assignedBy: string;
	assignedAt: string;
}

const escapePixelString = (s: string) => s.replaceAll("'", "\\'");

export const PlatformProfileDetailPage = observer(() => {
	const { profileId } = useParams<{ profileId: string }>();
	const navigate = useNavigate();
	const { monolithStore } = useRootStore();
	const uid = useId();

	const [profile, setProfile] = useState<PlatformProfile | null>(null);
	const [loadError, setLoadError] = useState(false);
	const [features, setFeatures] = useState<Record<string, boolean>>({});
	const [profileUsers, setProfileUsers] = useState<ProfileUser[]>([]);

	// Edit state
	const [showEditDialog, setShowEditDialog] = useState(false);
	const [editName, setEditName] = useState("");
	const [editDesc, setEditDesc] = useState("");
	const [savingProfile, setSavingProfile] = useState(false);

	// Member search
	const [memberSearch, setMemberSearch] = useState("");

	// Assign users modal
	const [showAssignModal, setShowAssignModal] = useState(false);
	const [selectedUsers, setSelectedUsers] = useState<AdminUser[]>([]);
	const [assignSearch, setAssignSearch] = useState("");
	const [assignResults, setAssignResults] = useState<AdminUser[]>([]);
	const [assignSearching, setAssignSearching] = useState(false);
	const [assigningUsers, setAssigningUsers] = useState(false);
	const assignFetchVersionRef = useRef(0);
	const debouncedAssignSearch = useDebouncedValue(assignSearch, 300);

	// Confirmations
	const [removeUserTarget, setRemoveUserTarget] =
		useState<ProfileUser | null>(null);
	const [confirmLoading, setConfirmLoading] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: profileId
	useEffect(() => {
		if (profileId) {
			loadProfile();
			loadFeatures();
			loadUsers();
		}
	}, [profileId]);

	async function runPixel<T = unknown>(pixel: string): Promise<T | null> {
		const response = await monolithStore.runQuery(pixel);
		const { operationType, output } = response.pixelReturn[0];
		if (operationType.indexOf("ERROR") > -1) {
			toast.error(
				typeof output === "string" ? output : "Operation failed.",
			);
			return null;
		}
		return output as T;
	}

	async function loadProfile() {
		const result = await runPixel<PlatformProfile[]>(
			"GetPlatformProfiles();",
		);
		if (result) {
			const found = result.find((p) => p.profileId === profileId) ?? null;
			if (found) {
				setProfile(found);
				setEditName(found.profileName);
				setEditDesc(found.description || "");
			} else {
				setLoadError(true);
			}
		} else {
			setLoadError(true);
		}
	}

	async function loadFeatures() {
		const result = await runPixel<Record<string, boolean>>(
			`GetPlatformFeatures(profileId="${profileId}");`,
		);
		if (result) setFeatures(result);
	}

	async function loadUsers() {
		const result = await runPixel<ProfileUser[]>(
			`GetPlatformProfileUsers(profileId="${profileId}");`,
		);
		if (result) setProfileUsers(result);
	}

	async function handleSaveProfile() {
		const name = escapePixelString(editName.trim());
		if (!name) {
			toast.error("Name is required.");
			return;
		}
		const desc = escapePixelString(editDesc);
		setSavingProfile(true);
		try {
			await runPixel(
				`UpdatePlatformProfile(profileId="${profileId}", name="${name}", description="${desc}");`,
			);
			await loadProfile();
			toast.success("Profile updated.");
			setShowEditDialog(false);
		} finally {
			setSavingProfile(false);
		}
	}

	async function handleToggleFeature(featureKey: string) {
		const current = features[featureKey] ?? false;
		await runPixel(
			`SetPlatformFeature(profileId="${profileId}", featureKey="${featureKey}", enabled="${!current}");`,
		);
		await loadFeatures();
	}

	useEffect(() => {
		if (!showAssignModal) return;
		const version = ++assignFetchVersionRef.current;
		setAssignSearching(true);
		const excludeIds = new Set(profileUsers.map((u) => u.userId));
		searchAllUsers(debouncedAssignSearch, 20, 0)
			.then((results) => {
				if (assignFetchVersionRef.current !== version) return;
				setAssignResults(results.filter((u) => !excludeIds.has(u.id)));
			})
			.catch(() => {
				if (assignFetchVersionRef.current === version)
					setAssignResults([]);
			})
			.finally(() => {
				if (assignFetchVersionRef.current === version)
					setAssignSearching(false);
			});
	}, [showAssignModal, debouncedAssignSearch, profileUsers]);

	function toggleUserSelected(user: AdminUser) {
		setSelectedUsers((prev) =>
			prev.find((u) => u.id === user.id)
				? prev.filter((u) => u.id !== user.id)
				: [...prev, user],
		);
	}

	function closeAssignModal() {
		setShowAssignModal(false);
		setSelectedUsers([]);
		setAssignSearch("");
		setAssignResults([]);
	}

	async function handleAssignUsers() {
		if (selectedUsers.length === 0) return;
		setAssigningUsers(true);
		try {
			const userList = selectedUsers
				.map((u) => `"${escapePixelString(u.id)}"`)
				.join(", ");
			await runPixel(
				`AssignUserPlatformProfile(userId=[${userList}], profileId="${profileId}");`,
			);
			await Promise.all([loadUsers(), loadProfile()]);
			closeAssignModal();
		} finally {
			setAssigningUsers(false);
		}
	}

	async function confirmRemoveUser() {
		if (!removeUserTarget) return;
		setConfirmLoading(true);
		try {
			await runPixel(
				`RemoveUserPlatformProfile(userId="${removeUserTarget.userId}");`,
			);
			await Promise.all([loadUsers(), loadProfile()]);
			setRemoveUserTarget(null);
		} finally {
			setConfirmLoading(false);
		}
	}

	async function handleDeleteProfile() {
		if (!profile) return;
		setConfirmLoading(true);
		try {
			await runPixel(`DeletePlatformProfile(profileId="${profileId}");`);
			navigate("../platform-profiles");
		} finally {
			setConfirmLoading(false);
		}
	}

	const filteredMembers = memberSearch.trim()
		? profileUsers.filter((u) => {
				const term = memberSearch.trim().toLowerCase();
				return (
					(u.name || u.userId).toLowerCase().includes(term) ||
					(u.email || "").toLowerCase().includes(term)
				);
			})
		: profileUsers;

	if (!profile) {
		if (loadError) {
			return (
				<div className="flex h-full flex-col items-center justify-center gap-2">
					<p className="font-medium text-sm">Profile not found.</p>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => navigate("../platform-profiles")}
					>
						Back to Platform Profiles
					</Button>
				</div>
			);
		}
		return (
			<div className="flex h-full items-center justify-center">
				<p className="text-muted-foreground text-sm">
					Loading profile…
				</p>
			</div>
		);
	}

	return (
		<div className="flex w-full flex-col gap-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex flex-col gap-1">
					<h2 className="font-semibold text-xl">
						{profile.profileName}
					</h2>
					{profile.description && (
						<p className="text-muted-foreground text-sm">
							{profile.description}
						</p>
					)}
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						className="gap-1.5"
						onClick={() => {
							setEditName(profile.profileName);
							setEditDesc(profile.description || "");
							setShowEditDialog(true);
						}}
						data-testid="edit-profile-btn"
					>
						<Pencil className="size-3.5" />
						Edit
					</Button>
					<Button
						variant="ghost"
						size="sm"
						className="gap-1.5 text-destructive hover:text-destructive"
						data-testid="delete-profile-btn"
						onClick={() => setShowDeleteDialog(true)}
					>
						<Trash2 className="size-4" />
						Delete
					</Button>
				</div>
			</div>

			<Tabs defaultValue="features" className="flex flex-col gap-4">
				<TabsList className="w-fit">
					<TabsTrigger value="features">Features</TabsTrigger>
					<TabsTrigger value="members">
						Members
						{profile.userCount > 0 && (
							<span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">
								{profile.userCount}
							</span>
						)}
					</TabsTrigger>
				</TabsList>

				{/* ── Features tab ─────────────────────────────────────────────── */}
				<TabsContent value="features" className="flex flex-col gap-4">
					<div className="flex flex-col gap-1">
						<p className="font-medium text-sm">
							Platform Navigation Access
						</p>
						<p className="text-muted-foreground text-sm">
							Toggle which top-level navigation sections users
							assigned to this profile can see. Disabled sections
							are hidden from the sidebar entirely — users cannot
							navigate to them.
						</p>
					</div>
					<div className="flex flex-col gap-2">
						{PLATFORM_FEATURES.map((f) => (
							<div
								key={f.key}
								className="flex items-center justify-between rounded-lg border px-4 py-3"
							>
								<div className="flex flex-col gap-0.5">
									<span className="font-medium text-sm">
										{f.label}
									</span>
									<span className="text-muted-foreground text-xs">
										{f.description}
									</span>
									<span className="font-mono text-muted-foreground/60 text-xs">
										{f.key}
									</span>
								</div>
								<Switch
									checked={features[f.key] ?? false}
									onCheckedChange={() =>
										handleToggleFeature(f.key)
									}
								/>
							</div>
						))}
					</div>
				</TabsContent>

				{/* ── Members tab ───────────────────────────────────────────────── */}
				<TabsContent value="members">
					<div className="w-full rounded-xl border">
						{/* Header — matches MembersTable style */}
						<div className="flex flex-column gap-[10px] rounded-xl rounded-ee-none rounded-es-none border-gray-200 border-b bg-muted p-4 align-start">
							<div className="flex h-[36px] w-full flex-column gap-2">
								<InputGroup className="flex h-auto gap-1 self-stretch bg-background px-2 py-1 align-center">
									<InputGroupInput
										placeholder="Search members"
										value={memberSearch}
										onChange={(
											e: React.ChangeEvent<HTMLInputElement>,
										) => setMemberSearch(e.target.value)}
									/>
									<InputGroupAddon>
										<Search className="size-4" />
									</InputGroupAddon>
								</InputGroup>
								<Button
									type="button"
									size="sm"
									className="flex h-auto flex-column gap-2 align-center"
									onClick={() => setShowAssignModal(true)}
									data-testid="assign-platform-user-btn"
								>
									<div className="flex flex-column items-center gap-2">
										<UserPlus className="size-4" />
										<span>Assign User</span>
									</div>
								</Button>
							</div>
						</div>

						{/* Scrollable table */}
						<div className="max-h-[400px] overflow-y-auto">
							<Table>
								<TableHeader className="sticky top-0 z-10 bg-background">
									<TableRow>
										<TableHead>Name</TableHead>
										<TableHead>Assigned By</TableHead>
										<TableHead>Assigned Date</TableHead>
										<TableHead className="w-px whitespace-nowrap">
											Actions
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredMembers.length > 0 ? (
										filteredMembers.map((u) => {
											const displayName =
												u.name || u.userId;
											return (
												<TableRow key={u.userId}>
													<TableCell>
														<div className="flex items-center gap-2">
															<Avatar className="items-center justify-center bg-[#ECEDEF] text-gray-500">
																<AvatarFallback className="bg-[#ECEDEF] text-gray-500">
																	{displayName
																		.charAt(
																			0,
																		)
																		.toUpperCase()}
																</AvatarFallback>
															</Avatar>
															<span className="flex flex-col overflow-hidden">
																<span className="font-semibold text-accent-foreground text-sm">
																	{
																		displayName
																	}
																</span>
																<span className="text-muted-foreground text-xs">
																	id:{" "}
																	{u.userId}
																</span>
																{u.email && (
																	<span className="text-muted-foreground text-xs">
																		email:{" "}
																		{
																			u.email
																		}
																	</span>
																)}
															</span>
														</div>
													</TableCell>
													<TableCell className="text-sm">
														{u.assignedBy ?? "—"}
													</TableCell>
													<TableCell className="text-muted-foreground text-sm">
														{u.assignedAt
															? new Date(
																	u.assignedAt,
																).toLocaleDateString()
															: "—"}
													</TableCell>
													<TableCell>
														<Button
															type="button"
															variant="outline"
															size="icon-sm"
															className="border-none"
															data-testid={`remove-user-${u.userId}-btn`}
															onClick={() =>
																setRemoveUserTarget(
																	u,
																)
															}
														>
															<Trash2 className="h-4 w-4" />
														</Button>
													</TableCell>
												</TableRow>
											);
										})
									) : (
										<TableRow>
											<TableCell
												colSpan={4}
												className="text-center"
											>
												{memberSearch ? (
													`No members match "${memberSearch}"`
												) : (
													<Muted>
														No members assigned yet.
													</Muted>
												)}
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						</div>

						{/* Count footer */}
						<p className="mt-2 px-4 pb-3 text-end text-muted-foreground text-sm">
							{filteredMembers.length} of {profileUsers.length}{" "}
							{profileUsers.length === 1 ? "member" : "members"}
						</p>
					</div>
				</TabsContent>
			</Tabs>

			{/* ── Edit Profile modal ─────────────────────────────────────────── */}
			<Dialog
				open={showEditDialog}
				onOpenChange={(open) => !open && setShowEditDialog(false)}
			>
				<DialogContent
					className="max-w-[480px] gap-6 rounded-xl"
					showCloseButton={false}
				>
					<DialogHeader>
						<div className="flex items-center justify-between">
							<DialogTitle>Edit Profile</DialogTitle>
							<Button
								variant="ghost"
								size="icon-sm"
								onClick={() => setShowEditDialog(false)}
								className="hover:bg-accent"
							>
								<X className="size-4" />
							</Button>
						</div>
					</DialogHeader>
					<div className="flex flex-col gap-4 pb-2">
						<div className="flex flex-col gap-1.5">
							<Label htmlFor={`${uid}-name`}>
								Name <span className="text-destructive">*</span>
							</Label>
							<Input
								id={`${uid}-name`}
								value={editName}
								onChange={(e) => setEditName(e.target.value)}
								maxLength={100}
								autoFocus
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<Label htmlFor={`${uid}-desc`}>Description</Label>
							<Textarea
								id={`${uid}-desc`}
								value={editDesc}
								onChange={(e) => setEditDesc(e.target.value)}
								rows={3}
								className="max-h-[120px] resize-none"
							/>
						</div>
					</div>
					<DialogFooter>
						<div className="flex flex-row gap-2">
							<Button
								variant="ghost"
								onClick={() => setShowEditDialog(false)}
								disabled={savingProfile}
							>
								Cancel
							</Button>
							<Button
								onClick={handleSaveProfile}
								disabled={savingProfile || !editName.trim()}
								data-testid="save-profile-changes-btn"
							>
								{savingProfile ? "Saving…" : "Save Changes"}
							</Button>
						</div>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ── Assign Users modal ─────────────────────────────────────────── */}
			<Dialog
				open={showAssignModal}
				onOpenChange={(open) => !open && closeAssignModal()}
			>
				<DialogContent className="flex max-h-[90vh] w-full max-w-2xl flex-col gap-4 overflow-hidden">
					<DialogHeader>
						<DialogTitle>Assign Users</DialogTitle>
						<DialogDescription>
							Search for users to assign to{" "}
							<span className="font-medium text-foreground">
								{profile.profileName}
							</span>
							.
						</DialogDescription>
					</DialogHeader>

					{/* Search input */}
					<input
						className="h-10 w-full shrink-0 rounded border bg-background px-3 text-sm outline-none ring-primary placeholder:text-muted-foreground focus:ring-2"
						placeholder="Search by name or email..."
						value={assignSearch}
						autoComplete="off"
						autoCorrect="off"
						autoCapitalize="off"
						spellCheck={false}
						onChange={(e) => setAssignSearch(e.target.value)}
					/>

					{/* Scrollable middle */}
					<div className="flex flex-1 flex-col gap-4 overflow-y-auto">
						{/* Results */}
						<div className="max-h-56 min-h-32 w-full shrink-0 overflow-y-auto rounded-md border bg-background">
							{assignResults.length > 0 ? (
								assignResults.map((item) => {
									const isAdded = selectedUsers.some(
										(u) => u.id === item.id,
									);
									return (
										<button
											key={item.id}
											type="button"
											className="flex w-full items-center justify-between px-3 py-2 text-start text-sm hover:bg-accent"
											onClick={() =>
												toggleUserSelected(item)
											}
										>
											<span className="flex items-center gap-2">
												<Avatar className="h-7 w-7 items-center justify-center bg-muted text-muted-foreground text-xs">
													<AvatarFallback>
														{(item.name || item.id)
															.charAt(0)
															.toUpperCase()}
													</AvatarFallback>
												</Avatar>
												<span className="flex flex-col">
													<span className="font-medium">
														{item.name ||
															item.username ||
															item.id}
													</span>
													<span className="text-muted-foreground text-xs">
														id: {item.id}
													</span>
													{item.email && (
														<span className="text-muted-foreground text-xs">
															email: {item.email}
														</span>
													)}
												</span>
											</span>
											{isAdded && (
												<span className="font-medium text-primary text-xs">
													Added ✓
												</span>
											)}
										</button>
									);
								})
							) : (
								<div className="px-3 py-4 text-center text-muted-foreground text-sm">
									{assignSearching
										? "Searching…"
										: "No users found"}
								</div>
							)}
						</div>

						{/* Selected users */}
						<div className="flex flex-col gap-2">
							<span className="font-medium text-muted-foreground text-sm">
								{selectedUsers.length} user
								{selectedUsers.length !== 1 ? "s" : ""} selected
							</span>
							<div className="flex flex-col gap-1.5">
								{selectedUsers.map((u) => (
									<div
										key={u.id}
										className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2"
									>
										<span className="flex items-center gap-2">
											<Avatar className="h-8 w-8 items-center justify-center bg-muted text-muted-foreground text-sm">
												<AvatarFallback>
													{(u.name || u.id)
														.charAt(0)
														.toUpperCase()}
												</AvatarFallback>
											</Avatar>
											<span className="flex flex-col">
												<span className="font-medium text-sm">
													{u.name ||
														u.username ||
														u.id}
												</span>
												<span className="text-muted-foreground text-xs">
													id: {u.id}
												</span>
												{u.email && (
													<span className="text-muted-foreground text-xs">
														email: {u.email}
													</span>
												)}
											</span>
										</span>
										<button
											type="button"
											className="text-muted-foreground hover:text-destructive"
											onClick={() =>
												toggleUserSelected(u)
											}
										>
											<X className="h-4 w-4" />
										</button>
									</div>
								))}
							</div>
						</div>
					</div>

					{/* Footer */}
					<div className="flex items-center justify-end gap-2 border-t pt-3">
						<Button
							variant="ghost"
							onClick={closeAssignModal}
							disabled={assigningUsers}
						>
							Cancel
						</Button>
						<Button
							onClick={handleAssignUsers}
							disabled={
								assigningUsers || selectedUsers.length === 0
							}
						>
							{assigningUsers
								? "Assigning…"
								: `Assign${selectedUsers.length > 0 ? ` (${selectedUsers.length})` : ""}`}
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* ── Remove user confirmation ───────────────────────────────────── */}
			<Dialog
				open={!!removeUserTarget}
				onOpenChange={(open) => !open && setRemoveUserTarget(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Remove User</DialogTitle>
						<DialogDescription>
							Remove &quot;
							{removeUserTarget?.name || removeUserTarget?.userId}
							&quot; from this profile? They will see all
							navigation sections (fail-open).
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="ghost"
							onClick={() => setRemoveUserTarget(null)}
							disabled={confirmLoading}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={confirmRemoveUser}
							disabled={confirmLoading}
							data-testid="confirm-remove-user-btn"
						>
							{confirmLoading ? "Removing…" : "Remove"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ── Delete profile confirmation ────────────────────────────────── */}
			<Dialog
				open={showDeleteDialog}
				onOpenChange={(open) => !open && setShowDeleteDialog(false)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Profile</DialogTitle>
						<DialogDescription>
							Delete &quot;{profile.profileName}&quot;?
							{profile.userCount > 0 && (
								<>
									{" "}
									This profile has{" "}
									<span className="font-medium text-foreground">
										{profile.userCount}{" "}
										{profile.userCount === 1
											? "user"
											: "users"}
									</span>{" "}
									assigned — they will revert to seeing all
									navigation sections.
								</>
							)}{" "}
							This cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="ghost"
							onClick={() => setShowDeleteDialog(false)}
							disabled={confirmLoading}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleDeleteProfile}
							disabled={confirmLoading}
							data-testid="confirm-delete-profile-btn"
						>
							{confirmLoading ? "Deleting…" : "Delete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
});
