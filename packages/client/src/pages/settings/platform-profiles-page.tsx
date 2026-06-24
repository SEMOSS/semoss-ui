import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@semoss/ui/next";
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

	const [profiles, setProfiles] = useState<PlatformProfile[]>([]);
	const [selectedProfile, setSelectedProfile] =
		useState<PlatformProfile | null>(null);
	const [features, setFeatures] = useState<Record<string, boolean>>({});
	const [profileUsers, setProfileUsers] = useState<ProfileUser[]>([]);
	const [activeTab, setActiveTab] = useState<"features" | "members">(
		"features",
	);

	const [showProfileForm, setShowProfileForm] = useState(false);
	const [editingProfile, setEditingProfile] =
		useState<PlatformProfile | null>(null);
	const [profileFormName, setProfileFormName] = useState("");
	const [profileFormDesc, setProfileFormDesc] = useState("");

	const [showAssignUser, setShowAssignUser] = useState(false);
	const [assignUserId, setAssignUserId] = useState("");

	const [loading, setLoading] = useState(false);

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
		// Reuse GetProfileUsers concept — platform profiles list users via a future admin API
		// For now we fetch assigned users from the platform profile
		const result = await runPixel<ProfileUser[]>(
			`GetPlatformProfileUsers(profileId="${profileId}");`,
		);
		if (result) setProfileUsers(result);
	}

	async function handleSaveProfile() {
		const name = sanitizeForPixel(profileFormName.trim());
		if (!name) {
			toast.error("Profile name is required.");
			return;
		}
		const desc = sanitizeForPixel(profileFormDesc);
		setLoading(true);
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
			setProfileFormName("");
			setProfileFormDesc("");
		} finally {
			setLoading(false);
		}
	}

	async function handleDeleteProfile(profile: PlatformProfile) {
		if (profile.userCount > 0) return;
		if (!confirm(`Delete platform profile "${profile.profileName}"?`))
			return;
		await runPixel(
			`DeletePlatformProfile(profileId="${profile.profileId}");`,
		);
		await loadProfiles();
		if (selectedProfile?.profileId === profile.profileId)
			setSelectedProfile(null);
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
		const uid = sanitizeForPixel(assignUserId.trim());
		await runPixel(
			`AssignUserPlatformProfile(userId="${uid}", profileId="${selectedProfile.profileId}");`,
		);
		await loadProfileUsers(selectedProfile.profileId);
		setShowAssignUser(false);
		setAssignUserId("");
	}

	async function handleRemoveUser(userId: string) {
		if (!confirm(`Remove user ${userId} from this platform profile?`))
			return;
		await runPixel(`RemoveUserPlatformProfile(userId="${userId}");`);
		if (selectedProfile) await loadProfileUsers(selectedProfile.profileId);
	}

	return (
		<div className="flex h-full gap-4 p-4">
			{/* Left panel */}
			<div className="flex w-72 flex-shrink-0 flex-col gap-2">
				<div className="mb-1 flex items-center justify-between">
					<span className="font-semibold text-sm">
						Platform Profiles
					</span>
					<Button
						size="sm"
						variant="outline"
						onClick={() => {
							setShowProfileForm(true);
							setEditingProfile(null);
							setProfileFormName("");
							setProfileFormDesc("");
						}}
					>
						New Profile
					</Button>
				</div>

				{showProfileForm && (
					<div className="flex flex-col gap-2 rounded-md border bg-card p-3">
						<input
							className="w-full rounded border px-2 py-1 text-sm"
							placeholder="Profile name *"
							value={profileFormName}
							onChange={(e) => setProfileFormName(e.target.value)}
						/>
						<input
							className="w-full rounded border px-2 py-1 text-sm"
							placeholder="Description"
							value={profileFormDesc}
							onChange={(e) => setProfileFormDesc(e.target.value)}
						/>
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
								disabled={loading}
							>
								Save
							</Button>
						</div>
					</div>
				)}

				{profiles.length === 0 && (
					<p className="text-muted-foreground text-sm">
						No platform profiles defined yet.
					</p>
				)}

				{profiles.map((p) => (
					// biome-ignore lint/a11y/useSemanticElements: card contains nested interactive elements, cannot use button
					<div
						key={p.profileId}
						role="button"
						tabIndex={0}
						className={`cursor-pointer rounded-md border p-3 transition-colors hover:bg-muted/50 ${selectedProfile?.profileId === p.profileId ? "border-primary bg-muted/30" : ""}`}
						onClick={() => setSelectedProfile(p)}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ")
								setSelectedProfile(p);
						}}
					>
						<div className="flex items-center justify-between">
							<span className="font-medium text-sm">
								{p.profileName}
							</span>
							<div className="flex items-center gap-1">
								<span className="text-muted-foreground text-xs">
									{p.userCount} users
								</span>
								<button
									type="button"
									className="ml-1 text-muted-foreground hover:text-foreground"
									title="Edit"
									onClick={(e) => {
										e.stopPropagation();
										setEditingProfile(p);
										setProfileFormName(p.profileName);
										setProfileFormDesc(p.description || "");
										setShowProfileForm(true);
									}}
								>
									✎
								</button>
								<button
									type="button"
									className={`ml-1 text-muted-foreground ${p.userCount > 0 ? "cursor-not-allowed opacity-30" : "hover:text-destructive"}`}
									title={
										p.userCount > 0
											? `${p.userCount} users assigned — reassign first`
											: "Delete"
									}
									onClick={(e) => {
										e.stopPropagation();
										handleDeleteProfile(p);
									}}
									disabled={p.userCount > 0}
								>
									🗑
								</button>
							</div>
						</div>
						{p.description && (
							<p className="mt-1 text-muted-foreground text-xs">
								{p.description}
							</p>
						)}
					</div>
				))}
			</div>

			{/* Right panel */}
			{selectedProfile ? (
				<div className="flex flex-1 flex-col gap-3">
					<div className="flex items-center gap-3 border-b pb-2">
						<h3 className="font-semibold">
							{selectedProfile.profileName}
						</h3>
						<div className="flex gap-2">
							<button
								type="button"
								className={`rounded-md px-3 py-1 text-sm ${activeTab === "features" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
								onClick={() => setActiveTab("features")}
							>
								Platform Features
							</button>
							<button
								type="button"
								className={`rounded-md px-3 py-1 text-sm ${activeTab === "members" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
								onClick={() => setActiveTab("members")}
							>
								Members
							</button>
						</div>
					</div>

					{activeTab === "features" && (
						<div className="flex flex-col gap-2">
							<p className="text-muted-foreground text-sm">
								Toggle which platform navigation items are
								visible to users assigned to this profile.
							</p>
							{PLATFORM_FEATURES.map((f) => (
								<div
									key={f.key}
									className="flex items-center justify-between rounded-md border px-3 py-2"
								>
									<span className="text-sm">{f.label}</span>
									<label className="relative inline-flex cursor-pointer items-center">
										<input
											type="checkbox"
											className="peer sr-only"
											checked={features[f.key] ?? false}
											onChange={() =>
												handleToggleFeature(f.key)
											}
										/>
										<div className="peer h-5 w-9 rounded-full bg-gray-200 after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
									</label>
								</div>
							))}
						</div>
					)}

					{activeTab === "members" && (
						<div className="flex flex-col gap-2">
							<div className="flex items-center justify-between">
								<span className="font-medium text-sm">
									Members
								</span>
								<Button
									size="sm"
									variant="outline"
									onClick={() => setShowAssignUser(true)}
								>
									Assign User
								</Button>
							</div>

							{showAssignUser && (
								<div className="flex flex-col gap-2 rounded-md border bg-card p-3">
									<input
										className="w-full rounded border px-2 py-1 text-sm"
										placeholder="User ID"
										value={assignUserId}
										onChange={(e) =>
											setAssignUserId(e.target.value)
										}
									/>
									<div className="flex justify-end gap-2">
										<Button
											size="sm"
											variant="ghost"
											onClick={() =>
												setShowAssignUser(false)
											}
										>
											Cancel
										</Button>
										<Button
											size="sm"
											onClick={handleAssignUser}
										>
											Assign
										</Button>
									</div>
								</div>
							)}

							{profileUsers.length === 0 ? (
								<p className="text-muted-foreground text-sm">
									No users assigned to this platform profile.
								</p>
							) : (
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b">
											<th className="py-1 text-left font-medium">
												User ID
											</th>
											<th className="py-1 text-left font-medium">
												Assigned By
											</th>
											<th className="py-1 text-left font-medium">
												Assigned At
											</th>
											<th />
										</tr>
									</thead>
									<tbody>
										{profileUsers.map((u) => (
											<tr
												key={u.userId}
												className="border-b hover:bg-muted/30"
											>
												<td className="py-1">
													{u.userId}
												</td>
												<td className="py-1 text-muted-foreground">
													{u.assignedBy}
												</td>
												<td className="py-1 text-muted-foreground">
													{u.assignedAt
														? new Date(
																u.assignedAt,
															).toLocaleDateString()
														: "—"}
												</td>
												<td className="py-1">
													<Button
														size="sm"
														variant="ghost"
														onClick={() =>
															handleRemoveUser(
																u.userId,
															)
														}
														className="text-destructive hover:text-destructive"
													>
														Remove
													</Button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							)}
						</div>
					)}
				</div>
			) : (
				<div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
					Select a platform profile to view details.
				</div>
			)}
		</div>
	);
};
