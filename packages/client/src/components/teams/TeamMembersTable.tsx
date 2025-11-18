import { Add, ClearRounded, DeleteRounded } from "@mui/icons-material";
import type { AxiosResponse } from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
	Autocomplete,
	Avatar,
	AvatarGroup,
	Box,
	Button,
	Card,
	Checkbox,
	Chip,
	IconButton,
	Modal,
	Search,
	Stack,
	styled,
	Table,
	Typography,
	useNotification,
} from "@semoss/ui";
import {
	addTeamUser,
	deleteTeamUser,
	getNonTeamUsers,
	getTeamUsers,
} from "@/api/teams";

const colors = [
	"#22A4FF",
	"#FA3F20",
	"#FA3F20",
	"#FF9800",
	"#FF9800",
	"#22A4FF",
	"#4CAF50",
];

const NameIDWrapper = styled("div")({
	display: "inline-block",
});

const _NameTableCell = styled(Table.Cell)({
	width: "100%",
	maxWidth: "1px",
});

const DateTableCell = styled(Table.Cell)({
	whiteSpace: "nowrap",
	"@media (max-width: 768px)": {
		whiteSpace: "normal",
	},
});

const StyledAvatar = styled(Avatar)({
	width: "32px",
	height: "32px",
});

const StyledTablePagination = styled(Table.Pagination)({
	border: "none",
});

const StyledMemberContent = styled("div")({
	display: "flex",
	width: "100%",
	flexDirection: "column",
	alignItems: "flex-start",
	gap: "25px",
	flexShrink: "0",
});

const StyledMemberInnerContent = styled("div")({
	display: "flex",
	flexDirection: "column",
	alignItems: "flex-start",
	gap: "20px",
	alignSelf: "stretch",
});

const StyledTableContainer = styled(Table.Container)({
	borderRadius: "12px",
	boxShadow: "0px 5px 22px 0px rgba(0, 0, 0, 0.06)",
});

const StyledMemberTable = styled(Table)({ backgroundColor: "white" });

const StyledTableTitleContainer = styled("div")({
	display: "flex",
	alignItems: "center",
	alignSelf: "stretch",
	boxShadow: "0px -1px 0px 0px rgba(0, 0, 0, 0.12) inset",
	backgroundColor: "white",
});

const StyledTableTitleDiv = styled("div")({
	display: "flex",
	padding: "12px 24px 12px 16px",
	alignItems: "center",
	gap: "10px",
	fontWeight: 500,
});

const StyledTableTitleMemberContainer = styled("div")({
	display: "flex",
	alignItems: "flex-start",
	flex: "1 0 0",
});

const StyledAvatarGroup = styled(AvatarGroup)({
	"& .MuiAvatar-root": {
		marginLeft: "-20px",
		border: "2px solid white",
	},
});

const StyledAvatarGroupContainer = styled("div")({
	display: "flex",
	height: "56px",
	alignItems: "center",
});

const StyledTableTitleMemberCountContainer = styled("div")({
	display: "flex",
	height: "56px",
	padding: "6px 16px 6px 8px",
	flexDirection: "column",
	justifyContent: "center",
	alignItems: "center",
	gap: "10px",
});

const StyledTableTitleMemberCount = styled("div")({
	display: "flex",
	flexDirection: "column",
	alignItems: "flex-start",
});

const StyledSearchButtonContainer = styled("div")({
	display: "flex",
	alignItems: "center",
});

const StyledDeleteSelectedContainer = styled("div")({
	display: "flex",
	padding: "10px 8px 10px 16px",
	flexDirection: "column",
	justifyContent: "center",
	alignItems: "center",
	gap: "10px",
});

const StyledAddMemberContainer = styled("div")({
	display: "flex",
	padding: "10px 24px 10px 8px",
	flexDirection: "column",
	justifyContent: "center",
	alignItems: "center",
	gap: "10px",
});

const StyledNoMembersDiv = styled("div")({
	width: "100%",
	height: "503px",
	display: "flex",
	flexDirection: "column",
	gap: "1rem",
	justifyContent: "center",
	alignItems: "center",
	background: "white",
});

