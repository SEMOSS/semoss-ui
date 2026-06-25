import { ArrowLeft, Trash2, UserPlus, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { useParams } from "react-router-dom";
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
	toast,
} from "@semoss/ui/next";
import type { AdminUser } from "@/api/auth";
import { UserSearchCombobox } from "@/components/settings/user-search-combobox";
import { useRootStore } from "@/hooks/";
import { useNavigate } from "@/hooks/useNavigate";

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

const PLATFORM_FEATURES: {
	key: string;
	label: string;
	description: string;
}[] = [
	{
		key: "nav.app-catalog",
		label: "App Catalog",
		description:
			"Access the main app catalog to browse and launch published apps.",
	},
	{
		key: "nav.skills",
		label: "Skills",
		description:
			"Browse and run Skills — reusable LLM-powered task templates.",
	},
	{
		key: "nav.settings",
		label: "Settings",
		description:
			"Access platform settings including members, engines, and configuration.",
	},
	{
		key: "nav.engine",
		label: "Engines",
		description:
			"Connect, manage, and query databases, models, and storage engines.",
	},
];

function sanitizeForPixel(s: string): string {
	return s.replace(/[^a-zA-Z0-9 _\-.,!?]/g, "");
}

export const PlatformProfileDetailPage = () => {
	const { profileId } = useParams<{ profileId: string }>();
	const navigate = useNavigate();
	const { monolithStore } = useRootStore();
	const uid = useId();

	const [profile, setProfile] = useState<PlatformProfile | null>(null);
	const [features, setFeatures] = useState<Record<string, boolean>>({});
	const [profileUsers, setProfileUsers] = useState<ProfileUser[]>([]);

	// Edit state
	const [editName, setEditName] = useState("");
	const [editDesc, setEditDesc] = useState("");
	const [savingProfile, setSavingProfile] = useState(false);

	// Assign user modal
	const [showAssignModal, setShowAssignModal] = useState(false);
	const [assignUser, setAssignUser] = useState<AdminUser | null>(null);
	const [assigningUser, setAssigningUser] = useState(false);

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
			}
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
		const name = sanitizeForPixel(editName.trim());
		if (!name) {
			toast.error("Name is required.");
			return;
		}
		const desc = sanitizeForPixel(editDesc);
		setSavingProfile(true);
		try {
			await runPixel(
				`UpdatePlatformProfile(profileId="${profileId}", name="${name}", description="${desc}");`,
			);
			await loadProfile();
			toast.success("Profile updated.");
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

	async function handleAssignUser() {
		if (!assignUser) return;
		setAssigningUser(true);
		try {
			await runPixel(
				`AssignUserPlatformProfile(userId="${assignUser.id}", profileId="${profileId}");`,
			);
			await Promise.all([loadUsers(), loadProfile()]);
			setShowAssignModal(false);
			setAssignUser(null);
		} finally {
			setAssigningUser(false);
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
		if (profile.userCount > 0) {
			toast.error("Reassign all users before deleting this profile.");
			return;
		}
		setConfirmLoading(true);
		try {
			await runPixel(`DeletePlatformProfile(profileId="${profileId}");`);
			navigate("../platform-profiles");
		} finally {
			setConfirmLoading(false);
		}
	}

	if (!profile) {
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
			<div className="flex flex-col gap-3">
				<Button
					variant="ghost"
					size="sm"
					className="w-fit gap-1.5 text-muted-foreground"
					onClick={() => navigate("../platform-profiles")}
				>
					<ArrowLeft className="size-4" />
					Platform Profiles
				</Button>
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
					<Button
						variant="ghost"
						size="sm"
						className="gap-1.5 text-destructive hover:text-destructive"
						disabled={profile.userCount > 0}
						onClick={() => setShowDeleteDialog(true)}
					>
						<Trash2 className="size-4" />
						Delete Profile
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
					<TabsTrigger value="settings">Profile Settings</TabsTrigger>
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
				<TabsContent value="members" className="flex flex-col gap-4">
					<div className="flex items-center justify-between">
						<div className="flex flex-col gap-1">
							<p className="font-medium text-sm">
								Assigned Members
							</p>
							<p className="text-muted-foreground text-sm">
								Users assigned to this profile will see only the
								navigation sections enabled above. Unassigned
								users see everything.
							</p>
						</div>
						<Button
							size="sm"
							onClick={() => setShowAssignModal(true)}
							data-testid="assign-platform-user-btn"
						>
							<UserPlus className="mr-1.5 size-4" />
							Assign User
						</Button>
					</div>

					{profileUsers.length === 0 ? (
						<div className="rounded-lg border border-dashed p-8 text-center">
							<p className="text-muted-foreground text-sm">
								No users assigned to this profile yet.
							</p>
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>User</TableHead>
									<TableHead>Assigned By</TableHead>
									<TableHead>Assigned At</TableHead>
									<TableHead className="w-16" />
								</TableRow>
							</TableHeader>
							<TableBody>
								{profileUsers.map((u) => {
									const displayName = u.name || u.userId;
									const initials = displayName
										.split(" ")
										.map((w) => w[0])
										.join("")
										.toUpperCase()
										.slice(0, 2);
									return (
										<TableRow key={u.userId}>
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
														{u.email && (
															<span className="truncate text-muted-foreground text-xs">
																{u.email}
															</span>
														)}
													</div>
												</div>
											</TableCell>
											<TableCell className="text-muted-foreground text-sm">
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
													size="sm"
													variant="ghost"
													className="text-destructive hover:text-destructive"
													onClick={() =>
														setRemoveUserTarget(u)
													}
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
				</TabsContent>

				{/* ── Settings tab ─────────────────────────────────────────────── */}
				<TabsContent value="settings" className="flex flex-col gap-4">
					<div className="flex flex-col gap-1">
						<p className="font-medium text-sm">Profile Details</p>
						<p className="text-muted-foreground text-sm">
							Update the name and description for this profile.
						</p>
					</div>
					<div className="flex max-w-md flex-col gap-4 rounded-lg border p-4">
						<div className="flex flex-col gap-1.5">
							<Label htmlFor={`${uid}-name`}>
								Name <span className="text-destructive">*</span>
							</Label>
							<Input
								id={`${uid}-name`}
								value={editName}
								onChange={(e) => setEditName(e.target.value)}
								maxLength={100}
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
						<div className="flex justify-end">
							<Button
								onClick={handleSaveProfile}
								disabled={savingProfile || !editName.trim()}
							>
								{savingProfile ? "Saving…" : "Save Changes"}
							</Button>
						</div>
					</div>
				</TabsContent>
			</Tabs>

			{/* ── Assign User modal ──────────────────────────────────────────── */}
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
							<DialogTitle>Assign User to Profile</DialogTitle>
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
								User <span className="text-destructive">*</span>
							</Label>
							<UserSearchCombobox
								value={assignUser}
								onChange={setAssignUser}
								excludeIds={profileUsers.map((u) => u.userId)}
							/>
						</div>
						<p className="text-muted-foreground text-sm">
							Assigning to:{" "}
							<span className="font-medium text-foreground">
								{profile.profileName}
							</span>
						</p>
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
							>
								{assigningUser ? "Assigning…" : "Assign"}
							</Button>
						</div>
					</DialogFooter>
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
							Delete &quot;{profile.profileName}&quot;? This
							cannot be undone.
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
						>
							{confirmLoading ? "Deleting…" : "Delete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};
