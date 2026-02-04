import {
	ClearRounded,
	EditRounded,
	RemoveRedEyeRounded,
} from "@mui/icons-material";
import type { AxiosResponse } from "axios";
import { useEffect, useState } from "react";
import { useDebouncedValue } from "@semoss/sdk/react";
import {
	Autocomplete,
	Avatar,
	Box,
	Button,
	Card,
	Icon,
	IconButton,
	Modal,
	RadioGroup,
	Select,
	Stack,
	styled,
	TextField,
	Typography,
	useNotification,
} from "@semoss/ui";
import {
	addEngineUserPermissions,
	addProjectUserPermissions,
	editEngineUserPermissions,
	editProjectUserPermissions,
	getEngineUsers,
	getEngineUsersNoCredentials,
	getProjectUsers,
	getProjectUsersNoCredentials,
} from "@/api";
import { PERMISSION_DESCRIPTION_MAP } from "@/constants";
import { useSettings } from "@/hooks";
import type { ALL_TYPES } from "@/types";
import { permissionPriorityMapper } from "@/utility/general";
import { MembersAddOverlayUser } from "./MembersAddOverlayUser";
import type { SETTINGS_ROLE } from "./settings.types";

const StyledModal = styled(Modal.Content)(({ theme }) => ({
	maxWidth: "50rem",
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(1),
}));

const StyledSelection = styled("div")(({ theme }) => ({
	backgroundColor: "rgba(0,0,0,.03)",
	borderRadius: theme.shape.borderRadius,
	padding: theme.spacing(1),
}));

const StyledCard = styled(Card)({
	borderRadius: "12px",
});

const StyledCardHeader = styled(Card.Header)({
	color: "#000",
	width: "100%",
});

const StyledOuterBox = styled("div")(({ theme }) => ({
	flexShrink: "0",
	display: "flex",
	flexDirection: "column",
	maxHeight: "200px",
	overflow: "auto",
	gap: theme.spacing(1),
}));

const Setting_Role_Values: SETTINGS_ROLE[] = ["Author", "Editor", "Read-Only"];

const validSetting = (value: unknown) => {
	return Setting_Role_Values.includes(value as SETTINGS_ROLE);
};

const AUTOCOMPLETE_OFFSET = 0;
const AUTOCOMPLETE_LIMIT = 10;

interface MembersAddOverlayProps {
	/**
	 * Type of engine
	 */
	type: ALL_TYPES;

	/**
	 * ID of the app or engine being edited
	 */
	id: string;

	/**
	 * Track if the model is open or close
	 */
	open: boolean;

	/**
	 * User we want to edit
	 */
	user?: User;

	/**
	 * Set Edit user to null
	 *
	 */
	setAddModalUser?: React.Dispatch<React.SetStateAction<User>>;

	/**
	 * User permission of the app or engine being edited
	 */
	userPermission: SETTINGS_ROLE;

	/**
	 * Called on close
	 *
	 * @returns - method that is called onClose
	 */
	onClose: (success: boolean) => void;

	/**
	 * Called on close
	 *
	 * @returns - method that is called onClose
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

export const MembersAddOverlay = (props: MembersAddOverlayProps) => {
	const {
		type,
		id,
		open = false,
		userPermission,
		onClose = () => null,
		user,
		setAddModalUser,
		onChange = () => null,
	} = props;
	const notification = useNotification();
	const { adminMode } = useSettings();

	/** Add Member State */
	const [selectedMembers, setSelectedMembers] = useState([]);

	const [selectedRole, setSelectedRole] = useState<SETTINGS_ROLE>(null);
	const [search, setSearch] = useState<string>("");
	const [restriction, setRestriction] = useState<string>("null");
	const [maxTokens, setMaxTokens] = useState<string>("");
	const [maxTime, setMaxTime] = useState<string>("");
	const [frequency, setFrequency] = useState<string>("");

	//modal member logic
	const [isScrollBottom, setIsScrollBottom] = useState(false);
	const [offset, setOffset] = useState(AUTOCOMPLETE_OFFSET);
	const [renderedMembers, setRenderedMembers] = useState([]);
	const [infiniteOn, setInfiniteOn] = useState(true);
	const [searchLoading, setSearchLoading] = useState(false);

