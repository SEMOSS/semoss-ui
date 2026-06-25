import { ChevronDown, Pencil, Trash2, UserPlus, Users, X } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useId, useState } from "react";
import {
	Avatar,
	AvatarFallback,
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
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import type { AdminUser } from "@/api/auth";
import { UserSearchCombobox } from "@/components/settings/user-search-combobox";
import { useRootStore } from "@/hooks/";

interface Profile {
	profileId: string;
	profileName: string;
	description: string;
	isDefault: boolean;
	isGroup: boolean;
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
	name: string | null;
	email: string | null;
	assignedBy: string;
	assignedAt: string;
}

interface Subgroup {
	subgroupId: string;
	subgroupName: string;
	description: string;
	userCount: number;
}

interface SubgroupUser {
	userId: string;
	name: string | null;
	email: string | null;
	assignedBy: string;
	assignedAt: string;
}

interface ProfileManager {
	userId: string;
	name: string | null;
	email: string | null;
	permission: string;
}

interface AppProfilesProps {
	appId: string;
	permission?: string;
}

const escapePixelString = (s: string) => s.replaceAll("'", "\\'");

function validateFeatureKey(key: string): boolean {
	return /^[a-zA-Z0-9-]+$/.test(key) && key.length <= 100;
}

export const AppProfiles = observer(
	({ appId, permission }: AppProfilesProps) => {
		const { monolithStore } = useRootStore();
		const uid = useId();
		const canWrite = permission !== "readOnly";

		const [profiles, setProfiles] = useState<Profile[]>([]);
		const [selectedProfile, setSelectedProfile] = useState<Profile | null>(
			null,
		);
		const [features, setFeatures] = useState<Feature[]>([]);
		const [profileUsers, setProfileUsers] = useState<ProfileUser[]>([]);

		// Profile modal state
		const [showProfileModal, setShowProfileModal] = useState(false);
		const [editingProfile, setEditingProfile] = useState<Profile | null>(
			null,
		);
		const [profileFormName, setProfileFormName] = useState("");
		const [profileFormDesc, setProfileFormDesc] = useState("");
		const [profileFormDefault, setProfileFormDefault] = useState(false);
		const [profileFormIsGroup, setProfileFormIsGroup] = useState(false);
		const [savingProfile, setSavingProfile] = useState(false);

		// Feature modal state
		const [showFeatureModal, setShowFeatureModal] = useState(false);
		const [featureFormKey, setFeatureFormKey] = useState("");
		const [featureFormDesc, setFeatureFormDesc] = useState("");
		const [featureKeyError, setFeatureKeyError] = useState("");
		const [savingFeature, setSavingFeature] = useState(false);

		// Assign user modal state
		const [showAssignModal, setShowAssignModal] = useState(false);
		const [assignUser, setAssignUser] = useState<AdminUser | null>(null);
		const [assigningUser, setAssigningUser] = useState(false);

		// App-level managers state
		const [profileManagers, setProfileManagers] = useState<
			ProfileManager[]
		>([]);
		const [showManagersDialog, setShowManagersDialog] = useState(false);
		const [showAddManagerModal, setShowAddManagerModal] = useState(false);
		const [addManagerUser, setAddManagerUser] = useState<AdminUser | null>(
			null,
		);
		const [addingManager, setAddingManager] = useState(false);
		const [removeManagerTarget, setRemoveManagerTarget] =
			useState<ProfileManager | null>(null);

		// Subgroups state (group profiles)
		const [subgroups, setSubgroups] = useState<Subgroup[]>([]);
		const [showSubgroupModal, setShowSubgroupModal] = useState(false);
		const [editingSubgroup, setEditingSubgroup] = useState<Subgroup | null>(
			null,
		);
		const [subgroupFormName, setSubgroupFormName] = useState("");
		const [subgroupFormDesc, setSubgroupFormDesc] = useState("");
		const [savingSubgroup, setSavingSubgroup] = useState(false);
		const [deleteSubgroupTarget, setDeleteSubgroupTarget] =
			useState<Subgroup | null>(null);

		// Expanded subgroup accordion state
		const [expandedSubgroupId, setExpandedSubgroupId] = useState<
			string | null
		>(null);
		const [subgroupFeatures, setSubgroupFeatures] = useState<Feature[]>([]);
		const [subgroupUsers, setSubgroupUsers] = useState<SubgroupUser[]>([]);
		const [showAssignSubgroupUserModal, setShowAssignSubgroupUserModal] =
			useState(false);
		const [assignSubgroupUser, setAssignSubgroupUser] =
			useState<AdminUser | null>(null);
		const [assigningSubgroupUser, setAssigningSubgroupUser] =
			useState(false);
		const [removeSubgroupUserTarget, setRemoveSubgroupUserTarget] =
			useState<SubgroupUser | null>(null);

		// Confirmation dialogs
		const [deleteProfileTarget, setDeleteProfileTarget] =
			useState<Profile | null>(null);
		const [removeUserTarget, setRemoveUserTarget] =
			useState<ProfileUser | null>(null);
		const [confirmLoading, setConfirmLoading] = useState(false);

		const expandedSubgroup =
			subgroups.find((sg) => sg.subgroupId === expandedSubgroupId) ??
			null;

		// biome-ignore lint/correctness/useExhaustiveDependencies: loadProfiles is defined in component scope
		useEffect(() => {
			loadProfiles();
			loadProfileManagers();
		}, [appId]);

		// biome-ignore lint/correctness/useExhaustiveDependencies: loader functions are defined in component scope
		useEffect(() => {
			// Clear all profile-specific state on profile switch to prevent stale data
			setFeatures([]);
			setProfileUsers([]);
			setSubgroups([]);
			setExpandedSubgroupId(null);

			if (selectedProfile) {
				if (selectedProfile.isGroup) {
					loadSubgroups(selectedProfile.profileId);
					loadProfileFeatures(selectedProfile.profileId);
				} else {
					loadProfileFeatures(selectedProfile.profileId);
					loadProfileUsers(selectedProfile.profileId);
				}
			}
		}, [selectedProfile]);

		// biome-ignore lint/correctness/useExhaustiveDependencies: loader functions are defined in component scope
		useEffect(() => {
			if (expandedSubgroupId) {
				loadSubgroupFeatures(expandedSubgroupId);
				loadSubgroupUsers(expandedSubgroupId);
			}
		}, [expandedSubgroupId]);

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

		async function loadProfileManagers() {
			const result = await runPixel<ProfileManager[]>(
				`GetAppProfileManagers(app="${appId}");`,
			);
			if (result) setProfileManagers(result);
		}

		async function loadProfileFeatures(profileId: string) {
			const result = await runPixel<Feature[]>(
				`GetAppProfileFeatures(app="${appId}", profileId="${profileId}");`,
			);
			if (result) setFeatures(result);
		}

		async function loadProfileUsers(profileId: string) {
			const result = await runPixel<ProfileUser[]>(
				`GetAppProfileUsers(app="${appId}", profileId="${profileId}");`,
			);
			if (result) setProfileUsers(result);
		}

		async function loadSubgroups(profileId: string) {
			const result = await runPixel<Subgroup[]>(
				`GetAppSubgroups(app="${appId}", profileId="${profileId}");`,
			);
			if (result) setSubgroups(result);
		}

		async function loadSubgroupFeatures(subgroupId: string) {
			const result = await runPixel<Feature[]>(
				`GetAppSubgroupFeatures(app="${appId}", subgroupId="${subgroupId}");`,
			);
			if (result) setSubgroupFeatures(result);
		}

		async function loadSubgroupUsers(subgroupId: string) {
			const result = await runPixel<SubgroupUser[]>(
				`GetAppSubgroupUsers(app="${appId}", subgroupId="${subgroupId}");`,
			);
			if (result) setSubgroupUsers(result);
		}

		function openNewProfileModal() {
			setEditingProfile(null);
			setProfileFormName("");
			setProfileFormDesc("");
			setProfileFormDefault(false);
			setProfileFormIsGroup(false);
			setShowProfileModal(true);
		}

		function openEditProfileModal(p: Profile, e: React.MouseEvent) {
			e.stopPropagation();
			setEditingProfile(p);
			setProfileFormName(p.profileName);
			setProfileFormDesc(p.description ?? "");
			setProfileFormDefault(p.isDefault);
			setProfileFormIsGroup(p.isGroup);
			setShowProfileModal(true);
		}

		function closeProfileModal() {
			setShowProfileModal(false);
			setEditingProfile(null);
			setProfileFormName("");
			setProfileFormDesc("");
			setProfileFormDefault(false);
			setProfileFormIsGroup(false);
		}

		function closeFeatureModal() {
			setShowFeatureModal(false);
			setFeatureFormKey("");
			setFeatureFormDesc("");
			setFeatureKeyError("");
		}

		function openNewSubgroupModal() {
			setEditingSubgroup(null);
			setSubgroupFormName("");
			setSubgroupFormDesc("");
			setShowSubgroupModal(true);
		}

		function openEditSubgroupModal(sg: Subgroup, e: React.MouseEvent) {
			e.stopPropagation();
			setEditingSubgroup(sg);
			setSubgroupFormName(sg.subgroupName);
			setSubgroupFormDesc(sg.description ?? "");
			setShowSubgroupModal(true);
		}

		function closeSubgroupModal() {
			setShowSubgroupModal(false);
			setEditingSubgroup(null);
			setSubgroupFormName("");
			setSubgroupFormDesc("");
		}

		async function handleSaveProfile() {
			const name = escapePixelString(profileFormName.trim());
			if (!name) {
				toast.error("Profile name is required.");
				return;
			}
			const desc = escapePixelString(profileFormDesc);
			setSavingProfile(true);
			try {
				if (editingProfile) {
					await runPixel(
						`UpdateAppProfile(app="${appId}", profileId="${editingProfile.profileId}", name="${name}", description="${desc}", isDefault="${profileFormDefault}");`,
					);
				} else {
					await runPixel(
						`CreateAppProfile(app="${appId}", name="${name}", description="${desc}", isDefault="${profileFormDefault}", isGroup="${profileFormIsGroup}");`,
					);
				}
				await loadProfiles();
				closeProfileModal();
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
				if (
					selectedProfile?.profileId === deleteProfileTarget.profileId
				) {
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
				`SetAppProfileFeature(app="${appId}", profileId="${selectedProfile.profileId}", featureId="${feature.featureId}", enabled="${!feature.enabled}");`,
			);
			await loadProfileFeatures(selectedProfile.profileId);
		}

		async function handleAddFeature() {
			if (!validateFeatureKey(featureFormKey)) {
				setFeatureKeyError(
					"Alphanumeric + hyphens only, max 100 chars.",
				);
				return;
			}
			setFeatureKeyError("");
			setSavingFeature(true);
			try {
				const desc = escapePixelString(featureFormDesc);
				await runPixel(
					`CreateAppFeature(app="${appId}", featureKey="${featureFormKey}", description="${desc}");`,
				);
				if (selectedProfile)
					await loadProfileFeatures(selectedProfile.profileId);
				closeFeatureModal();
			} finally {
				setSavingFeature(false);
			}
		}

		async function handleAssignUser() {
			if (!selectedProfile || !assignUser) return;
			setAssigningUser(true);
			try {
				await runPixel(
					`AssignAppUserProfile(app="${appId}", userId="${assignUser.id}", profileId="${selectedProfile.profileId}");`,
				);
				await loadProfileUsers(selectedProfile.profileId);
				setShowAssignModal(false);
				setAssignUser(null);
			} finally {
				setAssigningUser(false);
			}
		}

		async function confirmRemoveUser() {
			if (!removeUserTarget || !selectedProfile) return;
			setConfirmLoading(true);
			try {
				await runPixel(
					`RemoveAppUserProfile(app="${appId}", userId="${removeUserTarget.userId}", profileId="${selectedProfile.profileId}");`,
				);
				await loadProfileUsers(selectedProfile.profileId);
				setRemoveUserTarget(null);
			} finally {
				setConfirmLoading(false);
			}
		}

		async function handleAddManager() {
			if (!addManagerUser) return;
			setAddingManager(true);
			try {
				await runPixel(
					`AddAppProfileManager(app="${appId}", userId="${addManagerUser.id}");`,
				);
				await loadProfileManagers();
				setShowAddManagerModal(false);
				setAddManagerUser(null);
			} finally {
				setAddingManager(false);
			}
		}

		async function confirmRemoveManager() {
			if (!removeManagerTarget) return;
			setConfirmLoading(true);
			try {
				await runPixel(
					`RemoveAppProfileManager(app="${appId}", userId="${removeManagerTarget.userId}");`,
				);
				await loadProfileManagers();
				setRemoveManagerTarget(null);
			} finally {
				setConfirmLoading(false);
			}
		}

		async function handleSaveSubgroup() {
			const name = escapePixelString(subgroupFormName.trim());
			if (!name) {
				toast.error("Subgroup name is required.");
				return;
			}
			if (!selectedProfile) return;
			const desc = escapePixelString(subgroupFormDesc);
			setSavingSubgroup(true);
			try {
				if (editingSubgroup) {
					await runPixel(
						`UpdateAppSubgroup(app="${appId}", subgroupId="${editingSubgroup.subgroupId}", name="${name}", description="${desc}");`,
					);
				} else {
					await runPixel(
						`CreateAppSubgroup(app="${appId}", profileId="${selectedProfile.profileId}", name="${name}", description="${desc}");`,
					);
				}
				await loadSubgroups(selectedProfile.profileId);
				closeSubgroupModal();
			} finally {
				setSavingSubgroup(false);
			}
		}

		async function confirmDeleteSubgroup() {
			if (!deleteSubgroupTarget || !selectedProfile) return;
			setConfirmLoading(true);
			try {
				await runPixel(
					`DeleteAppSubgroup(app="${appId}", subgroupId="${deleteSubgroupTarget.subgroupId}");`,
				);
				await loadSubgroups(selectedProfile.profileId);
				setDeleteSubgroupTarget(null);
			} finally {
				setConfirmLoading(false);
			}
		}

		async function handleToggleSubgroupFeature(feature: Feature) {
			if (!expandedSubgroup) return;
			await runPixel(
				`SetAppSubgroupFeature(app="${appId}", subgroupId="${expandedSubgroup.subgroupId}", featureId="${feature.featureId}", enabled="${!feature.enabled}");`,
			);
			await loadSubgroupFeatures(expandedSubgroup.subgroupId);
		}

		async function handleAssignSubgroupUser() {
			if (!expandedSubgroup || !assignSubgroupUser) return;
			setAssigningSubgroupUser(true);
			try {
				await runPixel(
					`AssignAppUserSubgroup(app="${appId}", userId="${assignSubgroupUser.id}", subgroupId="${expandedSubgroup.subgroupId}");`,
				);
				await loadSubgroupUsers(expandedSubgroup.subgroupId);
				setShowAssignSubgroupUserModal(false);
				setAssignSubgroupUser(null);
			} finally {
				setAssigningSubgroupUser(false);
			}
		}

		async function confirmRemoveSubgroupUser() {
			if (!removeSubgroupUserTarget || !expandedSubgroup) return;
			setConfirmLoading(true);
			try {
				await runPixel(
					`RemoveAppUserSubgroup(app="${appId}", userId="${removeSubgroupUserTarget.userId}", subgroupId="${expandedSubgroup.subgroupId}");`,
				);
				await loadSubgroupUsers(expandedSubgroup.subgroupId);
				setRemoveSubgroupUserTarget(null);
			} finally {
				setConfirmLoading(false);
			}
		}

		// Shared user display helpers
		function getUserInitials(name: string | null, userId: string): string {
			const displayName = name || userId;
			return displayName
				.split(" ")
				.map((w) => w[0])
				.join("")
				.toUpperCase()
				.slice(0, 2);
		}

		return (
			<div className="flex w-full flex-col gap-6">
				{/* Page header */}
				<div className="flex items-start justify-between gap-4">
					<div className="flex flex-col gap-1">
						<h2 className="font-semibold text-xl">Profiles</h2>
						<p className="text-muted-foreground text-sm">
							Control feature access by assigning users to named
							profiles.
						</p>
					</div>
					<div className="flex shrink-0 items-center gap-2">
						{canWrite && (
							<Button
								size="sm"
								variant="ghost"
								className="text-muted-foreground"
								onClick={() => setShowManagersDialog(true)}
								data-testid="app-managers-btn"
							>
								<Users className="mr-1.5 size-3.5" />
								Managers
							</Button>
						)}
						{canWrite && (
							<Button
								size="sm"
								variant="outline"
								onClick={openNewProfileModal}
								data-testid="new-profile-btn"
							>
								New Profile
							</Button>
						)}
					</div>
				</div>

				{/* Profile list */}
				{profiles.length === 0 ? (
					<div className="flex flex-col items-center gap-4 rounded-lg border border-dashed py-16 text-center">
						<p className="text-muted-foreground text-sm">
							No profiles defined yet.
						</p>
						{canWrite && (
							<Button size="sm" onClick={openNewProfileModal}>
								New Profile
							</Button>
						)}
					</div>
				) : (
					<div className="flex flex-col gap-2">
						{profiles.map((p) => {
							const isExpanded =
								selectedProfile?.profileId === p.profileId;
							return (
								<div
									key={p.profileId}
									className="rounded-lg border bg-card"
								>
									{/* Profile card header — click to expand/collapse */}
									{/* biome-ignore lint/a11y/useSemanticElements: card has nested interactive buttons */}
									<div
										role="button"
										tabIndex={0}
										className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left"
										onClick={() =>
											setSelectedProfile(
												isExpanded ? null : p,
											)
										}
										onKeyDown={(e) => {
											if (
												e.key === "Enter" ||
												e.key === " "
											)
												setSelectedProfile(
													isExpanded ? null : p,
												);
										}}
									>
										<ChevronDown
											className={`size-4 shrink-0 text-muted-foreground transition-transform ${isExpanded ? "" : "-rotate-90"}`}
										/>
										<div className="flex min-w-0 flex-1 items-center gap-2">
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
											{p.isGroup && (
												<Badge
													variant="outline"
													className="gap-0.5 text-xs"
												>
													<Users className="size-3" />
													Group
												</Badge>
											)}
											<span className="ml-auto shrink-0 text-muted-foreground text-xs">
												{p.userCount}{" "}
												{p.userCount === 1
													? "user"
													: "users"}
											</span>
										</div>
										{canWrite && (
											<div className="flex shrink-0 items-center gap-0.5">
												<Button
													size="icon"
													variant="ghost"
													className="size-7"
													title="Edit profile"
													onClick={(e) =>
														openEditProfileModal(
															p,
															e,
														)
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
																className="size-7 text-muted-foreground hover:text-destructive disabled:pointer-events-none"
																disabled={
																	p.userCount >
																	0
																}
																onClick={(
																	e,
																) => {
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
															assigned — reassign
															first
														</TooltipContent>
													)}
												</Tooltip>
											</div>
										)}
									</div>

									{/* Expanded profile detail */}
									{isExpanded && (
										<div className="border-t px-4 pt-3 pb-4">
											{p.isGroup ? (
												/* Group profile — Features + Subgroups tabs */
												<Tabs
													defaultValue="features"
													className="flex flex-col gap-3"
												>
													<TabsList className="w-fit">
														<TabsTrigger value="features">
															Features
														</TabsTrigger>
														<TabsTrigger value="subgroups">
															Subgroups
														</TabsTrigger>
													</TabsList>

													{/* Group Features tab */}
													<TabsContent
														value="features"
														className="flex flex-col gap-2"
													>
														<div className="flex items-center justify-between">
															<p className="text-muted-foreground text-sm">
																Base features
																enabled for all
																members of this
																group profile.
															</p>
															{canWrite && (
																<Button
																	size="sm"
																	variant="outline"
																	onClick={() =>
																		setShowFeatureModal(
																			true,
																		)
																	}
																>
																	Add Feature
																</Button>
															)}
														</div>
														{features.length ===
														0 ? (
															<p className="text-muted-foreground text-sm">
																No features
																defined for this
																app yet.
															</p>
														) : (
															<div className="flex flex-col gap-1.5">
																{features.map(
																	(f) => (
																		<div
																			key={
																				f.featureId
																			}
																			className="flex items-center justify-between rounded-lg border px-3 py-2.5"
																		>
																			<div>
																				<span className="font-mono text-sm">
																					{
																						f.featureKey
																					}
																				</span>
																				{f.description && (
																					<p className="text-muted-foreground text-xs">
																						{
																							f.description
																						}
																					</p>
																				)}
																			</div>
																			<Switch
																				checked={
																					f.enabled
																				}
																				onCheckedChange={() =>
																					handleToggleFeature(
																						f,
																					)
																				}
																				disabled={
																					!canWrite
																				}
																			/>
																		</div>
																	),
																)}
															</div>
														)}
													</TabsContent>

													{/* Subgroups tab — inline accordion */}
													<TabsContent
														value="subgroups"
														className="flex flex-col gap-2"
													>
														<div className="flex items-center justify-between">
															<p className="text-muted-foreground text-sm">
																Subgroups within
																this group
																profile.
															</p>
															{canWrite && (
																<Button
																	size="sm"
																	variant="outline"
																	onClick={
																		openNewSubgroupModal
																	}
																	data-testid="new-subgroup-btn"
																>
																	New Subgroup
																</Button>
															)}
														</div>
														{subgroups.length ===
														0 ? (
															<p className="text-muted-foreground text-sm">
																No subgroups
																defined yet.
															</p>
														) : (
															<div className="flex flex-col gap-1.5">
																{subgroups.map(
																	(sg) => {
																		const sgExpanded =
																			expandedSubgroupId ===
																			sg.subgroupId;
																		return (
																			<div
																				key={
																					sg.subgroupId
																				}
																				className="rounded-lg border"
																			>
																				{/* Subgroup row */}
																				<div className="flex items-center gap-2 px-3 py-2.5">
																					{/* biome-ignore lint/a11y/useSemanticElements: interactive div with role */}
																					<div
																						role="button"
																						tabIndex={
																							0
																						}
																						className="flex min-w-0 flex-1 cursor-pointer items-center gap-2"
																						onClick={() =>
																							setExpandedSubgroupId(
																								sgExpanded
																									? null
																									: sg.subgroupId,
																							)
																						}
																						onKeyDown={(
																							e,
																						) => {
																							if (
																								e.key ===
																									"Enter" ||
																								e.key ===
																									" "
																							)
																								setExpandedSubgroupId(
																									sgExpanded
																										? null
																										: sg.subgroupId,
																								);
																						}}
																					>
																						<ChevronDown
																							className={`size-4 shrink-0 text-muted-foreground transition-transform ${sgExpanded ? "" : "-rotate-90"}`}
																						/>
																						<span className="truncate font-medium text-sm">
																							{
																								sg.subgroupName
																							}
																						</span>
																						{sg.description && (
																							<span className="truncate text-muted-foreground text-xs">
																								{
																									sg.description
																								}
																							</span>
																						)}
																						<span className="ml-auto shrink-0 text-muted-foreground text-xs">
																							{
																								sg.userCount
																							}{" "}
																							{sg.userCount ===
																							1
																								? "user"
																								: "users"}
																						</span>
																					</div>
																					{canWrite && (
																						<div className="flex shrink-0 items-center gap-0.5">
																							<Button
																								size="icon"
																								variant="ghost"
																								className="size-7"
																								title="Edit subgroup"
																								onClick={(
																									e,
																								) =>
																									openEditSubgroupModal(
																										sg,
																										e,
																									)
																								}
																							>
																								<Pencil className="size-3.5" />
																							</Button>
																							<Tooltip>
																								<TooltipTrigger
																									asChild
																								>
																									<span>
																										<Button
																											size="icon"
																											variant="ghost"
																											className="size-7 text-muted-foreground hover:text-destructive disabled:pointer-events-none"
																											disabled={
																												sg.userCount >
																												0
																											}
																											onClick={() =>
																												setDeleteSubgroupTarget(
																													sg,
																												)
																											}
																											data-testid={`delete-subgroup-${sg.subgroupId}`}
																										>
																											<Trash2 className="size-3.5" />
																										</Button>
																									</span>
																								</TooltipTrigger>
																								{sg.userCount >
																									0 && (
																									<TooltipContent>
																										{
																											sg.userCount
																										}{" "}
																										{sg.userCount ===
																										1
																											? "user"
																											: "users"}{" "}
																										assigned
																										—
																										remove
																										first
																									</TooltipContent>
																								)}
																							</Tooltip>
																						</div>
																					)}
																				</div>

																				{/* Inline subgroup expanded content */}
																				{sgExpanded && (
																					<div className="border-t px-3 pt-2 pb-3">
																						<Tabs
																							defaultValue="sg-features"
																							className="flex flex-col gap-2"
																						>
																							<TabsList className="w-fit">
																								<TabsTrigger value="sg-features">
																									Features
																								</TabsTrigger>
																								<TabsTrigger value="sg-members">
																									Members
																								</TabsTrigger>
																							</TabsList>
																							<TabsContent
																								value="sg-features"
																								className="flex flex-col gap-1.5"
																							>
																								{subgroupFeatures.length ===
																								0 ? (
																									<p className="text-muted-foreground text-sm">
																										No
																										features
																										defined
																										for
																										this
																										app
																										yet.
																									</p>
																								) : (
																									subgroupFeatures.map(
																										(
																											f,
																										) => (
																											<div
																												key={
																													f.featureId
																												}
																												className="flex items-center justify-between rounded-lg border px-3 py-2.5"
																											>
																												<div>
																													<span className="font-mono text-sm">
																														{
																															f.featureKey
																														}
																													</span>
																													{f.description && (
																														<p className="text-muted-foreground text-xs">
																															{
																																f.description
																															}
																														</p>
																													)}
																												</div>
																												<Switch
																													checked={
																														f.enabled
																													}
																													onCheckedChange={() =>
																														handleToggleSubgroupFeature(
																															f,
																														)
																													}
																													disabled={
																														!canWrite
																													}
																												/>
																											</div>
																										),
																									)
																								)}
																							</TabsContent>
																							<TabsContent
																								value="sg-members"
																								className="flex flex-col gap-2"
																							>
																								<div className="flex items-center justify-between">
																									<p className="text-muted-foreground text-sm">
																										Users
																										assigned
																										to
																										this
																										subgroup.
																									</p>
																									{canWrite && (
																										<Button
																											size="sm"
																											variant="outline"
																											onClick={() =>
																												setShowAssignSubgroupUserModal(
																													true,
																												)
																											}
																											data-testid="assign-subgroup-user-btn"
																										>
																											<UserPlus className="mr-1.5 size-3.5" />
																											Assign
																											User
																										</Button>
																									)}
																								</div>
																								{subgroupUsers.length ===
																								0 ? (
																									<p className="text-muted-foreground text-sm">
																										No
																										users
																										assigned
																										to
																										this
																										subgroup.
																									</p>
																								) : (
																									<Table>
																										<TableHeader>
																											<TableRow>
																												<TableHead>
																													User
																												</TableHead>
																												<TableHead>
																													Assigned
																													By
																												</TableHead>
																												<TableHead>
																													Assigned
																													At
																												</TableHead>
																												{canWrite && (
																													<TableHead className="w-16" />
																												)}
																											</TableRow>
																										</TableHeader>
																										<TableBody>
																											{subgroupUsers.map(
																												(
																													u,
																												) => {
																													const displayName =
																														u.name ||
																														u.userId;
																													const initials =
																														getUserInitials(
																															u.name,
																															u.userId,
																														);
																													return (
																														<TableRow
																															key={
																																u.userId
																															}
																														>
																															<TableCell>
																																<div className="flex items-center gap-2">
																																	<Avatar className="size-7 shrink-0 text-xs">
																																		<AvatarFallback>
																																			{
																																				initials
																																			}
																																		</AvatarFallback>
																																	</Avatar>
																																	<div className="flex min-w-0 flex-col">
																																		<span className="truncate font-medium text-sm">
																																			{
																																				displayName
																																			}
																																		</span>
																																		{u.email && (
																																			<span className="truncate text-muted-foreground text-xs">
																																				{
																																					u.email
																																				}
																																			</span>
																																		)}
																																	</div>
																																</div>
																															</TableCell>
																															<TableCell className="text-muted-foreground text-sm">
																																{u.assignedBy ??
																																	"—"}
																															</TableCell>
																															<TableCell className="text-muted-foreground text-sm">
																																{u.assignedAt
																																	? new Date(
																																			u.assignedAt,
																																		).toLocaleDateString()
																																	: "—"}
																															</TableCell>
																															{canWrite && (
																																<TableCell>
																																	<Button
																																		size="sm"
																																		variant="ghost"
																																		className="text-destructive hover:text-destructive"
																																		data-testid={`remove-subgroup-user-${u.userId}`}
																																		onClick={() =>
																																			setRemoveSubgroupUserTarget(
																																				u,
																																			)
																																		}
																																	>
																																		Remove
																																	</Button>
																																</TableCell>
																															)}
																														</TableRow>
																													);
																												},
																											)}
																										</TableBody>
																									</Table>
																								)}
																							</TabsContent>
																						</Tabs>
																					</div>
																				)}
																			</div>
																		);
																	},
																)}
															</div>
														)}
													</TabsContent>
												</Tabs>
											) : (
												/* Regular profile — Features + Members tabs */
												<Tabs
													defaultValue="features"
													className="flex flex-col gap-3"
												>
													<TabsList className="w-fit">
														<TabsTrigger value="features">
															Features
														</TabsTrigger>
														<TabsTrigger value="members">
															Members
														</TabsTrigger>
													</TabsList>

													<TabsContent
														value="features"
														className="flex flex-col gap-2"
													>
														<div className="flex items-center justify-between">
															<p className="text-muted-foreground text-sm">
																Toggle which
																features are
																enabled for this
																profile.
															</p>
															{canWrite && (
																<Button
																	size="sm"
																	variant="outline"
																	onClick={() =>
																		setShowFeatureModal(
																			true,
																		)
																	}
																>
																	Add Feature
																</Button>
															)}
														</div>
														{features.length ===
														0 ? (
															<p className="text-muted-foreground text-sm">
																No features
																defined for this
																app yet.
															</p>
														) : (
															<div className="flex flex-col gap-1.5">
																{features.map(
																	(f) => (
																		<div
																			key={
																				f.featureId
																			}
																			className="flex items-center justify-between rounded-lg border px-3 py-2.5"
																		>
																			<div>
																				<span className="font-mono text-sm">
																					{
																						f.featureKey
																					}
																				</span>
																				{f.description && (
																					<p className="text-muted-foreground text-xs">
																						{
																							f.description
																						}
																					</p>
																				)}
																			</div>
																			<Switch
																				checked={
																					f.enabled
																				}
																				onCheckedChange={() =>
																					handleToggleFeature(
																						f,
																					)
																				}
																				disabled={
																					!canWrite
																				}
																			/>
																		</div>
																	),
																)}
															</div>
														)}
													</TabsContent>

													<TabsContent
														value="members"
														className="flex flex-col gap-2"
													>
														<div className="flex items-center justify-between">
															<p className="text-muted-foreground text-sm">
																Users explicitly
																assigned to this
																profile.
															</p>
															{canWrite && (
																<Button
																	size="sm"
																	variant="outline"
																	onClick={() =>
																		setShowAssignModal(
																			true,
																		)
																	}
																	data-testid="assign-user-btn"
																>
																	<UserPlus className="mr-1.5 size-3.5" />
																	Assign User
																</Button>
															)}
														</div>
														{profileUsers.length ===
														0 ? (
															<p className="text-muted-foreground text-sm">
																No users
																explicitly
																assigned to this
																profile.
															</p>
														) : (
															<Table>
																<TableHeader>
																	<TableRow>
																		<TableHead>
																			User
																		</TableHead>
																		<TableHead>
																			Assigned
																			By
																		</TableHead>
																		<TableHead>
																			Assigned
																			At
																		</TableHead>
																		{canWrite && (
																			<TableHead className="w-16" />
																		)}
																	</TableRow>
																</TableHeader>
																<TableBody>
																	{profileUsers.map(
																		(u) => {
																			const displayName =
																				u.name ||
																				u.userId;
																			const initials =
																				getUserInitials(
																					u.name,
																					u.userId,
																				);
																			return (
																				<TableRow
																					key={
																						u.userId
																					}
																				>
																					<TableCell>
																						<div className="flex items-center gap-2">
																							<Avatar className="size-7 shrink-0 text-xs">
																								<AvatarFallback>
																									{
																										initials
																									}
																								</AvatarFallback>
																							</Avatar>
																							<div className="flex min-w-0 flex-col">
																								<span className="truncate font-medium text-sm">
																									{
																										displayName
																									}
																								</span>
																								{u.email && (
																									<span className="truncate text-muted-foreground text-xs">
																										{
																											u.email
																										}
																									</span>
																								)}
																							</div>
																						</div>
																					</TableCell>
																					<TableCell className="text-muted-foreground text-sm">
																						{u.assignedBy ??
																							"—"}
																					</TableCell>
																					<TableCell className="text-muted-foreground text-sm">
																						{u.assignedAt
																							? new Date(
																									u.assignedAt,
																								).toLocaleDateString()
																							: "—"}
																					</TableCell>
																					{canWrite && (
																						<TableCell>
																							<Button
																								size="sm"
																								variant="ghost"
																								className="text-destructive hover:text-destructive"
																								data-testid={`remove-user-${u.userId}`}
																								onClick={() =>
																									setRemoveUserTarget(
																										u,
																									)
																								}
																							>
																								Remove
																							</Button>
																						</TableCell>
																					)}
																				</TableRow>
																			);
																		},
																	)}
																</TableBody>
															</Table>
														)}
													</TabsContent>
												</Tabs>
											)}
										</div>
									)}
								</div>
							);
						})}
					</div>
				)}

				{/* ── App Profile Managers dialog ──────────────────────────────── */}
				<Dialog
					open={showManagersDialog}
					onOpenChange={(isOpen) => setShowManagersDialog(isOpen)}
				>
					<DialogContent
						className="max-w-[560px] gap-4 rounded-xl"
						showCloseButton={false}
					>
						<DialogHeader>
							<div className="flex items-center justify-between">
								<div>
									<DialogTitle>Profile Managers</DialogTitle>
									<p className="mt-1 text-muted-foreground text-xs">
										Managers can view profiles and assign
										users, but cannot create profiles,
										features, or subgroups.
									</p>
								</div>
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={() => setShowManagersDialog(false)}
									className="hover:bg-accent"
								>
									<X className="size-4" />
								</Button>
							</div>
						</DialogHeader>
						<ManagersTabContent
							profileManagers={profileManagers}
							onAddManager={() => setShowAddManagerModal(true)}
							onRemoveManager={(m) => setRemoveManagerTarget(m)}
						/>
					</DialogContent>
				</Dialog>

				{/* ── New / Edit Profile modal ─────────────────────────────────── */}
				<Dialog
					open={showProfileModal}
					onOpenChange={(isOpen) => !isOpen && closeProfileModal()}
				>
					<DialogContent
						className="max-w-[480px] gap-6 rounded-xl"
						showCloseButton={false}
					>
						<DialogHeader>
							<div className="flex items-center justify-between">
								<DialogTitle>
									{editingProfile
										? "Edit Profile"
										: "New Profile"}
								</DialogTitle>
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={closeProfileModal}
									className="hover:bg-accent"
								>
									<X className="size-4" />
								</Button>
							</div>
						</DialogHeader>
						<div className="flex flex-col gap-4 pb-2">
							<div className="flex flex-col gap-1.5">
								<Label htmlFor={`${uid}-profile-name`}>
									Name{" "}
									<span className="text-destructive">*</span>
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
								<Label htmlFor={`${uid}-profile-desc`}>
									Description
								</Label>
								<Textarea
									id={`${uid}-profile-desc`}
									placeholder="Optional description"
									value={profileFormDesc}
									onChange={(e) =>
										setProfileFormDesc(e.target.value)
									}
									rows={2}
									className="max-h-[120px] resize-none"
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
									className="cursor-pointer"
								>
									Set as default profile
								</Label>
							</div>
							{!editingProfile && (
								<div className="flex items-center gap-2">
									<Checkbox
										id={`${uid}-profile-isgroup`}
										checked={profileFormIsGroup}
										onCheckedChange={(v) =>
											setProfileFormIsGroup(v === true)
										}
									/>
									<Label
										htmlFor={`${uid}-profile-isgroup`}
										className="cursor-pointer"
									>
										Group profile — contains named
										sub-groups
									</Label>
								</div>
							)}
						</div>
						<DialogFooter>
							<div className="flex flex-row gap-2">
								<Button
									variant="ghost"
									onClick={closeProfileModal}
									disabled={savingProfile}
								>
									Cancel
								</Button>
								<Button
									onClick={handleSaveProfile}
									disabled={
										savingProfile || !profileFormName.trim()
									}
									data-testid="save-profile-btn"
								>
									{savingProfile
										? "Saving…"
										: editingProfile
											? "Update"
											: "Create"}
								</Button>
							</div>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* ── Add Feature modal ────────────────────────────────────────── */}
				<Dialog
					open={showFeatureModal}
					onOpenChange={(isOpen) => !isOpen && closeFeatureModal()}
				>
					<DialogContent
						className="max-w-[480px] gap-6 rounded-xl"
						showCloseButton={false}
					>
						<DialogHeader>
							<div className="flex items-center justify-between">
								<DialogTitle>Add Feature</DialogTitle>
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={closeFeatureModal}
									className="hover:bg-accent"
								>
									<X className="size-4" />
								</Button>
							</div>
						</DialogHeader>
						<div className="flex flex-col gap-4 pb-2">
							<div className="flex flex-col gap-1.5">
								<Label htmlFor={`${uid}-feature-key`}>
									Key{" "}
									<span className="text-destructive">*</span>
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
										setFeatureFormKey(e.target.value);
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
								<Label htmlFor={`${uid}-feature-desc`}>
									Description
								</Label>
								<Textarea
									id={`${uid}-feature-desc`}
									placeholder="Optional description"
									value={featureFormDesc}
									onChange={(e) =>
										setFeatureFormDesc(e.target.value)
									}
									rows={2}
									className="max-h-[120px] resize-none"
								/>
							</div>
						</div>
						<DialogFooter>
							<div className="flex flex-row gap-2">
								<Button
									variant="ghost"
									onClick={closeFeatureModal}
									disabled={savingFeature}
								>
									Cancel
								</Button>
								<Button
									onClick={handleAddFeature}
									disabled={
										savingFeature ||
										!featureFormKey ||
										!!featureKeyError
									}
								>
									{savingFeature ? "Adding…" : "Add"}
								</Button>
							</div>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* ── Assign User modal ────────────────────────────────────────── */}
				<Dialog
					open={showAssignModal}
					onOpenChange={(isOpen) => {
						if (!isOpen) {
							setShowAssignModal(false);
							setAssignUser(null);
						}
					}}
				>
					<DialogContent
						className="max-w-[480px] gap-6 rounded-xl"
						showCloseButton={false}
					>
						<DialogHeader>
							<div className="flex items-center justify-between">
								<DialogTitle>
									Assign User to Profile
								</DialogTitle>
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={() => {
										setShowAssignModal(false);
										setAssignUser(null);
									}}
									className="hover:bg-accent"
								>
									<X className="size-4" />
								</Button>
							</div>
						</DialogHeader>
						<div className="flex flex-col gap-4 pb-2">
							<div className="flex flex-col gap-1.5">
								<Label>
									User{" "}
									<span className="text-destructive">*</span>
								</Label>
								<UserSearchCombobox
									value={assignUser}
									onChange={setAssignUser}
									excludeIds={profileUsers.map(
										(u) => u.userId,
									)}
									data-testid="assign-user-search"
								/>
							</div>
							{selectedProfile && (
								<p className="text-muted-foreground text-sm">
									Assigning to:{" "}
									<span className="font-medium text-foreground">
										{selectedProfile.profileName}
									</span>
								</p>
							)}
						</div>
						<DialogFooter>
							<div className="flex flex-row gap-2">
								<Button
									variant="ghost"
									onClick={() => {
										setShowAssignModal(false);
										setAssignUser(null);
									}}
									disabled={assigningUser}
								>
									Cancel
								</Button>
								<Button
									onClick={handleAssignUser}
									disabled={assigningUser || !assignUser}
									data-testid="confirm-assign-user-btn"
								>
									{assigningUser ? "Assigning…" : "Assign"}
								</Button>
							</div>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* ── Add Manager modal ─────────────────────────────────────────── */}
				<Dialog
					open={showAddManagerModal}
					onOpenChange={(isOpen) => {
						if (!isOpen) {
							setShowAddManagerModal(false);
							setAddManagerUser(null);
						}
					}}
				>
					<DialogContent
						className="max-w-[480px] gap-6 rounded-xl"
						showCloseButton={false}
					>
						<DialogHeader>
							<div className="flex items-center justify-between">
								<DialogTitle>Add Manager</DialogTitle>
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={() => {
										setShowAddManagerModal(false);
										setAddManagerUser(null);
									}}
									className="hover:bg-accent"
								>
									<X className="size-4" />
								</Button>
							</div>
						</DialogHeader>
						<div className="flex flex-col gap-4 pb-2">
							<div className="flex flex-col gap-1.5">
								<Label>
									User{" "}
									<span className="text-destructive">*</span>
								</Label>
								<UserSearchCombobox
									value={addManagerUser}
									onChange={setAddManagerUser}
									excludeIds={profileManagers.map(
										(m) => m.userId,
									)}
									data-testid="add-manager-search"
								/>
							</div>
						</div>
						<DialogFooter>
							<div className="flex flex-row gap-2">
								<Button
									variant="ghost"
									onClick={() => {
										setShowAddManagerModal(false);
										setAddManagerUser(null);
									}}
									disabled={addingManager}
								>
									Cancel
								</Button>
								<Button
									onClick={handleAddManager}
									disabled={addingManager || !addManagerUser}
									data-testid="confirm-add-manager-btn"
								>
									{addingManager ? "Adding…" : "Add"}
								</Button>
							</div>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* ── New / Edit Subgroup modal ────────────────────────────────── */}
				<Dialog
					open={showSubgroupModal}
					onOpenChange={(isOpen) => !isOpen && closeSubgroupModal()}
				>
					<DialogContent
						className="max-w-[480px] gap-6 rounded-xl"
						showCloseButton={false}
					>
						<DialogHeader>
							<div className="flex items-center justify-between">
								<DialogTitle>
									{editingSubgroup
										? "Edit Subgroup"
										: "New Subgroup"}
								</DialogTitle>
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={closeSubgroupModal}
									className="hover:bg-accent"
								>
									<X className="size-4" />
								</Button>
							</div>
						</DialogHeader>
						<div className="flex flex-col gap-4 pb-2">
							<div className="flex flex-col gap-1.5">
								<Label htmlFor={`${uid}-subgroup-name`}>
									Name{" "}
									<span className="text-destructive">*</span>
								</Label>
								<Input
									id={`${uid}-subgroup-name`}
									placeholder="e.g. admins, read-only"
									value={subgroupFormName}
									onChange={(e) =>
										setSubgroupFormName(e.target.value)
									}
									maxLength={100}
									autoFocus
								/>
							</div>
							<div className="flex flex-col gap-1.5">
								<Label htmlFor={`${uid}-subgroup-desc`}>
									Description
								</Label>
								<Textarea
									id={`${uid}-subgroup-desc`}
									placeholder="Optional description"
									value={subgroupFormDesc}
									onChange={(e) =>
										setSubgroupFormDesc(e.target.value)
									}
									rows={2}
									className="max-h-[120px] resize-none"
								/>
							</div>
						</div>
						<DialogFooter>
							<div className="flex flex-row gap-2">
								<Button
									variant="ghost"
									onClick={closeSubgroupModal}
									disabled={savingSubgroup}
								>
									Cancel
								</Button>
								<Button
									onClick={handleSaveSubgroup}
									disabled={
										savingSubgroup ||
										!subgroupFormName.trim()
									}
									data-testid="save-subgroup-btn"
								>
									{savingSubgroup
										? "Saving…"
										: editingSubgroup
											? "Update"
											: "Create"}
								</Button>
							</div>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* ── Assign User to Subgroup modal ────────────────────────────── */}
				<Dialog
					open={showAssignSubgroupUserModal}
					onOpenChange={(isOpen) => {
						if (!isOpen) {
							setShowAssignSubgroupUserModal(false);
							setAssignSubgroupUser(null);
						}
					}}
				>
					<DialogContent
						className="max-w-[480px] gap-6 rounded-xl"
						showCloseButton={false}
					>
						<DialogHeader>
							<div className="flex items-center justify-between">
								<DialogTitle>
									Assign User to Subgroup
								</DialogTitle>
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={() => {
										setShowAssignSubgroupUserModal(false);
										setAssignSubgroupUser(null);
									}}
									className="hover:bg-accent"
								>
									<X className="size-4" />
								</Button>
							</div>
						</DialogHeader>
						<div className="flex flex-col gap-4 pb-2">
							<div className="flex flex-col gap-1.5">
								<Label>
									User{" "}
									<span className="text-destructive">*</span>
								</Label>
								<UserSearchCombobox
									value={assignSubgroupUser}
									onChange={setAssignSubgroupUser}
									excludeIds={subgroupUsers.map(
										(u) => u.userId,
									)}
									data-testid="assign-subgroup-user-search"
								/>
							</div>
							{expandedSubgroup && (
								<p className="text-muted-foreground text-sm">
									Assigning to:{" "}
									<span className="font-medium text-foreground">
										{expandedSubgroup.subgroupName}
									</span>
								</p>
							)}
						</div>
						<DialogFooter>
							<div className="flex flex-row gap-2">
								<Button
									variant="ghost"
									onClick={() => {
										setShowAssignSubgroupUserModal(false);
										setAssignSubgroupUser(null);
									}}
									disabled={assigningSubgroupUser}
								>
									Cancel
								</Button>
								<Button
									onClick={handleAssignSubgroupUser}
									disabled={
										assigningSubgroupUser ||
										!assignSubgroupUser
									}
									data-testid="confirm-assign-subgroup-user-btn"
								>
									{assigningSubgroupUser
										? "Assigning…"
										: "Assign"}
								</Button>
							</div>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* ── Delete profile confirmation ──────────────────────────────── */}
				<Dialog
					open={!!deleteProfileTarget}
					onOpenChange={(open) =>
						!open && setDeleteProfileTarget(null)
					}
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
								data-testid="confirm-delete-profile-btn"
							>
								{confirmLoading ? "Deleting…" : "Delete"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* ── Remove user confirmation ─────────────────────────────────── */}
				<Dialog
					open={!!removeUserTarget}
					onOpenChange={(open) => !open && setRemoveUserTarget(null)}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Remove User</DialogTitle>
							<DialogDescription>
								Remove &quot;
								{removeUserTarget?.name ||
									removeUserTarget?.userId}
								&quot; from this profile? They will be removed
								from this profile assignment. They may still be
								in other profiles.
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

				{/* ── Remove manager confirmation ──────────────────────────────── */}
				<Dialog
					open={!!removeManagerTarget}
					onOpenChange={(open) =>
						!open && setRemoveManagerTarget(null)
					}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Remove Manager</DialogTitle>
							<DialogDescription>
								Remove &quot;
								{removeManagerTarget?.name ||
									removeManagerTarget?.userId}
								&quot; as a profile manager?
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button
								variant="ghost"
								onClick={() => setRemoveManagerTarget(null)}
								disabled={confirmLoading}
							>
								Cancel
							</Button>
							<Button
								variant="destructive"
								onClick={confirmRemoveManager}
								disabled={confirmLoading}
								data-testid="confirm-remove-manager-btn"
							>
								{confirmLoading ? "Removing…" : "Remove"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* ── Delete subgroup confirmation ─────────────────────────────── */}
				<Dialog
					open={!!deleteSubgroupTarget}
					onOpenChange={(open) =>
						!open && setDeleteSubgroupTarget(null)
					}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Delete Subgroup</DialogTitle>
							<DialogDescription>
								Delete subgroup &quot;
								{deleteSubgroupTarget?.subgroupName}&quot;? This
								cannot be undone.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button
								variant="ghost"
								onClick={() => setDeleteSubgroupTarget(null)}
								disabled={confirmLoading}
							>
								Cancel
							</Button>
							<Button
								variant="destructive"
								onClick={confirmDeleteSubgroup}
								disabled={confirmLoading}
								data-testid="confirm-delete-subgroup-btn"
							>
								{confirmLoading ? "Deleting…" : "Delete"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* ── Remove subgroup user confirmation ───────────────────────── */}
				<Dialog
					open={!!removeSubgroupUserTarget}
					onOpenChange={(open) =>
						!open && setRemoveSubgroupUserTarget(null)
					}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Remove User from Subgroup</DialogTitle>
							<DialogDescription>
								Remove &quot;
								{removeSubgroupUserTarget?.name ||
									removeSubgroupUserTarget?.userId}
								&quot; from this subgroup? They will be removed
								from this subgroup assignment. They may still be
								in other profiles.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button
								variant="ghost"
								onClick={() =>
									setRemoveSubgroupUserTarget(null)
								}
								disabled={confirmLoading}
							>
								Cancel
							</Button>
							<Button
								variant="destructive"
								onClick={confirmRemoveSubgroupUser}
								disabled={confirmLoading}
								data-testid="confirm-remove-subgroup-user-btn"
							>
								{confirmLoading ? "Removing…" : "Remove"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
		);
	},
);

