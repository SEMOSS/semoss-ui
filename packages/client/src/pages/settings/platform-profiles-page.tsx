import { Pencil, Trash2, UserPlus } from "lucide-react";
import { useEffect, useId, useState } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	Separator,
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
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { useRootStore } from "@/hooks/";

interface PlatformProfile {
	profileId: string;
	profileName: string;
	description: string;
	userCount: number;
}

interface ProfileUser {
	userId: string;
	assignedBy: string;
	assignedAt: string;
}

const PLATFORM_FEATURES: { key: string; label: string }[] = [
	{ key: "nav.app-catalog", label: "App Catalog" },
	{ key: "nav.build", label: "Build" },
	{ key: "nav.skills", label: "Skills" },
	{ key: "nav.settings", label: "Settings" },
	{ key: "nav.engine", label: "Engines" },
];

function sanitizeForPixel(s: string): string {
	return s.replace(/[^a-zA-Z0-9 _\-.,!?]/g, "");
}

export const PlatformProfilesPage = () => {
	const { monolithStore } = useRootStore();
	const uid = useId();

	const [profiles, setProfiles] = useState<PlatformProfile[]>([]);
	const [selectedProfile, setSelectedProfile] =
		useState<PlatformProfile | null>(null);
	const [features, setFeatures] = useState<Record<string, boolean>>({});
	const [profileUsers, setProfileUsers] = useState<ProfileUser[]>([]);

	// Profile form state
	const [showProfileForm, setShowProfileForm] = useState(false);
	const [editingProfile, setEditingProfile] =
		useState<PlatformProfile | null>(null);
	const [profileFormName, setProfileFormName] = useState("");
	const [profileFormDesc, setProfileFormDesc] = useState("");
	const [savingProfile, setSavingProfile] = useState(false);

	// Assign user state
	const [showAssignUser, setShowAssignUser] = useState(false);
	const [assignUserId, setAssignUserId] = useState("");
	const [assigningUser, setAssigningUser] = useState(false);

	// Confirmation dialogs
	const [deleteTarget, setDeleteTarget] = useState<PlatformProfile | null>(
		null,
	);
	const [removeUserTarget, setRemoveUserTarget] = useState<string | null>(
		null,
	);
	const [confirmLoading, setConfirmLoading] = useState(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: loadProfiles is defined in component scope
	useEffect(() => {
		loadProfiles();
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: loader functions are defined in component scope
	useEffect(() => {
		if (selectedProfile) {
			loadProfileFeatures(selectedProfile.profileId);
			loadProfileUsers(selectedProfile.profileId);
		}
	}, [selectedProfile]);

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

	async function loadProfiles() {
		const result = await runPixel<PlatformProfile[]>(
			"GetPlatformProfiles();",
		);
		if (result) setProfiles(result);
	}

	async function loadProfileFeatures(profileId: string) {
		const result = await runPixel<Record<string, boolean>>(
			`GetPlatformFeatures(profileId="${profileId}");`,
		);
		if (result) setFeatures(result);
	}

	async function loadProfileUsers(profileId: string) {
		const result = await runPixel<ProfileUser[]>(
			`GetPlatformProfileUsers(profileId="${profileId}");`,
		);
		if (result) setProfileUsers(result);
	}

	function openNewProfileForm() {
		setEditingProfile(null);
		setProfileFormName("");
		setProfileFormDesc("");
		setShowProfileForm(true);
	}

	function openEditProfileForm(p: PlatformProfile, e: React.MouseEvent) {
		e.stopPropagation();
		setEditingProfile(p);
		setProfileFormName(p.profileName);
		setProfileFormDesc(p.description || "");
		setShowProfileForm(true);
	}

	async function handleSaveProfile() {
		const name = sanitizeForPixel(profileFormName.trim());
		if (!name) {
			toast.error("Profile name is required.");
			return;
		}
		const desc = sanitizeForPixel(profileFormDesc);
		setSavingProfile(true);
		try {
			if (editingProfile) {
				await runPixel(
					`UpdatePlatformProfile(profileId="${editingProfile.profileId}", name="${name}", description="${desc}");`,
				);
			} else {
				await runPixel(
					`CreatePlatformProfile(name="${name}", description="${desc}");`,
				);
			}
			await loadProfiles();
			setShowProfileForm(false);
			setEditingProfile(null);
		} finally {
			setSavingProfile(false);
		}
	}

	async function confirmDeleteProfile() {
		if (!deleteTarget) return;
		setConfirmLoading(true);
		try {
			await runPixel(
				`DeletePlatformProfile(profileId="${deleteTarget.profileId}");`,
			);
			await loadProfiles();
			if (selectedProfile?.profileId === deleteTarget.profileId) {
				setSelectedProfile(null);
			}
			setDeleteTarget(null);
		} finally {
			setConfirmLoading(false);
		}
	}

	async function handleToggleFeature(featureKey: string) {
		if (!selectedProfile) return;
		const current = features[featureKey] ?? false;
		await runPixel(
			`SetPlatformFeature(profileId="${selectedProfile.profileId}", featureKey="${featureKey}", enabled="${!current}");`,
		);
		await loadProfileFeatures(selectedProfile.profileId);
	}

	async function handleAssignUser() {
		if (!selectedProfile || !assignUserId.trim()) return;
		const safeUserId = sanitizeForPixel(assignUserId.trim());
		setAssigningUser(true);
		try {
			await runPixel(
				`AssignUserPlatformProfile(userId="${safeUserId}", profileId="${selectedProfile.profileId}");`,
			);
			await Promise.all([
				loadProfileUsers(selectedProfile.profileId),
				loadProfiles(),
			]);
			setShowAssignUser(false);
			setAssignUserId("");
		} finally {
			setAssigningUser(false);
		}
	}

	async function confirmRemoveUser() {
		if (!removeUserTarget) return;
		setConfirmLoading(true);
		try {
			await runPixel(
				`RemoveUserPlatformProfile(userId="${removeUserTarget}");`,
			);
			await Promise.all([
				selectedProfile
					? loadProfileUsers(selectedProfile.profileId)
					: Promise.resolve(),
				loadProfiles(),
			]);
			setRemoveUserTarget(null);
		} finally {
			setConfirmLoading(false);
		}
	}

	return (
		<div className="flex h-full gap-4 p-4">
			{/* Left panel */}
			<div className="flex w-72 flex-shrink-0 flex-col gap-2">
				<div className="flex items-center justify-between">
					<span className="font-semibold text-sm">
						Platform Profiles
					</span>
					<Button
						size="sm"
						variant="outline"
						onClick={openNewProfileForm}
					>
						New Profile
					</Button>
				</div>

				{showProfileForm && (
					<div className="flex flex-col gap-3 rounded-lg border bg-card p-3 shadow-sm">
						<p className="font-medium text-sm">
							{editingProfile ? "Edit Profile" : "New Profile"}
						</p>
						<div className="flex flex-col gap-1.5">
							<Label
								htmlFor={`${uid}-plat-profile-name`}
								className="text-xs"
							>
								Name <span className="text-destructive">*</span>
							</Label>
							<Input
								id={`${uid}-plat-profile-name`}
								placeholder="e.g. catalog-only"
								value={profileFormName}
								onChange={(e) =>
									setProfileFormName(e.target.value)
								}
								maxLength={100}
								autoFocus
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<Label
								htmlFor={`${uid}-plat-profile-desc`}
								className="text-xs"
							>
								Description
							</Label>
							<Input
								id={`${uid}-plat-profile-desc`}
								placeholder="Optional description"
								value={profileFormDesc}
								onChange={(e) =>
									setProfileFormDesc(e.target.value)
								}
							/>
						</div>
						<Separator />
						<div className="flex justify-end gap-2">
							<Button
								size="sm"
								variant="ghost"
								onClick={() => setShowProfileForm(false)}
							>
								Cancel
							</Button>
							<Button
								size="sm"
								onClick={handleSaveProfile}
								disabled={savingProfile}
							>
								{savingProfile ? "Saving…" : "Save"}
							</Button>
						</div>
					</div>
				)}

				{profiles.length === 0 && !showProfileForm && (
					<p className="text-muted-foreground text-sm">
						No platform profiles defined yet.
					</p>
				)}

				<div className="flex flex-col gap-1.5">
					{profiles.map((p) => (
						// biome-ignore lint/a11y/useSemanticElements: card contains nested interactive elements
						<div
							key={p.profileId}
							role="button"
							tabIndex={0}
							className={`cursor-pointer rounded-lg border p-3 transition-colors hover:bg-muted/50 ${selectedProfile?.profileId === p.profileId ? "border-primary bg-muted/30" : ""}`}
							onClick={() => setSelectedProfile(p)}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ")
									setSelectedProfile(p);
							}}
						>
							<div className="flex items-start justify-between gap-2">
								<div className="flex min-w-0 flex-col gap-1">
									<span className="truncate font-medium text-sm">
										{p.profileName}
									</span>
									{p.description && (
										<p className="truncate text-muted-foreground text-xs">
											{p.description}
										</p>
									)}
									<span className="text-muted-foreground text-xs">
										{p.userCount}{" "}
										{p.userCount === 1 ? "user" : "users"}
									</span>
								</div>
								<div className="flex shrink-0 items-center gap-0.5">
									<Button
										size="icon"
										variant="ghost"
										className="size-6"
										title="Edit profile"
										onClick={(e) =>
											openEditProfileForm(p, e)
										}
									>
										<Pencil className="size-3.5" />
									</Button>
									<Tooltip>
										<TooltipTrigger asChild>
											<span>
												<Button
													size="icon"
													variant="ghost"
													className="size-6 text-muted-foreground hover:text-destructive disabled:pointer-events-none"
													disabled={p.userCount > 0}
													onClick={(e) => {
														e.stopPropagation();
														setDeleteTarget(p);
													}}
												>
													<Trash2 className="size-3.5" />
												</Button>
											</span>
										</TooltipTrigger>
										{p.userCount > 0 && (
											<TooltipContent>
												{p.userCount}{" "}
												{p.userCount === 1
													? "user"
													: "users"}{" "}
												assigned — reassign first
											</TooltipContent>
										)}
									</Tooltip>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Right panel */}
			{selectedProfile ? (
				<div className="flex flex-1 flex-col gap-3 overflow-hidden">
					<div className="flex items-center border-b pb-2">
						<h3 className="font-semibold">
							{selectedProfile.profileName}
						</h3>
					</div>

					<Tabs
						defaultValue="features"
						className="flex flex-1 flex-col gap-3 overflow-hidden"
					>
						<TabsList className="w-fit">
							<TabsTrigger value="features">
								Platform Features
							</TabsTrigger>
							<TabsTrigger value="members">Members</TabsTrigger>
						</TabsList>

						<TabsContent
							value="features"
							className="flex flex-col gap-2 overflow-auto"
						>
							<p className="text-muted-foreground text-sm">
								Toggle which platform navigation items are
								visible to users assigned to this profile.
							</p>
							<div className="flex flex-col gap-1.5">
								{PLATFORM_FEATURES.map((f) => (
									<div
										key={f.key}
										className="flex items-center justify-between rounded-lg border px-3 py-2.5"
									>
										<span className="text-sm">
											{f.label}
										</span>
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

						<TabsContent
							value="members"
							className="flex flex-col gap-2 overflow-auto"
						>
							<div className="flex items-center justify-between">
								<p className="text-muted-foreground text-sm">
									Users assigned to this platform profile.
								</p>
								<Button
									size="sm"
									variant="outline"
									onClick={() => setShowAssignUser(true)}
								>
									<UserPlus className="mr-1.5 size-3.5" />
									Assign User
								</Button>
							</div>

							{showAssignUser && (
								<div className="flex flex-col gap-3 rounded-lg border bg-card p-3 shadow-sm">
									<p className="font-medium text-sm">
										Assign User
									</p>
									<div className="flex flex-col gap-1.5">
										<Label
											htmlFor={`${uid}-plat-assign-uid`}
											className="text-xs"
										>
											User ID{" "}
											<span className="text-destructive">
												*
											</span>
										</Label>
										<Input
											id={`${uid}-plat-assign-uid`}
											placeholder="Enter user ID"
											value={assignUserId}
											onChange={(e) =>
												setAssignUserId(e.target.value)
											}
											autoFocus
										/>
									</div>
									<Separator />
									<div className="flex justify-end gap-2">
										<Button
											size="sm"
											variant="ghost"
											onClick={() => {
												setShowAssignUser(false);
												setAssignUserId("");
											}}
										>
											Cancel
										</Button>
										<Button
											size="sm"
											onClick={handleAssignUser}
											disabled={
												assigningUser ||
												!assignUserId.trim()
											}
										>
											{assigningUser
												? "Assigning…"
												: "Assign"}
										</Button>
									</div>
								</div>
							)}

							{profileUsers.length === 0 ? (
								<p className="text-muted-foreground text-sm">
									No users assigned to this platform profile.
								</p>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>User ID</TableHead>
											<TableHead>Assigned By</TableHead>
											<TableHead>Assigned At</TableHead>
											<TableHead className="w-16" />
										</TableRow>
									</TableHeader>
									<TableBody>
										{profileUsers.map((u) => (
											<TableRow key={u.userId}>
												<TableCell className="font-mono text-sm">
													{u.userId}
												</TableCell>
												<TableCell className="text-muted-foreground">
													{u.assignedBy ?? "—"}
												</TableCell>
												<TableCell className="text-muted-foreground">
													{u.assignedAt
														? new Date(
																u.assignedAt,
															).toLocaleDateString()
														: "—"}
												</TableCell>
												<TableCell>
													<Button
														size="sm"
														variant="ghost"
														className="text-destructive hover:text-destructive"
														onClick={() =>
															setRemoveUserTarget(
																u.userId,
															)
														}
													>
														Remove
													</Button>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
						</TabsContent>
					</Tabs>
				</div>
			) : (
				<div className="flex flex-1 items-center justify-center">
					<p className="text-muted-foreground text-sm">
						Select a platform profile to view details.
					</p>
				</div>
			)}

			{/* Delete profile confirmation */}
			<Dialog
				open={!!deleteTarget}
				onOpenChange={(open) => !open && setDeleteTarget(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Platform Profile</DialogTitle>
						<DialogDescription>
							Delete profile &quot;{deleteTarget?.profileName}
							&quot;? This cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="ghost"
							onClick={() => setDeleteTarget(null)}
							disabled={confirmLoading}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={confirmDeleteProfile}
							disabled={confirmLoading}
						>
							{confirmLoading ? "Deleting…" : "Delete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Remove user confirmation */}
			<Dialog
				open={!!removeUserTarget}
				onOpenChange={(open) => !open && setRemoveUserTarget(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Remove User</DialogTitle>
						<DialogDescription>
							Remove user &quot;{removeUserTarget}&quot; from this
							platform profile? They will be unrestricted (all nav
							items visible).
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
						>
							{confirmLoading ? "Removing…" : "Remove"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};
