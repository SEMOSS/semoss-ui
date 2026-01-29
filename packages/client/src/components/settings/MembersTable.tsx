// biome-ignore-all lint/correctness/useExhaustiveDependencies: Complex interdependencies in this file make exhaustive deps impractical
import { Add, Delete, Edit } from "@mui/icons-material";
import SearchIcon from "@mui/icons-material/Search";
import type { AxiosResponse } from "axios";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDebouncedValue } from "@semoss/sdk/react";
import {
	Avatar,
	AvatarGroup,
	Box,
	Button,
	Checkbox,
	IconButton,
	RadioGroup,
	Search,
	Skeleton,
	Stack,
	styled,
	Table,
	Typography,
	useNotification,
} from "@semoss/ui";
import { editEngineUserPermissions, editProjectUserPermissions } from "@/api";
import FilteredIcon from "@/assets/img/FilteredIcon.png";
import { useAPI, useRootStore, useSettings } from "@/hooks";
import type { ALL_TYPES } from "@/types";
import { permissionPriorityMapper } from "@/utility/general";
import { MembersAddOverlay } from "./MembersAddOverlay";
import { MembersDeleteOverlay } from "./MembersDeleteOverlay";
import type {
	SETTINGS_PROVISIONED_USER,
	SETTINGS_ROLE,
} from "./settings.types";
import { UserPopover } from "./UserPopover";

const AvatarWrapper = styled("div")({
	display: "inline-block",
	width: "50px",
});

const StyledMemberContent = styled("div")(({ theme }) => ({
	display: "flex",
	width: "100%",
	flexDirection: "column",
	alignItems: "flex-start",
	gap: theme.spacing(3.125),
	flexShrink: "0",
}));

const StyledMemberInnerContent = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	alignItems: "flex-start",
	gap: theme.spacing(2.5),
	alignSelf: "stretch",
}));

const StyledTableContainer = styled(Table.Container)(({ theme }) => ({
	borderRadius: "12px",
	border: `1px solid ${theme.palette.secondary.border}`,
}));

const StyledMemberLoading = styled("div")({
	position: "relative",
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
});

const StyledMemberTable = styled(Table)(({ theme }) => ({
	backgroundColor: theme.palette.background.paper,
}));

const StyledTableTitleContainer = styled("div")(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	alignSelf: "stretch",
	boxShadow: "0px -1px 0px 0px rgba(0, 0, 0, 0.12) inset",
	backgroundColor: theme.palette.background.paper,
}));

const StyledTableTitleDiv = styled("div")(({ theme }) => ({
	display: "flex",
	padding: theme.spacing(1.5, 3, 1.5, 2),
	alignItems: "center",
	gap: theme.spacing(1.25),
}));

const StyledTableTitleMemberContainer = styled("div")({
	display: "flex",
	alignItems: "flex-start",
	flex: "1 0 0",
});

const StyledAvatarGroupContainer = styled("div")(({ theme }) => ({
	display: "flex",
	width: "130px",
	height: "56px",
	padding: theme.spacing(1.25, 2),
	flexDirection: "column",
	justifyContent: "center",
	alignItems: "center",
	gap: theme.spacing(1.25),
}));

const StyledTableTitleMemberCountContainer = styled("div")(({ theme }) => ({
	display: "flex",
	height: "56px",
	padding: theme.spacing(0.75, 2, 0.75, 1),
	flexDirection: "column",
	justifyContent: "center",
	alignItems: "center",
	gap: theme.spacing(1.25),
	backround: "red",
}));

const StyledTableTitleMemberCount = styled("div")({
	display: "flex",
	flexDirection: "column",
	alignItems: "flex-start",
});

const StyledSearchButtonContainer = styled("div")({
	display: "flex",
	alignItems: "center",
	// gap: '10px',
});

const StyledDeleteSelectedContainer = styled("div")(({ theme }) => ({
	display: "flex",
	padding: theme.spacing(1.25, 1, 1.25, 2),
	flexDirection: "column",
	justifyContent: "center",
	alignItems: "center",
	gap: theme.spacing(1.25),
}));

const StyledAddMemberContainer = styled("div")(({ theme }) => ({
	display: "flex",
	padding: theme.spacing(1.25, 3, 1.25, 1),
	flexDirection: "column",
	justifyContent: "center",
	alignItems: "center",
	gap: theme.spacing(1.25),
}));

const StyledNoMembersDiv = styled("div")(({ theme }) => ({
	width: "100%",
	height: "503px",
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(1),
	justifyContent: "center",
	alignItems: "center",
}));