/* ── ManagersTabContent ─────────────────────────────────────────────────── */

interface ManagersTabContentProps {
	profileManagers: ProfileManager[];
	onAddManager: () => void;
	onRemoveManager: (m: ProfileManager) => void;
}

function ManagersTabContent({
	profileManagers,
	onAddManager,
	onRemoveManager,
}: ManagersTabContentProps) {
	return (
		<>
			<div className="flex items-center justify-between">
				<p className="text-muted-foreground text-sm">
					Users who can manage profile assignments.
				</p>
				<Button
					size="sm"
					variant="outline"
					onClick={onAddManager}
					data-testid="add-manager-btn"
				>
					<UserPlus className="mr-1.5 size-3.5" />
					Add Manager
				</Button>
			</div>

			{profileManagers.length === 0 ? (
				<p className="text-muted-foreground text-sm">
					No managers assigned to this profile.
				</p>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>User</TableHead>
							<TableHead>Permission</TableHead>
							<TableHead className="w-16">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{profileManagers.map((m) => {
							const displayName = m.name || m.userId;
							const initials = displayName
								.split(" ")
								.map((w) => w[0])
								.join("")
								.toUpperCase()
								.slice(0, 2);
							return (
								<TableRow key={m.userId}>
									<TableCell>
										<div className="flex items-center gap-2">
											<Avatar className="size-7 shrink-0 text-xs">
												<AvatarFallback>
													{initials}
												</AvatarFallback>
											</Avatar>
											<div className="flex min-w-0 flex-col">
												<span className="truncate font-medium text-sm">
													{displayName}
												</span>
												{m.email && (
													<span className="truncate text-muted-foreground text-xs">
														{m.email}
													</span>
												)}
											</div>
										</div>
									</TableCell>
									<TableCell className="text-muted-foreground text-sm">
										{m.permission}
									</TableCell>
									<TableCell>
										<Button
											size="sm"
											variant="ghost"
											className="text-destructive hover:text-destructive"
											data-testid={`remove-manager-${m.userId}`}
											onClick={() => onRemoveManager(m)}
										>
											Remove
										</Button>
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			)}
		</>
	);
}
