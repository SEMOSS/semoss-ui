import { Edit, HdrAuto, Visibility } from "@mui/icons-material";
import BlockIcon from "@mui/icons-material/Block";
import PersonIcon from "@mui/icons-material/Person";
import { useMemo, useState } from "react";
import { type Control, Controller } from "react-hook-form";
import {
	Box,
	Button,
	Chip,
	Link,
	Modal,
	RadioGroup,
	Stack,
	styled,
	Tab,
	Tabs,
	TextField,
	Typography,
	useNotification,
} from "@semoss/ui";
import OPEN_AI from "@/assets/img/OPEN_AI.png";
import type { modelledDependency } from "@/components/app";
import { PERMISSION_DESCRIPTION_MAP } from "@/constants";
import { useRootStore } from "@/hooks";
import type { AppDetailsFormTypes } from "./app-details.utility";

const StyledContentBox = styled(Stack)(({ theme }) => ({
	backgroundColor: theme.palette.background.default,
	padding: theme.spacing(1),
	borderRadius: "4px",
}));

const StyledContentCard = styled(Stack)(({ theme }) => ({
	backgroundColor: theme.palette.background.paper,
	padding: theme.spacing(2),
	borderRadius: "4px",
}));

const StyledRoleInfo = styled("div")({
	width: "100%",
});

const StyledHdrAutoIcon = styled(HdrAuto)(({ theme }) => ({
	color: theme.palette.text.secondary,
}));

const StyledEditIcon = styled(Edit)(({ theme }) => ({
	color: theme.palette.text.secondary,
}));

const StyledVisibilityIcon = styled(Visibility)(({ theme }) => ({
	color: theme.palette.text.secondary,
}));

const ModalSectionHeading = styled(Typography)({
	fontWeight: 500,
	margin: "1rem 0 0.5rem 0",
});

const StyledDivider = styled(Box)(({ theme }) => ({
	borderBottom: `1px solid ${theme.palette.secondary.main}`,
	marginLeft: "40px",
	marginRight: "40px",
}));

const ModelSubHeading = styled(Typography)({
	fontSize: "14px",
	paddingBottom: "8px",
});

const StyledButtonBox = styled(Box)(({ theme }) => ({
	display: "flex",
	justifyContent: "flex-end",
	paddingBottom: theme.spacing(2), // pb: 2
}));

const StyledButton = styled(Button)(({ theme }) => ({
	borderRadius: "12px",
	paddingLeft: theme.spacing(2),
	paddingRight: theme.spacing(2),
	paddingTop: theme.spacing(0.5),
	paddingBottom: theme.spacing(0.5),
}));

const CardContentOuterBox = styled(Box)(({ theme }) => ({
	maxHeight: "400px",
	overflow: "auto",
	backgroundColor: theme.palette.background.default,
	padding: theme.spacing(1),
}));

const CardSubContentOuterBox = styled(Box)(({ theme }) => ({
	display: "flex",
	justifyContent: "space-between",
	alignItems: "flex-start",
	padding: theme.spacing(2),
	borderRadius: "12px",
	backgroundColor: theme.palette.background.paper,
	width: "100%",
}));

const CardContentInnerBox = styled(Box)({
	flex: 1,
});

const Container = styled(Box)(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	gap: theme.spacing(1),
	marginBottom: theme.spacing(1),
}));

const EngineImage = styled("img")({
	width: 48,
	height: 48,
});

const Title = styled(Typography)(({ theme }) => ({
	color: theme.palette.primary.main,
	fontWeight: 400,
	fontSize: 16,
}));

const PermissionWrapper = styled(Box)({
	display: "flex",
	alignItems: "center",
});

const StyledBlockIcon = styled(BlockIcon)(({ theme }) => ({
	color: theme.palette.secondary.main,
	width: "0.75em",
	height: "0.75em",
}));

const StyledEditorIcon = styled(Edit)(({ theme }) => ({
	color: theme.palette.secondary.main,
	width: "0.75em",
	height: "0.75em",
}));

const StyledReadonlyIcon = styled(Visibility)(({ theme }) => ({
	color: theme.palette.secondary.main,
	width: "0.75em",
	height: "0.75em",
}));

const StyledOwnerIcon = styled(PersonIcon)(({ theme }) => ({
	color: theme.palette.secondary.main,
	width: "0.75em",
	height: "0.75em",
}));

const PermissionText = styled(Typography)(({ theme }) => ({
	fontSize: 12,
	marginLeft: 1,
	color: theme.palette.text.secondary,
}));

const ActionsWrapper = styled(Stack)({
	justifyContent: "space-between",
	width: "100%",
});

