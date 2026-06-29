import { Plus, Save, Trash2, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { runPixel } from "@semoss/sdk/react";
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

interface RoomTokenLimit {
	userId: string | null;
	maxTokens: number | null;
	maxInputTokens: number | null;
	maxOutputTokens: number | null;
	isActive: boolean;
	userName: string | null;
	userEmail: string | null;
}

interface PlatformUser {
	id: string;
	name: string;
	email: string;
	type: string;
}

interface LimitDraft {
	maxTokens: number | null;
	maxInputTokens: number | null;
	maxOutputTokens: number | null;
	isActive: boolean;
}

type TokenMode = "TOTAL" | "SPLIT";

const EMPTY_DRAFT: LimitDraft = {
	maxTokens: null,
	maxInputTokens: null,
	maxOutputTokens: null,
	isActive: true,
};

const normalizeNumber = (value: number | null | undefined) =>
	value != null && value >= 0 ? value : null;

const toDraft = (limit?: RoomTokenLimit): LimitDraft => ({
	maxTokens: normalizeNumber(limit?.maxTokens),
	maxInputTokens: normalizeNumber(limit?.maxInputTokens),
	maxOutputTokens: normalizeNumber(limit?.maxOutputTokens),
	isActive: limit?.isActive !== false,
});

const getMode = (draft: LimitDraft): TokenMode =>
	draft.maxInputTokens != null || draft.maxOutputTokens != null
		? "SPLIT"
		: "TOTAL";

const normalizeDraft = (draft: LimitDraft, mode: TokenMode): LimitDraft =>
	mode === "TOTAL"
		? { ...draft, maxInputTokens: null, maxOutputTokens: null }
		: { ...draft, maxTokens: null };

const draftsEqual = (left: LimitDraft, right: LimitDraft) =>
	left.maxTokens === right.maxTokens &&
	left.maxInputTokens === right.maxInputTokens &&
	left.maxOutputTokens === right.maxOutputTokens &&
	left.isActive === right.isActive;

const parseLimit = (value: string) => {
	const sanitized = value.replace(/[^\d]/g, "");
	return {
		display: sanitized,
		value: sanitized === "" ? null : Number.parseInt(sanitized, 10),
	};
};

const serializeLimit = (value: number | null) => String(value ?? -1);

const pixelValue = (value: string | number | boolean) =>
	typeof value === "string" ? JSON.stringify(value) : String(value);

const runRoomLimitReactor = async <T,>(
	reactor: string,
	params: Record<string, string | number | boolean | null> = {},
) => {
	const args = Object.entries(params)
		.filter(([, value]) => value !== null)
		.map(([key, value]) => `${key}=[${pixelValue(value)}]`)
		.join(", ");
	const response = await runPixel<[T]>(`${reactor}(${args});`);
	if (response.errors.length > 0) {
		throw new Error(response.errors.join("\n"));
	}
	return response.pixelReturn[0]?.output as T;
};

function LimitEditor({
	value,
	onChange,
	onSave,
	onDelete,
	dirty,
	saving,
}: {
	value: LimitDraft;
	onChange: (value: LimitDraft) => void;
	onSave: () => void;
	onDelete?: () => void;
	dirty: boolean;
	saving: boolean;
}) {
	const mode = getMode(value);

	const updateMode = (nextMode: TokenMode) => {
		onChange(normalizeDraft(value, nextMode));
	};

	const renderInput = (
		label: string,
		currentValue: number | null,
		key: "maxTokens" | "maxInputTokens" | "maxOutputTokens",
	) => (
		<div className="flex items-center gap-2">
			<Label className="whitespace-nowrap text-xs">{label}:</Label>
			<Input
				type="text"
				inputMode="numeric"
				pattern="[0-9]*"
				placeholder="Unlimited"
				value={currentValue ?? ""}
				onChange={(event) => {
					const parsed = parseLimit(event.target.value);
					onChange({ ...value, [key]: parsed.value });
				}}
				className="h-8 w-28"
			/>
		</div>
	);

	return (
		<div className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
			<div className="flex items-center gap-2">
				<Label className="text-xs">Tokens:</Label>
				<Select
					value={mode}
					onValueChange={(nextMode) =>
						updateMode(nextMode as TokenMode)
					}
				>
					<SelectTrigger className="h-8 w-40">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="TOTAL">Total Tokens</SelectItem>
						<SelectItem value="SPLIT">Input + Output</SelectItem>
					</SelectContent>
				</Select>
			</div>
			{mode === "TOTAL" ? (
				renderInput("Total Tokens", value.maxTokens, "maxTokens")
			) : (
				<>
					{renderInput(
						"Input Tokens",
						value.maxInputTokens,
						"maxInputTokens",
					)}
					{renderInput(
						"Output Tokens",
						value.maxOutputTokens,
						"maxOutputTokens",
					)}
				</>
			)}
			<div className="flex items-center gap-2">
				<Label className="text-xs">Active:</Label>
				<Switch
					checked={value.isActive}
					onCheckedChange={(isActive) =>
						onChange({ ...value, isActive })
					}
				/>
			</div>
			<div className="ml-auto flex shrink-0 items-center gap-1">
				{dirty && (
					<Button
						variant="ghost"
						size="icon"
						className="text-primary"
						onClick={onSave}
						disabled={saving}
						title="Save changes"
					>
						{saving ? (
							<Spinner className="size-4" />
						) : (
							<Save className="size-4" />
						)}
					</Button>
				)}
				{onDelete && (
					<Button
						variant="ghost"
						size="icon"
						className="text-destructive"
						onClick={onDelete}
						disabled={saving}
						title="Remove override"
					>
						<Trash2 className="size-4" />
					</Button>
				)}
			</div>
		</div>
	);
}

export function RoomTokenLimitsPanel() {
	const [loading, setLoading] = useState(true);
	const [limits, setLimits] = useState<RoomTokenLimit[]>([]);
	const [defaultDraft, setDefaultDraft] = useState<LimitDraft>(EMPTY_DRAFT);
	const [userDrafts, setUserDrafts] = useState<Record<string, LimitDraft>>(
		{},
	);
	const [savingId, setSavingId] = useState<string | null>(null);
	const [addDialogOpen, setAddDialogOpen] = useState(false);
	const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);
	const [users, setUsers] = useState<PlatformUser[]>([]);
	const [userSearch, setUserSearch] = useState("");
	const [searchingUsers, setSearchingUsers] = useState(false);
	const [newUserDraft, setNewUserDraft] = useState<LimitDraft>(EMPTY_DRAFT);
	const [deleteTarget, setDeleteTarget] = useState<RoomTokenLimit | null>(
		null,
	);

	const fetchLimits = useCallback(async () => {
		setLoading(true);
		try {
			const response = await runRoomLimitReactor<RoomTokenLimit[]>(
				"AdminGetRoomTokenLimits",
			);
			setLimits(Array.isArray(response) ? response : []);
		} catch (error) {
			console.error("Failed to fetch room token limits", error);
			toast.error("Failed to load room token limits");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchLimits();
	}, [fetchLimits]);

	const defaultLimit = useMemo(
		() => limits.find((limit) => !limit.userId),
		[limits],
	);
	const userLimits = useMemo(
		() => limits.filter((limit) => limit.userId),
		[limits],
	);

	useEffect(() => {
		setDefaultDraft(toDraft(defaultLimit));
		setUserDrafts(
			Object.fromEntries(
				userLimits.map((limit) => [limit.userId, toDraft(limit)]),
			),
		);
	}, [defaultLimit, userLimits]);

	const saveLimit = async (userId: string | null, draft: LimitDraft) => {
		const id = userId ?? "default";
		setSavingId(id);
		try {
			await runRoomLimitReactor("AdminSetRoomTokenLimit", {
				userId,
				maxTokens: serializeLimit(draft.maxTokens),
				maxInputTokens: serializeLimit(draft.maxInputTokens),
				maxOutputTokens: serializeLimit(draft.maxOutputTokens),
				isActive: draft.isActive,
			});
			toast.success(
				userId
					? "User room override saved"
					: "Default room policy saved",
			);
			setAddDialogOpen(false);
			await fetchLimits();
		} catch (error) {
			console.error("Failed to save room token limit", error);
			toast.error("Failed to save room token limit");
		} finally {
			setSavingId(null);
		}
	};

	const removeUserLimit = async (userId: string) => {
		setSavingId(userId);
		try {
			await runRoomLimitReactor("AdminRemoveRoomTokenLimit", { userId });
			toast.success("User room override removed");
			setDeleteTarget(null);
			await fetchLimits();
		} catch (error) {
			console.error("Failed to remove room token limit", error);
			toast.error("Failed to remove user room override");
		} finally {
			setSavingId(null);
		}
	};

	const searchUsers = useCallback(async (search: string) => {
		setSearchingUsers(true);
		try {
			const response = await getAllUsers(true, search.trim(), 0, 20);
			setUsers(
				(response?.users ?? []).map((user) => ({
					id: user.id,
					name: user.name ?? user.username ?? user.id,
					email: user.email ?? "",
					type: user.type ?? "",
				})),
			);
		} catch (error) {
			console.error("Failed to search users", error);
			setUsers([]);
		} finally {
			setSearchingUsers(false);
		}
	}, []);

	const openAddDialog = () => {
		setSelectedUser(null);
		setUserSearch("");
		setNewUserDraft(EMPTY_DRAFT);
		setAddDialogOpen(true);
		searchUsers("");
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center py-20">
				<Spinner className="size-8" />
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<section className="flex flex-col gap-3">
				<div>
					<h3 className="font-semibold text-base">
						Room Platform-Wide Limit
					</h3>
					<p className="text-muted-foreground text-sm">
						Default token policy applied independently to each room.
						Users with active overrides use their override instead.
					</p>
				</div>
				<LimitEditor
					value={defaultDraft}
					onChange={setDefaultDraft}
					onSave={() => saveLimit(null, defaultDraft)}
					dirty={
						!defaultLimit ||
						!draftsEqual(defaultDraft, toDraft(defaultLimit))
					}
					saving={savingId === "default"}
				/>
			</section>

			<section className="flex flex-col gap-3">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<h3 className="font-semibold text-base">
							User Overrides
						</h3>
						<p className="text-muted-foreground text-sm">
							Override the default room policy for specific users.
							Inactive overrides fall back to the default policy.
						</p>
					</div>
					<Button size="sm" onClick={openAddDialog}>
						<Plus className="mr-1 size-4" />
						Add User Override
					</Button>
				</div>
				{userLimits.length === 0 ? (
					<div className="flex flex-col items-center gap-2 rounded-lg border py-8 text-muted-foreground">
						<Users className="size-8" />
						<p className="text-sm">
							No user-specific room overrides configured.
						</p>
					</div>
				) : (
					<div className="flex flex-col gap-3">
						{userLimits.map((limit) => {
							const userId = limit.userId as string;
							const draft = userDrafts[userId] ?? toDraft(limit);
							return (
								<div
									key={userId}
									className="flex flex-col gap-2"
								>
									<div>
										<p className="font-medium text-sm">
											{limit.userName || userId}
										</p>
										<p className="text-muted-foreground text-xs">
											{limit.userEmail
												? `${userId} · ${limit.userEmail}`
												: userId}
										</p>
									</div>
									<LimitEditor
										value={draft}
										onChange={(nextDraft) =>
											setUserDrafts((current) => ({
												...current,
												[userId]: nextDraft,
											}))
										}
										onSave={() => saveLimit(userId, draft)}
										onDelete={() => setDeleteTarget(limit)}
										dirty={
											!draftsEqual(draft, toDraft(limit))
										}
										saving={savingId === userId}
									/>
								</div>
							);
						})}
					</div>
				)}
			</section>

			<Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
				<DialogContent className="sm:max-w-2xl">
					<DialogHeader>
						<DialogTitle>Add User Room Override</DialogTitle>
						<DialogDescription>
							Select a user and configure the token policy applied
							to each of their rooms.
						</DialogDescription>
					</DialogHeader>
					<div className="flex flex-col gap-4">
						<div className="flex flex-col gap-2">
							<Label>User</Label>
							{selectedUser ? (
								<div className="flex items-center justify-between rounded-lg border p-3">
									<div>
										<p className="font-medium text-sm">
											{selectedUser.name}
										</p>
										<p className="text-muted-foreground text-xs">
											{selectedUser.id}
											{selectedUser.email
												? ` · ${selectedUser.email}`
												: ""}
										</p>
									</div>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setSelectedUser(null)}
									>
										Change
									</Button>
								</div>
							) : (
								<>
									<Input
										placeholder="Search users"
										value={userSearch}
										onChange={(event) => {
											const search = event.target.value;
											setUserSearch(search);
											searchUsers(search);
										}}
									/>
									<div className="max-h-48 overflow-y-auto rounded-lg border">
										{searchingUsers ? (
											<div className="flex justify-center py-6">
												<Spinner className="size-5" />
											</div>
										) : (
											users
												.filter(
													(user) =>
														!userLimits.some(
															(limit) =>
																limit.userId ===
																user.id,
														),
												)
												.map((user) => (
													<button
														type="button"
														key={user.id}
														className="flex w-full flex-col px-3 py-2 text-left hover:bg-muted"
														onClick={() =>
															setSelectedUser(
																user,
															)
														}
													>
														<span className="font-medium text-sm">
															{user.name}
														</span>
														<span className="text-muted-foreground text-xs">
															{user.id}
															{user.email
																? ` · ${user.email}`
																: ""}
														</span>
													</button>
												))
										)}
									</div>
								</>
							)}
						</div>
						<LimitEditor
							value={newUserDraft}
							onChange={setNewUserDraft}
							onSave={() => undefined}
							dirty={false}
							saving={false}
						/>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setAddDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button
							onClick={() => {
								if (selectedUser) {
									saveLimit(selectedUser.id, newUserDraft);
								}
							}}
							disabled={
								!selectedUser || savingId === selectedUser?.id
							}
						>
							{savingId === selectedUser?.id
								? "Saving..."
								: "Add Override"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={deleteTarget !== null}
				onOpenChange={(open) => {
					if (!open) setDeleteTarget(null);
				}}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Remove User Override</DialogTitle>
						<DialogDescription>
							{deleteTarget?.userName || deleteTarget?.userId}{" "}
							will revert to the default room policy.
						</DialogDescription>
					</DialogHeader>
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
								if (deleteTarget?.userId) {
									removeUserLimit(deleteTarget.userId);
								}
							}}
							disabled={savingId === deleteTarget?.userId}
						>
							Remove
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
