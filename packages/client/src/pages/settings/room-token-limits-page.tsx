import {
	ChevronLeft,
	ChevronRight,
	Pencil,
	Plus,
	Trash2,
	Users,
} from "lucide-react";
import {
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";
import { Navigate } from "react-router-dom";
import { Env, get, post } from "@semoss/sdk/react";
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
	Switch,
	toast,
} from "@semoss/ui/next";
import { getAllUsers } from "@/api";
import { useSettings } from "@/hooks";

interface RoomTokenLimit {
	userId: string | null;
	maxTokens: number | null;
	maxInputTokens: number | null;
	maxOutputTokens: number | null;
	isActive: boolean;
	createdBy: string | null;
	dateCreated: string | null;
	dateModified: string | null;
	userName: string | null;
	userEmail: string | null;
}

interface PlatformUser {
	id: string;
	name: string;
	email: string;
	type: string;
}

const formatNumber = (val: number | null | undefined): string => {
	if (val == null || val <= 0) return "Unlimited";
	return val.toLocaleString();
};

export const RoomTokenLimitsPage = () => {
	const { adminMode } = useSettings();
	const uid = useId();
	const [loading, setLoading] = useState(true);
	const [limits, setLimits] = useState<RoomTokenLimit[]>([]);

	// Default limits
	const [defaultMaxTokens, setDefaultMaxTokens] = useState("");
	const [defaultMaxInput, setDefaultMaxInput] = useState("");
	const [defaultMaxOutput, setDefaultMaxOutput] = useState("");
	const [defaultActive, setDefaultActive] = useState(true);
	const [savingDefault, setSavingDefault] = useState(false);
	const [showConfirmDialog, setShowConfirmDialog] = useState(false);

	const savedDefaultRef = useRef({
		tokens: "",
		input: "",
		output: "",
		active: true,
	});

	// User override dialog
	const [showUserDialog, setShowUserDialog] = useState(false);
	const [editingUserId, setEditingUserId] = useState<string | null>(null);
	const [userSearch, setUserSearch] = useState("");
	const [userResults, setUserResults] = useState<PlatformUser[]>([]);
	const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);
	const [userMaxTokens, setUserMaxTokens] = useState("");
	const [userMaxInput, setUserMaxInput] = useState("");
	const [userMaxOutput, setUserMaxOutput] = useState("");
	const [userActive, setUserActive] = useState(true);
	const [savingUser, setSavingUser] = useState(false);
	const [searchingUsers, setSearchingUsers] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<{
		userId: string;
		userName: string;
	} | null>(null);

	const fetchLimits = useCallback(async () => {
		try {
			setLoading(true);
			const resp = await get<RoomTokenLimit[]>(
				`${Env.MODULE}/api/auth/roomtoken/getRoomTokenLimits`,
			);
			const data = resp?.data || [];
			setLimits(Array.isArray(data) ? data : []);
		} catch (e) {
			console.error("Failed to fetch room token limits", e);
			toast.error("Failed to load room token limits");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchLimits();
	}, [fetchLimits]);

	useEffect(() => {
		const dl = limits.find((l) => !l.userId);
		const tokens =
			dl && dl.maxTokens != null && dl.maxTokens > 0
				? String(dl.maxTokens)
				: "";
		const input =
			dl && dl.maxInputTokens != null && dl.maxInputTokens > 0
				? String(dl.maxInputTokens)
				: "";
		const output =
			dl && dl.maxOutputTokens != null && dl.maxOutputTokens > 0
				? String(dl.maxOutputTokens)
				: "";
		const active = dl ? dl.isActive !== false : true;
		setDefaultMaxTokens(tokens);
		setDefaultMaxInput(input);
		setDefaultMaxOutput(output);
		setDefaultActive(active);
		savedDefaultRef.current = { tokens, input, output, active };
	}, [limits]);

	const defaultDirty = useMemo(() => {
		const s = savedDefaultRef.current;
		return (
			defaultMaxTokens !== s.tokens ||
			defaultMaxInput !== s.input ||
			defaultMaxOutput !== s.output ||
			defaultActive !== s.active
		);
	}, [defaultMaxTokens, defaultMaxInput, defaultMaxOutput, defaultActive]);

	const hasExistingDefault = useMemo(
		() => limits.some((l) => !l.userId),
		[limits],
	);

	const saveDefaultLimit = async () => {
		setSavingDefault(true);
		try {
			await post(`${Env.MODULE}/api/auth/roomtoken/setRoomTokenLimit`, {
				maxTokens: defaultMaxTokens ? defaultMaxTokens : "-1",
				maxInputTokens: defaultMaxInput ? defaultMaxInput : "-1",
				maxOutputTokens: defaultMaxOutput ? defaultMaxOutput : "-1",
				isActive: String(defaultActive),
			});
			toast.success("Default room token limit saved");
			fetchLimits();
		} catch (e) {
			console.error("Failed to save default limit", e);
			toast.error("Failed to save default limit");
		} finally {
			setSavingDefault(false);
			setShowConfirmDialog(false);
		}
	};

	const searchUsers = async (term: string) => {
		setUserSearch(term);
		setSearchingUsers(true);
		try {
			const resp = await getAllUsers(true, term.trim(), 0, 20);
			const users = resp?.users ?? [];
			setUserResults(
				(Array.isArray(users) ? users : []).map((u) => ({
					id: u.id,
					name: u.name ?? u.username ?? u.id,
					email: u.email ?? "",
					type: u.type ?? "",
				})),
			);
		} catch {
			setUserResults([]);
		} finally {
			setSearchingUsers(false);
		}
	};

	const openAddUserDialog = async () => {
		setEditingUserId(null);
		setSelectedUser(null);
		setUserSearch("");
		setUserMaxTokens("");
		setUserMaxInput("");
		setUserMaxOutput("");
		setUserActive(true);
		setShowUserDialog(true);
		setSearchingUsers(true);
		try {
			const resp = await getAllUsers(true, "", 0, 20);
			const users = resp?.users ?? [];
			setUserResults(
				(Array.isArray(users) ? users : []).map((u) => ({
					id: u.id,
					name: u.name ?? u.username ?? u.id,
					email: u.email ?? "",
					type: u.type ?? "",
				})),
			);
		} catch {
			setUserResults([]);
		} finally {
			setSearchingUsers(false);
		}
	};

	const openEditUserDialog = (limit: RoomTokenLimit) => {
		setEditingUserId(limit.userId);
		setSelectedUser({
			id: limit.userId ?? "",
			name: (limit.userName || limit.userId) ?? "",
			email: limit.userEmail || "",
			type: "",
		});
		setUserSearch("");
		setUserResults([]);
		setUserMaxTokens(
			limit.maxTokens != null && limit.maxTokens > 0
				? String(limit.maxTokens)
				: "",
		);
		setUserMaxInput(
			limit.maxInputTokens != null && limit.maxInputTokens > 0
				? String(limit.maxInputTokens)
				: "",
		);
		setUserMaxOutput(
			limit.maxOutputTokens != null && limit.maxOutputTokens > 0
				? String(limit.maxOutputTokens)
				: "",
		);
		setUserActive(limit.isActive !== false);
		setShowUserDialog(true);
	};

	const saveUserLimit = async () => {
		const userId = editingUserId || selectedUser?.id;
		if (!userId) {
			toast.error("Please select a user");
			return;
		}
		setSavingUser(true);
		try {
			await post(`${Env.MODULE}/api/auth/roomtoken/setRoomTokenLimit`, {
				userId,
				maxTokens: userMaxTokens ? userMaxTokens : "-1",
				maxInputTokens: userMaxInput ? userMaxInput : "-1",
				maxOutputTokens: userMaxOutput ? userMaxOutput : "-1",
				isActive: String(userActive),
			});
			toast.success("User room token limit saved");
			setShowUserDialog(false);
			fetchLimits();
		} catch (e) {
			console.error("Failed to save user limit", e);
			toast.error("Failed to save user limit");
		} finally {
			setSavingUser(false);
		}
	};

	const removeUserLimit = async (userId: string) => {
		try {
			await post(
				`${Env.MODULE}/api/auth/roomtoken/removeRoomTokenLimit`,
				{ userId },
			);
			toast.success("User override removed");
			fetchLimits();
		} catch (e) {
			console.error("Failed to remove user limit", e);
			toast.error("Failed to remove user limit");
		} finally {
			setDeleteTarget(null);
		}
	};

	// Derived data
	const userOverrides = useMemo(
		() => limits.filter((l) => !!l.userId),
		[limits],
	);

	// Pagination
	const [currentPage, setCurrentPage] = useState(1);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const numberOfPages = Math.max(
		1,
		Math.ceil(userOverrides.length / rowsPerPage),
	);

	// Reset to page 1 when overrides change
	useEffect(() => {
		setCurrentPage(1);
	}, [userOverrides.length]);

	const paginatedOverrides = useMemo(() => {
		const start = (currentPage - 1) * rowsPerPage;
		return userOverrides.slice(start, start + rowsPerPage);
	}, [userOverrides, currentPage, rowsPerPage]);

	if (!adminMode) {
		return <Navigate to="/settings" />;
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center py-20">
				<Spinner className="size-8" />
			</div>
		);
	}

	return (
		<div className="flex w-full flex-col gap-6">
			{/* Default Limits Card */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base">
						Default Room Token Limits
					</CardTitle>
					<p className="text-muted-foreground text-sm">
						Applied to all users unless overridden. Limits apply to
						total token usage per room.
					</p>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					{/* Limit inputs */}
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
						<div className="flex flex-col gap-1.5">
							<Label htmlFor={`${uid}-default-combined`}>
								Combined Token Limit
							</Label>
							<Input
								id={`${uid}-default-combined`}
								type="number"
								min={0}
								placeholder="Unlimited"
								value={defaultMaxTokens}
								onChange={(e) =>
									setDefaultMaxTokens(e.target.value)
								}
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<Label htmlFor={`${uid}-default-input`}>
								Input Token Limit
							</Label>
							<Input
								id={`${uid}-default-input`}
								type="number"
								min={0}
								placeholder="Unlimited"
								value={defaultMaxInput}
								onChange={(e) =>
									setDefaultMaxInput(e.target.value)
								}
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<Label htmlFor={`${uid}-default-output`}>
								Output Token Limit
							</Label>
							<Input
								id={`${uid}-default-output`}
								type="number"
								min={0}
								placeholder="Unlimited"
								value={defaultMaxOutput}
								onChange={(e) =>
									setDefaultMaxOutput(e.target.value)
								}
							/>
						</div>
					</div>
					<div className="flex items-center gap-3">
						<Switch
							checked={defaultActive}
							onCheckedChange={setDefaultActive}
						/>
						<Label>{defaultActive ? "Active" : "Inactive"}</Label>
					</div>
					<div className="flex justify-end">
						<Button
							onClick={() => setShowConfirmDialog(true)}
							disabled={savingDefault || !defaultDirty}
						>
							{savingDefault
								? "Saving..."
								: hasExistingDefault
									? "Update Defaults"
									: "Save Defaults"}
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* User Overrides Card */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle className="text-base">
							User Overrides
						</CardTitle>
						<p className="text-muted-foreground text-sm">
							Set custom per-room token limits for specific users.
						</p>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={openAddUserDialog}
					>
						<Plus className="mr-1 size-4" />
						Add User Override
					</Button>
				</CardHeader>
				<CardContent>
					{userOverrides.length === 0 ? (
						<div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
							<Users className="size-8" />
							<p className="text-sm">
								No user-specific overrides configured. All users
								use the default limits.
							</p>
						</div>
					) : (
						<>
							<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b text-left text-muted-foreground">
											<th className="pr-4 pb-2 font-medium">
												User
											</th>
											<th className="pr-4 pb-2 font-medium">
												Combined
											</th>
											<th className="pr-4 pb-2 font-medium">
												Input
											</th>
											<th className="pr-4 pb-2 font-medium">
												Output
											</th>
											<th className="pr-4 pb-2 font-medium">
												Status
											</th>
											<th className="pb-2 font-medium">
												Actions
											</th>
										</tr>
									</thead>
									<tbody>
										{paginatedOverrides.map((limit) => (
											<tr
												key={limit.userId}
												className="border-b"
											>
												<td className="py-3 pr-4">
													<div>
														<p className="font-medium">
															{limit.userName ||
																limit.userId}
														</p>
														{limit.userEmail && (
															<p className="text-muted-foreground text-xs">
																{
																	limit.userEmail
																}
															</p>
														)}
													</div>
												</td>
												<td className="py-3 pr-4">
													{formatNumber(
														limit.maxTokens,
													)}
												</td>
												<td className="py-3 pr-4">
													{formatNumber(
														limit.maxInputTokens,
													)}
												</td>
												<td className="py-3 pr-4">
													{formatNumber(
														limit.maxOutputTokens,
													)}
												</td>
												<td className="py-3 pr-4">
													<span
														className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium text-xs ${
															limit.isActive !==
															false
																? "bg-green-100 text-green-800"
																: "bg-gray-100 text-gray-600"
														}`}
													>
														{limit.isActive !==
														false
															? "Active"
															: "Inactive"}
													</span>
												</td>
												<td className="py-3">
													<div className="flex gap-1">
														<Button
															variant="ghost"
															size="icon"
															onClick={() =>
																openEditUserDialog(
																	limit,
																)
															}
														>
															<Pencil className="size-4" />
														</Button>
														<Button
															variant="ghost"
															size="icon"
															onClick={() =>
																setDeleteTarget(
																	{
																		userId:
																			limit.userId ??
																			"",
																		userName:
																			limit.userName ??
																			limit.userId ??
																			"this user",
																	},
																)
															}
														>
															<Trash2 className="size-4 text-destructive" />
														</Button>
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
							{userOverrides.length > rowsPerPage && (
								<div className="flex items-center justify-between pt-4">
									<div className="flex items-center gap-2 text-sm">
										<span className="whitespace-nowrap text-muted-foreground">
											Rows per page
										</span>
										<Select
											value={String(rowsPerPage)}
											onValueChange={(v) => {
												setRowsPerPage(Number(v));
												setCurrentPage(1);
											}}
										>
											<SelectTrigger className="w-18">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{[10, 25, 50, 100].map((n) => (
													<SelectItem
														key={n}
														value={String(n)}
													>
														{n}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="flex items-center gap-2">
										<span className="text-muted-foreground text-sm">
											Page {currentPage} of{" "}
											{numberOfPages}
										</span>
										<Button
											variant="outline"
											size="icon"
											disabled={currentPage === 1}
											onClick={() =>
												setCurrentPage(currentPage - 1)
											}
										>
											<ChevronLeft className="size-4" />
										</Button>
										<Button
											variant="outline"
											size="icon"
											disabled={
												currentPage === numberOfPages
											}
											onClick={() =>
												setCurrentPage(currentPage + 1)
											}
										>
											<ChevronRight className="size-4" />
										</Button>
									</div>
								</div>
							)}
						</>
					)}
				</CardContent>
			</Card>

			{/* Confirm Save Defaults Dialog */}
			<Dialog
				open={showConfirmDialog}
				onOpenChange={setShowConfirmDialog}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Confirm Save Defaults</DialogTitle>
					</DialogHeader>
					<p className="text-muted-foreground text-sm">
						Are you sure you want to update the default token
						limits? This will affect all users who do not have a
						specific override.
					</p>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowConfirmDialog(false)}
						>
							Cancel
						</Button>
						<Button
							onClick={saveDefaultLimit}
							disabled={savingDefault}
						>
							{savingDefault ? "Saving..." : "Confirm"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Confirm Delete User Override Dialog */}
			<Dialog
				open={deleteTarget !== null}
				onOpenChange={(open) => {
					if (!open) setDeleteTarget(null);
				}}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Remove User Override</DialogTitle>
					</DialogHeader>
					<p className="text-muted-foreground text-sm">
						Are you sure you want to remove the token limit override
						for <strong>{deleteTarget?.userName}</strong>? They will
						revert to the default limits.
					</p>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDeleteTarget(null)}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={() => {
								if (deleteTarget) {
									removeUserLimit(deleteTarget.userId);
								}
							}}
						>
							Remove
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* User Override Dialog */}
			<Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>
							{editingUserId
								? "Edit User Override"
								: "Add User Override"}
						</DialogTitle>
					</DialogHeader>
					<div className="flex flex-col gap-4 py-4">
						{/* User selection */}
						{!editingUserId ? (
							<div className="flex flex-col gap-1.5">
								<Label>User</Label>
								{selectedUser ? (
									<div className="flex items-center justify-between rounded-md border p-2">
										<div>
											<p className="font-medium text-sm">
												{selectedUser.name}
											</p>
											<p className="text-muted-foreground text-xs">
												{selectedUser.email ||
													selectedUser.id}
											</p>
										</div>
										<Button
											variant="ghost"
											size="sm"
											onClick={() =>
												setSelectedUser(null)
											}
										>
											Change
										</Button>
									</div>
								) : (
									<div className="flex flex-col gap-2">
										<Input
											placeholder="Search users..."
											value={userSearch}
											onChange={(e) =>
												searchUsers(e.target.value)
											}
										/>
										{searchingUsers && (
											<div className="flex justify-center py-2">
												<Spinner className="size-4" />
											</div>
										)}
										{userResults.length > 0 && (
											<div className="max-h-40 overflow-y-auto rounded-md border">
												{userResults.map((u) => (
													<button
														type="button"
														key={u.id}
														className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
														onClick={() => {
															setSelectedUser(u);
															setUserResults([]);
															setUserSearch("");
														}}
													>
														<div className="min-w-0 flex-1">
															<p className="font-medium">
																{u.name || u.id}
															</p>
															<p className="truncate text-muted-foreground text-xs">
																{u.id}
																{u.email
																	? ` · ${u.email}`
																	: ""}
															</p>
														</div>
													</button>
												))}
											</div>
										)}
									</div>
								)}
							</div>
						) : (
							<div className="flex flex-col gap-1.5">
								<Label>User</Label>
								<div className="rounded-md border bg-muted/50 p-2">
									<p className="font-medium text-sm">
										{selectedUser?.name || editingUserId}
									</p>
									{selectedUser?.email && (
										<p className="text-muted-foreground text-xs">
											{selectedUser.email}
										</p>
									)}
								</div>
							</div>
						)}

						{/* Limits */}
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
							<div className="flex flex-col gap-1.5">
								<Label htmlFor={`${uid}-user-combined`}>
									Combined Limit
								</Label>
								<Input
									id={`${uid}-user-combined`}
									type="number"
									min={0}
									placeholder="Unlimited"
									value={userMaxTokens}
									onChange={(e) =>
										setUserMaxTokens(e.target.value)
									}
								/>
							</div>
							<div className="flex flex-col gap-1.5">
								<Label htmlFor={`${uid}-user-input`}>
									Input Limit
								</Label>
								<Input
									id={`${uid}-user-input`}
									type="number"
									min={0}
									placeholder="Unlimited"
									value={userMaxInput}
									onChange={(e) =>
										setUserMaxInput(e.target.value)
									}
								/>
							</div>
							<div className="flex flex-col gap-1.5">
								<Label htmlFor={`${uid}-user-output`}>
									Output Limit
								</Label>
								<Input
									id={`${uid}-user-output`}
									type="number"
									min={0}
									placeholder="Unlimited"
									value={userMaxOutput}
									onChange={(e) =>
										setUserMaxOutput(e.target.value)
									}
								/>
							</div>
						</div>

						<div className="flex items-center gap-3">
							<Switch
								checked={userActive}
								onCheckedChange={setUserActive}
							/>
							<Label>{userActive ? "Active" : "Inactive"}</Label>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowUserDialog(false)}
						>
							Cancel
						</Button>
						<Button onClick={saveUserLimit} disabled={savingUser}>
							{savingUser ? "Saving..." : "Save"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};
