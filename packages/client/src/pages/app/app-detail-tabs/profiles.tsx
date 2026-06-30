import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
	Badge,
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Separator,
	Switch,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { useRootStore } from "@/hooks";

interface AppProfilesProps {
	appId: string;
	permission: string;
}

type ApiProfile = {
	profileId: string;
	profileName: string;
	description?: string;
	isDefault?: boolean;
	userCount?: number;
};

type ApiProfileFeature = {
	featureId: string;
	featureKey: string;
	description?: string;
	enabled?: boolean;
};

type ApiProfileUser = {
	userId: string;
	displayName?: string;
	email?: string;
};

function sanitizeForPixel(s: string): string {
	return s.replace(/[^a-zA-Z0-9 _\-.,!?]/g, "");
}

export const AppProfiles = ({ appId, permission }: AppProfilesProps) => {
	const { monolithStore } = useRootStore();
	const [profiles, setProfiles] = useState<ApiProfile[]>([]);
	const [selectedProfile, setSelectedProfile] = useState<ApiProfile | null>(
		null,
	);
	const [profileFeatures, setProfileFeatures] = useState<ApiProfileFeature[]>(
		[],
	);
	const [profileUsers, setProfileUsers] = useState<ApiProfileUser[]>([]);
	const [profileDialogOpen, setProfileDialogOpen] = useState(false);
	const [featureDialogOpen, setFeatureDialogOpen] = useState(false);
	const [deleteProfileDialogOpen, setDeleteProfileDialogOpen] =
		useState(false);
	const [editingProfile, setEditingProfile] = useState<ApiProfile | null>(
		null,
	);
	const [profileName, setProfileName] = useState("");
	const [profileDesc, setProfileDesc] = useState("");
	const [profileIsDefault, setProfileIsDefault] = useState(false);
	const [featureKey, setFeatureKey] = useState("");
	const [featureDesc, setFeatureDesc] = useState("");
	const [featureKeyError, setFeatureKeyError] = useState("");

	const canManage = permission === "author" || permission === "editor";

	const loadProfiles = useCallback(async () => {
		try {
			const res = await monolithStore.runQuery(
				`GetAppProfiles(app="${appId}");`,
			);
			const { operationType, output } = res.pixelReturn[0];
			if (operationType.indexOf("ERROR") === -1 && output) {
				setProfiles(
					Array.isArray(output) ? output : Object.values(output),
				);
			}
		} catch {
			toast.error("Failed to load profiles");
		}
	}, [appId, monolithStore]);

	const loadProfileFeatures = useCallback(
		async (profileId: string) => {
			try {
				const res = await monolithStore.runQuery(
					`GetProfileFeatures(app="${appId}", profileId="${profileId}");`,
				);
				const { operationType, output } = res.pixelReturn[0];
				if (operationType.indexOf("ERROR") === -1 && output) {
					setProfileFeatures(
						Array.isArray(output) ? output : Object.values(output),
					);
				}
			} catch {
				toast.error("Failed to load profile features");
			}
		},
		[appId, monolithStore],
	);

	const loadProfileUsers = useCallback(
		async (profileId: string) => {
			try {
				const res = await monolithStore.runQuery(
					`GetProfileUsers(app="${appId}", profileId="${profileId}");`,
				);
				const { operationType, output } = res.pixelReturn[0];
				if (operationType.indexOf("ERROR") === -1 && output) {
					setProfileUsers(
						Array.isArray(output) ? output : Object.values(output),
					);
				}
			} catch {
				toast.error("Failed to load profile users");
			}
		},
		[appId, monolithStore],
	);

	useEffect(() => {
		loadProfiles();
	}, [loadProfiles]);

	useEffect(() => {
		if (selectedProfile) {
			loadProfileFeatures(selectedProfile.profileId);
			loadProfileUsers(selectedProfile.profileId);
		}
	}, [selectedProfile, loadProfileFeatures, loadProfileUsers]);

	const handleSaveProfile = async () => {
		const name = sanitizeForPixel(profileName.trim());
		if (!name) return;
		try {
			if (editingProfile) {
				await monolithStore.runQuery(
					`UpdateAppProfile(app="${appId}", profileId="${editingProfile.profileId}", name="${name}", description="${sanitizeForPixel(profileDesc)}", isDefault="${profileIsDefault}");`,
				);
				toast.success("Profile updated");
			} else {
				await monolithStore.runQuery(
					`CreateAppProfile(app="${appId}", name="${name}", description="${sanitizeForPixel(profileDesc)}", isDefault="${profileIsDefault}");`,
				);
				toast.success("Profile created");
			}
		} catch {
			toast.error("Failed to save profile");
		}
		setProfileDialogOpen(false);
		setEditingProfile(null);
		setProfileName("");
		setProfileDesc("");
		setProfileIsDefault(false);
		await loadProfiles();
	};

	const handleDeleteProfile = async () => {
		if (!selectedProfile) return;
		try {
			await monolithStore.runQuery(
				`DeleteAppProfile(app="${appId}", profileId="${selectedProfile.profileId}");`,
			);
			toast.success("Profile deleted");
		} catch {
			toast.error("Failed to delete profile");
		}
		setDeleteProfileDialogOpen(false);
		setSelectedProfile(null);
		await loadProfiles();
	};

	const handleSaveFeature = async () => {
		const key = featureKey.trim();
		if (!/^[a-zA-Z0-9-]+$/.test(key)) {
			setFeatureKeyError("Only letters, numbers, and hyphens allowed.");
			return;
		}
		try {
			await monolithStore.runQuery(
				`CreateAppFeature(app="${appId}", key="${key}", description="${sanitizeForPixel(featureDesc)}");`,
			);
			toast.success("Feature created");
		} catch {
			toast.error("Failed to create feature");
		}
		setFeatureDialogOpen(false);
		setFeatureKey("");
		setFeatureDesc("");
		setFeatureKeyError("");
		if (selectedProfile)
			await loadProfileFeatures(selectedProfile.profileId);
	};

	const handleToggleFeature = async (featureId: string, enabled: boolean) => {
		if (!selectedProfile) return;
		try {
			await monolithStore.runQuery(
				`SetProfileFeature(app="${appId}", profileId="${selectedProfile.profileId}", featureId="${featureId}", enabled="${enabled}");`,
			);
			await loadProfileFeatures(selectedProfile.profileId);
		} catch {
			toast.error("Failed to update feature");
		}
	};

	const handleRemoveUser = async (userId: string) => {
		try {
			await monolithStore.runQuery(
				`RemoveUserProfile(app="${appId}", userId="${userId}");`,
			);
			toast.success("User removed from profile");
		} catch {
			toast.error("Failed to remove user");
		}
		if (selectedProfile) await loadProfileUsers(selectedProfile.profileId);
	};

	return (
		<div className="flex h-full gap-4 p-4">
			{/* Left panel */}
			<div className="flex w-72 shrink-0 flex-col gap-2">
				<div className="flex items-center justify-between">
					<span className="font-semibold text-base">Profiles</span>
					{canManage && (
						<Button
							size="sm"
							onClick={() => {
								setEditingProfile(null);
								setProfileName("");
								setProfileDesc("");
								setProfileIsDefault(false);
								setProfileDialogOpen(true);
							}}
						>
							<Plus className="mr-1 size-4" /> New Profile
						</Button>
					)}
				</div>

				<div className="flex flex-col gap-2">
					{profiles.map((profile) => (
						// biome-ignore lint/a11y/useSemanticElements: card has nested interactive buttons; converting outer div to button would make nested buttons invalid HTML
						<div
							key={profile.profileId}
							role="button"
							tabIndex={0}
							className={`cursor-pointer rounded border p-3 transition-colors ${
								selectedProfile?.profileId === profile.profileId
									? "border-primary bg-accent"
									: "border-border bg-background hover:bg-muted"
							}`}
							onClick={() => setSelectedProfile(profile)}
							onKeyDown={(e) =>
								e.key === "Enter" && setSelectedProfile(profile)
							}
						>
							<div className="flex items-center justify-between">
								<div className="flex flex-col gap-0.5">
									<div className="flex items-center gap-2">
										<span className="font-medium text-sm">
											{profile.profileName}
										</span>
										{profile.isDefault && (
											<Badge
												variant="secondary"
												className="text-xs"
											>
												Default
											</Badge>
										)}
									</div>
									<span className="text-muted-foreground text-xs">
										{profile.userCount ?? 0} user
										{profile.userCount !== 1 ? "s" : ""}
									</span>
								</div>
								{canManage && (
									<div className="flex items-center gap-1">
										<Button
											variant="ghost"
											size="icon"
											className="size-7"
											onClick={(e) => {
												e.stopPropagation();
												setEditingProfile(profile);
												setProfileName(
													profile.profileName,
												);
												setProfileDesc(
													profile.description || "",
												);
												setProfileIsDefault(
													profile.isDefault,
												);
												setProfileDialogOpen(true);
											}}
										>
											<Pencil className="size-3.5" />
										</Button>
										<Tooltip>
											<TooltipTrigger asChild>
												<span>
													<Button
														variant="ghost"
														size="icon"
														className="size-7"
														disabled={
															(profile.userCount ??
																0) > 0
														}
														onClick={(e) => {
															e.stopPropagation();
															setSelectedProfile(
																profile,
															);
															setDeleteProfileDialogOpen(
																true,
															);
														}}
													>
														<Trash2 className="size-3.5" />
													</Button>
												</span>
											</TooltipTrigger>
											<TooltipContent>
												{(profile.userCount ?? 0) > 0
													? `${profile.userCount} user(s) assigned — remove them first`
													: "Delete profile"}
											</TooltipContent>
										</Tooltip>
									</div>
								)}
							</div>
						</div>
					))}
					{profiles.length === 0 && (
						<p className="text-muted-foreground text-sm">
							No profiles defined yet.
						</p>
					)}
				</div>
			</div>

			<Separator orientation="vertical" className="h-full" />

			{/* Right panel */}
			{selectedProfile ? (
				<div className="flex flex-1 flex-col gap-3">
					<span className="font-semibold text-base">
						{selectedProfile.profileName}
					</span>
					<Tabs defaultValue="features">
						<TabsList>
							<TabsTrigger value="features">Features</TabsTrigger>
							<TabsTrigger value="members">Members</TabsTrigger>
						</TabsList>

						<TabsContent
							value="features"
							className="mt-3 flex flex-col gap-2"
						>
							{canManage && (
								<Button
									size="sm"
									className="self-start"
									onClick={() => setFeatureDialogOpen(true)}
								>
									<Plus className="mr-1 size-4" /> Add Feature
								</Button>
							)}
							{profileFeatures.length === 0 && (
								<p className="text-muted-foreground text-sm">
									No features defined for this app.
								</p>
							)}
							{profileFeatures.map((pf) => (
								<div
									key={pf.featureId}
									className="flex items-center justify-between rounded border border-border p-3"
								>
									<div className="flex flex-col">
										<span className="font-medium text-sm">
											{pf.featureKey}
										</span>
										{pf.description && (
											<span className="text-muted-foreground text-xs">
												{pf.description}
											</span>
										)}
									</div>
									<Switch
										checked={!!pf.enabled}
										disabled={!canManage}
										onCheckedChange={(checked) =>
											handleToggleFeature(
												pf.featureId,
												checked,
											)
										}
									/>
								</div>
							))}
						</TabsContent>

						<TabsContent
							value="members"
							className="mt-3 flex flex-col gap-2"
						>
							{profileUsers.length === 0 && (
								<p className="text-muted-foreground text-sm">
									No users assigned to this profile.
								</p>
							)}
							{profileUsers.map((u) => (
								<div
									key={u.userId}
									className="flex items-center justify-between rounded border border-border p-3"
								>
									<div className="flex flex-col">
										<span className="font-medium text-sm">
											{u.displayName}
										</span>
										<span className="text-muted-foreground text-xs">
											{u.email}
										</span>
									</div>
									{canManage && (
										<Button
											variant="ghost"
											size="icon"
											className="size-7"
											onClick={() =>
												handleRemoveUser(u.userId)
											}
										>
											<Trash2 className="size-3.5" />
										</Button>
									)}
								</div>
							))}
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

			{/* Profile create/edit dialog */}
			<Dialog
				open={profileDialogOpen}
				onOpenChange={(v) => !v && setProfileDialogOpen(false)}
			>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle>
							{editingProfile ? "Edit Profile" : "New Profile"}
						</DialogTitle>
					</DialogHeader>
					<div className="flex flex-col gap-4 py-2">
						<div className="flex flex-col gap-1">
							<span className="font-medium text-sm">
								Name <span className="text-destructive">*</span>
							</span>
							<Input
								value={profileName}
								onChange={(e) => setProfileName(e.target.value)}
								maxLength={100}
								placeholder="Profile name"
							/>
						</div>
						<div className="flex flex-col gap-1">
							<span className="font-medium text-sm">
								Description
							</span>
							<Input
								value={profileDesc}
								onChange={(e) => setProfileDesc(e.target.value)}
								placeholder="Optional description"
							/>
						</div>
						<div className="flex items-center gap-2">
							<Switch
								checked={profileIsDefault}
								onCheckedChange={setProfileIsDefault}
							/>
							<span className="text-sm">
								Set as default profile
							</span>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setProfileDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button
							onClick={handleSaveProfile}
							disabled={!profileName.trim()}
						>
							Save
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Feature create dialog */}
			<Dialog
				open={featureDialogOpen}
				onOpenChange={(v) => !v && setFeatureDialogOpen(false)}
			>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle>Add Feature</DialogTitle>
					</DialogHeader>
					<div className="flex flex-col gap-4 py-2">
						<div className="flex flex-col gap-1">
							<span className="font-medium text-sm">
								Feature Key{" "}
								<span className="text-destructive">*</span>
							</span>
							<Input
								value={featureKey}
								onChange={(e) => {
									setFeatureKey(e.target.value);
									setFeatureKeyError("");
								}}
								maxLength={100}
								placeholder="e.g. export-csv"
								className={
									featureKeyError ? "border-destructive" : ""
								}
							/>
							{featureKeyError && (
								<span className="text-destructive text-xs">
									{featureKeyError}
								</span>
							)}
							<span className="text-muted-foreground text-xs">
								Letters, numbers, and hyphens only
							</span>
						</div>
						<div className="flex flex-col gap-1">
							<span className="font-medium text-sm">
								Description
							</span>
							<Input
								value={featureDesc}
								onChange={(e) => setFeatureDesc(e.target.value)}
								placeholder="Optional description"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setFeatureDialogOpen(false);
								setFeatureKeyError("");
							}}
						>
							Cancel
						</Button>
						<Button
							onClick={handleSaveFeature}
							disabled={!featureKey.trim()}
						>
							Add
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete confirmation dialog */}
			<Dialog
				open={deleteProfileDialogOpen}
				onOpenChange={(v) => !v && setDeleteProfileDialogOpen(false)}
			>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle>Delete Profile</DialogTitle>
					</DialogHeader>
					<p className="text-muted-foreground text-sm">
						Delete "{selectedProfile?.profileName}"? This cannot be
						undone.
					</p>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDeleteProfileDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleDeleteProfile}
						>
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};
