import { Check, ChevronDown, X } from "lucide-react";
import {
	type ChangeEvent,
	type KeyboardEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";

const PAGE_SIZE = 50;

import { useTranslation } from "@semoss/i18n";
import {
	addEngineUserPermissions,
	addProjectUserPermissions,
	getEngineUsersNoCredentials,
	getProjectUsersNoCredentials,
	getUserEnginePermission,
	getUserProjectPermission,
	type PostUser,
} from "@semoss/sdk";
import { useIteratorApi } from "@semoss/sdk/react";
import {
	Avatar,
	AvatarFallback,
	Button,
	cn,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
	Input,
	ScrollArea,
	toast,
	useDebouncedValue,
	useInfiniteScroll,
} from "@semoss/ui/next";
import { returnAccessType } from "./common";
import { ModelRestrictionFields } from "./model-restriction-fields";
import { type UserSource, UserSourceToggle } from "./user-source-toggle";

interface AddPopupSearchResult {
	email: string | null;
	id: string;
	name: string | null;
	type: string;
	username: string | null;
}

interface UserSelected extends AddPopupSearchResult {
	permission: string;
}

interface AddMembersOverlayProps {
	/** Id of the project or engine members are added to */
	id: string;
	/** Kind of resource; projects and workspaces use the project endpoints */
	type:
		| "PROJECT"
		| "ENGINE"
		| "DATABASE"
		| "STORAGE"
		| "MODEL"
		| "VECTOR"
		| "FUNCTION"
		| "WORKSPACE"
		| "GUARDRAIL";
	/** Whether the dialog is open */
	open: boolean;
	/** Called when the dialog closes, with true after members were added */
	onClose: (success?: boolean) => void;
	/** Classes for the dialog */
	className?: string;
	/** Whether to use the admin endpoints */
	adminMode?: boolean;
	/**
	 * Whether the server can search the organization's Microsoft directory.
	 * When true, the dialog offers a choice between existing users and the
	 * whole organization, starting on the organization.
	 */
	isDirectoryAvailable?: boolean;
}

/** The text a person is shown and matched by: name, then email, then id */
const getDisplayName = (user: AddPopupSearchResult): string =>
	user.name || user.email || user.id;

// Shared row style so the search-results list and the selected-users list read as one system
const MEMBER_ROW_CLASS =
	"flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2";

export const AddMembersOverlay = ({
	id,
	type,
	open,
	onClose,
	adminMode = false,
	isDirectoryAvailable = false,
}: AddMembersOverlayProps) => {
	const { t } = useTranslation("members");
	const inputRef = useRef<HTMLInputElement>(null);
	const [searchKey, setSearchKey] = useState<string>("");
	const debouncedSearchKey = useDebouncedValue(searchKey, 300);
	const [selectedUsers, setSelectedUsers] = useState<UserSelected[]>([]);
	const [restriction, setRestriction] = useState<string>("null");
	const [maxTokens, setMaxTokens] = useState<string>("");
	const [maxTime, setMaxTime] = useState<string>("");
	const [frequency, setFrequency] = useState<string>("DAY");
	const [userPermission, setUserPermission] = useState<string>("");
	const [source, setSource] = useState<UserSource>("directory");
	// Without the directory, leave the choice to the backend
	const msGraphLookup = isDirectoryAvailable
		? source === "directory"
		: undefined;
	const isProject = type === "PROJECT" || type === "WORKSPACE";
	const isOwner = adminMode || userPermission === "OWNER";
	// Debounce hasn't caught up to the latest keystroke yet
	const isDebouncePending = searchKey !== debouncedSearchKey;

	const usersIterator = useIteratorApi<AddPopupSearchResult>(
		async (limit, offset) => {
			try {
				const users = isProject
					? await getProjectUsersNoCredentials(
							id,
							adminMode,
							debouncedSearchKey,
							limit,
							offset,
							msGraphLookup,
						)
					: await getEngineUsersNoCredentials(
							id,
							adminMode,
							debouncedSearchKey,
							limit,
							offset,
							msGraphLookup,
						);
				return users as unknown as AddPopupSearchResult[];
			} catch (error) {
				toast.error(
					error instanceof Error
						? error.message
						: t("errors.loadUsersFailed"),
				);
				throw error;
			}
		},
		{ enabled: open, limit: PAGE_SIZE },
		// adminMode intentionally excluded to avoid refetch on prop change
		[debouncedSearchKey, id, isProject, msGraphLookup],
	);
	const isLoadingResults = isDebouncePending || usersIterator.isLoading;
	// Latches true the first time a fetch completes and never resets, so the
	// empty-results placeholder can settle on "No users found" for good after
	// that — otherwise every keystroke that still matches nothing flips the
	// text back and forth between that and "Searching...".
	const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
	useEffect(() => {
		if (!usersIterator.isLoading) {
			setHasLoadedOnce(true);
		}
	}, [usersIterator.isLoading]);

	// Stable onNext so useInfiniteScroll doesn't tear down its listener each
	// time the iterator's `next` identity changes (mirrors engine-select.tsx).
	const usersNextRef = useRef(usersIterator.next);
	useEffect(() => {
		usersNextRef.current = usersIterator.next;
	}, [usersIterator.next]);
	const handleUsersNext = useCallback(() => usersNextRef.current(), []);

	const { setScroll: setResultsScroll } = useInfiniteScroll({
		disabled: usersIterator.isLoading || !usersIterator.hasMore,
		onNext: handleUsersNext,
	});

	// Fetch the current user's permission for this resource when the dialog opens
	useEffect(() => {
		if (!open) return;
		const fetchMyPermission = async () => {
			try {
				const perm = isProject
					? await getUserProjectPermission(id)
					: await getUserEnginePermission(id);
				if (perm) setUserPermission(perm);
			} catch {
				// Non-fatal: falls back to the default (non-owner) permission
			}
		};
		fetchMyPermission();
	}, [open, id, isProject]);

	const addNewMembers = async () => {
		if (selectedUsers.length === 0) return;

		const userpermissions = selectedUsers.map((m) => {
			const base = {
				userid: m.id,
				permission: returnAccessType(m.permission, true),
				email: m.email,
				name: m.name,
				type: m.type,
				username: m.username,
			};
			if (type !== "MODEL") return base;
			return {
				...base,
				...(restriction !== "null" && {
					usageRestriction: restriction,
				}),
				...(restriction === "token" && {
					maxTokens: Number(maxTokens),
				}),
				...(restriction === "compute" && {
					maxResponseTime: Number(maxTime),
				}),
				...(restriction !== "null" && { usageFrequency: frequency }),
			};
		});

		try {
			const success = isProject
				? await addProjectUserPermissions(
						id,
						userpermissions as unknown as PostUser[],
						adminMode,
					)
				: await addEngineUserPermissions(
						id,
						userpermissions as unknown as PostUser[],
						adminMode,
					);
			if (success) {
				toast.success(t("success.membersAdded"));
				resetState();
				onClose(true);
			}
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: t("errors.addMembersFailed"),
			);
			resetState();
			onClose(true);
		}
	};

	const resetState = () => {
		setSelectedUsers([]);
		setSearchKey("");
		usersIterator.reset();
		setRestriction("null");
		setMaxTokens("");
		setMaxTime("");
		setFrequency("DAY");
		setUserPermission("");
		setSource("directory");
	};

	const permissionLabel = (permission: string): string => {
		switch (permission) {
			case "Viewer":
				return t("permission.viewer");
			case "Editor":
				return t("permission.editor");
			case "Owner":
				return t("permission.owner");
			default:
				return permission;
		}
	};

	const toggleUserSelected = (user: AddPopupSearchResult) => {
		setSelectedUsers((prev) =>
			prev.find((u) => u.id === user.id)
				? prev.filter((u) => u.id !== user.id)
				: [...prev, { ...user, permission: "Viewer" }],
		);
	};

	const tryAddFromText = (text: string) => {
		const trimmed = text.trim().toLowerCase();
		if (!trimmed) return;
		const match =
			usersIterator.data.length === 1
				? usersIterator.data[0]
				: usersIterator.data.find(
						(r) =>
							r.email?.toLowerCase() === trimmed ||
							r.name?.toLowerCase() === trimmed,
					);
		if (match) toggleUserSelected(match);
	};

	const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
		setSearchKey(e.target.value);
	};

	const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		// Press Enter to add: exact name/email match, or auto-select if only one result remains
		if (e.key === "Enter" && searchKey.trim()) {
			e.preventDefault();
			tryAddFromText(searchKey);
			setSearchKey("");
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={() => {
				resetState();
				onClose();
			}}
		>
			<DialogContent className="flex max-h-[90vh] w-full max-w-2xl flex-col gap-4 overflow-hidden">
				<DialogHeader>
					<DialogTitle className="font-medium text-base leading-6">
						{t("dialog.title")}
					</DialogTitle>
					<DialogDescription>
						{t("dialog.description")}
					</DialogDescription>
				</DialogHeader>

				{isDirectoryAvailable && (
					<UserSourceToggle
						className="shrink-0"
						value={source}
						onValueChange={setSource}
					/>
				)}

				{/* Search input */}
				<Input
					ref={inputRef}
					className="shrink-0"
					aria-label={t("search.placeholder")}
					placeholder={t("search.placeholder")}
					value={searchKey}
					autoComplete="off"
					autoCorrect="off"
					autoCapitalize="off"
					spellCheck={false}
					onChange={handleSearchChange}
					onKeyDown={handleSearchKeyDown}
				/>

				{/* Scrollable middle section */}
				<div className="flex flex-1 flex-col gap-4 overflow-y-auto">
					{/* Results + selected users share one fixed-height pane so the
					    dialog never resizes: results fill it entirely until the
					    first person is selected, then the selected-users list
					    claims a fixed slice at the bottom. */}
					<div className="flex h-[28rem] shrink-0 flex-col gap-4">
						{/* Search results */}
						<ScrollArea
							viewportRef={setResultsScroll}
							className={cn(
								"min-h-0 w-full flex-1 rounded-md border bg-background transition-opacity",
								isLoadingResults && "opacity-60",
							)}
						>
							<div className="flex flex-col gap-1.5 p-2">
								{usersIterator.data.length > 0 ? (
									usersIterator.data.map((item) => {
										const isAdded = selectedUsers.some(
											(u) => u.id === item.id,
										);
										return (
											<button
												key={`${item.type}-${item.id}`}
												type="button"
												className={cn(
													MEMBER_ROW_CLASS,
													"w-full text-start hover:bg-accent",
												)}
												onClick={() =>
													toggleUserSelected(item)
												}
											>
												<span className="flex items-center gap-2">
													<Avatar className="h-8 w-8">
														<AvatarFallback className="text-muted-foreground text-sm">
															{getDisplayName(
																item,
															)
																.charAt(0)
																.toUpperCase()}
														</AvatarFallback>
													</Avatar>
													<span className="flex min-w-0 flex-col">
														<span className="truncate font-medium text-sm">
															{getDisplayName(
																item,
															)}
														</span>
														<span className="truncate text-muted-foreground text-xs">
															id: {item.id}
														</span>
														{item.email && (
															<span className="truncate text-muted-foreground text-xs">
																email:{" "}
																{item.email}
															</span>
														)}
													</span>
												</span>
												{isAdded && (
													<span className="flex shrink-0 items-center gap-1 font-medium text-primary text-xs">
														{t("search.added")}
														<Check
															className="size-3"
															aria-hidden
														/>
													</span>
												)}
											</button>
										);
									})
								) : (
									<div className="px-3 py-4 text-center text-muted-foreground text-sm">
										{!hasLoadedOnce && isLoadingResults
											? t("search.searching")
											: msGraphLookup
												? t("search.emptyDirectory")
												: t("search.empty")}
									</div>
								)}
							</div>
						</ScrollArea>

						{/* Selected users — always shown at a fixed height so adding
					    the first person never resizes the dialog either */}
						<div className="flex h-48 shrink-0 flex-col gap-2">
							<span className="font-medium text-muted-foreground text-sm">
								{t("selected.count", {
									count: selectedUsers.length,
								})}
							</span>
							<ScrollArea className="min-h-0 w-full flex-1 rounded-md border bg-background">
								{selectedUsers.length > 0 ? (
									<div className="flex flex-col gap-1.5 p-2">
										{selectedUsers.map((u, i) => (
											<div
												key={`${u.type}-${u.id}`}
												className={MEMBER_ROW_CLASS}
											>
												<span className="flex items-center gap-2">
													<Avatar className="h-8 w-8">
														<AvatarFallback className="text-muted-foreground text-sm">
															{getDisplayName(u)
																.charAt(0)
																.toUpperCase()}
														</AvatarFallback>
													</Avatar>
													<span className="flex min-w-0 flex-col">
														<span className="truncate font-medium text-sm">
															{getDisplayName(u)}
														</span>
														<span className="truncate text-muted-foreground text-xs">
															id: {u.id}
														</span>
														{u.email && (
															<span className="truncate text-muted-foreground text-xs">
																email: {u.email}
															</span>
														)}
													</span>
												</span>
												<div className="flex flex-col items-end gap-1.5">
													<button
														type="button"
														aria-label={t(
															"selected.remove",
															{
																name: getDisplayName(
																	u,
																),
															},
														)}
														className="text-muted-foreground hover:text-destructive"
														onClick={() =>
															toggleUserSelected(
																u,
															)
														}
													>
														<X
															className="size-4"
															aria-hidden
														/>
													</button>
													<DropdownMenu>
														<DropdownMenuTrigger
															asChild
														>
															<Button
																variant="outline"
																className="shrink-0"
															>
																{permissionLabel(
																	u.permission,
																)}
																<ChevronDown className="ms-1 h-4 w-4" />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent>
															<DropdownMenuCheckboxItem
																checked={
																	u.permission ===
																	"Viewer"
																}
																onCheckedChange={() =>
																	setSelectedUsers(
																		(
																			prev,
																		) =>
																			prev.map(
																				(
																					s,
																					idx,
																				) =>
																					idx ===
																					i
																						? {
																								...s,
																								permission:
																									"Viewer",
																							}
																						: s,
																			),
																	)
																}
															>
																{t(
																	"permission.viewer",
																)}
															</DropdownMenuCheckboxItem>
															<DropdownMenuCheckboxItem
																checked={
																	u.permission ===
																	"Editor"
																}
																onCheckedChange={() =>
																	setSelectedUsers(
																		(
																			prev,
																		) =>
																			prev.map(
																				(
																					s,
																					idx,
																				) =>
																					idx ===
																					i
																						? {
																								...s,
																								permission:
																									"Editor",
																							}
																						: s,
																			),
																	)
																}
															>
																{t(
																	"permission.editor",
																)}
															</DropdownMenuCheckboxItem>
															{isOwner && (
																<DropdownMenuCheckboxItem
																	checked={
																		u.permission ===
																		"Owner"
																	}
																	onCheckedChange={() =>
																		setSelectedUsers(
																			(
																				prev,
																			) =>
																				prev.map(
																					(
																						s,
																						idx,
																					) =>
																						idx ===
																						i
																							? {
																									...s,
																									permission:
																										"Owner",
																								}
																							: s,
																				),
																		)
																	}
																>
																	{t(
																		"permission.owner",
																	)}
																</DropdownMenuCheckboxItem>
															)}
														</DropdownMenuContent>
													</DropdownMenu>
												</div>
											</div>
										))}
									</div>
								) : (
									<div className="px-3 py-4 text-center text-muted-foreground text-sm">
										{t("selected.empty")}
									</div>
								)}
							</ScrollArea>
						</div>
					</div>

					{/* MODEL restriction fields */}
					{type === "MODEL" && (
						<ModelRestrictionFields
							restriction={restriction}
							setRestriction={setRestriction}
							maxTokens={maxTokens}
							setMaxTokens={setMaxTokens}
							maxTime={maxTime}
							setMaxTime={setMaxTime}
							frequency={frequency}
							setFrequency={setFrequency}
						/>
					)}
				</div>
				{/* end scrollable middle section */}

				{/* Footer: permission selector + invite */}
				<div className="flex items-center justify-end border-t pt-3">
					<Button
						onClick={addNewMembers}
						disabled={selectedUsers.length === 0}
					>
						{selectedUsers.length > 0
							? t("footer.addWithCount", {
									count: selectedUsers.length,
								})
							: t("footer.add")}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};
