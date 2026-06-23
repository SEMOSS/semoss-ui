import {
	ArrowLeft,
	ChevronDown,
	ChevronUp,
	Pencil,
	Plus,
	Users,
	X,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useId, useState } from "react";
import { useParams } from "react-router-dom";
import {
	Avatar,
	AvatarFallback,
	Badge,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	H3,
	InputGroup,
	InputGroupInput,
	Label,
	P,
	Spinner,
	toast,
} from "@semoss/ui/next";
import { getAllUsers } from "@/api/auth";
import { FeatureFlagEditDialog } from "@/components/features/FeatureFlagEditDialog";
import { NavbarLeft } from "@/components/shared/NavbarLeft";
import { NavbarHeader } from "@/components/shared/navbar-header";
import { useRootStore } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";

interface FeatureFlag {
	flagId: string;
	appId: string;
	flagKey: string;
	description: string;
	minVersion: number;
	defaultVersion: number;
	createdBy: string;
	createdAt: string;
}

interface VersionBucket {
	version: number;
	description?: string;
	users: string[];
}

export const FeatureDetailPage = observer(() => {
	const { monolithStore } = useRootStore();
	const navigate = useNavigate();
	const { appId, flagId } = useParams<{ appId: string; flagId: string }>();

	const [flag, setFlag] = useState<FeatureFlag | null>(null);
	const [buckets, setBuckets] = useState<VersionBucket[]>([]);
	const [loading, setLoading] = useState(true);

	// version threshold editing
	const [isEditVersionsOpen, setIsEditVersionsOpen] = useState(false);

	// user assignment
	const [movingUser, setMovingUser] = useState<string | null>(null);
	const [removingUser, setRemovingUser] = useState<string | null>(null);
	const [pendingRemoveUser, setPendingRemoveUser] = useState<{
		user: string;
		bucketVersion: number;
	} | null>(null);

	// create version bucket
	const [isCreateVersionOpen, setIsCreateVersionOpen] = useState(false);
	const [pendingNewVersion, setPendingNewVersion] = useState<number | null>(
		null,
	);
	const [newVersionDescription, setNewVersionDescription] = useState("");
	const [isCreatingVersion, setIsCreatingVersion] = useState(false);

	// add user to bucket
	const [addUserToVersionOpen, setAddUserToVersionOpen] = useState(false);
	const [selectedBucketVersion, setSelectedBucketVersion] = useState<
		number | null
	>(null);
	const [userSearchInput, setUserSearchInput] = useState("");
	const [availableUsers, setAvailableUsers] = useState<
		Array<{ id: string; name?: string; email?: string }>
	>([]);
	const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
	const [isLoadingUsers, setIsLoadingUsers] = useState(false);
	const [isAddingUsers, setIsAddingUsers] = useState(false);

	const newVersionDescriptionId = useId();

	const loadData = useCallback(async () => {
		if (!appId || !flagId) return;
		setLoading(true);
		try {
			const response = await monolithStore.runQuery(
				`GetAppVersionBuckets(app="${appId}", flagId="${flagId}");`,
			);
			const { output, operationType } = response.pixelReturn[0];
			if (operationType.indexOf("ERROR") > -1) {
				toast.error("Failed to load version buckets.");
				return;
			}
			const { buckets: rawBuckets, flags } = output as {
				buckets: VersionBucket[];
				flags: FeatureFlag[];
			};
			const found = flags?.find(
				(f) => f.flagId === flagId || f.flagKey === flagId,
			);
			setFlag(found ?? null);
			setBuckets(Array.isArray(rawBuckets) ? rawBuckets : []);
		} finally {
			setLoading(false);
		}
	}, [appId, flagId, monolithStore]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	const handleOpenEditVersions = () => {
		if (!flag) return;
		setIsEditVersionsOpen(true);
	};

	const handleMoveUser = async (
		user: string,
		fromVersion: number,
		toVersion: number,
	) => {
		if (!appId) return;
		setMovingUser(user);
		try {
			const response = await monolithStore.runQuery(
				`SetUserAppVersion(app="${appId}", flagId="${flag?.flagId}", users=["${user}"], version=${toVersion});`,
			);
			const { operationType, output } = response.pixelReturn[0];
			if (operationType.indexOf("ERROR") > -1) {
				throw new Error(
					typeof output === "string"
						? output
						: "Failed to move user.",
				);
			}
			setBuckets((prev) =>
				prev.map((b) => {
					if (b.version === fromVersion) {
						return {
							...b,
							users: b.users.filter((u) => u !== user),
						};
					}
					if (b.version === toVersion) {
						return { ...b, users: [...b.users, user] };
					}
					return b;
				}),
			);
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to move user.",
			);
		} finally {
			setMovingUser(null);
		}
	};

	const handleRemoveUser = (user: string, bucketVersion: number) => {
		setPendingRemoveUser({ user, bucketVersion });
	};

	const confirmRemoveUser = async () => {
		if (!appId || !flag || !pendingRemoveUser) return;
		const { user, bucketVersion } = pendingRemoveUser;
		setPendingRemoveUser(null);
		setRemovingUser(user);
		try {
			const response = await monolithStore.runQuery(
				`RemoveUserFromFeatureFlag(app="${appId}", flagId="${flag.flagId}", user="${user}");`,
			);
			const { operationType, output } = response.pixelReturn[0];
			if (operationType.indexOf("ERROR") > -1) {
				throw new Error(
					typeof output === "string"
						? output
						: "Failed to remove user.",
				);
			}
			setBuckets((prev) =>
				prev.map((b) =>
					b.version === bucketVersion
						? { ...b, users: b.users.filter((u) => u !== user) }
						: b,
				),
			);
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to remove user.",
			);
		} finally {
			setRemovingUser(null);
		}
	};

	const handleOpenCreateVersion = () => {
		const maxVersion = buckets.reduce((max, bucket) => {
			return bucket.version > max ? bucket.version : max;
		}, 0);
		setPendingNewVersion(maxVersion + 1);
		setNewVersionDescription("");
		setIsCreateVersionOpen(true);
	};

	const handleCreateVersionBucket = async () => {
		if (!appId || !flag || pendingNewVersion === null) return;
		const description = newVersionDescription.trim();
		if (!description) {
			toast.error("Description is required.");
			return;
		}
		const escapedDescription = description
			.replace(/\\/g, "\\\\")
			.replace(/"/g, '\\"');
		setIsCreatingVersion(true);
		try {
			const response = await monolithStore.runQuery(
				`CreateAppVersionBucket(app="${appId}", key="${flag.flagKey}", version=${pendingNewVersion}, description="${escapedDescription}");`,
			);
			const { operationType, output } = response.pixelReturn[0];
			if (operationType.indexOf("ERROR") > -1) {
				throw new Error(
					typeof output === "string"
						? output
						: "Failed to create version bucket.",
				);
			}
			toast.success(`Created version bucket v${pendingNewVersion}.`);
			setIsCreateVersionOpen(false);
			setPendingNewVersion(null);
			setNewVersionDescription("");
			await loadData();
		} catch (err) {
			toast.error(
				err instanceof Error
					? err.message
					: "Failed to create version bucket.",
			);
		} finally {
			setIsCreatingVersion(false);
		}
	};

	const handleOpenAddUserModal = (bucketVersion: number) => {
		setSelectedBucketVersion(bucketVersion);
		setUserSearchInput("");
		setSelectedUsers(new Set());
		setAddUserToVersionOpen(true);

		// Load all platform users
		const loadUsers = async () => {
			setIsLoadingUsers(true);
			try {
				const response = await getAllUsers(
					true, // admin mode
					"", // no search term initially
					0, // offset
					1000, // high limit to get all users
				);
				const users = response?.users || [];
				// Filter out users already in the bucket
				const currentBucket = buckets.find(
					(b) => b.version === bucketVersion,
				);
				const filtered = users.filter(
					(u: { id: string; name?: string; email?: string }) =>
						!currentBucket?.users.includes(u.id),
				);
				setAvailableUsers(filtered);
			} catch (error) {
				setAvailableUsers([]);
				console.error("Failed to load users:", error);
			} finally {
				setIsLoadingUsers(false);
			}
		};

		if (appId) loadUsers();
	};

	// Filter users based on search input
	const filteredUsers = availableUsers.filter((user) => {
		const searchLower = userSearchInput.toLowerCase();
		const userId = typeof user === "string" ? user : user.id;
		const userName = typeof user === "string" ? "" : user.name || "";
		const userEmail = typeof user === "string" ? "" : user.email || "";

		return (
			userId.toLowerCase().includes(searchLower) ||
			userName.toLowerCase().includes(searchLower) ||
			userEmail.toLowerCase().includes(searchLower)
		);
	});

	const handleAddSelectedUsers = async () => {
		if (
			!appId ||
			selectedBucketVersion === null ||
			selectedUsers.size === 0
		)
			return;
		setIsAddingUsers(true);
		try {
			const usersList = Array.from(selectedUsers).map((u) => {
				const user = availableUsers.find(
					(au) => (typeof au === "string" ? au : au.id) === u,
				);
				return typeof user === "string" ? user : user?.id || u;
			});

			const response = await monolithStore.runQuery(
				`SetUserAppVersion(app="${appId}", flagId="${flag?.flagId}", users=[${usersList.map((u) => `"${u}"`).join(", ")}], version=${selectedBucketVersion});`,
			);
			const { operationType, output } = response.pixelReturn[0];
			if (operationType.indexOf("ERROR") > -1) {
				throw new Error(
					typeof output === "string"
						? output
						: "Failed to add users.",
				);
			}
			toast.success(
				`Added ${selectedUsers.size} user(s) to v${selectedBucketVersion}.`,
			);
			setAddUserToVersionOpen(false);
			setUserSearchInput("");
			setSelectedUsers(new Set());
			await loadData();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to add users.",
			);
		} finally {
			setIsAddingUsers(false);
		}
	};

	const toggleUserSelection = (userId: string) => {
		const newSelected = new Set(selectedUsers);
		if (newSelected.has(userId)) {
			newSelected.delete(userId);
		} else {
			newSelected.add(userId);
		}
		setSelectedUsers(newSelected);
	};

	const sortedBuckets = [...buckets].sort((a, b) => a.version - b.version);

	const flagIsOn = flag
		? (v: number) => v >= flag.minVersion && flag.minVersion > 0
		: () => false;

	return (
		<>
			<NavbarLeft>
				<NavbarHeader />
			</NavbarLeft>

			<div className="flex flex-col gap-6">
				<Button
					variant="ghost"
					size="sm"
					className="-ml-2 w-fit text-muted-foreground"
					onClick={() => navigate("/features")}
				>
					<ArrowLeft className="size-4" />
					Back to Feature Flags
				</Button>

				{loading ? (
					<div className="flex items-center gap-2 text-muted-foreground">
						<Spinner className="size-4" />
						<P>Loading…</P>
					</div>
				) : !flag ? (
					<div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
						<P>Feature flag not found.</P>
					</div>
				) : (
					<>
						{/* Flag header */}
						<div className="flex flex-wrap items-start justify-between gap-4">
							<div className="flex flex-col gap-1">
								<H3 className="font-mono text-2xl">
									{flag.flagKey}
								</H3>
								{flag.description ? (
									<P className="text-muted-foreground">
										{flag.description}
									</P>
								) : null}
								<P className="text-muted-foreground text-xs">
									Created by {flag.createdBy || "unknown"}
								</P>
							</div>
						</div>

						{/* Version thresholds card */}
						<div className="flex items-center justify-between rounded-lg border bg-card px-5 py-4 shadow-sm">
							<div className="flex flex-col gap-2">
								<span className="font-medium text-sm">
									Version thresholds
								</span>
								<div className="flex flex-wrap gap-4">
									<div className="flex flex-col gap-0.5">
										<span className="text-muted-foreground text-xs">
											Min version (flag on when ≥)
										</span>
										<span className="font-mono font-semibold text-sm">
											v{flag.minVersion}
											{flag.minVersion === 0 && (
												<span className="ml-1.5 font-normal text-muted-foreground">
													(always off)
												</span>
											)}
										</span>
									</div>
									<div className="flex flex-col gap-0.5">
										<span className="text-muted-foreground text-xs">
											Default version (unassigned users)
										</span>
										<span className="font-mono font-semibold text-sm">
											v{flag.defaultVersion}
											{flag.defaultVersion === 0 && (
												<span className="ml-1.5 font-normal text-muted-foreground">
													(off by default)
												</span>
											)}
										</span>
									</div>
								</div>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={handleOpenEditVersions}
							>
								<Pencil className="size-4" />
								Edit
							</Button>
						</div>

						{/* Version buckets */}
						<div className="flex flex-col gap-3">
							<div className="flex items-center justify-between">
								<span className="font-semibold text-sm">
									Version buckets (
									{sortedBuckets.reduce(
										(n, b) => n + b.users.length,
										0,
									)}{" "}
									users)
								</span>
								<Button
									variant="outline"
									size="sm"
									onClick={handleOpenCreateVersion}
								>
									<Plus className="size-4" />
									New version
								</Button>
							</div>

							{sortedBuckets.length === 0 ? (
								<div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
									<Users className="mx-auto mb-3 size-8 opacity-30" />
									<P>
										No users have been assigned to a version
										bucket yet.
									</P>
								</div>
							) : (
								<div className="flex flex-col gap-3">
									{sortedBuckets.map((bucket, bucketIdx) => {
										const on = flagIsOn(bucket.version);
										return (
											<div
												key={bucket.version}
												className="rounded-lg border bg-card shadow-sm"
											>
												<div className="flex flex-col gap-2 border-b px-5 py-3">
													<div className="flex items-center justify-between gap-3">
														<div className="flex items-center gap-3">
															<span className="font-mono font-semibold text-sm">
																v
																{bucket.version}
															</span>
															<Badge
																variant={
																	on
																		? "default"
																		: "outline"
																}
																className="text-xs"
															>
																{on
																	? "flag on"
																	: "flag off"}
															</Badge>
															<span className="text-muted-foreground text-xs">
																{
																	bucket.users
																		.length
																}{" "}
																{bucket.users
																	.length ===
																1
																	? "user"
																	: "users"}
															</span>
														</div>
														<Button
															variant="outline"
															size="sm"
															onClick={() =>
																handleOpenAddUserModal(
																	bucket.version,
																)
															}
														>
															<Plus className="size-4" />
															Add user
														</Button>
													</div>
													{bucket.description && (
														<P className="text-muted-foreground text-xs">
															{bucket.description}
														</P>
													)}
												</div>

												{/* Users */}
												{bucket.users.length === 0 ? (
													<P className="px-5 py-4 text-muted-foreground text-sm">
														No users in this bucket.
													</P>
												) : (
													<div className="flex flex-col divide-y">
														{bucket.users.map(
															(user) => {
																const isMoving =
																	movingUser ===
																	user;
																const isRemoving =
																	removingUser ===
																	user;
																const prevBucket =
																	bucketIdx >
																	0
																		? sortedBuckets[
																				bucketIdx -
																					1
																			]
																		: null;
																const nextBucket =
																	bucketIdx <
																	sortedBuckets.length -
																		1
																		? sortedBuckets[
																				bucketIdx +
																					1
																			]
																		: null;
																return (
																	<div
																		key={
																			user
																		}
																		className="flex items-center justify-between gap-3 px-5 py-2.5"
																	>
																		<span className="font-mono text-sm">
																			{
																				user
																			}
																		</span>
																		<div className="flex items-center gap-1">
																			{prevBucket && (
																				<Button
																					variant="ghost"
																					size="icon-sm"
																					aria-label={`Move to v${prevBucket.version}`}
																					disabled={
																						isMoving
																					}
																					onClick={() =>
																						handleMoveUser(
																							user,
																							bucket.version,
																							prevBucket.version,
																						)
																					}
																				>
																					{isMoving ? (
																						<Spinner className="size-3.5" />
																					) : (
																						<ChevronUp className="size-3.5" />
																					)}
																				</Button>
																			)}
																			{nextBucket && (
																				<Button
																					variant="ghost"
																					size="icon-sm"
																					aria-label={`Move to v${nextBucket.version}`}
																					disabled={
																						isMoving
																					}
																					onClick={() =>
																						handleMoveUser(
																							user,
																							bucket.version,
																							nextBucket.version,
																						)
																					}
																				>
																					{isMoving ? (
																						<Spinner className="size-3.5" />
																					) : (
																						<ChevronDown className="size-3.5" />
																					)}
																				</Button>
																			)}
																			<Button
																				variant="ghost"
																				size="icon-sm"
																				aria-label="Remove user"
																				className="text-destructive hover:bg-destructive/10 hover:text-destructive"
																				disabled={
																					isRemoving ||
																					isMoving
																				}
																				onClick={() =>
																					handleRemoveUser(
																						user,
																						bucket.version,
																					)
																				}
																			>
																				{isRemoving ? (
																					<Spinner className="size-3.5" />
																				) : (
																					<X className="size-3.5" />
																				)}
																			</Button>
																		</div>
																	</div>
																);
															},
														)}
													</div>
												)}
											</div>
										);
									})}
								</div>
							)}
						</div>
					</>
				)}
			</div>

			<FeatureFlagEditDialog
				open={isEditVersionsOpen}
				onOpenChange={setIsEditVersionsOpen}
				appId={appId || ""}
				flag={flag}
				monolithStore={monolithStore}
				onSaved={(updated) => {
					setFlag((prev) =>
						prev
							? {
									...prev,
									minVersion: updated.minVersion,
									defaultVersion: updated.defaultVersion,
									description: updated.description,
								}
							: prev,
					);
				}}
			/>

			{/* Create version bucket dialog */}
			<Dialog
				open={isCreateVersionOpen}
				onOpenChange={setIsCreateVersionOpen}
			>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle>Create New Version Bucket</DialogTitle>
						<DialogDescription>
							This will create version bucket{" "}
							<strong>v{pendingNewVersion ?? ""}</strong> for
							feature flag <strong>{flag?.flagKey}</strong>.
						</DialogDescription>
					</DialogHeader>

					<div className="flex flex-col gap-1.5">
						<Label htmlFor={newVersionDescriptionId}>
							Description
						</Label>
						<InputGroup className="h-9">
							<InputGroupInput
								id={newVersionDescriptionId}
								className="h-9"
								placeholder="Explain what this version bucket is for"
								value={newVersionDescription}
								onChange={(e) =>
									setNewVersionDescription(e.target.value)
								}
							/>
						</InputGroup>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setIsCreateVersionOpen(false);
								setPendingNewVersion(null);
								setNewVersionDescription("");
							}}
							disabled={isCreatingVersion}
						>
							Cancel
						</Button>
						<Button
							onClick={handleCreateVersionBucket}
							disabled={
								isCreatingVersion || pendingNewVersion === null
							}
						>
							{isCreatingVersion ? (
								<>
									<Spinner className="mr-2 size-4" />
									Creating…
								</>
							) : (
								"Create"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Add users to bucket modal */}
			<Dialog
				open={addUserToVersionOpen}
				onOpenChange={setAddUserToVersionOpen}
			>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Add Members</DialogTitle>
						<DialogDescription>
							Search for users and add them to version bucket v
							{selectedBucketVersion}.
						</DialogDescription>
					</DialogHeader>

					<div className="flex flex-col gap-4">
						{/* Search input */}
						<InputGroup className="h-10">
							<InputGroupInput
								placeholder="Search by name or email…"
								value={userSearchInput}
								onChange={(e) =>
									setUserSearchInput(e.target.value)
								}
								className="h-10"
							/>
						</InputGroup>

						{/* Users list */}
						<div className="flex max-h-96 flex-col gap-2 overflow-y-auto rounded-lg border bg-muted/30 p-3">
							{isLoadingUsers ? (
								<div className="flex items-center justify-center py-8">
									<Spinner className="size-4" />
								</div>
							) : filteredUsers.length === 0 ? (
								<P className="py-8 text-center text-muted-foreground">
									{availableUsers.length === 0
										? "No users available"
										: "No matching users"}
								</P>
							) : (
								filteredUsers.map((user) => {
									const userId =
										typeof user === "string"
											? user
											: user.id;
									const isSelected =
										selectedUsers.has(userId);
									return (
										<button
											key={userId}
											type="button"
											className="flex cursor-pointer items-center gap-3 rounded-md border border-transparent bg-background px-3 py-2 text-left transition-colors hover:bg-muted"
											onClick={() =>
												toggleUserSelection(userId)
											}
										>
											<input
												type="checkbox"
												checked={isSelected}
												onChange={() =>
													toggleUserSelection(userId)
												}
												className="cursor-pointer"
											/>
											<Avatar className="size-8">
												<AvatarFallback className="font-semibold text-xs">
													{(typeof user === "string"
														? user
														: user.name || user.id
													)
														.charAt(0)
														.toUpperCase()}
												</AvatarFallback>
											</Avatar>
											<div className="flex-1">
												{typeof user === "string" ? (
													<P className="font-medium font-mono text-sm">
														{user}
													</P>
												) : (
													<>
														<P className="font-medium text-sm">
															{user.name ||
																user.id}
														</P>
														<P className="text-muted-foreground text-xs">
															id: {user.id}
															{user.email && (
																<>
																	<br />
																	email:{" "}
																	{user.email}
																</>
															)}
														</P>
													</>
												)}
											</div>
										</button>
									);
								})
							)}
						</div>

						{/* Selected count */}
						<P className="text-muted-foreground text-sm">
							{selectedUsers.size} user
							{selectedUsers.size !== 1 ? "s" : ""} selected
						</P>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setAddUserToVersionOpen(false);
								setUserSearchInput("");
								setSelectedUsers(new Set());
							}}
							disabled={isAddingUsers}
						>
							Cancel
						</Button>
						<Button
							onClick={handleAddSelectedUsers}
							disabled={isAddingUsers || selectedUsers.size === 0}
						>
							{isAddingUsers ? (
								<>
									<Spinner className="mr-2 size-4" />
									Adding…
								</>
							) : (
								"Add"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Remove user confirmation dialog */}
			<Dialog
				open={!!pendingRemoveUser}
				onOpenChange={(open) => {
					if (!open) setPendingRemoveUser(null);
				}}
			>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle>Remove User</DialogTitle>
						<DialogDescription>
							Are you sure you want to remove{" "}
							<span className="font-mono font-semibold">
								{pendingRemoveUser?.user}
							</span>{" "}
							from the{" "}
							<span className="font-semibold">
								{flag?.flagKey}
							</span>{" "}
							feature flag? They will no longer be assigned to
							version v{pendingRemoveUser?.bucketVersion}.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setPendingRemoveUser(null)}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={confirmRemoveUser}
						>
							Remove
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
});
