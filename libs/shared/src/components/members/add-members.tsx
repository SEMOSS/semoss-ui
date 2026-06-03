import { ChevronDown, X } from "lucide-react";
import {
	type ChangeEvent,
	type KeyboardEvent,
	useEffect,
	useRef,
	useState,
} from "react";

const PAGE_SIZE = 50;

import { get as apiGet, post as apiPost, Env } from "@semoss/sdk";
import {
	Avatar,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
	toast,
} from "@semoss/ui/next";
import { returnAccessType } from "./common";

interface AddPopupSearchResult {
	email: string;
	id: string;
	name: string;
	type: string;
	username: string;
}

interface UserSelected extends AddPopupSearchResult {
	permission: string;
}

interface AddMembersOverlayProps {
	id: string;
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
	open: boolean;
	onClose: (success?: boolean) => void;
	className?: string;
	adminMode?: boolean;
}

export const AddMembersOverlay = ({
	id,
	type,
	open,
	onClose,
	adminMode = false,
}: AddMembersOverlayProps) => {
	const inputRef = useRef<HTMLInputElement>(null);
	const [searchKey, setSearchKey] = useState<string>("");
	const [selectedUsers, setSelectedUsers] = useState<UserSelected[]>([]);
	const [searchedResults, setSearchedResults] = useState<
		AddPopupSearchResult[]
	>([]);
	const [offset, setOffset] = useState<number>(0);
	const [hasMore, setHasMore] = useState<boolean>(true);
	const fetchVersionRef = useRef(0);
	const isFetchingRef = useRef(false);
	const [isSearching, setIsSearching] = useState<boolean>(false);
	const [userPermission, setUserPermission] = useState<string>("");
	const isProject = type === "PROJECT" || type === "WORKSPACE";
	const isOwner = adminMode || userPermission === "OWNER";

	// Reset to page 0 whenever the search term changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset-only effect
	useEffect(() => {
		setOffset(0);
		setSearchedResults([]);
		setHasMore(true);
	}, [searchKey]);

	// Fetch a page; use a version ref to discard stale responses
	// biome-ignore lint/correctness/useExhaustiveDependencies: adminMode intentionally excluded to avoid refetch on prop change
	useEffect(() => {
		if (!open) return;
		const version = ++fetchVersionRef.current;
		async function fetchUsers() {
			isFetchingRef.current = true;
			setIsSearching(true);
			const authBase = `${Env.MODULE}/api/auth${adminMode ? "/admin" : ""}`;
			const endpoint = isProject
				? "getProjectUsersNoCredentials"
				: "getEngineUsersNoCredentials";
			const idKey = isProject ? "projectId" : "engineId";
			const response = await apiGet(
				`${authBase}/${isProject ? "project" : "engine"}/${endpoint}?${idKey}=${id}&searchTerm=${searchKey}&limit=${PAGE_SIZE}&offset=${offset}`,
			).catch((error: Error) => {
				isFetchingRef.current = false;
				if (fetchVersionRef.current !== version) return undefined;
				setIsSearching(false);
				toast.error(error?.message || "Failed to load users.");
				return undefined;
			});
			isFetchingRef.current = false;
			if (fetchVersionRef.current !== version) return;
			setIsSearching(false);
			const page = (response?.data ?? []) as AddPopupSearchResult[];
			setSearchedResults((prev) =>
				offset === 0 ? page : [...prev, ...page],
			);
			setHasMore(page.length === PAGE_SIZE);
		}
		fetchUsers();
	}, [searchKey, offset, id, isProject, open]);

	// Fetch the current user's permission for this resource when the dialog opens
	useEffect(() => {
		if (!open) return;
		async function fetchMyPermission() {
			const endpoint = isProject
				? `project/getUserProjectPermission?projectId=${id}`
				: `engine/getUserEnginePermission?engineId=${id}`;
			const response = await apiGet(
				`${Env.MODULE}/api/auth/${endpoint}`,
			).catch(() => undefined);
			const perm = (response?.data as { permission?: string })
				?.permission;
			if (perm) setUserPermission(perm);
		}
		fetchMyPermission();
	}, [open, id, isProject]);

	async function addNewMembers() {
		if (selectedUsers.length === 0) return;

		const userpermissions = selectedUsers.map((m) => {
			return {
				userid: m.id,
				permission: returnAccessType(m.permission, true),
				email: m.email,
				name: m.name,
				type: m.type,
				username: m.username,
			};
		});

		const authBase = `${Env.MODULE}/api/auth${adminMode ? "/admin" : ""}`;
		const response = await apiPost(
			`${authBase}/${isProject ? "project" : "engine"}/${isProject ? "addProjectUserPermissions" : "addEngineUserPermissions"}`,
			{ [isProject ? "projectId" : "engineId"]: id, userpermissions },
		).catch((error: Error) => {
			toast.error(
				error?.message ||
					"There was an error adding the selected members.",
			);
			resetState();
			onClose(true);
		});

		const responseData = (response?.data || {}) as { success?: boolean };
		if (responseData.success) {
			toast.success("Selected members have been added successfully.");
			resetState();
			onClose(true);
		}
	}

	function resetState() {
		setSelectedUsers([]);
		setSearchKey("");
		setOffset(0);
		setHasMore(true);
		setUserPermission("");
		setIsSearching(false);
	}

	function toggleUserSelected(user: AddPopupSearchResult) {
		setSelectedUsers((prev) =>
			prev.find((u) => u.email === user.email)
				? prev.filter((u) => u.email !== user.email)
				: [...prev, { ...user, permission: "Viewer" }],
		);
	}

	function tryAddFromText(text: string) {
		const trimmed = text.trim().toLowerCase();
		if (!trimmed) return;
		const match =
			searchedResults.length === 1
				? searchedResults[0]
				: searchedResults.find(
						(r) =>
							r.email.toLowerCase() === trimmed ||
							r.name.toLowerCase() === trimmed,
					);
		if (match) toggleUserSelected(match);
	}

	function handleSearchChange(e: ChangeEvent<HTMLInputElement>) {
		setSearchKey(e.target.value);
	}

	function handleSearchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
		// Press Enter to add: exact name/email match, or auto-select if only one result remains
		if (e.key === "Enter" && searchKey.trim()) {
			e.preventDefault();
			tryAddFromText(searchKey);
			setSearchKey("");
		}
	}

	function handleResultsScroll(e: React.UIEvent<HTMLDivElement>) {
		const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
		if (
			scrollHeight - scrollTop - clientHeight < 60 &&
			hasMore &&
			!isFetchingRef.current
		) {
			setOffset((prev) => prev + PAGE_SIZE);
		}
	}

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
					<DialogTitle>Add Members</DialogTitle>
					<DialogDescription>
						Search for users and invite them to this resource.
					</DialogDescription>
				</DialogHeader>

				{/* Search input */}
				<input
					ref={inputRef}
					className="h-10 w-full shrink-0 rounded border bg-background px-3 text-sm outline-none ring-primary placeholder:text-muted-foreground focus:ring-2"
					placeholder="Search by name or email..."
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
					{/* Search results */}
					<div
						className="max-h-56 min-h-32 w-full shrink-0 overflow-y-auto rounded-md border bg-background"
						onScroll={handleResultsScroll}
					>
						{searchedResults.length > 0 ? (
							searchedResults.map((item) => {
								const isAdded = selectedUsers.some(
									(u) => u.email === item.email,
								);
								return (
									<button
										key={`${item.type}-${item.id}`}
										type="button"
										className="flex w-full items-center justify-between px-3 py-2 text-start text-sm hover:bg-accent"
										onClick={() => toggleUserSelected(item)}
									>
										<span className="flex items-center gap-2">
											<Avatar className="h-7 w-7 items-center justify-center bg-muted text-muted-foreground text-xs">
												{item.name
													.charAt(0)
													.toUpperCase()}
											</Avatar>
											<span className="flex flex-col">
												<span className="font-medium">
													{item.name}
												</span>
												<span className="text-muted-foreground text-xs">
													id: {item.id}
												</span>
												<span className="text-muted-foreground text-xs">
													email: {item.email}
												</span>
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
								{isSearching
									? "Searching for users..."
									: "No users found"}
							</div>
						)}
					</div>

					{/* Selected users — always shown, scrollable cards */}
					<div className="flex flex-col gap-2">
						<span className="font-medium text-muted-foreground text-sm">
							{selectedUsers.length} user
							{selectedUsers.length !== 1 ? "s" : ""} selected
						</span>
						<div className="flex max-h-44 flex-col gap-1.5 overflow-y-auto">
							{selectedUsers.map((u, i) => (
								<div
									key={`${u.type}-${u.id}`}
									className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2"
								>
									<span className="flex items-center gap-2">
										<Avatar className="h-8 w-8 items-center justify-center bg-muted text-muted-foreground text-sm">
											{u.name.charAt(0).toUpperCase()}
										</Avatar>
										<span className="flex flex-col">
											<span className="font-medium text-sm">
												{u.name}
											</span>
											<span className="text-muted-foreground text-xs">
												id: {u.id}
											</span>
											<span className="text-muted-foreground text-xs">
												email: {u.email}
											</span>
										</span>
									</span>
									<div className="flex flex-col items-end gap-1.5">
										<button
											type="button"
											className="text-muted-foreground hover:text-destructive"
											onClick={() =>
												toggleUserSelected(u)
											}
										>
											<X className="h-4 w-4" />
										</button>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant="outline"
													className="shrink-0"
												>
													{u.permission}
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
															(prev) =>
																prev.map(
																	(s, idx) =>
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
													Viewer
												</DropdownMenuCheckboxItem>
												<DropdownMenuCheckboxItem
													checked={
														u.permission ===
														"Editor"
													}
													onCheckedChange={() =>
														setSelectedUsers(
															(prev) =>
																prev.map(
																	(s, idx) =>
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
													Editor
												</DropdownMenuCheckboxItem>
												{isOwner && (
													<DropdownMenuCheckboxItem
														checked={
															u.permission ===
															"Owner"
														}
														onCheckedChange={() =>
															setSelectedUsers(
																(prev) =>
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
														Owner
													</DropdownMenuCheckboxItem>
												)}
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
				{/* end scrollable middle section */}

				{/* Footer: permission selector + invite */}
				<div className="flex items-center justify-end border-t pt-3">
					<Button
						onClick={addNewMembers}
						disabled={selectedUsers.length === 0}
					>
						Add{" "}
						{selectedUsers.length > 0
							? `(${selectedUsers.length})`
							: ""}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};
