import {
	Info,
	Pencil,
	Plus,
	Search,
	Trash2,
	UserPlus,
	Users,
	X,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useId, useRef, useState } from "react";
import { useDebouncedValue } from "@semoss/sdk/react";
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
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import type { AdminUser } from "@/api/auth";
import { searchAllUsers } from "@/api/auth";
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

type AssignTarget =
	| { type: "profile"; profileId: string; profileName: string }
	| { type: "subgroup"; subgroupId: string; subgroupName: string };

const escapePixelString = (s: string) => s.replaceAll("'", "\\'");

function validateFeatureKey(key: string): boolean {
	return /^[a-zA-Z0-9-]+$/.test(key) && key.length <= 100;
}

export const AppProfiles = observer(
	({ appId, permission }: AppProfilesProps) => {
		const { monolithStore } = useRootStore();
		const uid = useId();
		// Authors and editors both pass canManageProfiles on the backend —
		// they can grant/revoke managers and list the manager table.
		const canManageManagers =
			permission === "author" || permission === "editor";
		// readOnly users who were granted via AddAppProfileManager are detected
		// via a silent probe (see useEffect below); this flag is set when it succeeds.
		const [readOnlyManagerConfirmed, setReadOnlyManagerConfirmed] =
			useState(false);
		const canWrite = canManageManagers || readOnlyManagerConfirmed;
		// isManager drives the "Profile Manager Access" banner: only for explicitly
		// granted non-owner managers (i.e., the probe succeeded).
		const isManager = readOnlyManagerConfirmed;

		// Data
		const [profiles, setProfiles] = useState<Profile[]>([]);
		const [selectedProfile, setSelectedProfile] = useState<Profile | null>(
			null,
		);
		const [features, setFeatures] = useState<Feature[]>([]);
		const [profileUsers, setProfileUsers] = useState<ProfileUser[]>([]);
		const [subgroups, setSubgroups] = useState<Subgroup[]>([]);
		const [subgroupFeatures, setSubgroupFeatures] = useState<Feature[]>([]);
		const [subgroupUsers, setSubgroupUsers] = useState<SubgroupUser[]>([]);
		const [profileManagers, setProfileManagers] = useState<
			ProfileManager[]
		>([]);

		// Search / filter
		const [profileSearch, setProfileSearch] = useState("");
		const [memberSearch, setMemberSearch] = useState("");
		const [subgroupMemberSearch, setSubgroupMemberSearch] = useState("");

		// Profile CRUD modal
		const [showProfileModal, setShowProfileModal] = useState(false);
		const [editingProfile, setEditingProfile] = useState<Profile | null>(
			null,
		);
		const [profileFormName, setProfileFormName] = useState("");
		const [profileFormDesc, setProfileFormDesc] = useState("");
		const [profileFormDefault, setProfileFormDefault] = useState(false);
		const [profileFormIsGroup, setProfileFormIsGroup] = useState(false);
		const [savingProfile, setSavingProfile] = useState(false);

		// Feature CRUD
		const [showFeatureModal, setShowFeatureModal] = useState(false);
		const [featureFormKey, setFeatureFormKey] = useState("");
		const [featureFormDesc, setFeatureFormDesc] = useState("");
		const [featureKeyError, setFeatureKeyError] = useState("");
		const [savingFeature, setSavingFeature] = useState(false);
		const [deleteFeatureTarget, setDeleteFeatureTarget] =
			useState<Feature | null>(null);

		// Subgroup CRUD
		const [configureSubgroupId, setConfigureSubgroupId] = useState<
			string | null
		>(null);
		const [showSubgroupModal, setShowSubgroupModal] = useState(false);
		const [editingSubgroup, setEditingSubgroup] = useState<Subgroup | null>(
			null,
		);
		const [subgroupFormName, setSubgroupFormName] = useState("");
		const [subgroupFormDesc, setSubgroupFormDesc] = useState("");
		const [savingSubgroup, setSavingSubgroup] = useState(false);
		const [deleteSubgroupTarget, setDeleteSubgroupTarget] =
			useState<Subgroup | null>(null);

		// Unified assign users modal (profile + subgroup)
		const [assignTarget, setAssignTarget] = useState<AssignTarget | null>(
			null,
		);
		const [selectedUsers, setSelectedUsers] = useState<AdminUser[]>([]);
		const [assignSearch, setAssignSearch] = useState("");
		const [assignResults, setAssignResults] = useState<AdminUser[]>([]);
		const [assignSearching, setAssignSearching] = useState(false);
		const [assigningUsers, setAssigningUsers] = useState(false);
		const assignFetchVersionRef = useRef(0);
		const debouncedAssignSearch = useDebouncedValue(assignSearch, 300);

		// Managers
		const [showManagersDialog, setShowManagersDialog] = useState(false);
		const [showAddManagerModal, setShowAddManagerModal] = useState(false);
		const [addManagerUser, setAddManagerUser] = useState<AdminUser | null>(
			null,
		);
		const [addingManager, setAddingManager] = useState(false);
		const [removeManagerTarget, setRemoveManagerTarget] =
			useState<ProfileManager | null>(null);

		// Confirmations
		const [deleteProfileTarget, setDeleteProfileTarget] =
			useState<Profile | null>(null);
		const [removeUserTarget, setRemoveUserTarget] =
			useState<ProfileUser | null>(null);
		const [removeSubgroupUserTarget, setRemoveSubgroupUserTarget] =
			useState<SubgroupUser | null>(null);
		const [confirmLoading, setConfirmLoading] = useState(false);

		// Computed
		const configureSubgroup =
			subgroups.find((sg) => sg.subgroupId === configureSubgroupId) ??
			null;

		const filteredProfiles = profileSearch.trim()
			? profiles.filter((p) =>
					p.profileName
						.toLowerCase()
						.includes(profileSearch.trim().toLowerCase()),
				)
			: profiles;

		const filteredMembers = memberSearch.trim()
			? profileUsers.filter((u) => {
					const term = memberSearch.trim().toLowerCase();
					return (
						(u.name || u.userId).toLowerCase().includes(term) ||
						(u.email || "").toLowerCase().includes(term)
					);
				})
			: profileUsers;

		const filteredSubgroupMembers = subgroupMemberSearch.trim()
			? subgroupUsers.filter((u) => {
					const term = subgroupMemberSearch.trim().toLowerCase();
					return (
						(u.name || u.userId).toLowerCase().includes(term) ||
						(u.email || "").toLowerCase().includes(term)
					);
				})
			: subgroupUsers;

		// biome-ignore lint/correctness/useExhaustiveDependencies: loaders defined in component scope
		useEffect(() => {
			// Reset readOnly manager probe whenever the app or permission changes.
			setReadOnlyManagerConfirmed(false);
			// Wait for the async permission fetch (layout sets it from "" to the real value).
			if (!permission) return;
			if (permission === "author" || permission === "editor") {
				loadProfiles();
			} else {
				// GetAppProfiles requires canAssignProfiles — probe silently. If it
				// succeeds the user is a profile manager despite their lower app
				// permission level; if it fails they're a regular viewer.
				runPixel<Profile[]>(
					`GetAppProfiles(app="${appId}");`,
					true,
				).then((result) => {
					if (result !== null) {
						setProfiles(result);
						setReadOnlyManagerConfirmed(true);
					}
				});
			}
		}, [appId, permission]);

		// biome-ignore lint/correctness/useExhaustiveDependencies: loaders defined in component scope
		useEffect(() => {
			// Refresh managers list every time the dialog opens so it's always current,
			// even if the async permission fetch hadn't resolved at mount time.
			if (showManagersDialog) loadProfileManagers();
		}, [showManagersDialog]);

		// biome-ignore lint/correctness/useExhaustiveDependencies: loaders defined in component scope
		useEffect(() => {
			setFeatures([]);
			setProfileUsers([]);
			setSubgroups([]);
			setConfigureSubgroupId(null);
			setMemberSearch("");

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

		// biome-ignore lint/correctness/useExhaustiveDependencies: loaders defined in component scope
		useEffect(() => {
			setSubgroupFeatures([]);
			setSubgroupUsers([]);
			setSubgroupMemberSearch("");
			if (configureSubgroupId) {
				loadSubgroupFeatures(configureSubgroupId);
				loadSubgroupUsers(configureSubgroupId);
			}
		}, [configureSubgroupId]);

		useEffect(() => {
			if (!assignTarget) return;
			const version = ++assignFetchVersionRef.current;
			setAssignSearching(true);
			const excludeIds = new Set(
				assignTarget.type === "profile"
					? profileUsers.map((u) => u.userId)
					: subgroupUsers.map((u) => u.userId),
			);
			searchAllUsers(debouncedAssignSearch, 20, 0)
				.then((results) => {
					if (assignFetchVersionRef.current !== version) return;
					setAssignResults(
						results.filter((u) => !excludeIds.has(u.id)),
					);
				})
				.catch(() => {
					if (assignFetchVersionRef.current === version)
						setAssignResults([]);
				})
				.finally(() => {
					if (assignFetchVersionRef.current === version)
						setAssignSearching(false);
				});
		}, [assignTarget, debouncedAssignSearch, profileUsers, subgroupUsers]);

		async function runPixel<T = unknown>(
			pixel: string,
			silent = false,
		): Promise<T | null> {
			const response = await monolithStore.runQuery(pixel);
			const { operationType, output } = response.pixelReturn[0];
			if (operationType.indexOf("ERROR") > -1) {
				if (!silent)
					toast.error(
						typeof output === "string"
							? output
							: "Operation failed.",
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

		function toggleUserSelected(user: AdminUser) {
			setSelectedUsers((prev) =>
				prev.find((u) => u.id === user.id)
					? prev.filter((u) => u.id !== user.id)
					: [...prev, user],
			);
		}

		function closeAssignModal() {
			setAssignTarget(null);
			setSelectedUsers([]);
			setAssignSearch("");
			setAssignResults([]);
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
				if (configureSubgroupId)
					await loadSubgroupFeatures(configureSubgroupId);
				closeFeatureModal();
			} finally {
				setSavingFeature(false);
			}
		}

		async function confirmDeleteFeature() {
			if (!deleteFeatureTarget) return;
			setConfirmLoading(true);
			try {
				await runPixel(
					`DeleteAppFeature(app="${appId}", featureId="${deleteFeatureTarget.featureId}");`,
				);
				if (selectedProfile)
					await loadProfileFeatures(selectedProfile.profileId);
				if (configureSubgroupId)
					await loadSubgroupFeatures(configureSubgroupId);
				setDeleteFeatureTarget(null);
			} finally {
				setConfirmLoading(false);
			}
		}

		async function handleAssignUsers() {
			if (selectedUsers.length === 0 || !assignTarget) return;
			setAssigningUsers(true);
			try {
				const userList = selectedUsers
					.map((u) => `"${escapePixelString(u.id)}"`)
					.join(", ");
				if (assignTarget.type === "profile") {
					await runPixel(
						`AssignAppUserProfile(app="${appId}", userId=[${userList}], profileId="${assignTarget.profileId}");`,
					);
					await Promise.all([
						loadProfileUsers(assignTarget.profileId),
						loadProfiles(),
					]);
				} else {
					await runPixel(
						`AssignAppUserSubgroup(app="${appId}", userId=[${userList}], subgroupId="${assignTarget.subgroupId}");`,
					);
					await Promise.all([
						loadSubgroupUsers(assignTarget.subgroupId),
						selectedProfile
							? loadSubgroups(selectedProfile.profileId)
							: Promise.resolve(),
						loadProfiles(),
					]);
				}
				closeAssignModal();
			} finally {
				setAssigningUsers(false);
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
			if (!configureSubgroup) return;
			await runPixel(
				`SetAppSubgroupFeature(app="${appId}", subgroupId="${configureSubgroup.subgroupId}", featureId="${feature.featureId}", enabled="${!feature.enabled}");`,
			);
			await loadSubgroupFeatures(configureSubgroup.subgroupId);
		}

		async function confirmRemoveSubgroupUser() {
			if (!removeSubgroupUserTarget || !configureSubgroup) return;
			setConfirmLoading(true);
			try {
				await runPixel(
					`RemoveAppUserSubgroup(app="${appId}", userId="${removeSubgroupUserTarget.userId}", subgroupId="${configureSubgroup.subgroupId}");`,
				);
				await Promise.all([
					loadSubgroupUsers(configureSubgroup.subgroupId),
					selectedProfile
						? loadSubgroups(selectedProfile.profileId)
						: Promise.resolve(),
					loadProfiles(),
				]);
				setRemoveSubgroupUserTarget(null);
			} finally {
				setConfirmLoading(false);
			}
		}

		return (
			<div className="flex w-full flex-col gap-4">
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
						{canManageManagers && (
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
						{canManageManagers && (
							<Button
								size="sm"
								variant="outline"
								onClick={openNewProfileModal}
								data-testid="new-profile-btn"
							>
								<Plus className="mr-1.5 size-3.5" />
								New Profile
							</Button>
						)}
					</div>
				</div>

				{/* Manager access banner */}
				{isManager && (
					<div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
						<Info className="mt-0.5 size-4 shrink-0" />
						<div className="flex flex-col gap-0.5">
							<span className="font-medium text-sm">
								Profile Manager Access
							</span>
							<span className="text-xs opacity-80">
								You can manage profiles, features, subgroups,
								and member assignments. Contact the app owner to
								add or remove other profile managers.
							</span>
						</div>
					</div>
				)}

				{/* Master-detail */}
				{profiles.length === 0 ? (
					<div className="flex flex-col items-center gap-4 rounded-lg border border-dashed py-16 text-center">
						<p className="text-muted-foreground text-sm">
							No profiles defined yet.
						</p>
						{canManageManagers && (
							<Button size="sm" onClick={openNewProfileModal}>
								New Profile
							</Button>
						)}
					</div>
				) : (
					<div
						className="flex overflow-hidden rounded-xl border"
						style={{ minHeight: 480 }}
					>
						{/* Left rail — profile list */}
						<div className="flex w-[240px] shrink-0 flex-col border-r">
							<div className="border-b p-3">
								<div className="relative">
									<Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-3.5 text-muted-foreground" />
									<Input
										value={profileSearch}
										onChange={(e) =>
											setProfileSearch(e.target.value)
										}
										placeholder="Search profiles"
										className="h-8 pl-8 text-sm"
									/>
								</div>
							</div>
							<div className="flex-1 overflow-y-auto">
								{filteredProfiles.length === 0 ? (
									<p className="p-4 text-center text-muted-foreground text-xs">
										No profiles match &ldquo;{profileSearch}
										&rdquo;
									</p>
								) : (
									filteredProfiles.map((p) => {
										const isSelected =
											selectedProfile?.profileId ===
											p.profileId;
										return (
											<button
												key={p.profileId}
												type="button"
												className={`flex w-full flex-col gap-0.5 border-l-2 px-3 py-2.5 text-left transition-colors hover:bg-accent ${
													isSelected
														? "border-primary bg-accent"
														: "border-transparent"
												}`}
												onClick={() =>
													setSelectedProfile(
														isSelected ? null : p,
													)
												}
											>
												<div className="flex min-w-0 items-center gap-1.5">
													<span
														className={`truncate text-sm ${isSelected ? "font-semibold" : "font-medium"}`}
													>
														{p.profileName}
													</span>
												</div>
												<div className="flex items-center gap-1.5">
													{p.isGroup && (
														<Badge
															variant="outline"
															className="h-4 px-1.5 py-0 text-xs"
														>
															Group
														</Badge>
													)}
													{p.isDefault && (
														<Badge
															variant="secondary"
															className="h-4 px-1.5 py-0 text-xs"
														>
															Default
														</Badge>
													)}
													<span className="text-muted-foreground text-xs">
														{p.userCount}{" "}
														{p.userCount === 1
															? "user"
															: "users"}
													</span>
												</div>
											</button>
										);
									})
								)}
							</div>
						</div>

						{/* Right detail panel */}
						<div className="flex flex-1 flex-col overflow-hidden">
							{selectedProfile ? (
								<>
									{/* Profile header */}
									<div className="flex items-start justify-between gap-4 border-b px-5 py-4">
										<div className="flex min-w-0 flex-col gap-1">
											<div className="flex items-center gap-2">
												<span className="font-semibold text-lg">
													{
														selectedProfile.profileName
													}
												</span>
												{selectedProfile.isGroup && (
													<Badge variant="outline">
														Group
													</Badge>
												)}
												{selectedProfile.isDefault && (
													<Badge variant="secondary">
														Default
													</Badge>
												)}
											</div>
											{selectedProfile.description && (
												<p className="text-muted-foreground text-sm">
													{
														selectedProfile.description
													}
												</p>
											)}
										</div>
										{canManageManagers && (
											<div className="flex shrink-0 items-center gap-1.5">
												<Button
													variant="outline"
													size="sm"
													className="gap-1.5"
													onClick={(e) =>
														openEditProfileModal(
															selectedProfile,
															e,
														)
													}
													data-testid="edit-profile-btn"
												>
													<Pencil className="size-3.5" />
													Edit
												</Button>
												<Button
													variant="ghost"
													size="sm"
													className="gap-1.5 text-destructive hover:text-destructive"
													onClick={() =>
														setDeleteProfileTarget(
															selectedProfile,
														)
													}
													data-testid="delete-profile-btn"
												>
													<Trash2 className="size-3.5" />
													Delete
												</Button>
											</div>
										)}
									</div>

									{/* Tabs */}
									<div className="flex-1 overflow-y-auto p-5">
										<Tabs
											key={selectedProfile.profileId}
											defaultValue="features"
											className="flex flex-col gap-4"
										>
											<TabsList className="w-fit">
												<TabsTrigger value="features">
													Features
												</TabsTrigger>
												{selectedProfile.isGroup ? (
													<TabsTrigger value="subgroups">
														Subgroups
													</TabsTrigger>
												) : (
													<TabsTrigger value="members">
														Members
														{selectedProfile.userCount >
															0 && (
															<span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">
																{
																	selectedProfile.userCount
																}
															</span>
														)}
													</TabsTrigger>
												)}
											</TabsList>

											{/* Features tab */}
											<TabsContent
												value="features"
												className="flex flex-col gap-3"
											>
												<div className="flex items-center justify-between">
													<p className="text-muted-foreground text-sm">
														Toggle which features
														are enabled for this
														profile.
													</p>
													{canWrite && (
														<Button
															size="sm"
															variant="outline"
															className="gap-1.5"
															onClick={() =>
																setShowFeatureModal(
																	true,
																)
															}
															data-testid="add-feature-btn"
														>
															<Plus className="size-3.5" />
															Add Feature
														</Button>
													)}
												</div>
												{features.length === 0 ? (
													<p className="text-muted-foreground text-sm">
														No features defined for
														this app yet.
													</p>
												) : (
													<div className="flex flex-col gap-1.5">
														{features.map((f) => (
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
																<div className="flex items-center gap-2">
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
																	{canWrite && (
																		<Button
																			size="icon"
																			variant="ghost"
																			className="size-7 text-muted-foreground hover:text-destructive"
																			onClick={() =>
																				setDeleteFeatureTarget(
																					f,
																				)
																			}
																			data-testid={`delete-feature-${f.featureId}`}
																		>
																			<Trash2 className="size-3.5" />
																		</Button>
																	)}
																</div>
															</div>
														))}
													</div>
												)}
											</TabsContent>

											{/* Members tab — regular profiles */}
											<TabsContent value="members">
												<div className="w-full rounded-xl border">
													<div className="flex flex-col gap-2 rounded-t-xl border-b bg-muted p-3">
														<div className="flex items-center gap-2">
															<InputGroup className="flex-1 bg-background">
																<InputGroupInput
																	placeholder="Search members"
																	value={
																		memberSearch
																	}
																	onChange={(
																		e: React.ChangeEvent<HTMLInputElement>,
																	) =>
																		setMemberSearch(
																			e
																				.target
																				.value,
																		)
																	}
																/>
																<InputGroupAddon>
																	<Search className="size-4" />
																</InputGroupAddon>
															</InputGroup>
															{canWrite && (
																<Button
																	size="sm"
																	onClick={() =>
																		setAssignTarget(
																			{
																				type: "profile",
																				profileId:
																					selectedProfile.profileId,
																				profileName:
																					selectedProfile.profileName,
																			},
																		)
																	}
																	data-testid="assign-user-btn"
																>
																	<UserPlus className="mr-1.5 size-3.5" />
																	Assign User
																</Button>
															)}
														</div>
													</div>
													<div className="max-h-[400px] overflow-y-auto">
														<Table>
															<TableHeader className="sticky top-0 z-10 bg-background">
																<TableRow>
																	<TableHead>
																		Name
																	</TableHead>
																	<TableHead>
																		Assigned
																		By
																	</TableHead>
																	<TableHead>
																		Assigned
																		Date
																	</TableHead>
																	<TableHead className="w-px whitespace-nowrap">
																		Actions
																	</TableHead>
																</TableRow>
															</TableHeader>
															<TableBody>
																{filteredMembers.length >
																0 ? (
																	filteredMembers.map(
																		(u) => {
																			const displayName =
																				u.name ||
																				u.userId;
																			return (
																				<TableRow
																					key={
																						u.userId
																					}
																				>
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
																									{
																										u.userId
																									}
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
																					<TableCell>
																						<Button
																							type="button"
																							variant="outline"
																							size="icon-sm"
																							className="border-none"
																							data-testid={`remove-user-${u.userId}`}
																							onClick={() =>
																								setRemoveUserTarget(
																									u,
																								)
																							}
																						>
																							<Trash2 className="size-4" />
																						</Button>
																					</TableCell>
																				</TableRow>
																			);
																		},
																	)
																) : (
																	<TableRow>
																		<TableCell
																			colSpan={
																				4
																			}
																			className="text-center"
																		>
																			{memberSearch ? (
																				`No members match "${memberSearch}"`
																			) : (
																				<Muted>
																					No
																					members
																					assigned
																					yet.
																				</Muted>
																			)}
																		</TableCell>
																	</TableRow>
																)}
															</TableBody>
														</Table>
													</div>
													<p className="mt-2 px-4 pb-3 text-end text-muted-foreground text-sm">
														{filteredMembers.length}{" "}
														of {profileUsers.length}{" "}
														{profileUsers.length ===
														1
															? "member"
															: "members"}
													</p>
												</div>
											</TabsContent>

											{/* Subgroups tab — group profiles */}
											<TabsContent
												value="subgroups"
												className="flex flex-col gap-3"
											>
												<div className="flex items-center justify-between">
													<p className="text-muted-foreground text-sm">
														Subgroups within this
														group profile.
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
												{subgroups.length === 0 ? (
													<p className="text-muted-foreground text-sm">
														No subgroups defined
														yet.
													</p>
												) : (
													<div className="flex flex-col gap-2">
														{subgroups.map((sg) => (
															<div
																key={
																	sg.subgroupId
																}
																className="flex items-center justify-between rounded-lg border px-4 py-3"
															>
																<div className="flex min-w-0 flex-col gap-0.5">
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
																	<span className="text-muted-foreground text-xs">
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
																	<div className="ml-3 flex shrink-0 items-center gap-1.5">
																		<Button
																			size="sm"
																			variant="outline"
																			onClick={() =>
																				setConfigureSubgroupId(
																					sg.subgroupId,
																				)
																			}
																			data-testid={`configure-subgroup-${sg.subgroupId}`}
																		>
																			Configure
																		</Button>
																		<Button
																			size="icon"
																			variant="ghost"
																			className="size-8 text-muted-foreground hover:text-foreground"
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
																						className="size-8 text-muted-foreground hover:text-destructive disabled:pointer-events-none"
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
														))}
													</div>
												)}
											</TabsContent>
										</Tabs>
									</div>
								</>
							) : (
								<div className="flex flex-1 items-center justify-center">
									<div className="flex flex-col items-center gap-2 text-center">
										<p className="font-medium text-sm">
											Select a profile
										</p>
										<p className="max-w-xs text-muted-foreground text-xs">
											Choose a profile from the list to
											view and edit its features and
											members.
										</p>
									</div>
								</div>
							)}
						</div>
					</div>
				)}

				{/* ── Configure Subgroup dialog ─────────────────────────────────── */}
				<Dialog
					open={!!configureSubgroupId}
					onOpenChange={(open) =>
						!open && setConfigureSubgroupId(null)
					}
				>
					<DialogContent
						className="flex max-h-[90vh] w-full max-w-2xl flex-col gap-4 overflow-hidden"
						showCloseButton={false}
					>
						<DialogHeader>
							<div className="flex items-center justify-between">
								<div>
									<DialogTitle>
										{configureSubgroup?.subgroupName ??
											"Subgroup"}
									</DialogTitle>
									{configureSubgroup?.description && (
										<p className="mt-0.5 text-muted-foreground text-sm">
											{configureSubgroup.description}
										</p>
									)}
								</div>
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={() => setConfigureSubgroupId(null)}
									className="hover:bg-accent"
								>
									<X className="size-4" />
								</Button>
							</div>
						</DialogHeader>

						<Tabs
							defaultValue="sg-features"
							className="flex flex-col gap-3 overflow-hidden"
						>
							<TabsList className="w-fit">
								<TabsTrigger value="sg-features">
									Features
								</TabsTrigger>
								<TabsTrigger value="sg-members">
									Members
									{configureSubgroup &&
										configureSubgroup.userCount > 0 && (
											<span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">
												{configureSubgroup.userCount}
											</span>
										)}
								</TabsTrigger>
							</TabsList>

							<TabsContent
								value="sg-features"
								className="flex flex-col gap-3"
							>
								<div className="flex items-center justify-between">
									<p className="text-muted-foreground text-sm">
										Features enabled for members of this
										subgroup.
									</p>
									{canWrite && (
										<Button
											size="sm"
											variant="outline"
											className="gap-1.5"
											onClick={() =>
												setShowFeatureModal(true)
											}
										>
											<Plus className="size-3.5" />
											Add Feature
										</Button>
									)}
								</div>
								{subgroupFeatures.length === 0 ? (
									<p className="text-muted-foreground text-sm">
										No features defined for this app yet.
									</p>
								) : (
									<div className="flex max-h-[300px] flex-col gap-1.5 overflow-y-auto">
										{subgroupFeatures.map((f) => (
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
												<div className="flex items-center gap-2">
													<Switch
														checked={f.enabled}
														onCheckedChange={() =>
															handleToggleSubgroupFeature(
																f,
															)
														}
														disabled={!canWrite}
													/>
													{canWrite && (
														<Button
															size="icon"
															variant="ghost"
															className="size-7 text-muted-foreground hover:text-destructive"
															onClick={() =>
																setDeleteFeatureTarget(
																	f,
																)
															}
														>
															<Trash2 className="size-3.5" />
														</Button>
													)}
												</div>
											</div>
										))}
									</div>
								)}
							</TabsContent>

							<TabsContent
								value="sg-members"
								className="overflow-hidden"
							>
								<div className="w-full rounded-xl border">
									<div className="flex flex-col gap-2 rounded-t-xl border-b bg-muted p-3">
										<div className="flex items-center gap-2">
											<InputGroup className="flex-1 bg-background">
												<InputGroupInput
													placeholder="Search members"
													value={subgroupMemberSearch}
													onChange={(
														e: React.ChangeEvent<HTMLInputElement>,
													) =>
														setSubgroupMemberSearch(
															e.target.value,
														)
													}
												/>
												<InputGroupAddon>
													<Search className="size-4" />
												</InputGroupAddon>
											</InputGroup>
											{canWrite &&
												configureSubgroupId && (
													<Button
														size="sm"
														onClick={() =>
															setAssignTarget({
																type: "subgroup",
																subgroupId:
																	configureSubgroupId,
																subgroupName:
																	configureSubgroup?.subgroupName ??
																	"",
															})
														}
														data-testid="assign-subgroup-user-btn"
													>
														<UserPlus className="mr-1.5 size-3.5" />
														Assign User
													</Button>
												)}
										</div>
									</div>
									<div className="max-h-[300px] overflow-y-auto">
										<Table>
											<TableHeader className="sticky top-0 z-10 bg-background">
												<TableRow>
													<TableHead>Name</TableHead>
													<TableHead>
														Assigned By
													</TableHead>
													<TableHead>
														Assigned Date
													</TableHead>
													<TableHead className="w-px whitespace-nowrap">
														Actions
													</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{filteredSubgroupMembers.length >
												0 ? (
													filteredSubgroupMembers.map(
														(u) => {
															const displayName =
																u.name ||
																u.userId;
															return (
																<TableRow
																	key={
																		u.userId
																	}
																>
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
																					{
																						u.userId
																					}
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
																	<TableCell>
																		<Button
																			type="button"
																			variant="outline"
																			size="icon-sm"
																			className="border-none"
																			data-testid={`remove-subgroup-user-${u.userId}`}
																			onClick={() =>
																				setRemoveSubgroupUserTarget(
																					u,
																				)
																			}
																		>
																			<Trash2 className="size-4" />
																		</Button>
																	</TableCell>
																</TableRow>
															);
														},
													)
												) : (
													<TableRow>
														<TableCell
															colSpan={4}
															className="text-center"
														>
															{subgroupMemberSearch ? (
																`No members match "${subgroupMemberSearch}"`
															) : (
																<Muted>
																	No members
																	assigned
																	yet.
																</Muted>
															)}
														</TableCell>
													</TableRow>
												)}
											</TableBody>
										</Table>
									</div>
									<p className="mt-2 px-4 pb-3 text-end text-muted-foreground text-sm">
										{filteredSubgroupMembers.length} of{" "}
										{subgroupUsers.length}{" "}
										{subgroupUsers.length === 1
											? "member"
											: "members"}
									</p>
								</div>
							</TabsContent>
						</Tabs>
					</DialogContent>
				</Dialog>

				{/* ── Assign Users dialog (profile + subgroup, multi-select) ───── */}
				<Dialog
					open={!!assignTarget}
					onOpenChange={(open) => !open && closeAssignModal()}
				>
					<DialogContent className="flex max-h-[90vh] w-full max-w-2xl flex-col gap-4 overflow-hidden">
						<DialogHeader>
							<DialogTitle>Assign Users</DialogTitle>
							<DialogDescription>
								Search for users to assign to{" "}
								<span className="font-medium text-foreground">
									{assignTarget?.type === "profile"
										? assignTarget.profileName
										: assignTarget?.subgroupName}
								</span>
								.
							</DialogDescription>
						</DialogHeader>

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

						<div className="flex flex-1 flex-col gap-4 overflow-y-auto">
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
															{(
																item.name ||
																item.id
															)
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
																email:{" "}
																{item.email}
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

							<div className="flex flex-col gap-2">
								<span className="font-medium text-muted-foreground text-sm">
									{selectedUsers.length} user
									{selectedUsers.length !== 1 ? "s" : ""}{" "}
									selected
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
										Managers can manage profiles, features,
										subgroups, and member assignments, but
										cannot add or remove other managers.
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

				{/* ── Delete Feature confirmation ──────────────────────────────── */}
				<Dialog
					open={!!deleteFeatureTarget}
					onOpenChange={(open) =>
						!open && setDeleteFeatureTarget(null)
					}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Delete Feature</DialogTitle>
							<DialogDescription>
								Delete feature &quot;
								{deleteFeatureTarget?.featureKey}&quot;? This
								will remove it from all profiles and subgroups.
								This cannot be undone.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button
								variant="ghost"
								onClick={() => setDeleteFeatureTarget(null)}
								disabled={confirmLoading}
							>
								Cancel
							</Button>
							<Button
								variant="destructive"
								onClick={confirmDeleteFeature}
								disabled={confirmLoading}
								data-testid="confirm-delete-feature-btn"
							>
								{confirmLoading ? "Deleting…" : "Delete"}
							</Button>
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
								{deleteProfileTarget?.profileName}&quot;?
								{deleteProfileTarget &&
									deleteProfileTarget.userCount > 0 && (
										<>
											{" "}
											This profile has{" "}
											<span className="font-medium text-foreground">
												{deleteProfileTarget.userCount}{" "}
												{deleteProfileTarget.userCount ===
												1
													? "user"
													: "users"}
											</span>{" "}
											assigned — they will be removed from
											this profile.
										</>
									)}{" "}
								This cannot be undone.
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
								&quot; from this profile? They may still be in
								other profiles.
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
								&quot; from this subgroup?
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
