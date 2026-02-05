import LockIcon from "@mui/icons-material/Lock";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import type { AxiosResponse } from "axios";
import { useEffect, useState } from "react";
import {
	Alert,
	Box,
	Button,
	Grid,
	LoadingScreen,
	Modal,
	Paper,
	Stack,
	Switch,
	styled,
	Tooltip,
	Typography,
	useNotification,
} from "@semoss/ui";
import {
	setEngineGlobal,
	setEngineVisiblity,
	setProjectGlobal,
	setProjectVisiblity,
} from "@/api";
import databaseIcon from "@/assets/img/databaseIcon.png";
import { usePixel, useRootStore, useSettings } from "@/hooks";
import type { ALL_TYPES } from "@/types";
import { formatToDataTestId } from "@/utility";

const StyledAlert = styled(Alert, {
	shouldForwardProp: (prop) => prop !== "setBounds",
})<{ setBounds?: boolean }>(({ theme, setBounds }) => ({
	width: "100%",
	height: "100%",
	display: "flex",
	padding: "16px",
	alignItems: "flex-start",
	gap: "16px",
	flex: "1 0 0",
	alignSelf: "stretch",
	borderRadius: "12px",
	color: theme.palette.text.primary,
	background: theme.palette.background.paper,
	border: `1px solid ${theme.palette.secondary.main}`,
	".MuiAlert-action": {
		paddingRight: "8px",
	},
	...(setBounds && {
		height: theme.spacing(13),
		width: "600px",
	}),
}));

const StyledGrid = styled(Grid)(() => ({
	flex: "1",
}));

const StyledWidth = () => ({
	width: "100%",
});

const StyledBlock = styled(Box)({
	display: "flex",
	alignItems: "flex-start",
	gap: "8px",
});

const StyledIcon = styled("span")(({ theme }) => ({
	color: theme.palette.secondary.dark,
	width: "20px",
	height: "20px",
	"& svg": {
		fontSize: theme.typography.pxToRem(16),
		width: "20px",
		height: "20px",
	},
}));

interface SettingsTilesProps {
	/**
	 * Type of setting
	 */
	type: ALL_TYPES;

	/**
	 * Id of the setting
	 */
	id: string;

	/**
	 * Name of the setting
	 */
	name: string;

	/**
	 * Callback that is fired on delete
	 * @returns
	 */
	onDelete?: () => void;

	/**
	 * Condensed View
	 */
	condensed?: boolean;

	/**
	 * diection: stack tiles vertically or horizontally
	 */
	direction?: "column" | "row";
}

