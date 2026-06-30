import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
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

const PLATFORM_FEATURE_LABELS: Record<string, string> = {
	"nav.app-catalog": "App Catalog",
	"nav.build": "Build",
	"nav.skills": "Skills",
	"nav.settings": "Settings",
	"nav.engine": "Engines",
};

function sanitizeForPixel(s: string): string {
	return s.replace(/[^a-zA-Z0-9 _\-.,!?]/g, "");
}

type ApiPlatformProfile = {
	profileId: string;
	profileName: string;
	description?: string;
	userCount?: number;
};

export const PlatformProfilesPage = () => {
	const { monolithStore } = useRootStore();
	const [profiles, setProfiles] = useState<ApiPlatformProfile[]>([]);
	const [selectedProfile, setSelectedProfile] =
		useState<ApiPlatformProfile | null>(null);
	const [profileFeatures, setProfileFeatures] = useState<
		Record<string, boolean>
	>({});
	const [profileDialogOpen, setProfileDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [editingProfile, setEditingProfile] =
		useState<ApiPlatformProfile | null>(null);
	const [profileName, setProfileName] = useState("");
	const [profileDesc, setProfileDesc] = useState("");

	const loadProfiles = useCallback(async () => {
		try {
			const res = await monolithStore.runQuery("GetPlatformProfiles();");
			const { operationType, output } = res.pixelReturn[0];
			if (operationType.indexOf("ERROR") === -1 && output) {
				setProfiles(
					Array.isArray(output) ? output : Object.values(output),
				);
			}
		} catch {
			toast.error("Failed to load platform profiles");
		}
	}, [monolithStore]);

	const loadProfileFeatures = useCallback(
		async (profileId: string) => {
			try {
				const res = await monolithStore.runQuery(
					`GetPlatformFeatures(profileId="${profileId}");`,
				);
				const { operationType, output } = res.pixelReturn[0];
				if (operationType.indexOf("ERROR") === -1 && output) {
					setProfileFeatures(output as Record<string, boolean>);
				}
			} catch {
				toast.error("Failed to load profile features");
			}
		},
		[monolithStore],
	);

	useEffect(() => {
		loadProfiles();
	}, [loadProfiles]);

	useEffect(() => {
		if (selectedProfile) {
			loadProfileFeatures(selectedProfile.profileId);
		}
	}, [selectedProfile, loadProfileFeatures]);

	const handleSaveProfile = async () => {
		const name = sanitizeForPixel(profileName.trim());
		if (!name) return;
		try {
			if (editingProfile) {
				await monolithStore.runQuery(
					`UpdatePlatformProfile(profileId="${editingProfile.profileId}", name="${name}", description="${sanitizeForPixel(profileDesc)}");`,
				);
				toast.success("Profile updated");
			} else {
				await monolithStore.runQuery(
					`CreatePlatformProfile(name="${name}", description="${sanitizeForPixel(profileDesc)}");`,
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
		await loadProfiles();
	};

	const handleDeleteProfile = async () => {
		if (!selectedProfile) return;
		try {
			await monolithStore.runQuery(
				`DeletePlatformProfile(profileId="${selectedProfile.profileId}");`,
			);
			toast.success("Profile deleted");
		} catch {
			toast.error("Failed to delete profile");
		}
		setDeleteDialogOpen(false);
		setSelectedProfile(null);
		await loadProfiles();
	};

	const handleToggleFeature = async (
		featureKey: string,
		enabled: boolean,
	) => {
		if (!selectedProfile) return;
		try {
			await monolithStore.runQuery(
				`SetPlatformFeature(profileId="${selectedProfile.profileId}", featureKey="${featureKey}", enabled="${enabled}");`,
			);
			await loadProfileFeatures(selectedProfile.profileId);
		} catch {
			toast.error("Failed to update feature");
		}
	};

	return (
		<div className="flex h-full gap-4 p-4">
			{/* Left panel */}
			<div className="flex w-72 shrink-0 flex-col gap-2">
				<div className="flex items-center justify-between">
					<span className="font-semibold text-base">
						Platform Profiles
					</span>
					<Button
						size="sm"
						onClick={() => {
							setEditingProfile(null);
							setProfileName("");
							setProfileDesc("");
							setProfileDialogOpen(true);
						}}
					>
						<Plus className="mr-1 size-4" /> New
					</Button>
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
									<span className="font-medium text-sm">
										{profile.profileName}
									</span>
									<span className="text-muted-foreground text-xs">
										{profile.userCount ?? 0} user
										{profile.userCount !== 1 ? "s" : ""}
									</span>
								</div>
								<div className="flex items-center gap-1">
									<Button
										variant="ghost"
										size="icon"
										className="size-7"
										onClick={(e) => {
											e.stopPropagation();
											setEditingProfile(profile);
											setProfileName(profile.profileName);
											setProfileDesc(
												profile.description || "",
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
														setDeleteDialogOpen(
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
							</div>
						</div>
					))}
					{profiles.length === 0 && (
						<p className="text-muted-foreground text-sm">
							No platform profiles defined.
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
							<TabsTrigger value="features">
								Platform Features
							</TabsTrigger>
							<TabsTrigger value="members">Members</TabsTrigger>
						</TabsList>

						<TabsContent
							value="features"
							className="mt-3 flex flex-col gap-2"
						>
							{Object.entries(PLATFORM_FEATURE_LABELS).map(
								([key, label]) => (
									<div
										key={key}
										className="flex items-center justify-between rounded border border-border p-3"
									>
										<span className="text-sm">{label}</span>
										<Switch
											checked={!!profileFeatures[key]}
											onCheckedChange={(checked) =>
												handleToggleFeature(
													key,
													checked,
												)
											}
										/>
									</div>
								),
							)}
						</TabsContent>

						<TabsContent value="members" className="mt-3">
							<p className="text-muted-foreground text-sm">
								No users assigned to this profile.
							</p>
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
							{editingProfile
								? "Edit Profile"
								: "New Platform Profile"}
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

			{/* Delete confirmation dialog */}
			<Dialog
				open={deleteDialogOpen}
				onOpenChange={(v) => !v && setDeleteDialogOpen(false)}
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
							onClick={() => setDeleteDialogOpen(false)}
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