const StyledCheckbox = styled(Checkbox)({
	paddingBottom: "0px",
});

const StyledModalContentText = styled(Modal.ContentText)({
	display: "flex",
	flexDirection: "column",
	gap: ".5rem",
	marginTop: "12px",
});

interface MembersTableProps {
	/**
	 * Id of the setting
	 */
	groupId: string;

	name: string;
}

interface TeamMember {
	admin: boolean;
	countrycode: string;
	email: string;
	exporter: boolean;
	id: string;
	name: string;
	phone: string;
	phoneextension: string;
	publisher: boolean;
	type: string;
	username: string;
}

export const TeamMembersTable = (props: MembersTableProps) => {
	const { groupId } = props;

	const notification = useNotification();
	const AUTOCOMPLETE_LIMIT = 10;
	const AUTOCOMPLETE_OFFSET = 0;

	/** Member Table State */
	const [membersPage, setMembersPage] = useState<number>(1);
	const [selectedMembers, setSelectedMembers] = useState([]);
	const [count, setCount] = useState(0);

	/** Delete Member */
	const [deleteMembersModal, setDeleteMembersModal] =
		useState<boolean>(false);
	const [deleteMemberModal, setDeleteMemberModal] = useState<boolean>(false);
	const [userToDelete, setUserToDelete] = useState(null);

	/** Add Member State */
	const [addMembersModal, setAddMembersModal] = useState<boolean>(false);
	const [nonCredentialedUsers, setNonCredentialedUsers] = useState([]);
	const [selectedNonCredentialedUsers, setSelectedNonCredentialedUsers] =
		useState([]);

	const [teamMembers, setTeamMembers] = useState([]);
	const [memberCount, setMemberCount] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(5);
	const [allTeamMembers, setAllTeamMembers] = useState([]);
	const [hasMembers, setHasMembers] = useState(false);

	const [searchMemberInput, setSearchMemberInput] = useState<string>("");
	const [offset, setOffset] = useState(AUTOCOMPLETE_OFFSET);
	const [isScrollBottom, setIsScrollBottom] = useState(false);
	const [canCollect, setCanCollect] = useState<boolean>(true);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [searchLoading, setSearchLoading] = useState(false);

	const nearBottom = (
		target: {
			scrollHeight?: number;
			scrollTop?: number;
			clientHeight?: number;
		} = {},
	) => {
		const diff = Math.round(target.scrollHeight - target.scrollTop);
		return diff - 25 <= target.clientHeight;
	};

	/**
	 * @name getAdditionalUsersNonGroup
	 */
	const getAdditionalUsersNonGroup = () => {
		setOffset(offset + AUTOCOMPLETE_LIMIT);
	};

	const memberSearchRef = useRef(undefined);
	const filteredNonCredentialedUsers = Array.from(
		new Map(
			nonCredentialedUsers
				.filter(
					(user) =>
						!allTeamMembers.some(
							(member) => member.userid === user.id,
						),
				)
				.map((user) => [user.id, user]),
		).values(),
	);

	const { watch, setValue } = useForm<{
		SEARCH_FILTER: string;
	}>({
		defaultValues: {
			// Filters for Members table
			SEARCH_FILTER: "",
		},
	});

	const searchFilter = watch("SEARCH_FILTER");

	/**
	 * @name useEffect
	 * @desc - sets members in react hook form
	 */
	useEffect(() => {
		filter();
	}, [groupId, count, membersPage, searchFilter, rowsPerPage]);
	useEffect(() => {
		if (isScrollBottom) {
			if (canCollect) {
				getAdditionalUsersNonGroup();
			}
		}
	}, [isScrollBottom, canCollect, getAdditionalUsersNonGroup]);

	useEffect(() => {
		if (addMembersModal) {
			if (searchMemberInput) {
				setSearchLoading(true);
			}
			const timer = setTimeout(() => {
				if (!offset) {
					getUsersNonGroup(true);
				} else {
					if (canCollect) {
						getUsersNonGroup(false);
					} else {
						getUsersNonGroup(true);
					}
				}
			}, 500);
			return () => clearTimeout(timer);
		}
	}, [addMembersModal, offset, searchMemberInput]);

	/**
	 * @name submitNonGroupUsers
	 */
	const submitNonGroupUsers = async () => {
		try {
			// construct requests for post data
			const requests = selectedNonCredentialedUsers.map((m) => {
				return {
					userid: m.id,
					type: m.type,
				};
			});

			if (requests.length === 0) {
				notification.add({
					color: "warning",
					message: `No users to add`,
				});

				return;
			}

			for (let i = 0; i < requests.length; i++) {
				let response:
					| AxiosResponse<{ success: boolean }>
					| {
							response: Response;
							data: {
								success: boolean;
							};
					  }
					| null = null;
				response = await addTeamUser(
					groupId,
					requests[i].type,
					requests[i].userid,
					true,
				);

				if (!response) {
					return;
				}

				// ignore if there is no response
				if (response) {
					setAddMembersModal(false);
					setSelectedNonCredentialedUsers([]);

					notification.add({
						color: "success",
						message: "Successfully added member permissions",
					});
				} else {
					notification.add({
						color: "error",
						message: `Error changing user permissions`,
					});
				}
			}
		} catch (e) {
			setAddMembersModal(false);
			setSelectedNonCredentialedUsers([]);

			notification.add({
				color: "error",
				message: String(e),
			});
		} finally {
			// refresh the members
			setCount(count + 1);
			setOffset(0);
		}
	};

	/**
	 * @name deleteUser
	 * @param user
	 */
	const deleteUser = async (user) => {
		try {
			let response:
				| AxiosResponse<{ success: boolean }>
				| {
						response: Response;
						data: {
							success: boolean;
						};
				  }
				| null = null;
			response = await deleteTeamUser(user);

			if (!response) {
				return;
			}

			notification.add({
				color: "success",
				message: `Successfully removed user`,
			});
		} catch (e) {
			notification.add({
				color: "error",
				message: String(e),
			});
		} finally {
			setDeleteMemberModal(false);
			setCount(count + 1);
		}
		// refresh the members
	};

	/**
	 * @name deleteTeamUsers
	 * @param user
	 */
	const deleteTeamUsers = async () => {
		try {
			for (let i = 0; i < selectedMembers.length; i++) {
				try {
					let response:
						| AxiosResponse<{ success: boolean }>
						| {
								response: Response;
								data: {
									success: boolean;
								};
						  }
						| null = null;
					response = await deleteTeamUser(selectedMembers[i]);

					if (!response) {
						return;
					}
				} catch (e) {
					notification.add({
						color: "error",
						message: String(e),
					});
				} finally {
					setDeleteMemberModal(false);
				}
			}
		} finally {
			notification.add({
				color: "success",
				message: `Successfully removed users`,
			});
			setCount((prevCount) => {
				return prevCount + 1;
			});
			setDeleteMembersModal(false);
			setSelectedMembers([]);
		}
	};

	/** ADD MEMBER FUNCTIONS */
	/**
	 * @name getUsersNonGroup
	 * @desc Gets all users without credentials
	 */
	const getUsersNonGroup = async (reset: boolean) => {
		if (isLoading) {
			return;
		}
		setIsLoading(true);
		try {
			// possibly add more db table columns / keys here to get id type for display under username
			// eslint-disable-next-line prefer-const
			const response = await getNonTeamUsers(
				groupId,
				AUTOCOMPLETE_LIMIT,
				offset,
				searchMemberInput,
			);

			// ignore if there is no response
			if (response) {
				let requests = reset ? [] : nonCredentialedUsers;
				const users = (response as unknown as TeamMember[]).map(
					(val) => {
						return {
							...val,
							color: colors[
								Math.floor(Math.random() * colors.length)
							],
						};
					},
				);
				requests = requests.concat(users);
				setNonCredentialedUsers(requests);
				setCanCollect(users.length === AUTOCOMPLETE_LIMIT);
				setIsLoading(false);
				setSearchLoading(false);
			}
		} catch (e) {
			notification.add({
				color: "error",
				message: String(e),
			});
			setIsLoading(false);
			setSearchLoading(false);
		}
	};

	/** HELPERS */
	const Avatars = useMemo(() => {
		if (!allTeamMembers) return [];

		let i = 0;
		const avatarList = [];
		while (i < 5 && i < allTeamMembers.length) {
			avatarList.push(
				<Avatar key={i}>
					{allTeamMembers[i].name.charAt(0).toUpperCase()}
				</Avatar>,
			);

			i++;
		}

		return avatarList;
	}, [allTeamMembers]);

	const paginationOptions = {
		membersPageCounts: [5],
	};

	memberCount > 9 && paginationOptions.membersPageCounts.push(10);
	memberCount > 19 && paginationOptions.membersPageCounts.push(20);

	const filterUsers = useCallback(() => {
		getTeamUsers(
			groupId,
			rowsPerPage,
			membersPage * rowsPerPage - rowsPerPage, // offset
			searchFilter,
		).then((data: unknown[]) => {
			setTeamMembers(data);
			setHasMembers(data?.length > 0);
		});
	}, [groupId, membersPage, searchFilter, rowsPerPage]);

	const filterUsersTwo = useCallback(() => {
		getTeamUsers(
			groupId,
			100,
			0, // offset
			searchFilter,
		).then((data: unknown[]) => {
			setMemberCount(data.length);
			setAllTeamMembers(data);
		});
	}, [groupId, membersPage, searchFilter]);

	const filter = () => {
		filterUsers();
		filterUsersTwo();
	};

	// const debouncedFilterTeams = debounced(filter, 400);

	const handleInputChange = (newInputValue) => {
		setValue("SEARCH_FILTER", newInputValue);
	};

	return (
		<StyledMemberContent>
			<StyledMemberInnerContent>
				{(teamMembers && teamMembers.length > 0) ||
				memberCount > 0 ||
				hasMembers ||
				searchFilter ? (
					<StyledTableContainer>
						<StyledTableTitleContainer>
							<StyledTableTitleDiv>Members</StyledTableTitleDiv>
							<StyledTableTitleMemberContainer>
								{Avatars.length > 0 ? (
									<StyledAvatarGroupContainer>
										<StyledAvatarGroup
											spacing={"small"}
											variant={"circular"}
											max={5}
											total={teamMembers?.length}
										>
											{Avatars.map((el) => {
												return el;
											})}
										</StyledAvatarGroup>
									</StyledAvatarGroupContainer>
								) : null}
								<StyledTableTitleMemberCountContainer>
									<StyledTableTitleMemberCount>
										<Typography variant={"body1"}>
											{memberCount} Members
										</Typography>
									</StyledTableTitleMemberCount>
								</StyledTableTitleMemberCountContainer>
							</StyledTableTitleMemberContainer>

							<StyledSearchButtonContainer>
								<Search
									ref={memberSearchRef}
									placeholder="Search Members"
									size="small"
									value={searchFilter}
									onChange={(e) => {
										handleInputChange(e.target.value);
									}}
								/>
							</StyledSearchButtonContainer>

							<StyledDeleteSelectedContainer>
								{selectedMembers.length > 0 && (
									<Button
										variant={"outlined"}
										color="error"
										onClick={() =>
											setDeleteMembersModal(true)
										}
									>
										Delete Selected
									</Button>
								)}
							</StyledDeleteSelectedContainer>
							<StyledAddMemberContainer>
								<Button
									variant={"contained"}
									onClick={() => {
										setAddMembersModal(true);
										getUsersNonGroup(false);
									}}
									startIcon={<Add />}
								>
									Add Members
								</Button>
							</StyledAddMemberContainer>
						</StyledTableTitleContainer>
						<StyledMemberTable>
							<Table.Head>
								<Table.Row>
									<Table.Cell size="small">
										<Checkbox
											checked={
												selectedMembers.length ===
													teamMembers.length &&
												teamMembers.length > 0
											}
											onChange={() => {
												if (
													selectedMembers.length !==
													teamMembers.length
												) {
													setSelectedMembers(
														teamMembers,
													);
												} else {
													setSelectedMembers([]);
												}
											}}
										/>
										Name
									</Table.Cell>
									<Table.Cell size="small">
										Added Date
									</Table.Cell>
									<Table.Cell size="small">Action</Table.Cell>
								</Table.Row>
							</Table.Head>
							<Table.Body>
								{Array.isArray(teamMembers) &&
								teamMembers.length > 0 ? (
									teamMembers?.map((user) => {
										let isSelected = false;

										if (user) {
											isSelected = selectedMembers.some(
												(value) => {
													return (
														value.userid ===
														user.userid
													);
												},
											);
										}

										if (user) {
											return (
												<Table.Row key={user.userid}>
													<Table.Cell size="small">
														<Stack
															direction="row"
															spacing={0}
														>
															<StyledCheckbox
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
																					u.userid !==
																					user.userid
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
															<Stack
																direction="row"
																spacing={1}
																alignItems="center"
															>
																<StyledAvatar>
																	{user.name[0].toUpperCase()}
																</StyledAvatar>
																<NameIDWrapper>
																	<Typography variant="body2">
																		{
																			user.name
																		}
																	</Typography>
																	<Typography
																		variant="body2"
																		color="secondary"
																	>
																		{`${user.type} ID: ${user.userid}`}
																	</Typography>
																</NameIDWrapper>
															</Stack>
														</Stack>
													</Table.Cell>

													<DateTableCell size="small">
														{user.dateadded}
													</DateTableCell>

													<Table.Cell size="small">
														<IconButton
															size="small"
															onClick={() => {
																setUserToDelete(
																	user,
																);
																setDeleteMemberModal(
																	true,
																);
															}}
														>
															<DeleteRounded />
														</IconButton>
													</Table.Cell>
												</Table.Row>
											);
										} else {
											return (
												<Table.Row
													key={`No data available`}
												>
													<Table.Cell size="small"></Table.Cell>
													<Table.Cell size="small"></Table.Cell>
													<Table.Cell size="small"></Table.Cell>
												</Table.Row>
											);
										}
									})
								) : (
									<Table.Row key={"no-members-found"}>
										<Table.Cell colSpan={5} align="center">
											No Members found.
										</Table.Cell>
									</Table.Row>
								)}
							</Table.Body>
							<Table.Footer>
								<Table.Row>
									<StyledTablePagination
										rowsPerPageOptions={
											paginationOptions.membersPageCounts
										}
										onPageChange={(_e, _v) => {
											setMembersPage(_v + 1);
											setSelectedMembers([]);
										}}
										onRowsPerPageChange={(e) => {
											setRowsPerPage(
												parseInt(e.target.value, 10),
											);
											setMembersPage(1);
										}}
										page={membersPage - 1}
										rowsPerPage={rowsPerPage}
										count={memberCount}
									/>
								</Table.Row>
							</Table.Footer>
						</StyledMemberTable>
					</StyledTableContainer>
				) : (
					<StyledTableContainer>
						<StyledTableTitleContainer>
							<StyledTableTitleDiv>
								<Typography variant={"h6"}>Members</Typography>
							</StyledTableTitleDiv>
						</StyledTableTitleContainer>
						<StyledNoMembersDiv>
							<Typography variant={"body1"}>
								No members present
							</Typography>
							<Button
								variant={"contained"}
								onClick={() => {
									setAddMembersModal(true);
									getUsersNonGroup(false);
								}}
							>
								Add Members{" "}
							</Button>
						</StyledNoMembersDiv>
					</StyledTableContainer>
				)}
			</StyledMemberInnerContent>

			<Modal open={addMembersModal} maxWidth="lg">
				<Modal.Title>Add Members</Modal.Title>
				<Modal.Content sx={{ width: "50rem" }}>
					<StyledModalContentText>
						<Autocomplete
							label="Search"
							loading={searchLoading}
							multiple={true}
							freeSolo={false}
							filterOptions={(x) => x}
							options={filteredNonCredentialedUsers}
							includeInputInList={true}
							limitTags={2}
							getLimitTagsText={() =>
								` +${selectedNonCredentialedUsers.length - 2}`
							}
							value={selectedNonCredentialedUsers}
							inputValue={searchMemberInput}
							getOptionLabel={(option: unknown) => {
								return `${(option as { name: string }).name}`;
							}}
							renderOption={(props, option: TeamMember) => (
								<li
									{...props}
									style={{
										display: "flex",
										flexDirection: "column",
										alignItems: "flex-start",
										padding: "8px 16px",
									}}
								>
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											width: "100%",
											gap: "8px",
										}}
									>
										<Avatar sx={{ width: 32, height: 32 }}>
											{option.name
												? option.name
														.split(" ")
														.map((n) => n[0])
														.join("")
														.toUpperCase()
												: option.id[0].toUpperCase()}
										</Avatar>
										<Typography variant="body1">
											{option.name}
										</Typography>
									</Box>
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											gap: "16px",
											whiteSpace: "nowrap",
											fontSize: "14px",
											width: "100%",
											marginLeft: "40px",
										}}
									>
										<span
											style={{ color: "rgba(0,0,0,0.7)" }}
										>
											User ID:{" "}
										</span>
										<span
											title={option.id}
											style={{
												color: "#000",
												fontWeight: 500,
												width: "180px",
												overflow: "hidden",
												textOverflow: "ellipsis",
												display: "inline-block",
												verticalAlign: "bottom",
											}}
										>
											{option.id}
										</span>
										<span
											style={{ color: "rgba(0,0,0,0.7)" }}
										>
											Email:{" "}
										</span>
										<span
											title={option.email}
											style={{
												color: "#000",
												fontWeight: 500,
												width: "220px",
												overflow: "hidden",
												textOverflow: "ellipsis",
												display: "inline-block",
												verticalAlign: "bottom",
											}}
										>
											{option.email}
										</span>
										<span
											style={{ color: "rgba(0,0,0,0.7)" }}
										>
											Type:{" "}
										</span>
										<span
											title={option.type}
											style={{
												color: "#000",
												fontWeight: 500,
												width: "180px",
												overflow: "hidden",
												textOverflow: "ellipsis",
												display: "inline-block",
												verticalAlign: "bottom",
											}}
										>
											{option.type}
										</span>
									</Box>
								</li>
							)}
							isOptionEqualToValue={(option, value) => {
								return (
									(option as { name: string }).name ===
									(value as { name: string }).name
								);
							}}
							onChange={(_event, newValue: unknown[]) => {
								setSelectedNonCredentialedUsers([...newValue]);
							}}
							ListboxProps={{
								onScroll: ({ target }) =>
									setIsScrollBottom(
										nearBottom(
											target as {
												scrollHeight?: number;
												scrollTop?: number;
												clientHeight?: number;
											},
										),
									),
								style: {
									paddingLeft: "16px",
									paddingRight: "30px",
									paddingBottom: "16px",
								},
							}}
							onInputChange={(_event, newValue) => {
								setSearchMemberInput(newValue);
								setOffset(0);
							}}
						/>

						{selectedNonCredentialedUsers?.map((user, idx) => {
							const space = user.name.indexOf(" ");
							const initial = user.name
								? space > -1
									? `${user.name[0].toUpperCase()}${user.name[
											space + 1
										].toUpperCase()}`
									: user.name[0].toUpperCase()
								: user.id[0].toUpperCase();
							return (
								<Box
									key={`${user.name} - ${idx}`}
									sx={{
										display: "flex",
										justifyContent: "left",
										align: "center",
										backgroundColor:
											idx % 2 !== 0
												? "rgba(0, 0, 0, .03)"
												: "",
										paddingBottom: "8px",
										borderRadius: "8px",
										width: "100%",
										boxSizing: "border-box",
									}}
								>
									<Box
										sx={{
											width: "100%",
											gap: "8px",
											position: "relative",
											border: "5px",
											display: "flex",
										}}
									>
										<Box
											sx={{
												display: "flex",
												justifyContent: "left",
												marginTop: "6px",
												marginLeft: "8px",
												marginRight: "8px",
												float: "left",
											}}
										>
											<Box
												sx={{
													display: "flex",
													height: "32px",
													width: "32px",
													justifyContent: "center",
													alignItems: "center",
													border: "0.5px solid rgba(0, 0, 0, .05)",
													borderRadius: "50%",
												}}
											>
												<Avatar
													aria-label="avatar"
													sx={{
														display: "flex",
														width: "32px",
														height: "32px",
														fontSize: "24px",
														backgroundColor:
															user.color,
													}}
												>
													{initial}
												</Avatar>
											</Box>
										</Box>
										<Card.Header
											title={
												<Typography
													variant="h6"
													sx={{
														marginTop: "5px",
														maxWidth: "100%",
														lineHeight: 1.1,
													}}
												>
													{user.name}
												</Typography>
											}
											sx={{
												color: "#000",
												width: "100%",
												gap: "16px",
												margin: "0",
											}}
											subheader={
												<Box
													sx={{
														display: "flex",
														gap: "2px",
														marginTop: "2px",
													}}
												>
													<span
														style={{
															opacity: 0.9,
															fontSize: "11px",
														}}
													>
														{`User ID: `}
														<Chip
															label={user.id}
															size="small"
														/>
													</span>
													{`• `}
													<span>
														{`Email: `}
														<Chip
															label={user.email}
															size="small"
														/>
													</span>
												</Box>
											}
											action={
												<IconButton
													sx={{
														height: "28px",
														width: "28px",
														gap: "30px",
														fontSize: "small",
														mt: "16px",
														color: "rgba( 0, 0, 0, .7)",
														mr: "2px",
														top: "0px",
														position: "absolute",
														padding: "10px",
													}}
													onClick={() => {
														const filtered =
															selectedNonCredentialedUsers.filter(
																(val) =>
																	val.id !==
																	user.id,
															);
														setSelectedNonCredentialedUsers(
															filtered,
														);
													}}
												>
													<ClearRounded />
												</IconButton>
											}
										/>
									</Box>
								</Box>
							);
						})}
					</StyledModalContentText>
				</Modal.Content>
				<Modal.Actions>
					<Button
						variant="outlined"
						onClick={() => {
							setAddMembersModal(false);
							setOffset(0);
							setNonCredentialedUsers([]);
						}}
					>
						Cancel
					</Button>
					<Button
						variant={"contained"}
						disabled={selectedNonCredentialedUsers.length < 1}
						onClick={() => {
							submitNonGroupUsers();
						}}
					>
						Save
					</Button>
				</Modal.Actions>
			</Modal>
			<Modal open={deleteMemberModal} maxWidth="md">
				<Modal.Title>
					<Typography variant="h6">Are you sure?</Typography>
				</Modal.Title>
				<Modal.Content>
					<Modal.ContentText>
						{userToDelete && (
							<Typography variant="body1">
								This will remove <b>{userToDelete.name}</b>
							</Typography>
						)}
					</Modal.ContentText>
				</Modal.Content>
				<Modal.Actions>
					<Button
						variant="text"
						onClick={() => setDeleteMemberModal(false)}
					>
						Close
					</Button>
					<Button
						color="error"
						variant={"contained"}
						onClick={() => {
							if (!userToDelete) {
								console.error("No user to delete");
							}
							deleteUser(userToDelete);
						}}
					>
						Confirm
					</Button>
				</Modal.Actions>
			</Modal>
			<Modal open={deleteMembersModal}>
				<Modal.Title>Are you sure?</Modal.Title>
				<Modal.Content>
					Would you like to delete all selected members
				</Modal.Content>
				<Modal.Actions>
					<Button
						variant="text"
						onClick={() => setDeleteMembersModal(false)}
					>
						Close
					</Button>
					<Button
						variant={"contained"}
						color="error"
						onClick={() => {
							deleteTeamUsers();
						}}
					>
						Confirm
					</Button>
				</Modal.Actions>
			</Modal>
		</StyledMemberContent>
	);
};