const PublicChip = styled(Chip)({
	height: 32,
});

const CardDescription = styled(Typography)(({ theme }) => ({
	color: theme.palette.text.secondary,
}));

const TabPanel = (props: {
	children?: React.ReactNode;
	value: number;
	index: number;
}) => {
	const { children, value, index, ...other } = props;
	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`tab-panel-${index}`}
			aria-labelledby={`tab-${index}`}
			{...other}
		>
			{value === index && <Box sx={{ p: 2 }}>{children}</Box>}
		</div>
	);
};

const ActionButton = ({ label, onClick }) => (
	<Button
		variant="outlined"
		size="small"
		sx={{ borderRadius: 10, px: 2, py: 0.5, fontSize: "13px" }}
		onClick={onClick}
	>
		{label}
	</Button>
);

const PendingButton = () => (
	<Button
		variant="outlined"
		size="small"
		sx={{ borderRadius: 10, px: 2, py: 0.5 }}
		disabled
	>
		Pending Access
	</Button>
);

interface ChangeAccessModalProps {
	open: boolean;
	onClose: (refresh?: boolean) => void;
	control: Control<AppDetailsFormTypes>;
	getValues;
	dependencies: modelledDependency[];
	onSuccess: () => void;
	permission: string;
}

export const ChangeAccessModal = (props: ChangeAccessModalProps) => {
	const {
		open,
		onClose,
		control,
		getValues,
		dependencies,
		onSuccess,
		permission,
	} = props;
	const permissionDescriptions = PERMISSION_DESCRIPTION_MAP.PROJECT;
	const { monolithStore } = useRootStore();
	const notification = useNotification();
	const [tabValue, setTabValue] = useState(0);
	const [requestedDeps, setRequestedDeps] = useState<Set<string>>(new Set());

	const toCapitalized = (word: string): string => {
		if (!word) return "";
		return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
	};

	const handleTabChange = (
		_event: React.SyntheticEvent,
		newValue: number,
	) => {
		setTabValue(newValue);
	};

	const requestAccessForDependency = async (
		depId: string,
		requestedRole: string,
		comment?: string,
	) => {
		try {
			const res = await monolithStore.runQuery(
				`META | RequestEngine(engine=['${depId}'], permission=['${requestedRole}']${
					comment ? `, comment=['${comment}']` : ""
				})`,
			);
			const { operationType, output } = res.pixelReturn[0];
			if (operationType.indexOf("ERROR") > -1) {
				return { depId, success: false, message: output };
			} else {
				return { depId, success: true, message: output };
			}
		} catch (error) {
			return { depId, success: false, message: error.message };
		}
	};

	const handleChangeAccess = async () => {
		const current = getValues("permission");
		const requested = getValues("requestedPermission");
		const comment = getValues("roleChangeComment");
		const id = getValues("appId");

		if (requested === current || requested === "") {
			notification.add({
				color: "error",
				message:
					"No change in Access has been requested. Please select another and try again.",
			});
			return;
			//  } else if (!comment) {
			// notification.add({
			//     color: 'error',
			//     message: 'A comment is required to request access.',
			// });
			// return;
		}

		try {
			const res = await monolithStore.runQuery(
				`RequestProject(project=['${id}'], permission=['${requested}'], comment=['${comment}'])`,
			);

			const { operationType, output } = res.pixelReturn[0];

			if (operationType.indexOf("ERROR") > -1) {
				notification.add({
					color: "error",
					message: output,
				});

				return;
			}

			notification.add({
				color: "success",
				message: output,
			});

			onSuccess();
			onClose(true); // Close modal after successful RequestProject call
		} catch (_e) {
			notification.add({
				color: "error",
				message: "Request failed.",
			});
		}
	};

	const [isRequestAllLoading, setIsRequestAllLoading] = useState(false);

	const isAllRequested = useMemo(() => {
		return dependencies.every((dep) => requestedDeps.has(dep.id));
	}, [dependencies, requestedDeps]);

	const handleRequestAllAccess = async () => {
		setIsRequestAllLoading(true);
		try {
			const requestedRole = getValues("requestedPermission");
			const comment = getValues("roleChangeComment");

			if (!requestedRole || requestedRole === "") {
				notification.add({
					color: "error",
					message:
						"Please select a permission role on the first tab before requesting access.",
				});
				setTabValue(0);
				return;
			}

			const dependenciesToRequest = dependencies.filter(
				(dep) =>
					dep.userPermission !== requestedRole &&
					!requestedDeps.has(dep.id),
			);

			if (dependenciesToRequest.length === 0) {
				notification.add({
					color: "info",
					message: "No new dependencies require access request.",
				});
				return;
			}

			const promises = dependenciesToRequest.map((dep) =>
				requestAccessForDependency(dep.id, requestedRole, comment),
			);

			const results = await Promise.allSettled(promises);
			results.forEach((result) => {
				if (result.status === "fulfilled") {
					const { depId, success, message } = result.value;
					if (success) {
						setRequestedDeps((prev) => new Set(prev).add(depId));
						notification.add({
							color: "success",
							message: `Dependency ${depId}: ${message}`,
						});
					} else {
						notification.add({
							color: "error",
							message: `Dependency ${depId}: ${message}`,
						});
					}
				} else {
					notification.add({
						color: "error",
						message: "Request failed for a dependency.",
					});
				}
			});
		} finally {
			setIsRequestAllLoading(false);
		}
	};

	// Handle single dependency request button click
	const handleSingleDependencyRequest = async (depId: string) => {
		const requestedRole = getValues("requestedPermission");
		const comment = getValues("roleChangeComment");

		if (!requestedRole || requestedRole === "") {
			notification.add({
				color: "error",
				message:
					"Please select a permission role on the first tab before requesting access.",
			});
			setTabValue(0);
			return;
		}

		const { success, message } = await requestAccessForDependency(
			depId,
			requestedRole,
			comment,
		);

		if (success) {
			setRequestedDeps((prev) => new Set(prev).add(depId));
			notification.add({
				color: "success",
				message: `Dependency ${depId}: ${message}`,
			});
			// onSuccess();
		} else {
			notification.add({
				color: "error",
				message: `Dependency ${depId}: ${message}`,
			});
		}
	};

	return (
		<Box>
			<Modal open={open} maxWidth={"md"} onClose={onClose} scroll="body">
				<Modal.Title>
					{getValues("requestedPermission") === "discoverable" ? (
						<Typography variant={"button"}>
							Request Access
						</Typography>
					) : (
						<Typography variant={"button"}>
							Change Access
						</Typography>
					)}
				</Modal.Title>
				{permission !== "discoverable" ? (
					<StyledDivider>
						<Tabs
							value={tabValue}
							onChange={handleTabChange}
							aria-label="Access Tabs"
						>
							<Tab
								label="App Permissions"
								aria-controls="tab-panel-0"
							/>
							<Tab
								label="Dependency Permissions"
								aria-controls="tab-panel-1"
							/>
						</Tabs>
					</StyledDivider>
				) : null}
				<TabPanel value={tabValue} index={0}>
					<Modal.Content>
						<Controller
							name="requestedPermission"
							control={control}
							render={({ field }) => {
								return (
									<StyledContentBox
										direction="column"
										gap={1}
									>
										<StyledContentCard
											direction="row"
											gap={1}
										>
											<StyledHdrAutoIcon />
											<StyledRoleInfo>
												<Typography variant="subtitle1">
													Author
												</Typography>
												<span>
													{
														permissionDescriptions.author
													}
												</span>
											</StyledRoleInfo>
											<RadioGroup
												label=""
												value={field.value}
												onChange={(val) =>
													field.onChange(val)
												}
											>
												<RadioGroup.Item
													value="OWNER"
													label=""
												/>
											</RadioGroup>
										</StyledContentCard>

										<StyledContentCard
											direction="row"
											gap={1}
										>
											<StyledEditIcon />
											<StyledRoleInfo>
												<Typography variant="subtitle1">
													Editor
												</Typography>
												<span>
													{
														permissionDescriptions.editor
													}
												</span>
											</StyledRoleInfo>
											<RadioGroup
												label=""
												value={field.value}
												onChange={(val) =>
													field.onChange(val)
												}
											>
												<RadioGroup.Item
													value="EDIT"
													label=""
												/>
											</RadioGroup>
										</StyledContentCard>

										<StyledContentCard
											direction="row"
											gap={1}
										>
											<StyledVisibilityIcon />
											<StyledRoleInfo>
												<Typography variant="subtitle1">
													Read-Only
												</Typography>
												<span>
													{
														permissionDescriptions.readonly
													}
												</span>
											</StyledRoleInfo>
											<RadioGroup
												label=""
												value={field.value}
												onChange={(val) =>
													field.onChange(val)
												}
											>
												<RadioGroup.Item
													value="READ_ONLY"
													label=""
												/>
											</RadioGroup>
										</StyledContentCard>
									</StyledContentBox>
								);
							}}
						/>
						<ModalSectionHeading variant="subtitle1">
							Reason For Access
						</ModalSectionHeading>
						<StyledContentBox>
							<Controller
								name="roleChangeComment"
								control={control}
								render={({ field }) => {
									return (
										<StyledContentCard>
											<TextField
												multiline
												fullWidth
												placeholder="Optional"
												rows={2}
												value={field.value}
												onChange={field.onChange}
											/>
										</StyledContentCard>
									);
								}}
							/>
						</StyledContentBox>
					</Modal.Content>
					<Modal.Actions>
						<Button
							color="primary"
							variant="text"
							onClick={() => onClose(false)}
						>
							Cancel
						</Button>
						{permission !== "discoverable" ? (
							<Button
								color="primary"
								variant="contained"
								onClick={() => setTabValue(1)}
							>
								Next
							</Button>
						) : (
							<Button
								color="primary"
								variant="contained"
								onClick={handleChangeAccess}
							>
								Submit
							</Button>
						)}
					</Modal.Actions>
				</TabPanel>
				<TabPanel value={tabValue} index={1}>
					<Modal.Content>
						<ModelSubHeading variant={"body2"}>
							The app will not work for you without having at
							least read-only access to the following
							dependencies. Click request access to be provisioned
							as a read-only user.
						</ModelSubHeading>
						<StyledButtonBox>
							<StyledButton
								variant="outlined"
								size="small"
								onClick={handleRequestAllAccess}
								disabled={
									isAllRequested ||
									isRequestAllLoading ||
									dependencies.some(
										(dep) => dep.access_permission,
									)
								}
							>
								{isRequestAllLoading
									? "Requesting..."
									: "Request All Access"}
							</StyledButton>
						</StyledButtonBox>
						<CardContentOuterBox>
							<Stack spacing={2}>
								{dependencies.map((dep) => (
									<CardSubContentOuterBox key={dep.id}>
										{/* Left side: Icon, Name, Tags, Description */}
										<CardContentInnerBox>
											<Container>
												<EngineImage
													src={OPEN_AI}
													alt={dep.name}
												/>
												<Box>
													<Title variant="subtitle1">
														<Link
															href={`./#/engine/${dep.type}/${dep.id}`}
														>
															<Typography variant="body2">
																{dep.name}
															</Typography>
														</Link>
													</Title>
													<PermissionWrapper>
														{dep.userPermission ===
														"OWNER" ? (
															<StyledOwnerIcon fontSize="small" />
														) : dep.userPermission ===
															"READ_ONLY" ? (
															<StyledReadonlyIcon fontSize="small" />
														) : dep.userPermission ===
															"EDIT" ? (
															<StyledEditorIcon fontSize="small" />
														) : (
															<StyledBlockIcon fontSize="small" />
														)}

														<PermissionText variant="subtitle1">
															{toCapitalized(
																dep.userPermission ||
																	"NONE",
															)}
														</PermissionText>
													</PermissionWrapper>
												</Box>
												<ActionsWrapper
													direction="row"
													spacing={1}
												>
													<Stack
														direction="row"
														spacing={1}
													>
														{dep.isPublic ? (
															<PublicChip label="Public" />
														) : dep.isDiscoverable ? (
															<PublicChip label="Discoverable" />
														) : (
															<>
																<PublicChip label="Non-Discoverable" />
																<PublicChip label="Private" />
															</>
														)}
														<PublicChip
															label={toCapitalized(
																dep.type,
															)}
														/>
													</Stack>

													<Box>
														{dep.access_permission ? (
															<PendingButton />
														) : requestedDeps.has(
																dep.id,
															) ? (
															<PendingButton />
														) : !dep.userPermission ? (
															<ActionButton
																label="Request Access"
																onClick={() =>
																	handleSingleDependencyRequest(
																		dep.id,
																	)
																}
															/>
														) : (
															<ActionButton
																label="Change Access"
																onClick={() =>
																	handleSingleDependencyRequest(
																		dep.id,
																	)
																}
															/>
														)}
													</Box>
												</ActionsWrapper>
											</Container>

											<CardDescription variant="body2">
												{dep.description &&
												dep.description.trim() !== ""
													? dep.description
													: "No Description Available"}
											</CardDescription>
										</CardContentInnerBox>

										{/* Right side: Button */}
									</CardSubContentOuterBox>
								))}
							</Stack>
						</CardContentOuterBox>
					</Modal.Content>
					<Modal.Actions>
						<Button
							color="primary"
							variant="text"
							onClick={() => {
								onClose(false);
								setTabValue(0);
							}}
						>
							Cancel
						</Button>
						<Button
							color="primary"
							variant="contained"
							onClick={handleChangeAccess}
						>
							Submit
						</Button>
					</Modal.Actions>
				</TabPanel>
			</Modal>
		</Box>
	);
};
