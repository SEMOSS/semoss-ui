import {
	ArrowDown,
	ArrowUp,
	Pencil,
	Plus,
	Search as SearchIcon,
	Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDebouncedValue } from "@semoss/sdk/react";
import {
	editProjectUserPermissions,
	type getUserProjectPermission,
} from "@semoss/shared";
import {
	Avatar,
	AvatarFallback,
	Button,
	Checkbox,
	H4,
	Input,
	P,
	RadioGroup,
	RadioGroupItem,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Skeleton,
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
	toast,
} from "@semoss/ui/next";
import { editEngineUserPermissions, type getUserEnginePermission } from "@/api";
import FilteredIcon from "@/assets/img/FilteredIcon.png";
import { useAPI, useRootStore, useSettings } from "@/hooks";
import type { ALL_TYPES } from "@/types";
import { permissionPriorityMapper } from "@/utility/general";
import { MembersAddOverlay } from "./members-add-overlay";
import { MembersDeleteOverlay } from "./members-delete-overlay";
import type {
	SETTINGS_PROVISIONED_USER,
	SETTINGS_ROLE,
} from "./settings.types";
import { UserPopover } from "./user-popover";

const formatValue = (input: string) => {
	if (input !== undefined) {
		const mappings: Record<string, string> = {
			TOKEN: "Token",
			COMPUTE: "Compute time",
			DAY: "Daily",
			WEEK: "Weekly",
			MONTH: "Monthly",
			NULL: "None",
		};
		return mappings[input.toUpperCase()] || input;
	}
	return "";
};

interface MembersTableProps {
	/**
	 * Id of the engine
	 */
	id: string;

	/**
	 * Type of the engine
	 */
	type: ALL_TYPES;

	/**
	 * Called when permissions are changed
	 */
	onChange?: () => void;
}

interface User {
	id: string;
	type: string;
	name: string;
	email: string;
	permission_granted_by_type: string;
	permission_granted_by: string;
	permission: string;
	date_added: string;
	usage_restriction?: string;
	usage_frequency?: string;
	max_tokens?: number;
	max_response_time?: number;
}

interface AllAuthorsResponseData {
	members: SETTINGS_PROVISIONED_USER[];
}

interface GetMembersData {
	members: SETTINGS_PROVISIONED_USER[];
	totalMembers: number;
}

interface JsonType {
	userid: string;
	permission: string;
	maxResponseTime?: number;
	usageRestriction?: string;
	usageFrequency?: string;
	maxTokens?: number;
}

