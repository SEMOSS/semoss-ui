import {
	Copy,
	Eye,
	EyeOff,
	LockKeyhole,
	LockKeyholeOpen,
	Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { usePixel, useSession } from "@semoss/sdk/react";
import {
	Button,
	Card,
	P,
	Spinner,
	Switch,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { capitalize, formatToDataTestId } from "@semoss/utility/text";
import { setEngineGlobal, setEngineVisiblity } from "@/api/engines";
import {
	setProjectCustomLogin,
	setProjectGlobal,
	setProjectTemplate,
	setProjectVisiblity,
} from "@/api/projects";
import { DeleteEntityDialog } from "@/components/shared/delete-entity-dialog";
import { useDeleteResource } from "@/features/resource-delete/use-delete-resource";
import { useSettings } from "@/hooks/useSettings";
import type { ALL_TYPES, ApiResponse } from "@/types/types";
import { AlertTile } from "./alert-tile";

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
	 * direction: stack tiles vertically or horizontally
	 */
	direction?: "column" | "row";
}

/**
 * The visibility and lifecycle settings of a project or engine as tiles:
 * Private or Public and Discoverable or Non-Discoverable, each titled by the
 * state it is in, Use as Template and Custom Login Page (projects), and delete.
 */
export const SettingsTiles = (props: SettingsTilesProps) => {
	const { id, type, name, condensed, onDelete, direction = "column" } = props;

	const canPerform = useSession((state) => state.canPerform);
	const { adminMode } = useSettings();

	const [deleteModal, setDeleteModal] = useState(false);
	const [discoverable, setDiscoverable] = useState(true);
	const [global, setGlobal] = useState(true);
	const [isTemplate, setIsTemplate] = useState(false);
	const [hasCustomLogin, setHasCustomLogin] = useState(false);
	const [loading, setLoading] = useState(false);

	const isEngineType =
		type === "DATABASE" ||
		type === "STORAGE" ||
		type === "MODEL" ||
		type === "VECTOR" ||
		type === "GUARDRAIL" ||
		type === "FUNCTION";
	const engineInfo = usePixel(
		isEngineType
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
				engine_global: boolean;
				engine_discoverable: boolean;
			};

			setDiscoverable(data.engine_discoverable);
			setGlobal(data.engine_global);
		} else if (type === "PROJECT") {
			const data = engineInfo.data as {
				project_global: boolean;
				project_discoverable: boolean;
				project_is_template: boolean;
				project_has_custom_login: boolean;
			};

			setDiscoverable(data.project_discoverable);
			setGlobal(data.project_global);
			setIsTemplate(data.project_is_template === true);
			setHasCustomLogin(data.project_has_custom_login === true);
		}
	}, [engineInfo.status, engineInfo.data, type]);

	const isProjectType = type === "PROJECT";
	const entityLabel = isProjectType ? "App" : "Engine";
	const engineInfoObject =
		engineInfo.data && typeof engineInfo.data === "object"
			? (engineInfo.data as Record<string, unknown>)
			: null;
	const deleteTargetNameCandidate = (
		isProjectType
			? [
					engineInfoObject?.app_display_name,
					engineInfoObject?.app_name,
					engineInfoObject?.project_name,
				]
			: [
					engineInfoObject?.engine_display_name,
					engineInfoObject?.engine_name,
				]
	).find((value) => typeof value === "string" && value.trim().length > 0) as
		| string
		| undefined;
	const deleteTargetName = deleteTargetNameCandidate || name;

	const { deleteResource, isDeleting } = useDeleteResource({
		type,
		id,
		projectType: isProjectType
			? (engineInfo.data as { project_type?: string } | undefined)
					?.project_type
			: undefined,
		admin: adminMode,
	});

	/**
	 * Delete the item, then leave its page
	 */
	const deleteWorkflow = async () => {
		if (await deleteResource()) {
			onDelete?.();
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
				| ApiResponse<{ success: boolean }>
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
				toast.success(
					`Successfully made ${name} ${
						discoverable ? "undiscoverable" : "discoverable"
					}`,
				);
			} else {
				toast.error(
					`Error making ${name} ${
						discoverable ? "undiscoverable" : "discoverable"
					}`,
				);
			}
		} catch (e) {
			toast.error(String(e));
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
				| ApiResponse<{ success: boolean }>
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

				toast.success(
					`Successfully made ${name} ${
						global ? "private" : "public"
					}`,
				);
			} else {
				toast.error(
					`Error making ${name} ${global ? "private" : "public"}`,
				);
			}
		} catch (e) {
			toast.error(String(e));
		} finally {
			// stop the loading screen
			setLoading(false);
		}
	};

	/**
	 * Toggle whether viewers may clone this project as a template.
	 */
	const changeTemplate = async () => {
		try {
			setLoading(true);
			const response = await setProjectTemplate(
				adminMode,
				id,
				!isTemplate,
			);
			if (response.data.success) {
				setIsTemplate(!isTemplate);
				toast.success(
					isTemplate
						? `Successfully removed ${name} as a template`
						: `Successfully enabled ${name} as a template`,
				);
			} else {
				toast.error(`Error updating template status for ${name}`);
			}
		} catch (e) {
			toast.error(String(e));
		} finally {
			setLoading(false);
		}
	};

	const AccessIcon = global ? LockKeyholeOpen : LockKeyhole;
	const accessTitle = global ? "Public" : "Private";
	const accessDescription = global
		? `Everyone on the platform can access ${name}, not only its members`
		: "No one outside of the specified member group can access";
	const DiscoveryIcon = discoverable ? Eye : EyeOff;
	const discoveryTitle = discoverable ? "Discoverable" : "Non-Discoverable";
	const discoveryDescription = discoverable
		? `Users can discover ${name}, view its details, and request access.`
		: `Users cannot discover ${name}, view its details, or request access when it is non-discoverable.`;

	const templateTile =
		type === "PROJECT" ? (
			<AlertTile
				setBounds={direction === "column"}
				icon={<Copy aria-hidden />}
				title="Use as Template"
				description="Allow users who can view this project to create their own independent copy. This does not make the project public."
				action={
					<Switch
						aria-label={`Use ${name} as a template`}
						title={
							isTemplate
								? `Stop using ${name} as a template`
								: `Use ${name} as a template`
						}
						checked={isTemplate}
						data-testid={formatToDataTestId(
							`settingsTiles-${name}-use-as-template-switch`,
						)}
						onCheckedChange={() => {
							changeTemplate();
						}}
					/>
				}
			/>
		) : null;

	/**
	 * Toggle whether this project's portal has its own login page, which serves
	 * the portal to signed out visitors for them to sign in there.
	 */
	const changeCustomLogin = async () => {
		try {
			setLoading(true);
			const response = await setProjectCustomLogin(
				adminMode,
				id,
				!hasCustomLogin,
			);
			if (response.data.success) {
				setHasCustomLogin(!hasCustomLogin);
				toast.success(
					hasCustomLogin
						? `${name} is now shown only to signed in users who can view it`
						: `${name} now shows its own login page to signed out visitors`,
				);
			} else {
				toast.error(
					`Error updating the login page setting for ${name}`,
				);
			}
		} catch (e) {
			toast.error(String(e));
		} finally {
			setLoading(false);
		}
	};

	const customLoginTile =
		type === "PROJECT" ? (
			<AlertTile
				setBounds={direction === "column"}
				icon={
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth={2}
						strokeLinecap="round"
						strokeLinejoin="round"
						aria-hidden="true"
					>
						<path d="M5.2 7.5a9 9 0 1 1 0 9" />
						<path d="M1 12h9" />
						<path d="m7 9 3 3-3 3" />
						<circle cx="15" cy="8.5" r="2.5" />
						<path d="M12 16.5a2.5 2.5 0 0 1 2.5-2.5h1a2.5 2.5 0 0 1 2.5 2.5" />
					</svg>
				}
				title="Custom Login Page"
				description="This app's portal has its own login page, so people who are signed out can open it and sign in there. When off, only signed in users who can view this app can open its portal."
				action={
					<Switch
						aria-label={`${name} has a custom login page`}
						title={
							hasCustomLogin
								? `Turn off the custom login page for ${name}`
								: `Turn on the custom login page for ${name}`
						}
						checked={hasCustomLogin}
						data-testid={formatToDataTestId(
							`settingsTiles-${name}-custom-login-switch`,
						)}
						onCheckedChange={() => {
							changeCustomLogin();
						}}
					/>
				}
			/>
		) : null;

	/** LOADING */
	if (loading || isDeleting) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-4">
				<Spinner className="size-8" />
				<P className="text-muted-foreground">
					{isDeleting ? "Deleting..." : "Saving..."}
				</P>
			</div>
		);
	}

	if (condensed) {
		return (
			<Card className="w-full">
				<div
					className={`flex ${direction === "column" ? "flex-col" : "flex-row"} gap-0`}
				>
					<AlertTile
						setBounds={direction === "column"}
						icon={<AccessIcon data-testid="lock-icon" />}
						title={accessTitle}
						description={accessDescription}
						action={
							<Switch
								title={
									global
										? `Make ${name} private`
										: `Make ${name} public`
								}
								aria-label={`${name} is private`}
								checked={!global}
								disabled={!canPerform(type, "public")}
								data-testid={formatToDataTestId(
									`settingsTiles-make-${name}-public-private-switch`,
								)}
								onCheckedChange={() => {
									changeGlobal();
								}}
							/>
						}
					/>
					{global ? (
						<Tooltip disableHoverableContent={false}>
							<TooltipTrigger asChild>
								<div>
									<AlertTile
										setBounds={direction === "column"}
										icon={
											<DiscoveryIcon data-testid="non-discoverable-icon" />
										}
										title={discoveryTitle}
										description={discoveryDescription}
										action={
											<Switch
												title={
													discoverable
														? `Make ${name} non-discoverable`
														: `Make ${name} discoverable`
												}
												disabled={
													global ||
													!canPerform(
														type,
														"discoverable",
													)
												}
												data-testid={formatToDataTestId(
													`settingsTiles-${name}-makeDiscoverable-switch`,
												)}
												aria-label={`${name} is non-discoverable`}
												checked={!discoverable}
												onCheckedChange={() => {
													changeDiscoverable();
												}}
											/>
										}
									/>
								</div>
							</TooltipTrigger>
							<TooltipContent>
								An {name} does not need to be discoverable and
								public.
							</TooltipContent>
						</Tooltip>
					) : (
						<AlertTile
							setBounds={direction === "column"}
							icon={
								<DiscoveryIcon data-testid="non-discoverable-icon" />
							}
							title={discoveryTitle}
							description={discoveryDescription}
							testId={formatToDataTestId(
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
										!canPerform(type, "discoverable")
									}
									aria-label={`${name} is non-discoverable`}
									checked={!discoverable}
									onCheckedChange={() => {
										changeDiscoverable();
									}}
								/>
							}
						/>
					)}
					{templateTile}
					{customLoginTile}
					<AlertTile
						setBounds={direction === "column"}
						icon={<Trash2 className="mt-0.5 h-[22px] w-[22px]" />}
						title={`Delete ${capitalize(type)}`}
						description={`Delete ${name} from catalog.`}
						action={
							<Button
								variant="destructive"
								disabled={!canPerform(type, "delete")}
								data-testid={formatToDataTestId(
									`settingsTiles-${name}-delete-btn`,
								)}
								onClick={() => setDeleteModal(true)}
							>
								Delete
							</Button>
						}
					/>
					<DeleteEntityDialog
						open={deleteModal}
						onOpenChange={setDeleteModal}
						entityLabel={entityLabel}
						entityName={deleteTargetName}
						entityId={id}
						onConfirm={deleteWorkflow}
						cancelButtonTestId={formatToDataTestId(
							`settingsTiles-${name}-confirmCancel-btn`,
						)}
						confirmButtonTestId={formatToDataTestId(
							`settingsTiles-${name}-confirmDelete-btn`,
						)}
					/>
				</div>
			</Card>
		);
	} else {
		return (
			<div className="@container flex-1">
				<div
					className={`grid gap-6 ${
						direction === "row"
							? "@6xl:grid-cols-4 @xl:grid-cols-2 grid-cols-1"
							: "grid-cols-1"
					}`}
				>
					<AlertTile
						setBounds={direction === "column"}
						icon={<AccessIcon data-testid="lock-icon" />}
						title={accessTitle}
						description={accessDescription}
						testId="private-text"
						action={
							<Switch
								title={
									global
										? `Make ${name} private`
										: `Make ${name} public`
								}
								aria-label={`${name} is private`}
								checked={!global}
								disabled={!canPerform(type, "public")}
								data-testid={formatToDataTestId(
									`settingsTiles-make-${name}-public-private-switch`,
								)}
								onCheckedChange={() => {
									changeGlobal();
								}}
							/>
						}
					/>
					{global ? (
						<Tooltip disableHoverableContent={false}>
							<TooltipTrigger asChild>
								<div>
									<AlertTile
										setBounds={direction === "column"}
										icon={
											<DiscoveryIcon data-testid="non-discoverable-icon" />
										}
										title={discoveryTitle}
										description={discoveryDescription}
										testId="discoverable-text"
										action={
											<Switch
												disabled={
													global ||
													!canPerform(
														type,
														"discoverable",
													)
												}
												title={
													discoverable
														? `Make ${name} non-discoverable`
														: `Make ${name} discoverable`
												}
												aria-label={`${name} is non-discoverable`}
												checked={!discoverable}
												data-testid={formatToDataTestId(
													`settingsTiles-${name}-makeDiscoverable-switch`,
												)}
												onCheckedChange={() => {
													changeDiscoverable();
												}}
											/>
										}
									/>
								</div>
							</TooltipTrigger>
							<TooltipContent>
								An {name} does not need to be discoverable and
								public.
							</TooltipContent>
						</Tooltip>
					) : (
						<AlertTile
							setBounds={direction === "column"}
							icon={<DiscoveryIcon />}
							title={discoveryTitle}
							description={discoveryDescription}
							action={
								<Switch
									disabled={
										global ||
										!canPerform(type, "discoverable")
									}
									title={
										discoverable
											? `Make ${name} non-discoverable`
											: `Make ${name} discoverable`
									}
									aria-label={`${name} is non-discoverable`}
									checked={!discoverable}
									data-testid={formatToDataTestId(
										`settingsTiles-${name}-makeDiscoverable-switch`,
									)}
									onCheckedChange={() => {
										changeDiscoverable();
									}}
								/>
							}
						/>
					)}
					{templateTile}
					{customLoginTile}
					{onDelete ? (
						<>
							<AlertTile
								setBounds={direction === "column"}
								icon={
									<Trash2 className="mt-0.5 h-[18px] w-[18px]" />
								}
								title={`Delete ${capitalize(type)}`}
								description={`Delete ${name} from catalog.`}
								action={
									<Button
										variant="destructive"
										onClick={() => setDeleteModal(true)}
										data-testid={formatToDataTestId(
											`settingsTiles-${name}-delete-btn`,
										)}
										disabled={!canPerform(type, "delete")}
									>
										Delete
									</Button>
								}
							/>
							<DeleteEntityDialog
								open={deleteModal}
								onOpenChange={setDeleteModal}
								entityLabel={entityLabel}
								entityName={deleteTargetName}
								entityId={id}
								onConfirm={deleteWorkflow}
								cancelButtonTestId={formatToDataTestId(
									`settingsTiles-${name}-confirmCancel-btn`,
								)}
								confirmButtonTestId={formatToDataTestId(
									`settingsTiles-${name}-confirmDelete-btn`,
								)}
							/>
						</>
					) : null}
				</div>
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
			</div>
		);
	}
};