	// debounce the input
	const debouncedSearch = useDebouncedValue(search);

	const usageRestritctionTypes: Record<string, string> = {
		null: "None",
		token: "Token",
		compute: "Compute time",
	};
	const frequencyTypes: Record<string, string> = {
		DAY: "Daily",
		WEEK: "Weekly",
		MONTH: "Monthly",
	};
	const unitTypes: string[] = ["milliseconds"];

	useEffect(() => {
		setSelectedRole("Read-Only");
		if (user) {
			setSelectedRole(
				permissionPriorityMapper(user?.permission)
					?.permission as SETTINGS_ROLE,
			);
			setRestriction(
				user?.usage_restriction !== undefined
					? user?.usage_restriction
					: "null",
			);
			setMaxTokens(user?.max_tokens?.toString());
			setMaxTime(user?.max_response_time?.toString());
			setFrequency(user?.usage_frequency);
		}

		// reset on open or close
		setSelectedMembers([]);
		setSearch("");
	}, [open]);

	useEffect(() => {
		if (!open) return;

		const cancelled = false;
		setSearchLoading(true);

		const fetchUsers = async () => {
			try {
				let all = [];
				if (type === "PROJECT") {
					const [noCred, cred] = await Promise.all([
						getProjectUsersNoCredentials(
							adminMode,
							id,
							AUTOCOMPLETE_LIMIT,
							offset,
							debouncedSearch || "",
						),
						getProjectUsers(
							adminMode,
							id,
							debouncedSearch || "",
							"", // permission
							offset,
							AUTOCOMPLETE_LIMIT,
						),
					]);
					all = [...(noCred?.data || []), ...(cred?.members || [])];
				} else if (
					type === "DATABASE" ||
					type === "STORAGE" ||
					type === "MODEL" ||
					type === "VECTOR" ||
					type === "FUNCTION"
				) {
					const [noCred, cred] = await Promise.all([
						getEngineUsersNoCredentials(
							adminMode,
							id,
							AUTOCOMPLETE_LIMIT,
							offset,
							debouncedSearch || "",
						),
						getEngineUsers(
							adminMode,
							id,
							debouncedSearch || "",
							"", // permission
							offset,
							AUTOCOMPLETE_LIMIT,
						),
					]);
					all = [...(noCred?.data || []), ...(cred?.members || [])];
				} else {
					setSearchLoading(false);
					return;
				}

				if (!cancelled) {
					if (all.length < AUTOCOMPLETE_LIMIT) setInfiniteOn(false);
					if (
						renderedMembers.length >= AUTOCOMPLETE_LIMIT &&
						offset > 0
					) {
						setRenderedMembers((prev) => [...prev, ...all]);
					} else {
						setRenderedMembers(all);
					}
					setSearchLoading(false);
				}
			} catch (e) {
				if (!cancelled) {
					notification.add({
						color: "error",
						message: String(e),
					});
					setSearchLoading(false);
				}
			}
		};

		fetchUsers();
	}, [open, debouncedSearch, offset, adminMode, id, type]);

	const isLoading = searchLoading;

	const getAdditionalMembers = () => {
		setOffset(offset + AUTOCOMPLETE_LIMIT);
	};

