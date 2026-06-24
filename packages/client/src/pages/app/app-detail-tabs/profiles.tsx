import { Pencil, Trash2, UserPlus } from "lucide-react";
import { useEffect, useId, useState } from "react";
import {
	Badge,
	Button,
	Checkbox,
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

interface Profile {
	profileId: string;
	profileName: string;
	description: string;
	isDefault: boolean;
	userCount: number;
}

interface Feature {
	featureId: string;
	featureKey: string;
	description: string;
	enabled: boolean;
}

interface ProfileUser {
	userId: string;
	assignedBy: string;
	assignedAt: string;
}

interface AppProfilesProps {
	appId: string;
	permission: string;
}

function sanitizeForPixel(s: string): string {
	return s.replace(/[^a-zA-Z0-9 _\-.,!?]/g, "");
}

function validateFeatureKey(key: string): boolean {
	return /^[a-zA-Z0-9-]+$/.test(key) && key.length <= 100;
}

export const AppProfiles = ({ appId }: AppProfilesProps) => {
	const { monolithStore } = useRootStore();
	const uid = useId();

	const [profiles, setProfiles] = useState<Profile[]>([]);
	const [selectedProfile, setSelectedProfile] = useState<Profile | null>(
		null,
	);
	const [features, setFeatures] = useState<Feature[]>([]);
	const [profileUsers, setProfileUsers] = useState<ProfileUser[]>([]);

	// Profile form state
	const [showProfileForm, setShowProfileForm] = useState(false);
	const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
	const [profileFormName, setProfileFormName] = useState("");
	const [profileFormDesc, setProfileFormDesc] = useState("");
	const [profileFormDefault, setProfileFormDefault] = useState(false);
	const [savingProfile, setSavingProfile] = useState(false);

	// Feature form state
	const [showFeatureForm, setShowFeatureForm] = useState(false);
	const [featureFormKey, setFeatureFormKey] = useState("");
	const [featureFormDesc, setFeatureFormDesc] = useState("");
	const [featureKeyError, setFeatureKeyError] = useState("");
	const [savingFeature, setSavingFeature] = useState(false);

	// Assign user state
	const [showAssignUser, setShowAssignUser] = useState(false);
	const [assignUserId, setAssignUserId] = useState("");
	const [assigningUser, setAssigningUser] = useState(false);

	// Confirmation dialogs
	const [deleteProfileTarget, setDeleteProfileTarget] =
		useState<Profile | null>(null);
	const [removeUserTarget, setRemoveUserTarget] = useState<string | null>(
		null,
	);
	const [confirmLoading, setConfirmLoading] = useState(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: loadProfiles is defined in component scope
	useEffect(() => {
		loadProfiles();
	}, [appId]);

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
		const result = await runPixel<Profile[]>(
			`GetAppProfiles(app="${appId}");`,
		);
		if (result) setProfiles(result);
	}

	async function loadProfileFeatures(profileId: string) {
		const result = await runPixel<Feature[]>(
			`GetProfileFeatures(app="${appId}", profileId="${profileId}");`,
		);
		if (result) setFeatures(result);
	}

	async function loadProfileUsers(profileId: string) {
		const result = await runPixel<ProfileUser[]>(
			`GetProfileUsers(app="${appId}", profileId="${profileId}");`,
		);
		if (result) setProfileUsers(result);
	}

	function openNewProfileForm() {
		setEditingProfile(null);
		setProfileFormName("");
		setProfileFormDesc("");
		setProfileFormDefault(false);
		setShowProfileForm(true);
	}

	function openEditProfileForm(p: Profile, e: React.MouseEvent) {
		e.stopPropagation();
		setEditingProfile(p);
		setProfileFormName(p.profileName);
		setProfileFormDesc(p.description || "");
		setProfileFormDefault(p.isDefault);
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
					`UpdateAppProfile(app="${appId}", profileId="${editingProfile.profileId}", name="${name}", description="${desc}", isDefault="${profileFormDefault}");`,
				);
			} else {
				await runPixel(
					`CreateAppProfile(app="${appId}", name="${name}", description="${desc}", isDefault="${profileFormDefault}");`,
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
		if (!deleteProfileTarget) return;
		setConfirmLoading(true);
		try {
			await runPixel(
				`DeleteAppProfile(app="${appId}", profileId="${deleteProfileTarget.profileId}");`,
			);
			await loadProfiles();
			if (selectedProfile?.profileId === deleteProfileTarget.profileId) {
				setSelectedProfile(null);
			}
			setDeleteProfileTarget(null);
		} finally {
			setConfirmLoading(false);
		}
	}

	async function handleToggleFeature(feature: Feature) {
		if (!selectedProfile) return;
		await runPixel(
			`SetProfileFeature(app="${appId}", profileId="${selectedProfile.profileId}", featureId="${feature.featureId}", enabled="${!feature.enabled}");`,
		);
		await loadProfileFeatures(selectedProfile.profileId);
	}

	async function handleAddFeature() {
		if (!validateFeatureKey(featureFormKey)) {
			setFeatureKeyError("Alphanumeric + hyphens only, max 100 chars.");
			return;
		}
		setFeatureKeyError("");
		setSavingFeature(true);
		try {
			const desc = sanitizeForPixel(featureFormDesc);
			await runPixel(
				`CreateAppFeature(app="${appId}", key="${featureFormKey}", description="${desc}");`,
			);
			if (selectedProfile)
				await loadProfileFeatures(selectedProfile.profileId);
			setShowFeatureForm(false);
			setFeatureFormKey("");
			setFeatureFormDesc("");
		} finally {
			setSavingFeature(false);
		}
	}

	async function handleAssignUser() {
		if (!selectedProfile || !assignUserId.trim()) return;
		const safeUserId = sanitizeForPixel(assignUserId.trim());
		setAssigningUser(true);
		try {
			await runPixel(
				`AssignUserProfile(app="${appId}", userId="${safeUserId}", profileId="${selectedProfile.profileId}");`,
			);
			await loadProfileUsers(selectedProfile.profileId);
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
				`RemoveUserProfile(app="${appId}", userId="${removeUserTarget}");`,
			);
			if (selectedProfile)
				await loadProfileUsers(selectedProfile.profileId);
			setRemoveUserTarget(null);
		} finally {
			setConfirmLoading(false);
		}
	}

	return (
		<div className="flex h-full gap-4 p-1">
			{/* Left panel — Profile list */}
			<div className="flex w-72 flex-shrink-0 flex-col gap-2">
				<div className="flex items-center justify-between">
					<span className="font-semibold text-sm">Profiles</span>
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
								htmlFor={`${uid}-profile-name`}
								className="text-xs"
							>
								Name <span className="text-destructive">*</span>
							</Label>
							<Input
								id={`${uid}-profile-name`}
								placeholder="e.g. beta, power-user"
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
								htmlFor={`${uid}-profile-desc`}
								className="text-xs"
							>
								Description
							</Label>
							<Input
								id={`${uid}-profile-desc`}
								placeholder="Optional description"
								value={profileFormDesc}
								onChange={(e) =>
									setProfileFormDesc(e.target.value)
								}
							/>
						</div>
						<div className="flex items-center gap-2">
							<Checkbox
								id={`${uid}-profile-default`}
								checked={profileFormDefault}
								onCheckedChange={(v) =>
									setProfileFormDefault(v === true)
								}
							/>
							<Label
								htmlFor={`${uid}-profile-default`}
								className="cursor-pointer text-xs"
							>
								Set as default profile
							</Label>
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
						No profiles defined yet.
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
									<div className="flex items-center gap-1.5">
										<span className="truncate font-medium text-sm">
											{p.profileName}
										</span>
										{p.isDefault && (
											<Badge
												variant="secondary"
												className="text-xs"
											>
												Default
											</Badge>
										)}
									</div>
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
														setDeleteProfileTarget(
															p,
														);
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

			{/* Right panel — Profile detail */}
			{selectedProfile ? (
				<div className="flex flex-1 flex-col gap-3 overflow-hidden">
					<div className="flex items-center justify-between border-b pb-2">
						<div className="flex items-center gap-2">
							<h3 className="font-semibold">
								{selectedProfile.profileName}
							</h3>
							{selectedProfile.isDefault && (
								<Badge variant="secondary">Default</Badge>
							)}
						</div>
					</div>

					<Tabs
						defaultValue="features"
						className="flex flex-1 flex-col gap-3 overflow-hidden"
					>
						<TabsList className="w-fit">
							<TabsTrigger value="features">Features</TabsTrigger>
							<TabsTrigger value="members">Members</TabsTrigger>
						</TabsList>

						<TabsContent
							value="features"
							className="flex flex-col gap-2 overflow-auto"
						>
							<div className="flex items-center justify-between">
								<p className="text-muted-foreground text-sm">
									Toggle which features are enabled for this
									profile.
								</p>
								<Button
									size="sm"
									variant="outline"
									onClick={() => setShowFeatureForm(true)}
								>
									Add Feature
								</Button>
							</div>

							{showFeatureForm && (
								<div className="flex flex-col gap-3 rounded-lg border bg-card p-3 shadow-sm">
									<p className="font-medium text-sm">
										New Feature
									</p>
									<div className="flex flex-col gap-1.5">
										<Label
											htmlFor={`${uid}-feature-key`}
											className="text-xs"
										>
											Key{" "}
											<span className="text-destructive">
												*
											</span>
										</Label>
										<Input
											id={`${uid}-feature-key`}
											placeholder="e.g. export-csv"
											value={featureFormKey}
											className={
												featureKeyError
													? "border-destructive"
													: ""
											}
											onChange={(e) => {
												setFeatureFormKey(
													e.target.value,
												);
												setFeatureKeyError(
													validateFeatureKey(
														e.target.value,
													) || !e.target.value
														? ""
														: "Alphanumeric + hyphens only, max 100 chars.",
												);
											}}
											autoFocus
										/>
										{featureKeyError && (
											<p className="text-destructive text-xs">
												{featureKeyError}
											</p>
										)}
									</div>
									<div className="flex flex-col gap-1.5">
										<Label
											htmlFor={`${uid}-feature-desc`}
											className="text-xs"
										>
											Description
										</Label>
										<Input
											id={`${uid}-feature-desc`}
											placeholder="Optional description"
											value={featureFormDesc}
											onChange={(e) =>
												setFeatureFormDesc(
													e.target.value,
												)
											}
										/>
									</div>
									<Separator />
									<div className="flex justify-end gap-2">
										<Button
											size="sm"
											variant="ghost"
											onClick={() => {
												setShowFeatureForm(false);
												setFeatureKeyError("");
											}}
										>
											Cancel
										</Button>
										<Button
											size="sm"
											onClick={handleAddFeature}
											disabled={savingFeature}
										>
											{savingFeature ? "Adding…" : "Add"}
										</Button>
									</div>
								</div>
							)}

							{features.length === 0 ? (
								<p className="text-muted-foreground text-sm">
									No features defined for this app yet.
								</p>
							) : (
								<div className="flex flex-col gap-1.5">
									{features.map((f) => (
										<div
											key={f.featureId}
											className="flex items-center justify-between rounded-lg border px-3 py-2.5"
										>
											<div>
												<span className="font-mono text-sm">
													{f.featureKey}
												</span>
												{f.description && (
													<p className="text-muted-foreground text-xs">
														{f.description}
													</p>
												)}
											</div>
											<Switch
												checked={f.enabled}
												onCheckedChange={() =>
													handleToggleFeature(f)
												}
											/>
										</div>
									))}
								</div>
							)}
						</TabsContent>

						<TabsContent
							value="members"
							className="flex flex-col gap-2 overflow-auto"
						>
							<div className="flex items-center justify-between">
								<p className="text-muted-foreground text-sm">
									Users explicitly assigned to this profile.
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
											htmlFor={`${uid}-assign-uid`}
											className="text-xs"
										>
											User ID{" "}
											<span className="text-destructive">
												*
											</span>
										</Label>
										<Input
											id={`${uid}-assign-uid`}
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
									No users explicitly assigned to this
									profile.
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
						Select a profile to view details.
					</p>
				</div>
			)}

			{/* Delete profile confirmation */}
			<Dialog
				open={!!deleteProfileTarget}
				onOpenChange={(open) => !open && setDeleteProfileTarget(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Profile</DialogTitle>
						<DialogDescription>
							Delete profile &quot;
							{deleteProfileTarget?.profileName}&quot;? This
							cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="ghost"
							onClick={() => setDeleteProfileTarget(null)}
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
							profile? They will fall back to the default profile.
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