const StyledTableCell = styled(Table.Cell)(({ theme }) => ({
	paddingLeft: theme.spacing(2),
}));

const StyledCheckbox = styled(Checkbox)({
	paddingBottom: 0,
});

const StyledCenteredBox = styled(Box)(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	gap: theme.spacing(1),
}));

const StyledNameStack = styled(Stack)({
	alignItems: "center",
	flex: 1,
});

const StyledSelectedTableRow = styled(Table.Row)(({ theme }) => ({
	backgroundColor: theme.palette.primary.selected, // light blue, adjust as needed
}));

const StyledRadioGroup = styled(RadioGroup)({
	flexWrap: "nowrap",
});

const StyledCell = styled(Table.Cell)({
	whiteSpace: "nowrap",
	overflow: "hidden",
	textOverflow: "ellipsis",
});

const StyledFooter = styled(Table.Footer)({
	display: "flex",
	justifyContent: "flex-end",
});

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
	const notification = useNotification();
	const { adminMode } = useSettings();

	/** Member Table State */
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
	/** Utility for Popover */
	const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
	const [hoveredUser, setHoveredUser] = useState<User | null>(null);

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

	const memberSearchRef = useRef(undefined);

	// get the api
	let getMembersApi: Parameters<typeof useAPI>[0] = null;
	let getUserDataApi: Parameters<typeof useAPI>[0] = null;
	let getAllAuthorsApi: Parameters<typeof useAPI>[0] = null;
	if (type === "PROJECT") {
		getUserDataApi = ["getUserProjectPermission", id];
		getMembersApi = [
			"getProjectUsers",
			adminMode,
			id,
			debouncedSearch ? debouncedSearch : undefined,
			permissionPriorityMapper(permissionFilter)?.permission,
			(page + 1) * rowsPerPage - rowsPerPage, // offset
			rowsPerPage, // limit
		];
		getAllAuthorsApi = [
			"getProjectUsers",
			adminMode,
			id,
			undefined, // no search
			"OWNER", // OWNER Permission Filter
			undefined, // offset
			undefined, // limit
		];
	} else if (
		type === "DATABASE" ||
		type === "STORAGE" ||
		type === "MODEL" ||
		type === "VECTOR" ||
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

		const userData = userDetails.data as SETTINGS_PROVISIONED_USER;
		if (adminMode) {
			const adminPermissionPriority = "Author";
			setUserPermission(
				permissionPriorityMapper(adminPermissionPriority)
					?.permission as SETTINGS_ROLE,
			);
		} else {
			setUserPermission(
				permissionPriorityMapper(
					userData.permission === "OWNER"
						? "Author"
						: userData.permission,
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
				notification.add({
					color: "warning",
					message: `No permissions to change`,
				});

				return;
			}

			let response:
				| AxiosResponse<{ success: boolean }>
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
				type === "FUNCTION"
			) {
				response = await editEngineUserPermissions(
					adminMode,
					id,
					requests,
				);
			} else if (type === "PROJECT") {
				response = await editProjectUserPermissions(
					adminMode,
					id,
					requests,
				);
			}

			if (!response) {
				return;
			}

			// ignore if there is no response
			if (response.data.success) {
				notification.add({
					color: "success",
					message: "Successfully updated user permissions",
				});

				// refresh the members
				getMembers.refresh();
				allAuthorsResponse.refresh();
				userDetails.refresh();

				onChange();
			} else {
				notification.add({
					color: "error",
					message: `Error changing user permissions`,
				});
			}
		} catch (e) {
			notification.add({
				color: "error",
				message: String(e),
			});
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
			notification.add({
				color: "warning",
				message: `No permissions to change`,
			});

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
			notification.add({
				color: "error",
				message: `You cannot delete all the admins(Authors) from the table.`,
			});
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
	 * Handle Table Sorting Logic for Pames
	 *
	 */
	const handlePermissionSort = () => {
		setPermissionOrder((prev) => (prev === "asc" ? "desc" : "asc"));
	};
	/**
	 * Handle user popover close
	 */
	const handlePopoverClose = () => {
		setAnchorEl(null);
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
				<Avatar key={i}>
					{(renderedMembers[i].name || " ").charAt(0).toUpperCase()}
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
		<StyledMemberContent>
			<StyledMemberInnerContent>
				<StyledTableContainer>
					<StyledTableTitleContainer>
						<StyledTableTitleDiv>
							<Typography
								variant={"h6"}
								data-testid="permissions-title"
							>
								Permissions
							</Typography>
						</StyledTableTitleDiv>
						<StyledTableTitleMemberContainer>
							{Avatars.length > 0 ? (
								<StyledAvatarGroupContainer>
									<AvatarGroup
										spacing={"small"}
										variant={"circular"}
										max={4}
										total={totalMembers}
										data-testid="membersTable-avatarGroup"
									>
										{Avatars.map((el) => {
											return el;
										})}
									</AvatarGroup>
								</StyledAvatarGroupContainer>
							) : null}
							<StyledTableTitleMemberCountContainer>
								<StyledTableTitleMemberCount>
									<Typography
										variant={"caption"}
										data-testid="membersTable-memberCount"
									>
										{totalMembers} member
									</Typography>
								</StyledTableTitleMemberCount>
							</StyledTableTitleMemberCountContainer>
						</StyledTableTitleMemberContainer>
						<IconButton
							onClick={() => {
								//setIsSearch(!isSearch);
							}}
							data-testid="membersTable-filterIcon"
						>
							<img src={FilteredIcon} alt="Filter" />
						</IconButton>
						<StyledSearchButtonContainer>
							{isSearch ? (
								<Search
									autoFocus={true}
									inputRef={memberSearchRef}
									placeholder="Search Members"
									size="small"
									value={search}
									data-testid={`membersTables-searchMembers-searchBar}`}
									onChange={(e) => {
										setSearch(e.target.value);
									}}
								/>
							) : (
								<IconButton
									onClick={() => {
										setIsSearch(!isSearch);
									}}
									data-testid="membersTable-searchIcon"
								>
									<SearchIcon />
								</IconButton>
							)}
						</StyledSearchButtonContainer>
						{configStore.isEngineOperationAvailable(
							type,
							"access",
						) && (
							<>
								<StyledDeleteSelectedContainer>
									{selectedMembers.length > 0 && (
										<Button
											disabled={isLoading}
											variant={"outlined"}
											color="error"
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
								</StyledDeleteSelectedContainer>
								<StyledAddMemberContainer>
									<Button
										disabled={
											isLoading ||
											userPermission === "Read-Only"
										}
										variant={"contained"}
										data-testid={`membersTables-addMembers-btn`}
										onClick={() => {
											openAddMembersModal();
										}}
									>
										<StyledCenteredBox>
											<Add />
											Add Members
										</StyledCenteredBox>
									</Button>
								</StyledAddMemberContainer>
							</>
						)}
					</StyledTableTitleContainer>

					{isLoading ? (
						<StyledMemberLoading>
							<StyledMemberTable>
								<Table.Body>
									{[...Array(rowsPerPage)].map((item) => (
										<Table.Row key={item}>
											<Table.Cell
												size="medium"
												padding="checkbox"
											>
												<Skeleton
													variant="rectangular"
													width={20}
													height={20}
												/>
											</Table.Cell>
											<Table.Cell size="medium">
												<Skeleton
													variant="text"
													width={160}
													height={35}
												/>
											</Table.Cell>
											<Table.Cell size="medium">
												<Skeleton
													variant="text"
													width={240}
													height={35}
												/>
											</Table.Cell>
											<Table.Cell size="medium">
												<Skeleton
													variant="text"
													width={160}
													height={35}
												/>
											</Table.Cell>
											<Table.Cell size="medium">
												<Skeleton
													variant="text"
													width={80}
													height={35}
												/>
											</Table.Cell>
										</Table.Row>
									))}
								</Table.Body>
							</StyledMemberTable>
						</StyledMemberLoading>
					) : (
						<Box>
							{hasMembers ? (
								<>
									<Box sx={{ overflowX: "auto" }}>
										<StyledMemberTable>
											<Table.Head>
												<Table.Row>
													<StyledCell
														size="small"
														padding="checkbox"
													>
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
															onChange={() => {
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
													</StyledCell>
													<StyledCell size="small">
														<Table.Sort
															active={true} // sort icon is always visible
															direction={
																nameOrder
															} // direction of the icon, up is asc
															onClick={() =>
																handleNameSort()
															}
														>
															Name
														</Table.Sort>
													</StyledCell>
													<StyledCell size="small">
														<Table.Sort
															active={true}
															direction={
																permissionOrder
															}
															onClick={() =>
																handlePermissionSort()
															}
														>
															Permission
														</Table.Sort>
													</StyledCell>
													<StyledCell size="small">
														Permission Date
													</StyledCell>
													{type === "MODEL" && (
														<>
															<StyledCell size="small">
																Model Limit Type
															</StyledCell>
															<StyledCell size="small">
																Limit Value
															</StyledCell>
															<StyledCell size="small">
																Frequency
															</StyledCell>
														</>
													)}
													<StyledCell size="small">
														Actions
													</StyledCell>
												</Table.Row>
											</Table.Head>
											<Table.Body>
												{sortedMembers.map((_x, i) => {
													const user =
														sortedMembers[i];

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
														const RowComponent =
															isSelected
																? StyledSelectedTableRow
																: Table.Row;

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
															<RowComponent
																key={user.id}
															>
																<StyledTableCell
																	size="medium"
																	padding="checkbox"
																>
																	<StyledCheckbox
																		disabled={
																			userPermission ===
																			"Read-Only"
																		}
																		checked={
																			isSelected
																		}
																		onChange={() => {
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
																</StyledTableCell>
																<StyledCell>
																	<StyledCenteredBox>
																		<StyledNameStack
																			direction="row"
																			onMouseEnter={(
																				event,
																			) => {
																				setAnchorEl(
																					event.currentTarget,
																				);
																				setHoveredUser(
																					user,
																				);
																			}}
																			onMouseLeave={() =>
																				handlePopoverClose
																			}
																			aria-owns="mouse-over-popover"
																			aria-haspopup="true"
																		>
																			<AvatarWrapper>
																				<Avatar>
																					{user.name[0].toUpperCase()}
																				</Avatar>
																			</AvatarWrapper>
																			{
																				user.name
																			}
																		</StyledNameStack>
																	</StyledCenteredBox>
																</StyledCell>
																<StyledCell size="medium">
																	<StyledRadioGroup
																		row
																		defaultValue={
																			permissionPriorityMapper(
																				user.permission,
																			)
																				?.permission
																		}
																		onChange={(
																			e,
																		) => {
																			updateSelectedUsers(
																				[
																					user,
																				],
																				permissionPriorityMapper(
																					e
																						.target
																						.value,
																				)
																					?.permission,
																			);
																		}}
																	>
																		<RadioGroup.Item
																			value="Author"
																			label="Author"
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
																		<RadioGroup.Item
																			value="Editor"
																			label="Editor"
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
																		<RadioGroup.Item
																			value="Read-Only"
																			label="Read-Only"
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
																	</StyledRadioGroup>
																</StyledCell>
																<StyledCell>
																	{user?.date_added ??
																		"Not Available"}
																</StyledCell>
																{type ===
																	"MODEL" && (
																	<>
																		<StyledCell>
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
																		</StyledCell>
																		<StyledCell>
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
																		</StyledCell>
																		<StyledCell>
																			{formatValue(
																				(
																					user as User
																				)
																					?.usage_frequency,
																			)}
																		</StyledCell>
																	</>
																)}
																<StyledCell size="medium">
																	<IconButton
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
																		<Edit />
																	</IconButton>
																	<IconButton
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
																		<Delete></Delete>
																	</IconButton>
																</StyledCell>
															</RowComponent>
														);
													}

													return null;
												})}
											</Table.Body>
										</StyledMemberTable>
									</Box>
									<StyledFooter>
										<Table.Row>
											<Table.Pagination
												disabled={isLoading}
												onPageChange={(_e, v) => {
													setPage(v);
													setSelectedMembers([]);
												}}
												page={page}
												rowsPerPage={rowsPerPage}
												rowsPerPageOptions={[5, 10, 20]}
												onRowsPerPageChange={(e) => {
													// set the new limit
													setRowsPerPage(
														parseInt(
															e.target.value,
															10,
														),
													);
												}}
												count={totalMembers}
											/>
										</Table.Row>
									</StyledFooter>
									<UserPopover
										hoveredUser={
											hoveredUser
												? {
														id: hoveredUser.id,
														name:
															hoveredUser.name ||
															"Unknown",
														email:
															hoveredUser.email ||
															"",
													}
												: null
										}
										isPopoverOpen={Boolean(anchorEl)}
										anchorEl={anchorEl}
										handlePopoverClose={handlePopoverClose}
									/>
								</>
							) : (
								<StyledNoMembersDiv>
									<Typography variant={"body2"}>
										No members
									</Typography>
									{configStore.isEngineOperationAvailable(
										type,
										"access",
									) && (
										<Button
											disabled={isLoading}
											variant={"contained"}
											data-testid={`membersTables-addMembers-btn`}
											onClick={() => {
												setAddModalUser(null);
												openAddMembersModal();
											}}
										>
											Add Members
										</Button>
									)}
								</StyledNoMembersDiv>
							)}
						</Box>
					)}
				</StyledTableContainer>
			</StyledMemberInnerContent>
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
		</StyledMemberContent>
	);
};
