import { ClearRounded } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { useDebouncedValue } from "@semoss/sdk/react";
import {
	getProjectUsers,
	getProjectUsersNoCredentials,
} from "@semoss/shared";
import {
	Autocomplete,
	Box,
	Button,
	IconButton,
	Modal,
	RadioGroup,
	styled,
	TextField,
	Typography,
	useNotification,
} from "@semoss/ui";
import {
	addEngineUserPermissions,
	editEngineUserPermissions,
	getEngineUsers,
	getUserEnginePermission,
} from "@/api";
import { usePixel, useSettings } from "@/hooks";
import { permissionPriorityMapper } from "@/utility/general";
import { MembersAddOverlayUser } from "./members-add-overlay-user";
import type { SETTINGS_ROLE } from "./settings.types";

// Styled modal content to match MembersAddOverlay
const StyledModal = styled(Modal.Content)(({ theme }) => ({
	minWidth: "50rem",
	maxWidth: "80rem",
	width: "100%",
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(1),
	boxSizing: "border-box",
}));

const StyledOuterBox = styled("div")(({ theme }) => ({
	flexShrink: "0",
	display: "flex",
	flexDirection: "column",
	maxHeight: "300px",
	overflow: "auto",
	border: "1px solid rgba(0, 0, 0, 0.12)",
	borderRadius: "8px",
	gap: theme.spacing(1),
}));

const AUTOCOMPLETE_LIMIT = 10;

