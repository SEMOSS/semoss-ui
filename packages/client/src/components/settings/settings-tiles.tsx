import { EyeOff, LockKeyhole, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
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
import {
	setEngineGlobal,
	setEngineVisiblity,
	setProjectGlobal,
	setProjectVisiblity,
} from "@/api";
import { DeleteEntityDialog } from "@/components/shared/delete-entity-dialog";
import { usePixel, useRootStore, useSettings } from "@/hooks";
import type { ALL_TYPES, ApiResponse } from "@/types";
import { formatToDataTestId } from "@/utility";

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

const AlertTile = ({
	icon,
	title,
	description,
	action,
	setBounds,
	testId,
}: {
	icon: React.ReactNode;
	title: string;
	description: string;
	action: React.ReactNode;
	setBounds?: boolean;
	testId?: string;
}) => (
	<div
		className={`flex w-full flex-1 items-start gap-4 self-stretch rounded-xl border border--card-foreground p-4 bg-card${setBounds ? "h-[104px] max-w-[600px]" : "h-full"}
			`}
		data-testid={testId}
	>
		<div className="flex flex-1 items-start gap-2">
			<span className="h-5 w-5 text-secondary-foreground [&_svg]:h-5 [&_svg]:w-5">
				{icon}
			</span>
			<div>
				<P className="font-medium">{title}</P>
				<P className="text-muted-foreground text-sm">{description}</P>
			</div>
		</div>
		<div className="pr-2">{action}</div>
	</div>
);

export const SettingsTiles = (props: SettingsTilesProps) => {
	const { id, type, name, condensed, onDelete, direction = "column" } = props;

	const { monolithStore, configStore } = useRootStore();
	const { adminMode, engineInfo: contextEngineInfo } = useSettings();

	const [deleteModal, setDeleteModal] = useState(false);
	const [discoverable, setDiscoverable] = useState(true);
	const [global, setGlobal] = useState(true);
	const [loading, setLoading] = useState(false);

	const isEngineType =
		type === "DATABASE" ||
		type === "STORAGE" ||
		type === "MODEL" ||
		type === "VECTOR" ||
		type === "GUARDRAIL" ||
		type === "FUNCTION";
	// Reuse the parent settings layout's EngineInfo result when available to
	// avoid a duplicate pixel call.
	const shouldFetchLocally = !(isEngineType && contextEngineInfo);

	const localEngineInfo = usePixel(
		shouldFetchLocally
			? isEngineType
				? adminMode
					? `AdminEngineInfo(engine='${id}');`
					: `EngineInfo(engine='${id}');`
				: type === "PROJECT"
					? adminMode
						? `AdminProjectInfo(project='${id}')`
						: `ProjectInfo(project='${id}')`
					: ""
			: "",
	);

	const engineInfo = shouldFetchLocally ? localEngineInfo : contextEngineInfo;

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
			};

			setDiscoverable(data.project_discoverable);
			setGlobal(data.project_global);
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

	/**
	 * Delete the item
	 */
	const deleteWorkflow = async () => {
		try {
			// start the loading screen
			setLoading(true);

			// Determine the correct delete pixel based on type and project_type
			let deletePixel = "";
			let entityLabel = "";

			if (
				type === "DATABASE" ||
				type === "STORAGE" ||
				type === "MODEL" ||
				type === "VECTOR" ||
				type === "GUARDRAIL" ||
				type === "FUNCTION"
			) {
				deletePixel = `DeleteEngine(engine=['${id}']);`;
				entityLabel = "engine";
			} else if (type === "PROJECT") {
				const projectData = engineInfo.data as {
					project_type?: string;
				};
				const isWorkspace = projectData?.project_type === "WORKSPACE";
				const isSkill = projectData?.project_type === "SKILL";

				if (isWorkspace) {
					deletePixel = `DeleteWorkspace(workspaceId=['${id}']);`;
					entityLabel = "agent";
				} else if (isSkill) {
					deletePixel = `DeleteSkill(skillId=['${id}']);`;
					entityLabel = "skill";
				} else {
					deletePixel = `DeleteProject(project=['${id}']);`;
					entityLabel = "app";
				}
			}

			// run the pixel
			const response = await monolithStore.runQuery(deletePixel);

			const operationType = response.pixelReturn[0].operationType;
			const output = response.pixelReturn[0].output;

			if (operationType.indexOf("ERROR") === -1) {
				toast.success(`Successfully deleted ${entityLabel}`);

				// go back to page before
				onDelete();
			} else {
				toast.error(String(output));
			}
		} catch (e) {
			toast.error(String(e));
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

	/** LOADING */
	if (loading) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-4">
				<Spinner className="size-8" />
				<P className="text-muted-foreground">Deleting...</P>
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
						icon={<LockKeyhole data-testid="lock-icon" />}
						title="Private"
						description="No one outside of the specified member group can access"
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
								onCheckedChange={() => {
									changeGlobal();
								}}
							/>
						}
					/>
					{global ? (
						<Tooltip>
							<TooltipTrigger asChild>
								<div>
									<AlertTile
										setBounds={direction === "column"}
										icon={
											<EyeOff data-testid="non-discoverable-icon" />
										}
										title="Non Discoverable"
										description={`Users cannot discover ${name}, view its details, or request access when it is non-discoverable.`}
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
								<EyeOff data-testid="non-discoverable-icon" />
							}
							title="Non Discoverable"
							description={`Users cannot discover ${name}, view its details, or request access when it is non-discoverable.`}
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
										!configStore.isEngineOperationAvailable(
											type,
											"discoverable",
										)
									}
									checked={!discoverable}
									onCheckedChange={() => {
										changeDiscoverable();
									}}
								/>
							}
						/>
					)}
					<AlertTile
						setBounds={direction === "column"}
						icon={<Trash2 className="mt-0.5 h-[22px] w-[22px]" />}
						title={`Delete ${type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}`}
						description={`Delete ${name} from catalog.`}
						action={
							<Button
								variant="destructive"
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
			<div className="flex-1">
				<div
					className={`grid gap-6 ${
						direction === "row"
							? "grid-cols-1 md:grid-cols-3"
							: "grid-cols-1"
					}`}
				>
					<AlertTile
						setBounds={direction === "column"}
						icon={<LockKeyhole data-testid="lock-icon" />}
						title="Private"
						description="No one outside of the specified member group can access"
						testId="private-text"
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
								onCheckedChange={() => {
									changeGlobal();
								}}
							/>
						}
					/>
					{global ? (
						<Tooltip>
							<TooltipTrigger asChild>
								<div>
									<AlertTile
										setBounds={direction === "column"}
										icon={
											<EyeOff data-testid="non-discoverable-icon" />
										}
										title="Non Discoverable"
										description={`Users cannot discover ${name}, view its details, or request access when it is non-discoverable.`}
										testId="discoverable-text"
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
							icon={<EyeOff />}
							title="Non Discoverable"
							description={`Users cannot discover ${name}, view its details, or request access when it is non-discoverable.`}
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
									onCheckedChange={() => {
										changeDiscoverable();
									}}
								/>
							}
						/>
					)}
					{onDelete ? (
						<>
							<AlertTile
								setBounds={direction === "column"}
								icon={
									<Trash2 className="mt-0.5 h-[18px] w-[18px]" />
								}
								title={`Delete ${type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}`}
								description={`Delete ${name} from catalog.`}
								action={
									<Button
										variant="destructive"
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