export const SettingsTiles = (props: SettingsTilesProps) => {
	const { id, type, name, condensed, onDelete, direction = "column" } = props;

	const { monolithStore, configStore } = useRootStore();
	const notification = useNotification();
	const { adminMode } = useSettings();

	const [deleteModal, setDeleteModal] = useState(false);
	const [discoverable, setDiscoverable] = useState(true);
	const [global, setGlobal] = useState(true);
	const [loading, setLoading] = useState(false);

	const engineInfo = usePixel(
		type === "DATABASE" ||
			type === "STORAGE" ||
			type === "MODEL" ||
			type === "VECTOR" ||
			type === "GUARDRAIL" ||
			type === "FUNCTION"
			? adminMode
				? `AdminEngineInfo(engine='${id}');`
				: `EngineInfo(engine='${id}');`
			: type === "PROJECT"
				? adminMode
					? `AdminProjectInfo(project='${id}')`
					: `ProjectInfo(project='${id}')`
				: "",
	);

	useEffect(() => {
		// pixel call to get pending members
		if (engineInfo.status !== "SUCCESS" || !engineInfo.data) {
			return;
		}

		if (
			type === "DATABASE" ||
			type === "STORAGE" ||
			type === "MODEL" ||
			type === "VECTOR" ||
			type === "GUARDRAIL" ||
			type === "FUNCTION"
		) {
			const data = engineInfo.data as {
				database_global: boolean;
				database_discoverable: boolean;
			};

			setDiscoverable(data.database_discoverable);
			setGlobal(data.database_global);
		} else if (type === "PROJECT") {
			const data = engineInfo.data as {
				project_global: boolean;
				project_discoverable: boolean;
			};

			setDiscoverable(data.project_discoverable);
			setGlobal(data.project_global);
		}
	}, [engineInfo.status, engineInfo.data]);

	/**
	 * Delete the item
	 */
	const deleteWorkflow = async () => {
		try {
			// start the loading screen
			setLoading(true);

			// run the pixel
			const response = await monolithStore.runQuery(
				type === "DATABASE" ||
					type === "STORAGE" ||
					type === "MODEL" ||
					type === "VECTOR" ||
					type === "GUARDRAIL" ||
					type === "FUNCTION"
					? `DeleteEngine(engine=['${id}']);`
					: type === "PROJECT"
						? `DeleteProject(project=['${id}']);`
						: "",
			);

			const operationType = response.pixelReturn[0].operationType;
			const output = response.pixelReturn[0].output;

			if (operationType.indexOf("ERROR") === -1) {
				notification.add({
					color: "success",
					message: `Successfully deleted ${name}`,
				});

				// go back to page before
				onDelete();
			} else {
				notification.add({
					color: "error",
					message: output,
				});
			}
		} catch (e) {
			notification.add({
				color: "error",
				message: String(e),
			});
		} finally {
			// stop the loading screen
			setLoading(false);
		}
	};

	/**
	 * @name changeDiscoverable
	 */
	const changeDiscoverable = async () => {
		try {
			// start the loading screen
			setLoading(true);

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
				type === "GUARDRAIL" ||
				type === "FUNCTION"
			) {
				response = await setEngineVisiblity(
					adminMode,
					id,
					!discoverable,
				);
			} else if (type === "PROJECT") {
				response = await setProjectVisiblity(
					adminMode,
					id,
					!discoverable,
				);
			}

			// ignore if there is no response
			if (!response) {
				return;
			}

			if (response.data.success || response.data) {
				setDiscoverable(!discoverable);
				notification.add({
					color: "success",
					message: `Successfully made ${name} ${
						discoverable ? "undiscoverable" : "discoverable"
					}`,
				});
			} else {
				notification.add({
					color: "error",
					message: `Error making ${name} ${
						discoverable ? "undiscoverable" : "discoverable"
					}`,
				});
			}
		} catch (e) {
			notification.add({
				color: "error",
				message: String(e),
			});
		} finally {
			// stop the loading screen
			setLoading(false);
		}
	};

	/**
	 * @name changeGlobal
	 */
	const changeGlobal = async () => {
		try {
			// start the loading screen
			setLoading(true);

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
				type === "GUARDRAIL" ||
				type === "FUNCTION"
			) {
				response = await setEngineGlobal(adminMode, id, !global);
			} else if (type === "PROJECT") {
				response = await setProjectGlobal(adminMode, id, !global);
			}

			// ignore if there is no response
			if (!response) {
				return;
			}

			if (response.data.success) {
				setGlobal(!global);

				notification.add({
					color: "success",
					message: `Successfully made ${name} ${
						global ? "non-global" : "global"
					}`,
				});
			} else {
				notification.add({
					color: "error",
					message: `Error making ${name} ${global ? "non-global" : "global"}`,
				});
			}
		} catch (e) {
			notification.add({
				color: "error",
				message: String(e),
			});
		} finally {
			// stop the loading screen
			setLoading(false);
		}
	};

	/** LOADING */
	if (loading) {
		return <LoadingScreen.Trigger description="Deleting..." />;
	}

	if (condensed) {
		return (
			<Paper sx={StyledWidth}>
				<Stack direction={direction}>
					<StyledAlert
						setBounds={direction === "column"}
						sx={StyledWidth}
						icon={false}
						action={
							<Switch
								title={
									global
										? `Make ${name} private`
										: `Make ${name} public`
								}
								checked={!global}
								disabled={
									!configStore.isEngineOperationAvailable(
										type,
										"public",
									)
								}
								data-testid={formatToDataTestId(
									`settingsTiles-make-${name}-public-private-switch`,
								)}
								onChange={() => {
									changeGlobal();
								}}
							></Switch>
						}
					>
						<Alert.Title>
							<StyledBlock>
								{/* Single Lock Icon on the left */}
								<StyledIcon data-testid="lock-icon">
									<LockIcon />
								</StyledIcon>

								{/* Text Stack on the right */}
								<Box>
									<Typography
										variant="body1"
										fontWeight="medium"
										data-testid="private-text"
									>
										Private
									</Typography>
									<Typography
										variant="body2"
										data-testid="private-description"
									>
										No one outside of the specified member
										group can access
									</Typography>
								</Box>
							</StyledBlock>
						</Alert.Title>
					</StyledAlert>
					{global ? (
						<Tooltip
							title={`An ${name} does not need to be discoverable and public.`}
							placement="top"
						>
							<StyledAlert
								setBounds={direction === "column"}
								sx={StyledWidth}
								icon={false}
								action={
									<Switch
										title={
											discoverable
												? `Make ${name} non-discoverable`
												: `Make ${name} discoverable`
										}
										disabled={
											global ||
											!configStore.isEngineOperationAvailable(
												type,
												"discoverable",
											)
										}
										data-testid={formatToDataTestId(
											`settingsTiles-${name}-makeDiscoverable-switch`,
										)}
										checked={!discoverable}
										onChange={() => {
											changeDiscoverable();
										}}
									></Switch>
								}
							>
								<Alert.Title>
									<StyledBlock>
										{/* Single Lock Icon on the left */}
										<StyledIcon>
											<VisibilityOffIcon data-testid="non-discoverable-icon" />
										</StyledIcon>
										{/* Text Stack on the right */}
										<Box data-testid="discoverable-text">
											<Typography
												variant="body1"
												fontWeight="medium"
											>
												Non Discoverable
											</Typography>
											<Typography variant="body2">
												{`Users cannot discover ${name}, view its details, or request access when it is non-discoverable.`}
											</Typography>
										</Box>
									</StyledBlock>
								</Alert.Title>
							</StyledAlert>
						</Tooltip>
					) : (
						<StyledAlert
							setBounds={direction === "column"}
							sx={StyledWidth}
							icon={false}
							data-testid={formatToDataTestId(
								`settingsTiles-${name}-makeDiscoverable-switch`,
							)}
							action={
								<Switch
									title={
										discoverable
											? `Make ${name} non-discoverable`
											: `Make ${name} discoverable`
									}
									data-testid={formatToDataTestId(
										`settingsTiles-${name}-makeDiscoverable-switch`,
									)}
									disabled={
										global ||
										!configStore.isEngineOperationAvailable(
											type,
											"discoverable",
										)
									}
									checked={!discoverable}
									onChange={() => {
										changeDiscoverable();
									}}
								></Switch>
							}
						>
							<Alert.Title>
								<StyledBlock>
									{/* Single Lock Icon on the left */}
									<StyledIcon>
										<VisibilityOffIcon data-testid="non-discoverable-icon" />
									</StyledIcon>

									{/* Text Stack on the right */}
									<Box data-testid="discoverable-text">
										<Typography
											variant="body1"
											fontWeight="medium"
										>
											Non Discoverable
										</Typography>
										<Typography variant="body2">
											{`Users cannot discover ${name}, view its details, or request access when it is non-discoverable.`}
										</Typography>
									</Box>
								</StyledBlock>
							</Alert.Title>
						</StyledAlert>
					)}
					<StyledAlert
						setBounds={direction === "column"}
						sx={StyledWidth}
						icon={false}
						action={
							<Button
								variant="contained"
								color="error"
								disabled={
									!configStore.isEngineOperationAvailable(
										type,
										"delete",
									)
								}
								data-testid={formatToDataTestId(
									`settingsTiles-${name}-delete-btn`,
								)}
								onClick={() => setDeleteModal(true)}
							>
								Delete
							</Button>
						}
					>
						<Alert.Title>
							<StyledBlock>
								{/* Single Lock Icon on the left */}
								<img
									src={databaseIcon}
									alt="Database Icon"
									style={{
										width: "22px",
										height: "22px",
										marginTop: "2px",
									}}
									data-testid="database-icon"
								/>

								{/* Text Stack on the right */}
								<Box data-testid="delete-vector-text">
									<Typography variant="body2">
										Users cannot request access to this
										database if private
										{`Delete ${type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}`}
									</Typography>
									<Typography variant="body2">
										{`Delete ${name} from catalog.`}
									</Typography>
								</Box>
							</StyledBlock>
						</Alert.Title>
					</StyledAlert>
					<Modal open={deleteModal}>
						<Modal.Title>Are you sure?</Modal.Title>
						<Modal.Content>
							This action is irreversable. This will permanentely
							delete this {name}.
						</Modal.Content>
						<Modal.Actions>
							<Button
								onClick={() => setDeleteModal(false)}
								data-testid={formatToDataTestId(
									`settingsTiles-${name}-confirmCancel-btn`,
								)}
							>
								Cancel
							</Button>
							<Button
								color={"error"}
								variant={"contained"}
								data-testid={formatToDataTestId(
									`settingsTiles-${name}-confirmDelete-btn`,
								)}
								onClick={() => deleteWorkflow()}
							>
								Delete
							</Button>
						</Modal.Actions>
					</Modal>
					{/* <StyledAlert
                        setBounds={direction === 'column'}
                        sx={{ width: '100%' }}
                        icon={false}
                        action={
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => setCloseEngineModal(true)}
                            >
                                Close
                            </Button>
                        }
                    >
                        <Alert.Title>
                            <Typography variant="body1">Close Engine</Typography>
                        </Alert.Title>
                        <Typography variant="body2">
                            {`Close ${name}'s engine.`}
                        </Typography>
                    </StyledAlert>
                    <Modal open={closeEngineModal}>
                        <Modal.Title>Are you sure?</Modal.Title>
                        <Modal.Content>
                            This action will close the engine for {name}.
                        </Modal.Content>
                        <Modal.Actions>
                            <Button onClick={() => setCloseEngineModal(false)}>
                                Cancel
                            </Button>
                            <Button
                                color={'primary'}
                                variant={'contained'}
                                onClick={() => closeEngine()}
                            >
                                Close
                            </Button>
                        </Modal.Actions>
                    </Modal> */}
				</Stack>
			</Paper>
		);
	} else {
		return (
			<StyledGrid container spacing={3}>
				<Grid item xs={direction === "row" ? 4 : 12}>
					<StyledAlert
						setBounds={direction === "column"}
						icon={false}
						action={
							<Switch
								title={
									global
										? `Make ${name} private`
										: `Make ${name} public`
								}
								checked={!global}
								disabled={
									!configStore.isEngineOperationAvailable(
										type,
										"public",
									)
								}
								data-testid={formatToDataTestId(
									`settingsTiles-make-${name}-public-private-switch`,
								)}
								onChange={() => {
									changeGlobal();
								}}
							></Switch>
						}
					>
						<Alert.Title>
							<StyledBlock>
								{/* Single Lock Icon on the left */}
								<StyledIcon>
									<LockIcon data-testid="lock-icon" />
								</StyledIcon>

								{/* Text Stack on the right */}
								<Box data-testid="private-text">
									<Typography
										variant="body1"
										fontWeight="medium"
									>
										Private
									</Typography>
									<Typography variant="body2">
										No one outside of the specified member
										group can access
									</Typography>
								</Box>
							</StyledBlock>
						</Alert.Title>
					</StyledAlert>
				</Grid>
				{global ? (
					<Tooltip
						title={`An ${name} does not need to be discoverable and public.`}
						placement="top"
					>
						<Grid item xs={direction === "row" ? 4 : 12}>
							<StyledAlert
								setBounds={direction === "column"}
								icon={false}
								action={
									<Switch
										disabled={
											global ||
											!configStore.isEngineOperationAvailable(
												type,
												"discoverable",
											)
										}
										title={
											discoverable
												? `Make ${name} non-discoverable`
												: `Make ${name} discoverable`
										}
										checked={!discoverable}
										data-testid={formatToDataTestId(
											`settingsTiles-${name}-makeDiscoverable-switch`,
										)}
										onChange={() => {
											changeDiscoverable();
										}}
									></Switch>
								}
							>
								<Alert.Title>
									<StyledBlock>
										{/* Single Lock Icon on the left */}
										<StyledIcon>
											<VisibilityOffIcon data-testid="non-discoverable-icon" />
										</StyledIcon>

										{/* Text Stack on the right */}
										<Box data-testid="discoverable-text">
											<Typography
												variant="body1"
												fontWeight="medium"
											>
												Non Discoverable
											</Typography>
											<Typography variant="body2">
												{`Users cannot discover ${name}, view its details, or request access when it is non-discoverable.`}
											</Typography>
										</Box>
									</StyledBlock>
								</Alert.Title>
							</StyledAlert>
						</Grid>
					</Tooltip>
				) : (
					<Grid item xs={direction === "row" ? 4 : 12}>
						<StyledAlert
							setBounds={direction === "column"}
							icon={false}
							action={
								<Switch
									disabled={
										global ||
										!configStore.isEngineOperationAvailable(
											type,
											"discoverable",
										)
									}
									title={
										discoverable
											? `Make ${name} non-discoverable`
											: `Make ${name} discoverable`
									}
									checked={!discoverable}
									data-testid={formatToDataTestId(
										`settingsTiles-${name}-makeDiscoverable-switch`,
									)}
									onChange={() => {
										changeDiscoverable();
									}}
								></Switch>
							}
						>
							<Alert.Title>
								<StyledBlock>
									{/* Single Lock Icon on the left */}
									<StyledIcon>
										<VisibilityOffIcon />
									</StyledIcon>

									{/* Text Stack on the right */}
									<Box>
										<Typography
											variant="body1"
											fontWeight="medium"
										>
											Non Discoverable
										</Typography>
										<Typography variant="body2">
											{`Users cannot discover ${name}, view its details, or request access when it is non-discoverable.`}
										</Typography>
									</Box>
								</StyledBlock>
							</Alert.Title>
						</StyledAlert>
					</Grid>
				)}
				{onDelete ? (
					<Grid item xs={direction === "row" ? 4 : 12}>
						<StyledAlert
							setBounds={direction === "column"}
							icon={false}
							action={
								<Button
									variant="contained"
									color="error"
									onClick={() => setDeleteModal(true)}
									data-testid={formatToDataTestId(
										`settingsTiles-${name}-delete-btn`,
									)}
									disabled={
										!configStore.isEngineOperationAvailable(
											type,
											"delete",
										)
									}
								>
									Delete
								</Button>
							}
						>
							<Alert.Title>
								<StyledBlock>
									{/* Single Lock Icon on the left */}
									<img
										src={databaseIcon}
										alt="Database Icon"
										style={{
											width: 18,
											height: 18,
											marginTop: "2px",
										}}
									/>

									{/* Text Stack on the right */}
									<Box>
										<Typography
											variant="body1"
											fontWeight="medium"
										>
											{`Delete ${type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}`}
										</Typography>
										<Typography variant="body2">
											{`Delete ${name} from catalog.`}
										</Typography>
									</Box>
								</StyledBlock>
							</Alert.Title>
						</StyledAlert>
						<Modal open={deleteModal}>
							<Modal.Title>Are you sure?</Modal.Title>
							<Modal.Content>
								This action is irreversable. This will
								permanentely delete this {name}.
							</Modal.Content>
							<Modal.Actions>
								<Button
									onClick={() => setDeleteModal(false)}
									data-testid={formatToDataTestId(
										`settingsTiles-${name}-confirmCancel-btn`,
									)}
								>
									Cancel
								</Button>
								<Button
									color={"error"}
									variant={"contained"}
									data-testid={formatToDataTestId(
										`settingsTiles-${name}-confirmDelete-btn`,
									)}
									onClick={() => deleteWorkflow()}
								>
									Delete
								</Button>
							</Modal.Actions>
						</Modal>
					</Grid>
				) : null}
				{/* <Grid item>
                    <StyledAlert
                        setBounds={direction === 'column'}
                        icon={false}
                        action={
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => setCloseEngineModal(true)}
                            >
                                Close
                            </Button>
                        }
                    >
                        <Alert.Title>
                            <Typography variant="body1">
                                Close Engine
                            </Typography>
                        </Alert.Title>
                        <Typography variant="body2">
                            {`Close ${name}'s engine.`}
                        </Typography>
                    </StyledAlert>
                    <Modal open={closeEngineModal}>
                        <Modal.Title>Are you sure?</Modal.Title>
                        <Modal.Content>
                            This action will close the engine for {name}.
                        </Modal.Content>
                        <Modal.Actions>
                            <Button onClick={() => setCloseEngineModal(false)}>
                                Cancel
                            </Button>
                            <Button
                                color={'primary'}
                                variant={'contained'}
                                onClick={() => closeEngine()}
                            >
                                Close
                            </Button>
                        </Modal.Actions>
                    </Modal>
                </Grid> */}
			</StyledGrid>
		);
	}
};