interface MemberDependencyOverlayProps {
	/**
	 * Type of engine
	 */
	// type: ALL_TYPES;

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
	 * Details of the current logged-in user (from MembersTable)
	 */
	userData?: User;

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

export const MemberDependencyOverlay = (
	// Add member to engine with selected permission
	props: MemberDependencyOverlayProps,
) => {
	const {
		// type,
		id,
		open = false,
		onClose = () => null,
		onChange = () => null,
	} = props;
	const notification = useNotification();
	const { adminMode } = useSettings();

	const permissionLabel = (perm: string) => {
		if (perm === "OWNER") return "Author";
		if (perm === "EDIT") return "Editor";
		if (perm === "READ_ONLY") return "Read-Only";
		return perm || "None";
	};

	/** Add Member State */
	const [selectedMember, setSelectedMember] = useState<User | null>(null);
	const [users, setUsers] = useState<User[]>([]);
	const [search, setSearch] = useState<string>("");
	const [offset, setOffset] = useState(0);
	const [searchLoading, setSearchLoading] = useState(false);
	const [renderedMembers, setRenderedMembers] = useState([]);

	// Reset state when modal is opened or closed
	useEffect(() => {
		if (open) {
			setSelectedMember(null);
			setPendingPermissions({});
			setUserDependencies([]);
			setUserNoAccess([]);
			setEnginePermissions({});
			setRenderedMembers([]);
			setSearch("");
			setOffset(0);
		}
	}, [open]);

	// Get all dependencies for the opened app using usePixel
	const getProjectDependencies = usePixel<any[]>(
		`GetProjectDependencies(project="${id}", details=[true]);`,
	);
	const allDependencies = getProjectDependencies?.data || [];
	const [userDependencies, setUserDependencies] = useState<string[]>([]);
	const [userNoAccess, setUserNoAccess] = useState<string[]>([]);
	const [enginePermissions, setEnginePermissions] = useState<
		Record<string, string>
	>({});
	const [checkingAccess, setCheckingAccess] = useState(false);

	useEffect(() => {
		if (!selectedMember || !allDependencies.length) {
			setUserDependencies([]);
			setUserNoAccess([]);
			return;
		}
		setCheckingAccess(true);
		// Inline checkUserDependencies logic
		(async () => {
			const hasAccess = [];
			const noAccess = [];
			const permissions = {};
			for (const dep of allDependencies) {
				try {
					let users = [];
					// Engine (DATABASE, STORAGE, MODEL, VECTOR, FUNCTION, etc.)
					const result = await getEngineUsers(
						adminMode,
						dep.engine_id,
						"",
						"",
						0,
						1000,
					);
					users = result?.members || [];
					const userObj = users.find(
						(u) => u.id === selectedMember.id,
					);
					if (userObj) {
						hasAccess.push(dep.engine_id);
						permissions[dep.engine_id] =
							userObj.permission || "Read-Only";
					} else {
						noAccess.push(dep.engine_id);
					}
				} catch {
					noAccess.push(dep.engine_id);
				}
			}
			setUserDependencies(hasAccess);
			setUserNoAccess(noAccess);
			setEnginePermissions(permissions);
			setCheckingAccess(false);
		})();
	}, [selectedMember, allDependencies, adminMode]);

	// debounce the input
	const debouncedSearch = useDebouncedValue(search);

	const [pendingPermissions, setPendingPermissions] = useState<
		Record<string, string>
	>({});

	const [loggedInUserEnginePermissions, setLoggedInUserEnginePermissions] =
		useState<Record<string, string>>({});

	useEffect(() => {
		if (!allDependencies.length) {
			setLoggedInUserEnginePermissions({});
			return;
		}
		const fetchPermissions = async () => {
			const perms: Record<string, string> = {};
			await Promise.all(
				allDependencies.map(async (dep) => {
					try {
						const res = await getUserEnginePermission(
							dep.engine_id,
						);
						perms[dep.engine_id] = res?.permission || "";
					} catch {
						perms[dep.engine_id] = "";
					}
				}),
			);
			setLoggedInUserEnginePermissions(perms);
		};
		fetchPermissions();
	}, [allDependencies]);

	useEffect(() => {
		if (!open) return;

		const cancelled = false;
		setSearchLoading(true);

		const fetchUsers = async () => {
			try {
				let all = [];
				const [noCred, cred] = await Promise.all([
					getProjectUsersNoCredentials(
						id,
						adminMode,
						debouncedSearch || "",
						AUTOCOMPLETE_LIMIT,
						offset,
					),
					getProjectUsers(
						id,
						adminMode,
						debouncedSearch || "",
						"", // permission
						AUTOCOMPLETE_LIMIT,
						offset,
					),
				]);
				all = [...(noCred || []), ...(cred?.members || [])];
				if (!cancelled) {
					if (
						renderedMembers.length >= AUTOCOMPLETE_LIMIT &&
						offset > 0
					) {
						setRenderedMembers((prev) => [...prev, ...all]);
						setUsers((prev) => [...prev, ...all]);
					} else {
						setRenderedMembers(all);
						setUsers(all);
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
	}, [open, debouncedSearch, offset, adminMode, id]);

	return (
		<Modal open={open} maxWidth="lg">
			<Modal.Title sx={{ textAlign: "center", width: "100%" }}>
				Add Members to Dependency
			</Modal.Title>
			<StyledModal>
				{!selectedMember && (
					<Autocomplete
						label="Search"
						loading={searchLoading}
						multiple={false}
						freeSolo={false}
						filterOptions={(x) => x}
						options={users}
						includeInputInList={true}
						value={selectedMember}
						inputValue={search}
						getOptionLabel={(option) =>
							typeof option === "string" ? option : option.name
						}
						isOptionEqualToValue={(option, value) =>
							typeof option === "object" &&
							option !== null &&
							"id" in option &&
							typeof value === "object" &&
							value !== null &&
							"id" in value &&
							option.id === value.id
						}
						onInputChange={(_event, newValue) => {
							setSearch(newValue || "");
							setOffset(0);
							setUsers([]);
						}}
						onChange={(_event, newValue) => {
							if (
								typeof newValue === "object" &&
								newValue !== null &&
								"id" in newValue
							) {
								setSelectedMember(newValue as User);
							} else {
								setSelectedMember(null);
							}
						}}
						renderOption={(props, option) => {
							if (
								typeof option === "object" &&
								option !== null &&
								"id" in option
							) {
								return (
									<li key={option.id} {...props}>
										<div
											style={{
												width: "100%",
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
									</li>
								);
							}
							return null;
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
					/>
				)}

				{/* Show selected user under search bar */}
				{selectedMember && (
					<StyledOuterBox
						sx={(theme) => ({
							boxShadow: `0 2px 8px 0 ${theme.palette.primary.main}33`, // 33 for ~20% opacity
							border: `1.5px solid ${theme.palette.primary.main}`,
						})}
					>
						<MembersAddOverlayUser
							key={selectedMember.id}
							name={selectedMember.name}
							id={selectedMember.id}
							email={selectedMember.email}
							type={selectedMember.type}
							action={
								<IconButton
									size="small"
									onClick={() => {
										setSelectedMember(null);
									}}
								>
									<ClearRounded fontSize="small" />
								</IconButton>
							}
						/>
					</StyledOuterBox>
				)}

				{/* Show dependencies access info if a user is selected */}
				{selectedMember && (
					<Box sx={{ mt: 2 }}>
						<Typography variant="h6">Dependency Access</Typography>
						{checkingAccess ? (
							<Typography variant="body2">
								Checking access...
							</Typography>
						) : (
							<Box>
								<Box>
									<Typography
										variant="subtitle1"
										sx={{
											mb: 2,
											fontWeight: 500,
											color: "success.main",
										}}
									>
										Has Access
									</Typography>
									<Box
										sx={{
											display: "flex",
											flexDirection: "column",
										}}
									>
										{allDependencies
											.filter((dep) =>
												userDependencies.includes(
													dep.engine_id,
												),
											)
											.map((dep) => (
												<Box
													key={dep.engine_id}
													sx={{
														display: "flex",
														alignItems: "center",
														gap: 2,
														mb: 1,
														p: 1,
														border: "1px solid #e0e0e0",
														borderRadius: "8px",
														background: "#f9f9f9",
														width: "100%",
													}}
												>
													<Box
														sx={{
															display: "flex",
															flexDirection:
																"column",
															flex: "0 0 40%",
															maxWidth: "40%",
															minWidth: 120,
														}}
													>
														<Typography
															variant="body1"
															sx={{
																fontWeight: 400,
																minWidth: 120,
															}}
														>
															{dep.engine_name ||
																dep.engine_id}
														</Typography>
														<Typography
															variant="caption"
															sx={{
																ml: 0,
																mt: 0.5,
															}}
														>
															Your Access:{" "}
															{permissionLabel(
																loggedInUserEnginePermissions[
																	dep
																		.engine_id
																],
															) || "None"}
														</Typography>
													</Box>
													<Box
														sx={{
															flex: "0 0 60%",
															maxWidth: "60%",
														}}
													>
														<RadioGroup
															row
															value={
																pendingPermissions[
																	dep
																		.engine_id
																] ||
																(enginePermissions[
																	dep
																		.engine_id
																] === "OWNER"
																	? "Author"
																	: enginePermissions[
																				dep
																					.engine_id
																			] ===
																			"EDIT"
																		? "Editor"
																		: enginePermissions[
																					dep
																						.engine_id
																				] ===
																				"READ_ONLY"
																			? "Read-Only"
																			: "")
															}
															sx={{
																ml: 2,
																gap: 2,
															}}
															onChange={(e) => {
																setPendingPermissions(
																	(prev) => ({
																		...prev,
																		[dep.engine_id]:
																			e
																				.target
																				.value,
																	}),
																);
															}}
														>
															<RadioGroup.Item
																value="Author"
																label="Author"
																disabled={
																	permissionPriorityMapper(
																		loggedInUserEnginePermissions[
																			dep
																				.engine_id
																		],
																	).priority >
																		1 &&
																	!adminMode
																}
															/>
															<RadioGroup.Item
																value="Editor"
																label="Editor"
																disabled={
																	(loggedInUserEnginePermissions[
																		dep
																			.engine_id
																	] ===
																		"EDIT" &&
																		enginePermissions[
																			dep
																				.engine_id
																		] ===
																			"OWNER") ||
																	(permissionPriorityMapper(
																		loggedInUserEnginePermissions[
																			dep
																				.engine_id
																		],
																	).priority >
																		2 &&
																		!adminMode)
																}
															/>
															<RadioGroup.Item
																value="Read-Only"
																label="Read-Only"
																disabled={
																	(loggedInUserEnginePermissions[
																		dep
																			.engine_id
																	] ===
																		"EDIT" &&
																		enginePermissions[
																			dep
																				.engine_id
																		] ===
																			"OWNER") ||
																	(permissionPriorityMapper(
																		loggedInUserEnginePermissions[
																			dep
																				.engine_id
																		],
																	)
																		.priority >=
																		3 &&
																		!adminMode)
																}
															/>
														</RadioGroup>
													</Box>
												</Box>
											))}
									</Box>
								</Box>
								<Box sx={{ mt: 2 }}>
									<Typography
										variant="subtitle1"
										sx={{
											mb: 2,
											fontWeight: 500,
											color: "error.main",
										}}
									>
										No Access
									</Typography>
									<Box
										sx={{
											display: "flex",
											flexDirection: "column",
										}}
									>
										{allDependencies
											.filter((dep) =>
												userNoAccess.includes(
													dep.engine_id,
												),
											)
											.map((dep) => (
												<Box
													key={dep.engine_id}
													sx={{
														display: "flex",
														alignItems: "center",
														gap: 2,
														mb: 1,
														p: 1,
														border: "1px solid #f0f0f0",
														borderRadius: "8px",
														background: "#fff",
													}}
												>
													<Box
														sx={{
															display: "flex",
															flexDirection:
																"column",
															flex: "0 0 40%",
															maxWidth: "40%",
															minWidth: 120,
														}}
													>
														<Typography
															variant="body1"
															sx={{
																fontWeight: 400,
																minWidth: 120,
															}}
														>
															{dep.engine_name ||
																dep.engine_id}
														</Typography>
														<Typography
															variant="caption"
															sx={{
																ml: 0,
																mt: 0.5,
															}}
														>
															Your Access:{" "}
															{permissionLabel(
																loggedInUserEnginePermissions[
																	dep
																		.engine_id
																],
															) || "None"}
														</Typography>
													</Box>
													<Box
														sx={{
															flex: "0 0 60%",
															maxWidth: "60%",
														}}
													>
														<RadioGroup
															row
															value={
																pendingPermissions[
																	dep
																		.engine_id
																] || ""
															}
															sx={{
																ml: 2,
																gap: 2,
															}}
															onChange={(e) => {
																setPendingPermissions(
																	(prev) => ({
																		...prev,
																		[dep.engine_id]:
																			e
																				.target
																				.value,
																	}),
																);
															}}
														>
															<RadioGroup.Item
																value="Author"
																label="Author"
																disabled={
																	permissionPriorityMapper(
																		loggedInUserEnginePermissions[
																			dep
																				.engine_id
																		],
																	).priority >
																		1 &&
																	!adminMode
																}
															/>
															<RadioGroup.Item
																value="Editor"
																label="Editor"
																disabled={
																	permissionPriorityMapper(
																		loggedInUserEnginePermissions[
																			dep
																				.engine_id
																		],
																	).priority >
																		2 &&
																	!adminMode
																}
															/>
															<RadioGroup.Item
																value="Read-Only"
																label="Read-Only"
																disabled={
																	permissionPriorityMapper(
																		loggedInUserEnginePermissions[
																			dep
																				.engine_id
																		],
																	)
																		.priority >=
																		3 &&
																	!adminMode
																}
															/>
														</RadioGroup>
													</Box>
												</Box>
											))}
									</Box>
								</Box>
							</Box>
						)}
					</Box>
				)}
			</StyledModal>
			<Modal.Actions>
				<Button variant="outlined" onClick={() => onClose(false)}>
					Cancel
				</Button>
				<Button
					variant="contained"
					color="primary"
					disabled={!selectedMember}
					onClick={async () => {
						if (!selectedMember) return;
						let success = true;
						const failedCalls: string[] = [];
						for (const [engineId, permission] of Object.entries(
							pendingPermissions,
						)) {
							const backendPermission =
								permission === "Author"
									? "OWNER"
									: permission === "Editor"
										? "EDIT"
										: permission === "Read-Only"
											? "READ_ONLY"
											: permission;
							const userObj = [
								{
									userid: selectedMember.id,
									permission: backendPermission,
								},
							];
							let response;
							if (userDependencies.includes(engineId)) {
								// Update permission
								response = await editEngineUserPermissions(
									adminMode,
									engineId,
									userObj,
								);
							} else {
								// Add user to engine
								response = await addEngineUserPermissions(
									adminMode,
									engineId,
									userObj,
								);
							}
							if (response?.data?.success) {
								// Only update local state for successful calls
								if (!userDependencies.includes(engineId)) {
									setUserDependencies((prev) => [
										...prev,
										engineId,
									]);
									setUserNoAccess((prev) =>
										prev.filter((id) => id !== engineId),
									);
								}
								setEnginePermissions((prev) => ({
									...prev,
									[engineId]: backendPermission,
								}));
							} else {
								success = false;
								const depObj = allDependencies.find(
									(dep) => dep.engine_id === engineId,
								);
								const engineName =
									depObj?.engine_name || engineId;
								failedCalls.push(
									`${engineName} (${permission})`,
								);
							}
						}
						if (success) {
							notification.add({
								color: "success",
								message: "Permissions updated successfully.",
							});
							if (onChange) onChange();
							onClose(true);
						} else {
							notification.add({
								color: "error",
								message: `Error updating permissions for: ${failedCalls.join(
									", ",
								)}`,
							});
						}
					}}
				>
					Add
				</Button>
			</Modal.Actions>
		</Modal>
	);
};