export const MembersTable = (props: MembersTableProps) => {
	const { id, type, onChange = () => null } = props;

	const { configStore } = useRootStore();
	const { adminMode } = useSettings();

	/** Member Table States */
	const [page, setPage] = useState<number>(0);
	const [rowsPerPage, setRowsPerPage] = useState<number>(5);
	const [search, setSearch] = useState<string>("");
	const [isSearch, setIsSearch] = useState<boolean>(false);
	const [permissionFilter, _setPermissionFilter] = useState<string>("");
	const [selectedMembers, setSelectedMembers] = useState<
		SETTINGS_PROVISIONED_USER[]
	>([]);
	/* Table Sorting */
	const [nameOrder, setNameOrder] = useState<"asc" | "desc">("asc");
	const [permissionOrder, setPermissionOrder] = useState<"asc" | "desc">(
		"asc",
	);

	const [userData, setUserData] = useState<SETTINGS_PROVISIONED_USER>(
		{} as SETTINGS_PROVISIONED_USER,
	);
	const [userPermission, setUserPermission] =
		useState<SETTINGS_ROLE>("Read-Only");

	// debounce the input
	const debouncedSearch = useDebouncedValue(search);

	/** Delete Member */
	const [deleteMembersModal, setDeleteMembersModal] =
		useState<boolean>(false);
	const [pendingDeletedMembers, setPendingDeletedMembers] = useState<
		SETTINGS_PROVISIONED_USER[]
	>([]);

	/** Add Member State */
	const [addMembersModal, setAddMembersModal] = useState<boolean>(false);
	const [addModalUser, setAddModalUser] = useState<User | null>(null);

	// get the api
	let getMembersApi: Parameters<typeof useAPI>[0] = null;
	let getUserDataApi: Parameters<typeof useAPI>[0] = null;
	let getAllAuthorsApi: Parameters<typeof useAPI>[0] = null;
	if (type === "PROJECT") {
		getUserDataApi = ["getUserProjectPermission", id];
		getMembersApi = [
			"getProjectUsers",
			id,
			adminMode,
			debouncedSearch ? debouncedSearch : undefined,
			permissionPriorityMapper(permissionFilter)?.permission,
			rowsPerPage, // limit
			(page + 1) * rowsPerPage - rowsPerPage, // offset
		];
		getAllAuthorsApi = [
			"getProjectUsers",
			adminMode,
			id,
			undefined, // no search
			"OWNER", // OWNER Permission Filter
			undefined, // limit
			undefined, // offset
		];
	} else if (
		type === "DATABASE" ||
		type === "STORAGE" ||
		type === "MODEL" ||
		type === "VECTOR" ||
		type === "GUARDRAIL" ||
		type === "FUNCTION"
	) {
		getUserDataApi = ["getUserEnginePermission", id];
		getMembersApi = [
			"getEngineUsers",
			adminMode,
			id,
			debouncedSearch ? debouncedSearch : undefined,
			permissionPriorityMapper(permissionFilter)?.permission,
			(page + 1) * rowsPerPage - rowsPerPage, // offset
			rowsPerPage, // limit
		];
		getAllAuthorsApi = [
			"getEngineUsers",
			adminMode,
			id,
			undefined, // no search
			"OWNER", // OWNER Permission Filter
			undefined, // offset
			undefined, // limit
		];
	}

	// Update userDetails to AUTHOR if ADMIN
	const getMembers = useAPI(getMembersApi);
	const userDetailsResponse = useAPI(getUserDataApi);
	const userDetails = adminMode
		? {
				data: {
					permission: "OWNER",
				},
				status: "SUCCESS",
				refresh: () => null,
			}
		: userDetailsResponse;
	const allAuthorsResponse = useAPI(getAllAuthorsApi);
	const [allAuthors, setAllAuthors] = useState<SETTINGS_PROVISIONED_USER[]>(
		[],
	);

	console.log(getMembers);

	useEffect(() => {
		if (
			allAuthorsResponse.status === "SUCCESS" &&
			allAuthorsResponse.data
		) {
			const data = allAuthorsResponse.data as AllAuthorsResponseData;
			setAllAuthors(data.members);
		} else {
			setAllAuthors([]);
		}
	}, [allAuthorsResponse.status, allAuthorsResponse.data]);

	//Below UseEffect has been added so that search supersedes pagination , when the user goes to a different page and searches any user the pagination is set 0 and the user is being displayed.
	useEffect(() => {
		setPage(0);
	}, [debouncedSearch]);

	/**
	 * Sets the user details based on the current user in the members array.
	 * If the user is an admin, it sets the user permission to 'Author'.
	 * Otherwise, it sets the user permission based on the user's permission in the members array.
	 * @param members The array of members to set the user details from
	 */
	const setUserDetails = () => {
		if (!userDetails.data) {
			return;
		}

		const userPermission =
			type === "PROJECT"
				? (userDetails.data as Awaited<
						ReturnType<typeof getUserProjectPermission>
					>)
				: (
						userDetails.data as Awaited<
							ReturnType<typeof getUserEnginePermission>
						>
					).permission;
		if (adminMode) {
			const adminPermissionPriority = "Author";
			setUserPermission(
				permissionPriorityMapper(adminPermissionPriority)
					?.permission as SETTINGS_ROLE,
			);
		} else {
			setUserPermission(
				permissionPriorityMapper(
					userPermission === "OWNER" ? "Author" : userPermission,
				)?.permission as SETTINGS_ROLE,
			);
		}

		setUserData(userData);
	};

	/**
	 * Updates user details when userDetails API call succeeds.
	 **/
	useEffect(() => {
		if (userDetails.status !== "SUCCESS" || !userDetails.data) {
			return;
		}
		setUserDetails();
	}, [userDetails.status]);

	/**
	 * Determines if the read-only option should be restricted for a given member.
	 * Restrictions apply when the module type is 'DATABASE' or 'APP', and the member
	 * is the currently logged-in user.
	 *
	 * @param member - The member to check for read-only restriction.
	 * @returns {boolean} - `true` if the read-only option is restricted for the member; otherwise, `false`.
	 */
	const readOnlyRestricted = (member) => {
		if (!userData) return false;
		return (
			(type === "DATABASE" || type === "PROJECT") &&
			member.name === userData.name
		);
	};

	/**
	 * Update the selected users
	 * @param members
	 * @param quickUpdate
	 * @returns
	 */
	const updateSelectedUsers = async (members, quickUpdate) => {
		try {
			// construct requests for post data
			const requests = members.map((m) => {
				const json: JsonType = {
					userid: m.id,
					permission: quickUpdate ? quickUpdate : "OWNER",
				};

				// FOR MODELS
				if (
					m.max_response_time ||
					m.usage_restriction ||
					m.usage_frequency ||
					m.max_tokens
				) {
					// TODO: WE NEED CONSISTENCY, VERSUS HOW WE RECIEVE FROM BACKEND AND HOW WE SEND
					json.maxResponseTime = m.max_response_time;
					json.usageRestriction = m.usage_restriction;
					json.usageFrequency = m.usage_frequency;
					json.maxTokens = m.max_tokens;
				}
				return json;
			});

			if (requests.length === 0) {
				toast.warning(`No permissions to change`);

				return;
			}

			let response:
				| boolean
				| {
						response: Response;
						data: {
							success: boolean;
						};
				  }
				| null = null;
			if (
				type === "DATABASE" ||
				type === "STORAGE" ||
				type === "MODEL" ||
				type === "VECTOR" ||
				type === "GUARDRAIL" ||
				type === "FUNCTION"
			) {
				response = await editEngineUserPermissions(
					adminMode,
					id,
					requests,
				);
			} else if (type === "PROJECT") {
				response = await editProjectUserPermissions(
					id,
					requests,
					adminMode,
				);
			}

			if (
				typeof response === "boolean"
					? response
					: response?.data?.success
			) {
				toast.success("Successfully updated user permissions");

				// refresh the members
				getMembers.refresh();
				allAuthorsResponse.refresh();
				userDetails.refresh();

				onChange();
			} else {
				toast.error(`Error changing user permissions`);
			}
		} catch (e) {
			toast.error(String(e));
		}
	};

	/**
	 * Open the delete modal
	 *
	 * @param members - members that will be deleted
	 */
	const openDeleteMembersModal = (
		selectedMembers: SETTINGS_PROVISIONED_USER[],
	) => {
		// notify if no members
		if (selectedMembers.length === 0) {
			toast.warning(`No permissions to change`);

			return;
		}

		const authorsToDelete = selectedMembers.filter(
			(m) =>
				permissionPriorityMapper(m.permission)?.permission === "Author",
		);
		if (
			allAuthors.length > 0 &&
			authorsToDelete.length === allAuthors.length
		) {
			toast.error(
				`You cannot delete all the admins(Authors) from the table.`,
			);
			return;
		}

		// set the pending members
		setPendingDeletedMembers(selectedMembers);

		// close the model
		setDeleteMembersModal(true);
	};

	/**
	 * Open the add modal
	 */
	const openAddMembersModal = () => {
		// close the model
		setAddMembersModal(true);
	};

	// track if the page is loading
	const isLoading =
		getMembers.status === "INITIAL" || getMembers.status === "LOADING";
	const renderedMembers =
		getMembers.status === "SUCCESS"
			? (getMembers.data as GetMembersData).members
			: [];
	const totalMembers =
		getMembers.status === "SUCCESS"
			? (getMembers.data as GetMembersData).totalMembers
			: 0;
	const hasMembers =
		getMembers.status === "SUCCESS" &&
		(getMembers.data as GetMembersData).totalMembers > 0;

	/**
	 * Sort Members
	 *
	 * @returns sorted members
	 */
	const sortedMembers = useMemo(() => {
		/**
		 *
		 * @param permission
		 * @returns order of the permission
		 */
		const getPermissionOrder = (permission: string): number => {
			const permissionOrder = {
				Author: 1,
				Editor: 2,
				"Read-Only": 3,
			};
			return (
				permissionOrder[
					permissionPriorityMapper(permission)?.permission
				] || 0
			);
		};
		return [...renderedMembers].sort((a, b) => {
			// sort by permission
			const permissionA = getPermissionOrder(a.permission);
			const permissionB = getPermissionOrder(b.permission);
			//A - B means A is before B
			const permissionComparison =
				permissionOrder === "asc"
					? permissionA - permissionB
					: permissionB - permissionA;

			if (permissionComparison === 0) {
				return nameOrder === "asc"
					? a.name.localeCompare(b.name)
					: b.name.localeCompare(a.name);
			}
			return permissionComparison;
		});
	}, [renderedMembers, nameOrder, permissionOrder]);

	/**
	 * Handle Table Sorting Logic for Names
	 *
	 */
	const handleNameSort = () => {
		setNameOrder((prev) => (prev === "asc" ? "desc" : "asc"));
	};
	/**
	 * Handle Table Sorting Logic for Permissions
	 *
	 */
	const handlePermissionSort = () => {
		setPermissionOrder((prev) => (prev === "asc" ? "desc" : "asc"));
	};

	// Avatars rendered
	const Avatars = useMemo(() => {
		if (!renderedMembers.length) {
			return [];
		}

		let i = 0;
		const avatarList = [];
		while (i < 5 && i < renderedMembers.length) {
			avatarList.push(
				<Avatar key={i} className="size-8">
					<AvatarFallback>
						{(renderedMembers[i].name || " ")
							.charAt(0)
							.toUpperCase()}
					</AvatarFallback>
				</Avatar>,
			);

			i++;
		}

		return avatarList;
	}, [renderedMembers.length]);

	const isLastAuthor = (user) => {
		const authors = allAuthors.filter(
			(m) =>
				permissionPriorityMapper(m.permission)?.permission === "Author",
		);
		return (
			permissionPriorityMapper(user.permission)?.permission ===
				"Author" &&
			authors.length === 1 &&
			authors[0].id === user.id
		);
	};

	return (
		<div className="flex w-full shrink-0 flex-col items-start gap-[25px]">
			<div className="flex flex-col items-start gap-5 self-stretch">
				<div className="w-full rounded-xl border border-border">
					<div className="flex items-center self-stretch rounded-t-xl bg-background shadow-[0px_-1px_0px_0px_rgba(0,0,0,0.12)_inset]">
						<div className="flex items-center gap-2.5 p-3 px-6 py-3">
							<H4 data-testid="permissions-title">Permissions</H4>
						</div>
						<div className="flex flex-1 items-start">
							{Avatars.length > 0 ? (
								<div className="flex h-14 w-[130px] flex-col items-center justify-center gap-2.5 px-4 py-2.5">
									<div
										className="-space-x-2 flex"
										data-testid="membersTable-avatarGroup"
									>
										{Avatars.slice(0, 4).map((el, idx) => {
											// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
											return <div key={idx}>{el}</div>;
										})}
										{totalMembers > 4 && (
											<Avatar className="size-8">
												<AvatarFallback>
													+{totalMembers - 4}
												</AvatarFallback>
											</Avatar>
										)}
									</div>
								</div>
							) : null}
							<div className="flex h-14 flex-col items-center justify-center gap-2.5 px-4 py-1.5">
								<div className="flex flex-col items-start">
									<P data-testid="membersTable-memberCount">
										{totalMembers} member
									</P>
								</div>
							</div>
						</div>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => {
								//setIsSearch(!isSearch);
							}}
							data-testid="membersTable-filterIcon"
						>
							<img src={FilteredIcon} alt="Filter" />
						</Button>
						<div className="flex items-center">
							{isSearch ? (
								<Input
									autoFocus={true}
									placeholder="Search Members"
									className="h-8 w-[200px]"
									value={search}
									data-testid={`membersTables-searchMembers-searchBar}`}
									onChange={(e) => {
										setSearch(e.target.value);
									}}
								/>
							) : (
								<Button
									variant="ghost"
									size="icon"
									onClick={() => {
										setIsSearch(!isSearch);
									}}
									data-testid="membersTable-searchIcon"
								>
									<SearchIcon className="size-4" />
								</Button>
							)}
						</div>
						{configStore.isEngineOperationAvailable(
							type,
							"access",
						) && (
							<>
								<div className="flex flex-col items-center justify-center gap-2.5 px-2 px-4 py-2.5 py-2.5">
									{selectedMembers.length > 0 && (
										<Button
											disabled={isLoading}
											variant={"outline"}
											onClick={() =>
												openDeleteMembersModal(
													selectedMembers,
												)
											}
											data-testid="membersTable-deleteSelected-btn"
										>
											Delete Selected
										</Button>
									)}
								</div>
								<div className="flex flex-col items-center justify-center gap-2.5 px-2 px-6 py-2.5 py-2.5">
									<Button
										disabled={
											isLoading ||
											userPermission === "Read-Only"
										}
										data-testid={`membersTables-addMembers-btn`}
										onClick={() => {
											openAddMembersModal();
										}}
									>
										<div className="flex items-center gap-2">
											<Plus className="size-4" />
											Add Members
										</div>
									</Button>
								</div>
							</>
						)}
					</div>

					{isLoading ? (
						<div className="relative flex items-center justify-center">
							<Table className="bg-background">
								<TableBody>
									{[...Array(rowsPerPage)].map(
										(item, idx) => (
											// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
											<TableRow key={idx}>
												<TableCell className="w-12">
													<Skeleton className="h-5 w-5" />
												</TableCell>
												<TableCell>
													<Skeleton className="h-9 w-40" />
												</TableCell>
												<TableCell>
													<Skeleton className="h-9 w-60" />
												</TableCell>
												<TableCell>
													<Skeleton className="h-9 w-40" />
												</TableCell>
												<TableCell>
													<Skeleton className="h-9 w-20" />
												</TableCell>
											</TableRow>
										),
									)}
								</TableBody>
							</Table>
						</div>
					) : (
						<div>
							{hasMembers ? (
								<div className="overflow-x-auto">
									<Table className="mb-[0.5px] rounded-xl bg-background">
										<TableHeader>
											<TableRow>
												<TableHead className="w-12">
													<TableCell className="p-2 pr-0 pl-2">
														<Checkbox
															disabled={
																userPermission ===
																"Read-Only"
															}
															checked={
																selectedMembers.length ===
																	renderedMembers.length &&
																renderedMembers.length >
																	0
															}
															onCheckedChange={() => {
																if (
																	selectedMembers.length !==
																	renderedMembers.length
																) {
																	setSelectedMembers(
																		renderedMembers,
																	);
																} else {
																	setSelectedMembers(
																		[],
																	);
																}
															}}
														/>
													</TableCell>
												</TableHead>
												<TableHead>
													<Button
														variant="ghost"
														size="sm"
														onClick={() =>
															handleNameSort()
														}
														className="h-8 gap-1"
													>
														Name
														{nameOrder === "asc" ? (
															<ArrowUp className="size-4" />
														) : (
															<ArrowDown className="size-4" />
														)}
													</Button>
												</TableHead>
												<TableHead>
													<Button
														variant="ghost"
														size="sm"
														onClick={() =>
															handlePermissionSort()
														}
														className="h-8 gap-1"
													>
														Permission
														{permissionOrder ===
														"asc" ? (
															<ArrowUp className="size-4" />
														) : (
															<ArrowDown className="size-4" />
														)}
													</Button>
												</TableHead>
												<TableHead>
													Permission Date
												</TableHead>
												{type === "MODEL" && (
													<>
														<TableHead>
															Model Limit Type
														</TableHead>
														<TableHead>
															Limit Value
														</TableHead>
														<TableHead>
															Frequency
														</TableHead>
													</>
												)}
												<TableHead>Actions</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{sortedMembers.map((_x, i) => {
												const user = sortedMembers[i];

												let isSelected = false;

												if (user) {
													isSelected =
														selectedMembers.some(
															(value) => {
																return (
																	value.id ===
																	user.id
																);
															},
														);
												}

												if (user) {
													// Determine if this row represents an Author-level user
													const targetPermission =
														permissionPriorityMapper(
															user.permission,
														)?.permission;

													const disableActionsForEditorAuthor =
														userPermission ===
															"Editor" &&
														targetPermission ===
															"Author" &&
														!adminMode;

													return (
														<TableRow
															key={user.id}
															data-state={
																isSelected
																	? "selected"
																	: undefined
															}
														>
															<TableCell className="pl-4">
																<Checkbox
																	disabled={
																		userPermission ===
																		"Read-Only"
																	}
																	checked={
																		isSelected
																	}
																	onCheckedChange={() => {
																		if (
																			isSelected
																		) {
																			const selMembers =
																				[];
																			selectedMembers.forEach(
																				(
																					u,
																				) => {
																					if (
																						u.id !==
																						user.id
																					)
																						selMembers.push(
																							u,
																						);
																				},
																			);
																			setSelectedMembers(
																				selMembers,
																			);
																		} else {
																			setSelectedMembers(
																				[
																					...selectedMembers,
																					user,
																				],
																			);
																		}
																	}}
																/>
															</TableCell>
															<TableCell>
																<UserPopover
																	user={{
																		id: user.id,
																		name:
																			user.name ||
																			"Unknown",
																		email:
																			user.email ||
																			"",
																	}}
																>
																	<div className="flex cursor-pointer items-center gap-2">
																		<Avatar className="size-8">
																			<AvatarFallback>
																				{user.name[0].toUpperCase()}
																			</AvatarFallback>
																		</Avatar>
																		<span>
																			{
																				user.name
																			}
																		</span>
																	</div>
																</UserPopover>
															</TableCell>
															<TableCell>
																<RadioGroup
																	value={
																		permissionPriorityMapper(
																			user.permission,
																		)
																			?.permission
																	}
																	onValueChange={(
																		value,
																	) => {
																		updateSelectedUsers(
																			[
																				user,
																			],
																			permissionPriorityMapper(
																				value,
																			)
																				?.permission,
																		);
																	}}
																	className="flex flex-row flex-nowrap gap-3"
																>
																	<div className="flex items-center gap-2">
																		<RadioGroupItem
																			value="Author"
																			id={`${user.id}-author`}
																			disabled={
																				(!configStore.isEngineOperationAvailable(
																					type,
																					"access",
																				) ||
																					permissionPriorityMapper(
																						userPermission,
																					)
																						.priority >
																						1) &&
																				!adminMode
																			}
																			data-testid="author"
																		/>
																		<label
																			htmlFor={`${user.id}-author`}
																			className="text-sm"
																		>
																			Author
																		</label>
																	</div>
																	<div className="flex items-center gap-2">
																		<RadioGroupItem
																			value="Editor"
																			id={`${user.id}-editor`}
																			disabled={
																				isLastAuthor(
																					user,
																				) ||
																				(((userPermission ===
																					"Editor" &&
																					user.permission ===
																						"OWNER") ||
																					!configStore.isEngineOperationAvailable(
																						type,
																						"access",
																					) ||
																					permissionPriorityMapper(
																						userPermission,
																					)
																						?.priority >
																						2) &&
																					!adminMode)
																			}
																			data-testid="editor"
																		/>
																		<label
																			htmlFor={`${user.id}-editor`}
																			className="text-sm"
																		>
																			Editor
																		</label>
																	</div>
																	<div className="flex items-center gap-2">
																		<RadioGroupItem
																			value="Read-Only"
																			id={`${user.id}-readonly`}
																			disabled={
																				isLastAuthor(
																					user,
																				) ||
																				(((userPermission ===
																					"Editor" &&
																					user.permission ===
																						"OWNER") ||
																					!configStore.isEngineOperationAvailable(
																						type,
																						"access",
																					) ||
																					permissionPriorityMapper(
																						userPermission,
																					)
																						?.priority >=
																						3 ||
																					readOnlyRestricted(
																						user,
																					)) &&
																					!adminMode)
																			}
																			data-testid="readOnly"
																		/>
																		<label
																			htmlFor={`${user.id}-readonly`}
																			className="text-sm"
																		>
																			Read-Only
																		</label>
																	</div>
																</RadioGroup>
															</TableCell>
															<TableCell>
																{user?.date_added ??
																	"Not Available"}
															</TableCell>
															{type ===
																"MODEL" && (
																<>
																	<TableCell>
																		{(
																			user as User
																		)
																			?.usage_restriction !==
																		undefined
																			? formatValue(
																					(
																						user as User
																					)
																						?.usage_restriction,
																				)
																			: formatValue(
																					"null",
																				)}
																	</TableCell>
																	<TableCell>
																		{(
																			user as User
																		)
																			?.usage_restriction ===
																			"compute" &&
																			`${(user as User)?.max_response_time?.toLocaleString()} ms`}

																		{(
																			user as User
																		)
																			?.usage_restriction ===
																			"token" &&
																			`${(user as User)?.max_tokens?.toLocaleString()}`}
																	</TableCell>
																	<TableCell>
																		{formatValue(
																			(
																				user as User
																			)
																				?.usage_frequency,
																		)}
																	</TableCell>
																</>
															)}
															<TableCell>
																<div className="flex gap-1">
																	<Button
																		variant="ghost"
																		size="icon"
																		onClick={() => {
																			setAddMembersModal(
																				true,
																			);

																			setAddModalUser(
																				user,
																			);
																		}}
																		disabled={
																			!configStore.isEngineOperationAvailable(
																				type,
																				"access",
																			) ||
																			userPermission ===
																				"Read-Only" ||
																			disableActionsForEditorAuthor
																		}
																	>
																		<Pencil className="size-4" />
																	</Button>
																	<Button
																		variant="ghost"
																		size="icon"
																		onClick={() => {
																			openDeleteMembersModal(
																				[
																					user,
																				],
																			);
																		}}
																		disabled={
																			!configStore.isEngineOperationAvailable(
																				type,
																				"access",
																			) ||
																			userPermission ===
																				"Read-Only" ||
																			disableActionsForEditorAuthor
																		}
																	>
																		<Trash2 className="size-4" />
																	</Button>
																</div>
															</TableCell>
														</TableRow>
													);
												}

												return null;
											})}
										</TableBody>
										<TableFooter>
											<TableRow>
												<TableCell
													colSpan={
														type === "MODEL" ? 8 : 5
													}
												>
													<div className="flex items-center justify-end gap-4 px-2">
														<div className="flex items-center gap-2">
															<span className="text-sm">
																Rows per page:
															</span>
															<Select
																disabled={
																	isLoading
																}
																value={String(
																	rowsPerPage,
																)}
																onValueChange={(
																	value,
																) => {
																	setRowsPerPage(
																		parseInt(
																			value,
																			10,
																		),
																	);
																}}
															>
																<SelectTrigger className="h-8 w-[70px]">
																	<SelectValue />
																</SelectTrigger>
																<SelectContent>
																	<SelectItem value="5">
																		5
																	</SelectItem>
																	<SelectItem value="10">
																		10
																	</SelectItem>
																	<SelectItem value="20">
																		20
																	</SelectItem>
																</SelectContent>
															</Select>
														</div>
														<div className="text-sm">
															{page *
																rowsPerPage +
																1}
															-
															{Math.min(
																(page + 1) *
																	rowsPerPage,
																totalMembers,
															)}{" "}
															of {totalMembers}
														</div>
														<div className="flex gap-1">
															<Button
																variant="outline"
																size="icon-sm"
																onClick={() =>
																	setPage(0)
																}
																disabled={
																	page ===
																		0 ||
																	isLoading
																}
															>
																{"<<"}
															</Button>
															<Button
																variant="outline"
																size="icon-sm"
																onClick={() =>
																	setPage(
																		Math.max(
																			0,
																			page -
																				1,
																		),
																	)
																}
																disabled={
																	page ===
																		0 ||
																	isLoading
																}
															>
																{"<"}
															</Button>
															<Button
																variant="outline"
																size="icon-sm"
																onClick={() =>
																	setPage(
																		Math.min(
																			Math.ceil(
																				totalMembers /
																					rowsPerPage,
																			) -
																				1,
																			page +
																				1,
																		),
																	)
																}
																disabled={
																	page >=
																		Math.ceil(
																			totalMembers /
																				rowsPerPage,
																		) -
																			1 ||
																	isLoading
																}
															>
																{">"}
															</Button>
															<Button
																variant="outline"
																size="icon-sm"
																onClick={() =>
																	setPage(
																		Math.ceil(
																			totalMembers /
																				rowsPerPage,
																		) - 1,
																	)
																}
																disabled={
																	page >=
																		Math.ceil(
																			totalMembers /
																				rowsPerPage,
																		) -
																			1 ||
																	isLoading
																}
															>
																{">>"}
															</Button>
														</div>
													</div>
												</TableCell>
											</TableRow>
										</TableFooter>
									</Table>
								</div>
							) : (
								<div className="flex h-[503px] w-full flex-col items-center justify-center gap-2">
									<P>No members</P>
									{configStore.isEngineOperationAvailable(
										type,
										"access",
									) && (
										<Button
											disabled={isLoading}
											data-testid={`membersTables-addMembers-btn`}
											onClick={() => {
												setAddModalUser(null);
												openAddMembersModal();
											}}
										>
											Add Members
										</Button>
									)}
								</div>
							)}
						</div>
					)}
				</div>
			</div>
			<MembersDeleteOverlay
				type={type}
				id={id}
				members={pendingDeletedMembers}
				open={deleteMembersModal}
				onClose={(success) => {
					// clear out the deleted members
					setPendingDeletedMembers([]);
					// clear out the deleted members
					setSelectedMembers([]);
					// close the model
					setDeleteMembersModal(false);

					// refresh if successful
					if (success) {
						// trigger the update
						onChange();

						// refresh
						getMembers.refresh();
						allAuthorsResponse.refresh();
						userDetails.refresh();
					}
				}}
			/>
			<MembersAddOverlay
				type={type}
				id={id}
				open={addMembersModal}
				user={addModalUser}
				setAddModalUser={setAddModalUser}
				userPermission={userPermission}
				onClose={(success) => {
					// clear out the deleted members
					setAddMembersModal(false);

					// refresh if successful
					if (success) {
						// trigger the update
						onChange();

						getMembers.refresh();
						allAuthorsResponse.refresh();
					}
				}}
				onChange={() => onChange()}
			/>
		</div>
	);
};