	/**
	 * Update the selected users
	 * @param members
	 * @param quickUpdate
	 * @returns
	 */
	const updateUser = async (members) => {
		let success = false;
		try {
			// construct requests for post data
			const requests = members.map((m) => {
				let json: Record<string, unknown> = {
					userid: m.id,
					permission: validSetting(selectedRole)
						? permissionPriorityMapper(selectedRole)?.permission
						: selectedRole,
				};

				// FOR MODELS
				if (restriction !== "null") {
					json = {
						...json,
						usageRestriction: restriction,
					};
				}

				if (frequency) {
					json = {
						...json,
						usageFrequency: frequency,
					};
				}

				if (restriction === "token") {
					json = {
						...json,
						maxTokens: Number(maxTokens),
					};
				}

				if (restriction === "compute") {
					json = {
						...json,
						maxResponseTime: Number(maxTime),
					};
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

				success = true;

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
		} finally {
			closeOverlay(type, success);
		}
	};

	/**
	 * @name addMembers
	 *
	 * Add members to the app or engine
	 */
	const addMembers = async () => {
		let success = false;

		try {
			// construct requests for post data
			let requests: unknown[] = [];
			if (type === "MODEL") {
				requests = selectedMembers.map((m) => {
					return {
						userid: m.id,
						permission:
							permissionPriorityMapper(selectedRole)?.permission,
						email: m.email,
						name: m.name,
						type: m.type,
						username: m.username,
						usageRestriction:
							restriction === "null" ? null : restriction,
						usageFrequency: frequency,
						...(restriction === "token" && {
							maxTokens: Number(maxTokens),
						}),
						...(restriction === "compute" && {
							maxResponseTime: Number(maxTime),
						}),
					};
				});
			} else {
				requests = selectedMembers.map((m) => {
					return {
						userid: m.id,
						permission:
							permissionPriorityMapper(selectedRole)?.permission,
						email: m.email,
						name: m.name,
						type: m.type,
						username: m.username,
					};
				});
			}

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
				response = await addEngineUserPermissions(
					adminMode,
					id,
					requests,
				);
			} else if (type === "PROJECT") {
				response = await addProjectUserPermissions(
					adminMode,
					id,
					requests as string[],
				);
			}

			if (!response) {
				return;
			}

			// ignore if there is no response
			if (response.data.success) {
				notification.add({
					color: "success",
					message: "Successfully added member permissions",
				});

				success = true;
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
		} finally {
			// close the overlay
			closeOverlay(type, success);
		}
	};

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

	const closeOverlay = (type: ALL_TYPES, isSuccess: boolean) => {
		if (type === "MODEL") {
			setRestriction("null");
			setFrequency("");
			setMaxTime("");
			setMaxTokens("");
		}
		setAddModalUser(null);
		onClose(isSuccess);
	};

	useEffect(() => {
		if (isScrollBottom) {
			if (infiniteOn) {
				getAdditionalMembers();
			}
		}
	}, [isScrollBottom]);

	return (
		<Modal
			open={open}
			maxWidth="lg"
			data-testid="members-add-overlay-modal"
		>
			<Modal.Title data-testid="members-add-overlay-modal-title">
				{" "}
				{user === null ? "Add Members" : "Edit Member"}
			</Modal.Title>
			<StyledModal>
				{user === null && (
					<Autocomplete
						label="Search"
						loading={isLoading || searchLoading}
						multiple={true}
						freeSolo={false}
						filterOptions={(x) => x}
						options={renderedMembers ? renderedMembers : []}
						includeInputInList={true}
						limitTags={2}
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
						}}
						getLimitTagsText={() =>
							` +${selectedMembers.length - 2}`
						}
						value={selectedMembers}
						inputValue={search}
						getOptionLabel={(option) => {
							return `${option.name}`;
						}}
						isOptionEqualToValue={(option, value) => {
							return option.id === value.id;
						}}
						onInputChange={(_event, newValue) => {
							setSearch(newValue);
							setOffset(0);
							setInfiniteOn(true);
							setRenderedMembers([]);
							setSearchLoading(true);
						}}
						onChange={(_event, newValue) => {
							setSelectedMembers(newValue || []);
						}}
						getOptionDisabled={(option) => !!option.permission}
						renderOption={(props, option) => {
							const { ...optionProps } = props;
							const hasPermission = !!option.permission;
							return (
								<li key={option.id} {...optionProps}>
									<div
										style={{
											maxWidth: "85%",
											overflow: "hidden",
										}}
									>
										<MembersAddOverlayUser
											name={option.name}
											id={option.id}
											email={option.email}
											type={option.type}
										/>
									</div>

									{hasPermission && (
										<div
											style={{
												whiteSpace: "nowrap",
												display: "inline-block",
												fontSize: "12px",
											}}
										>
											Already Added
										</div>
									)}
								</li>
							);
						}}
						renderInput={(params) => (
							<TextField
								{...params}
								variant="outlined"
								placeholder="Search users"
								InputProps={{
									...params.InputProps,
									startAdornment: null,
								}}
							/>
						)}
						data-testid="members-add-overlay-autocomplete"
					/>
				)}
				<StyledOuterBox data-testid="members-add-overlay-outerbox">
					{user === null &&
						selectedMembers.map((user) => (
							<MembersAddOverlayUser
								key={user.id}
								name={user.name}
								id={user.id}
								email={user.email}
								type={user.type}
								action={
									<IconButton
										size="small"
										onClick={() => {
											// remove any selected users from the array
											const filtered =
												selectedMembers.filter(
													(val) => val.id !== user.id,
												);

											setSelectedMembers(filtered);
										}}
									>
										<ClearRounded fontSize="small" />
									</IconButton>
								}
							/>
						))}

					{user !== null && (
						<MembersAddOverlayUser
							key={user.id}
							name={user.name}
							id={user.id}
							email={user.email}
							type={user.type}
						/>
					)}
				</StyledOuterBox>

				<Typography
					variant="subtitle1"
					data-testid="members-permissions"
				>
					Permissions
				</Typography>
				<StyledSelection>
					<RadioGroup
						label={""}
						value={selectedRole}
						onChange={(e) => {
							const val = e.target.value;
							if (val) {
								setSelectedRole(val as SETTINGS_ROLE);
							}
						}}
					>
						<Stack spacing={1}>
							<StyledCard>
								<StyledCardHeader
									title={
										<Box
											sx={{
												display: "flex",
												fontSize: "16px",
											}}
											data-testid="author-role"
										>
											<Avatar
												sx={{
													width: "20px",
													height: "20px",
													mt: "6px",
													marginRight: "12px",
													fontSize: "12px",
													fontWeight: "bold",
													backgroundColor:
														"rgba(0, 0, 0, .5)",
												}}
												data-testid="author-role-avatar"
											>
												A
											</Avatar>
											Author
										</Box>
									}
									sx={{ color: "#000" }}
									subheader={
										<Box
											sx={{
												marginLeft: "30px",
											}}
										>
											{PERMISSION_DESCRIPTION_MAP[type]
												.author ||
												`Error: update key in test-editor.constants to "${name}"`}
										</Box>
									}
									action={
										<RadioGroup.Item
											value="Author"
											label=""
											disabled={
												!adminMode &&
												permissionPriorityMapper(
													userPermission,
												)?.priority > 1
											}
											data-testid="author-role-radio"
										/>
									}
								/>
							</StyledCard>
							<StyledCard>
								<Card.Header
									title={
										<Box
											sx={{
												display: "flex",
												fontSize: "16px",
											}}
											data-testid="editor-role"
										>
											<Icon
												sx={{
													width: "24px",
													height: "24px",
													mt: "6px",
													marginRight: "12px",
													fontSize: "12px",
													fontWeight: "bold",
													color: "rgba(0, 0, 0, .5)",
													maxWidth: "24px",
													display: "flex", // Ensure the icon is displayed properly
													alignItems: "center", // Center the icon vertically
													justifyContent: "center",
												}}
												data-testid="editor-role-icon"
											>
												<EditRounded />
											</Icon>
											Editor
										</Box>
									}
									sx={{ color: "#000" }}
									subheader={
										<Box
											sx={{
												marginLeft: "30px",
											}}
										>
											{PERMISSION_DESCRIPTION_MAP[type]
												.editor ||
												`Error: update key in test-editor.constants to "${name}"`}
										</Box>
									}
									action={
										<RadioGroup.Item
											value="Editor"
											label=""
											disabled={
												!adminMode &&
												permissionPriorityMapper(
													userPermission,
												)?.priority > 2
											}
											data-testid="editor-role-radio"
										/>
									}
								/>
							</StyledCard>
							<StyledCard>
								<Card.Header
									title={
										<Box
											sx={{
												display: "flex",
												fontSize: "16px",
											}}
											data-testid="readonly-role"
										>
											<Icon
												sx={{
													width: "24px",
													height: "24px",
													mt: "0px",
													marginRight: "12px",
													fontSize: "24px",
													fontWeight: "bold",
													color: "rgba(0, 0, 0, .5)",
													maxWidth: "24px",
													display: "flex", // Ensure the icon is displayed properly
													alignItems: "center", // Center the icon vertically
													justifyContent: "center",
												}}
												data-testid="readonly-role-icon"
											>
												<RemoveRedEyeRounded />
											</Icon>
											Read-Only
										</Box>
									}
									sx={{ color: "#000" }}
									subheader={
										<Box
											sx={{
												marginLeft: "30px",
											}}
										>
											{PERMISSION_DESCRIPTION_MAP[type]
												.readonly ||
												`Error: update key in test-editor.constants to "${name}"`}
										</Box>
									}
									action={
										<RadioGroup.Item
											value="Read-Only"
											label=""
											disabled={
												!adminMode &&
												permissionPriorityMapper(
													userPermission,
												)?.priority > 3
											}
											data-testid="readonly-role-radio"
										/>
									}
								/>
							</StyledCard>
						</Stack>
					</RadioGroup>
				</StyledSelection>

				{type === "MODEL" && (
					<>
						<Typography
							variant="subtitle1"
							data-testid="model-limit-restrictions"
						>
							Model Limit Restrictions
						</Typography>
						<Stack direction={"column"} gap={1}>
							<Select
								label="Limit Type"
								defaultValue={restriction}
								value={restriction}
								onChange={(e) => {
									setRestriction(e.target.value);
								}}
								data-testid="model-limit-restrictions-select"
							>
								{Object.entries(usageRestritctionTypes).map(
									(option, _i) => {
										return (
											<Select.Item
												value={option[0]}
												key={`usageRestrictionType-${option[0]}`}
											>
												{option[1]}
											</Select.Item>
										);
									},
								)}
							</Select>
							{restriction === "token" && (
								<TextField
									label="Max Tokens"
									value={maxTokens}
									type="number"
									onChange={(e) => {
										setMaxTokens(e.target.value);
									}}
									data-testid="model-max-tokens"
								></TextField>
							)}
							{restriction === "compute" && (
								<Stack direction={"row"} gap={1}>
									<TextField
										label="Max Response Time"
										value={maxTime}
										type="number"
										onChange={(e) => {
											setMaxTime(e.target.value);
										}}
										data-testid="model-max-response-time"
									></TextField>
									<Select label="Unit" value={unitTypes[0]}>
										{unitTypes.map((option, _i) => {
											return (
												<Select.Item
													value={option}
													key={`unitType-${option}`}
												>
													{option}
												</Select.Item>
											);
										})}
									</Select>
								</Stack>
							)}
							{restriction !== "null" && (
								<Select
									label="Frequency"
									value={frequency}
									onChange={(e) => {
										setFrequency(e.target.value);
									}}
									data-testid="model-frequency-select"
								>
									{Object.entries(frequencyTypes).map(
										(option, _i) => {
											return (
												<Select.Item
													value={option[0]}
													key={`frequencyType-${option[0]}`}
												>
													{option[1]}
												</Select.Item>
											);
										},
									)}
								</Select>
							)}
						</Stack>
					</>
				)}
			</StyledModal>
			<Modal.Actions>
				<Button
					variant="outlined"
					onClick={() => closeOverlay(type, false)}
					data-testid="members-add-overlay-cancel-button"
				>
					Cancel
				</Button>
				{user === null && (
					<Button
						variant={"contained"}
						color="primary"
						disabled={!selectedRole || selectedMembers.length < 1}
						onClick={() => {
							addMembers();
						}}
						data-testid="members-add-overlay-add-button"
					>
						Save
					</Button>
				)}

				{user !== null && (
					<Button
						variant={"contained"}
						color="primary"
						disabled={!selectedRole}
						onClick={() => {
							updateUser([user]);
						}}
						data-testid="members-add-overlay-update-button"
					>
						Update
					</Button>
				)}
			</Modal.Actions>
		</Modal>
	);
};
